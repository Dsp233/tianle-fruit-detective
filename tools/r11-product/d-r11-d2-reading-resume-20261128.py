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
def view(name):
 return {'text':p.locator('#app').inner_text(),'controls':controls(p),'shot':snap(p,name),'reading':rdstate(p)}
def section(name,fn):
 try:x['checks'][name]=fn()
 except Exception as e:
  x['errors'].append(name+': '+repr(e))
  x['checks'][name]={'status':'PARTIAL','error':repr(e),'shot':snap(p,name+'-failure')}
def identity():
 r=p.request.get(PUB+'index.html?d2='+str(time.time_ns()),headers={'Cache-Control':'no-cache'});assert r.ok
 h=hashlib.sha256(r.body()).hexdigest();assert h==hashlib.sha256((ROOT/'index.html').read_bytes()).hexdigest();return h
def enter_day(day):
 reading_home(p)
 b=loc(p,'rdResume')
 if b.count():
  session=rdstate(p)['snapshot'].get('session') or {}
  if session.get('day')==day:
   b.first.click();rdready(p);return
 loc(p,'rdPlan').first.click()
 p.locator('[data-action=rdStart][data-day="'+str(day)+'"]:visible').click();rdready(p)
def reading():
 ready_profile(p);a=active(p);base=ev();rb=rev();assert len(base)==78
 x['checks']['readingTrace']={};z=x['checks']['readingTrace']
 enter_day(17);z['start']=view('day17-start')
 if loc(p,'rdReadDone').count():loc(p,'rdReadDone').first.click();rdready(p)
 qid=p.evaluate("()=>window.__AMC8_ReadingRuntime.engine().current()?.question?.id")
 z['question']=qid;z['before']=view('day17-question')
 assert qid=='R2-S17-1'
 assert not any(v.get('type')=='attempt' and v.get('questionId')==qid for v in rb.values())
 choices=loc(p,'rdPick');matches=[v for v in choices.all() if norm(rdclean(v))=='西门'];assert len(matches)==1
 matches[0].click();loc(p,'rdSubmit').first.click()
 p.wait_for_function("""id=>window.__AMC8_ReadingRuntime.snapshot().events.some(e=>e.type==='attempt'&&e.questionId===id)""",arg=qid,timeout=15000)
 rdready(p);z['answer']={'derivation':'短闪1+长闪2=3；3表示西门','newEvents':[v for k,v in rev().items() if k not in rb],'view':view('day17-answer')}
 r1=rev();p.reload(wait_until='domcontentloaded');rdready(p);z['reload']={'exact':retained(r1,rev()),'view':view('day17-reload')}
 # Actual optional card controls and next steps: only interact if exposed.
 z['afterReloadControls']=controls(p)
 # Capture parent report with reading-specific runtime.
 reading_home(p);loc(p,'rdParent').last.click();rdready(p);z['parent']=view('reading-parent')
 # Capture new/old diagnostic directories and any actual visible identifiers without answering old exams.
 z['diagnosticControls']=[q for q in controls(p) if '诊断' in q['text'] or '测评' in q['text']]
 r2=rev();ready_profile(p);z['mathReturn']={'sameActive':active(p)==a,'mathExact':retained(base,ev()),'readingExact':retained(r2,rev()),'shot':snap(p,'math-return')}
 reading_home(p);z['readingReturn']={'oldExact':retained(rb,rev()),'afterAnswerExact':retained(r2,rev()),'view':view('reading-return')}
 return {'mathExact':z['mathReturn']['mathExact'],'readingExact':z['readingReturn']['afterAnswerExact'],'qid':qid}
def identity_paths():
 out=[]
 for suffix in ['', 'index.html','amc8/','amc8/index.html','source/','source/index.html','academy/','academy/index.html']:
  try:
   r=p.request.get(PUB+suffix,headers={'Cache-Control':'no-cache'},timeout=18000);raw=r.body();path=suffix if suffix and not suffix.endswith('/') else suffix+'index.html'
   f=ROOT/path
   out.append({'suffix':suffix,'url':r.url,'status':r.status,'sha256':hashlib.sha256(raw).hexdigest(),'expected':hashlib.sha256(f.read_bytes()).hexdigest() if f.is_file() else None})
  except Exception as e:out.append({'suffix':suffix,'error':repr(e)})
 return out
try:
 with sync_playwright() as pw:
  b=getattr(pw,ENGINE).launch(headless=True,**({'args':['--no-sandbox','--disable-shm-usage']} if ENGINE=='chromium' else {}))
  st=json.loads(next(Path('/tmp/d-latest').rglob('d2-completed-group-storage.json')).read_text())
  ctx=b.new_context(storage_state=st,viewport={'width':1024,'height':768},has_touch=True,accept_downloads=True,record_video_dir=str(OUT/'video'),record_video_size={'width':1024,'height':768})
  p=ctx.new_page();p.set_default_timeout(15000);p.on('pageerror',lambda e:x['errors'].append(str(e)))
  x['identityBefore']=identity()
  section('reading',reading);section('entryIdentity',identity_paths)
  x['identityAfter']=identity();ctx.storage_state(path=str(OUT/'d2-reading-storage.json'));ctx.close();b.close()
finally:
 srv.shutdown()
 (OUT/'d2-reading-delta.json').write_text(json.dumps(x,ensure_ascii=False,indent=2))
 print('D2_READING '+json.dumps({'engine':ENGINE,'checks':list(x['checks']),'errors':x['errors']},ensure_ascii=False),flush=True)
