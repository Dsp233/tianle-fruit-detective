"""D original PM-04/05/06/07 and FIX2-LOAD-02 selection/restore delta; no new math credit."""
import json,os,sys,threading,functools,hashlib,subprocess,concurrent.futures,re
from pathlib import Path
from http.server import SimpleHTTPRequestHandler,ThreadingHTTPServer
from playwright.sync_api import sync_playwright
ROOT=Path(os.environ['D_PRODUCT']);OUT=Path('r11-probe-output');OUT.mkdir(exist_ok=True)
assert subprocess.check_output(['git','-C',str(ROOT),'rev-parse','HEAD'],text=True).strip()=='fcef9785308363379b028129871c92700e1f93d4'
D=Path('tools/r11-product')
expected={}
for f in sorted(D.glob('d-bulk-expected-*.json')):
 if f.name.endswith('freeze.json'):continue
 j=json.loads(f.read_text())
 for e in j.get('rows',[]):expected[e['id']]=e
class H(SimpleHTTPRequestHandler):
 def log_message(self,*a):pass
srv=ThreadingHTTPServer(('127.0.0.1',0),functools.partial(H,directory=str(ROOT)));threading.Thread(target=srv.serve_forever,daemon=True).start()
PUB='https://dsp233.github.io/tianle-fruit-detective/'
URL=PUB+'index.html#math'
def ready(p):p.wait_for_function("Boolean(window.__AMC8_MATH_NAV)&&typeof progressStore!=='undefined'&&progressStore.getStatus()==='ready'",timeout=45000)
def loc(p,a):return p.locator(f'#app [data-action={a}]:visible')
def controls(p):
 return p.evaluate("""()=>[...document.querySelectorAll('#app [data-action]')].filter(x=>x.getClientRects().length).map(x=>({action:x.dataset.action,code:x.dataset.code||null,source:x.dataset.source||null,pressed:x.getAttribute('aria-pressed'),text:x.innerText,disabled:x.matches(':disabled')}))""")
def selected(p):return sorted(x['code'] for x in controls(p) if x['action']=='topicSelect' and x['pressed']=='true')
def unlock(p):
 gate=loc(p,'topicParentUnlock').first
 if '确认调整' in gate.inner_text():gate.click();ready(p)
def snap(p,name):
 f=OUT/f'{name}.png';p.screenshot(path=str(f),full_page=True);return dict(file=f.name,sha256=hashlib.sha256(f.read_bytes()).hexdigest())
state="""()=>{let a=ExamMappingUI.exportDraft().record?.sessions?.active;return a?{id:a.id,attemptId:a.attemptId,origin:a.originProblemGroupId,kind:a.kind,ordinal:a.submissionOrdinal,help:a.helpLevel,input:a.input,outcome:a.feedback?.outcome??null}:null}"""
norm=lambda s:re.sub(r'\s+','',s or '')

import collections
sys.path.insert(0,str(ROOT/'tools'))
from g1_reading_packets import config,unpack
def reading_delta():
 def packet(root):
  d=config((root/'index.html').read_text())['reading']['data'][0]
  return json.loads(unpack(d,lambda n:(root/n).read_bytes()))
 old=packet(Path('/tmp/d-w1'));cur=packet(ROOT)
 def collect(x,d,path=''):
  if isinstance(x,dict):
   i=x.get('id')
   if isinstance(i,str) and i.startswith('R2-'):d.setdefault(i,[]).append((path,x))
   for k,v in x.items():collect(v,d,path+'/'+k)
  elif isinstance(x,list):
   for v in x:collect(v,d,path+'/*')
 od={};nd={};collect(old,od);collect(cur,nd)
 additions=[{'id':i,'locations':[p for p,v in nd[i]],'objects':[v for p,v in nd[i]]} for i in sorted(set(nd)-set(od))]
 # Check map/text entries which affect original objects without re-reading each original story.
 maps={}
 for k in ['pinyinMap','pinyinTexts','phrases','pronunciationPolicy','contextReviewedPositions']:
  a=old.get(k);b=cur.get(k);q={'oldType':type(a).__name__,'newType':type(b).__name__,'equal':a==b}
  if isinstance(a,dict) and isinstance(b,dict):q.update(old=len(a),current=len(b),removed=sorted(set(a)-set(b)),changed=[x for x in a if x in b and a[x]!=b[x]],added=len(set(b)-set(a)))
  elif isinstance(a,list) and isinstance(b,list):q.update(old=len(a),current=len(b))
  maps[k]=q
 result={'base':str(ROOT),'newCount':len(additions),'typeCounts':dict(collections.Counter(a['locations'][0] for a in additions)),'maps':maps,'additions':additions}
 (OUT/'d-reading-new-objects.json').write_text(json.dumps(result,ensure_ascii=False,indent=2))
 print('D_NEW_READING '+json.dumps({k:v for k,v in result.items() if k!='additions'},ensure_ascii=False),flush=True)
