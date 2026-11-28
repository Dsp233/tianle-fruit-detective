"""D2 shared continuation: actual saved original, normal supply, reading resume, parent export. Transit labels never count as independent answers."""
import time
from pathlib import Path
exec(Path("tools/r11-product/d-v3-public-natural-only-20261128.py").read_text().split("# Only uncovered public widths")[0])
KEY='tianle_amc8_question_design_v1'; RKEY=KEY+'_reading_r1'
x={'engine':ENGINE,'formal':'fcef9785308363379b028129871c92700e1f93d4','checks':{},'errors':[]}
original={'id':'AMC8-2013-04','prompt':'8人原约定均摊餐费，其中1人忘带钱，其余7人各比原计划多付2.50美元。餐费共多少美元？','givenText':'','options':[],'answer':'140','derivation':'7×2.50=17.50; 8×17.50=140; prepared application, not holdout.'}
expected[original['id']]=original
def ev():return state_report(p)['eventsById']
def rev():
 raw=p.evaluate("k=>localStorage.getItem(k)",RKEY)
 return {v['id']:v for v in json.loads(raw)['events']} if raw else {}
def snapstate(name):
 return {'active':active(p),'text':p.locator('#app').inner_text()[:5000],'controls':controls(p),'shot':snap(p,name)}
def resume():
 ready_profile(p)
 # History route can remain visible, particularly on WebKit. Use its real return button.
 back=loc(p,'rtmReturn')
 if not back.count():back=p.get_by_text('回到当前练习',exact=True)
 if back.count():back.first.click();ready(p)
 if not p.locator('[data-rtm-task]').is_visible():
  q=loc(p,'rtmConnectedResume')
  if q.count():q.first.click();ready(p)
 wait_task(p)
def section(name,fn):
 try:x['checks'][name]=fn()
 except Exception as e:
  x['errors'].append(name+': '+repr(e))
  x['checks'][name]={'status':'PARTIAL','error':repr(e),'shot':snap(p,name+'-failure')}
def identity():
 r=p.request.get(PUB+'index.html?d2='+str(time.time_ns()),headers={'Cache-Control':'no-cache'});assert r.ok
 h=hashlib.sha256(r.body()).hexdigest();assert h==hashlib.sha256((ROOT/'index.html').read_bytes()).hexdigest();return h
def math():
 resume();base=ev();oldr=rev();rows=[];x['checks']['mathTrace']=rows
 assert active(p)['id']==original['id'] and active(p)['submissionOrdinal']==0
 # Independently freeze exact original from prior actually visible prompt.
 for i in range(20):
  a=active(p);d=a.get('definition',{});r={'before':a,'shot':snap(p,'supply-'+str(i))};rows.append(r)
  if a['submissionOrdinal']!=0 or any(v.get('type')=='response_submitted' and v.get('taskId')==a['id'] for v in ev().values()):
   r['stop']='PRIOR_SUBMISSION_NOT_REPLAYED';break
  required=d.get('requiredKnowledge');declared=a.get('profileSnapshot',{}).get('declaredSkillIds',[])
  r['requiredKnowledge']=required;r['declaredClosure']=isinstance(required,list) and set(required)<=set(declared)
  if required is not None and not r['declaredClosure']:r['stop']='OUTSIDE_DECLARED_SCOPE';break
  f=expected.get(a['id'])
  if f and fingerprint(p,f):
   value=f['answer'];r['reference']='FROZEN_REFERENCE_TRANSIT';r['derivation']=f.get('derivation')
   if a['id']==original['id']:r['reference']='INDEPENDENTLY_DERIVED_PREPARED_APPLICATION'
   post=submit_label(p,f,value)
  else:
   # Authored answer is used ONLY to traverse previously unexecuted normal supply states.
   # Never use it for mathematical correctness or an independent-holdout result.
   ac=d.get('answerContract',{});v=ac.get('expected');t=p.locator('[data-rtm-task]');c=t.locator('[data-action=rtmChoice]:visible')
   if c.count():
    options=d.get('options',[]);m=[o for o in options if o.get('id')==v]
    if len(m)!=1:r['stop']='NO_TRANSIT_OPTION';break
    label=m[0].get('text');hits=[q for q in c.all() if norm(q.inner_text())==norm(label)]
    if len(hits)!=1:r['stop']='NO_EXACT_VISIBLE_OPTION';break
    hits[0].click()
   elif isinstance(v,(str,int,float)) and t.locator('[data-rtm-input]:visible').count()==1:
    t.locator('[data-rtm-input]:visible').fill(str(v))
   else:r['stop']='NO_SUPPORTED_TRANSIT_INPUT';break
   r['reference']='AUTHORED_ANSWER_TRANSIT_ONLY';ready(p);t.locator('[data-action=rtmSubmit]:visible').click()
   p.wait_for_function("""a=>{let x=ExamMappingUI.exportDraft().record?.sessions?.active;return x?.attemptId===a.id&&x.submissionOrdinal>a.n&&!!x.feedback?.outcome&&progressStore.getStatus()==='ready'}""",arg={'id':a['attemptId'],'n':a['submissionOrdinal']},timeout=15000)
   post=active(p)
  r['after']=post;r['afterShot']=snap(p,'submitted-'+str(i))
  if post.get('feedback',{}).get('outcome')!='VERIFIED':r['stop']='TRANSIT_NOT_VERIFIED';break
  if not next_task(p):r['stop']='END_OR_NO_NEXT';break
 result={'oldMathExact':retained(base,ev()),'oldReadingExact':retained(oldr,rev()),'newEvents':[v for k,v in ev().items() if k not in base],'completed':sum(bool(r.get('after')) for r in rows)}
 ctx.storage_state(path=str(OUT/'math-next-storage.json'));return result
