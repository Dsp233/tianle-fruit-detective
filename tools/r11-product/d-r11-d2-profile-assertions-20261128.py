"""D2 targeted outstanding profile behaviors only, saved original profiles, no repeat of completed answers."""
import time
from pathlib import Path
exec(Path("tools/r11-product/d-v3-public-natural-only-20261128.py").read_text().split("# Only uncovered public widths")[0])
CASE=os.environ['D_CASE'];KEY='tianle_amc8_question_design_v1';RKEY=KEY+'_reading_r1'
x={'case':CASE,'engine':ENGINE,'formal':'fcef9785308363379b028129871c92700e1f93d4','checks':{},'errors':[]}
def ev():return state_report(p)['eventsById']
def revents():
 raw=p.evaluate("k=>localStorage.getItem(k)",RKEY)
 return {v['id']:v for v in json.loads(raw)['events']} if raw else {}
def view(name):
 return {'text':p.locator('#app').inner_text(),'controls':controls(p),'shot':snap(p,name),'report':rdstate(p)['report']}
def section(name,f):
 try:x['checks'][name]=f()
 except Exception as e:
  x['errors'].append(name+': '+repr(e))
  try:x['checks'][name]={'status':'PARTIAL','error':repr(e),'shot':snap(p,name+'-failure'),'text':p.locator('#app').inner_text()[:4000],'controls':controls(p)}
  except:pass
def identity():
 r=p.request.get(PUB+'index.html?d2='+str(time.time_ns()),headers={'Cache-Control':'no-cache'});assert r.ok
 h=hashlib.sha256(r.body()).hexdigest();assert h==hashlib.sha256((ROOT/'index.html').read_bytes()).hexdigest();return h
def no_pinyin():
 reading_home(p);loc(p,'rdParent').last.click();rdready(p)
 g=loc(p,'rdSettingsUnlock')
 if g.count():g.first.click();rdready(p)
 q=[v for v in p.locator('#app button:visible').all() if rdclean(v)=='无拼音']
 if len(q)==1 and q[0].is_enabled():q[0].click();rdready(p)
 return {'settings':rdstate(p)['snapshot'].get('settings'),'shot':snap(p,'no-pinyin')}
def day_start(day):
 reading_home(p);loc(p,'rdPlan').first.click();p.locator('[data-action=rdStart][data-day="'+str(day)+'"]:visible').click();rdready(p)
def new_read(day):
 base=revents();day_start(day);z={'story':[rdclean(v) for v in p.locator('.rd-story-text:visible').all()],'start':view('day'+str(day)+'-start')}
 x['checks']['day'+str(day)+'Trace']=z
 if loc(p,'rdReadDone').count():loc(p,'rdReadDone').first.click();rdready(p)
 e={15:('R2-S15-1','order',['6:04 收到第一段声音','6:06 调整天线','6:12 收到第二段声音'],'原文三个明确时间：6:04、6:06、6:12，按先后顺序排列。'),84:('R2-S84-1','choice',['写清要做什么，再用图或步骤说明办法。'],'没玩过的人须知道目标与办法，仅有最终答案无法跟着试。'),64:('R2-S64-1','strip',['重叠 1 厘米'],'3+4−重叠=6，所以重叠1厘米。')}[day]
 qid=p.evaluate("()=>window.__AMC8_ReadingRuntime.engine().current()?.question?.id")
 assert qid==e[0];assert not any(v.get('type')=='attempt' and v.get('questionId')==qid for v in base.values())
 z['prompt']=view('day'+str(day)+'-prompt')
 if day==64:
  # Real math-reading condition and model, no answer is read by tester.
  w=loc(p,'rdWpStrip');z['options']=[rdclean(v) for v in w.all()]
 else:w=loc(p,'rdPick')
 for val in e[2]:
  hits=[v for v in w.all() if norm(rdclean(v))==norm(val)];assert len(hits)==1
  hits[0].click();rdready(p)
 loc(p,'rdSubmit').first.click()
 p.wait_for_function("""id=>window.__AMC8_ReadingRuntime.snapshot().events.some(e=>e.type==='attempt'&&e.questionId===id)""",arg=qid,timeout=15000)
 rdready(p);z['after']=view('day'+str(day)+'-answer');z['newEvents']=[v for k,v in revents().items() if k not in base];z['oldExact']=retained(base,revents());z['derivation']=e[3]
 return {'id':qid,'attempts':[v for v in z['newEvents'] if v.get('type')=='attempt'],'oldExact':z['oldExact']}
