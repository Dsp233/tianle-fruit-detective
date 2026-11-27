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
def frozen(prefix,nums):
 a={}
 for i in nums:
  for line in (D/f'{prefix}-{i:02}.txt').read_text().splitlines():
   if not line or line.startswith('#'):continue
   vals,why=line.split(';',1);start,*answers=vals.split()
   for k,v in enumerate(answers):
    if v!='-':a[int(start)+k]=v
 return a
main=frozen('d-rc73-main-freeze',[1,2])
main.update({int(k):v[0] for k,v in read('d-rc73-main-freeze-03.json').items()})
main.update({int(x['caseId'].split('I')[-1]):x['input'] for x in read('d-rc73-main-exact-join-receipt.json')['priorExact']})
var=frozen('d-rc73-variation-freeze',[1,2,3])
var.update({int(k):v for k,v in read('d-rc73-variation-reuse-01.json')['ids'].items()})
var.update({int(x['caseId'].split('I')[-1]):x['input'] for x in read('d-rc73-variation-reuse-02.json')['rows']})
# #132 independently retested in parallel; no repeated wrong input credit.

with zipfile.ZipFile(ROOT/'muse/rc73/rc73-muse-acceptance-kit.zip') as z:
 rs=list(csv.DictReader(io.StringIO(z.read('ledgers/instance-environments.csv').decode('utf-8-sig'))))
 rows=[r for r in rs if r['environment']=='native_chrome' and int(r['seed'])==1 and int(r['caseId'].split('I')[-1]) not in (316,321)]
assert len(rows)==151,len(rows)
ENGINE=os.environ['D_ENGINE'];SHARD=int(os.environ['D_SHARD']);rows=rows[SHARD::4]
# Independent frozen #132 rev5 answer, exact COMP-30D489A8, 4/2 accepted.
var[166]='2'
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



# Confirm exact deployed renderer, not the archived overlay.
sources=[]
for spec in config((ROOT/'index.html').read_text())['math']['scripts']:
 raw=unpack(spec,lambda n:(ROOT/n).read_bytes()).decode()
 if 'competitionShowVariationSolution' in raw:
  for needle in ('data-action="competitionShowVariationSolution"','competitionHintMore'):
   i=raw.find(needle)
   if i>=0:sources.append({'packet':spec['id'],'sha256':hashlib.sha256(raw.encode()).hexdigest(),'needle':needle,'excerpt':raw[max(0,i-140):i+200]})
(OUT/f'd-solution-source-{ENGINE}-{SHARD}.json').write_text(json.dumps(sources,ensure_ascii=False,indent=2))
print('D_SOLUTION_SOURCE '+json.dumps(sources,ensure_ascii=False),flush=True)
def shot(p,ident,n):
 f=OUT/f'{ident}-{ENGINE}-{n}.png';p.screenshot(path=str(f),full_page=True);return {'file':f.name,'sha256':hashlib.sha256(f.read_bytes()).hexdigest()}
def stable(s):
 s=dict(s);s.pop('active',None);h=dict(s.get('help') or {});h.pop('open',None);s['help']=h;return s
def record(p):
 return p.evaluate("""()=>{let t=playerTask();let k=competitionHash(competitionVariationSignature(t));return {key:k,view:saved.competition.extensionViews[k]||null}}""")
