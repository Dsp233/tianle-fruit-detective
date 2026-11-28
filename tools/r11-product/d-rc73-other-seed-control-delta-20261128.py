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
ENGINE=os.environ['D_ENGINE'];SHARD=int(os.environ['D_SHARD']);rows=rows[SHARD::4]
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



# Only four remaining original seeds. Canonical correctness previously signed; equivalence is a separate representation test.
def equivalent(v):return f'{v.numerator*2}/{v.denominator*2}'
def neg(s):return s['answerState']!='correct' and not (s.get('feedback') or {}).get('ok',False)
def run(batch):
 out=[]
 with sync_playwright() as pw:
  b=getattr(pw,ENGINE).launch(headless=True,**({'args':['--no-sandbox','--disable-dev-shm-usage']} if ENGINE=='chromium' else {}))
  ctx=b.new_context(viewport={'width':1024,'height':768},has_touch=True);p=ctx.new_page();p.set_default_timeout(10000)
  p.goto(URL,wait_until='domcontentloaded');p.wait_for_function("Boolean(window.__AMC8_MATH_NAV)&&typeof progressStore!=='undefined'&&progressStore.getStatus()==='ready'",timeout=60000);p.add_script_tag(content=qa);p.wait_for_function('Boolean(window.AMC8_QA)')
  for r in batch:
   ident=r['caseId'];i=int(ident.split('I')[-1]);x={'caseId':ident,'recipe':request(r),'engine':ENGINE,'mainWrong':[],'mainInvalid':[],'variationInvalid':[],'status':'OBSERVED','errors':[]}
   try:
    a=load(p,r);x['taskId']=a['taskId'];correct=Fraction(main[i]);vcorrect=Fraction(var[i])
    picks=p.locator('#app [data-action=competitionPick]:visible');x['mainOptions']=picks.all_inner_texts()
    if picks.count():
     vals=[num(v) for v in x['mainOptions']];x['correctOptionCount']=sum(v==correct for v in vals)
     if x['correctOptionCount']!=1 or None in vals:x['errors'].append('OPTION_IDENTITY_OR_UNIQUENESS')
     for v,n in zip(x['mainOptions'],vals):
      if n is None or n==correct:continue
      load(p,r);q=p.locator('#app [data-action=competitionPick]:visible');hit=[k for k in q.all() if k.inner_text().strip()==v.strip()];assert len(hit)==1
      hit[0].tap();ready(p);res=check(p,'main','#app [data-action=check]')
      x['mainWrong'].append({'input':v,'pass':res['enabled'] and neg(res['after']) and bool(res['after'].get('feedback')),'after':res['after']})
    else:
     for v in ['','abc','1/0','-Infinity',str(correct+Fraction(17,113))]:
      load(p,r);inp=p.locator('#app input:visible').first;inp.fill(v);ready(p);inp.press('Enter');ready(p);st=state(p,'main')
      x['mainInvalid'].append({'input':v,'pass':neg(st),'after':st})
     load(p,r);inp=p.locator('#app input:visible').first;inp.fill(equivalent(correct));ready(p);inp.press('Enter');ready(p);st=state(p,'main')
     x['mainEquivalent']={'input':equivalent(correct),'pass':st['answerState']=='correct' and bool((st.get('feedback') or {}).get('ok')),'after':st}
    load(p,r);main0=state(p,'main')
    p.locator('#app [data-action=competitionIndependentVariation]:visible').click();ready(p)
    scope=p.evaluate("()=>topicSession()?.items?.[0]?.draft?.work?.activeScopeId");assert scope.startswith('variation:')
    inp=p.locator('#app [data-competition-input="extension"]:visible');assert inp.count()==1
    for v in ['','abc','1/0','-Infinity',str(vcorrect+Fraction(17,113))]:
     inp.fill(v);ready(p);res=check(p,scope,'#app [data-action=competitionExtensionCheck]')
     x['variationInvalid'].append({'input':v,'pass':neg(res['after']),'enabled':res['enabled'],'after':res['after']})
    inp.fill(equivalent(vcorrect));ready(p);res=check(p,scope,'#app [data-action=competitionExtensionCheck]')
    x['variationEquivalent']={'input':equivalent(vcorrect),'pass':res['enabled'] and res['after']['answerState']=='correct' and bool((res['after'].get('feedback') or {}).get('ok')),'after':res['after']}
    main1=state(p,'main');x['mainStateUnchanged']=all(main0.get(k)==main1.get(k) for k in ('id','input','answerState','feedback','key','help'))
    if x['errors'] or not x['mainStateUnchanged'] or any(not y['pass'] for y in x['mainWrong']+x['mainInvalid']+x['variationInvalid']) or not x['variationEquivalent']['pass'] or ('mainEquivalent' in x and not x['mainEquivalent']['pass']):x['status']='REVIEW'
   except Exception as e:x['status']='PARTIAL';x['errors'].append(repr(e))
   out.append(x)
   print('D_SEED_CONTROL '+json.dumps({'caseId':ident,'recipe':x['recipe'],'status':x['status'],'mainWrong':len(x['mainWrong']),'mainWrongPass':sum(y['pass'] for y in x['mainWrong']),'mainInvalid':len(x['mainInvalid']),'mainInvalidPass':sum(y['pass'] for y in x['mainInvalid']),'correctOptionCount':x.get('correctOptionCount'),'mainEquivalent':(x.get('mainEquivalent') or {}).get('pass'),'variationInvalid':len(x['variationInvalid']),'variationInvalidPass':sum(y['pass'] for y in x['variationInvalid']),'variationEquivalent':(x.get('variationEquivalent') or {}).get('pass'),'mainUnchanged':x.get('mainStateUnchanged'),'errors':x['errors']},ensure_ascii=False),flush=True)
  ctx.close();b.close()
 return out
try:
 with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:result=[x for q in pool.map(run,[rows[i::4] for i in range(4)]) for x in q]
 (OUT/f'd-rc73-other-seeds-{ENGINE}-{SHARD}.json').write_text(json.dumps({'engine':ENGINE,'shard':SHARD,'formal':'fcef9785308363379b028129871c92700e1f93d4','scope':'604 non-representative instances; new negative/invalid/equivalent input controls, never new canonical math correctness credit','rows':result},ensure_ascii=False,indent=2))
 print('D_SEED_SUMMARY '+json.dumps({'engine':ENGINE,'shard':SHARD,'rows':len(result),'counts':dict(Counter(x['status'] for x in result))},ensure_ascii=False),flush=True)
finally:srv.shutdown()
