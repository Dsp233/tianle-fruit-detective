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
NAME=os.environ['D_PROFILE'];KIND=os.environ['D_KIND'];ENGINE=os.environ['D_ENGINE']
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
def math_case(p,ctx,x):
 ready_profile(p);before=state_report(p);events=old_events(before);assert events
 math_home(p);select_scope(p,TARGETS[NAME])
 x['selected']=selected(p);x['groups']=[];x['newSteps']=[]
 for group_number in range(2 if NAME=='C' else 1):
  g=get_new_group(p,old_events(state_report(p)))
  if not g:x['limits'].append('no unused eligible frozen group');break
  choose_group(p,g);x['groups'].append(g)
  for step in range(3 if NAME=='C' else 2):
   a=active(p);e=expected.get(a['id']);y={'id':a['id'],'before':a,'controls':controls(p),'shot':snap(p,NAME+f'-{group_number}-{step}-before')};x['newSteps'].append(y)
   if not e or not fingerprint(p,e):y['gap']='NO_EXACT_FROZEN_EXPECTATION';break
   assert set(a['definition']['requiredKnowledge']).issubset(set(a['profileSnapshot']['declaredSkillIds']))
   y['frozenDerivation']=e.get('derivation');y['frozenAnswer']=e['answer'];y['frozenPrompt']=e.get('prompt')
   if NAME!='C' and step==0:
    choices=p.locator('[data-rtm-task] [data-action=rtmChoice]:visible').all_inner_texts();wrong=[c for c in choices if norm(c)!=norm(e['answer'])]
    y['wrong']=[]
    for value in wrong[:2]:
     z=submit_label(p,e,value);y['wrong'].append({'value':value,'actual':z,'shot':snap(p,NAME+'-wrong-'+str(len(y['wrong'])))})
    y['help']=[]
    for j in range(3):
     h=loc(p,'rtmHintNext') if j and loc(p,'rtmHintNext').count() else loc(p,'rtmHint')
     if not h.count() or not h.first.is_enabled():break
     h.first.click();ready(p);y['help'].append({'actual':active(p),'shot':snap(p,NAME+'-help-'+str(j))})
    if len(y['wrong'])<2:x['limits'].append('second distinct wrong option not available')
   if NAME!='C' and step==1:
    # Access support only, record before and after in same active attempt.
    b=p.get_by_text('朗读题目',exact=False)
    y['accessBefore']=active(p)
    if b.count()==1 and b.is_visible():
     b.click();ready(p);y['speechRequest']=True
     stop=p.get_by_text('停止朗读',exact=True)
     if stop.count() and stop.first.is_visible():stop.first.click();ready(p);y['speechStop']=True
    y['accessAfter']=active(p)
   y['submit']=submit_label(p,e,e['answer']);y['afterShot']=snap(p,NAME+f'-{group_number}-{step}-after')
   if y['submit']['feedback']['outcome']!='VERIFIED':y['gap']='FROZEN_ANSWER_REJECTED';break
   if step+1<(3 if NAME=='C' else 2) and not next_task(p):y['gap']='NO_NEXT';break
  if group_number+1<(2 if NAME=='C' else 1):math_home(p);select_scope(p,TARGETS[NAME])
 x['newEvents']=[v for k,v in old_events(state_report(p)).items() if k not in events]
 x['priorEventsRetained']=retained(events,old_events(state_report(p)))
 # Parent summary and alternate public entry after close/reopen; preserve exact old and new events.
 post=state_report(p);home=p.get_by_role('button',name='返回首页',exact=True)
 if home.count():home.first.click();ready(p)
 else:math_home(p)
 parent=p.get_by_text('家长查看',exact=True)
 if parent.count() and parent.first.is_visible():parent.first.click()
 if loc(p,'progress').count():
  loc(p,'progress').first.click();ready(p);x['parentSummary']={'text':p.locator('#app').inner_text(),'controls':controls(p),'shot':snap(p,NAME+'-parent-summary')}
  if loc(p,'rtmHistory').count():loc(p,'rtmHistory').first.click();ready(p);x['history']={'text':p.locator('#app').inner_text(),'shot':snap(p,NAME+'-history')}
 x['afterParentEventsExact']=old_events(state_report(p))==old_events(post)
 p.close();p=ctx.new_page();p.set_default_timeout(12000);p.goto(PUB+'amc8/index.html#math',wait_until='domcontentloaded');ready(p)
 x['alternativeEntry']={'url':p.url,'eventsExact':old_events(state_report(p))==old_events(post),'shot':snap(p,NAME+'-alternate-entry')}
 # Other module report and returned same math record, not a new grade.
 x['readingParent']=read_report(p);ready_profile(p);x['afterReadingEventsExact']=old_events(state_report(p))==old_events(post)
 return p
