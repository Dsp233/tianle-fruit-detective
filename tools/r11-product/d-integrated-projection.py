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
configs=[(f,s,5) for f,ss in [('integratedWeightedPlan',('mean-admission','score-training')),('integratedRatioPlan',('length-border','perimeter-fence'))] for s in ss]
holdouts=[('integratedRatioPlan','length-border',5,41357)]
class H(SimpleHTTPRequestHandler):
 def log_message(self,*a):pass
srv=ThreadingHTTPServer(('127.0.0.1',0),functools.partial(H,directory=str(ROOT)));threading.Thread(target=srv.serve_forever,daemon=True).start()
url=f'http://127.0.0.1:{srv.server_port}/index.html#math'
rows=[]
try:
 with sync_playwright() as p:
  b=p.chromium.launch(headless=True,args=['--no-sandbox','--disable-dev-shm-usage']);ctx=b.new_context(viewport={'width':1024,'height':768});page=ctx.new_page();page.set_default_timeout(15000)
  page.goto(url,wait_until='domcontentloaded');page.wait_for_function('Boolean(window.__AMC8_MATH_NAV)',timeout=45000);page.add_script_tag(content=qa);page.wait_for_function('Boolean(window.AMC8_QA)')
  for i,(fam,cfg,rev,seed,track) in enumerate([(*x,1,'DEEP_REVIEW') for x in configs]+[(*x,'HOLDOUT') for x in holdouts]):
   requested={'familyId':fam,'configuration':cfg,'seed':seed,'generatorRevision':rev};row={'requested':requested,'track':track}
   try:
    # All exported fields are actual visible prompt, visible control labels, and recipe identity only.
    obs=page.evaluate("""r=>{const loaded=AMC8_QA.loadCase(r,true),t=playerTask(),s=topicSession(),root=document.querySelector('#app');return {loaded:{familyId:loaded.familyId,configuration:loaded.configuration,seed:loaded.seed,generatorRevision:loaded.generatorRevision},id:t?.id,recipe:{familyId:t?.competition?.recipe?.familyId,seed:t?.competition?.recipe?.seed,generatorRevision:t?.competition?.recipe?.generatorRevision},session:s?.id,blocked:!!competitionScopedContent(t)?.scopeBlocked,text:root?.innerText,controls:[...root.querySelectorAll('button,input,select')].filter(x=>x.getClientRects().length).map(x=>({action:x.dataset.action||null,text:x.tagName==='INPUT'?'':x.innerText,placeholder:x.getAttribute('placeholder'),type:x.getAttribute('type')})),svg:[...root.querySelectorAll('svg')].filter(x=>x.getClientRects().length).map(x=>({viewBox:x.getAttribute('viewBox'),labels:[...x.querySelectorAll('text')].map(t=>t.textContent)}))}}""",requested)
    row.update(obs)
    if obs['loaded']!=requested or not obs['id'] or not obs.get('text'):row['status']='IDENTITY_OR_RENDER_MISMATCH'
    else:row['status']='VISIBLE_PROMPT_OBSERVED'
    page.screenshot(path=str(OUT/f'{i:02d}-{fam}-{seed}.png'),full_page=True)
   except Exception as e:row['status']='NOT_PROVEN';row['error']=str(e)
   rows.append(row);print('COMP_PROMPT '+json.dumps(row,ensure_ascii=False,separators=(',',':')),flush=True)
  ctx.close();b.close()
finally:
 (OUT/'competition-projection.json').write_text(json.dumps({'base':BASE,'qaController':control['id'],'rows':rows},ensure_ascii=False,indent=2))
 print('COMP_SUMMARY '+json.dumps({'count':len(rows),'rendered':sum(x['status']=='VISIBLE_PROMPT_OBSERVED' for x in rows),'deep':sum(x['track']=='DEEP_REVIEW' for x in rows),'holdout':sum(x['track']=='HOLDOUT' for x in rows)},ensure_ascii=False))
 srv.shutdown()
