"""Remote-only V3 remaining control delta; isolated synthetic browser profiles."""
import hashlib,json,re,time,traceback
from pathlib import Path
from playwright.sync_api import sync_playwright
OUT=Path('r11-probe-output');OUT.mkdir(exist_ok=True)
URL='https://dsp233.github.io/tianle-fruit-detective/index.html#math'
EXPECTED='d51b53efa75987524e998737af53e57c8447ff7734d34806012f6cdaec17f69b'
def ready(p):
 p.wait_for_function("Boolean(window.__AMC8_MATH_NAV) && typeof progressStore!=='undefined' && progressStore.getStatus()==='ready'",timeout=60000)
def page(ctx):
 p=ctx.new_page();p.set_default_timeout(15000);p.goto(URL,wait_until='domcontentloaded');ready(p);return p
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

report={'base':'3f22d8002406857a33a3e254ebafc4366f6cec51','scope':'V3 remote actual public browser; no new math answer credit','checks':{},'errors':[]}
def controls(p):
 return p.locator('button:visible').evaluate_all("xs=>xs.map(x=>({action:x.dataset.action,text:x.innerText,disabled:x.disabled}))")
def shot(p,n):
 p.screenshot(path=str(OUT/(n+'.png')),full_page=True)
def identity(p):
 response=p.request.get(URL.split('#')[0]+'?d='+str(time.time_ns()),headers={'Cache-Control':'no-cache'})
 assert response.ok
 return {'url':response.url,'sha256':hashlib.sha256(response.body()).hexdigest(),'status':response.status}
try:
 with sync_playwright() as pw:
  b=pw.chromium.launch(headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
  ctx=b.new_context(viewport={'width':1024,'height':768},accept_downloads=True)
  pg=ctx.new_page();pg.set_default_timeout(15000)
  report['beforeIdentity']=identity(pg);assert report['beforeIdentity']['sha256']==EXPECTED
  start=time.monotonic();pg.goto(URL,wait_until='domcontentloaded');ready(pg);report['mathColdSeconds']=round(time.monotonic()-start,3)
  select_decision(pg)
  pg.locator('[data-action=rtmChoice]:visible').filter(has_text=re.compile('^3\\+2$')).click()
  pg.wait_for_function("progressStore.getStatus()==='ready'")
  old=pg.evaluate(active);pre=pg.evaluate(events)
  btn=pg.locator('[data-action=rtmSubmit]:visible');box=btn.bounding_box()
  assert box
  pg.mouse.dblclick(box['x']+box['width']/2,box['y']+box['height']/2,delay=0)
  pg.wait_for_function("progressStore.getStatus()==='ready'")
  pg.wait_for_timeout(300)
  after=pg.evaluate(active);ev=pg.evaluate(events)
  added=[e for e in ev if e not in pre]
  report['checks']['D03']={'before':old,'after':after,'newResponseEvents':added,'status':'PASS' if after and after['ordinal']==1 and len(added)==1 else 'REVIEW'}
  shot(pg,'double-submit')
  pg.reload(wait_until='domcontentloaded');ready(pg)
  report['checks']['M03']={'status':'PASS' if all(e in pg.evaluate(events) for e in added) and added else 'REVIEW','eventsPreserved':all(e in pg.evaluate(events) for e in added)}
  # Offline/online synthetic profile: saved response must survive. No claim about uncached resource availability.
  try:
   if pg.locator('[data-action=rtmBack]:visible').count():pg.locator('[data-action=rtmBack]:visible').click()
   if pg.locator('[data-action=rtmConnectedResume]:visible').count():pg.locator('[data-action=rtmConnectedResume]:visible').click()
   ctx.set_offline(True);pg.wait_for_timeout(100)
   offline={'online':pg.evaluate('navigator.onLine'),'eventsPreserved':all(e in pg.evaluate(events) for e in added),'storeStatus':pg.evaluate('progressStore.getStatus()')}
   ctx.set_offline(False);pg.reload(wait_until='domcontentloaded');ready(pg)
   report['checks']['D04']={'offline':offline,'recovery':all(e in pg.evaluate(events) for e in added),'status':'PARTIAL_SAVED_RECORD_RECOVERY'}
  except Exception as e:
   ctx.set_offline(False);report['checks']['D04']={'status':'REVIEW','error':str(e)}
  try:
   if pg.locator('[data-action=rtmBack]:visible').count():pg.locator('[data-action=rtmBack]:visible').click()
   # Real parent disclosure and history entry.
   parent=pg.get_by_text('家长查看',exact=True)
   if parent.count() and parent.first.is_visible():parent.first.click()
   pg.locator('[data-action=rtmOpen]:visible').first.click()
   report['historyControls']=controls(pg)
   report['historyText']=pg.locator('body').inner_text()[-12000:]
   shot(pg,'math-history')
   dl=pg.get_by_role('button',name=re.compile('导出|下载'))
   if dl.count() and dl.first.is_visible():
    with pg.expect_download(timeout=15000) as info:dl.first.click()
    d=info.value;target=OUT/('export-'+d.suggested_filename);d.save_as(target)
    raw=target.read_bytes();report['checks']['M05']={'status':'PASS' if b'RTM-2016-09-DECISION' in raw else 'REVIEW','filename':target.name,'bytes':len(raw),'sha256':hashlib.sha256(raw).hexdigest(),'containsTask':b'RTM-2016-09-DECISION' in raw}
   else:report['checks']['M05']={'status':'PARTIAL_HISTORY_OPENED_NO_DOWNLOAD'}
  except Exception as e:report['checks']['M05']={'status':'REVIEW','error':str(e),'controls':controls(pg)}
  # Compare warm entry identity and observe reading route independently.
  start=time.monotonic();pg.goto(URL,wait_until='domcontentloaded');ready(pg);report['mathWarmSeconds']=round(time.monotonic()-start,3)
  report['afterIdentity']=identity(pg)
  report['checks']['A02_F25_identity']={'status':'PASS' if report['beforeIdentity']['sha256']==report['afterIdentity']['sha256']==EXPECTED else 'REVIEW','scope':'public index identity before/after; five-file C hashes referenced separately'}
  ctx.close();b.close()
except Exception as e:report['errors'].append(traceback.format_exc())
finally:
 (OUT/'d-v3-remote-final.json').write_text(json.dumps(report,ensure_ascii=False,indent=2))
 print('D_V3_REMOTE_FINAL '+json.dumps(report,ensure_ascii=False),flush=True)
