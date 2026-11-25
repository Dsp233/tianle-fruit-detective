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
 # Restore ordinary route without re-injecting QA or generating a new task.
 boot(p)
 a=st(p)
 if a.get('id') is None:
  for k in ['topicResume','topicStart','rtmConnectedResume']:
   b=p.locator(f'#app [data-action={k}]:visible:enabled')
   if b.count():
    b.first.click();p.wait_for_timeout(250);a=st(p);break
 return a
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
    ready(p);assert e['mainVisible'] in snapshot(p)['text']
    action(p,'competitionIndependentVariation').click();ready(p)
    ext=p.locator('details.competition-extension');ext.wait_for(state='visible')
    if e['id']=='COMP-30D489A8':
     ext.locator('[data-action=competitionHint]:visible').first.click();ready(p)
     x['weightedCurrentHint']={'state':snapshot(p),'shot':shot(p,e['id'],engine+'-rev5-variation-hint')}
    inp=p.locator('#app [data-competition-input="extension"]:visible')
    inp.fill('1');inp.press('Tab');ready(p)
    x['before']=st(p)
    x['beforeShot']=shot(p,e['id'],engine+'-draft')
    # Capture real URL and persisted draft; no reload of forced QA hash.
    x['keysBefore']=p.evaluate("()=>Object.keys(localStorage)")
    p.close();p=ctx.new_page();p.set_default_timeout(5000)
    x['after']=resume(p);x['afterShot']=shot(p,e['id'],engine+'-reopen')
    before=x['before'];after=x['after']
    x['restore']={k:before.get(k)==after.get(k) and before.get(k) is not None for k in ['id','workId','active','scopes']}
   except Exception as ex:
    x['errors'].append(repr(ex))
    try:x['failedState']={'url':p.url,'text':p.locator('#app').inner_text(timeout=2000)[:1800]}
    except Exception:pass
   finally:ctx.close()
   result.append(x)
   print('D_RESTORE_ROW '+json.dumps({'id':x['id'],'engine':engine,'recipe':e['recipe'],'errors':x['errors'],'restore':x.get('restore'),'beforeUrl':x.get('before',{}).get('location'),'afterId':x.get('after',{}).get('id'),'afterText':x.get('after',{}).get('text','')[:800],'failedState':x.get('failedState'),'weightedHint':x.get('weightedCurrentHint',{}).get('state',{}).get('text'),'weightedShot':x.get('weightedCurrentHint',{}).get('shot')},ensure_ascii=False),flush=True)
  b.close()
 return result
try:
 # Identify actual non-chase journey scene from deployed JS, rather than guess a control recipe.
 for e in config((ROOT/'index.html').read_text())['math']['scripts']:
  raw=unpack(e,lambda n:(ROOT/n).read_bytes()).decode()
  if "kind:'scene-journey'" in raw:
   for line in raw.splitlines():
    if "kind:'scene-journey'" in line:print('D_JOURNEY_SOURCE '+line[:2500],flush=True)
 with concurrent.futures.ThreadPoolExecutor(max_workers=6) as pool:
  jobs=[pool.submit(run,'chromium',rows[i::6]) for i in range(6)]
  out=[x for job in jobs for x in job.result()]
 (OUT/'d-experience-restore-delta.json').write_text(json.dumps({'base':BASE,'scope':'Exact 36 configuration draft reopen; no mathematical grade; current weighted rev5 first hint only','rows':out},ensure_ascii=False,indent=2))
finally:srv.shutdown()
