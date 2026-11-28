"""D2 only: exact persisted profile continuation and missing shared browser assertions."""
import time
from pathlib import Path
exec(Path("tools/r11-product/d-v3-public-natural-only-20261128.py").read_text().split("# Only uncovered public widths")[0])
KEY='tianle_amc8_question_design_v1'
RKEY=KEY+'_reading_r1'
CASE=os.environ['D_CASE']
x={'formal':'fcef9785308363379b028129871c92700e1f93d4','engine':ENGINE,'case':CASE,'checks':{},'errors':[]}
expected['RTM-2013-04-INTEGRATION']={'id':'RTM-2013-04-INTEGRATION','prompt':'6人均摊，1人忘钱，其余5人各多付3元，总账单多少？','givenText':'','options':[],'answer':'90','derivation':'5×3=15; 6×15=90.'}
def resume(p):
 ready_profile(p)
 if not p.locator('[data-rtm-task]').is_visible():
  z=loc(p,'rtmConnectedResume')
  if z.count():z.first.click();ready(p)
 wait_task(p)
def ev(p):return state_report(p)['eventsById']
def re(p):
 v=p.evaluate("k=>localStorage.getItem(k)",RKEY)
 return {e['id']:e for e in json.loads(v)['events']} if v else {}
def ident(p):
 r=p.request.get(PUB+'index.html?d2='+str(time.time_ns()),headers={'Cache-Control':'no-cache'})
 assert r.ok
 h=hashlib.sha256(r.body()).hexdigest();assert h==hashlib.sha256((ROOT/'index.html').read_bytes()).hexdigest()
 return h
def section(name,f):
 try:x['checks'][name]=f()
 except Exception as e:
  x['errors'].append(name+': '+repr(e))
  x['checks'][name]={'status':'PARTIAL','error':repr(e),'shot':snap(p,name+'-failure')}
def mathflow():
 resume(p);base=ev(p);rb=re(p);a=active(p)
 assert a['id']=='RTM-2013-04-INTEGRATION' and a['submissionOrdinal']==0 and fingerprint(p,expected[a['id']])
 rows=[]
 x['checks']['mathSteps']=rows
 for i in range(20):
  a=active(p);f=expected.get(a['id']);r={'before':a,'shot':snap(p,'math-before-'+str(i))};rows.append(r)
  if not f or not fingerprint(p,f):r['stop']='NO_EXACT_FROZEN_EXPECTATION';break
  if a['submissionOrdinal'] or any(v.get('type')=='response_submitted' and v.get('taskId')==a['id'] for v in ev(p).values()):r['stop']='PRIOR_SUBMISSION';break
  req=a.get('definition',{}).get('requiredKnowledge')
  r['declared']=isinstance(req,list) and set(req)<=set(a['profileSnapshot']['declaredSkillIds'])
  r['readiness']=a.get('readinessSnapshot');r['derivation']=f.get('derivation')
  post=submit_label(p,f,f['answer']);r['after']=post;r['afterShot']=snap(p,'math-after-'+str(i))
  if post['feedback']['outcome']!='VERIFIED':r['stop']='UNEXPECTED_FEEDBACK';break
  if not next_task(p):r['stop']='NO_ACTUAL_NEXT';break
 x['checks']['mathPersistence']={'oldExact':retained(base,ev(p)),'readingExact':retained(rb,re(p)),'newEvents':[v for k,v in ev(p).items() if k not in base]}
 ctx.storage_state(path=str(OUT/'math-continuation-storage.json'))
 return {'steps':len(rows),'verified':sum((r.get('after') or {}).get('feedback',{}).get('outcome')=='VERIFIED' for r in rows)}
def parent():
 resume(p);base=ev(p);a=active(p);math_home(p)
 b=loc(p,'progress')
 if not b.count():b=p.get_by_text('家长查看',exact=True)
 if b.count():b.first.click();ready(p)
 z={'reportText':p.locator('#app').inner_text(),'controls':controls(p),'shot':snap(p,'math-parent'),'oldExact':retained(base,ev(p))}
 h=loc(p,'rtmHistory')
 if h.count():
  h.first.click();ready(p);z['history']={'text':p.locator('#app').inner_text(),'shot':snap(p,'math-history'),'controls':controls(p)}
 # Actual full export through available action, no imported synthetic progress.
 ex=loc(p,'progressExport')
 if ex.count():
  with p.expect_download() as dl:ex.first.click()
  f=OUT/'math-export.json';dl.value.save_as(str(f));z['export']={'sha256':hashlib.sha256(f.read_bytes()).hexdigest(),'bytes':f.stat().st_size,'containsAttempt':a['attemptId'] in f.read_text()}
 resume(p);z['return']={'sameAttempt':active(p)['attemptId']==a['attemptId'],'oldExact':retained(base,ev(p)),'shot':snap(p,'parent-return')}
 return z
