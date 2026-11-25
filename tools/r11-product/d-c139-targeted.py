"""D six-dimensional remaining hint/restore and targeted visual/feedback review; no regrading."""
import os,sys,json,threading,functools,hashlib,subprocess,concurrent.futures
from pathlib import Path
from http.server import SimpleHTTPRequestHandler,ThreadingHTTPServer
from playwright.sync_api import sync_playwright
ROOT=Path(os.environ['D_PRODUCT']);OUT=Path('r11-probe-output');OUT.mkdir(exist_ok=True)
assert subprocess.check_output(['git','-C',str(ROOT),'rev-parse','HEAD'],text=True).strip()=='d0c9c3e265a7a76052487d374255fcda35f21117'
sys.path.insert(0,str(ROOT/'tools'))
from g1_reading_packets import config,unpack
control=config((ROOT/'qa/index.html').read_text())['math']['scripts'][-1]
assert control['id']=='f12930312b8e007ab222216e6f478d87b24a0856ed7b0e191a98326ce32bec85'
qa=unpack(control,lambda n:(ROOT/n).read_bytes()).decode()
rows=json.loads(Path('tools/r11-product/d-six-dimension-score-20261125.json').read_text())['rows'];assert len(rows)==36
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
BASE='d0c9c3e265a7a76052487d374255fcda35f21117'
def boot(p):
 p.goto(URL,wait_until='domcontentloaded')
 try:p.wait_for_function("Boolean(window.__AMC8_MATH_NAV)&&typeof progressStore!=='undefined'&&progressStore.getStatus()==='ready'",timeout=7000)
 except Exception:
  h=p.locator('[data-home-hub] [data-action=home]:visible')
  if h.count():h.first.click()
  p.wait_for_function("Boolean(window.__AMC8_MATH_NAV)&&typeof progressStore!=='undefined'&&progressStore.getStatus()==='ready'",timeout=12000)
def st(p):
 return p.evaluate("""()=>{let t=playerTask(),s=topicSession(),w=s?.items?.find(i=>i.taskId===t?.id)?.draft?.work||s?.items?.[0]?.draft?.work;return {id:t?.id,session:s?.id,workId:w?.workId,active:w?.activeScopeId,scopes:w?.scopes,location:location.href,text:document.querySelector('#app')?.innerText}}""")

import urllib.request
figs={'COMP-30D489A8','COMP-14B2E628','COMP-045F44A7','COMP-AA342666'}
wrong={
 'COMP-D23D937A':('1/18','10/9'),
 'COMP-D5A16F69':('6','29/17'),
 'COMP-78FB3602':('2881','2881'),
 'COMP-251266BC':('2/3','5/3'),
 'COMP-229AE65B':('2881','577'),
 'COMP-I-integratedWeightedPlan-mean-admission-1':('270','1'),
 'COMP-I-integratedWeightedPlan-score-training-1':('60','6'),
 'COMP-I-integratedRatioPlan-perimeter-fence-1':('304','16'),
}
# Specific frozen previous defects and controls. No correct-answer grading or restore replay.
def scope_state(p,scope):
 return p.evaluate("""s=>{let w=topicSession()?.items?.find(i=>i.taskId===playerTask()?.id)?.draft?.work;let k=s==='main'?'main':w?.activeScopeId;return w?.scopes?.[k]??null}""",scope)
def fresh(p,e):
 r=p.evaluate('r=>AMC8_QA.loadCase(r,true)',e['recipe']);assert all(r[k]==v for k,v in e['recipe'].items()) and r['taskId']==e['id'];ready(p)
def hint_stage(p,e,engine,scope,ext=None):
 loc=ext.locator('[data-action=competitionHint]:visible').first if ext else action(p,'competitionHint')
 loc.click();ready(p)
 shots=[]
 for n in range(2):
  shots.append({'snap':snapshot(p),'scope':scope_state(p,scope),'shot':shot(p,e['id'],engine+'-'+scope+'-hint'+str(n+1))})
  more=ext.get_by_role('button',name='下一条提示',exact=True) if ext else action(p,'competitionHintMore')
  if not more.count() or not more.first.is_enabled():break
  more.first.click();ready(p)
 return shots
