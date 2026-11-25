"""RC73 independent remaining configuration behavior/layout delta, not a mathematical regrade."""
import csv,functools,hashlib,io,json,os,subprocess,sys,threading,time,zipfile,concurrent.futures
from fractions import Fraction
from collections import Counter
from pathlib import Path
from http.server import SimpleHTTPRequestHandler,ThreadingHTTPServer
from playwright.sync_api import sync_playwright
ROOT=Path(os.environ['D_PRODUCT']); D=Path(os.environ['D_EVIDENCE'])/'tools/r11-product';OUT=Path('r11-probe-output');OUT.mkdir(exist_ok=True)
assert subprocess.check_output(['git','-C',str(ROOT),'rev-parse','HEAD'],text=True).strip()=='fcef9785308363379b028129871c92700e1f93d4'
sys.path.insert(0,str(ROOT/'tools'))
from g1_reading_packets import config,unpack
legacy=config((ROOT/'qa/index.html').read_text())['math']['scripts'][-1];assert legacy['id']=='f12930312b8e007ab222216e6f478d87b24a0856ed7b0e191a98326ce32bec85'
qa=unpack(legacy,lambda n:(ROOT/n).read_bytes()).decode()
def read(n):return json.loads((D/n).read_text())
# No answer keys are needed for this stage-only probe.

with zipfile.ZipFile(ROOT/'muse/rc73/rc73-muse-acceptance-kit.zip') as z:
 rs=list(csv.DictReader(io.StringIO(z.read('ledgers/instance-environments.csv').decode('utf-8-sig'))))
 rows=[r for r in rs if r['environment']=='native_chrome' and int(r['seed'])==1 and int(r['caseId'].split('I')[-1]) not in (316,321)]
assert len(rows)==151,len(rows)
ENGINE=os.environ['D_ENGINE']; SHARD=int(os.environ['D_SHARD']); SHARDS=4
rows=rows[SHARD::SHARDS]
class H(SimpleHTTPRequestHandler):
 def log_message(self,*a):pass
srv=ThreadingHTTPServer(('127.0.0.1',0),functools.partial(H,directory=str(ROOT)));threading.Thread(target=srv.serve_forever,daemon=True).start()
URL=f'http://127.0.0.1:{srv.server_port}/index.html#math'
def ready(p):p.wait_for_function("progressStore.getStatus()==='ready'",timeout=8000)
def request(r):return dict(familyId=r['familyId'],configuration=r['configurationId'],seed=int(r['seed']),generatorRevision=int(r['generatorRevision']))
def state(p,scope):
 return p.evaluate("""s=>{let t=playerTask(),w=topicSession()?.items?.[0]?.draft?.work,m=w?.scopes?.[s];return {id:t?.id,active:w?.activeScopeId,input:m?.input,answerState:m?.answerState,feedback:m?.feedback,key:m?.lastSubmissionKey,help:m?.help}}""",scope)
def layout(p,scope):
 result=[]
 for width in (320,768,1024):
  p.set_viewport_size({'width':width,'height':768})
  x=p.evaluate("""s=>{let root=document.querySelector('#app');let q=s==='main'?'[data-action=check]':'[data-action=competitionExtensionCheck]';let btn=[...root.querySelectorAll(q)].find(x=>x.getClientRects().length);let box=btn?.getBoundingClientRect();let vp=document.documentElement.clientWidth;return {width:vp,documentWidth:document.documentElement.scrollWidth,button:!!box,buttonLeft:box?.left,buttonRight:box?.right,buttonWidth:box?.width,visibleSVG:[...root.querySelectorAll('svg')].filter(x=>x.getClientRects().length).length}}""",scope)
  x['horizontalPass']=x['documentWidth']<=x['width']+1 and x['button'] and x['buttonWidth']>0 and x['buttonLeft']>=-1 and x['buttonRight']<=x['width']+1
  result.append(x)
 p.set_viewport_size({'width':1024,'height':768})
 return result
def check(p,scope,selector):
 btn=p.locator(selector+':visible').first
 before=state(p,scope); enabled=btn.is_enabled()
 if enabled:btn.click();ready(p)
 after=state(p,scope)
 return {'enabled':enabled,'before':before,'after':after}
def num(v):
 try:return Fraction(v.strip())
 except (ValueError,ZeroDivisionError):return None
def load(p,r):
 req=request(r);a=p.evaluate('r=>AMC8_QA.loadCase(r,true)',req);assert all(a[k]==v for k,v in req.items()),a;ready(p)
 assert not p.evaluate('!!competitionScopedContent(playerTask())?.scopeBlocked')
 return a



# Exact existing recipe identity; no answer submission and no new grading.
# Record controls, actual state and visible figure before/after each help action.
# Raw observations are not semantic/teaching passes.
def snapshot(p,scope):
 s=state(p,scope)
 s['view']=p.evaluate("""()=>{const a=document.querySelector('#app');return {text:a.innerText,figures:[...a.querySelectorAll('svg')].filter(x=>x.getClientRects().length).map(x=>x.outerHTML),controls:[...a.querySelectorAll('[data-action]')].filter(x=>x.getClientRects().length).map(x=>({action:x.dataset.action,label:x.innerText,disabled:!!x.disabled,scope:x.closest('.competition-extension')?'variation':'main'}))}}""")
 return s
