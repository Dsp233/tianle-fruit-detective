#!/usr/bin/env python3
"""Extract original RC73 main/variation visible prompts using current-build QA controller.
No product answer keys or solution helpers read; no grading/signoff from extraction."""
import csv,io,zipfile,json,functools,threading,subprocess,sys,time,concurrent.futures
from pathlib import Path
from http.server import SimpleHTTPRequestHandler,ThreadingHTTPServer
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[2];sys.path.insert(0,str(ROOT/'tools'))
from g1_reading_packets import config,unpack
BASE='72f2f229246af362f9024db217479357890c8cd3';OUT=ROOT/'r11-probe-output';OUT.mkdir(exist_ok=True)
assert (ROOT/'index.html').read_bytes()==subprocess.check_output(['git','show',BASE+':index.html'],cwd=ROOT)
kit=ROOT/'muse/rc73/rc73-muse-acceptance-kit.zip'
with zipfile.ZipFile(kit) as z:cases=[r for r in csv.DictReader(io.StringIO(z.read('ledgers/instance-environments.csv').decode('utf-8-sig'))) if r['environment']=='native_chrome']
assert len(cases)==765
legacy=config((ROOT/'qa/index.html').read_text());control=legacy['math']['scripts'][-1];assert control['id']=='f12930312b8e007ab222216e6f478d87b24a0856ed7b0e191a98326ce32bec85'
qa=unpack(control,lambda n:(ROOT/n).read_bytes()).decode()
class H(SimpleHTTPRequestHandler):
 def log_message(self,*a):pass
srv=ThreadingHTTPServer(('127.0.0.1',0),functools.partial(H,directory=str(ROOT)));threading.Thread(target=srv.serve_forever,daemon=True).start()
url=f'http://127.0.0.1:{srv.server_port}/index.html#math'
def collect(shard):
 rows=[]
 with sync_playwright() as p:
  b=p.chromium.launch(headless=True,args=['--no-sandbox','--disable-dev-shm-usage']);ctx=b.new_context(viewport={'width':1024,'height':768});page=ctx.new_page();page.set_default_timeout(2500)
  page.goto(url,wait_until='domcontentloaded');page.wait_for_function("Boolean(window.__AMC8_MATH_NAV) && typeof progressStore!=='undefined' && progressStore.getStatus()==='ready'",timeout=45000);page.add_script_tag(content=qa);page.wait_for_function('Boolean(window.AMC8_QA)')
  for i,r in enumerate(cases):
   if i%5!=shard:continue
   req={'familyId':r['familyId'],'configuration':r['configurationId'],'seed':int(r['seed']),'generatorRevision':int(r['generatorRevision'])};row={'executionId':r['executionId'],'caseId':r['caseId'],'requested':req,'expectedTrack':r['expectedTrack'],'status':'NOT_RUN'}
   try:
    loaded=page.evaluate("""r=>AMC8_QA.loadCase(r,true)""",req);row['loaded']=loaded
    assert all(loaded[k]==v for k,v in req.items())
    page.wait_for_function("progressStore.getStatus()==='ready'")
    row['main']=page.evaluate("""()=>{let el=document.querySelector('#app');return {text:el.innerText,blocked:!!competitionScopedContent(playerTask())?.scopeBlocked,choices:[...el.querySelectorAll('[data-action=competitionPick]')].filter(x=>x.getClientRects().length).map(x=>x.innerText),svgs:[...el.querySelectorAll('svg')].filter(x=>x.getClientRects().length).map(x=>({viewBox:x.getAttribute('viewBox'),labels:[...x.querySelectorAll('text')].map(t=>t.textContent),geometry:[...x.querySelectorAll('line,rect,polygon,circle,path')].map(n=>n.outerHTML)}))}}""")
    if r['expectedTrack']=='POLICY_BLOCKED':
     row['status']='POLICY_PROMPT_OBSERVED' if row['main']['blocked'] else 'POLICY_REQUIRES_REVIEW'
    else:
     assert not row['main']['blocked']
     variant=page.get_by_role('button',name='单独做变式',exact=True)
     if variant.count()==1 and variant.is_visible():
      variant.click();ex=page.locator('details.competition-extension');ex.wait_for(state='visible');assert ex.evaluate('el=>el.open')
      row['variation']=ex.evaluate("""el=>({text:el.innerText,svgs:[...el.querySelectorAll('svg')].filter(x=>x.getClientRects().length).map(x=>({viewBox:x.getAttribute('viewBox'),labels:[...x.querySelectorAll('text')].map(t=>t.textContent),geometry:[...x.querySelectorAll('line,rect,polygon,circle,path')].map(n=>n.outerHTML)}))})""")
      row['status']='MAIN_AND_VARIATION_PROMPTS_OBSERVED'
     else:row['status']='MAIN_ONLY_VARIATION_ENTRY_NOT_OBSERVED'
   except Exception as e:row['status']='NOT_PROVEN';row['error']=str(e)
   rows.append(row)
   if row['status']=='NOT_PROVEN' and sum(x['status']=='NOT_PROVEN' for x in rows)<=3:page.screenshot(path=str(OUT/f'rc73-{r["caseId"]}-failure.png'),full_page=True)
  ctx.close();b.close()
 (OUT/f'rc73-projection-shard-{shard}.json').write_text(json.dumps(rows,ensure_ascii=False,indent=2))
 return rows
try:
 t=time.monotonic()
 with concurrent.futures.ThreadPoolExecutor(max_workers=5) as pool:rows=[x for chunk in pool.map(collect,range(5)) for x in chunk]
 rows.sort(key=lambda x:x['executionId']);from collections import Counter
 sums=dict(Counter(x['status'] for x in rows));receipt={'base':BASE,'scope':'RC73 exact native-Chrome instance prompt extraction, not grading, not full acceptance. Prior validated answers reused where exact identity matches. No independent credit awarded for extraction.','rows':len(rows),'counts':sums,'elapsedSeconds':round(time.monotonic()-t,2),'sampleFailures':[x for x in rows if x['status']=='NOT_PROVEN'][:5]}
 (OUT/'rc73-projection-receipt.json').write_text(json.dumps(receipt,ensure_ascii=False,indent=2));print('RC73_PROJECTION '+json.dumps(receipt,ensure_ascii=False,separators=(',',':')),flush=True)
finally:srv.shutdown()
