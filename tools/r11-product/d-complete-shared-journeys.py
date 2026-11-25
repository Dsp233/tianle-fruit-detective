"""D original PM-04/05/06/07 and FIX2-LOAD-02 selection/restore delta; no new math credit."""
import json,os,sys,threading,functools,hashlib,subprocess,concurrent.futures,re
from pathlib import Path
from http.server import SimpleHTTPRequestHandler,ThreadingHTTPServer
from playwright.sync_api import sync_playwright
ROOT=Path(os.environ['D_PRODUCT']);OUT=Path('r11-probe-output');OUT.mkdir(exist_ok=True)
assert subprocess.check_output(['git','-C',str(ROOT),'rev-parse','HEAD'],text=True).strip()=='f306ceafc90b16e5794e3e4a1df95101a73e2778'
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
def journey(spec):
 name,targets=spec;x={'profile':name,'targets':targets,'stages':[],'errors':[],'groups':[]}
 with sync_playwright() as pw:
  b=pw.chromium.launch(headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
  ctx=b.new_context(viewport={'width':1024,'height':768},record_video_dir=str(OUT/'video'/name),record_video_size={'width':800,'height':600},accept_downloads=True)
  p=ctx.new_page();p.set_default_timeout(9000);p.on('pageerror',lambda e:x['errors'].append(str(e)));p.on('dialog',lambda d:d.accept() if '家长' in d.message else d.dismiss())
  try:
   p.goto(URL.split('index.html')[0],wait_until='domcontentloaded');p.locator('[data-home-hub]').wait_for();x['homeShot']=snap(p,name+'-home')
   p.locator('[data-home-hub] [data-action=home]').click();ready(p);select_scope(p,targets);x['scopeShot']=snap(p,name+'-scope')
   candidates=group_candidates(p,targets);x['eligibleGroups']=candidates
   # P-A/P-B/P-D use different known groups when possible; P-C also distinct original structures.
   offset={'P-A':0,'P-B':3,'P-C':6,'P-D':9}[name]
   candidates=candidates[offset:]+candidates[:offset]
   for g in candidates[:6]:
    if len(x['stages'])>=10:break
    math_home(p);select_scope(p,targets);choose_group(p,g);x['groups'].append(g)
    for j in range(4):
     if len(x['stages'])>=10:break
     a=active(p);tid=a['id'];e=expected.get(tid);n=len(x['stages'])+1
     y={'step':n,'id':tid,'before':a,'shot':snap(p,name+f'-task-{n}'),'text':p.locator('#app').inner_text()[:4000]};x['stages'].append(y)
     y['profileEligible']=set(a.get('definition',{}).get('requiredKnowledge',[]) or []).issubset(set(a.get('profileSnapshot',{}).get('declaredSkillIds',[])))
     if not e:y['stop']='NO_FROZEN_EXPECTATION';break
     if name!='P-C' and n in (4,5):
      y['wrong']=try_answer(p,a,e,True);a=active(p)
      if y['wrong']['status']=='OBSERVED':y['wrongShot']=snap(p,name+f'-wrong-{n}')
     if name!='P-C' and n==6:
      h=loc(p,'rtmHint')
      if h.count():
       h.first.click();ready(p);y['hint1']=active(p);y['hintShot']=snap(p,name+'-hint1')
       nxt=loc(p,'rtmHintNext')
       if nxt.count() and nxt.first.is_enabled():nxt.first.click();ready(p);y['hint2']=active(p);y['hint2Shot']=snap(p,name+'-hint2')
       a=active(p)
     if name!='P-C' and n==7:
      # Real access controls only; not audible-speech certification.
      c=controls(p);y['accessControls']=c
      btn=p.get_by_text('朗读题目',exact=False)
      if btn.count()==1 and btn.is_visible():
       btn.click();y['speechTriggered']=True;stop=p.get_by_text('停止朗读',exact=True)
       if stop.count() and stop.first.is_visible():stop.first.click();y['speechStopped']=True
      a=active(p)
     y['submit']=try_answer(p,a,e)
     if y['submit']['status']!='OBSERVED' or y['submit']['actual']['feedback']['outcome']!='VERIFIED':break
     y['afterShot']=snap(p,name+f'-after-{n}')
     if n==10:break
     nxt=loc(p,'rtmNext')
     if not nxt.count() or not nxt.first.is_enabled():y['stop']='NO_NEXT';break
     prev=a['attemptId'];nxt.first.click();ready(p)
     try:p.wait_for_function("""prev=>{let a=ExamMappingUI.exportDraft().record?.sessions?.active;return !!a&&a.attemptId!==prev&&a.submissionOrdinal===0}""",arg=prev,timeout=7000);wait_task(p)
     except Exception:y['afterNextText']=p.locator('#app').inner_text()[:3500];break
   before=state_report(p);x['mathBefore']=before
   q=ctx.new_page();q.goto(URL.split('index.html')[0],wait_until='domcontentloaded');q.locator('[data-home-hub]').wait_for();q.locator('[data-home-hub] [data-action=reading]').click();rdready(q)
   x['readingBefore']=rdstate(q);x['readingShot']=snap(q,name+'-reading')
   q.close();p.bring_to_front();x['mathSameAfterSecondTab']=state_report(p)==before
   p.reload(wait_until='domcontentloaded');ready(p);x['mathAfter']=state_report(p);x['mathExactAfterReload']=x['mathAfter']==before;x['reloadShot']=snap(p,name+'-reload')
   math_home(p);unlock(p);beforeSel=selected(p);x['beforeRevoke']=beforeSel
   a=active(p) or {};need=(a.get('definition') or {}).get('requiredKnowledge',[]);rem=next((k.split('.')[0] for k in need if k.split('.')[0] in beforeSel),beforeSel[-1] if beforeSel else None)
   if rem:
    p.locator(f'[data-action=topicSelect][data-code="{rem}"]:visible').click();ready(p);x['afterRevoke']=selected(p);x['revoked']=rem;x['revokeControls']=controls(p);x['revokeText']=p.locator('#app').inner_text();x['revokeShot']=snap(p,name+'-revoked')
    rs=p.get_by_text('继续上次',exact=False)
    if rs.count()==1 and rs.is_visible() and rs.is_enabled():rs.click();ready(p);x['postRevokeActive']=active(p);x['postRevokeText']=p.locator('#app').inner_text();x['postRevokeShot']=snap(p,name+'-post-revoke')
   ctx.storage_state(path=str(OUT/f'{name}-storage.json'))
   x['status']='OBSERVED'
  except Exception as e:x['errors'].append(repr(e));x['status']='PARTIAL';x['errorShot']=snap(p,name+'-error')
  finally:ctx.close();b.close()
 return x
def diagnostic(run_spec):
 engine,week=run_spec;name=f'{engine}-{week}';x={'engine':engine,'set':week,'rows':[],'errors':[]}
 with sync_playwright() as pw:
  b=getattr(pw,engine).launch(headless=True,**({'args':['--no-sandbox','--disable-dev-shm-usage']} if engine=='chromium' else {}))
  ctx=b.new_context(viewport={'width':1024,'height':768},record_video_dir=str(OUT/'video'/name),record_video_size={'width':800,'height':600})
  p=ctx.new_page();p.set_default_timeout(9000);p.on('pageerror',lambda e:x['errors'].append(str(e)))
  try:
   p.goto(URL.split('index.html')[0],wait_until='domcontentloaded');p.locator('[data-home-hub]').wait_for();p.locator('[data-home-hub] [data-action=reading]').click();rdready(p)
   p.locator('[data-action=rdParent]:visible').last.click();p.locator('.rd-parent').wait_for()
   p.locator(f'[data-action=rdDxSet][data-set="R2-DRAFT-{week}"]:visible').click()
   x['beforeConfirmDisabled']=loc(p,'rdDiagnostic').first.is_disabled();x['preControls']=controls(p);x['selection']=snap(p,name+'-selection')
   loc(p,'rdKnowledgeConfirm').first.click();x['afterConfirmEnabled']=loc(p,'rdDiagnostic').first.is_enabled();loc(p,'rdDiagnostic').first.click();rdready(p)
   for _ in range(4):
    done=loc(p,'rdReadDone')
    if done.count():done.first.click();rdready(p)
    p.wait_for_function("Boolean(window.__AMC8_ReadingRuntime.engine().current()?.question?.id)",timeout=9000)
    q=p.evaluate("()=>window.__AMC8_ReadingRuntime.engine().current().question");qid=q['id'];e=diag_expected.get(qid)
    y={'id':qid,'before':rdstate(p),'visibleOptions':[rdclean(v) for v in loc(p,'rdPick').all()],'question':rdclean(p.locator('#app')),'beforeShot':snap(p,name+'-'+qid+'-before')};x['rows'].append(y)
    if not e:y['stop']='UNFROZEN_QUESTION';break
    # Independent ordinal freeze; product options map that index into text, never read product answer.
    val=q['options'][e-1];y['expectedText']=val;y['displayOrderSameAsStorage']=y['visibleOptions']==q['options'];hits=[i for i in loc(p,'rdPick').all() if rdclean(i)==val]
    if len(hits)!=1:y['stop']='OPTION_MISMATCH';break
    if len(x['rows'])==1 and week in ('W03','W07','W11'):
     ws=[i for i in loc(p,'rdPick').all() if rdclean(i)!=val];ws[0].click();loc(p,'rdSubmit').first.click();rdready(p);y['wrong']=rdstate(p);y['wrongShot']=snap(p,name+'-wrong')
    hits=[i for i in loc(p,'rdPick').all() if rdclean(i)==val];hits[0].click();loc(p,'rdSubmit').first.click();rdready(p)
    y['after']=rdstate(p);y['afterShot']=snap(p,name+'-'+qid+'-after')
    events=[v for v in y['after']['snapshot']['events'] if v.get('type')=='attempt' and v.get('questionId')==qid];y['attempts']=events;y['correct']=bool(events and events[-1].get('correct'))
    if not y['correct']:break
    nxt=loc(p,'rdNext');nexts=[i for i in p.locator('#app button:visible').all() if rdclean(i)=='下一步']
    if nxt.count()==1:nxt.first.click();rdready(p)
    elif len(nexts)==1:nexts[0].click();rdready(p)
    else:y['endControls']=controls(p);break
   before=rdstate(p);p.reload(wait_until='domcontentloaded');rdready(p);after=rdstate(p)
   ev=lambda s:[v for v in s['snapshot']['events'] if v.get('type')=='attempt']
   x['attemptsRetained']=ev(before)==ev(after);x['afterReload']=after;x['reloadShot']=snap(p,name+'-reload');ctx.storage_state(path=str(OUT/f'{name}-storage.json'));x['status']='OBSERVED'
  except Exception as ex:x['errors'].append(repr(ex));x['status']='PARTIAL';x['errorShot']=snap(p,name+'-error')
  finally:ctx.close();b.close()
 return x
diag_expected={q['id']:q['optionOrdinal'] for row in json.loads((D/'d-reading-diagnostic-208-independent-freeze.json').read_text())['rows'] for q in row['answers']}
try:
 specs=[('P-A',['A01','A02','N01','N02','R01','R02','G01','G02']),('P-B',['A01','A02','N01','N02','R01','R02','G01','G02','D01','D02']),('P-C',['A01','A02','N01','N02','R01','R02','G01','G02','D01','D02','G03','G04','S01','S02']),('P-D',['A01','A02','N01','N02','R01','R02','G01','G02'])]
 with concurrent.futures.ThreadPoolExecutor(max_workers=6) as pool:
  jobs=[pool.submit(journey,s) for s in specs]
  dxjobs=[pool.submit(diagnostic,('chromium',w)) for w in ['BASELINE']+[f'W{i:02}' for i in range(1,13)]]
  dxjobs.append(pool.submit(diagnostic,('webkit','W12')))
  m=[j.result() for j in jobs];d=[j.result() for j in dxjobs]
 (OUT/'d-full-journey-math.json').write_text(json.dumps(m,ensure_ascii=False,indent=2))
 (OUT/'d-full-journey-diagnostic.json').write_text(json.dumps(d,ensure_ascii=False,indent=2))
 for x in m:print('D_MATH_JOURNEY '+json.dumps({'profile':x['profile'],'status':x['status'],'groups':x['groups'],'errors':x['errors'],'same':x.get('mathSameAfterSecondTab'),'reload':x.get('mathExactAfterReload'),'revoke':x.get('revoked'),'stages':[{'id':s['id'],'eligible':s['profileEligible'],'stop':s.get('stop'),'outcome':(s.get('submit',{}).get('actual',{}).get('feedback') or {}).get('outcome'),'ordinal':s.get('submit',{}).get('actual',{}).get('submissionOrdinal'),'assisted':(s.get('submit',{}).get('actual',{}).get('feedback') or {}).get('methodAssisted'),'wrong':s.get('wrong',{}).get('status'),'hint':bool(s.get('hint1'))} for s in x['stages']]},ensure_ascii=False),flush=True)
 for x in d:print('D_DX_JOURNEY '+json.dumps({'engine':x['engine'],'set':x['set'],'status':x['status'],'errors':x['errors'],'gate':x.get('beforeConfirmDisabled'),'enabled':x.get('afterConfirmEnabled'),'retained':x.get('attemptsRetained'),'rows':[{'id':r['id'],'correct':r.get('correct'),'sameOrder':r.get('displayOrderSameAsStorage'),'stop':r.get('stop'),'attempts':[{k:v.get(k) for k in ['correct','first','aidLevel','independent','priorExposure','diagnosticValidity','diagnostic']} for v in r.get('attempts',[])]} for r in x['rows']]},ensure_ascii=False),flush=True)
finally:srv.shutdown()
