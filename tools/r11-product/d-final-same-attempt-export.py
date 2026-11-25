"""D independent public entry/return delta; previously frozen answers transit only."""
import hashlib,json,re,time,traceback,concurrent.futures,os
from pathlib import Path
from playwright.sync_api import sync_playwright
OUT=Path('r11-probe-output');OUT.mkdir(exist_ok=True)
BASE='fcef9785308363379b028129871c92700e1f93d4'
ROOT=Path(os.environ['D_PRODUCT'])
PUB='https://dsp233.github.io/tianle-fruit-detective/'
URL=PUB+'index.html#math'
def math_ready(p):
 p.wait_for_function("Boolean(window.__AMC8_MATH_NAV) && typeof progressStore!=='undefined' && progressStore.getStatus()==='ready'",timeout=60000)
def page(ctx):
 p=ctx.new_page();p.set_default_timeout(15000);p.goto(URL,wait_until='domcontentloaded');math_ready(p);return p
active="""()=>{let a=ExamMappingUI.exportDraft().record?.sessions?.active;return a?{id:a.id,attemptId:a.attemptId,ordinal:a.submissionOrdinal,help:a.helpLevel,input:a.input,outcome:a.feedback?.outcome??null}:null}"""
events="""()=>{let result=[];const seen=new Set();function walk(o){if(!o||typeof o!=='object'||seen.has(o))return;seen.add(o);if(o.type==='response_submitted')result.push(o);for(const v of Object.values(o))walk(v)}walk(ExamMappingUI.exportDraft().record);return result}"""
def select_decision(p):
 p.on('dialog',lambda d:d.accept() if '家长' in d.message and ('确认'in d.message or '调整'in d.message) else d.dismiss())
 p.locator('[data-action=topicParentUnlock]:visible').first.click()
 for topic in ['A01','A02','N01','N02']:
  button=p.locator(f'[data-action=topicSelect][data-code="{topic}"]:visible')
  if button.get_attribute('aria-pressed')!='true':
   button.click();p.wait_for_function("""id=>document.querySelector('[data-action=topicSelect][data-code="'+id+'"]')?.getAttribute('aria-pressed')==='true' && progressStore.getStatus()==='ready'""",arg=topic)
 picker=p.locator('[data-source-exam-picker]')
 if not picker.is_visible():p.get_by_text('细化已掌握知识 / 指定真题',exact=True).click()
 picker.select_option('AMC8-2016-09');p.locator('[data-action=sourceExamReplace]:visible').click()
 p.wait_for_function("document.querySelector('[data-selected-exam-summary]')?.innerText.includes('AMC8-2016-09') && progressStore.getStatus()==='ready'")
 p.locator('[data-action=topicStart]:visible:enabled').first.click()
 p.wait_for_function("""()=>{let a=ExamMappingUI.exportDraft().record?.sessions?.active;return a?.id==='RTM-2016-09-DECISION'&&a.submissionOrdinal===0&&progressStore.getStatus()==='ready'}""")
 task=p.locator('[data-rtm-task]')
 assert task.locator('.task-title').inner_text()=='72=2³×3²，不同质因数之和如何求？'
 assert set(task.locator('[data-action=rtmChoice]:visible').all_inner_texts())=={'2+3','3+2','2+2+2+3+3'}
def submit(p,value,want):
 before=p.evaluate(active)
 task=p.locator('[data-rtm-task]')
 task.locator('[data-action=rtmChoice]:visible').filter(has_text=re.compile('^'+re.escape(value)+'$')).click()
 p.wait_for_function("progressStore.getStatus()==='ready'")
 task.locator('[data-action=rtmSubmit]:visible').click()
 p.wait_for_function("""a=>{let x=ExamMappingUI.exportDraft().record?.sessions?.active;return x?.attemptId===a.attemptId&&x.submissionOrdinal===a.ordinal+1&&!!x.feedback?.outcome&&progressStore.getStatus()==='ready'}""",arg=before)
 after=p.evaluate(active);assert after['outcome']==want and after['help']==0,after
 return after



