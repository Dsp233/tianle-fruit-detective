#!/usr/bin/env python3
"""Existing V3 F22-F25 short journeys, frozen same release, two isolated browser profiles.
Earlier validated inputs used only to reach integration states, never new independent maths credit."""
import json, subprocess, functools, threading, time, hashlib, traceback
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
 row={'engine':engine,'status':'PARTIAL','stages':[],'errors':[],'scope':'M02/M04/M05 control delta only; previously solved task, no new grade credit'}
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
   assert e['options'],'expected real choice task'
   hits=[x for x in task.locator('[data-action=rtmChoice]:visible').all() if x.inner_text().strip()==e['answer']];assert len(hits)==1
   hits[0].click()
   page.wait_for_function("()=>{let a=ExamMappingUI.exportDraft().record?.sessions?.active;return !!a?.input&&a.submissionOrdinal===0&&progressStore.getStatus()==='ready'}")
   draft=page.evaluate("()=>ExamMappingUI.exportDraft().record.sessions.active")
   row['draft']={k:draft.get(k) for k in ['id','attemptId','input','submissionOrdinal','helpLevel']}
   row['beforeCloseControls']=page.locator('#app button:visible').evaluate_all("xs=>xs.map(e=>({action:e.dataset.action,text:e.innerText,disabled:e.disabled}))")
   stage('draft-saved',t,row['draft'])
   page.close();page=ctx.new_page();page.set_default_timeout(10000);page.on('pageerror',lambda e:row['errors'].append(str(e)))
   page.goto(url+'index.html#math',wait_until='domcontentloaded')
   page.wait_for_function("Boolean(window.__AMC8_MATH_NAV)&&typeof progressStore!=='undefined'&&progressStore.getStatus()==='ready'",timeout=45000)
   resumed=page.evaluate("()=>ExamMappingUI.exportDraft().record.sessions.active")
   row['draftRetained']=all(resumed.get(k)==draft.get(k) for k in ['id','attemptId','input','submissionOrdinal','helpLevel'])
   row['reopenControls']=page.locator('#app button:visible').evaluate_all("xs=>xs.map(e=>({action:e.dataset.action,text:e.innerText,disabled:e.disabled}))")
   stage('draft-reopen',time.monotonic(),{'draftRetained':row['draftRetained']})
   task=page.locator('[data-rtm-task]')
   if not task.is_visible():
    resumes=page.locator('[data-action=rtmOpen]:visible')
    if resumes.count()==1:resumes.click()
    else:
     start=page.locator('[data-action=topicStart]:visible:enabled')
     if start.count():start.first.click()
   if task.is_visible():
    row['resumedTaskId']=task.get_attribute('data-rtm-task')
    row['resumedVisibleControls']=task.locator('button:visible').evaluate_all("xs=>xs.map(e=>({action:e.dataset.action,text:e.innerText,pressed:e.getAttribute('aria-pressed'),className:e.className}))")
    row['sameTaskReopened']=row['resumedTaskId']==draft['id']
    if row['sameTaskReopened']:
     exits=page.locator('[data-action=hubHome]:visible')
     if exits.count():
      dialogs=[]
      def cancel_dialog(d):
       dialogs.append({'type':d.type,'message':d.message});d.dismiss()
      page.on('dialog',cancel_dialog)
      exits.first.click();page.wait_for_timeout(300)
      row['leaveDialogs']=dialogs;row['leaveVisibleText']=page.locator('#app').inner_text()[:4000]
      cancel=page.get_by_role('button',name='取消',exact=True)
      if cancel.count()==1 and cancel.is_visible():cancel.click();page.wait_for_timeout(300);row['inlineCancel']=True
      row['cancelObserved']=bool(dialogs or row.get('inlineCancel'))
      row['cancelRetained']=task.is_visible() and page.evaluate("()=>ExamMappingUI.exportDraft().record.sessions.active.attemptId")==draft['attemptId']
      stage('leave-attempt',time.monotonic(),{'cancelObserved':row['cancelObserved'],'cancelRetained':row['cancelRetained']})
   # Read-only history/export from real visible controls; use no new grade credit.
   hist=page.locator('[data-action=rtmHistory]:visible')
   if hist.count():
    hist.first.click();page.locator('[data-rtm-history]').wait_for(state='visible')
    row['historyText']=page.locator('[data-rtm-history]').inner_text()[:5000]
    stage('history',time.monotonic(),{})
   exp=page.locator('[data-action=progressExport]:visible')
   if exp.count():
    with page.expect_download(timeout=10000) as d:exp.first.click()
    file=OUT/'math-control-export.json';d.value.save_as(str(file));raw=file.read_text();row['export']={'name':d.value.suggested_filename,'sha256':hashlib.sha256(file.read_bytes()).hexdigest(),'attemptFound':draft['attemptId'] in raw,'taskFound':draft['id'] in raw};json.loads(raw)
   row['status']='OBSERVED_DRAFT_RETAINED' if row['draftRetained'] else 'REVIEW'
   ctx.close();browser.close()
 except Exception as e:row['error']=repr(e);row['traceback']=traceback.format_exc()
 (OUT/f'{engine}-math-control.json').write_text(json.dumps(row,ensure_ascii=False,indent=2))
 print('MATH_CONTROL_ROW '+json.dumps(row,ensure_ascii=False,separators=(',',':')),flush=True)
 return row
try:
 for engine in ['chromium']:run(engine)
finally:server.shutdown()
