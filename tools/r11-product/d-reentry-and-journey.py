"""D six-dimensional remaining hint/restore and targeted visual/feedback review; no regrading."""
import os,sys,json,threading,functools,hashlib,subprocess,concurrent.futures
from pathlib import Path
from http.server import SimpleHTTPRequestHandler,ThreadingHTTPServer
from playwright.sync_api import sync_playwright
ROOT=Path(os.environ['D_PRODUCT']);OUT=Path('r11-probe-output');OUT.mkdir(exist_ok=True)
assert subprocess.check_output(['git','-C',str(ROOT),'rev-parse','HEAD'],text=True).strip()=='f306ceafc90b16e5794e3e4a1df95101a73e2778'
sys.path.insert(0,str(ROOT/'tools'))
from g1_reading_packets import config,unpack
control=config((ROOT/'qa/index.html').read_text())['math']['scripts'][-1]
assert control['id']=='f12930312b8e007ab222216e6f478d87b24a0856ed7b0e191a98326ce32bec85'
qa=unpack(control,lambda n:(ROOT/n).read_bytes()).decode()
rows=json.loads(Path('/tmp/d-score-input.json').read_text())['rows'];assert len(rows)==36
class H(SimpleHTTPRequestHandler):
 def log_message(self,*a):pass
srv=ThreadingHTTPServer(('127.0.0.1',0),functools.partial(H,directory=str(ROOT)));threading.Thread(target=srv.serve_forever,daemon=True).start()
URL=f'http://127.0.0.1:{srv.server_port}/index.html#math'
def ready(p):p.wait_for_function("Boolean(window.__AMC8_MATH_NAV)&&typeof progressStore!=='undefined'&&progressStore.getStatus()==='ready'",timeout=45000)
def snapshot(p):
 return p.evaluate("""()=>{let t=playerTask(),w=topicSession()?.items?.[0]?.draft?.work,m=w?.scopes?.main;return {id:t?.id,workId:w?.workId,help:m?.help,feedback:m?.feedback,answerState:m?.answerState,text:document.querySelector('#app').innerText,svgs:[...document.querySelectorAll('#app svg')].filter(x=>x.getClientRects().length).map(x=>({viewBox:x.getAttribute('viewBox'),text:x.textContent,markup:x.outerHTML})),controls:[...document.querySelectorAll('#app [data-action]')].filter(x=>x.getClientRects().length).map(x=>({action:x.dataset.action,text:x.innerText,disabled:!!x.disabled}))}}""")
def shot(p,ident,stage):
 f=OUT/f'{ident}-{stage}.png';p.screenshot(path=str(f),full_page=True);return dict(file=f.name,sha256=hashlib.sha256(f.read_bytes()).hexdigest())
def action(p,a):return p.locator(f'#app [data-action={a}]:visible').first


import re,time
BASE='f306ceafc90b16e5794e3e4a1df95101a73e2778'
def boot(p):
 p.goto(URL,wait_until='domcontentloaded')
 try:p.wait_for_function("Boolean(window.__AMC8_MATH_NAV)&&typeof progressStore!=='undefined'&&progressStore.getStatus()==='ready'",timeout=7000)
 except Exception:
  h=p.locator('[data-home-hub] [data-action=home]:visible')
  if h.count():h.first.click()
  p.wait_for_function("Boolean(window.__AMC8_MATH_NAV)&&typeof progressStore!=='undefined'&&progressStore.getStatus()==='ready'",timeout=12000)
def st(p):
 return p.evaluate("""()=>{let t=playerTask(),s=topicSession(),w=s?.items?.find(i=>i.taskId===t?.id)?.draft?.work||s?.items?.[0]?.draft?.work;return {id:t?.id,session:s?.id,workId:w?.workId,active:w?.activeScopeId,scopes:w?.scopes,location:location.href,text:document.querySelector('#app')?.innerText}}""")
def resume(p):
 boot(p)
 home=p.locator('#app')
 out={'initial':home.inner_text(),'steps':[]}
 # QA fixtures use synthetic exercise sources. Preserve original selected skills,
 # explicitly authorize only the missing original extension source through normal UI.
 if home.get_by_text('原创拓展',exact=False).count():
  gate=action(p,'topicParentUnlock')
  if gate.count() and '确认调整' in gate.inner_text():gate.click();ready(p)
  source=p.locator('#app [data-action=sourceToggle]:visible').filter(has_text='原创拓展')
  if source.count()==1:
   out['sourceBefore']=source.evaluate("e=>({text:e.innerText,pressed:e.getAttribute('aria-pressed'),class:e.className})")
   if '✓' not in source.inner_text() and source.get_attribute('aria-pressed')!='true':
    source.click();ready(p)
   out['sourceAfter']=source.evaluate("e=>({text:e.innerText,pressed:e.getAttribute('aria-pressed'),class:e.className})")
 btn=p.get_by_role('button',name='继续上次 →',exact=True)
 if btn.count()==0:btn=p.get_by_text('继续上次',exact=False).first
 if btn.count() and btn.is_enabled():btn.click();ready(p)
 out['after']=st(p);out['text']=home.inner_text()
 return out
