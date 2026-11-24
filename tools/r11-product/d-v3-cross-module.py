#!/usr/bin/env python3
"""Existing V3 F22-F25 short journeys, frozen same release, two isolated browser profiles.
Earlier validated inputs used only to reach integration states, never new independent maths credit."""
import json, subprocess, functools, threading, time, hashlib
from pathlib import Path
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[2];OUT=ROOT/'r11-probe-output';OUT.mkdir(exist_ok=True)
BASE='72f2f229246af362f9024db217479357890c8cd3'
assert (ROOT/'index.html').read_bytes()==subprocess.check_output(['git','show',BASE+':index.html'],cwd=ROOT)
D=ROOT/'tools/r11-product'
math={r['id']:r for r in json.loads((D/'d-bulk-expected-01.json').read_text())['rows'] if r['group']=='AMC8-2000-13'}
dx=next(x for x in json.loads((D/'d-v3-remote-expected.json').read_text())['rows'] if x['case']=='diagnostic-current')
card=next(x for x in json.loads((D/'d-reading-independent-expected.json').read_text())['cases'] if x['day']==2)
class H(SimpleHTTPRequestHandler):
 def log_message(self,*a):pass
server=ThreadingHTTPServer(('127.0.0.1',0),functools.partial(H,directory=str(ROOT)));threading.Thread(target=server.serve_forever,daemon=True).start()
url=f'http://127.0.0.1:{server.server_port}/'
def clean(loc):return loc.evaluate("""e=>{let c=e.cloneNode(true);c.querySelectorAll('.rd-pinyin,[hidden]').forEach(x=>x.remove());return c.textContent.trim()}""")
def run(engine):
 row={'engine':engine,'status':'PARTIAL','stages':[],'errors':[],'scope':'F22-F25 short same-profile journey; synthetic desktop browser, not physical iPad or human UAT'}
 try:
  with sync_playwright() as p:
   browser=getattr(p,engine).launch(headless=True,**({'args':['--no-sandbox','--disable-dev-shm-usage']} if engine=='chromium' else {}))
   ctx=browser.new_context(viewport={'width':1024,'height':768},accept_downloads=True)
   page=ctx.new_page();page.set_default_timeout(16000)
   page.on('pageerror',lambda e:row['errors'].append(str(e)))
   page.on('dialog',lambda d:d.accept() if '家长' in d.message and ('确认'in d.message or '调整'in d.message) else d.dismiss())
   def shot(name):page.screenshot(path=str(OUT/f'{engine}-{name}.png'),full_page=True)
   def stage(name,t,details):row['stages'].append({'stage':name,'seconds':round(time.monotonic()-t,3),**details});shot(name)
   def home():page.locator('[data-action=hubHome]:visible').first.click();page.locator('[data-home-hub]').wait_for()
   def rdready():page.wait_for_function("window.__AMC8_ReadingRuntime && window.__AMC8_ReadingRuntime.engine().status().status==='ready'",timeout=45000)
   def rdhome():home();page.locator('[data-home-hub] [data-action=reading]').click();rdready()
   def rdshot(id):return page.evaluate("""id=>{let r=window.__AMC8_ReadingRuntime;return {events:r.snapshot().events.filter(e=>e.type==='attempt'&&e.questionId===id),report:{first:r.report().first,retries:r.report().retries,completedDays:r.report().completedDays}}}""",id)
   def choose(label):
    hits=[x for x in page.locator('[data-action=rdPick]:visible').all() if clean(x)==label];assert len(hits)==1,label
    hits[0].click();page.locator('[data-action=rdSubmit]:visible').click()
   def storage():return page.evaluate("""()=>Object.fromEntries(Object.keys(localStorage).filter(k=>!k.startsWith('tianle_q0_production_review')).sort().map(k=>[k,localStorage.getItem(k)]))""")
   def digest(obj):return hashlib.sha256(json.dumps(obj,ensure_ascii=False,sort_keys=True).encode()).hexdigest()
   t=time.monotonic();page.goto(url,wait_until='domcontentloaded');page.locator('[data-home-hub]').wait_for();stage('home',t,{})
   t=time.monotonic();page.locator('[data-home-hub] [data-action=home]').click()
   page.wait_for_function("Boolean(window.__AMC8_MATH_NAV) && typeof progressStore!=='undefined' && progressStore.getStatus()==='ready'",timeout=45000)
   stage('math-ready',t,{})
   t=time.monotonic();group='AMC8-2000-13'
   topics=page.evaluate("""id=>{let ts=SKILL_DATA.units.map(u=>u.id);const available=xs=>ExamMappingUI.connectedAvailability(SourceCatalog.profile({sourceIds:['AMC8'],examIds:[id],topicIds:xs}));if(!available(ts))return [];for(const x of [...ts]){let next=ts.filter(y=>x!==y);if(available(next)>0)ts=next}return ts}""",group);assert topics
   page.locator('[data-action=topicParentUnlock]:visible').first.click()
   for topic in topics:
    b=page.locator(f'[data-action=topicSelect][data-code="{topic}"]:visible')
    if b.get_attribute('aria-pressed')!='true':
     b.click();page.wait_for_function("""id=>[...document.querySelectorAll('[data-action=topicSelect]')].some(b=>b.dataset.code===id&&b.getAttribute('aria-pressed')==='true') && progressStore.getStatus()==='ready'""",arg=topic)
   picker=page.locator('[data-source-exam-picker]')
   if not picker.is_visible():page.get_by_text('细化已掌握知识 / 指定真题',exact=True).click()
   picker.select_option(group);page.locator('[data-action=sourceExamReplace]:visible').click()
   page.wait_for_function("(id)=>document.querySelector('[data-selected-exam-summary]')?.innerText.includes(id) && progressStore.getStatus()==='ready'",arg=group)
   page.locator('[data-action=topicStart]:visible:enabled').first.click()
   page.wait_for_function("""()=>{const a=ExamMappingUI.exportDraft().record?.sessions?.active,el=document.querySelector('[data-rtm-task]');return !!a&&a.submissionOrdinal===0&&progressStore.getStatus()==='ready'&&el?.getAttribute('data-rtm-task')===a.id}""")
   a=page.evaluate("()=>ExamMappingUI.exportDraft().record.sessions.active");e=math[a['id']];task=page.locator('[data-rtm-task]')
   assert ''.join(task.locator('.task-title').inner_text().split())==''.join(e['prompt'].split())
   if e['options']:
    hits=[x for x in task.locator('[data-action=rtmChoice]:visible').all() if x.inner_text().strip()==e['answer']];assert len(hits)==1;hits[0].click()
   else:task.locator('[data-rtm-input]:visible').fill(e['answer'])
   task.locator('[data-action=rtmSubmit]:visible').click()
   page.wait_for_function("""id=>{const a=ExamMappingUI.exportDraft().record?.sessions?.active;return a?.attemptId===id&&a.submissionOrdinal===1&&a.feedback?.outcome==='VERIFIED'&&progressStore.getStatus()==='ready'}""",arg=a['attemptId'])
   math_record=page.evaluate("()=>ExamMappingUI.exportDraft().record")
   stage('math-graded',t,{'id':a['id'],'attemptId':a['attemptId'],'recordDigest':digest(math_record),'credit':'TRANSIT_REPLAY'})
   t=time.monotonic();rdhome();stage('reading-ready',t,{})
   t=time.monotonic();page.locator('[data-action=rdParent]:visible').last.click();page.locator('.rd-parent').wait_for()
   page.locator('[data-action=rdDxSet][data-set="R2-DRAFT-BASELINE"]:visible').click()
   assert page.locator('[data-action=rdDiagnostic]:visible').is_disabled()
   page.locator('[data-action=rdKnowledgeConfirm]:visible').click();page.locator('[data-action=rdDiagnostic]:visible').click()
   page.locator('.rd-story-text').first.wait_for()
   done=page.locator('[data-action=rdReadDone]:visible')
   if done.count():done.click()
   page.wait_for_function("id=>window.__AMC8_ReadingRuntime.engine().current()?.question?.id===id",arg=dx['id'])
   choose(dx['actions'][0]);page.wait_for_function("id=>window.__AMC8_ReadingRuntime.snapshot().events.some(e=>e.type==='attempt'&&e.questionId===id)",arg=dx['id']);rdready()
   dx_before=rdshot(dx['id']);stage('new-diagnostic',t,{'questionId':dx['id'],'observed':dx_before})
   t=time.monotonic();rdhome();page.locator('[data-action=rdPlan]:visible').click();page.locator('[data-action=rdStart][data-day="2"]:visible').click()
   page.locator('.rd-story-text').first.wait_for();page.locator('[data-action=rdReadDone]:visible').click()
   page.wait_for_function("id=>window.__AMC8_ReadingRuntime.engine().current()?.question?.id===id",arg=card['id'])
   choose(card['correct']);page.wait_for_function("id=>window.__AMC8_ReadingRuntime.snapshot().events.some(e=>e.type==='attempt'&&e.questionId===id)",arg=card['id']);rdready()
   card_before=rdshot(card['id'])
   details=page.locator('#app details').filter(has=page.locator('summary').filter(has_text='核对理由'));assert details.count()==1
   details.locator('summary').click();assert details.get_attribute('open') is not None
   card_after=rdshot(card['id']);assert card_before==card_after
   assert rdshot(dx['id'])['events']==dx_before['events']
   stage('optional-card',t,{'questionId':card['id'],'observed':card_after,'noScoreChange':True,'dxAttemptsUnchanged':True})
   t=time.monotonic();home();root=page.locator('#amc8-review-layer');root.locator('#toggle-review').wait_for()
   before=storage();root.locator('#toggle-review').click();page.locator('[data-home-hub] [data-action=home]').click(force=True)
   if root.locator('#confirm-region').count():root.locator('#confirm-region').click()
   root.locator('#edit-modal').wait_for(state='visible');assert page.locator('[data-home-hub]').count()==1
   root.locator('#note-text').fill('F22-F25 synthetic cross-module note');root.locator('#save-annotation').click()
   root.locator('#review-markers .review-pin').first.wait_for();root.locator('#open-list').click()
   root.locator('#review-list-title').fill('Cross-module synthetic');root.locator('#export-filename').fill(f'{engine}-cross-module.md')
   with page.expect_download() as event:root.locator('#download-md').click()
   event.value.save_as(str(OUT/f'{engine}-cross-module.md'));assert 'F22-F25 synthetic cross-module note' in (OUT/f'{engine}-cross-module.md').read_text()
   root.locator('#close-list').click()
   assert before==storage()
   stage('q0',t,{'learningStorageUnchanged':True,'download':event.value.suggested_filename,'learningStorageDigest':digest(before)})
   t=time.monotonic();page.reload(wait_until='domcontentloaded');page.locator('[data-home-hub]').wait_for()
   page.locator('[data-home-hub] [data-action=home]').click();page.wait_for_function("Boolean(window.__AMC8_MATH_NAV)&&typeof progressStore!=='undefined'&&progressStore.getStatus()==='ready'",timeout=45000)
   final_math=page.evaluate("()=>ExamMappingUI.exportDraft().record")
   row['mathExactRecordRetained']=final_math==math_record
   # The UI can legitimately change session navigation; compare the saved attempts if record is not byte-for-byte stable.
   row['mathBeforeDigest']=digest(math_record);row['mathAfterDigest']=digest(final_math)
   if not row['mathExactRecordRetained']:
    row['mathChangedTopLevel']=[k for k in set(math_record)|set(final_math) if math_record.get(k)!=final_math.get(k)]
   rdhome();row['diagnosticAttemptsRetained']=rdshot(dx['id'])['events']==dx_before['events']
   row['cardAttemptsRetained']=rdshot(card['id'])['events']==card_after['events']
   stage('reload-retention',t,{k:v for k,v in row.items() if k.endswith('Retained')})
   row['status']='PASS' if row['mathExactRecordRetained'] and row['diagnosticAttemptsRetained'] and row['cardAttemptsRetained'] and not row['errors'] else 'REVIEW'
   ctx.close();browser.close()
 except Exception as e:row['error']=str(e)
 (OUT/f'{engine}-cross-module.json').write_text(json.dumps(row,ensure_ascii=False,indent=2))
 print('CROSS_ROW '+json.dumps(row,ensure_ascii=False,separators=(',',':')),flush=True)
 return row
try:
 for engine in ['chromium','webkit']:run(engine)
finally:server.shutdown()
