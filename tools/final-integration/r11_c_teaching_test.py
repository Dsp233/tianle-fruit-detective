"""Focused C regression; no new mathematical credit, no D signoff."""
import argparse,csv,functools,io,json,re,sys,threading,zipfile
from pathlib import Path
from http.server import SimpleHTTPRequestHandler,ThreadingHTTPServer
from playwright.sync_api import sync_playwright
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
from g1_reading_packets import config,unpack
p=argparse.ArgumentParser()
p.add_argument("--base",type=Path,required=True);p.add_argument("--candidate",type=Path,required=True)
p.add_argument("--out",type=Path,required=True);p.add_argument("--browser",required=True)
a=p.parse_args();a.out.mkdir(parents=True,exist_ok=True)
root=a.base
class H(SimpleHTTPRequestHandler):
    def __init__(self,*args,**kw):super().__init__(*args,directory=str(root),**kw)
    def log_message(self,*args):pass
    def end_headers(self):self.send_header("Cache-Control","no-store");super().end_headers()
srv=ThreadingHTTPServer(("127.0.0.1",0),H)
threading.Thread(target=srv.serve_forever,daemon=True).start()
url=f"http://127.0.0.1:{srv.server_port}/index.html#math"
control=config((a.base/"qa/index.html").read_text())["math"]["scripts"][-1]
assert control["id"]=="f12930312b8e007ab222216e6f478d87b24a0856ed7b0e191a98326ce32bec85"
qa=unpack(control,lambda n:(a.base/n).read_bytes()).decode()
targets={"natural-catch","natural-tiles","natural-offers"}
controls={"equalDistanceSpeed","riverTravel","factorBalance","threeDivisors","divisorPowers","equalBags","percentRoundTrip","percentRestore","discountOrder"}
with zipfile.ZipFile(a.base/"muse/rc73/rc73-muse-acceptance-kit.zip") as z:
    cases=[r for r in csv.DictReader(io.StringIO(z.read("ledgers/instance-environments.csv").decode("utf-8-sig"))) if r["environment"]=="native_chrome" and r["familyId"] in targets|controls]
assert targets|controls <= {r["familyId"] for r in cases}
reqs=[{"familyId":r["familyId"],"configuration":r["configurationId"],"seed":int(r["seed"]),"generatorRevision":int(r["generatorRevision"])} for r in cases]
# Actual product case identities from D's confirmed regression.
known={
 "natural-catch":("COMP-960705B6",[],6),
 "natural-tiles":("COMP-14B2E628",["9","15"],10),
 "natural-offers":("COMP-86E3F8AD",["8","9"],7)
}
original=[dict(familyId=k,configuration=k,seed=1,generatorRevision=3) for k in known]
def ready(page):
    page.wait_for_function("Boolean(window.__AMC8_MATH_NAV)&&typeof progressStore!=='undefined'&&progressStore.getStatus()==='ready'",timeout=60000)
def open_page(ctx):
    page=ctx.new_page();page.set_default_timeout(12000);page.goto(url,wait_until="domcontentloaded");ready(page)
    page.add_script_tag(content=qa);page.wait_for_function("Boolean(window.AMC8_QA)");return page
def load(page,r):
    actual=page.evaluate("r=>AMC8_QA.loadCase(r,true)",r);assert all(actual[k]==v for k,v in r.items()),actual;ready(page)
def action(page,act):return page.locator(f"#app [data-action={act}]:visible").first
def submit(page,value):
    picks=page.locator("#app [data-action=competitionPick]:visible")
    if picks.count():
        option=picks.filter(has_text=re.compile("^"+re.escape(str(value))+"$"));assert option.count()==1;option.click()
    else:
        inp=page.locator("#app input:visible");assert inp.count()==1;inp.fill(str(value))
    ready(page);action(page,"check").click();ready(page)
    return page.evaluate("()=>{const w=topicSession().items[0].draft.work;return {feedback:w.scopes.main.feedback,answerState:w.scopes.main.answerState,text:document.querySelector('#app').innerText}}")
PROJECTION="""()=>{const t=playerTask(),c=t.competition,main=CompetitionContentContracts.resolve(t,'main'),v=CompetitionContentContracts.resolve(t,'variation:'+c.extension.key);
 return {identity:{id:t.id,version:t.contentVersion,recipe:c.recipe,signature:c.signature,math:c.math,mainPrompt:t.prompt,mainAnswer:t.answer,variationKey:c.extension.key,variationAnswer:c.extension.answer},mainDiagram:main.diagram,variantDiagram:v.diagram,mainFeedback:SubmissionContract.feedback(c,'-999',false),variantFeedback:SubmissionContract.feedback(c,'-999',true)} }"""