# Prior independently derived reading cases. No repeated reading content review or new correctness credit.
def reading_case(p,ctx,x):
 ready_profile(p);math0=state_report(p);reading_home(p);old=rdstate(p);old_attempts={v.get('id'):v for v in old['snapshot']['events'] if v.get('type')=='attempt'}
 ref=json.loads((D/'d-reading-independent-expected.json').read_text())['cases'];byday={c['day']:c for c in ref}
 days={'A':[1],'B':[3],'C':[2,1],'D':[2]}[NAME]
 x['readingSteps']=[]
 for day in days:
  e=byday[day];reading_home(p);loc(p,'rdPlan').first.click();p.locator(f'[data-action=rdStart][data-day="{day}"]:visible').click();rdready(p);p.locator('.rd-story-text').first.wait_for()
  y={'day':day,'story':[rdclean(v) for v in p.locator('.rd-story-text:visible').all()],'controls':controls(p),'shot':snap(p,NAME+'-day-'+str(day))};x['readingSteps'].append(y)
  if NAME=='A':
   chars=loc(p,'rdChar');word=[v for v in chars.all() if rdclean(v) in ('长','看','还','着')]
   if word:word[0].click();rdready(p);y['charLookup']=True
   for j in range(2):
    sp=loc(p,'rdSpeakAll')
    if sp.count():sp.first.click();rdready(p);y.setdefault('speech',[]).append({'requested':True,'controls':controls(p)})
    st=loc(p,'rdVoiceStop')
    if st.count():st.first.click();rdready(p);y['speech'][-1]['stop']=True
  if NAME=='C':
   # Do not count assisted attempts as independent if the actual stored support is nonzero.
   b=p.get_by_text('隐藏拼音',exact=False)
   if b.count()==1 and b.is_visible():b.click();rdready(p)
  loc(p,'rdReadDone').first.click();rdready(p)
  q=p.evaluate("()=>window.__AMC8_ReadingRuntime.engine().current().question")
  y['questionId']=q['id'];y['derivation']=e['derivation']
  if q['id']!=e['id']:y['gap']='EXPECTED_ID_NOT_MATCHED';continue
  picks=[v for v in loc(p,'rdPick').all() if norm(rdclean(v))==norm(e['correct'])]
  if len(picks)!=1:y['gap']='EXPECTED_VISIBLE_CHOICE_NOT_MATCHED';continue
  y['before']=rdstate(p);picks[0].click();loc(p,'rdSubmit').first.click();rdready(p);y['after']=rdstate(p)
  y['newAttempts']=[v for v in y['after']['snapshot']['events'] if v.get('type')=='attempt' and v.get('id') not in {a.get('id') for a in y['before']['snapshot']['events']}]
  y['afterShot']=snap(p,NAME+'-day-'+str(day)+'-answer')
 x['readingParent']=read_report(p)
 # Execute actual recommendation control if displayed/enabled; no guessed route.
 buttons=[v for v in p.locator('.rd-parent button:visible').all() if '打开对应补强' in rdclean(v)]
 if buttons and buttons[0].is_enabled():
  buttons[0].click();rdready(p);x['recommendation']={'text':p.locator('#app').inner_text(),'controls':controls(p),'shot':snap(p,NAME+'-recommendation')}
 else:x['limits'].append('recommendation not enabled in actual profile')
 # Additional missing width targets, not RC73 completed layout widths.
 x['viewportDelta']=[]
 for width in (375,390,1180):
  p.set_viewport_size({'width':width,'height':768})
  x['viewportDelta'].append({'width':width,'dom':p.evaluate("()=>({viewport:document.documentElement.clientWidth,scroll:document.documentElement.scrollWidth,controls:[...document.querySelectorAll('#app button')].filter(x=>x.getClientRects().length).map(x=>({text:x.innerText,r:x.getBoundingClientRect().right,l:x.getBoundingClientRect().left}))})"),'shot':snap(p,NAME+'-width-'+str(width))})
 final=rdstate(p);x['priorReadingAttemptsRetained']=retained(old_attempts,{v.get('id'):v for v in final['snapshot']['events'] if v.get('type')=='attempt'})
 ready_profile(p);x['mathEventsExact']=old_events(state_report(p))==old_events(math0)
 return p
