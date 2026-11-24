#!/usr/bin/env python3
"""D RC73 exact variation delta: visible-prompt-derived frozen answers, no main regrade or answer keys."""
import json,hashlib,functools,threading,subprocess,sys,time,concurrent.futures,os
from pathlib import Path
from fractions import Fraction
from http.server import SimpleHTTPRequestHandler,ThreadingHTTPServer
from collections import Counter
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[2];sys.path.insert(0,str(ROOT/'tools'))
from g1_reading_packets import config,unpack
BASE='72f2f229246af362f9024db217479357890c8cd3';OUT=ROOT/'r11-probe-output';OUT.mkdir(exist_ok=True)
assert (ROOT/'index.html').read_bytes()==subprocess.check_output(['git','show',BASE+':index.html'],cwd=ROOT)
freeze=ROOT/'tools/r11-product/d-r12-holdout-expected.json'
frozen=json.loads(freeze.read_text()); items=frozen['rows'];assert len(items)==21
shards=[items[i::4] for i in range(4)]
legacy=config((ROOT/'qa/index.html').read_text());control=legacy['math']['scripts'][-1];assert control['id']=='f12930312b8e007ab222216e6f478d87b24a0856ed7b0e191a98326ce32bec85'
qa=unpack(control,lambda n:(ROOT/n).read_bytes()).decode()
class H(SimpleHTTPRequestHandler):
 def log_message(self,*a):pass
srv=ThreadingHTTPServer(('127.0.0.1',0),functools.partial(H,directory=str(ROOT)));threading.Thread(target=srv.serve_forever,daemon=True).start()
url=f'http://127.0.0.1:{srv.server_port}/index.html#math'
def grade(i):
 rows=[]
 with sync_playwright() as p:
  b=p.chromium.launch(headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
  for e in shards[i]:
   ctx=b.new_context(viewport={'width':1024,'height':768});page=ctx.new_page();page.set_default_timeout(5000)
   a,reason=e['input'],e['derivation'];r={'caseId':str(e['ordinal']),'requested':e['requested'],'taskId':e['taskId'],'input':a,'derivation':reason,'status':'NOT_PROVEN'}
   try:
    page.goto(url,wait_until='domcontentloaded');page.wait_for_function("Boolean(window.__AMC8_MATH_NAV) && typeof progressStore!=='undefined' && progressStore.getStatus()==='ready'",timeout=45000);page.add_script_tag(content=qa);page.wait_for_function('Boolean(window.AMC8_QA)')
    loaded=page.evaluate("r=>AMC8_QA.loadCase(r,true)",e['requested'])
    assert all(loaded[k]==v for k,v in e['requested'].items()) and loaded['taskId']==r['taskId']
    page.wait_for_function("progressStore.getStatus()==='ready'")
    main=page.locator('#app').inner_text()
    assert sorted(main.splitlines())==sorted(e['mainText'].splitlines()),'main prompt mismatch'
    page.locator('#app [data-action=competitionIndependentVariation]:visible').click()
    ex=page.locator('details.competition-extension');ex.wait_for(state='visible');assert ex.evaluate('el=>el.open')
    obs=ex.evaluate("""el=>({text:el.innerText,svgs:[...el.querySelectorAll('svg')].filter(x=>x.getClientRects().length).map(x=>({viewBox:x.getAttribute('viewBox'),labels:[...x.querySelectorAll('text')].map(t=>t.textContent),geometry:[...x.querySelectorAll('line,rect,polygon,circle,path')].map(n=>n.outerHTML)}))})""")
    assert obs['text']==e['variationText'],'visible variation projection mismatch'
    r['promptSha256']=hashlib.sha256(obs['text'].encode()).hexdigest();assert r['promptSha256']==e['promptSha256']
    scope=page.evaluate("()=>topicSession()?.items?.[0]?.draft?.work?.activeScopeId");assert scope==e['scope']
    r['scope']=scope
    inp=page.locator('#app [data-competition-input="extension"]:visible');assert inp.count()==1;inp.fill(a)
    page.locator('#app [data-action=competitionExtensionCheck]:visible').click()
    page.wait_for_function("""s=>{const w=topicSession()?.items?.[0]?.draft?.work,m=w?.scopes?.[s];return !!m?.feedback&&!!m?.lastSubmissionKey&&progressStore.getStatus()==='ready'}""",arg=scope)
    r['actual']=page.evaluate("""s=>{const w=topicSession()?.items?.[0]?.draft?.work,m=w?.scopes?.[s];return {active:w?.activeScopeId,input:m?.input,feedback:m?.feedback,answerState:m?.answerState,submissionKey:m?.lastSubmissionKey,help:m?.help,mainAnswerState:w?.scopes?.main?.answerState,mainHelp:w?.scopes?.main?.help}}""",scope)
    assert r['actual']['active']==scope and Fraction(r['actual']['input']['raw'])==Fraction(a)
    assert not r['actual']['help']['solutionSeen'] and not r['actual']['help']['revealedHintIds'],'prior solution exposure'
    assert r['actual']['mainAnswerState']=='editing' and not r['actual']['mainHelp']['solutionSeen'] and not r['actual']['mainHelp']['revealedHintIds'],'main answer or help exposure'
    r['status']='VERIFIED' if r['actual']['answerState']=='correct' and r['actual']['feedback']['ok'] else 'GRADING_DISAGREEMENT'
   except Exception as ex:r['error']=repr(ex)
   if r['status']!='VERIFIED' and sum(x['status']!='VERIFIED' for x in rows)<4:page.screenshot(path=str(OUT/f"{r['caseId']}-failure.png"),full_page=True)
   rows.append(r);print('HOLDOUT_GRADE_ROW '+json.dumps(r,ensure_ascii=False),flush=True);ctx.close()
  b.close()
 (OUT/f'r12-holdout-grade-{i}.json').write_text(json.dumps(rows,ensure_ascii=False,indent=2))
 return rows
try:
 t=time.monotonic()
 with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:rows=[x for chunk in pool.map(grade,range(4)) for x in chunk]
 receipt={'base':BASE,'projectionRun':45426704910,'projectionArtifact':14937500092,'freezeSha256':hashlib.sha256(freeze.read_bytes()).hexdigest(),'rows':len(rows),'counts':dict(Counter(x['status'] for x in rows)),'elapsedSeconds':round(time.monotonic()-t,2),'notVerified':[x for x in rows if x['status']!='VERIFIED']}
 (OUT/'r12-holdout-grade-receipt.json').write_text(json.dumps(receipt,ensure_ascii=False,indent=2));print('HOLDOUT_GRADE_SUMMARY '+json.dumps(receipt,ensure_ascii=False),flush=True)
finally:srv.shutdown()
