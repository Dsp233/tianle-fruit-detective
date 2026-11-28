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
 rows=[r for r in rs if r['environment']=='native_chrome' and int(r['seed'])!=1 and not 316<=int(r['caseId'].split('I')[-1])<=325]
assert len(rows)==604,len(rows)
ENGINE=os.environ['D_ENGINE'];SHARD=int(os.environ['D_SHARD']);rows=[r for r in rows if r['caseId'] in ('M72-I0157','M72-I0159')];assert len(rows)==2
# Latest corrected natural-weighted rev5 frozen expected, not runtime answer keys.
def collect132(o):
 if isinstance(o,dict):
  if str(o.get('caseId','')).startswith('M72-I016') or o.get('caseId')=='M72-I0170':
   if o.get('recipe',{}).get('generatorRevision')==5 and isinstance(o.get('math'),dict) and 'answer' in o['math']:var[int(o['caseId'].split('I')[-1])]=str(o['math']['answer'])
  for v in o.values():collect132(v)
 elif isinstance(o,list):
  for v in o:collect132(v)
collect132(read('d-c-release-independent-receipt.json'))
assert all(int(r['caseId'].split('I')[-1]) in main and int(r['caseId'].split('I')[-1]) in var for r in rows)
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



# Both exact cases independently corrected to 18 in d-rc73-main-grade-01-receipt.json.
receipt=read('d-rc73-main-grade-01-receipt.json')['disagreementReview']
assert receipt['caseIds']==['M72-I0157','M72-I0159'] and receipt['classification']=='TESTER_DERIVATION_ERROR'
out=[]
try:
 with sync_playwright() as pw:
  b=getattr(pw,ENGINE).launch(headless=True,**({'args':['--no-sandbox','--disable-dev-shm-usage']} if ENGINE=='chromium' else {}))
  ctx=b.new_context(viewport={'width':1024,'height':768},has_touch=True);p=ctx.new_page();p.set_default_timeout(10000)
  p.goto(URL,wait_until='domcontentloaded');p.wait_for_function("Boolean(window.__AMC8_MATH_NAV)&&typeof progressStore!=='undefined'&&progressStore.getStatus()==='ready'",timeout=60000);p.add_script_tag(content=qa);p.wait_for_function('Boolean(window.AMC8_QA)')
  for r in rows:
   a=load(p,r);opts=p.locator('#app [data-action=competitionPick]:visible');vals=opts.all_inner_texts();assert vals.count('19')==1 and vals.count('18')==1
   [v for v in opts.all() if v.inner_text().strip()=='19'][0].tap();ready(p);res=check(p,'main','#app [data-action=check]')
   ok=res['enabled'] and res['after']['answerState']=='incorrect' and not (res['after'].get('feedback') or {}).get('ok',False)
   x={'caseId':r['caseId'],'recipe':request(r),'engine':ENGINE,'taskId':a['taskId'],'correctIndependent':'18','omittedWrong':'19','options':vals,'state':res,'pass':ok};out.append(x);print('D_FOLD_CORRECTION '+json.dumps(x,ensure_ascii=False),flush=True)
  ctx.close();b.close()
finally:
 (OUT/f'd-fold-correction-{ENGINE}.json').write_text(json.dumps({'formal':'fcef9785308363379b028129871c92700e1f93d4','rows':out},ensure_ascii=False,indent=2))
 srv.shutdown()
