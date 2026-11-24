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

import re,urllib.request
from fractions import Fraction
BASE='f306ceafc90b16e5794e3e4a1df95101a73e2778'
fixids={'COMP-960705B6','COMP-14B2E628','COMP-86E3F8AD'}
transfer={x['id']:x for x in json.loads(Path('/tmp/d-transfer-input.json').read_text())['rows']}
def state(p,scope):
 return p.evaluate("""s=>{let t=playerTask(),w=topicSession()?.items?.[0]?.draft?.work,m=w?.scopes?.[s];return {id:t?.id,active:w?.activeScopeId,workId:w?.workId,help:m?.help,feedback:m?.feedback,answerState:m?.answerState,input:m?.input,text:document.querySelector('#app').innerText,figureMarkup:[...document.querySelectorAll('#app svg')].filter(x=>x.getClientRects().length).map(x=>x.outerHTML)}}""",scope)
def load(p,e):
 p.goto(URL,wait_until='domcontentloaded');ready(p);p.add_script_tag(content=qa);p.wait_for_function('Boolean(window.AMC8_QA)')
 req=e['recipe'];a=p.evaluate('r=>AMC8_QA.loadCase(r,true)',req);assert all(a[k]==v for k,v in req.items()) and a['taskId']==e['id'];ready(p)
 assert e['mainVisible'] in snapshot(p)['text']
def check_main(p,e,x):
 ident=e['id'];before=snapshot(p)
 if ident=='COMP-960705B6':
  action(p,'competitionHint').click();ready(p);s=snapshot(p);x['mainHint']={'state':s,'shot':shot(p,ident,x['engine']+'-main-hint')}
  # Real text and labels; arrow direction must match both people.
  x['chaseMainPass']=bool(re.search(r'小乐\s*→\s*2\s*米/分钟',s['text']) and re.search(r'小明\s*→\s*3\s*米/分钟',s['text']) and re.search(r'先行距离\s*6\s*米',s['text']))
 else:
  vals=['9','15'] if ident=='COMP-14B2E628' else ['8','9']
  x['wrongMain']=[]
  for v in vals:
   loc=p.locator('#app [data-action=competitionPick]:visible').filter(has_text=re.compile('^'+v+'$'));assert loc.count()==1
   loc.click();ready(p);action(p,'check').click();ready(p);s=snapshot(p);assert s['feedback'] and not s['feedback']['ok']
   txt=s['feedback']['text'];good=('整除' in txt and ('块数' in txt or '面积' in txt)) if ident=='COMP-14B2E628' else ('整单' in txt and '配送费' in txt and '总价' in txt)
   x['wrongMain'].append({'input':v,'feedback':s['feedback'],'semanticPass':good,'shot':shot(p,ident,x['engine']+'-wrong-'+v)})
