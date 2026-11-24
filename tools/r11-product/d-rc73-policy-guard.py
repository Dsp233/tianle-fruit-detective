#!/usr/bin/env python3
"""RC73 policy track delta only: 2 configurations x 5 original boundary seeds."""
import functools,threading,subprocess,json,sys,hashlib
from pathlib import Path
from http.server import SimpleHTTPRequestHandler,ThreadingHTTPServer
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[2];sys.path.insert(0,str(ROOT/'tools'))
from g1_reading_packets import config,unpack
BASE='72f2f229246af362f9024db217479357890c8cd3';OUT=ROOT/'r11-probe-output';OUT.mkdir(exist_ok=True)
assert (ROOT/'index.html').read_bytes()==subprocess.check_output(['git','show',BASE+':index.html'],cwd=ROOT)
legacy=config((ROOT/'qa/index.html').read_text());control=legacy['math']['scripts'][-1];assert control['id']=='f12930312b8e007ab222216e6f478d87b24a0856ed7b0e191a98326ce32bec85'
qa=unpack(control,lambda n:(ROOT/n).read_bytes()).decode()
class H(SimpleHTTPRequestHandler):
 def log_message(self,*a):pass
srv=ThreadingHTTPServer(('127.0.0.1',0),functools.partial(H,directory=str(ROOT)));threading.Thread(target=srv.serve_forever,daemon=True).start()
URL=f'http://127.0.0.1:{srv.server_port}/index.html#math'
rows=[]
state="""()=>{const i=topicSession()?.items?.[0],t=playerTask(),w=i?.draft?.work;return {taskId:t?.id,blocked:!!competitionScopedContent(t)?.scopeBlocked,passed:i?.passed,feedback:i?.feedback,work:w||null,competition:saved.competition||null,text:document.querySelector('#app').innerText}}"""
try:
 with sync_playwright() as p:
  b=p.chromium.launch(headless=True,args=['--no-sandbox','--disable-dev-shm-usage']);ctx=b.new_context(viewport={'width':1024,'height':768});page=ctx.new_page();page.set_default_timeout(8000)
  page.goto(URL,wait_until='domcontentloaded');page.wait_for_function("Boolean(window.__AMC8_MATH_NAV) && typeof progressStore!=='undefined' && progressStore.getStatus()==='ready'",timeout=45000);page.add_script_tag(content=qa);page.wait_for_function('Boolean(window.AMC8_QA)')
  for offset,(configuration,rev) in enumerate([('signedProduct',3),('amc2000-07-full',4)]):
   for index,seed in enumerate([1,2,129,2147483646,2147483647]):
    req={'familyId':'signedProduct','configuration':configuration,'seed':seed,'generatorRevision':rev};row={'caseId':f'M72-I{316+offset*5+index:04d}','requested':req,'status':'NOT_PROVEN','controls':[]}
    try:
     row['loaded']=page.evaluate('r=>AMC8_QA.loadCase(r,true)',req)
     assert all(row['loaded'][k]==v for k,v in req.items())
     page.wait_for_function("progressStore.getStatus()==='ready'")
     before=page.evaluate(state);assert before['blocked'] and '当前学习范围还未覆盖' in before['text']
     row['before']=before
     # A visible choice is a test input only, not an independent math submission.
     picks=page.locator('#app [data-action=competitionPick]:visible')
     if picks.count():
      row['controls'].append({'action':'pick','enabled':picks.first.is_enabled()})
      if picks.first.is_enabled():picks.first.click()
     for action in ['check','competitionHint','competitionShowSolution','competitionIndependentVariation']:
      loc=page.locator(f'#app [data-action={action}]:visible');entry={'action':action,'present':loc.count()>0,'enabled':bool(loc.count() and loc.first.is_enabled())}
      if entry['enabled']:
       loc.first.click();page.wait_for_timeout(80)
      entry['state']=page.evaluate(state);row['controls'].append(entry)
      assert not entry['state']['passed'],action+' permitted success'
      assert not entry['state'].get('feedback',{}).get('ok',False) if isinstance(entry['state'].get('feedback'),dict) else True
      for scope in (entry['state'].get('work') or {}).get('scopes',{}).values():
       assert scope.get('answerState')!='correct'
       assert not (scope.get('help') or {}).get('solutionSeen')
       assert not (scope.get('help') or {}).get('revealedHintIds')
     after=page.evaluate(state);row['after']=after
     # The existing synthetic competition ledger must not gain graded/help history.
     assert after['competition']==before['competition'],'competition evidence changed during policy block'
     row['status']='VERIFIED_POLICY_GUARD'
    except Exception as e:row['error']=repr(e)
    page.screenshot(path=str(OUT/(row['caseId']+'.png')),full_page=True)
    rows.append(row);print('POLICY_ROW '+json.dumps({'caseId':row['caseId'],'status':row['status'],'error':row.get('error'),'actions':[{k:v for k,v in x.items() if k!='state'} for x in row['controls']]},ensure_ascii=False),flush=True)
  ctx.close();b.close()
finally:
 receipt={'base':BASE,'rows':rows,'verified':sum(r['status']=='VERIFIED_POLICY_GUARD' for r in rows),'scope':'same-build QA policy guard on original 10 instances; no synthetic old history migration claim'}
 (OUT/'rc73-policy-guard-receipt.json').write_text(json.dumps(receipt,ensure_ascii=False,indent=2))
 print('POLICY_SUMMARY '+json.dumps({'verified':receipt['verified'],'count':len(rows),'unverified':[{'caseId':r['caseId'],'error':r.get('error')} for r in rows if r['status']!='VERIFIED_POLICY_GUARD']},ensure_ascii=False),flush=True)
 srv.shutdown()
