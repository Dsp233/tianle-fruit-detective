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
freeze=ROOT/'tools/r11-product'/os.environ.get('RC73_VARIATION_FREEZE','d-rc73-variation-freeze-01.txt')
expected={}
for line in freeze.read_text().splitlines():
 if not line or line.startswith('#'):continue
 values,reason=line.split(';',1);start,*answers=values.split();assert len(answers)==5
 for i,a in enumerate(answers):
  if a!='-':expected[f'M72-I{int(start)+i:04d}']=(a,reason.strip())
hashes=['0dfb3344304fa263054435087b8499b395fb107025aa55b6503dd7f71de2635d','0fd57e43fef42061195f3d1c8e51e5f87b2c9ef6ee66f6239e58ce55b85b8b8e','82d67b5305346c5ef8b6823d8024b482cdf0989a274414ef01f13c6f379c9329','58f3fb2a78ac06e1c7935ce4f518aca083d006ea70d099246a6c2dc9f9737050','dedab633cff6d58c8643be9ccf5adf895d636eaee495ffc60f422b7b01677642']
shards=[]
for i,digest in enumerate(hashes):
 raw=(Path('/tmp/rc73-variation')/f'rc73-variation-shard-{i}.json').read_bytes();assert hashlib.sha256(raw).hexdigest()==digest
 shards.append([r for r in json.loads(raw) if r['caseId'] in expected])
assert sum(map(len,shards))==len(expected)
legacy=config((ROOT/'qa/index.html').read_text());control=legacy['math']['scripts'][-1];assert control['id']=='f12930312b8e007ab222216e6f478d87b24a0856ed7b0e191a98326ce32bec85'
qa=unpack(control,lambda n:(ROOT/n).read_bytes()).decode()
class H(SimpleHTTPRequestHandler):
 def log_message(self,*a):pass
srv=ThreadingHTTPServer(('127.0.0.1',0),functools.partial(H,directory=str(ROOT)));threading.Thread(target=srv.serve_forever,daemon=True).start()
url=f'http://127.0.0.1:{srv.server_port}/index.html#math'
def grade(i):
 rows=[]
 with sync_playwright() as p:
  b=p.chromium.launch(headless=True,args=['--no-sandbox','--disable-dev-shm-usage']);ctx=b.new_context(viewport={'width':1024,'height':768});page=ctx.new_page();page.set_default_timeout(5000)
  page.goto(url,wait_until='domcontentloaded');page.wait_for_function("Boolean(window.__AMC8_MATH_NAV) && typeof progressStore!=='undefined' && progressStore.getStatus()==='ready'",timeout=45000);page.add_script_tag(content=qa);page.wait_for_function('Boolean(window.AMC8_QA)')
  for e in shards[i]:
   a,reason=expected[e['caseId']];r={'caseId':e['caseId'],'requested':e['requested'],'taskId':e['loaded']['taskId'],'input':a,'derivation':reason,'status':'NOT_PROVEN'}
   try:
    assert e['status']=='VARIATION_PROMPT_OBSERVED'
    loaded=page.evaluate("r=>AMC8_QA.loadCase(r,true)",e['requested'])
    assert all(loaded[k]==v for k,v in e['requested'].items()) and loaded['taskId']==r['taskId']
    page.wait_for_function("progressStore.getStatus()==='ready'")
    page.locator('#app [data-action=competitionIndependentVariation]:visible').click()
    ex=page.locator('details.competition-extension');ex.wait_for(state='visible');assert ex.evaluate('el=>el.open')
    obs=ex.evaluate("""el=>({text:el.innerText,svgs:[...el.querySelectorAll('svg')].filter(x=>x.getClientRects().length).map(x=>({viewBox:x.getAttribute('viewBox'),labels:[...x.querySelectorAll('text')].map(t=>t.textContent),geometry:[...x.querySelectorAll('line,rect,polygon,circle,path')].map(n=>n.outerHTML)}))})""")
    assert obs==e['variation'],'visible variation projection mismatch'
    r['promptSha256']=hashlib.sha256(obs['text'].encode()).hexdigest()
    scope=page.evaluate("()=>topicSession()?.items?.[0]?.draft?.work?.activeScopeId");assert scope and scope.startswith('variation:')
    r['scope']=scope
    inp=page.locator('#app [data-competition-input="extension"]:visible');assert inp.count()==1;inp.fill(a)
    page.locator('#app [data-action=competitionExtensionCheck]:visible').click()
    page.wait_for_function("""s=>{const w=topicSession()?.items?.[0]?.draft?.work,m=w?.scopes?.[s];return !!m?.feedback&&!!m?.lastSubmissionKey&&progressStore.getStatus()==='ready'}""",arg=scope)
    r['actual']=page.evaluate("""s=>{const w=topicSession()?.items?.[0]?.draft?.work,m=w?.scopes?.[s];return {active:w?.activeScopeId,input:m?.input,feedback:m?.feedback,answerState:m?.answerState,submissionKey:m?.lastSubmissionKey,help:m?.help,mainAnswerState:w?.scopes?.main?.answerState}}""",scope)
    assert r['actual']['active']==scope and Fraction(r['actual']['input']['raw'])==Fraction(a)
    assert not r['actual']['help']['solutionSeen'] and not r['actual']['help']['revealedHintIds'],'prior solution exposure'
    r['status']='VERIFIED' if r['actual']['answerState']=='correct' and r['actual']['feedback']['ok'] else 'GRADING_DISAGREEMENT'
   except Exception as ex:r['error']=repr(ex)
   if r['status']!='VERIFIED' and sum(x['status']!='VERIFIED' for x in rows)<4:page.screenshot(path=str(OUT/f"{r['caseId']}-failure.png"),full_page=True)
   rows.append(r)
  ctx.close();b.close()
 (OUT/f'rc73-variation-grade-{i}.json').write_text(json.dumps(rows,ensure_ascii=False,indent=2))
 return rows
try:
 t=time.monotonic()
 with concurrent.futures.ThreadPoolExecutor(max_workers=5) as pool:rows=[x for chunk in pool.map(grade,range(5)) for x in chunk]
 receipt={'base':BASE,'projectionRun':45420531834,'projectionArtifact':14934455670,'freezeSha256':hashlib.sha256(freeze.read_bytes()).hexdigest(),'rows':len(rows),'counts':dict(Counter(x['status'] for x in rows)),'elapsedSeconds':round(time.monotonic()-t,2),'notVerified':[x for x in rows if x['status']!='VERIFIED']}
 (OUT/'rc73-variation-grade-receipt.json').write_text(json.dumps(receipt,ensure_ascii=False,indent=2));print('RC73_VARIATION_GRADE '+json.dumps(receipt,ensure_ascii=False),flush=True)
finally:srv.shutdown()
