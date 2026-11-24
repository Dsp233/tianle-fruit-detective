#!/usr/bin/env python3
"""D: exact RC69/73 deep-review and held-out visible prompts from A's current-build QA controller."""
import functools,json,subprocess,threading,sys
from pathlib import Path
from http.server import SimpleHTTPRequestHandler,ThreadingHTTPServer
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[2];sys.path.insert(0,str(ROOT/'tools'))
from g1_reading_packets import config,unpack
BASE='72f2f229246af362f9024db217479357890c8cd3';OUT=ROOT/'r11-probe-output';OUT.mkdir(exist_ok=True)
assert (ROOT/'index.html').read_bytes()==subprocess.check_output(['git','show',BASE+':index.html'],cwd=ROOT)
legacy=config((ROOT/'qa/index.html').read_text());control=legacy['math']['scripts'][-1];assert control['id']=='f12930312b8e007ab222216e6f478d87b24a0856ed7b0e191a98326ce32bec85'
qa=unpack(control,lambda n:(ROOT/n).read_bytes()).decode()
EXPECTED=json.loads((ROOT/'tools/r11-product/d-competition-expected-01.json').read_text())
class H(SimpleHTTPRequestHandler):
 def log_message(self,*a):pass
srv=ThreadingHTTPServer(('127.0.0.1',0),functools.partial(H,directory=str(ROOT)));threading.Thread(target=srv.serve_forever,daemon=True).start()
url=f'http://127.0.0.1:{srv.server_port}/index.html#math'
rows=[]
try:
 with sync_playwright() as p:
  b=p.chromium.launch(headless=True,args=['--no-sandbox','--disable-dev-shm-usage']);ctx=b.new_context(viewport={'width':1024,'height':768});page=ctx.new_page();page.set_default_timeout(10000)
  page.goto(url,wait_until='domcontentloaded');page.wait_for_function('Boolean(window.__AMC8_MATH_NAV)',timeout=45000);page.add_script_tag(content=qa);page.wait_for_function('Boolean(window.AMC8_QA)')
  for i,e in enumerate(EXPECTED['rows']):
   row={'id':e['id'],'requested':e['requested'],'track':e['track'],'input':e['answer'],'status':'NOT_RUN'}
   try:
    obs=page.evaluate("""r=>{const loaded=AMC8_QA.loadCase(r,true),t=playerTask();return {id:t?.id,text:document.querySelector('#app')?.innerText,blocked:!!competitionScopedContent(t)?.scopeBlocked}}""",e['requested'])
    row['observed']=obs
    if obs['id']!=e['id'] or obs['text']!=e['text'] or obs['blocked']:raise RuntimeError('frozen prompt or identity mismatch')
    picks=page.locator('#app [data-action=competitionPick]:visible')
    if picks.count():
     hits=[x for x in picks.all() if x.inner_text().strip()==e['answer']]
     assert len(hits)==1
     hits[0].click()
    else:
     inp=page.locator('#app input:visible');assert inp.count()==1;inp.fill(e['answer'])
    page.locator('#app [data-action=check]:visible').click()
    page.wait_for_timeout(350)
    row['actual']=page.evaluate("""()=>{const s=topicSession(),t=playerTask(),i=s?.items?.find(i=>i.taskId===t?.id)||s?.items?.[0];return {id:t?.id,item:i,text:document.querySelector('#app')?.innerText}}""")
    page.screenshot(path=str(OUT/f'{i:02d}-{e["id"]}.png'),full_page=True)
    row['status']='VISIBLE_SUBMITTED'
   except Exception as ex:row['status']='NOT_PROVEN';row['error']=str(ex)
   rows.append(row);print('COMP_GRADE '+json.dumps(row,ensure_ascii=False,separators=(',',':')),flush=True)
  ctx.close();b.close()
finally:
 (OUT/'competition-grade.json').write_text(json.dumps({'base':BASE,'rows':rows},ensure_ascii=False,indent=2))
 print('COMP_GRADE_SUMMARY '+json.dumps({'count':len(rows),'submitted':sum(x['status']=='VISIBLE_SUBMITTED' for x in rows)},ensure_ascii=False))
 srv.shutdown()