def parent():
 ready_profile(p);base=ev();a=active(p)
 if not p.get_by_text('家长查看',exact=True).count():
  q=loc(p,'rtmBack')
  if q.count():q.first.click();ready(p)
  else:math_home(p)
 q=p.get_by_text('家长查看',exact=True)
 if q.count() and q.first.is_visible():q.first.click();ready(p)
 q=loc(p,'progress')
 if q.count():q.first.click();ready(p)
 z={'parent':snapstate('parent-report')};x['checks']['parentTrace']=z
 q=loc(p,'progressExport')
 if q.count():
  with p.expect_download(timeout=15000) as dl:q.first.click()
  f=OUT/'actual-export.json';dl.value.save_as(str(f));data=json.loads(f.read_text())
  exported=(data.get('rtmDraft') or {}).get('record',{}).get('eventsById',{})
  z['export']={'sha256':hashlib.sha256(f.read_bytes()).hexdigest(),'bytes':f.stat().st_size,'exactEvents':retained(base,exported),'count':len(exported)}
 q=loc(p,'rtmHistory')
 if q.count():
  q.first.click();ready(p);z['history']=snapstate('history-list')
  q=loc(p,'rtmReview')
  if q.count():
   q.first.click();ready(p);z['review']=snapstate('history-review')
   back=loc(p,'rtmReturn')
   if not back.count():back=p.get_by_text('回到当前练习',exact=True)
   if back.count():back.first.click();ready(p)
 ready_profile(p);z['returned']={'sameActive':active(p)==a,'oldExact':retained(base,ev()),'shot':snap(p,'parent-return')}
 return {'export':z.get('export'),'return':z['returned']}
def reading():
 ready_profile(p);a=active(p);base=ev();rb=rev();reading_home(p);z={'initial':snapstate('reading-entry')};x['checks']['readingTrace']=z
 # Resume actual Day17 in Chromium; in WebKit start previously unobserved Day17.
 prior=next((v for v in reversed(list(rb.values())) if v.get('day')==17),None)
 if prior:
  q=p.get_by_text('继续上次的阅读',exact=True)
  if not q.count():q=loc(p,'rdResume')
  if q.count():q.first.click();rdready(p)
 else:
  loc(p,'rdPlan').first.click();p.locator('[data-action=rdStart][data-day="17"]:visible').click();rdready(p)
 if loc(p,'rdReadDone').count():loc(p,'rdReadDone').first.click();rdready(p)
 qid=p.evaluate("()=>window.__AMC8_ReadingRuntime.engine().current()?.question?.id")
 z['question']=qid;z['before']=snapstate('reading-question')
 assert qid=='R2-S17-1'
 assert not any(v.get('type')=='attempt' and v.get('questionId')==qid for v in rb.values())
 # Actual visible text, 1+2=3, 3 indicates 西门. No internal answer key for this action.
 choices=loc(p,'rdPick');matches=[v for v in choices.all() if norm(rdclean(v))=='西门'];assert len(matches)==1
 matches[0].click();loc(p,'rdSubmit').first.click()
 p.wait_for_function("""id=>window.__AMC8_ReadingRuntime.snapshot().events.some(e=>e.type==='attempt'&&e.questionId===id)""",arg=qid,timeout=15000)
 z['answer']={'derivation':'短闪1+长闪2=3; 3表示西门','events':[v for k,v in rev().items() if k not in rb],'shot':snap(p,'reading-answer')}
 # Preserve score and inspect parent report & recommendation controls, not a new diagnosis full sweep.
 q=loc(p,'rdHome')
 if q.count():q.first.click();rdready(p)
 q=loc(p,'rdParent')
 if q.count():q.last.click();rdready(p);z['parent']=snapstate('reading-parent')
 ready_profile(p);z['return']={'sameActive':active(p)==a,'mathExact':retained(base,ev()),'readingExact':retained(rb,rev()),'shot':snap(p,'reading-return')}
 return z['return']
try:
 with sync_playwright() as pw:
  b=getattr(pw,ENGINE).launch(headless=True,**({'args':['--no-sandbox','--disable-shm-usage']} if ENGINE=='chromium' else {}))
  st=json.loads(next(Path('/tmp/d-latest').rglob('d2-continuous-storage.json')).read_text())
  ctx=b.new_context(storage_state=st,viewport={'width':1024,'height':768},has_touch=True,accept_downloads=True)
  p=ctx.new_page();p.set_default_timeout(15000);p.on('pageerror',lambda e:x['errors'].append(str(e)));p.on('dialog',lambda d:d.accept() if '家长' in d.message else d.dismiss())
  x['identityBefore']=identity()
  section('parent',parent);section('reading',reading)
  x['identityAfter']=identity();ctx.storage_state(path=str(OUT/'d2-completed-group-storage.json'));ctx.close();b.close()
finally:
 srv.shutdown()
 (OUT/'d2-completed-group-delta.json').write_text(json.dumps(x,ensure_ascii=False,indent=2))
 print('D2_CONTINUOUS '+json.dumps({'engine':ENGINE,'checks':list(x['checks']),'errors':x['errors'],'mathCompleted':x['checks'].get('math',{}).get('completed')},ensure_ascii=False),flush=True)
