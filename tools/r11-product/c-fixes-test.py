"""C focused engineering regression using D's actual UI route and RC73 ledger."""
import argparse, csv, functools, io, json, re, sys, threading, zipfile
from fractions import Fraction
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from playwright.sync_api import sync_playwright
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
from g1_reading_packets import config, unpack

p=argparse.ArgumentParser()
p.add_argument("--base",type=Path,required=True)
p.add_argument("--candidate",type=Path,required=True)
p.add_argument("--out",type=Path,required=True)
p.add_argument("--browser",default="chromium")
a=p.parse_args()
root=a.base
class Handler(SimpleHTTPRequestHandler):
    def __init__(self,*args,**kwargs): super().__init__(*args,directory=str(root),**kwargs)
    def log_message(self,*args): pass
    def end_headers(self):
        self.send_header("Cache-Control","no-store"); super().end_headers()
server=ThreadingHTTPServer(("127.0.0.1",0),Handler)
threading.Thread(target=server.serve_forever,daemon=True).start()
URL=f"http://127.0.0.1:{server.server_port}/index.html#math"
legacy=config((a.base/"qa/index.html").read_text())
control=legacy["math"]["scripts"][-1]
assert control["id"]=="f12930312b8e007ab222216e6f478d87b24a0856ed7b0e191a98326ce32bec85"
qa=unpack(control,lambda n:(a.base/n).read_bytes()).decode()
with zipfile.ZipFile(a.base/"muse/rc73/rc73-muse-acceptance-kit.zip") as z:
    cases=[r for r in csv.DictReader(io.StringIO(z.read("ledgers/instance-environments.csv").decode("utf-8-sig"))) if r["environment"]=="native_chrome" and r["caseId"] in {f"M72-I{i:04d}" for i in range(166,171)}]
assert len(cases)==5 and all(r["familyId"]=="natural-weighted" and int(r["generatorRevision"])==5 for r in cases)
requests=[{"familyId":r["familyId"],"configuration":r["configurationId"],"seed":int(r["seed"]),"generatorRevision":int(r["generatorRevision"])} for r in cases]
def ready(page):
    page.wait_for_function("Boolean(window.__AMC8_MATH_NAV) && typeof progressStore!=='undefined' && progressStore.getStatus()==='ready'",timeout=60000)
def open_page(ctx):
    page=ctx.new_page();page.set_default_timeout(12000)
    page.goto(URL,wait_until="domcontentloaded");ready(page);return page
SCAN=r"""()=>{
 const records=[];
 const walk=(o,path)=>{
  if(!o||typeof o!=='object')return;
  if(o.answerContract?.kind==='choice'&&Array.isArray(o.options)){
   records.push({path,prompt:o.prompt,options:o.options.map(x=>({id:x.id,text:x.text,outcome:JudgmentEvidence.task(o,String(x.id)).outcome}))});
  }
  for(const [k,v] of Object.entries(o))if(v&&typeof v==='object')walk(v,path.concat(k));
 };
 walk(window.__AMC8_EXAM_MAPPING,[]);return records;
}"""
ACTIVE=r"""()=>{const x=ExamMappingUI.exportDraft().record?.sessions?.active;return x?{id:x.id,attemptId:x.attemptId,ordinal:x.submissionOrdinal,help:x.helpLevel,input:x.input,outcome:x.feedback?.outcome??null}:null}"""
EVENTS=r"""()=>{let result=[];const seen=new Set();function walk(o){if(!o||typeof o!=='object'||seen.has(o))return;seen.add(o);if(o.type==='response_submitted')result.push(o);for(const v of Object.values(o))walk(v)}walk(ExamMappingUI.exportDraft().record);return result}"""
def decision(page):
    page.on("dialog",lambda d:d.accept() if "家长" in d.message and ("确认" in d.message or "调整" in d.message) else d.dismiss())
    page.locator("[data-action=topicParentUnlock]:visible").first.click()
    for topic in ["A01","A02","N01","N02"]:
        button=page.locator(f'[data-action=topicSelect][data-code="{topic}"]:visible')
        if button.get_attribute("aria-pressed")!="true":
            button.click()
            page.wait_for_function("""id=>document.querySelector('[data-action=topicSelect][data-code="'+id+'"]')?.getAttribute('aria-pressed')==='true' && progressStore.getStatus()==='ready'""",arg=topic)
    picker=page.locator("[data-source-exam-picker]")
    if not picker.is_visible():page.get_by_text("细化已掌握知识 / 指定真题",exact=True).click()
    picker.select_option("AMC8-2016-09")
    page.locator("[data-action=sourceExamReplace]:visible").click()
    page.wait_for_function("document.querySelector('[data-selected-exam-summary]')?.innerText.includes('AMC8-2016-09') && progressStore.getStatus()==='ready'")
    page.locator("[data-action=topicStart]:visible:enabled").first.click()
    page.wait_for_function("""()=>{const x=ExamMappingUI.exportDraft().record?.sessions?.active;return x?.id==='RTM-2016-09-DECISION'&&x.submissionOrdinal===0&&progressStore.getStatus()==='ready'}""")
    task=page.locator("[data-rtm-task]")
    assert task.locator(".task-title").inner_text()=="72=2³×3²，不同质因数之和如何求？"
    assert sorted(task.locator("[data-action=rtmChoice]:visible").all_inner_texts())==sorted(["2+3","3+2","2+2+2+3+3"])
