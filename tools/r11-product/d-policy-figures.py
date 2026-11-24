#!/usr/bin/env python3
"""D parallel negative-policy and HTTP asset observations; no product changes or answer keys."""
import functools,hashlib,json,subprocess,threading,time
from pathlib import Path
from http.server import SimpleHTTPRequestHandler,ThreadingHTTPServer
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[2];OUT=ROOT/'r11-probe-output';OUT.mkdir(exist_ok=True)
BASE='72f2f229246af362f9024db217479357890c8cd3'
assert (ROOT/'index.html').read_bytes()==subprocess.check_output(['git','show',BASE+':index.html'],cwd=ROOT)
RESTRICTED='2000-02 2000-07 2000-17 2001-20 2005-06 2005-09 2005-15 2008-21 2009-19 2012-21 2013-19 2013-25 2014-01 2014-09 2014-15 2015-08 2015-21 2015-25 2016-23 2016-25 2017-21 2017-22 2017-25 2018-24 2019-09 2019-20 2019-21 2022-18 2022-20 2022-24 2023-08 2023-17 2024-24 2025-08 2025-20 2025-24 2026-25'.split()
class Handler(SimpleHTTPRequestHandler):
 def log_message(self,*a): pass
server=ThreadingHTTPServer(('127.0.0.1',0),functools.partial(Handler,directory=str(ROOT)));threading.Thread(target=server.serve_forever,daemon=True).start()
url=f'http://127.0.0.1:{server.server_port}/index.html'
out={'base':BASE,'policy':[],'figures':{},'remote':{},'limitations':['Allocation negative tests are real browser runtime, not full old-history persistence test.','Image decode is resource evidence, not rendered problem or independent grading.']}
try:
 with sync_playwright() as p:
  b=p.chromium.launch(headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
  c=b.new_context(viewport={'width':1024,'height':768});page=c.new_page();page.set_default_timeout(20000);errs=[];page.on('pageerror',lambda e:errs.append(str(e)))
  page.goto(url);t=time.perf_counter();page.locator('[data-home-hub] [data-action=home]').click();page.wait_for_function('Boolean(window.__AMC8_MATH_NAV)',timeout=60000);out['remote']['mathColdMs']=round((time.perf_counter()-t)*1000)
  page.wait_for_function("typeof progressStore!=='undefined' && progressStore.getStatus()==='ready'",timeout=20000)
  out['policy']=page.evaluate("""ids=>ids.map(id=>{id='AMC8-'+id;try{const p=SourceCatalog.profile({sourceIds:['AMC8'],examIds:[id],topicIds:SKILL_DATA.units.map(x=>x.id)});const before=JSON.stringify(Object.entries(localStorage));const available=ExamMappingUI.connectedAvailability(p);const start=available===0?ExamMappingUI.beginConnected(p):null;return {id,available,started:start,storageUnchanged:before===JSON.stringify(Object.entries(localStorage)),status:available===0&&start===false?'NEGATIVE_ALLOCATION_PASS':'REVIEW'}}catch(e){return {id,error:String(e),status:'NOT_PROVEN'}}})""",RESTRICTED)
  picker=page.locator('[data-source-exam-picker]')
  if picker.count():
   out['policyPicker']=picker.evaluate("""(el,ids)=>[...el.options].filter(o=>ids.includes(o.value)).map(o=>({id:o.value,text:o.textContent,disabled:o.disabled}))""",['AMC8-'+x for x in RESTRICTED])
  out['figures']=page.evaluate("""async()=>{const index=window.__AMC8_SOURCE_FIGURES||{};const entries=Object.entries(index);const rows=[];for(let i=0;i<entries.length;i+=12){const batch=await Promise.all(entries.slice(i,i+12).map(async([id,src])=>{try{if(typeof src!=='string')return {id,status:'UNSUPPORTED_INDEX_SHAPE'};const u=new URL(src,location.href);if(u.protocol!=='data:'&&u.origin!==location.origin)return {id,status:'NOT_SAME_ORIGIN'};const img=new Image();img.src=u.href;await Promise.race([img.decode(),new Promise((_,reject)=>setTimeout(()=>reject(Error('decode timeout')),10000))]);return {id,status:img.naturalWidth>0?'DECODED':'NO_DIMENSIONS',width:img.naturalWidth,height:img.naturalHeight}}catch(e){return {id,status:'DECODE_FAILED',error:String(e)}}}));rows.push(...batch)}return {count:entries.length,rows}}""")
  page.screenshot(path=str(OUT/'policy-math-entry.png'),full_page=True)
  # Actual navigation measurements, no learning records written.
  page.locator('[data-action=hubHome]').click();t=time.perf_counter();page.locator('[data-home-hub] [data-action=reading]').click();page.locator('.rd-today [data-action=rdStart]').wait_for(timeout=60000);out['remote']['readingColdMs']=round((time.perf_counter()-t)*1000)
  out['remote']['readingLanding']=page.locator('#app').inner_text()[:4000];page.screenshot(path=str(OUT/'reading-landing.png'),full_page=True)
  page.locator('[data-action=hubHome]').click();t=time.perf_counter();page.locator('[data-home-hub] [data-action=reading]').click();page.locator('.rd-today [data-action=rdStart]').wait_for(timeout=30000);out['remote']['readingWarmMs']=round((time.perf_counter()-t)*1000)
  page.locator('[data-action=hubHome]').click();t=time.perf_counter();page.locator('[data-home-hub] [data-action=home]').click();page.locator('[data-source-exam-picker]').wait_for(state='attached',timeout=30000);out['remote']['mathWarmMs']=round((time.perf_counter()-t)*1000);out['remote']['errors']=errs
  c.close();b.close()
except Exception as e:out['error']=str(e)
finally:
 (OUT/'policy-figures-remote.json').write_text(json.dumps(out,ensure_ascii=False,indent=2))
 print(json.dumps(out,ensure_ascii=False))
 server.shutdown()
