"""Only previously unexecuted original clauses. Reuse persisted browser state and frozen answers."""
import time
from pathlib import Path
exec(Path("tools/r11-product/d-v3-public-natural-only-20261128.py").read_text().split("# Only uncovered public widths")[0])
CASE=os.environ['D_CASE']
KEY='tianle_amc8_question_design_v1'
x={'engine':ENGINE,'case':CASE,'formal':'fcef9785308363379b028129871c92700e1f93d4','checks':{},'errors':[]}
def raw(p):return p.evaluate("k=>localStorage.getItem(k)",KEY)
def events(p):return state_report(p)['eventsById']
def view(p):return {'status':p.evaluate("progressStore.getStatus()"),'text':p.locator('#app').inner_text()[:3500],'controls':controls(p),'active':active(p)}
def resume(p):
 ready_profile(p)
 if not p.locator('[data-rtm-task]').is_visible():
  z=loc(p,'rtmConnectedResume')
  if z.count():z.first.click();ready(p)
 wait_task(p)
def choose_answer(p):
 a=active(p);e=expected[a['id']];assert fingerprint(p,e),'frozen question mismatch'
 t=p.locator('[data-rtm-task]');cs=t.locator('[data-action=rtmChoice]:visible')
 if cs.count():
  m=[i for i in cs.all() if norm(i.inner_text())==norm(e['answer'])]
  assert len(m)==1
  m[0].click()
 else:t.locator('[data-rtm-input]:visible').fill(str(e['answer']))
 ready(p);return a,e
def verify_identity(p):
 resp=p.request.get(PUB+'index.html?d-delta='+str(time.time_ns()),headers={'Cache-Control':'no-cache'})
 assert resp.ok
 h=hashlib.sha256(resp.body()).hexdigest();assert h==hashlib.sha256((ROOT/'index.html').read_bytes()).hexdigest()
 return h
def natural(p,ctx):
 resume(p);base=events(p);steps=[];old={v.get('taskId') for v in base.values() if v.get('type')=='response_submitted'}
 for i in range(10):
  a=active(p);e=expected.get(a['id']);z={'id':a['id'],'attemptId':a['attemptId'],'group':a.get('originProblemGroupId'),'prior':a['id'] in old,'before':a,'shot':snap(p,'natural-'+str(i))};steps.append(z);x['checks']['steps']=steps
  if not e or not fingerprint(p,e):z['gap']='NO_FROZEN_EXACT_ANSWER';break
  if a['submissionOrdinal'] or z['prior']:z['gap']='PREVIOUSLY_SUBMITTED';break
  z['derivation']=e.get('derivation');z['credit']=e.get('credit');z['after']=submit_label(p,e,e['answer']);z['afterShot']=snap(p,'natural-after-'+str(i))
  if z['after']['feedback']['outcome']!='VERIFIED':break
  if not next_task(p):
   math_home(p);s=loc(p,'topicStart')
   if not s.count() or not s.first.is_enabled():z['nextBlocked']=view(p);break
   s.first.click();ready(p);wait_task(p)
 x['checks']['historyRetained']=retained(base,events(p))
 x['checks']['newEvents']=[v for k,v in events(p).items() if k not in base]
 x['checks']['completed']=sum(1 for z in steps if (z.get('after') or {}).get('feedback',{}).get('outcome')=='VERIFIED')
 # Actual return to parent review after original application, preserve event identities.
 math_home(p);x['checks']['returnHome']=view(p)
 ctx.storage_state(path=str(OUT/'natural-continuation-storage.json'))
def quota(p,ctx):
 resume(p);a,e=choose_answer(p);base=events(p);before=raw(p)
 p.evaluate("""k=>{window.__dOriginalSet=Storage.prototype.setItem;Storage.prototype.setItem=function(n,v){if(n===k)throw new DOMException('controlled answer quota','QuotaExceededError');return window.__dOriginalSet.call(this,n,v)}}""",KEY)
 p.locator('[data-rtm-task] [data-action=rtmSubmit]:visible').click()
 p.wait_for_timeout(350);x['checks']['failedSave']={'view':view(p),'rawUnchanged':raw(p)==before,'oldEventsRetained':retained(base,events(p)),'shot':snap(p,'quota-answer')}
 export=p.get_by_role('button',name='导出记录与草稿',exact=True)
 if export.count():
  with p.expect_download() as dl:export.click()
  f=OUT/'quota-unsaved-answer.json';dl.value.save_as(str(f));x['checks']['export']={'sha256':hashlib.sha256(f.read_bytes()).hexdigest(),'bytes':f.stat().st_size,'containsAttempt':a['attemptId'] in f.read_text()}
 p.evaluate("()=>Storage.prototype.setItem=window.__dOriginalSet")
 retry=p.get_by_role('button',name='重试保存权限',exact=True)
 if retry.count():retry.click()
 ready(p);post=events(p);x['checks']['recovered']={'view':view(p),'rawChanged':raw(p)!=before,'oldEventsRetained':retained(base,post),'newEvents':[v for k,v in post.items() if k not in base],'shot':snap(p,'quota-recovered')}
 p.reload(wait_until='domcontentloaded');ready(p);x['checks']['reload']={'active':active(p),'allEventsRetained':retained(post,events(p)),'shot':snap(p,'quota-reload')}