x={'profile':NAME,'kind':KIND,'engine':ENGINE,'formal':'fcef9785308363379b028129871c92700e1f93d4','sourceRun':45526410091,'limits':[],'errors':[],'status':'PARTIAL'}
try:
 with sync_playwright() as pw:
  b=getattr(pw,ENGINE).launch(headless=True,**({'args':['--no-sandbox','--disable-dev-shm-usage']} if ENGINE=='chromium' else {}))
  s=json.loads((PRIOR/f'R-{NAME}-storage.json').read_text())
  for o in s['origins']:o['origin']='https://dsp233.github.io'
  ctx=b.new_context(storage_state=s,viewport={'width':1024,'height':768},record_video_dir=str(OUT/'video'),record_video_size={'width':800,'height':600},accept_downloads=True);p=ctx.new_page();p.set_default_timeout(12000)
  try:
   # Confirm actual public identity before using any restored data.
   response=p.request.get(PUB+'index.html?d-shared-continuation=20261127',headers={'Cache-Control':'no-cache'});assert response.ok
   x['publicSHA']=hashlib.sha256(response.body()).hexdigest();assert x['publicSHA']==hashlib.sha256((ROOT/'index.html').read_bytes()).hexdigest(),'public version differs'
   p.on('dialog',lambda d:d.accept() if '家长' in d.message else d.dismiss())
   p=math_case(p,ctx,x) if KIND=='math' else reading_case(p,ctx,x)
   ctx.storage_state(path=str(OUT/f'{KIND}-{NAME}-storage.json'));x['status']='OBSERVED'
  except Exception as e:
   x['errors'].append(repr(e))
   try:x['errorShot']=snap(p,NAME+'-error')
   except:pass
  finally:ctx.close();b.close()
finally:
 srv.shutdown()
 (OUT/f'd-shared-continuation-{KIND}-{NAME}.json').write_text(json.dumps(x,ensure_ascii=False,indent=2))
 print('D_CONTINUATION '+json.dumps({'profile':NAME,'kind':KIND,'status':x['status'],'limits':x['limits'],'errors':x['errors'],'groups':x.get('groups'),'mathSteps':[{ 'id':z['id'],'wrongCount':len(z.get('wrong',[])),'helpLevels':[a['actual'].get('helpLevel') for a in z.get('help',[])],'result':(z.get('submit') or {}).get('feedback'),'gap':z.get('gap')} for z in x.get('newSteps',[])],'readingSteps':[{'id':z.get('questionId'),'newAttempts':z.get('newAttempts'),'gap':z.get('gap')} for z in x.get('readingSteps',[])],'priorEventsRetained':x.get('priorEventsRetained'),'afterParentEventsExact':x.get('afterParentEventsExact'),'alternativeEntry':x.get('alternativeEntry'),'afterReadingEventsExact':x.get('afterReadingEventsExact'),'priorReadingAttemptsRetained':x.get('priorReadingAttemptsRetained'),'mathEventsExact':x.get('mathEventsExact')},ensure_ascii=False),flush=True)
