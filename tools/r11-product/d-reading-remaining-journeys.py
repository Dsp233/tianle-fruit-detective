"""D original PM-04/05/06/07 and FIX2-LOAD-02 selection/restore delta; no new math credit."""
import json,os,sys,threading,functools,hashlib,subprocess,concurrent.futures,re
from pathlib import Path
from http.server import SimpleHTTPRequestHandler,ThreadingHTTPServer
from playwright.sync_api import sync_playwright
ROOT=Path(os.environ['D_PRODUCT']);OUT=Path('r11-probe-output');OUT.mkdir(exist_ok=True)
assert subprocess.check_output(['git','-C',str(ROOT),'rev-parse','HEAD'],text=True).strip()=='d0c9c3e265a7a76052487d374255fcda35f21117'
D=Path('tools/r11-product')
expected={}
for f in sorted(D.glob('d-bulk-expected-*.json')):
 if f.name.endswith('freeze.json'):continue
 j=json.loads(f.read_text())
 for e in j.get('rows',[]):expected[e['id']]=e
class H(SimpleHTTPRequestHandler):
 def log_message(self,*a):pass
srv=ThreadingHTTPServer(('127.0.0.1',0),functools.partial(H,directory=str(ROOT)));threading.Thread(target=srv.serve_forever,daemon=True).start()
URL=f'http://127.0.0.1:{srv.server_port}/index.html#math'
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

import urllib.parse
PRIOR=Path('/tmp/d-shared')
prior_dx=json.loads((PRIOR/'d-full-journey-diagnostic.json').read_text())
prior_math=json.loads((PRIOR/'d-full-journey-math.json').read_text())
diag_expected={q['id']:q['optionOrdinal'] for row in json.loads((D/'d-reading-diagnostic-208-independent-freeze.json').read_text())['rows'] for q in row['answers']}
def context(b,storage,name):
 s=json.loads((PRIOR/storage).read_text())
 # Transport the exact synthetic profile bytes to the isolated server's different ephemeral port.
 new_origin=URL.split('/index.html')[0]
 for o in s['origins']:o['origin']=new_origin
 return b.new_context(storage_state=s,viewport={'width':1024,'height':768},record_video_dir=str(OUT/'video'/name),record_video_size={'width':800,'height':600},accept_downloads=True)
def rdhome(p):
 p.goto(URL.replace('#math','#reading'),wait_until='domcontentloaded')
 p.wait_for_function("Boolean(document.querySelector('[data-home-hub]')||window.__AMC8_ReadingRuntime)",timeout=45000)
 hub=p.locator('[data-home-hub] [data-action=reading]:visible')
 if hub.count():hub.first.click()
 rdready(p)
 if not loc(p,'rdPlan').count():
  h=loc(p,'rdHome')
  if h.count():h.first.click();rdready(p)
 loc(p,'rdPlan').first.wait_for(timeout=10000)
def attempts(s):
 return [e for e in s['snapshot']['events'] if e.get('type')=='attempt']
def next_rd(p):
 nxt=loc(p,'rdNext');nexts=[i for i in p.locator('#app button:visible').all() if rdclean(i)=='下一步']
 if nxt.count()==1:nxt.first.click();rdready(p);return True
 if len(nexts)==1:nexts[0].click();rdready(p);return True
 return False
def choose_text(p,val):
 hits=[i for i in loc(p,'rdPick').all() if rdclean(i)==val];assert len(hits)==1,(val,[rdclean(i) for i in loc(p,'rdPick').all()])
 hits[0].click();loc(p,'rdSubmit').first.click();rdready(p)
def support_controls(p,cond):
 out={'condition':cond}
 if cond=='C':
  speak=loc(p,'rdSpeakAll')
  if speak.count():speak.first.click();rdready(p);out['speechRequested']=True
  p.wait_for_timeout(400)
  stop=loc(p,'rdVoiceStop')
  if stop.count():stop.first.click();rdready(p);out['speechStopped']=True
 elif cond=='D':
  # This is a synthetic parent action to test the recording path; never claim real adult read or child outcome.
  details=p.locator('#app details > summary:visible');hits=[i for i in details.all() if '更多阅读帮助' in rdclean(i)]
  if len(hits)==1 and not hits[0].evaluate('e=>e.parentElement.open'):hits[0].click()
  hits=[i for i in p.locator('#app button:visible').all() if '家长读过原文' in rdclean(i)]
  if len(hits)==1:hits[0].click();rdready(p);out['syntheticParentReadControl']=True
 return out