def reading():
 resume(p);base=ev(p);rb=re(p);a=active(p)
 reading_home(p)
 z={'home':{'text':p.locator('#app').inner_text(),'controls':controls(p),'shot':snap(p,'reading-home')},'beforeReading':list(rb.values())};x['checks']['readingTrace']=z
 loc(p,'rdPlan').first.click();p.locator('[data-action=rdStart][data-day="17"]:visible').click();rdready(p);p.locator('.rd-story-text').first.wait_for()
 z['story']={'text':p.locator('#app').inner_text(),'controls':controls(p),'shot':snap(p,'reading-story')}
 # Actual new media control path, not a repeated graded question.
 for act in ['rdPinyin','rdSpeakAll','rdVoiceStop']:
  q=loc(p,act)
  if q.count():
   q.first.click();rdready(p);z[act]={'text':p.locator('#app').inner_text()[:1800],'shot':snap(p,act)}
 loc(p,'rdReadDone').first.click();rdready(p)
 z['quiz']={'text':p.locator('#app').inner_text(),'controls':controls(p),'shot':snap(p,'reading-quiz'),'questionId':p.evaluate("()=>window.__AMC8_ReadingRuntime.engine().current()?.question?.id")}
 # No new reading answer guessed from internal answer keys. Save visible question for independent derivation.
 z['readingOldExact']=retained(rb,re(p));z['newReadingEvents']=[v for k,v in re(p).items() if k not in rb]
 q=loc(p,'home')
 if q.count():q.first.click();ready(p)
 else:resume(p)
 resume(p);z['return']={'sameAttempt':active(p)['attemptId']==a['attemptId'],'oldExact':retained(base,ev(p)),'readingOldExact':retained(rb,re(p)),'shot':snap(p,'reading-return')}
 p.reload(wait_until='domcontentloaded');ready(p);z['reload']={'sameAttempt':active(p)['attemptId']==a['attemptId'],'mathExact':retained(base,ev(p)),'readingExact':retained(rb,re(p))}
 return {'question':z['quiz']['questionId'],'oldMathExact':z['return']['oldExact'],'oldReadingExact':z['readingOldExact']}
def routes():
 resume(p);base=ev(p);rb=re(p);a=active(p)
 z={}
 for suffix in ['amc8/index.html#math','source/index.html#math']:
  p.goto(PUB+suffix,wait_until='domcontentloaded');ready(p);z[suffix]={'active':active(p),'exact':retained(base,ev(p)),'readingExact':retained(rb,re(p)),'shot':snap(p,suffix.split('/')[0]+'-route')}
 p.go_back(wait_until='domcontentloaded');ready(p);z['back']={'url':p.url,'active':active(p),'exact':retained(base,ev(p)),'shot':snap(p,'back')}
 p.go_forward(wait_until='domcontentloaded');ready(p);z['forward']={'url':p.url,'active':active(p),'exact':retained(base,ev(p)),'shot':snap(p,'forward')}
 resume(p);z['return']={'sameAttempt':active(p)['attemptId']==a['attemptId'],'exact':retained(base,ev(p))}
 return z
def network():
 # Capture exact actual requested resources. Fail one packet per module, not whole document.
 resume(p);base=ev(p);rb=re(p);a=active(p);z={};x['checks']['networkTrace']=z
 for channel in ['math','reading']:
  hit=[];reqs=[]
  def track(req):reqs.append(req.url)
  def abort(route):
   u=route.request.url
   if 'assets/final-integration/' in u and u.split('?')[0].endswith('.json') and not hit:
    hit.append(u);route.abort()
   else:route.continue_()
  p.on('request',track);ctx.route('**/assets/final-integration/**',abort)
  try:
   p.goto(PUB+('index.html#math' if channel=='math' else ''),wait_until='domcontentloaded',timeout=25000)
   if channel=='reading':
    b=p.locator('[data-home-hub] [data-action=reading]:visible')
    if b.count():b.first.click()
   p.wait_for_timeout(1600)
   z[channel]={'failedRequests':hit,'requests':reqs,'text':p.locator('body').inner_text()[:3500],'controls':controls(p),'shot':snap(p,channel+'-packet-failure')}
  finally:ctx.unroute('**/assets/final-integration/**',abort);p.remove_listener('request',track)
  btn=p.get_by_role('button',name=re.compile('重试'))
  if btn.count() and btn.first.is_enabled():
   btn.first.click();z[channel]['actualRetry']=True
  else:z[channel]['actualRetry']=False
  try:
   if channel=='math':ready(p)
   else:rdready(p)
   z[channel]['recovered']=True
  except Exception:z[channel]['recovered']=False
  z[channel]['recoveryShot']=snap(p,channel+'-packet-recovery')
  resume(p);z[channel]['eventsExact']=retained(base,ev(p));z[channel]['readingExact']=retained(rb,re(p));z[channel]['sameAttempt']=active(p)['attemptId']==a['attemptId']
 return {'channels':list(z)}
try:
 with sync_playwright() as pw:
  b=getattr(pw,ENGINE).launch(headless=True,**({'args':['--no-sandbox','--disable-shm-usage']} if ENGINE=='chromium' else {}))
  st=json.loads(next(Path('/tmp/d-latest').rglob('d2-resume-storage.json')).read_text())
  ctx=b.new_context(storage_state=st,viewport={'width':1024,'height':768},has_touch=True,accept_downloads=True,record_har_path=str(OUT/'network.har') if CASE=='network' else None)
  p=ctx.new_page();p.set_default_timeout(15000)
  p.on('pageerror',lambda e:x['errors'].append(str(e)))
  p.on('dialog',lambda d:d.accept() if '家长' in d.message else d.dismiss())
  x['identityBefore']=ident(p)
  if CASE=='journey':
   section('math',mathflow);section('parent',parent);section('reading',reading);section('routes',routes)
  else:section('network',network)
  x['identityAfter']=ident(p)
  ctx.storage_state(path=str(OUT/'d2-shared-batch-storage.json'));ctx.close();b.close()
finally:
 srv.shutdown()
 (OUT/'d2-shared-batch.json').write_text(json.dumps(x,ensure_ascii=False,indent=2))
 print('D2_SHARED '+json.dumps({'engine':ENGINE,'case':CASE,'checks':list(x['checks']),'errors':x['errors']},ensure_ascii=False),flush=True)