def run(engine,entries):
 out=[]
 with sync_playwright() as pw:
  b=getattr(pw,engine).launch(headless=True,**({'args':['--no-sandbox','--disable-dev-shm-usage']} if engine=='chromium' else {}))
  for e in entries:
   x={'id':e['id'],'recipe':e['recipe'],'engine':engine,'errors':[],'role':'figure' if e['id'] in figs else ('feedback' if e['id'] in wrong else 'unaffected-control')}
   ctx=b.new_context(viewport={'width':1024,'height':768});p=ctx.new_page();p.set_default_timeout(9000)
   try:
    boot(p);p.add_script_tag(content=qa);p.wait_for_function('Boolean(window.AMC8_QA)');fresh(p,e)
    x['before']=snapshot(p)
    if x['role']=='figure':
     x['mainHints']=hint_stage(p,e,engine,'main')
     action(p,'competitionIndependentVariation').click();ready(p);ext=p.locator('details.competition-extension');ext.wait_for(state='visible')
     x['variationHints']=hint_stage(p,e,engine,'variation',ext)
    elif x['role']=='feedback':
     mv,vv=wrong[e['id']]
     pick=p.locator('#app [data-action=competitionPick]:visible')
     hits=[i for i in pick.all() if i.inner_text().strip()==mv]
     if len(hits)==1:hits[0].click()
     else:p.locator('#app [data-competition-input="main"]:visible').fill(mv)
     ready(p);action(p,'check').click();ready(p)
     x['mainFeedback']={'state':scope_state(p,'main'),'snapshot':snapshot(p),'shot':shot(p,e['id'],engine+'-main-wrong')}
     action(p,'competitionIndependentVariation').click();ready(p);ext=p.locator('details.competition-extension');ext.wait_for(state='visible')
     inp=ext.locator('input[data-competition-input="extension"]:visible');inp.fill(vv)
     check=ext.locator('[data-action=competitionExtensionCheck]:visible')
     if not check.count():check=ext.get_by_role('button',name='检查变式',exact=True)
     check.first.click();ready(p)
     x['variationFeedback']={'state':scope_state(p,'variation'),'snapshot':snapshot(p),'shot':shot(p,e['id'],engine+'-variant-wrong')}
    else:
     x['mainHints']=hint_stage(p,e,engine,'main')
     action(p,'competitionIndependentVariation').click();ready(p);ext=p.locator('details.competition-extension');ext.wait_for(state='visible');x['variationHints']=hint_stage(p,e,engine,'variation',ext)
   except Exception as ex:x['errors'].append(repr(ex))
   finally:ctx.close()
   out.append(x)
   def compact(a):
    return [{'svg':[v['text'] for v in s['snap']['svgs']],'text':s['snap']['text'],'shot':s['shot'],'scope':s['scope']} for s in a]
   print('D_139 '+json.dumps({'id':x['id'],'engine':engine,'role':x['role'],'errors':x['errors'],'main':compact(x.get('mainHints',[])),'variation':compact(x.get('variationHints',[])),'mainFeedback':(x.get('mainFeedback',{}).get('state') or {}).get('feedback'),'variationFeedback':(x.get('variationFeedback',{}).get('state') or {}).get('feedback')},ensure_ascii=False),flush=True)
  b.close()
 return out
def identity():
 cfg=config((ROOT/'index.html').read_text())
 targets=['index.html','amc8/index.html','source/index.html']
 targets+=list(dict.fromkeys(n for r in cfg['math']['scripts'] if r['id'] in {'002fe0f17d9911149a2ac4397aa60473f16408dc201984db89a7dc6f72e18b66','9e65b11fe9d109a9fba4208ce19115283d1b999ce27be507a8bad4d176e301f1'} for n in r['parts']))
 # Changed files' actual paths from release tree, not packet IDs.
 targets+=['assets/final-integration/002fe0f17d9911149a2ac4397aa60473f16408dc201984db89a7dc6f72e18b66.json','assets/final-integration/9e65b11fe9d109a9fba4208ce19115283d1b999ce27be507a8bad4d176e301f1.json']
 result=[]
 for n in dict.fromkeys(targets):
  expect=hashlib.sha256((ROOT/n).read_bytes()).hexdigest()
  with urllib.request.urlopen('https://dsp233.github.io/tianle-fruit-detective/'+n+'?d139='+str(time.time_ns()),timeout=25) as f:actual=hashlib.sha256(f.read()).hexdigest();code=f.status
  result.append({'path':n,'expected':expect,'actual':actual,'status':code,'match':expect==actual})
 print('D_139_IDENTITY '+json.dumps(result),flush=True)
 return result
try:
 selected=[e for e in rows if e['id'] in figs|set(wrong)];assert len(selected)==12
 ident=identity()
 with concurrent.futures.ThreadPoolExecutor(max_workers=6) as pool:
  jobs=[pool.submit(run,e,selected[i::3]) for e in ['chromium','webkit'] for i in range(3)]
  out=[v for job in jobs for v in job.result()]
 (OUT/'d-c139-targeted.json').write_text(json.dumps({'base':BASE,'identity':ident,'scope':'Only affected 12 cells; existing math correctness and all other scoring retained','rows':out},ensure_ascii=False,indent=2))
finally:srv.shutdown()
