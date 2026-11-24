#!/usr/bin/env python3
"""Original R12 held-out variation preflight; visible projection only."""
import json,hashlib,functools,threading,subprocess,sys,re
from pathlib import Path
from http.server import SimpleHTTPRequestHandler,ThreadingHTTPServer
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[2];sys.path.insert(0,str(ROOT/'tools'))
from g1_reading_packets import config,unpack
F=ROOT/'tools/r11-product/d-r12-holdout-freeze.json';spec=json.loads(F.read_text())
OUT=ROOT/'r11-probe-output';OUT.mkdir(exist_ok=True)
assert (ROOT/'index.html').read_bytes()==subprocess.check_output(['git','show',spec['base']+':index.html'],cwd=ROOT)
legacy=config((ROOT/'qa/index.html').read_text());control=legacy['math']['scripts'][-1];assert control['id']==spec['controller']
qa=unpack(control,lambda n:(ROOT/n).read_bytes()).decode()
def norm(t):
 return re.sub(r'\s+','',t)
prior_ids=set();prior_text=set()
for file in sorted(Path('/tmp/rc73-variation').glob('rc73-variation-shard-*.json')):
 for r in json.loads(file.read_text()):
  if r.get('status')=='VARIATION_PROMPT_OBSERVED':
   prior_ids.add(r['loaded']['taskId']);prior_text.add(norm(r['variation']['text']))
assert len(prior_ids)>100 and len(prior_text)>100
old=json.loads((ROOT/'tools/r11-product/d-competition-expected-01.json').read_text())
prior_ids.update(r['id'] for r in old['rows'] if r.get('id'))
class H(SimpleHTTPRequestHandler):
 def log_message(self,*a):pass
srv=ThreadingHTTPServer(('127.0.0.1',0),functools.partial(H,directory=str(ROOT)));threading.Thread(target=srv.serve_forever,daemon=True).start()
url=f'http://127.0.0.1:{srv.server_port}/index.html#math'
rows=[]
try:
 with sync_playwright() as p:
  b=p.chromium.launch(headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
  for i,req in enumerate(spec['candidates']):
   ctx=b.new_context(viewport={'width':1024,'height':768});page=ctx.new_page();page.set_default_timeout(10000)
   row={'ordinal':i+1,'requested':req,'status':'NOT_PROVEN'}
   try:
    page.goto(url,wait_until='domcontentloaded');page.wait_for_function("Boolean(window.__AMC8_MATH_NAV) && typeof progressStore!=='undefined' && progressStore.getStatus()==='ready'",timeout=45000)
    page.add_script_tag(content=qa);page.wait_for_function('Boolean(window.AMC8_QA)')
    loaded=page.evaluate("r=>AMC8_QA.loadCase(r,true)",req);assert all(loaded[k]==v for k,v in req.items());row['taskId']=loaded['taskId']
    page.wait_for_function("progressStore.getStatus()==='ready'")
    assert not page.evaluate("()=>!!competitionScopedContent(playerTask())?.scopeBlocked")
    page.locator('[data-action=competitionIndependentVariation]:visible').click()
    ex=page.locator('details.competition-extension');ex.wait_for(state='visible');assert ex.evaluate('el=>el.open')
    obs=ex.evaluate("""el=>({text:el.innerText,svgs:[...el.querySelectorAll('svg')].filter(x=>x.getClientRects().length).map(x=>({viewBox:x.getAttribute('viewBox'),labels:[...x.querySelectorAll('text')].map(t=>t.textContent),geometry:[...x.querySelectorAll('line,rect,polygon,circle,path')].map(n=>n.outerHTML)}))})""")
    row['variation']=obs;row['promptSha256']=hashlib.sha256(obs['text'].encode()).hexdigest()
    row['scope']=page.evaluate("()=>topicSession()?.items?.[0]?.draft?.work?.activeScopeId")
    assert row['scope'].startswith('variation:')
    collision=row['taskId'] in prior_ids or norm(obs['text']) in prior_text
    row['status']='COLLISION_NOT_HOLDOUT' if collision else 'NEW_VISIBLE_PROMPT'
    prior_ids.add(row['taskId']);prior_text.add(norm(obs['text']))
    page.screenshot(path=str(OUT/f"holdout-{i+1:02d}.png"),full_page=True)
   except Exception as e:row['error']=repr(e)
   rows.append(row);print('HOLDOUT_ROW '+json.dumps(row,ensure_ascii=False,separators=(',',':')),flush=True);ctx.close()
  b.close()
finally:
 receipt={'base':spec['base'],'freezeSha256':hashlib.sha256(F.read_bytes()).hexdigest(),'scope':'visible-only; no independent grade yet','rows':rows,'new':sum(r['status']=='NEW_VISIBLE_PROMPT' for r in rows)}
 (OUT/'r12-holdout-projection.json').write_text(json.dumps(receipt,ensure_ascii=False,indent=2))
 print('HOLDOUT_SUMMARY '+json.dumps({'total':len(rows),'new':receipt['new'],'counts':{s:sum(x['status']==s for x in rows) for s in set(x['status'] for x in rows)}}),flush=True)
 srv.shutdown()