def submit(page,value,outcome):
    before=page.evaluate(ACTIVE)
    task=page.locator("[data-rtm-task]")
    task.locator("[data-action=rtmChoice]:visible").filter(has_text=re.compile("^"+re.escape(value)+"$")).click()
    page.wait_for_function("progressStore.getStatus()==='ready'")
    task.locator("[data-action=rtmSubmit]:visible").click()
    page.wait_for_function("""a=>{const x=ExamMappingUI.exportDraft().record?.sessions?.active;return x?.attemptId===a.attemptId&&x.submissionOrdinal===a.ordinal+1&&!!x.feedback?.outcome&&progressStore.getStatus()==='ready'}""",arg=before)
    after=page.evaluate(ACTIVE)
    assert after["outcome"]==outcome,after
    return after
def qa_page(ctx):
    page=open_page(ctx);page.add_script_tag(content=qa);page.wait_for_function("Boolean(window.AMC8_QA)");return page
def load_variant(page,req):
    loaded=page.evaluate("r=>AMC8_QA.loadCase(r,true)",req)
    assert all(loaded[k]==v for k,v in req.items()),loaded
    page.wait_for_function("progressStore.getStatus()==='ready'")
    identity=page.evaluate("""()=>{const t=playerTask(),c=t.competition;return {id:t.id,version:t.contentVersion,recipe:c.recipe,signature:c.signature,main:t.prompt,key:c.extension.key,answer:c.extension.answer}}""")
    page.locator("#app [data-action=competitionIndependentVariation]:visible").click()
    ex=page.locator("details.competition-extension")
    ex.wait_for(state="visible");assert ex.evaluate("el=>el.open")
    scope=page.evaluate("()=>topicSession()?.items?.[0]?.draft?.work?.activeScopeId")
    assert scope and scope.startswith("variation:")
    return {"loaded":loaded,"identity":identity,"scope":scope,"text":ex.inner_text()}
def grade_variant(page,scope,value,ok):
    inp=page.locator('#app [data-competition-input="extension"]:visible');assert inp.count()==1
    inp.fill(str(value));page.locator("#app [data-action=competitionExtensionCheck]:visible").click()
    page.wait_for_function("""s=>{const w=topicSession()?.items?.[0]?.draft?.work,m=w?.scopes?.[s];return !!m?.feedback&&!!m?.lastSubmissionKey&&progressStore.getStatus()==='ready'}""",arg=scope)
    actual=page.evaluate("""s=>{const w=topicSession().items[0].draft.work,m=w.scopes[s];return {input:m.input,feedback:m.feedback,answerState:m.answerState,mainAnswerState:w.scopes.main.answerState,scope:w.activeScopeId}}""",scope)
    assert actual["scope"]==scope and Fraction(actual["input"]["raw"])==value
    assert bool(actual["feedback"]["ok"])==ok and (actual["answerState"]=="correct")==ok,actual
    return actual
def independent(row):
    prompt=row["identity"]["main"]
    match=re.search(r"人数比为\s*(\d+):(\d+)。红队每人得\s*(\d+)\s*分，蓝队每人得\s*(\d+)\s*分",prompt)
    assert match,prompt
    red,blue,rs,bs=map(int,match.groups())
    assert re.search(r"红队有\s*"+str(red)+r"\s*人、蓝队有\s*"+str(blue)+r"\s*人",row["text"]),row["text"]
    m=re.search(r"不超过\s*(\d+(?:\.\d+)?)",row["text"]);assert m,row["text"]
    target=Fraction(m.group(1)); high_count=blue if bs>rs else red; high_score=max(rs,bs)
    legal=[k for k in range(high_count+1) if red+blue-k>0 and Fraction(red*rs+blue*bs-k*high_score,red+blue-k)<=target]
    assert legal
    return min(legal),high_count