# Reuse the known decision as behavior transit; no new mathematics grade.
def one(engine,profile):
 x={'engine':engine,'profile':profile,'checks':{},'errors':[]}
 with sync_playwright() as pw:
  b=getattr(pw,engine).launch(headless=True,**({'args':['--no-sandbox','--disable-dev-shm-usage']} if engine=='chromium' else {}))
  ctx=b.new_context(viewport={'width':1024,'height':768},accept_downloads=True)
  p=ctx.new_page();p.set_default_timeout(12000)
  def act(a):return p.locator(f'[data-action={a}]:visible')
  def shot(n):p.screenshot(path=str(OUT/f'{engine}-{profile}-{n}.png'),full_page=True)
  def controls():return p.locator('#app button:visible').evaluate_all("xs=>xs.map(e=>({action:e.dataset.action,text:e.innerText,disabled:e.disabled}))")
  def ev():return p.evaluate("()=>ExamMappingUI.exportDraft().record.eventsById")
  try:
   p.goto(URL,wait_until='domcontentloaded');math_ready(p)
   # Observe cancellation before exercising the normal authorized route.
   gate=act('topicParentUnlock').first
   before=p.evaluate("()=>ExamMappingUI.exportDraft().record")
   dialogs=[]
   def deny(d):
    dialogs.append({'type':d.type,'message':d.message});d.dismiss()
   p.on('dialog',deny)
   gate.click();math_ready(p)
   p.remove_listener('dialog',deny)
   x['checks']['gateCancel']={'dialogs':dialogs,'before':before,'after':p.evaluate("()=>ExamMappingUI.exportDraft().record"),'controls':controls()}
   shot('gate-cancel')
   # If click opens directly (no cancel dialog), record this and relock, not a pass.
   if not dialogs:
    gate.click();math_ready(p)
   select_decision(p)
   task=p.locator('[data-rtm-task]');task.locator('[data-action=rtmChoice]:visible').filter(has_text=re.compile(r'^2\+2\+2\+3\+3$')).click();math_ready(p);task.locator('[data-action=rtmSubmit]:visible').click();math_ready(p);p.wait_for_function("()=>{let a=ExamMappingUI.exportDraft().record.sessions.active;return a?.submissionOrdinal===1&&!!a.feedback?.outcome}");wrong=p.evaluate(active);assert wrong['outcome']!='VERIFIED',wrong
   x['checks']['firstWrong']=wrong;first=ev();shot('wrong')
   # Actual help controls, each step explicitly observed.
   for _ in range(3):
    hints=act('rtmHint')
    if not hints.count():hints=p.get_by_role('button',name=re.compile('提示|下一条提示'),exact=False)
    if not hints.count() or not hints.first.is_enabled():break
    hints.first.click();math_ready(p)
    x['checks'].setdefault('help',[]).append({'active':p.evaluate(active),'controls':controls()})
    shot('hint'+str(_))
   # No assertion about independent grading; exercise correction in same attempt.
   task=p.locator('[data-rtm-task]');task.locator('[data-action=rtmChoice]:visible').filter(has_text=re.compile(r'^3\+2$')).click();math_ready(p)
   task.locator('[data-action=rtmSubmit]:visible').click();math_ready(p)
   p.wait_for_function("()=>{let a=ExamMappingUI.exportDraft().record.sessions.active;return a?.submissionOrdinal>=2&&!!a.feedback?.outcome}")
   after=ev();x['checks']['correction']={'active':p.evaluate(active),'firstRetained':all(after.get(k)==v for k,v in first.items()),'events':after}
   shot('corrected')
   p.get_by_role('button',name='返回首页',exact=True).click();math_ready(p)
   parent=p.get_by_text('家长查看',exact=True)
   if parent.count() and parent.first.is_visible():parent.first.click()
   if act('progress').count():act('progress').first.click()
   math_ready(p);hist=act('rtmHistory');assert hist.count();hist.first.click()
   p.locator('[data-rtm-history]').wait_for();x['checks']['history']={'text':p.locator('[data-rtm-history]').inner_text()[:3500],'exactEvents':ev()==after,'controls':controls()};shot('history')
   p.reload(wait_until='domcontentloaded');math_ready(p);x['checks']['reloadExact']=ev()==after
   if act('rtmConnectedResume').count():act('rtmConnectedResume').first.click();math_ready(p)
   x['checks']['resume']={'active':p.evaluate(active),'exactEvents':ev()==after};shot('resume')
   # Real export of this very same wrong/help/correction attempt after refresh.
   if not act('progressExport').count():
    home=p.get_by_role('button',name='返回首页',exact=True)
    if home.count():home.first.click();math_ready(p)
    parent=p.get_by_text('家长查看',exact=True)
    if parent.count() and parent.first.is_visible():parent.first.click()
    if act('progress').count():act('progress').first.click();math_ready(p)
   assert act('progressExport').count()==1
   with p.expect_download(timeout=15000) as dl:act('progressExport').first.click()
   dest=OUT/f'{engine}-{profile}-actual-export.json';dl.value.save_as(str(dest))
   data=json.loads(dest.read_text())
   # Compare complete event maps, never recursive partial summaries.
   candidate=data.get('rtmDraft',{}).get('record',{}).get('eventsById',{})
   if not candidate:candidate=data.get('record',{}).get('rtm1',{}).get('eventsById',{})
   responses=[v for v in after.values() if v.get('type')=='response_submitted' and v.get('attemptId')==wrong['attemptId']]
   x['checks']['export']={'sha256':hashlib.sha256(dest.read_bytes()).hexdigest(),'eventsExact':candidate==after,'priorEventsRetained':all(candidate.get(k)==v for k,v in after.items()),'sameAttemptResponses':responses,'currentEventsExact':ev()==after,'helpLevels':[a['active']['help'] for a in x['checks'].get('help',[])]}
   ctx.storage_state(path=str(OUT/f'{engine}-{profile}-storage.json'))
   shot('export')
   x['status']='OBSERVED'
  except Exception as e:
   x['status']='PARTIAL';x['errors'].append(repr(e))
   try:x['controls']=controls();x['visible']=p.locator('#app').inner_text()[:2000];shot('error')
   except:pass
  finally:ctx.close();b.close()
 return x
with concurrent.futures.ThreadPoolExecutor(max_workers=2) as pool:
 rows=list(pool.map(lambda e:one(e,'history-help'),['chromium','webkit']))
(OUT/'d-final-same-attempt-export.json').write_text(json.dumps(rows,ensure_ascii=False,indent=2))
for x in rows:print('D_SAME_ATTEMPT '+json.dumps(x,ensure_ascii=False),flush=True)