def tab(p,ctx):
 resume(p);a,e=choose_answer(p);base=events(p);before=raw(p)
 q=ctx.new_page();q.goto(URL,wait_until='domcontentloaded')
 q.wait_for_function("typeof progressStore!=='undefined'&&['read_only','ready','conflict'].includes(progressStore.getStatus())",timeout=45000)
 x['checks']['secondBefore']={'view':view(q),'shot':snap(q,'second-tab-before'),'sameAttempt':(active(q) or {}).get('attemptId')==a['attemptId']}
 if not q.locator('[data-rtm-task]').is_visible() and loc(q,'rtmConnectedResume').count():loc(q,'rtmConnectedResume').first.click()
 submit=loc(q,'rtmSubmit')
 x['checks']['secondSubmit']={'visible':bool(submit.count()),'enabled':bool(submit.count() and submit.first.is_enabled())}
 if submit.count() and submit.first.is_enabled():submit.first.click();q.wait_for_timeout(300)
 x['checks']['secondAfter']={'view':view(q),'rawUnchanged':raw(p)==before,'shot':snap(q,'second-tab-after')}
 q.close();p.bring_to_front();p.locator('[data-rtm-task] [data-action=rtmSubmit]:visible').click();ready(p);post=events(p)
 x['checks']['writer']={'active':active(p),'oldEventsRetained':retained(base,post),'newEvents':[v for k,v in post.items() if k not in base]}
 p.reload(wait_until='domcontentloaded');ready(p)
 x['checks']['reload']={'allEventsRetained':retained(post,events(p)),'active':active(p),'shot':snap(p,'writer-reload')}
def remote(p,ctx):
 resume(p);base=events(p);before=active(p);x['checks']['before']=before
 # Missing exact 375 width, zoomed text and keyboard focus observations.
 r=[]
 def layout(label):
  p.set_viewport_size({'width':375,'height':812})
  for zoom in (1,1.5,2):
   p.evaluate("z=>document.documentElement.style.fontSize=(16*z)+'px'",zoom)
   for _ in range(5):p.keyboard.press('Tab')
   r.append({'label':label,'scale':zoom,'info':p.evaluate("""()=>({width:innerWidth,scroll:document.documentElement.scrollWidth,focus:document.activeElement?.outerHTML.slice(0,500),buttons:[...document.querySelectorAll('#app button')].filter(e=>e.getClientRects().length).map(e=>({text:e.innerText.slice(0,120),action:e.dataset.action,rect:e.getBoundingClientRect().toJSON(),disabled:e.disabled}))})"""),'shot':snap(p,label+'-'+str(zoom))})
  p.evaluate("()=>document.documentElement.style.fontSize=''")
 layout('math')
 # Resource failure at public document load: controlled once, then normal navigation and old record verification.
 hit=[]
 def abort(route):
  hit.append(route.request.url);route.abort()
 ctx.route(PUB+'index.html?d-controlled-failure=1',abort)
 try:p.goto(PUB+'index.html?d-controlled-failure=1#math',wait_until='domcontentloaded',timeout=10000)
 except Exception as e:x['checks']['controlledFailure']=repr(e)
 ctx.unroute(PUB+'index.html?d-controlled-failure=1',abort)
 x['checks']['failedRequests']=hit
 resume(p);x['checks']['recovered']={'sameAttempt':active(p)['attemptId']==before['attemptId'],'allEventsRetained':retained(base,events(p)),'shot':snap(p,'recovered')}
 reading_home(p);layout('reading')
 loc(p,'rdPlan').first.click();p.locator('[data-action=rdStart][data-day="1"]:visible').click();rdready(p);layout('reading-story')
 loc(p,'rdReadDone').first.click();rdready(p);layout('reading-quiz')
 resume(p);x['checks']['crossReturn']={'sameAttempt':active(p)['attemptId']==before['attemptId'],'eventsRetained':retained(base,events(p))}
 x['checks']['layout']=r
try:
 with sync_playwright() as pw:
  b=getattr(pw,ENGINE).launch(headless=True,**({'args':['--no-sandbox','--disable-shm-usage']} if ENGINE=='chromium' else {}))
  st=json.loads(next(Path('/tmp/d-latest').rglob('latest-C-storage.json')).read_text())
  ctx=b.new_context(storage_state=st,viewport={'width':1024,'height':768},has_touch=True,accept_downloads=True)
  p=ctx.new_page();p.set_default_timeout(15000);p.on('pageerror',lambda e:x['errors'].append(str(e)));p.on('dialog',lambda d:d.accept() if '家长' in d.message else d.dismiss())
  x['identityBefore']=verify_identity(p)
  try:globals()[CASE](p,ctx);x['status']='OBSERVED'
  except Exception as e:
   x['errors'].append(repr(e));x['status']='PARTIAL'
   try:x['failureShot']=snap(p,'failure')
   except Exception:pass
  x['identityAfter']=verify_identity(p);ctx.close();b.close()
finally:
 srv.shutdown()
 (OUT/'d-r11-uncovered-journey.json').write_text(json.dumps(x,ensure_ascii=False,indent=2))
 print('D_UNCOVERED '+json.dumps({'engine':ENGINE,'case':CASE,'status':x.get('status'),'checks':list(x['checks']),'completed':x['checks'].get('completed'),'errors':x['errors']},ensure_ascii=False),flush=True)