def wait_task(p):
 p.wait_for_function("""()=>{let a=ExamMappingUI.exportDraft().record?.sessions?.active;return a&&document.querySelector('[data-rtm-task]')?.getAttribute('data-rtm-task')===a.id&&progressStore.getStatus()==='ready'}""",timeout=10000)
def active(p):
 return p.evaluate("()=>ExamMappingUI.exportDraft().record?.sessions?.active")
def state_report(p):
 return p.evaluate("()=>ExamMappingUI.exportDraft().record")
def try_answer(p,a,e,wrong=False):
 task=p.locator('[data-rtm-task]')
 title=task.locator('.task-title').inner_text();g=task.locator('[data-rtm-givens]');given=g.inner_text() if g.count() else '';choices=task.locator('[data-action=rtmChoice]:visible').all_inner_texts()
 if 'promptFingerprint' in e:
  match=hashlib.sha256(json.dumps([norm(title),norm(given),sorted(map(norm,choices))],ensure_ascii=False,separators=(',',':')).encode()).hexdigest()==e['promptFingerprint']
 else:match=norm(title)==norm(e['prompt']) and norm(given)==norm(e['givenText']) and sorted(map(norm,choices))==sorted(map(norm,e['options']))
 if not match:return {'status':'IDENTITY_NOT_MATCHED','title':title,'given':given,'choices':choices,'expected':{k:e.get(k) for k in ['prompt','givenText','options','promptFingerprint']}}
 val=e['answer']
 if wrong:
  ws=[v for v in choices if norm(v)!=norm(val)]
  if not ws:return {'status':'NO_WRONG_CHOICE'}
  val=ws[0]
 if choices:
  m=[i for i in task.locator('[data-action=rtmChoice]:visible').all() if norm(i.inner_text())==norm(val)]
  if len(m)!=1:return {'status':'CHOICE_NOT_MATCHED','value':val,'choices':choices}
  m[0].click()
 else:task.locator('[data-rtm-input]:visible').fill(str(val))
 ready(p);task.locator('[data-action=rtmSubmit]:visible').click()
 p.wait_for_function("""prev=>{let a=ExamMappingUI.exportDraft().record?.sessions?.active;return a?.attemptId===prev.id&&a.submissionOrdinal>prev.n&&!!a.feedback?.outcome&&progressStore.getStatus()==='ready'}""",arg={'id':a['attemptId'],'n':a['submissionOrdinal']},timeout=10000)
 return {'status':'OBSERVED','value':val,'wrong':wrong,'derivation':e.get('derivation'),'actual':active(p)}

# Select known independently frozen, exact complete groups through the normal parent picker.
# Prior observations are reused as transit; no new mathematics correctness credit.
def rdclean(x):
 return x.evaluate("""e=>{let c=e.cloneNode(true);c.querySelectorAll('.rd-pinyin,[hidden]').forEach(x=>x.remove());return c.textContent.trim()}""")
def rdready(p):
 p.wait_for_function("window.__AMC8_ReadingRuntime&&window.__AMC8_ReadingRuntime.engine().status().status==='ready'",timeout=45000)
def rdstate(p):
 return p.evaluate("""()=>{let r=window.__AMC8_ReadingRuntime;return {snapshot:r.snapshot(),report:r.report()}}""")
