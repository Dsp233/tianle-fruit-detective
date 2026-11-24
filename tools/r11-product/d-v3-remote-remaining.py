#!/usr/bin/env python3
"""D V3 remaining remote visible evidence: diagnostic prompt/identity, story panels and responsive screenshots."""
import concurrent.futures,functools,json,subprocess,threading
from pathlib import Path
from http.server import SimpleHTTPRequestHandler,ThreadingHTTPServer
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[2];BASE='72f2f229246af362f9024db217479357890c8cd3';OUT=ROOT/'r11-probe-output';OUT.mkdir(exist_ok=True)
assert (ROOT/'index.html').read_bytes()==subprocess.check_output(['git','show',BASE+':index.html'],cwd=ROOT)
class H(SimpleHTTPRequestHandler):
 def log_message(self,*a):pass
srv=ThreadingHTTPServer(('127.0.0.1',0),functools.partial(H,directory=str(ROOT)));threading.Thread(target=srv.serve_forever,daemon=True).start()
URL=f'http://127.0.0.1:{srv.server_port}/'
def clean(loc):
 return loc.evaluate("""e=>{let c=e.cloneNode(true);c.querySelectorAll('.rd-pinyin,[hidden]').forEach(x=>x.remove());return c.textContent.trim()}""")
def read_ready(page):
 page.wait_for_function("window.__AMC8_ReadingRuntime && window.__AMC8_ReadingRuntime.engine().status().status==='ready'")
def shot(page,name):
 page.screenshot(path=str(OUT/f'{name}.png'),full_page=True)
def ui(page):
 return page.locator('#app [data-action]:visible').evaluate_all("xs=>xs.map(x=>({action:x.dataset.action,text:x.innerText.slice(0,120),disabled:!!x.disabled}))")
def run(case):
 row={'case':case,'errors':[],'status':'NOT_RUN'}
 try:
  with sync_playwright() as p:
   b=p.chromium.launch(headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
   if case.startswith('layout-'):w,h=map(int,case.split('-')[1:]);vp={'width':w,'height':h}
   else:vp={'width':1024,'height':768}
   c=b.new_context(viewport=vp);page=c.new_page();page.set_default_timeout(12000);page.on('pageerror',lambda e:row['errors'].append(str(e)))
   page.goto(URL,wait_until='domcontentloaded');page.locator('[data-home-hub]').wait_for()
   row['homeActions']=ui(page)
   if case.startswith('layout-'):
    def measure(name):
     data=page.evaluate("""()=>({width:innerWidth,height:innerHeight,scrollWidth:document.documentElement.scrollWidth,bodyScrollWidth:document.body.scrollWidth,app:document.querySelector('#app')?.getBoundingClientRect().toJSON(),buttons:[...document.querySelectorAll('#app button')].filter(e=>e.getClientRects().length).map(e=>({action:e.dataset.action,text:e.innerText.slice(0,50),bounds:e.getBoundingClientRect().toJSON()}))})""")
     shot(page,case+'-'+name);return data
    row['home']=measure('home')
    page.locator('[data-home-hub] [data-action=reading]').click();read_ready(page);row['reading']=measure('reading')
    page.locator('[data-action=rdPlan]:visible').click();page.locator('[data-action=rdStart][data-day="1"]:visible').click();page.locator('.rd-story-text').first.wait_for();row['storyLayout']=measure('story')
    page.goto(URL+'index.html#math',wait_until='domcontentloaded');page.wait_for_function('Boolean(window.__AMC8_MATH_NAV)',timeout=45000);row['math']=measure('math')
    row['status']='LAYOUT_OBSERVED'
   else:
    page.locator('[data-home-hub] [data-action=reading]').click();read_ready(page)
    if case.startswith('diagnostic-'):
     page.locator('[data-action=rdParent]:visible').last.click();page.locator('.rd-parent').wait_for()
     key='BASELINE' if case.endswith('legacy') else 'R2-DRAFT-BASELINE'
     choices=page.locator('[data-action=rdDxSet]:visible');row['diagnosisIds']=choices.evaluate_all("xs=>xs.map(x=>({id:x.dataset.set,label:x.innerText}))")
     page.locator(f'[data-action=rdDxSet][data-set="{key}"]:visible').click()
     row['beforeConfirmDisabled']=page.locator('[data-action=rdDiagnostic]:visible').is_disabled()
     page.locator('[data-action=rdKnowledgeConfirm]:visible').click()
     row['afterConfirmDisabled']=page.locator('[data-action=rdDiagnostic]:visible').is_disabled()
     page.locator('[data-action=rdDiagnostic]:visible').click();page.locator('.rd-story-text').first.wait_for()
    else:
     day=int(case.split('-')[1]);page.locator('[data-action=rdPlan]:visible').click();page.locator(f'[data-action=rdStart][data-day="{day}"]:visible').click();page.locator('.rd-story-text').first.wait_for()
    allpan=page.locator('[data-action=rdPanelAll]:visible')
    if allpan.count():allpan.first.click()
    row['story']=[clean(x) for x in page.locator('.rd-story-text:visible').all()]
    row['pictures']=page.locator('#app img:visible').evaluate_all("xs=>xs.map(x=>({src:x.getAttribute('src'),alt:x.getAttribute('alt'),width:x.naturalWidth,height:x.naturalHeight,complete:x.complete}))")
    shot(page,case+'-story')
    readDone=page.locator('[data-action=rdReadDone]:visible')
    if readDone.count():readDone.click()
    page.wait_for_function("Boolean(window.__AMC8_ReadingRuntime.engine().current()?.question?.id)")
    row['visibleControls']=ui(page)
    row['questionType']=page.evaluate("()=>window.__AMC8_ReadingRuntime.engine().current().question.type")
    row['inputControls']=page.locator('#app input:visible, #app select:visible').evaluate_all("xs=>xs.map(x=>({outer:x.outerHTML.slice(0,300)}))")
    row['questionId']=page.evaluate("()=>window.__AMC8_ReadingRuntime.engine().current().question.id")
    row['question']=clean(page.locator('#app'))
    row['options']=[clean(x) for x in page.locator('.rd-options [data-action=rdPick]:visible').all()]
    row['status']='VISIBLE_PROMPT_OBSERVED_NO_GRADE';shot(page,case+'-quiz')
   c.close();b.close()
 except Exception as e:row['error']=str(e);row['status']='PARTIAL_OR_BLOCKED'
 (OUT/f'{case}.json').write_text(json.dumps(row,ensure_ascii=False,indent=2));return row
try:
 cases=['diagnostic-legacy','diagnostic-current','story-64','story-68']
 with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:rows=list(pool.map(run,cases))
 (OUT/'remote-visible-receipt.json').write_text(json.dumps({'base':BASE,'rows':rows},ensure_ascii=False,indent=2))
 for row in rows:print('REMOTE_ROW '+json.dumps(row,ensure_ascii=False,separators=(',',':')),flush=True)
finally:srv.shutdown()
