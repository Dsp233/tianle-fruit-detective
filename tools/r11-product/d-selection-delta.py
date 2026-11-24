"""D original PM-04/05/06/07 and FIX2-LOAD-02 selection/restore delta; no new math credit."""
import json,os,sys,threading,functools,hashlib,subprocess,concurrent.futures,re
from pathlib import Path
from http.server import SimpleHTTPRequestHandler,ThreadingHTTPServer
from playwright.sync_api import sync_playwright
ROOT=Path(os.environ['D_PRODUCT']);OUT=Path('r11-probe-output');OUT.mkdir(exist_ok=True)
assert subprocess.check_output(['git','-C',str(ROOT),'rev-parse','HEAD'],text=True).strip()=='3f22d8002406857a33a3e254ebafc4366f6cec51'
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
specs=[(0,[]),(1,['A01']),(3,['A01','A02','N01']),(8,['A01','A02','N01','N02','R01','R02','G01','G02']),(10,['A01','A02','N01','N02','R01','R02','G01','G02','D01','D02'])]
def run(spec):
 count,targets=spec;x={'count':count,'target':targets,'status':'PARTIAL','errors':[],'steps':[]}
 with sync_playwright() as pw:
  b=pw.chromium.launch(headless=True,args=['--no-sandbox','--disable-dev-shm-usage']);ctx=b.new_context(viewport={'width':1024,'height':768});p=ctx.new_page();p.set_default_timeout(12000)
  p.on('dialog',lambda d:d.accept() if '家长' in d.message and ('确认'in d.message or '调整'in d.message) else d.dismiss())
  try:
   p.goto(URL,wait_until='domcontentloaded');ready(p);unlock(p)
   # Use only visible controls; no private setting or task injection.
   existing=selected(p)
   for t in existing:
    if t not in targets:
     p.locator(f'[data-action=topicSelect][data-code="{t}"]:visible').click();ready(p)
   for t in targets:
    if t not in selected(p):
     p.locator(f'[data-action=topicSelect][data-code="{t}"]:visible').click();ready(p)
   x['selected']=selected(p);assert x['selected']==sorted(targets),x['selected']
   x['selectionControls']=controls(p);x['selectionShot']=snap(p,f'{count}-selection')
   blocked=[c for c in x['selectionControls'] if c['action']=='sourceToggle' and ('袋鼠' in c['text'] or '上教版' in c['text'])]
   x['externalSourceDisabled']=len(blocked)==2 and all(c['disabled'] for c in blocked)
   # Refresh and check exact selected scope. Gate can legitimately re-lock on reload.
   p.reload(wait_until='domcontentloaded');ready(p)
   x['selectedAfterReload']=selected(p);assert x['selectedAfterReload']==sorted(targets)
   start=loc(p,'topicStart').first
   x['start']={'present':bool(start.count()),'enabled':bool(start.count() and start.is_enabled()),'homeText':p.locator('#app').inner_text()}
   if not start.count() or not start.is_enabled():
    x['status']='OBSERVED_NO_START';x['noStartShot']=snap(p,f'{count}-no-start')
   else:
    start.click();ready(p)
    # Record actual route and visible identity; wait for normal transition, never select a forced QA task.
    p.wait_for_function("""()=>!!document.querySelector('[data-rtm-task]')||!!document.querySelector('[data-action=competitionPick]')||!!document.querySelector('[data-action=topicSkip]')||!!document.querySelector('[data-action=rtmConnectedResume]')""",timeout=12000)
    a=p.evaluate(state);x['first']=a;x['taskText']=p.locator('#app').inner_text();x['taskShot']=snap(p,f'{count}-first')
    if a and a['id']:
     task=p.locator('[data-rtm-task]');e=expected.get(a['id'])
     x['taskPolicy']=p.evaluate("""({id,topics})=>{let t=ExamMapping.data.tasks[id],profile=SourceCatalog.profile({sourceIds:['AMC8'],examIds:[],topicIds:topics});return {taskId:id,required:t?.requiredKnowledge,eligible:t?ExamMapping.taskAllowed(t,profile).eligible:null}}""",{'id':a['id'],'topics':targets})
     if e and task.is_visible():
      title=task.locator('.task-title').inner_text();g=task.locator('[data-rtm-givens]');given=g.inner_text() if g.count() else '';choices=task.locator('[data-action=rtmChoice]:visible').all_inner_texts()
      if 'promptFingerprint' in e:
       promptMatch=hashlib.sha256(json.dumps([norm(title),norm(given),sorted(map(norm,choices))],ensure_ascii=False,separators=(',',':')).encode()).hexdigest()==e['promptFingerprint']
      else:promptMatch=norm(title)==norm(e['prompt']) and norm(given)==norm(e['givenText']) and sorted(map(norm,choices))==sorted(map(norm,e['options']))
      if promptMatch:
       v=e['answer']
       if choices:
        matches=[i for i in task.locator('[data-action=rtmChoice]:visible').all() if norm(i.inner_text())==norm(v)];assert len(matches)==1;matches[0].click()
       else:task.locator('[data-rtm-input]:visible').fill(v)
       ready(p);task.locator('[data-action=rtmSubmit]:visible').click()
       p.wait_for_function("""id=>{let a=ExamMappingUI.exportDraft().record?.sessions?.active;return a?.attemptId===id&&a.submissionOrdinal===1&&!!a.feedback?.outcome&&progressStore.getStatus()==='ready'}""",arg=a['attemptId'])
       x['transit']={'actual':p.evaluate(state),'credit':'REUSE_FROZEN_EXPECTATION_ONLY','shot':snap(p,f'{count}-submit')}
       if x['transit']['actual']['outcome']=='VERIFIED' and loc(p,'rtmNext').count():
        loc(p,'rtmNext').first.click();ready(p)
        p.wait_for_function("""id=>{let a=ExamMappingUI.exportDraft().record?.sessions?.active;return !!a&&a.attemptId!==id&&a.submissionOrdinal===0}""",arg=a['attemptId'],timeout=8000)
        x['next']=p.evaluate(state);x['nextShot']=snap(p,f'{count}-next')
     x['status']='OBSERVED_ALLOCATION'
    else:x['status']='OBSERVED_OTHER_ROUTE'
  except Exception as exc:x['errors'].append(repr(exc));x['errorShot']=snap(p,f'{count}-error')
  finally:ctx.close();b.close()
 return x
try:
 with concurrent.futures.ThreadPoolExecutor(max_workers=3) as pool:rows=list(pool.map(run,specs))
 receipt={'base':'3f22d8002406857a33a3e254ebafc4366f6cec51','scope':'actual 0/1/3/8/10 normal topic selection and refresh; first allocation and any prior frozen-answer transit; no complete persona or new grade claim','rows':rows}
 (OUT/'d-selection-delta.json').write_text(json.dumps(receipt,ensure_ascii=False,indent=2))
 for x in rows:print('D_SELECTION_ROW '+json.dumps({k:v for k,v in x.items() if k!='selectionControls'},ensure_ascii=False),flush=True)
finally:srv.shutdown()