def math_home(p):
 p.goto(URL,wait_until='domcontentloaded');ready(p)
 if loc(p,'topicParentUnlock').count()==0:
  back=loc(p,'rtmBack')
  if back.count():back.first.click();ready(p)
 if loc(p,'topicParentUnlock').count()==0:
  p.locator('[data-action=hubHome]:visible').first.click();p.locator('[data-home-hub] [data-action=home]').click();ready(p)
def select_scope(p,targets):
 unlock(p)
 for t in selected(p):
  if t not in targets:p.locator(f'[data-action=topicSelect][data-code="{t}"]:visible').click();ready(p)
 for t in targets:
  if t not in selected(p):p.locator(f'[data-action=topicSelect][data-code="{t}"]:visible').click();ready(p)
 assert selected(p)==sorted(targets)
def group_candidates(p,targets):
 groups=sorted(g for g in {e['group'] for e in expected.values() if e.get('group')} if all(i in expected for i in [g,'RTM-'+g[5:]+'-DECISION','RTM-'+g[5:]+'-CONTRAST','RTM-'+g[5:]+'-INTEGRATION']))
 return p.evaluate("""({groups,topics})=>groups.filter(id=>ExamMappingUI.connectedAvailability(SourceCatalog.profile({sourceIds:['AMC8'],examIds:[id],topicIds:topics}))>0)""",{'groups':groups,'topics':targets})
def choose_group(p,g):
 unlock(p)
 picker=p.locator('[data-source-exam-picker]')
 if not picker.is_visible():p.get_by_text('细化已掌握知识 / 指定真题',exact=True).click()
 picker.select_option(g);loc(p,'sourceExamReplace').first.click();ready(p)
 p.wait_for_function("(id)=>document.querySelector('[data-selected-exam-summary]')?.innerText.includes(id)&&progressStore.getStatus()==='ready'",arg=g)
 loc(p,'topicStart').first.click();ready(p);wait_task(p)

# New assertions on restored actual synthetic profiles only. Old answer receipts are transit.
NAME=os.environ.get('D_PROFILE','C');KIND='delta';ENGINE=os.environ['D_ENGINE']
PRIOR=Path('/tmp/d-restored')
TARGETS={'A':['A01','A02','N01','N02','R01','R02','G01','G02'],'B':['A01','A02','N01','N02','R01','R02','G01','G02','D01','D02'],'C':['A01','A02','N01','N02','R01','R02','G01','G02','D01','D02','G03','G04','S01','S02'],'D':['A01','A02','N01','N02','R01','R02','G01','G02']}
def old_events(record):return record['eventsById']
def retained(before,after):return all(after.get(k)==v for k,v in before.items())
def fingerprint(p,e):
 task=p.locator('[data-rtm-task]')
 title=task.locator('.task-title').inner_text();g=task.locator('[data-rtm-givens]');given=g.inner_text() if g.count() else '';choices=task.locator('[data-action=rtmChoice]:visible').all_inner_texts()
 if 'promptFingerprint' in e:return hashlib.sha256(json.dumps([norm(title),norm(given),sorted(map(norm,choices))],ensure_ascii=False,separators=(',',':')).encode()).hexdigest()==e['promptFingerprint']
 return norm(title)==norm(e['prompt']) and norm(given)==norm(e['givenText']) and sorted(map(norm,choices))==sorted(map(norm,e['options']))
def submit_label(p,e,value):
 assert fingerprint(p,e),'frozen prompt mismatch'
 a=active(p);t=p.locator('[data-rtm-task]')
 choices=t.locator('[data-action=rtmChoice]:visible')
 if choices.count():
  m=[i for i in choices.all() if norm(i.inner_text())==norm(value)]
  assert len(m)==1,(value,choices.all_inner_texts());m[0].click()
 else:t.locator('[data-rtm-input]:visible').fill(str(value))
 ready(p);t.locator('[data-action=rtmSubmit]:visible').click()
 p.wait_for_function("""a=>{let x=ExamMappingUI.exportDraft().record?.sessions?.active;return x?.attemptId===a.id&&x.submissionOrdinal>a.n&&!!x.feedback?.outcome&&progressStore.getStatus()==='ready'}""",arg={'id':a['attemptId'],'n':a['submissionOrdinal']},timeout=12000)
 return active(p)