def dx_continue(old):
 week=old['set'];engine='chromium';name=engine+'-'+week+'-continued';x={'set':week,'engine':engine,'rows':[],'errors':[],'forms':[]}
 with sync_playwright() as pw:
  b=pw.chromium.launch(headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
  ctx=context(b,f'chromium-{week}-storage.json',name);p=ctx.new_page();p.set_default_timeout(9000);p.on('pageerror',lambda e:x['errors'].append(str(e)))
  try:
   rdhome(p);before=rdstate(p);oldEvents=attempts(old['afterReload']);x['priorAttemptsExact']=attempts(before)==oldEvents;assert x['priorAttemptsExact']
   seen={e['questionId'] for e in oldEvents}
   for form in range(3):
    rdhome(p);loc(p,'rdParent').last.click();p.locator('.rd-parent').wait_for()
    p.locator(f'[data-action=rdDxSet][data-set="R2-DRAFT-{week}"]:visible').click()
    btn=loc(p,'rdDiagnostic').first
    if btn.is_disabled():loc(p,'rdKnowledgeConfirm').first.click()
    assert btn.is_enabled();btn.click();rdready(p)
    start=rdstate(p)['snapshot']['session'];x['forms'].append(start.get('diagnostic'))
    for i in range(4):
     done=loc(p,'rdReadDone')
     support={}
     if done.count():
      s=rdstate(p)['snapshot']['session'];cond=(s.get('diagnostic') or {}).get('condition')
      support=support_controls(p,cond)
      done=loc(p,'rdReadDone');done.first.click();rdready(p)
     p.wait_for_function("Boolean(window.__AMC8_ReadingRuntime.engine().current()?.question?.id)",timeout=9000)
     q=p.evaluate("()=>window.__AMC8_ReadingRuntime.engine().current().question");qid=q['id']
     y={'id':qid,'support':support,'priorExposedInPreviousRuns':qid in seen,'shot':snap(p,name+'-'+qid+'-before')};x['rows'].append(y)
     assert qid not in seen and qid in diag_expected,(qid,seen)
     val=q['options'][diag_expected[qid]-1]
     choose_text(p,val);state=rdstate(p);ev=[v for v in attempts(state) if v['questionId']==qid]
     y['actual']=ev[-1];y['correct']=ev[-1]['correct'];y['afterShot']=snap(p,name+'-'+qid+'-after')
     assert y['correct'];seen.add(qid)
     if not next_rd(p):
      y['endControls']=controls(p);break
   before=rdstate(p);p.reload(wait_until='domcontentloaded');rdready(p);after=rdstate(p);x['allAttemptsRetained']=attempts(before)==attempts(after);x['oldAttemptIdsRetained']=all(e in attempts(after) for e in oldEvents);x['after']=after;x['status']='OBSERVED'
   ctx.storage_state(path=str(OUT/f'{name}-storage.json'))
  except Exception as ex:x['errors'].append(repr(ex));x['status']='PARTIAL';x['errorShot']=snap(p,name+'-error')
  finally:ctx.close();b.close()
 return x
# W1 answer letters from already retained 84-day content report, only to reach UI states.
course=[('R-A','P-A',2,[(1,'B'),(2,'C'),(3,'A')],3,'C'),('R-B','P-B',1,[(1,'A'),(2,[1,3,2]),(3,'C')],2,'B'),('R-C','P-C',15,[(1,[2,3,1]),(2,'C'),(3,'A')],16,'B'),('R-D','P-D',3,[(1,'C'),(2,'A'),(3,'B')],4,'A')]
def course_answer(p,ans):
 q=p.evaluate("()=>window.__AMC8_ReadingRuntime.engine().current().question")
 if isinstance(ans,str):val=q['options'][ord(ans)-65];choose_text(p,val)
 else:
  for i in ans:
   val=q['options'][i-1];hits=[v for v in loc(p,'rdPick').all() if rdclean(v)==val];assert len(hits)==1;hits[0].click()
  loc(p,'rdSubmit').first.click();rdready(p)
 st=rdstate(p);ev=[e for e in attempts(st) if e['questionId']==q['id']];return ev[-1] if ev else None
def course_run(spec):
 rn,mn,day,ans,nextday,nextans=spec;x={'readingProfile':rn,'mathProfile':mn,'day':day,'rows':[],'errors':[]}
 old=next(t for t in prior_math if t['profile']==mn)
 with sync_playwright() as pw:
  b=pw.chromium.launch(headless=True,args=['--no-sandbox','--disable-dev-shm-usage']);ctx=context(b,mn+'-storage.json',rn);p=ctx.new_page();p.set_default_timeout(9000)
  p.on('pageerror',lambda e:x['errors'].append(str(e)))
  try:
   # Preserve exact math record after parent scope revoke and before any new reading actions.
   p.goto(URL,wait_until='domcontentloaded');ready(p);m0=state_report(p);x['oldEventsPreserved']=all(m0['eventsById'].get(k)==v for k,v in old['mathAfter']['eventsById'].items())
   rdhome(p);x['initialReading']=rdstate(p)
   def start_day(d):
    rdhome(p);loc(p,'rdPlan').first.click();p.locator(f'[data-action=rdStart][data-day="{d}"]:visible').click();rdready(p);p.locator('.rd-story-text').first.wait_for()
   start_day(day);x['storyShot']=snap(p,rn+'-story');x['storyText']=[rdclean(v) for v in p.locator('.rd-story-text:visible').all()]
   # Real reading access controls; not a true listening evaluation.
   if rn in ('R-A','R-B','R-D'):
    chars=loc(p,'rdChar');words=[v for v in chars.all() if '长' in rdclean(v) or '分' in rdclean(v)]
    if words:words[0].click();rdready(p);x['charAccess']=True
    sp=loc(p,'rdSpeakAll')
    if sp.count():sp.first.click();rdready(p);x['speechRequested']=True
    st=loc(p,'rdVoiceStop')
    if st.count():st.first.click();rdready(p);x['speechStopped']=True
   loc(p,'rdReadDone').first.click();rdready(p)
   for pos,answer in ans:
    q=p.evaluate("()=>window.__AMC8_ReadingRuntime.engine().current().question")
    assert q['id']==f'R2-S{day:02d}-{pos}',q['id']
    y={'id':q['id'],'beforeShot':snap(p,rn+'-'+q['id']+'-before')};x['rows'].append(y)
    y['actual']=course_answer(p,answer);y['afterShot']=snap(p,rn+'-'+q['id']+'-after')
    assert y['actual'] and y['actual']['correct']
    if not next_rd(p):break
   rb=rdstate(p);x['readingBeforeMath']=rb
   # Open math in same tab, use ordinary entry, confirm exact retained events. Then return reading.
   p.goto(URL,wait_until='domcontentloaded');ready(p);m1=state_report(p);x['mathRetainedAcrossReading']=m0==m1
   rdhome(p);r1=rdstate(p);x['readingRetainedAcrossMath']=attempts(rb)==attempts(r1);x['returnShot']=snap(p,rn+'-returned')
   start_day(nextday);loc(p,'rdReadDone').first.click();rdready(p);q=p.evaluate("()=>window.__AMC8_ReadingRuntime.engine().current().question")
   x['coldNewQuestion']=q['id'];x['coldNewBefore']=rdstate(p);x['coldNewAttempt']=course_answer(p,nextans);x['coldNewShot']=snap(p,rn+'-new')
   r2=rdstate(p);p.reload(wait_until='domcontentloaded');rdready(p);x['readingRetainedAfterReload']=attempts(r2)==attempts(rdstate(p));x['final']=rdstate(p);x['status']='OBSERVED';ctx.storage_state(path=str(OUT/f'{rn}-storage.json'))
  except Exception as ex:x['errors'].append(repr(ex));x['status']='PARTIAL';x['errorShot']=snap(p,rn+'-error')
  finally:ctx.close();b.close()
 return x
try:
 with concurrent.futures.ThreadPoolExecutor(max_workers=6) as pool:
  cjobs=[pool.submit(course_run,s) for s in course]
  djobs=[pool.submit(dx_continue,x) for x in prior_dx if x['engine']=='chromium']
  c=[j.result() for j in cjobs];d=[j.result() for j in djobs]
 (OUT/'d-reading-course-journeys.json').write_text(json.dumps(c,ensure_ascii=False,indent=2));(OUT/'d-reading-remaining-diagnostics.json').write_text(json.dumps(d,ensure_ascii=False,indent=2))
 for x in c:print('D_COURSE '+json.dumps({k:v for k,v in x.items() if k not in ('initialReading','readingBeforeMath','coldNewBefore','final','storyText','rows')}|{'rows':[{'id':r['id'],'correct':(r.get('actual') or {}).get('correct'),'aidLevel':(r.get('actual') or {}).get('aidLevel'),'independent':(r.get('actual') or {}).get('independent')} for r in x['rows']]},ensure_ascii=False),flush=True)
 for x in d:print('D_DX_CONT '+json.dumps({'set':x['set'],'status':x['status'],'errors':x['errors'],'priorAttemptsExact':x.get('priorAttemptsExact'),'oldRetained':x.get('oldAttemptIdsRetained'),'retained':x.get('allAttemptsRetained'),'forms':x['forms'],'rows':[{'id':r['id'],'correct':r.get('correct'),'support':r['support'],'eligible':(r.get('actual') or {}).get('diagnosticValidity')} for r in x['rows']]},ensure_ascii=False),flush=True)
finally:srv.shutdown()