def card3():
 base=revents()
 assert any(v.get('questionId')=='R2-S03-1' and v.get('type')=='attempt' and v.get('correct') for v in base.values())
 day_start(3)
 z={'before':view('card3-before')};x['checks']['card3Trace']=z
 # No prerequisite answer replay; only resume if product actually exposes existing correct card.
 outer=p.locator('#app details > summary:visible').filter(has_text='换个条件')
 if outer.count()!=1:return {'status':'NOT_REACHABLE_WITHOUT_REPLAY','oldExact':retained(base,revents()),'visible':z['before']['text']}
 outer.click();rdready(p);z['outer']=view('card3-outer')
 inner=p.locator('#app details > summary:visible').filter(has_text='核对理由')
 assert inner.count()==1
 # Freeze independent reasoning before showing self-check.
 z['independent']='甲从4到8、乙从5到9，均增长4厘米；末值更高不等于增长更多。'
 inner.click();rdready(p);z['inner']=view('card3-inner')
 return {'oldExact':retained(base,revents()),'sameAttemptEvents':{k:v for k,v in base.items() if v.get('type')=='attempt'}=={k:v for k,v in revents().items() if v.get('type')=='attempt'},'selfCheckVisible':z['inner']['text']}
def reading_path():
 ready_profile(p);m=ev();rb=revents();a=active(p)
 x['checks']['settings']=no_pinyin()
 if CASE=='rb':section('card3',card3)
 for day in ([15,84] if CASE in ['ra','rb'] else [64]):
  section('day'+str(day),lambda day=day:new_read(day))
 reading_home(p);loc(p,'rdParent').last.click();rdready(p);x['checks']['parentReading']=view('parent-reading')
 r2=revents();ready_profile(p)
 return {'oldMathExact':retained(m,ev()),'oldReadingExact':retained(rb,revents()),'allReadingExact':retained(r2,revents()),'sameActive':active(p)==a,'shot':snap(p,'math-return')}
def math_path():
 ready_profile(p);base=ev();oldr=revents();a=active(p)
 if not p.locator('[data-rtm-task]').is_visible():
  loc(p,'rtmConnectedResume').first.click();ready(p);wait_task(p)
 assert a['submissionOrdinal']>=1
 # Start only the next unseen actual task, never replay the old contrast.
 assert next_task(p);n=active(p);z={'before':n,'shot':snap(p,'next-actual')};x['checks']['offlineTrace']=z
 assert n['submissionOrdinal']==0 and n['attemptId']!=a['attemptId']
 # Use existing independent frozen result only for functional continuation.
 f=expected.get(n['id'])
 if f and fingerprint(p,f):
  ctx.set_offline(True)
  try:
   result=submit_label(p,f,f['answer'])
   z['offlineSubmit']={'navigatorOnline':p.evaluate('navigator.onLine'),'actual':result,'oldExact':retained(base,ev()),'shot':snap(p,'offline-submit')}
  finally:ctx.set_offline(False)
 else:z['offlineSubmit']={'status':'NO_FROZEN_MATCH_NO_REPLAY'}
 after=ev();p.reload(wait_until='domcontentloaded');ready(p)
 z['reload']={'active':active(p),'exact':retained(after,ev()),'oldExact':retained(base,ev()),'shot':snap(p,'online-reload')}
 return {'oldMathExact':retained(base,ev()),'oldReadingExact':retained(oldr,revents()),'actualNext':n['id'],'submitted':z['offlineSubmit'].get('actual') is not None,'reloadExact':z['reload']['exact']}
try:
 with sync_playwright() as pw:
  b=getattr(pw,ENGINE).launch(headless=True,**({'args':['--no-sandbox','--disable-shm-usage']} if ENGINE=='chromium' else {}))
  st=json.loads(next(Path('/tmp/d-profile').rglob('*-storage.json')).read_text())
  ctx=b.new_context(storage_state=st,viewport={'width':1024,'height':768},has_touch=True,record_video_dir=str(OUT/'video'),record_video_size={'width':1024,'height':768})
  p=ctx.new_page();p.set_default_timeout(12000);p.on('pageerror',lambda e:x['errors'].append(str(e)));p.on('dialog',lambda d:d.accept() if '家长' in d.message else d.dismiss())
  x['identityBefore']=identity()
  if CASE.startswith('r'):section('readingPath',reading_path)
  else:section('mathPath',math_path)
  x['identityAfter']=identity();ctx.storage_state(path=str(OUT/'d2-profile-storage.json'));ctx.close();b.close()
finally:
 srv.shutdown()
 (OUT/'d2-profile-assertions.json').write_text(json.dumps(x,ensure_ascii=False,indent=2))
 print('D2_PROFILE '+json.dumps({'case':CASE,'engine':ENGINE,'checks':list(x['checks']),'errors':x['errors']},ensure_ascii=False),flush=True)
