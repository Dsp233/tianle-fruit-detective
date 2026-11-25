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
def run(spec):
 name,targets=spec; x={'profile':name,'targets':targets,'stages':[],'errors':[]}
 with sync_playwright() as pw:
  b=pw.chromium.launch(headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
  ctx=b.new_context(viewport={'width':1024,'height':768},record_video_dir=str(OUT/'video'/name),record_video_size={'width':800,'height':600});p=ctx.new_page();p.set_default_timeout(9000)
  p.on('pageerror',lambda e:x['errors'].append(str(e)))
  p.on('dialog',lambda d:d.accept() if '家长' in d.message else d.dismiss())
  try:
   p.goto(URL.split('index.html')[0],wait_until='domcontentloaded');p.locator('[data-home-hub]').wait_for();x['homeShot']=snap(p,name+'-home')
   p.locator('[data-home-hub] [data-action=home]').click();ready(p);unlock(p)
   for t in selected(p):
    if t not in targets:p.locator(f'[data-action=topicSelect][data-code="{t}"]:visible').click();ready(p)
   for t in targets:
    if t not in selected(p):p.locator(f'[data-action=topicSelect][data-code="{t}"]:visible').click();ready(p)
   x['selected']=selected(p);x['selection']=snap(p,name+'-selection');x['selectionControls']=controls(p)
   start=loc(p,'topicStart').first
   if not start.count() or not start.is_enabled():x['status']='NO_SUPPLY';x['text']=p.locator('#app').inner_text();return x
   start.click();ready(p);wait_task(p)
   for step in range(10):
    a=active(p);id=a['id'];e=expected.get(id)
    y={'step':step+1,'id':id,'before':a,'shot':snap(p,name+f'-task-{step+1}'),'text':p.locator('#app').inner_text()[:4500]}
    y['policy']=p.evaluate("""({id,topics})=>{let t=ExamMapping.data.tasks[id],profile=SourceCatalog.profile({sourceIds:['AMC8'],examIds:[],topicIds:topics});return {required:t?.requiredKnowledge,eligible:t?ExamMapping.taskAllowed(t,profile).eligible:null,familyId:t?.familyId,criticalDecision:t?.criticalDecision,taskSignature:t?.taskSignature}}""",{'id':id,'topics':targets})
    x['stages'].append(y)
    if not e:y['stop']='NO_FROZEN_EXPECTATION';break
    if name=='P-D' and step==0:
     y['wrong']=try_answer(p,a,e,True)
     if y['wrong']['status']=='OBSERVED':
      y['wrongShot']=snap(p,name+'-wrong')
      a=active(p)
      y['controlsAfterWrong']=controls(p)
      h=p.locator('[data-rtm-task] [data-action=rtmHint]:visible')
      if h.count():
       h.first.click();ready(p);y['hint']=active(p);y['hintShot']=snap(p,name+'-hint')
      a=active(p)
    y['submit']=try_answer(p,a,e)
    if y['submit']['status']!='OBSERVED' or y['submit']['actual']['feedback']['outcome']!='VERIFIED':break
    y['afterShot']=snap(p,name+f'-after-{step+1}')
    nxt=loc(p,'rtmNext')
    if not nxt.count() or not nxt.first.is_enabled():y['stop']='NO_NEXT';break
    prev=a['attemptId'];nxt.first.click();ready(p)
    try:p.wait_for_function("""prev=>{let a=ExamMappingUI.exportDraft().record?.sessions?.active;return !!a&&a.attemptId!==prev&&a.submissionOrdinal===0}""",arg=prev,timeout=7000);wait_task(p)
    except Exception:y['afterNextText']=p.locator('#app').inner_text()[:3500];break
   before=state_report(p)
   # Second tab loads reading while original math tab remains open; preserve all original math attempts.
   q=ctx.new_page();q.goto(URL.split('index.html')[0],wait_until='domcontentloaded');q.locator('[data-home-hub]').wait_for();q.locator('[data-home-hub] [data-action=reading]').click();q.wait_for_function("window.__AMC8_ReadingRuntime&&window.__AMC8_ReadingRuntime.engine().status().status==='ready'",timeout=45000)
   x['readingHome']=snap(q,name+'-reading-home');x['readingText']=q.locator('#app').inner_text()[:4000]
   q.close();p.bring_to_front();x['mathSameAfterSecondTab']=state_report(p)==before
   p.reload(wait_until='domcontentloaded');ready(p);after=state_report(p)
   x['mathExactAfterReload']=after==before;x['afterReloadActive']=active(p);x['reloadShot']=snap(p,name+'-reload')
   if loc(p,'topicParentUnlock').count()==0:
    back=loc(p,'rtmBack')
    if back.count():back.first.click();ready(p)
   if loc(p,'topicParentUnlock').count():
    unlock(p);beforeSel=selected(p);x['beforeRevoke']=beforeSel
    if beforeSel:
     t=beforeSel[-1];p.locator(f'[data-action=topicSelect][data-code="{t}"]:visible').click();ready(p)
     x['afterRevoke']=selected(p);x['revoked']=t;x['revokeText']=p.locator('#app').inner_text()[:4000];x['revokeShot']=snap(p,name+'-revoke')
   x['status']='OBSERVED'
  except Exception as e:x['errors'].append(repr(e));x['status']='PARTIAL';x['errorShot']=snap(p,name+'-error')
  finally:ctx.close();b.close()
 return x
try:
 reading_delta()
 specs=[('P-A',['A01','A02','N01','N02','R01','R02','G01','G02']),('P-B',['A01','A02','N01','N02','R01','R02','G01','G02','D01','D02']),('P-C',['A01','A02','N01','N02','R01','R02','G01','G02','D01','D02','G03','G04','S01','S02']),('P-D',['A01','A02','N01','N02','R01','R02','G01','G02'])]
 with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:rows=list(pool.map(run,specs))
 (OUT/'d-persona-journey-delta.json').write_text(json.dumps({'base':'f306ceafc90b16e5794e3e4a1df95101a73e2778','scope':'normal entry isolated profile paths; frozen prior math transit only, not new correctness counts; actual scope revocation and second tab','rows':rows},ensure_ascii=False,indent=2))
 for x in rows:print('D_PERSONA '+json.dumps({k:v for k,v in x.items() if k not in ('selectionControls','stages','readingText','revokeText','afterReloadActive')}|{'stages':[{'step':s['step'],'id':s['id'],'policy':s['policy'],'submit':s.get('submit',{}).get('status'),'outcome':(s.get('submit',{}).get('actual',{}).get('feedback') or {}).get('outcome'),'stop':s.get('stop'),'wrong':s.get('wrong',{}).get('status'),'hint':bool(s.get('hint'))} for s in x['stages']]},ensure_ascii=False),flush=True)
finally:srv.shutdown()
