"""RC73 independent remaining configuration behavior/layout delta, not a mathematical regrade."""
import csv,functools,hashlib,io,json,os,subprocess,sys,threading,time,zipfile,concurrent.futures
from fractions import Fraction
from collections import Counter
from pathlib import Path
from http.server import SimpleHTTPRequestHandler,ThreadingHTTPServer
from playwright.sync_api import sync_playwright
ROOT=Path(os.environ['D_PRODUCT']); D=Path(os.environ['D_EVIDENCE'])/'tools/r11-product';OUT=Path('r11-probe-output');OUT.mkdir(exist_ok=True)
assert subprocess.check_output(['git','-C',str(ROOT),'rev-parse','HEAD'],text=True).strip()=='f306ceafc90b16e5794e3e4a1df95101a73e2778'
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

# Previously observed distinct negative inputs from run 45507960056 and exact deep wrong freeze.
previous=dict(x.split(':') for x in """0001:64 0006:65 0011:6 0016:51 0021:26 0026:34 0031:15 0036:11 0041:14 0046:11 0051:1 0056:40 0061:2658 0066:21 0071:12 0076:4 0081:59 0086:120 0091:67 0096:4 0101:58 0106:15 0111:121 0116:3 0121:6 0126:10081 0131:447 0136:270 0141:29 0146:19 0151:7/65 0156:14 0161:21 0266:430 0271:48 0276:56 0281:42 0286:2 0291:17 0296:49 0301:872 0306:101/3 0311:11 0326:23 0331:137 0336:25 0341:26 0346:10 0351:61 0356:13 0361:29 0366:8 0371:10 0376:3 0381:0 0386:21 0391:169 0396:11 0401:39 0406:5 0411:16 0416:2749 0421:4 0426:27 0431:20 0436:2 0441:1 0446:5 0451:69 0456:83 0461:103 0466:59 0471:113 0476:10 0481:202 0486:56 0491:86/121 0496:130 0501:86 0506:9 0511:51 0516:94 0521:41 0526:5 0531:3 0536:36 0541:16 0546:90 0551:1443 0556:135 0561:1807 0566:177 0571:12 0576:21 0581:8 0586:5 0591:8/15 0596:6/17 0601:1 0606:5 0611:8 0616:2 0621:42 0626:15 0631:6 0636:18 0661:66 0666:58 0671:21 0676:10 0681:6 0706:126 0711:12 0716:39 0721:56""".split())
prior_deep=json.loads(Path('/tmp/d-deep-wrong-expected.json').read_text())['wrong']
def run(batch):
 out=[]
 with sync_playwright() as pw:
  browser=pw.chromium.launch(headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
  ctx=browser.new_context(viewport={'width':1024,'height':768},has_touch=True);p=ctx.new_page();p.set_default_timeout(6000)
  p.goto(URL,wait_until='domcontentloaded');p.wait_for_function("Boolean(window.__AMC8_MATH_NAV)&&typeof progressStore!=='undefined'&&progressStore.getStatus()==='ready'",timeout=60000);p.add_script_tag(content=qa);p.wait_for_function('Boolean(window.AMC8_QA)')
  for r in batch:
   ident=r['caseId'];i=int(ident.split('I')[-1]);x={'caseId':ident,'recipe':request(r),'newWrong':[],'reusedWrong':[],'invalid':[],'status':'OBSERVED','errors':[]}
   try:
    a=load(p,r);x['taskId']=a['taskId'];correct=Fraction(main[i]);picks=p.locator('#app [data-action=competitionPick]:visible')
    x['allOptions']=picks.all_inner_texts();x['correctFrozen']=str(correct)
    prev={num(previous.get(f'{i:04}',''))}
    if a['taskId'] in prior_deep:prev.add(num(prior_deep[a['taskId']][0]))
    if a['taskId']=='COMP-14B2E628':prev.update([Fraction(9),Fraction(15)])
    if a['taskId']=='COMP-86E3F8AD':prev.update([Fraction(8),Fraction(9)])
    if picks.count():
     for v in x['allOptions']:
      n=num(v)
      if n is None:x['errors'].append('NON_NUMERIC_OPTION:'+v);continue
      if n==correct:continue
      if n in prev:x['reusedWrong'].append(v);continue
      # Re-enter exact recipe before each newly tested wrong input to prevent stale feedback.
      load(p,r);q=p.locator('#app [data-action=competitionPick]:visible');hit=[k for k in q.all() if k.inner_text().strip()==v.strip()];assert len(hit)==1,(v,q.all_inner_texts())
      hit[0].tap();ready(p);b=state(p,'main');button=p.locator('#app [data-action=check]:visible').first;button.tap();ready(p);s=state(p,'main')
      ok=s['answerState']!='correct' and bool(s.get('feedback')) and not s['feedback']['ok'] and s.get('key')!=b.get('key')
      x['newWrong'].append({'input':v,'pass':ok,'actual':s})
    else:
     # Only missing illegal domain and keyboard submit tests on free-input main; no correct regrade.
     for v in ['abc','1/0','-Infinity']:
      load(p,r);inp=p.locator('#app input:visible').first;inp.fill(v);inp.press('Enter');ready(p);s=state(p,'main')
      x['invalid'].append({'input':v,'notAccepted':s['answerState']!='correct' and not (s.get('feedback') or {}).get('ok',False),'actual':s})
    if any(not a['pass'] for a in x['newWrong']) or any(not a['notAccepted'] for a in x['invalid']) or x['errors']:x['status']='REVIEW'
   except Exception as ex:x['errors'].append(repr(ex));x['status']='PARTIAL'
   out.append(x)
  ctx.close();browser.close()
 return out
def reading_identity():
 old=Path('/tmp/d-w1');new=ROOT
 def read(root):
  p=config((root/'index.html').read_text())['reading']['data'][0]
  return p['id'],json.loads(unpack(p,lambda n:(root/n).read_bytes()))
 a,old_data=read(old);b,new_data=read(new)
 def collect(x,d):
  if isinstance(x,dict):
   i=x.get('id')
   if isinstance(i,str) and i.startswith('R2-'):d.setdefault(i,[]).append(x)
   for k,v in x.items():collect(v,d)
  elif isinstance(x,list):
   for v in x:collect(v,d)
 od={};nd={};collect(old_data,od);collect(new_data,nd)
 same=[i for i in od if i in nd and od[i]==nd[i]]
 diff=[i for i in od if i in nd and od[i]!=nd[i]]
 # Preserve per-field difference of known object IDs. Never equate whole W1/W2 packets.
 details=[]
 for i in diff:
  o=od[i];n=nd[i]
  fields=sorted(set(k for z in o+n for k in z))
  changed=[k for k in fields if [z.get(k) for z in o]!=[z.get(k) for z in n]]
  details.append({'id':i,'changedFields':changed,'oldCount':len(o),'newCount':len(n)})
 x={'W1':a,'current':b,'oldTopKeys':list(old_data),'newTopKeys':list(new_data),'oldIDs':len(od),'newIDs':len(nd),'exact':same,'changed':details,'missing':sorted(set(od)-set(nd))}
 (OUT/'d-w1-reading-identity.json').write_text(json.dumps(x,ensure_ascii=False,indent=2))
 print('D_READING_IDENTITY '+json.dumps({k:v for k,v in x.items() if k not in ('exact','changed')}|{'exactCount':len(same),'changedCount':len(diff),'changedFields':dict(Counter(k for r in details for k in r['changedFields'])),'samples':details[:6]},ensure_ascii=False),flush=True)
try:
 reading_identity()
 with concurrent.futures.ThreadPoolExecutor(max_workers=5) as pool:observed=[x for q in pool.map(run,[rows[i::5] for i in range(5)]) for x in q]
 observed.sort(key=lambda x:x['caseId'])
 counts={'configs':len(observed),'allWrongChoiceConfigs':sum(bool(x.get('allOptions')) and x['status']=='OBSERVED' for x in observed),'newWrong':sum(len(x['newWrong']) for x in observed),'newWrongPass':sum(y['pass'] for x in observed for y in x['newWrong']),'reusedWrong':sum(len(x['reusedWrong']) for x in observed),'invalid':sum(len(x['invalid']) for x in observed),'invalidNotAccepted':sum(y['notAccepted'] for x in observed for y in x['invalid']),'statuses':dict(Counter(x['status'] for x in observed))}
 (OUT/'d-rc73-remaining-options.json').write_text(json.dumps({'base':'f306ceafc90b16e5794e3e4a1df95101a73e2778','scope':'remaining distinct visible wrong choices at seed1 by real touch events and keyboard illegal-input negative controls; no correct regrade; earlier wrong inputs reused','counts':counts,'rows':observed},ensure_ascii=False,indent=2))
 print('D_REMAINING_OPTIONS '+json.dumps({'counts':counts,'review':[x for x in observed if x['status']!='OBSERVED']},ensure_ascii=False),flush=True)
finally:srv.shutdown()