def get_new_group(p,events):
 old_groups={v.get('originProblemGroupId') for v in events.values() if isinstance(v,dict)}
 groups=group_candidates(p,TARGETS[NAME])
 for g in groups:
  if g not in old_groups:return g
 return None
def next_task(p):
 a=active(p);n=loc(p,'rtmNext')
 if not n.count() or not n.first.is_enabled():return False
 n.first.click();ready(p)
 try:p.wait_for_function("""a=>{let x=ExamMappingUI.exportDraft().record?.sessions?.active;return x&&x.attemptId!==a&&x.submissionOrdinal===0}""",arg=a['attemptId'],timeout=12000);wait_task(p);return True
 except:return False
def reading_home(p):
 p.goto(PUB,wait_until='domcontentloaded');p.wait_for_function("Boolean(document.querySelector('[data-home-hub]')||window.__AMC8_ReadingRuntime)",timeout=45000)
 if loc(p,'rdPlan').count()==0:
  b=p.locator('[data-home-hub] [data-action=reading]:visible')
  if not b.count():b=loc(p,'reading')
  if b.count():b.first.click()
  elif loc(p,'rdHome').count():loc(p,'rdHome').first.click()
 rdready(p)
 if not loc(p,'rdPlan').count() and loc(p,'rdHome').count():loc(p,'rdHome').first.click();rdready(p)
def read_report(p):
 reading_home(p);loc(p,'rdParent').last.click();rdready(p);p.locator('.rd-parent').wait_for()
 return {'text':p.locator('#app').inner_text(),'report':rdstate(p)['report'],'controls':controls(p),'shot':snap(p,NAME+'-parent-reading')}
def ready_profile(p):p.goto(URL,wait_until='domcontentloaded');ready(p)

# Only uncovered public widths, draft recovery across public entry, and normal supply/holdout eligibility.
import time
def shot_state(p,name):
 return {'shot':snap(p,name),'view':p.evaluate("""()=>({width:innerWidth,scroll:document.documentElement.scrollWidth,buttons:[...document.querySelectorAll('#app button')].filter(x=>x.getClientRects().length).map(x=>({text:x.innerText,action:x.dataset.action,left:x.getBoundingClientRect().left,right:x.getBoundingClientRect().right,disabled:!!x.disabled})),text:document.querySelector('#app')?.innerText})""")}
def widths(p,label):
 a=[]
 for w,h in [(320,740),(390,844),(768,1024),(1024,768),(1180,820),(820,1180)]:
  p.set_viewport_size({'width':w,'height':h});v=shot_state(p,f'{label}-{w}x{h}');v.update(width=w,height=h);a.append(v)
 return a
def math_records(p):return state_report(p)['eventsById']
def read_attempts(p):return {v['id']:v for v in rdstate(p)['snapshot']['events'] if v['type']=='attempt'}
def identity(p):
 response=p.request.get(PUB+'index.html?d-r11-20261128='+str(time.time_ns()),headers={'Cache-Control':'no-cache'})
 assert response.ok
 val=hashlib.sha256(response.body()).hexdigest();assert val==hashlib.sha256((ROOT/'index.html').read_bytes()).hexdigest()
 return val
def cold(p,url,wait):
 t=time.monotonic();p.goto(url,wait_until='domcontentloaded');wait(p);return round(time.monotonic()-t,3)
x={'engine':ENGINE,'formal':'fcef9785308363379b028129871c92700e1f93d4','checks':{},'errors':[]}
def section(n,fn):
 try:x['checks'][n]=fn()
 except Exception as e:x['checks'][n]={'error':repr(e),'status':'PARTIAL'}
