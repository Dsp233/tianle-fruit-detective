#!/usr/bin/env python3
"""Grade only frozen, previously unverified RC73 main cases. No product answer key read."""
import json,hashlib,functools,threading,subprocess,sys,time,concurrent.futures
from pathlib import Path
from fractions import Fraction
from http.server import SimpleHTTPRequestHandler,ThreadingHTTPServer
from collections import Counter
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[2];sys.path.insert(0,str(ROOT/'tools'))
from g1_reading_packets import config,unpack
BASE='72f2f229246af362f9024db217479357890c8cd3';OUT=ROOT/'r11-probe-output';OUT.mkdir(exist_ok=True)
assert (ROOT/'index.html').read_bytes()==subprocess.check_output(['git','show',BASE+':index.html'],cwd=ROOT)
freeze=ROOT/'tools/r11-product/d-rc73-main-freeze-03.json'
expected={f'M72-I{int(k):04d}':tuple(v) for k,v in json.loads(freeze.read_text()).items()}
assert len(expected)==24
hashes=['1595decef7bb6d69d3534134ab88b225dafa1fc8ec9e65bd68afce89d1a7a9f1','a3dc86efe77a2a10441324bea3bc8e6768aaac04441378c6e24c673f5e39d82b','c09f69e2e2796f5d7535b2af5d573e5afbfba3339f029ec4096c7fa5b19343db','63d998ed82a8121724f7a539bcad52ef24e37470fc297c3cc7428f3b3316cb2b','6b7294a1b5781b141dd6fcf5e207fa101deac93c40bc11c99043adcd4a86d90e']
shards=[]
for i,digest in enumerate(hashes):
 raw=(Path('/tmp/rc73-main')/f'rc73-projection-shard-{i}.json').read_bytes();assert hashlib.sha256(raw).hexdigest()==digest
 shards.append([r for r in json.loads(raw) if r['caseId'] in expected])
assert sum(map(len,shards))==24
legacy=config((ROOT/'qa/index.html').read_text());control=legacy['math']['scripts'][-1];assert control['id']=='f12930312b8e007ab222216e6f478d87b24a0856ed7b0e191a98326ce32bec85'
qa=unpack(control,lambda n:(ROOT/n).read_bytes()).decode()
class H(SimpleHTTPRequestHandler):
 def log_message(self,*a):pass
srv=ThreadingHTTPServer(('127.0.0.1',0),functools.partial(H,directory=str(ROOT)));threading.Thread(target=srv.serve_forever,daemon=True).start()
url=f'http://127.0.0.1:{srv.server_port}/index.html#math'
def grade(i):
 rows=[]
 with sync_playwright() as p:
  b=p.chromium.launch(headless=True,args=['--no-sandbox','--disable-dev-shm-usage']);ctx=b.new_context(viewport={'width':1024,'height':768});page=ctx.new_page();page.set_default_timeout(3000)
  page.goto(url,wait_until='domcontentloaded');page.wait_for_function("Boolean(window.__AMC8_MATH_NAV) && typeof progressStore!=='undefined' && progressStore.getStatus()==='ready'",timeout=45000);page.add_script_tag(content=qa);page.wait_for_function('Boolean(window.AMC8_QA)')
  for e in shards[i]:
   a,reason=expected[e['caseId']];r={'caseId':e['caseId'],'requested':e['requested'],'taskId':e['loaded']['taskId'],'input':a,'derivation':reason,'status':'NOT_PROVEN'}
   try:
    assert e['expectedTrack']=='ANSWERABLE'
    loaded=page.evaluate("r=>AMC8_QA.loadCase(r,true)",e['requested'])
    assert all(loaded[k]==v for k,v in e['requested'].items()) and loaded['taskId']==r['taskId']
    page.wait_for_function("progressStore.getStatus()==='ready'")
    obs=page.evaluate("""()=>({id:playerTask()?.id,text:document.querySelector('#app')?.innerText,choices:[...document.querySelectorAll('#app [data-action=competitionPick]')].filter(x=>x.getClientRects().length).map(x=>x.innerText.trim()),blocked:!!competitionScopedContent(playerTask())?.scopeBlocked})""")
    assert obs['id']==r['taskId'] and not obs['blocked']
    assert sorted(obs['text'].splitlines())==sorted(e['main']['text'].splitlines()) and sorted(obs['choices'])==sorted(e['main']['choices']),'visible prompt mismatch'
    r['promptSha256']=hashlib.sha256(e['main']['text'].encode()).hexdigest()
    hits=[]
    for el in page.locator('#app [data-action=competitionPick]:visible').all():
     try:
      if Fraction(el.inner_text().strip())==Fraction(a):hits.append(el)
     except ValueError:pass
    if obs['choices']:
     assert len(hits)==1,'choice mismatch'
     r['submittedChoice']=hits[0].inner_text().strip();hits[0].click()
    else:
     inp=page.locator('#app input:visible');assert inp.count()==1,'numeric entry mismatch';inp.fill(a)
     r['submittedChoice']=a
    page.locator('#app [data-action=check]:visible').click()
    page.wait_for_function("""()=>{const t=playerTask(),s=topicSession(),i=s?.items?.find(x=>x.taskId===t?.id);return !!i?.draft?.work?.scopes?.main?.feedback}""")
    r['actual']=page.evaluate("""()=>{const t=playerTask(),s=topicSession(),i=s?.items?.find(x=>x.taskId===t?.id),m=i?.draft?.work?.scopes?.main;return {id:t?.id,passed:i?.passed,input:m?.input,feedback:m?.feedback,answerState:m?.answerState,submissionKey:m?.lastSubmissionKey,help:m?.help}}""")
    assert r['actual']['id']==r['taskId'] and r['actual']['submissionKey'] and Fraction(r['actual']['input']['raw'])==Fraction(a),'record identity mismatch'
    assert not r['actual']['help']['solutionSeen'] and not r['actual']['help']['revealedHintIds'],'prior solution exposure'
    r['status']='VERIFIED' if r['actual']['answerState']=='correct' and r['actual']['feedback']['ok'] and r['actual']['passed'] else 'GRADING_DISAGREEMENT'
   except Exception as ex:r['error']=repr(ex)
   if r['status']!='VERIFIED' and sum(x['status']!='VERIFIED' for x in rows)<3:page.screenshot(path=str(OUT/f"{r['caseId']}-failure.png"),full_page=True)
   rows.append(r)
  ctx.close();b.close()
 (OUT/f'rc73-main-grade-{i}.json').write_text(json.dumps(rows,ensure_ascii=False,indent=2))
 return rows
try:
 t=time.monotonic()
 with concurrent.futures.ThreadPoolExecutor(max_workers=5) as pool:rows=[x for chunk in pool.map(grade,range(5)) for x in chunk]
 receipt={'base':BASE,'projectionRun':45420036530,'projectionArtifact':14934260197,'freezeSha256':hashlib.sha256(freeze.read_bytes()).hexdigest(),'rows':len(rows),'counts':dict(Counter(x['status'] for x in rows)),'elapsedSeconds':round(time.monotonic()-t,2),'notVerified':[x for x in rows if x['status']!='VERIFIED'][:10]}
 (OUT/'rc73-main-grade-receipt.json').write_text(json.dumps(receipt,ensure_ascii=False,indent=2));print('RC73_GRADE '+json.dumps(receipt,ensure_ascii=False),flush=True)
finally:srv.shutdown()