def projections(page):
    result=[]
    for r in reqs:
        load(page,r)
        result.append({"recipe":r,"actual":page.evaluate(PROJECTION)})
    return result
def original_ui(page,label):
    result=[]
    for r in original:
        family=r["familyId"];ident,wrong,correct=known[family];load(page,r)
        assert page.evaluate("()=>playerTask().id")==ident
        row={"family":family,"id":ident,"wrong":[]}
        for val in wrong:
            s=submit(page,val);assert s["feedback"] and not s["feedback"]["ok"] and s["answerState"]!="correct",s
            row["wrong"].append(s)
            page.screenshot(path=str(a.out/f"{a.browser}-{label}-{ident}-wrong-{val}.png"),full_page=True)
        if family=="natural-catch":
            action(page,"competitionHint").click();ready(page)
            row["journey"]=page.locator("#app .scene-journeys:visible").inner_text()
            row["arrows"]=page.locator("#app .scene-journeys:visible .scene-track i").all_inner_texts()
            row["text"]=page.locator("#app").inner_text()
            page.screenshot(path=str(a.out/f"{a.browser}-{label}-{ident}-hint.png"),full_page=True)
        result.append(row)
    return result
report={"browser":a.browser,"base":"3f22d8002406857a33a3e254ebafc4366f6cec51","scope":"C engineering; inherited mathematical acceptance; not D signoff","status":"NOT_PROVEN"}
try:
    with sync_playwright() as pw:
        engine=getattr(pw,a.browser)
        browser=engine.launch(headless=True,args=["--no-sandbox","--disable-dev-shm-usage"] if a.browser=="chromium" else [])
        ctx=browser.new_context(viewport={"width":1024,"height":768});page=open_page(ctx)
        before=projections(page);report["beforeUI"]=original_ui(page,"baseline");ctx.close()
        root=a.candidate;ctx=browser.new_context(viewport={"width":1024,"height":768});page=open_page(ctx)
        after=projections(page);report["afterUI"]=original_ui(page,"candidate")
        report["projectionChecks"]=[]
        for x,y in zip(before,after):
            assert x["recipe"]==y["recipe"];prev=x["actual"];nxt=y["actual"];f=x["recipe"]["familyId"]
            assert prev["identity"]==nxt["identity"],x["recipe"]
            if f=="natural-catch":
                m=nxt["identity"]["math"]
                assert [s["direction"] for s in nxt["mainDiagram"]["segments"]]==["→","→"]
                assert [s["speed"] for s in nxt["mainDiagram"]["segments"]]==[m["slow"],m["fast"]]
                assert nxt["mainDiagram"]["leadDistance"]==m["slow"]*m["delay"]
                assert nxt["variantDiagram"]["segments"][1]["direction"]=="停"
                assert nxt["variantDiagram"]["segments"][1]["speed"]==0
                assert nxt["variantDiagram"]["leadDistance"] is None
                assert prev["mainFeedback"]==nxt["mainFeedback"] and prev["variantFeedback"]==nxt["variantFeedback"]
            elif f in {"natural-tiles","natural-offers"}:
                assert prev["mainDiagram"]==nxt["mainDiagram"] and prev["variantDiagram"]==nxt["variantDiagram"]
                if f=="natural-tiles":
                    assert "同时整除" in nxt["mainFeedback"] and "总块数" in nxt["mainFeedback"] and "面积" in nxt["variantFeedback"]
                else:
                    assert "整单" in nxt["mainFeedback"] and "配送费" in nxt["mainFeedback"] and "少一本" in nxt["variantFeedback"]
            else:
                assert prev==nxt,{"control":f,"recipe":x["recipe"]}
            report["projectionChecks"].append({"recipe":x["recipe"],"before":prev,"after":nxt})
        assert report["beforeUI"][0]["arrows"]==["→","←"]
        catch=report["afterUI"][0]
        assert catch["arrows"]==["→","→"] and "先行距离 6 米" in catch["text"]
        assert "2 米/分钟" in catch["journey"] and "3 米/分钟" in catch["journey"]
        for row in report["afterUI"][1:]:
            for s in row["wrong"]:
                if row["family"]=="natural-tiles":
                    assert "同时整除" in s["text"] and "总块数" in s["text"] and "候选因数相乘" not in s["text"]
                else:
                    assert "整单" in s["text"] and "配送费" in s["text"] and "回到题给价格" not in s["text"]
        ctx.close();browser.close();report["status"]="PASS"
finally:
    (a.out/f"receipt-{a.browser}.json").write_text(json.dumps(report,ensure_ascii=False,indent=2)+"\n")
    print("C_TEACHING "+json.dumps({"status":report["status"],"browser":a.browser,"projections":len(report.get("projectionChecks",[])),"originalUI":report.get("afterUI",[])},ensure_ascii=False),flush=True)
    srv.shutdown()