def slim(s):
 return {k:{t:v.get(t) for t in ['input','help','answerState','feedback','attemptIds','lastSubmissionKey']} for k,v in (s.get('scopes') or {}).items()}
def run(engine,batch):
 result=[]
 with sync_playwright() as pw:
  b=getattr(pw,engine).launch(headless=True,**({'args':['--no-sandbox','--disable-dev-shm-usage']} if engine=='chromium' else {}))
  for e in batch:
   x={'id':e['id'],'recipe':e['recipe'],'engine':engine,'errors':[]}
   ctx=b.new_context(viewport={'width':1024,'height':768});p=ctx.new_page();p.set_default_timeout(5000)
   try:
    boot(p);p.add_script_tag(content=qa);p.wait_for_function('Boolean(window.AMC8_QA)')
    a=p.evaluate('r=>AMC8_QA.loadCase(r,true)',e['recipe']);assert all(a[k]==v for k,v in e['recipe'].items()) and a['taskId']==e['id']
    ready(p);action(p,'competitionIndependentVariation').click();ready(p)
    ext=p.locator('details.competition-extension');ext.wait_for(state='visible')
    if e['id']=='COMP-30D489A8':
     ext.locator('[data-action=competitionHint]:visible').first.click();ready(p)
     action(p,'competitionNextHint').count()
     n=ext.get_by_role('button',name='下一条提示',exact=True)
     if n.count() and n.is_enabled():n.click();ready(p)
     x['weightedHint2']={'state':snapshot(p),'shot':shot(p,e['id'],engine+'-weighted-hint2')}
    inp=p.locator('#app [data-competition-input="extension"]:visible');inp.fill('1');inp.press('Tab');ready(p)
    x['before']=st(p)
    p.close();p=ctx.new_page();p.set_default_timeout(5000)
    x['reentry']=resume(p);after=x['reentry']['after'];before=x['before']
    x['restore']={'sameTask':after.get('id')==before.get('id') and before.get('id') is not None,'sameWork':after.get('workId')==before.get('workId') and before.get('workId') is not None,'sameScope':after.get('active')==before.get('active') and before.get('active') is not None,'sameLearnerState':slim(before)==slim(after),'draftValue':slim(after).get(before.get('active'),{}).get('input')}
    x['shot']=shot(p,e['id'],engine+'-resumed')
   except Exception as ex:x['errors'].append(repr(ex))
   finally:ctx.close()
   result.append(x)
   print('D_REENTRY '+json.dumps({'id':x['id'],'engine':engine,'errors':x['errors'],'restore':x.get('restore'),'sourceBefore':x.get('reentry',{}).get('sourceBefore'),'sourceAfter':x.get('reentry',{}).get('sourceAfter'),'text':x.get('reentry',{}).get('text','')[:650],'weightedHint2':x.get('weightedHint2',{}).get('state',{}).get('text'),'weightedShot':x.get('weightedHint2',{}).get('shot')},ensure_ascii=False),flush=True)
  b.close()
 return result
def controls(engine):
 out=[]
 with sync_playwright() as pw:
  b=getattr(pw,engine).launch(headless=True,**({'args':['--no-sandbox','--disable-dev-shm-usage']} if engine=='chromium' else {}))
  for fam in ['equalDistanceSpeed','riverTravel']:
   c=b.new_context(viewport={'width':1024,'height':768});p=c.new_page();x={'engine':engine,'family':fam}
   try:
    boot(p);p.add_script_tag(content=qa);p.wait_for_function('Boolean(window.AMC8_QA)')
    a=p.evaluate('r=>AMC8_QA.loadCase(r,true)',{'familyId':fam,'configuration':fam,'seed':1,'generatorRevision':3});ready(p)
    assert a['familyId']==fam
    action(p,'competitionHint').click();ready(p);x['main']=snapshot(p);x['shot']=shot(p,fam,engine+'-main')
    action(p,'competitionIndependentVariation').click();ready(p);ext=p.locator('details.competition-extension');ext.locator('[data-action=competitionHint]:visible').first.click();ready(p)
    x['variation']=snapshot(p);x['variantShot']=shot(p,fam,engine+'-variation')
   except Exception as e:x['error']=repr(e)
   finally:c.close()
   out.append(x);print('D_JOURNEY_CONTROL '+json.dumps({k:v if k not in ('main','variation') else v['text'] for k,v in x.items()},ensure_ascii=False),flush=True)
  b.close()
 return out
try:
 with concurrent.futures.ThreadPoolExecutor(max_workers=6) as pool:
  jobs=[pool.submit(run,'chromium',rows[i::4]) for i in range(4)]
  jc=[pool.submit(controls,e) for e in ['chromium','webkit']]
  result=[x for job in jobs for x in job.result()];ct=[x for job in jc for x in job.result()]
 (OUT/'d-reentry-and-journey.json').write_text(json.dumps({'base':BASE,'rows':result,'controls':ct,'scope':'resume after explicit source authorization; no new mathematical grading; exact affected renderer other families'},ensure_ascii=False,indent=2))
finally:srv.shutdown()