def run(engine,batch):
 result=[]
 with sync_playwright() as pw:
  b=getattr(pw,engine).launch(headless=True,**({'args':['--no-sandbox','--disable-dev-shm-usage']} if engine=='chromium' else {}))
  for e in batch:
   x={'id':e['id'],'recipe':e['recipe'],'engine':engine,'status':'PARTIAL','errors':[]}
   ctx=b.new_context(viewport={'width':1024,'height':768});p=ctx.new_page();p.set_default_timeout(8000)
   try:
    load(p,e)
    if e['id'] in fixids:check_main(p,e,x);load(p,e)
    action(p,'competitionIndependentVariation').click();ready(p)
    ext=p.locator('details.competition-extension');ext.wait_for(state='visible');scope=p.evaluate("()=>topicSession()?.items?.[0]?.draft?.work?.activeScopeId");assert scope.startswith('variation:')
    x['variationBefore']={'state':state(p,scope),'shot':shot(p,e['id'],engine+'-variation-before')}
    if e['id']=='COMP-30D489A8':
     v=Fraction(transfer[e['id']]['input']);eq=f'{v.numerator*2}/{v.denominator*2}'
     p.locator('#app [data-competition-input="extension"]:visible').fill(eq);action(p,'competitionExtensionCheck').click();ready(p);s=state(p,scope);x['equivalent']={'input':eq,'state':s,'pass':s['answerState']=='correct' and bool((s['feedback'] or {}).get('ok'))}
     load(p,e);action(p,'competitionIndependentVariation').click();ready(p)
    if e['id'] in fixids-{'COMP-960705B6'}:
     v=Fraction(transfer[e['id']]['input'])+1
     p.locator('#app [data-competition-input="extension"]:visible').fill(str(v));action(p,'competitionExtensionCheck').click();ready(p);s=state(p,scope);txt=(s['feedback'] or {}).get('text','')
     good=('整除' in txt and '块数' in txt) if e['id']=='COMP-14B2E628' else ('配送费' in txt and '整单' in txt and '临界' in txt)
     x['wrongVariation']={'input':str(v),'state':s,'semanticPass':good and not (s['feedback'] or {}).get('ok',True),'shot':shot(p,e['id'],engine+'-variation-wrong')}
    hint=ext.locator('[data-action=competitionHint]:visible').first
    if hint.count() and hint.is_enabled():
     hint.click();ready(p);x['variationHint']={'state':state(p,scope),'shot':shot(p,e['id'],engine+'-variation-hint')}
    else:x['variationHintMissing']=True
    # Exact scope/identity after real refresh: if QA route does not resume, leave explicit NOT_PROVEN, never a product failure.
    before=state(p,scope);p.reload(wait_until='domcontentloaded');ready(p)
    try:
     after=state(p,scope);x['restore']={'sameTask':after['id']==before['id'],'sameWork':after['workId']==before['workId'],'sameScope':after['active']==before['active'],'sameHelp':after['help']==before['help'],'sameInput':after['input']==before['input']}
    except Exception as ex:x['restore']={'notProven':repr(ex)}
    x['status']='OBSERVED'
   except Exception as ex:x['errors'].append(repr(ex))
   finally:ctx.close()
   result.append(x)
  b.close()
 return result
try:
 with urllib.request.urlopen('https://dsp233.github.io/tianle-fruit-detective/index.html?d-r11='+BASE,timeout=30) as response:public=hashlib.sha256(response.read()).hexdigest()
 expected=hashlib.sha256((ROOT/'index.html').read_bytes()).hexdigest()
 print('D_PUBLIC_IDENTITY '+json.dumps({'sha256':public,'expected':expected,'match':public==expected}),flush=True)
 with concurrent.futures.ThreadPoolExecutor(max_workers=5) as pool:
  jobs=[pool.submit(run,'chromium',rows[i::4]) for i in range(4)]+[pool.submit(run,'webkit',[e for e in rows if e['id'] in fixids])]
  allrows=[x for job in jobs for x in job.result()]
 receipt={'base':BASE,'publicIdentityMatch':public==expected,'scope':'D targeted fix and missing variation presentation/restore only; reuse existing answer/hint and grade evidence; no mathematical regrade','rows':allrows}
 (OUT/'d-final-teaching-delta.json').write_text(json.dumps(receipt,ensure_ascii=False,indent=2))
 for x in allrows:
  v=x.get('variationHint',{}).get('state',{})
  print('D_FINAL_TEACHING_ROW '+json.dumps({'id':x['id'],'engine':x['engine'],'status':x['status'],'errors':x['errors'],'chaseMainPass':x.get('chaseMainPass'),'wrongMain':x.get('wrongMain'),'wrongVariation':{k:z for k,z in x.get('wrongVariation',{}).items() if k!='state'},'equivalentPass':x.get('equivalent',{}).get('pass'),'variationHintText':v.get('text'),'variationHintShot':x.get('variationHint',{}).get('shot'),'restore':x.get('restore')},ensure_ascii=False),flush=True)
finally:srv.shutdown()