try:
 with sync_playwright() as pw:
  b=getattr(pw,ENGINE).launch(headless=True,**({'args':['--no-sandbox','--disable-dev-shm-usage']} if ENGINE=='chromium' else {}))
  ctx=b.new_context(viewport={'width':1024,'height':768},has_touch=True,accept_downloads=True)
  p=ctx.new_page();p.set_default_timeout(60000);p.on('pageerror',lambda e:x['errors'].append(str(e)))
  x['identityBefore']=identity(p)
  def layout():
   q={};q['homeSeconds']=cold(p,PUB,lambda p:p.locator('[data-home-hub]').wait_for())
   q['home']=widths(p,'home');q['mathCold']=cold(p,URL,ready);q['math']=widths(p,'math')
   q['readingCold']=cold(p,PUB,lambda p:p.locator('[data-home-hub]').wait_for())
   t=time.monotonic();p.locator('[data-home-hub] [data-action=reading]').click();rdready(p);q['readingReady']=round(time.monotonic()-t,3)
   q['reading']=widths(p,'reading');loc(p,'rdPlan').first.click();p.locator('[data-action=rdStart][data-day="1"]:visible').click();rdready(p);p.locator('.rd-story-text').first.wait_for()
   q['story']=widths(p,'story');loc(p,'rdReadDone').first.click();rdready(p);q['quiz']=widths(p,'quiz')
   q['mathWarm']=cold(p,URL,ready)
   return q
  section('publicLayoutAndEntry',layout);ctx.close()
  # Restore exact latest C synthetic profile, not a new ten-question replay.
  prior=next(Path('/tmp/d-profile').rglob('math-C-storage.json'))
  st=json.loads(prior.read_text());ctx=b.new_context(storage_state=st,viewport={'width':1024,'height':768},has_touch=True,accept_downloads=True)
  p=ctx.new_page();p.set_default_timeout(60000);p.on('pageerror',lambda e:x['errors'].append(str(e)));p.on('dialog',lambda d:d.accept() if '家长' in d.message else d.dismiss())
  ready_profile(p)
  def natural():
   base=math_records(p);math_home(p);select_scope(p,TARGETS['C'])
   unlock(p);picker=p.locator('[data-source-exam-picker]')
   if not picker.is_visible():p.get_by_text('细化已掌握知识 / 指定真题',exact=True).click()
   visible=controls(p);clear=[v for v in visible if v['action'] and ('sourceExam' in v['action']) and ('清' in v['text'] or '取消' in v['text'] or '不限' in v['text'])]
   for v in clear:
    q=loc(p,v['action']); 
    if q.count()==1 and q.first.is_enabled():q.first.click();ready(p)
   # Record actual source state and normal button; no fabricated source clearing.
   result={'controlsBeforeStart':controls(p),'existingEvents':len(base),'steps':[],'newGroups':[]}
   start=loc(p,'topicStart')
   if not start.count() or not start.first.is_enabled():result['blockedText']=p.locator('#app').inner_text();return result
   start.first.click();ready(p);wait_task(p)
   for i in range(12):
    a=active(p);e=expected.get(a['id']);prior_tasks={v.get('taskId') for v in base.values() if isinstance(v,dict) and v.get('type')=='response_submitted'}
    z={'task':a['id'],'attemptId':a['attemptId'],'group':a.get('originProblemGroupId'),'required':a['definition'].get('requiredKnowledge'),'declared':a['profileSnapshot'].get('declaredSkillIds'),'priorTask':a['id'] in prior_tasks,'helpLevel':a['helpLevel'],'ordinal':a['submissionOrdinal'],'scope':a.get('profileSnapshot'),'controls':controls(p),'shot':snap(p,'natural-'+str(i))};result['steps'].append(z)
    if not e or not fingerprint(p,e):z['gap']='NO_EXACT_FROZEN_EXPECTATION';break
    z['derivation']=e.get('derivation');z['frozenCredit']=e.get('credit');z['before']=a
    if a['submissionOrdinal']>0 or a['id'] in prior_tasks:z['gap']='PREVIOUSLY_SUBMITTED';break
    assert set(a['definition']['requiredKnowledge']).issubset(set(a['profileSnapshot']['declaredSkillIds']))
    z['after']=submit_label(p,e,e['answer']);z['afterShot']=snap(p,'natural-after-'+str(i))
    if z['after']['feedback']['outcome']!='VERIFIED':break
    if not next_task(p):break
   result['preserved']=retained(base,math_records(p));result['newEvents']=[v for k,v in math_records(p).items() if k not in base]
   return result
  section('normalSupplyAndIndependentProfile',natural)
  def storage():
   math_home(p);select_scope(p,TARGETS['C'])
   candidates=group_candidates(p,TARGETS['C']);oldgroups={v.get('originProblemGroupId') for v in math_records(p).values() if isinstance(v,dict)}
   g=next((v for v in candidates if v not in oldgroups),None)
   if g is None:return {'status':'NO_ELIGIBLE_UNUSED_GROUP','visible':controls(p)}
   choose_group(p,g);a=active(p);e=expected.get(a['id']);assert e and fingerprint(p,e)
   picks=loc(p,'rtmChoice');assert picks.count()>1;picks.first.click();ready(p)
   draft=active(p);assert draft['submissionOrdinal']==0
   before=math_records(p);r={'task':draft['id'],'attempt':draft['attemptId'],'input':draft['input'],'draftShot':snap(p,'saved-draft')}
   # Same browser context, legitimate tab close/reopen and offline mutation only in synthetic profile.
   p.close();q=ctx.new_page();q.set_default_timeout(60000);q.goto(PUB+'amc8/index.html#math',wait_until='domcontentloaded');ready(q)
   a2=active(q);r['reopenExact']=all(a2.get(k)==draft.get(k) for k in ['id','attemptId','input','submissionOrdinal','helpLevel']);r['reopenShot']=snap(q,'public-draft-reopen')
   if not q.locator('[data-rtm-task]').is_visible() and loc(q,'rtmConnectedResume').count():loc(q,'rtmConnectedResume').first.click();ready(q)
   r['resumeVisible']=q.locator('[data-rtm-task]').is_visible();r['eventsRetained']=retained(before,math_records(q))
   if r['resumeVisible']:
    ctx.set_offline(True);r['offline']=not q.evaluate('navigator.onLine')
    try:
     a3=active(q);e=expected[a3['id']];r['afterOffline']=submit_label(q,e,e['answer']);off=math_records(q);r['savedOffline']=r['afterOffline']['submissionOrdinal']==1
    finally:ctx.set_offline(False)
    q.reload(wait_until='domcontentloaded');ready(q);r['offlineEventsRetained']=retained(off,math_records(q));r['recoveryShot']=snap(q,'public-offline-recover')
   return r
  section('publicDraftAndOffline',storage)
  ctx.storage_state(path=str(OUT/'latest-C-storage.json'));ctx.close()
  ctx=b.new_context();p=ctx.new_page();x['identityAfter']=identity(p);ctx.close();b.close()
