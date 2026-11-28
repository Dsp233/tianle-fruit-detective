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
ENGINE=os.environ['D_ENGINE'];SHARD=int(os.environ['D_SHARD']);rows=[r for r in rows if r['caseId'] in {"M72-I0016","M72-I0136","M72-I0196","M72-I0446","M72-I0036","M72-I0096","M72-I0156","M72-I0216","M72-I0406","M72-I0466","M72-I0586","M72-I0056","M72-I0116","M72-I0176","M72-I0236","M72-I0546","M72-I0726","M72-I0011","M72-I0071","M72-I0131","M72-I0191","M72-I0741","M72-I0031","M72-I0091","M72-I0151","M72-I0211","M72-I0401","M72-I0581","M72-I0111","M72-I0171","M72-I0231","M72-I0361","M72-I0481","M72-I0006","M72-I0126","M72-I0186","M72-I0246","M72-I0556","M72-I0736","M72-I0086","M72-I0146","M72-I0396","M72-I0456","M72-I0046","M72-I0106","M72-I0166","M72-I0226","M72-I0286","M72-I0476","M72-I0596","M72-I0001","M72-I0121","M72-I0241","M72-I0371","M72-I0551","M72-I0731","M72-I0021","M72-I0081","M72-I0141","M72-I0201","M72-I0331","M72-I0391","M72-I0041","M72-I0221","M72-I0281","M72-I0411","M72-I0471","M72-I0531","M72-I0591"}];assert len(rows)==69;rows=rows[SHARD::4]
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




# Missing visual semantics, not a second grading/phase/layout matrix.
# Capture visible rendered HTML including non-SVG icons, accessible names, and route tabs.
def snap(p,scope):
 s=state(p,scope)
 s['dom']=p.evaluate("""s=>{const a=document.querySelector('#app');const root=s==='main'?a:document.querySelector('details.competition-extension');const visible=e=>e.getClientRects().length&&getComputedStyle(e).visibility!=='hidden';const candidates=[...root.querySelectorAll('svg,figure,[role=img],img,[class*="diagram"],[class*="figure"],[class*="visual"],[class*="pictogram"],[class*="icon"],[class*="model"],[class*="sketch"]')].filter(visible);return {text:root.innerText,html:root.outerHTML,graphics:candidates.filter(e=>!candidates.some(o=>o!==e&&o.contains(e))).map(e=>({tag:e.tagName,cls:e.getAttribute('class'),label:e.getAttribute('aria-label'),html:e.outerHTML,text:e.innerText||e.textContent})),controls:[...root.querySelectorAll('button,[role=button],[data-action]')].filter(visible).map(e=>({action:e.dataset.action||'',label:(e.innerText||'').trim(),aria:e.getAttribute('aria-label'),disabled:!!e.disabled,html:e.outerHTML.slice(0,600)}))}}""",scope)
 return s
def submit_main(p,i):
 a=str(main[i]); choices=p.locator('#app [data-action=competitionPick]:visible')
 if choices.count():
  hits=[e for e in choices.all() if num(e.inner_text())==num(a)]
  assert len(hits)==1,(a,'choice mismatch');hits[0].click()
 else:
  inp=p.locator('#app [data-competition-input="main"]:visible')
  if inp.count()!=1:inp=p.locator('#app input:visible').filter()
  assert inp.count()==1,'main input not unique';inp.fill(a)
 p.locator('#app [data-action=check]:visible').first.click();ready(p)
 return state(p,'main')
def logphase(x,s):
 if not s:return None
 d=s['dom'];return {'text':d['text'][-4500:],'graphics':[{'tag':g['tag'],'cls':g['cls'],'label':g['label'],'html':g['html'][:6000]} for g in d['graphics']][:12],'state':s['answerState'],'help':s['help'],'routeControls':[c for c in d['controls'] if '路线' in c['label'] or 'route' in c['action'].lower()]}

def run(batch):
 out=[]
 with sync_playwright() as pw:
  b=getattr(pw,ENGINE).launch(headless=True,**({'args':['--no-sandbox','--disable-dev-shm-usage']} if ENGINE=='chromium' else {}))
  for r in batch:
   x={'caseId':r['caseId'],'recipe':request(r),'engine':ENGINE,'status':'OBSERVED','errors':[],'routes':[]}
   ctx=b.new_context(viewport={'width':1024,'height':768},has_touch=True);p=ctx.new_page();p.set_default_timeout(6000)
   try:
    p.goto(URL,wait_until='domcontentloaded');p.wait_for_function("Boolean(window.__AMC8_MATH_NAV)&&typeof progressStore!=='undefined'&&progressStore.getStatus()==='ready'",timeout=60000);p.add_script_tag(content=qa);p.wait_for_function('Boolean(window.AMC8_QA)')
    x['taskId']=load(p,r)['taskId']
    c=p.locator('#app [data-action=competitionShowSolution]:visible').first;c.click();ready(p)
    methods=p.locator('#app button[data-action=competitionMethod]:visible')
    assert methods.count()>=2,methods.count()
    descriptors=[(el.get_attribute('data-index'),el.inner_text().strip()) for el in methods.all()]
    for idx,label in descriptors:
     el=p.locator('#app button[data-action=competitionMethod][data-index="'+idx+'"]:visible')
     assert el.count()==1
     if el.get_attribute('aria-pressed')!='true':el.click();ready(p)
     assert el.get_attribute('aria-pressed')=='true'
     x['routes'].append({'index':idx,'label':label,'phase':snap(p,'main')})
    assert len(x['routes'])==len(descriptors)
   except Exception as ex:x['errors'].append(repr(ex));x['status']='PARTIAL'
   finally:ctx.close()
   out.append(x)
   print('D1_ROUTE '+json.dumps({'id':x['caseId'],'status':x['status'],'engine':ENGINE,'errors':x['errors'],'routes':[{'index':z['index'],'label':z['label'],'text':z['phase']['dom']['text']} for z in x['routes']]},ensure_ascii=False),flush=True)
  b.close()
 return out
try:
 with concurrent.futures.ThreadPoolExecutor(max_workers=3) as pool:out=[x for q in pool.map(run,[rows[i::3] for i in range(3)]) for x in q]
 (OUT/f'd1-alternative-routes-{ENGINE}-{SHARD}.json').write_text(json.dumps({'formal':'fcef9785308363379b028129871c92700e1f93d4','engine':ENGINE,'shard':SHARD,'rows':out},ensure_ascii=False,indent=2))
 print('D1_ROUTE_SUMMARY '+json.dumps({'engine':ENGINE,'shard':SHARD,'count':len(out),'statuses':dict(Counter(x['status'] for x in out)),'routes':sum(len(x['routes']) for x in out)}),flush=True)
finally:srv.shutdown()
