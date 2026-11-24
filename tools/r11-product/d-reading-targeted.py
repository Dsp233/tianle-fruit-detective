#!/usr/bin/env python3
"""Independent V3 reading visible evidence, no answer keys accessed or submitted."""
import json,subprocess,functools,threading,concurrent.futures
from pathlib import Path
from http.server import SimpleHTTPRequestHandler,ThreadingHTTPServer
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[2]
BASE='72f2f229246af362f9024db217479357890c8cd3'
OUT=ROOT/'r11-probe-output';OUT.mkdir(exist_ok=True)
assert (ROOT/'index.html').read_bytes()==subprocess.check_output(['git','show',BASE+':index.html'],cwd=ROOT)
class H(SimpleHTTPRequestHandler):
 def log_message(self,*a):pass
server=ThreadingHTTPServer(('127.0.0.1',0),functools.partial(H,directory=str(ROOT)))
threading.Thread(target=server.serve_forever,daemon=True).start()
url=f'http://127.0.0.1:{server.server_port}/'
def text_no_pinyin(loc):
 return loc.evaluate("""e=>{let c=e.cloneNode(true);c.querySelectorAll('.rd-pinyin,[hidden]').forEach(x=>x.remove());return c.textContent.trim()}""")
def run(day):
 row={'day':day,'status':'NOT_RUN','errors':[]}
 try:
  with sync_playwright() as p:
   b=p.chromium.launch(headless=True,args=['--no-sandbox','--disable-dev-shm-usage']);ctx=b.new_context(viewport={'width':768,'height':1024});page=ctx.new_page();page.set_default_timeout(18000)
   page.on('pageerror',lambda e:row['errors'].append(str(e)))
   page.goto(url,wait_until='domcontentloaded')
   page.locator('[data-home-hub] [data-action=reading]').click()
   page.wait_for_function("window.__AMC8_ReadingRuntime && window.__AMC8_ReadingRuntime.engine().status().status==='ready'")
   if day==0:
    page.locator('[data-action=rdParent]:visible').last.click()
    page.locator('.rd-parent').wait_for()
    row['visibleParent']=text_no_pinyin(page.locator('.rd-parent'))
    row['selects']=page.locator('.rd-parent select').evaluate_all("els=>els.map(e=>({label:e.getAttribute('aria-label'),data:{...e.dataset},options:[...e.options].map(o=>({value:o.value,text:o.textContent,disabled:o.disabled}))}))")
    row['diagnosticData']=page.evaluate("""()=>window.__AMC8_ReadingRuntime.engine().data.diagnostics.sets.map(s=>({id:s.id,week:s.week,courseId:s.courseId,version:s.version,title:s.title}))""")
    row['status']='PARENT_DIRECTORY_OBSERVED';page.screenshot(path=str(OUT/'reading-parent.png'),full_page=True)
   else:
    page.locator('[data-action=rdPlan]:visible').click()
    page.locator(f'[data-action=rdStart][data-day="{day}"]:visible').click()
    page.locator('.rd-story-text').first.wait_for()
    allpan=page.locator('[data-action=rdPanelAll]:visible')
    if allpan.count():allpan.first.click()
    row['story']= [text_no_pinyin(x) for x in page.locator('.rd-story-text:visible').all()]
    row['before']=page.locator('#app').inner_text()[:1600]
    page.screenshot(path=str(OUT/f'reading-day{day}-story.png'),full_page=True)
    page.locator('[data-action=rdReadDone]:visible').click()
    page.locator('.rd-options').wait_for()
    row['questionId']=page.evaluate("()=>window.__AMC8_ReadingRuntime.engine().current().question.id")
    row['visibleQuestion']=text_no_pinyin(page.locator('#app'))
    row['visibleOptions']=[{'index':x.get_attribute('data-index'),'text':text_no_pinyin(x)} for x in page.locator('.rd-options [data-action=rdPick]:visible').all()]
    row['status']='PROMPT_OBSERVED_NO_GRADE'
    page.screenshot(path=str(OUT/f'reading-day{day}-question.png'),full_page=True)
   ctx.close();b.close()
 except Exception as e:row['error']=str(e);row['status']='PARTIAL_OR_BLOCKED'
 (OUT/f'reading-{day}.json').write_text(json.dumps(row,ensure_ascii=False,indent=2))
 return row
try:
 with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:rows=list(pool.map(run,[0,1,2,3]))
 report={'base':BASE,'scope':'V3 F11/H02 directory and F15-F17 independent visible prompt extraction; no grading keys read','rows':rows}
 (OUT/'reading-receipt.json').write_text(json.dumps(report,ensure_ascii=False,indent=2))
 print(json.dumps(report,ensure_ascii=False))
finally:server.shutdown()
