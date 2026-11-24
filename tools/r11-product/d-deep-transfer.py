#!/usr/bin/env python3
"""D six-dimension deep review observations, reused main answer transit; no production changes."""
import functools,json,subprocess,threading,sys,time
from pathlib import Path
from http.server import SimpleHTTPRequestHandler,ThreadingHTTPServer
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[2];sys.path.insert(0,str(ROOT/'tools'))
from g1_reading_packets import config,unpack
BASE='72f2f229246af362f9024db217479357890c8cd3';OUT=ROOT/'r11-probe-output';OUT.mkdir(exist_ok=True);D=ROOT/'tools/r11-product'
assert (ROOT/'index.html').read_bytes()==subprocess.check_output(['git','show',BASE+':index.html'],cwd=ROOT)
control=config((ROOT/'qa/index.html').read_text())['math']['scripts'][-1];assert control['id']=='f12930312b8e007ab222216e6f478d87b24a0856ed7b0e191a98326ce32bec85'
qa=unpack(control,lambda n:(ROOT/n).read_bytes()).decode()
old=[*json.loads((D/'d-competition-expected-01.json').read_text())['rows'],*json.loads((D/'d-integrated-expected.json').read_text())['rows']]
frozen=json.loads((D/'d-deep-wrong-expected.json').read_text());assert frozen['base']==BASE
expected=[e for e in old if e['track']=='DEEP_REVIEW' and e['id'] in frozen['wrong']]
assert len(expected)==36 and len({e['id'] for e in expected})==36
class H(SimpleHTTPRequestHandler):
 def log_message(self,*a):pass
srv=ThreadingHTTPServer(('127.0.0.1',0),functools.partial(H,directory=str(ROOT)));threading.Thread(target=srv.serve_forever,daemon=True).start()
url=f'http://127.0.0.1:{srv.server_port}/index.html#math'
def text_state(page):
 return page.evaluate("""()=>{const root=document.querySelector('#app'),s=topicSession(),item=s?.items?.[0],t=playerTask();return {id:t?.id,text:root?.innerText,scope:item?.draft?.work?.activeScopeId,passed:item?.passed,feedback:item?.feedback,svg:[...root.querySelectorAll('svg')].filter(x=>x.getClientRects().length).map(x=>({viewBox:x.getAttribute('viewBox'),labels:[...x.querySelectorAll('text')].map(t=>t.textContent)})),controls:[...root.querySelectorAll('button,input,select')].filter(x=>x.getClientRects().length).map(x=>({action:x.dataset.action||null,text:x.tagName==='INPUT'?'':x.innerText,placeholder:x.getAttribute('placeholder'),type:x.getAttribute('type')}))}}""")
def select(page,value):
 picks=page.locator('#app [data-action=competitionPick]:visible')
 if picks.count():
  hits=[x for x in picks.all() if x.inner_text().strip()==value];assert len(hits)==1,(value,picks.all_inner_texts());hits[0].click()
 else:
  inp=page.locator('#app input:visible');assert inp.count()==1,inp.count();inp.fill(value)
 page.locator('#app [data-action=check]:visible').click()
 page.wait_for_timeout(350)
def shot(page,i,tag):page.screenshot(path=str(OUT/f'{i:02d}-{tag}.png'),full_page=True)
targets={e['id']:e for e in json.loads((D/'d-deep-transfer-expected.json').read_text())['rows']}
rows=[];started=time.monotonic()
try:
 with sync_playwright() as p:
  b=p.chromium.launch(headless=True,args=['--no-sandbox','--disable-dev-shm-usage']);ctx=b.new_context(viewport={'width':1024,'height':768});page=ctx.new_page();page.set_default_timeout(9000)
  page.goto(url,wait_until='domcontentloaded');page.wait_for_function('Boolean(window.__AMC8_MATH_NAV)',timeout=45000);page.add_script_tag(content=qa);page.wait_for_function('Boolean(window.AMC8_QA)')
  for i,e in enumerate(expected):
   target=targets[e['id']];row={'id':e['id'],'requested':e['requested'],'answer':target['answer'],'status':'NOT_RUN'}
   try:
    page.evaluate('r=>AMC8_QA.loadCase(r,true)',e['requested']);page.wait_for_timeout(150)
    before=text_state(page);assert before['id']==e['id'];assert sorted(before['text'].splitlines())==sorted(e['text'].splitlines())
    select(page,e['answer']);assert text_state(page)['feedback']['ok']
    page.locator('#app [data-action=competitionIndependentVariation]:visible').first.click()
    page.wait_for_timeout(150)
    state=text_state(page);assert target['question'] in state['text'];assert state['scope'].startswith('variation:')
    row['scope']=state['scope']
    inp=page.locator('#app [data-competition-input="extension"]:visible');assert inp.count()==1,inp.count()
    inp.fill(target['answer'])
    page.locator('#app [data-action=competitionExtensionCheck]:visible').click()
    page.wait_for_timeout(250)
    row['observed']=text_state(page)
    row['after']=page.evaluate("""()=>{const t=topicSession()?.items?.[0]?.draft?.work;return {active:t?.activeScopeId,scopes:t?.scopes,extension:t?.extension,feedback:t?.feedback}}""")
    row['status']='SUBMITTED'
    shot(page,i,'transfer')
   except Exception as ex:row['error']=repr(ex);row['status']='PARTIAL'
   rows.append(row);print('TRANSFER_ROW '+json.dumps(row,ensure_ascii=False,separators=(',',':')),flush=True)
  ctx.close();b.close()
finally:
 (OUT/'deep-transfer.json').write_text(json.dumps({'base':BASE,'rows':rows},ensure_ascii=False,indent=2))
 print('TRANSFER_SUMMARY '+json.dumps({'count':len(rows),'submitted':sum(x['status']=='SUBMITTED' for x in rows),'elapsedSeconds':round(time.monotonic()-started,2)},ensure_ascii=False),flush=True)
 srv.shutdown()
