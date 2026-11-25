"""RC73 independent remaining configuration behavior/layout delta, not a mathematical regrade."""
import csv,functools,hashlib,io,json,os,subprocess,sys,threading,time,zipfile,concurrent.futures
from fractions import Fraction
from collections import Counter
from pathlib import Path
from http.server import SimpleHTTPRequestHandler,ThreadingHTTPServer
from playwright.sync_api import sync_playwright
ROOT=Path(os.environ['D_PRODUCT']); D=Path(os.environ['D_EVIDENCE'])/'tools/r11-product';OUT=Path('r11-probe-output');OUT.mkdir(exist_ok=True)
assert subprocess.check_output(['git','-C',str(ROOT),'rev-parse','HEAD'],text=True).strip()=='d0c9c3e265a7a76052487d374255fcda35f21117'
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
oldWrong=set(json.loads((Path('/tmp')/'d-deep-wrong-expected.json').read_text())['wrong'])
with zipfile.ZipFile(ROOT/'muse/rc73/rc73-muse-acceptance-kit.zip') as z:
 rs=list(csv.DictReader(io.StringIO(z.read('ledgers/instance-environments.csv').decode('utf-8-sig'))))
 rows=[r for r in rs if r['environment']=='native_chrome' and int(r['seed'])==1 and int(r['caseId'].split('I')[-1]) not in (316,321)]
assert len(rows)==151,len(rows)
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


# Only WebKit environment/layout delta. Previous Chromium 906 layout assertions and all grading inherited.
def visible_state(p):
 return p.evaluate("""()=>{const root=document.querySelector('#app');const vis=e=>e.getClientRects().length>0;return {text:root.innerText,svg:[...root.querySelectorAll('svg')].filter(vis).map(e=>({text:e.textContent,title:e.querySelector('title')?.textContent,aria:e.getAttribute('aria-label')})),accessible:[...root.querySelectorAll('[aria-label],[alt],[title]')].filter(vis).map(e=>({tag:e.tagName,label:e.getAttribute('aria-label'),alt:e.getAttribute('alt'),title:e.getAttribute('title')})),controls:[...root.querySelectorAll('button')].filter(vis).map(e=>({action:e.dataset.action,text:e.innerText,disabled:e.disabled}))}}""")
def run(batch):
 out=[]
 with sync_playwright() as pw:
  browser=pw.webkit.launch(headless=True);ctx=browser.new_context(viewport={'width':1024,'height':768},has_touch=True);p=ctx.new_page();p.set_default_timeout(7000)
  p.goto(URL,wait_until='domcontentloaded');p.wait_for_function("Boolean(window.__AMC8_MATH_NAV)&&typeof progressStore!=='undefined'&&progressStore.getStatus()==='ready'",timeout=60000);p.add_script_tag(content=qa);p.wait_for_function('Boolean(window.AMC8_QA)')
  for r in batch:
   x={'caseId':r['caseId'],'recipe':request(r),'errors':[]}
   try:
    a=load(p,r);x['taskId']=a['taskId'];x['main']=layout(p,'main');x['mainBefore']=visible_state(p)
    # No answer submitted. Check normal visible independent variation button and scope transition.
    v=p.locator('[data-action=competitionIndependentVariation]:visible').first
    if not v.count():raise RuntimeError('no visible independent variation')
    v.click();ready(p);p.locator('details.competition-extension').wait_for(state='visible')
    x['variation']=layout(p,'variation');x['variationBefore']=visible_state(p)
    x['status']='PASS_LAYOUT' if all(y['horizontalPass'] for y in x['main']+x['variation']) else 'REVIEW_LAYOUT'
   except Exception as e:x['errors'].append(repr(e));x['status']='PARTIAL'
   out.append(x)
  ctx.close();browser.close()
 return out
try:
 with concurrent.futures.ThreadPoolExecutor(max_workers=5) as pool:observed=[x for q in pool.map(run,[rows[i::5] for i in range(5)]) for x in q]
 observed.sort(key=lambda x:x['caseId']);vals=[y for x in observed for y in x.get('main',[])+x.get('variation',[])]
 counts={'configs':len(observed),'observedLayouts':len(vals),'passLayouts':sum(v['horizontalPass'] for v in vals),'statuses':dict(Counter(x['status'] for x in observed))}
 (OUT/'d-rc73-webkit-layout-delta.json').write_text(json.dumps({'base':'d0c9c3e265a7a76052487d374255fcda35f21117','scope':'Only WebKit three widths main and unattempted independent variation. No grading; no visual semantic or actual device claim. Current formal in isolated server, legacy QA harness only for exact recipe load.','counts':counts,'rows':observed},ensure_ascii=False,indent=2))
 print('D_WEBKIT_LAYOUT '+json.dumps({'counts':counts,'review':[{'caseId':x['caseId'],'taskId':x.get('taskId'),'status':x['status'],'errors':x['errors'],'failedLayouts':[v for v in x.get('main',[])+x.get('variation',[]) if not v['horizontalPass']]} for x in observed if x['status']!='PASS_LAYOUT']},ensure_ascii=False),flush=True)
finally:srv.shutdown()