finally:
 srv.shutdown()
 (OUT/'d-v3-public-supply-storage.json').write_text(json.dumps(x,ensure_ascii=False,indent=2))
 def compact():
  c=x['checks'];l=c.get('publicLayoutAndEntry',{});n=c.get('normalSupplyAndIndependentProfile',{});t=c.get('publicDraftAndOffline',{})
  return {'engine':ENGINE,'errors':x['errors'],'identityBefore':x.get('identityBefore'),'identityAfter':x.get('identityAfter'),'layout':{k:([{'w':v['width'],'h':v['height'],'scroll':v['view']['scroll'],'outOfBounds':[b for b in v['view']['buttons'] if b['left']<-1 or b['right']>v['width']+1]} for v in z] if isinstance(z,list) else z) for k,z in l.items()},'natural':{k:v for k,v in n.items() if k not in ('steps','newEvents','controlsBeforeStart')},'steps':[{'id':z['task'],'group':z['group'],'priorTask':z['priorTask'],'helpLevel':z['helpLevel'],'ordinal':z['ordinal'],'gap':z.get('gap'),'credit':z.get('frozenCredit'),'feedback':(z.get('after') or {}).get('feedback'),'declared':z['declared'],'required':z['required']} for z in n.get('steps',[])],'storage':{k:v for k,v in t.items() if k!='afterOffline'},'offlineOutcome':(t.get('afterOffline') or {}).get('feedback')}
 print('D_PUBLIC_DELTA '+json.dumps(compact(),ensure_ascii=False),flush=True)
