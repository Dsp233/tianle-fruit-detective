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
   ident=r['caseId'];i=int(ident.split('I')[-1]);x={'caseId':ident,'recipe':request(r),'engine':ENGINE,'status':'OBSERVED','errors':[],'phase':{},'routes':[]}
   ctx=b.new_context(viewport={'width':1024,'height':768},has_touch=True);p=ctx.new_page();p.set_default_timeout(6000)
   try:
    p.goto(URL,wait_until='domcontentloaded');p.wait_for_function("Boolean(window.__AMC8_MATH_NAV)&&typeof progressStore!=='undefined'&&progressStore.getStatus()==='ready'",timeout=60000);p.add_script_tag(content=qa);p.wait_for_function('Boolean(window.AMC8_QA)')
    x['taskId']=load(p,r)['taskId']
    x['phase']['initial']=snap(p,'main')
    # Actual main transit before variant is a previously missing joint behavior, no grade credit.
    x['mainTransit']=submit_main(p,i)
    if x['mainTransit']['answerState']!='correct':x['errors'].append('frozen transit not accepted')
    if x['mainTransit']['answerState']=='correct':
     p.locator('#app [data-action=competitionIndependentVariation]:visible').first.click();ready(p)
     scope=p.evaluate("()=>topicSession()?.items?.[0]?.draft?.work?.activeScopeId");assert scope.startswith('variation:')
     x['phase']['variantAfterMain']=snap(p,scope)
     ext=p.locator('details.competition-extension:visible').first
     h=ext.locator('[data-action=competitionHint]:visible')
     if h.count():h.first.click();ready(p)
     x['phase']['variantH1']=snap(p,scope)
     h=ext.locator('[data-action=competitionHintMore]:visible:enabled')
     if h.count():h.first.click();ready(p)
     x['phase']['variantH2']=snap(p,scope)
     # Frozen correct answer only to reach already validated solution control and capture its content.
     inp=ext.locator('[data-competition-input="extension"]:visible')
     if inp.count()==1 and i in var:
      inp.fill(str(var[i]));ext.locator('[data-action=competitionExtensionCheck]:visible').first.click();ready(p)
      c=ext.locator('[data-action=competitionShowVariationSolution]:visible:enabled')
      if c.count():c.first.click();ready(p);x['phase']['variantSolution']=snap(p,scope)
      else:x['errors'].append('variation solution not reachable after frozen transit')
    # Fresh isolated case to collect pre-answer H2 visual and main solution route content.
    ctx.close();ctx=b.new_context(viewport={'width':1024,'height':768},has_touch=True);p=ctx.new_page();p.set_default_timeout(6000)
    p.goto(URL,wait_until='domcontentloaded');p.wait_for_function("Boolean(window.__AMC8_MATH_NAV)&&typeof progressStore!=='undefined'&&progressStore.getStatus()==='ready'",timeout=60000);p.add_script_tag(content=qa);p.wait_for_function('Boolean(window.AMC8_QA)');assert load(p,r)['taskId']==x['taskId']
    h=p.locator('#app [data-action=competitionHint][data-scope="main"]:visible')
    if h.count():h.first.click();ready(p)
    x['phase']['mainH1']=snap(p,'main')
    h=p.locator('#app [data-action=competitionHintMore][data-scope="main"]:visible:enabled')
    if h.count():h.first.click();ready(p)
    x['phase']['mainH2']=snap(p,'main')
    c=p.get_by_role('button',name=__import__('re').compile(r'^(查看解法|查看解析|显示解法|显示解析|看解法|完整解法|解法与过程|查看完整解法|查看答案与解析)$'))
    if c.count() and c.first.is_enabled():
     c.first.click();ready(p);x['phase']['mainSolution']=snap(p,'main')
     # Actual route buttons only; do not infer route from answer value.
     cand=p.locator('#app button[data-action]:visible')
     routes=[{'action':el.get_attribute('data-action'),'text':el.inner_text().strip(),'html':el.evaluate('e=>e.outerHTML')} for el in cand.all() if __import__('re').search(r'route|solutionmethod|solutionpath',el.get_attribute('data-action') or '',__import__('re').I)]
     for route in routes:
      sel='#app button[data-action='+json.dumps(route['action'])+']:visible'
      el=p.locator(sel).filter(has_text=route['text'])
      if el.count()==1 and el.first.is_enabled():
       el.first.click();ready(p);x['routes'].append({'control':route,'phase':snap(p,'main')})
   except Exception as ex:x['errors'].append(repr(ex))
   finally:ctx.close()
   if x['errors']:x['status']='PARTIAL'
   out.append(x)
   print('D1_VIS '+json.dumps({'id':ident,'recipe':x['recipe'],'taskId':x.get('taskId'),'engine':ENGINE,'status':x['status'],'errors':x['errors'],'mainTransit':(x.get('mainTransit') or {}).get('answerState'),'phases':{k:logphase(x,s) for k,s in x['phase'].items()},'routes':[{'control':z['control'],'text':z['phase']['dom']['text'][-4000:]} for z in x['routes']]},ensure_ascii=False),flush=True)
  b.close()
 return out
try:
 with concurrent.futures.ThreadPoolExecutor(max_workers=3) as pool:out=[x for q in pool.map(run,[rows[i::3] for i in range(3)]) for x in q]
 (OUT/f'd1-visual-semantic-{ENGINE}-{SHARD}.json').write_text(json.dumps({'formal':'fcef9785308363379b028129871c92700e1f93d4','engine':ENGINE,'shard':SHARD,'rows':out},ensure_ascii=False,indent=2))
 print('D1_VIS_SUMMARY '+json.dumps({'engine':ENGINE,'shard':SHARD,'count':len(out),'statuses':dict(Counter(x['status'] for x in out)),'variantAfterMain':sum('variantAfterMain' in x['phase'] for x in out),'routeClicks':sum(len(x['routes']) for x in out)}),flush=True)
finally:srv.shutdown()
