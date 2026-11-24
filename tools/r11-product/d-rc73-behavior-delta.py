"""RC73 independent remaining configuration behavior/layout delta, not a mathematical regrade."""
import csv,functools,hashlib,io,json,os,subprocess,sys,threading,time,zipfile,concurrent.futures
from fractions import Fraction
from collections import Counter
from pathlib import Path
from http.server import SimpleHTTPRequestHandler,ThreadingHTTPServer
from playwright.sync_api import sync_playwright
ROOT=Path(os.environ['D_PRODUCT']); D=Path(os.environ['D_EVIDENCE'])/'tools/r11-product';OUT=Path('r11-probe-output');OUT.mkdir(exist_ok=True)
assert subprocess.check_output(['git','-C',str(ROOT),'rev-parse','HEAD'],text=True).strip()=='3f22d8002406857a33a3e254ebafc4366f6cec51'
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
oldWrong=set(json.loads((Path('tools/r11-product')/'d-deep-wrong-expected.json').read_text())['wrong'])
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
def run(batch):
 out=[]
 with sync_playwright() as pw:
  browser=pw.chromium.launch(headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
  ctx=browser.new_context(viewport={'width':1024,'height':768});p=ctx.new_page();p.set_default_timeout(6000)
  p.goto(URL,wait_until='domcontentloaded');p.wait_for_function("Boolean(window.__AMC8_MATH_NAV) && typeof progressStore!=='undefined' && progressStore.getStatus()==='ready'",timeout=60000);p.add_script_tag(content=qa);p.wait_for_function('Boolean(window.AMC8_QA)')
  for r in batch:
   ident=r['caseId'];i=int(ident.split('I')[-1]);x={'caseId':ident,'recipe':request(r),'status':'OBSERVED','mainCredit':'REUSE_PRIOR_INDEPENDENT','errors':[]}
   try:
    a=load(p,r);x['taskId']=a['taskId'];x['mainLayout']=layout(p,'main')
    assert i in main,('missing frozen main',i)
    correct=Fraction(main[i]);x['mainFrozen']=str(correct)
    # Existing 36 seed-1 wrong-feedback observations not replayed. All others test one demonstrably non-equal visible answer.
    x['mainEmpty']=check(p,'main','#app [data-action=check]')
    assert not (x['mainEmpty']['after'].get('feedback') or {}).get('ok',False),'empty accepted'
    picks=p.locator('#app [data-action=competitionPick]:visible')
    values=[(loc.inner_text().strip(),loc) for loc in picks.all()]
    bad=[(v,loc) for v,loc in values if num(v) is not None and num(v)!=correct]
    if a['taskId'] in oldWrong:x['mainWrong']='REUSED_36_PRIOR_WRONG_OBSERVATIONS'
    elif bad:
     v,loc=bad[0];loc.click();ready(p);y=check(p,'main','#app [data-action=check]');x['mainWrong']={'value':v,'actual':y['after'],'expected':'non-equal numeric option, misconception not uniquely diagnosed'}
     assert y['after']['answerState']!='correct' and y['after']['feedback'] and not y['after']['feedback']['ok'],'wrong accepted or feedback missing'
    else:x['mainWrong']='NO_NUMERIC_DISTINCT_OPTION'
    # Observe only independent variation, no main correct answer submission.
    load(p,r);p.locator('#app [data-action=competitionIndependentVariation]:visible').click();p.locator('details.competition-extension').wait_for(state='visible')
    scope=p.evaluate("()=>topicSession()?.items?.[0]?.draft?.work?.activeScopeId");assert scope and scope.startswith('variation:')
    x['variationScope']=scope;x['variationLayout']=layout(p,scope)
    inp=p.locator('#app [data-competition-input="extension"]:visible');assert inp.count()==1
    x['variationEmpty']=check(p,scope,'#app [data-action=competitionExtensionCheck]');assert not (x['variationEmpty']['after'].get('feedback') or {}).get('ok',False)
    inp.fill('abc');y=check(p,scope,'#app [data-action=competitionExtensionCheck]');x['variationInvalid']=y['after'];assert y['after']['answerState']!='correct' and not (y['after']['feedback'] or {}).get('ok',False)
    if i==166:x['variationWrong']='REUSED_ISSUE132_TARGETED_DELTA_NOT_COUNTED_HERE'
    else:
     assert i in var,('missing prior independent variation freeze',i)
     v=Fraction(var[i]);wrong=v+1
     # Fresh entry to avoid treating stale error state as new rejection.
     load(p,r);p.locator('#app [data-action=competitionIndependentVariation]:visible').click()
     p.locator('#app [data-competition-input="extension"]:visible').fill(str(wrong))
     y=check(p,scope,'#app [data-action=competitionExtensionCheck]');x['variationWrong']={'expected':str(v),'input':str(wrong),'actual':y['after']}
     assert y['after']['answerState']!='correct' and y['after']['feedback'] and not y['after']['feedback']['ok'],'wrong accepted or feedback missing'
     # Legitimate equivalent syntax for numeric value; reuse existing derivation, only this input syntax behavior gets credit.
     load(p,r);p.locator('#app [data-action=competitionIndependentVariation]:visible').click()
     eq=f'{v.numerator*2}/{v.denominator*2}'
     p.locator('#app [data-competition-input="extension"]:visible').fill(eq)
     y=check(p,scope,'#app [data-action=competitionExtensionCheck]');x['variationEquivalent']={'input':eq,'actual':y['after']}
     if y['after']['answerState']!='correct' or not (y['after']['feedback'] or {}).get('ok'):x['status']='REVIEW_EQUIVALENCE'
    if not all(z['horizontalPass'] for z in x['mainLayout']+x['variationLayout']):x['status']='REVIEW_LAYOUT' if x['status']=='OBSERVED' else x['status']+'+LAYOUT'
   except Exception as exc:x['errors'].append(repr(exc));x['status']='PARTIAL'
   if x['status']!='OBSERVED' and sum(y['status']!='OBSERVED' for y in out)<4:
    try:p.screenshot(path=str(OUT/f"{ident}-review.png"),full_page=True)
    except Exception:pass
   out.append(x)
  ctx.close();browser.close()
 return out
try:
 start=time.monotonic()
 with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool: observed=[x for q in pool.map(run,[rows[i::4] for i in range(4)]) for x in q]
 observed.sort(key=lambda x:x['caseId'])
 receipt={'base':'3f22d8002406857a33a3e254ebafc4366f6cec51','scope':'seed1 layout horizontal bounds, empty/unknown numeric negative, invalid syntax, equivalent variation inputs; not full semantic/route/environment contract','rows':observed,'counts':dict(Counter(x['status'] for x in observed)),'elapsedSeconds':round(time.monotonic()-start,2)}
 (OUT/'d-rc73-behavior-delta.json').write_text(json.dumps(receipt,ensure_ascii=False,indent=2))
 print('D_BEHAVIOR_SUMMARY '+json.dumps({k:v for k,v in receipt.items() if k!='rows'}|{'layoutRows':sum(len(x.get('mainLayout',[]))+len(x.get('variationLayout',[])) for x in observed),'review':[{'caseId':x['caseId'],'status':x['status'],'errors':x['errors']} for x in observed if x['status']!='OBSERVED']},ensure_ascii=False),flush=True)
finally:srv.shutdown()