def run(batch):
 out=[]
 with sync_playwright() as pw:
  b=getattr(pw,ENGINE).launch(headless=True,**({'args':['--no-sandbox','--disable-dev-shm-usage']} if ENGINE=='chromium' else {}))
  for r in batch:
   i=int(r['caseId'].split('I')[-1]);ident=r['caseId'];x={'caseId':ident,'recipe':request(r),'engine':ENGINE,'errors':[],'status':'PARTIAL'}
   ctx=b.new_context(viewport={'width':1024,'height':768},has_touch=True);p=ctx.new_page();p.set_default_timeout(8000)
   try:
    p.goto(URL,wait_until='domcontentloaded');p.wait_for_function("Boolean(window.__AMC8_MATH_NAV)&&typeof progressStore!=='undefined'&&progressStore.getStatus()==='ready'",timeout=60000);p.add_script_tag(content=qa);p.wait_for_function('Boolean(window.AMC8_QA)')
    a=load(p,r);x['taskId']=a['taskId'];assert i in var
    if i==166:assert a['taskId']=='COMP-30D489A8'
    # Missing true main next-hint control. First hint is only prerequisite.
    app=p.locator('#app');h=app.locator('[data-action=competitionHint][data-scope="main"]:visible')
    if h.count():h.first.click();ready(p)
    x['mainFirstHint']=state(p,'main')
    m=app.locator('[data-action=competitionHintMore][data-scope="main"]:visible:enabled')
    if m.count():m.first.click();ready(p);x['mainAdditionalHint']=state(p,'main');x['mainAdditionalHintShot']=shot(p,ident,'main-next-hint')
    else:x['mainAdditionalHintMissing']=True
    # Start a truly cold variation path in a fresh isolated browser context. No answer lookup from runtime.
    ctx.close();ctx=b.new_context(viewport={'width':1024,'height':768},has_touch=True);p=ctx.new_page();p.set_default_timeout(8000)
    p.goto(URL,wait_until='domcontentloaded');p.wait_for_function("Boolean(window.__AMC8_MATH_NAV)&&typeof progressStore!=='undefined'&&progressStore.getStatus()==='ready'",timeout=60000);p.add_script_tag(content=qa);p.wait_for_function('Boolean(window.AMC8_QA)')
    a2=load(p,r);assert a2['taskId']==x['taskId']
    p.locator('#app [data-action=competitionIndependentVariation]:visible').click();ready(p)
    scope=p.evaluate("()=>topicSession()?.items?.[0]?.draft?.work?.activeScopeId");assert scope.startswith('variation:')
    main0=state(p,'main');x['coldVariation']=state(p,scope)
    action=p.locator('details.competition-extension [data-action=competitionShowVariationSolution]:visible')
    x['gatedBefore']=action.count()==0
    # Prior independently frozen correct input is transit to the solved UI; never counted as new correctness.
    inp=p.locator('#app [data-competition-input="extension"]:visible');inp.fill(str(var[i]));ready(p)
    p.locator('#app [data-action=competitionExtensionCheck]:visible').click();ready(p)
    x['afterTransit']=state(p,scope);x['historyBeforeSolution']=record(p)
    x['gateAfterCorrect']=action.count()==1 and action.first.is_enabled()
    if x['gateAfterCorrect']:
     action.first.click();ready(p);x['afterSolution']=state(p,scope);x['historyAfterSolution']=record(p);x['solutionVisible']=p.locator('.variation-solution:visible').count()==1
     x['solutionShot']=shot(p,ident,'solution-after-solved');x['mainUnchanged']=stable(main0)==stable(state(p,'main'))
     x['answerUnchanged']=all(x['afterTransit'].get(k)==x['afterSolution'].get(k) for k in ('input','answerState','feedback','key'))
     x['solutionExposure']=x['afterSolution']['help']['solutionSeen'] is True
     x['status']='OBSERVED'
    else:x['status']='GATE_MISSING_OR_TRANSIT_REJECTED';x['errorShot']=shot(p,ident,'gate-missing')
   except Exception as ex:
    x['errors'].append(repr(ex))
    try:x['errorShot']=shot(p,ident,'error')
    except:pass
   finally:ctx.close()
   out.append(x)
   print('D_SOLVED_GATE '+json.dumps({'caseId':ident,'engine':ENGINE,'status':x['status'],'errors':x['errors'],'mainFirstHints':(x.get('mainFirstHint',{}).get('help') or {}).get('revealedHintIds'),'mainAdditionalHints':(x.get('mainAdditionalHint',{}).get('help') or {}).get('revealedHintIds'),'gatedBefore':x.get('gatedBefore'),'gateAfterCorrect':x.get('gateAfterCorrect'),'solutionVisible':x.get('solutionVisible'),'solutionExposure':x.get('solutionExposure'),'answerUnchanged':x.get('answerUnchanged'),'mainUnchanged':x.get('mainUnchanged'),'historyBefore':(x.get('historyBeforeSolution') or {}).get('view'),'historyAfter':(x.get('historyAfterSolution') or {}).get('view')},ensure_ascii=False),flush=True)
  b.close()
 return out
try:
 with concurrent.futures.ThreadPoolExecutor(max_workers=3) as pool:result=[x for q in pool.map(run,[rows[i::3] for i in range(3)]) for x in q]
 (OUT/f'd-rc73-solved-gate-{ENGINE}-{SHARD}.json').write_text(json.dumps({'engine':ENGINE,'shard':SHARD,'formal':'fcef9785308363379b028129871c92700e1f93d4','scope':'only true main second hint and solved-stage variation solution gate/exposure; prior correct input transit, no new grade','rows':result},ensure_ascii=False,indent=2))
 print('D_SOLVED_GATE_COUNTS '+json.dumps(dict(Counter(x['status'] for x in result))),flush=True)
finally:srv.shutdown()