def phase(p,x,scope,label):
 f=OUT/f"{x['caseId']}-{ENGINE}-{label}.png";p.screenshot(path=str(f),full_page=True)
 x['phases'].append({'name':label,'scope':scope,'state':snapshot(p,scope),'shot':f.name,'sha256':hashlib.sha256(f.read_bytes()).hexdigest()})
def help_steps(p,x,scope,container,prefix):
 # Capture all distinct visible help levels and the exhausted control, with an explicit upper bound.
 for i in range(12):
  h=container.locator('[data-action=competitionHint]:visible')
  if not h.count() or not h.first.is_enabled():break
  before=snapshot(p,scope)
  h.first.click();ready(p);phase(p,x,scope,prefix+'-hint-'+str(i+1))
  after=x['phases'][-1]['state']
  if before['help']==after['help'] and before['view']['text']==after['view']['text']:
   x['notes'].append(prefix+' no further distinct hint state');break
 else:x['notes'].append(prefix+' hint cap reached; exhaustion not proved')
 # Only actual, explicitly labelled solution controls are eligible; no inferred action.
 candidates=container.get_by_role('button',name=__import__('re').compile(r'^(查看解法|查看解析|显示解法|显示解析|看解法|完整解法|解法与过程|查看完整解法|查看答案与解析)$'))
 if candidates.count() and candidates.first.is_enabled():
  candidates.first.click();ready(p);phase(p,x,scope,prefix+'-solution')
 else:x['notes'].append(prefix+' solution control not observed; retain gap')
def run(batch):
 out=[]
 with sync_playwright() as pw:
  browser=getattr(pw,ENGINE).launch(headless=True,**({'args':['--no-sandbox','--disable-dev-shm-usage']} if ENGINE=='chromium' else {}))
  for r in batch:
   x={'caseId':r['caseId'],'recipe':request(r),'engine':ENGINE,'phases':[],'notes':[],'errors':[],'status':'PARTIAL'}
   ctx=browser.new_context(viewport={'width':1024,'height':768},has_touch=True);p=ctx.new_page();p.set_default_timeout(8000)
   try:
    p.goto(URL,wait_until='domcontentloaded');p.wait_for_function("Boolean(window.__AMC8_MATH_NAV)&&typeof progressStore!=='undefined'&&progressStore.getStatus()==='ready'",timeout=60000);p.add_script_tag(content=qa);p.wait_for_function('Boolean(window.AMC8_QA)')
    a=load(p,r);x['taskId']=a['taskId']
    phase(p,x,'main','initial')
    app=p.locator('#app')
    help_steps(p,x,'main',app,'main')
    before=state(p,'main')
    app.locator('[data-action=competitionIndependentVariation]:visible').click();ready(p)
    scope=p.evaluate("()=>topicSession()?.items?.[0]?.draft?.work?.activeScopeId")
    assert scope.startswith('variation:')
    ext=p.locator('details.competition-extension:visible').first
    phase(p,x,scope,'variation-before')
    x['mainStateRetainedOnVariation']=state(p,'main')==before
    inp=ext.locator('[data-competition-input="extension"]:visible')
    if inp.count()==1:
     inp.fill('1');inp.press('Tab');ready(p);phase(p,x,scope,'variation-draft')
    else:x['notes'].append('variation draft input not observed')
    help_steps(p,x,scope,ext,'variation')
    x['mainStateAfterVariation']=state(p,'main')
    x['noNewCorrectSubmission']=state(p,'main')['answerState']!='correct' and state(p,scope)['answerState']!='correct'
    x['status']='OBSERVED' if x['noNewCorrectSubmission'] else 'REVIEW'
   except Exception as ex:
    x['errors'].append(repr(ex))
    try:phase(p,x,'main','error')
    except Exception:pass
   finally:ctx.close()
   out.append(x)
   print('D_STAGE '+json.dumps({'caseId':x['caseId'],'engine':ENGINE,'status':x['status'],'phases':[a['name'] for a in x['phases']],'notes':x['notes'],'errors':x['errors']},ensure_ascii=False),flush=True)
  browser.close()
 return out
try:
 with concurrent.futures.ThreadPoolExecutor(max_workers=3) as pool:
  observed=[x for q in pool.map(run,[rows[i::3] for i in range(3)]) for x in q]
 observed.sort(key=lambda x:x['caseId'])
 result={'formal':'fcef9785308363379b028129871c92700e1f93d4','engine':ENGINE,'shard':SHARD,'scope':'actual additional help/solution/exposure/draft phases only; no grade, layout or six-dimensional rescoring','counts':dict(Counter(x['status'] for x in observed)),'rows':observed}
 (OUT/f'd-rc73-stage-{ENGINE}-{SHARD}.json').write_text(json.dumps(result,ensure_ascii=False,indent=2))
 print('D_STAGE_COUNTS '+json.dumps(result['counts']),flush=True)
finally:srv.shutdown()