report={"browser":a.browser,"scope":"C engineering, not D independent signoff","status":"NOT_PROVEN"}
try:
    with sync_playwright() as pw:
        engine=getattr(pw,a.browser)
        browser=engine.launch(headless=True,args=["--no-sandbox","--disable-dev-shm-usage"] if a.browser=="chromium" else [])
        ctx=browser.new_context(viewport={"width":1024,"height":768})
        root=a.base;page=open_page(ctx);baseline=page.evaluate(SCAN)
        decision(page);old=submit(page,"3+2","INCORRECT");old_events=page.evaluate(EVENTS)
        assert any(e.get("attemptId")==old["attemptId"] for e in old_events),old_events
        root=a.candidate;page.reload(wait_until="domcontentloaded");ready(page)
        retained=page.evaluate(EVENTS)
        assert all(e in retained for e in old_events),"prior response event altered or lost"
        candidate=page.evaluate(SCAN)
        assert len(baseline)==len(candidate)==1352
        changed=[]
        for prev,nxt in zip(baseline,candidate):
            assert prev["path"]==nxt["path"] and prev["prompt"]==nxt["prompt"]
            for x,y in zip(prev["options"],nxt["options"]):
                assert x["id"]==y["id"] and x["text"]==y["text"]
                if x["outcome"]!=y["outcome"]:changed.append({"path":prev["path"],"prompt":prev["prompt"],"before":x,"after":y})
        assert len(changed)==1 and changed[0]["before"]["text"]=="3+2" and changed[0]["before"]["outcome"]=="INCORRECT" and changed[0]["after"]["outcome"]=="VERIFIED",changed
        synthetic=page.evaluate(r"""()=>{
          const options=[{id:'a',text:'2+3'},{id:'b',text:'3+2'},{id:'c',text:'1+4'},{id:'d',text:'2+2+2+3+3'},{id:'e',text:'2-3'}];
          const t={prompt:'按加数求和',answerContract:{kind:'choice',expected:'a',equivalence:'unordered-integer-sum'},options,grantsJudgmentEvidence:true};
          const u={...t,answerContract:{kind:'choice',expected:'a'},prompt:'按从小到大的顺序选择算式'};
          return {declared:['a','b','c','d','e','unknown'].map(x=>JudgmentEvidence.task(t,x).outcome),ordered:JudgmentEvidence.task(u,'b').outcome,assisted:JudgmentEvidence.task(t,'b',{methodHelpCount:1}).level};
        }""")
        assert synthetic=={"declared":["VERIFIED","VERIFIED","INCORRECT","INCORRECT","INCORRECT","INCORRECT"],"ordered":"INCORRECT","assisted":"E1"},synthetic
        report["choiceSharedImpact"]={"records":len(baseline),"options":sum(len(x["options"]) for x in baseline),"changed":changed,"synthetic":synthetic}
        report["history"]={"prior":old,"retainedEvents":len(old_events)}
        ctx.close()
        for value,outcome in [("2+3","VERIFIED"),("3+2","VERIFIED"),("2+2+2+3+3","INCORRECT")]:
            ctx=browser.new_context(viewport={"width":1024,"height":768});page=open_page(ctx);decision(page);first=submit(page,value,outcome)
            report.setdefault("choiceUI",[]).append(first)
            if outcome=="INCORRECT":
                ev=page.evaluate(EVENTS)
                retry=page.locator("[data-action=rtmRetry]:visible")
                if retry.count():retry.click();page.wait_for_function("progressStore.getStatus()==='ready'")
                second=submit(page,"3+2","VERIFIED")
                assert all(e in page.evaluate(EVENTS) for e in ev)
                report["retry"]={"first":first,"second":second,"retainedEvents":len(ev)}
            ctx.close()
        root=a.base;ctx=browser.new_context(viewport={"width":1024,"height":768});page=qa_page(ctx)
        before=[load_variant(page,r) for r in requests];ctx.close()
        root=a.candidate;ctx=browser.new_context(viewport={"width":1024,"height":768});page=qa_page(ctx)
        report["weighted"]=[]
        for case,req,prev in zip(cases,requests,before):
            nxt=load_variant(page,req)
            assert nxt["identity"]==prev["identity"] and nxt["scope"]==prev["scope"],{"before":prev,"after":nxt}
            k,high=independent(nxt)
            if len(report["weighted"])==0:
                wrong=k+1
                assert wrong!=k
                report["weightedNegative"]=grade_variant(page,nxt["scope"],wrong,False)
                nxt=load_variant(page,req)
            actual=grade_variant(page,nxt["scope"],k,True)
            report["weighted"].append({"caseId":case["caseId"],"recipe":req,"before":prev["text"],"after":nxt["text"],"identity":nxt["identity"],"independentCount":k,"actual":actual})
        ctx.close();browser.close()
        report["status"]="PASS"
finally:
    a.out.mkdir(exist_ok=True,parents=True)
    (a.out/f"receipt-{a.browser}.json").write_text(json.dumps(report,ensure_ascii=False,indent=2)+"\n")
    print("C_ENGINEERING "+json.dumps(report,ensure_ascii=False),flush=True)
    server.shutdown()
