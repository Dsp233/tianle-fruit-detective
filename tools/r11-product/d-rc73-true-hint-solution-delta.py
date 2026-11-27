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




# Recover existing artifacts directly; verify every recorded screenshot hash and extract actual controls.
PRIOR=Path(os.environ['D_STAGE_ARTIFACT'])
data=json.loads((PRIOR/f'd-rc73-stage-{ENGINE}-{SHARD}.json').read_text())
assert data['formal']=='fcef9785308363379b028129871c92700e1f93d4'
assert data['engine']==ENGINE and data['shard']==SHARD
assert len(data['rows'])==len(rows)
assert {x['caseId'] for x in data['rows']}=={x['caseId'] for x in rows}
observed={}
for x in data['rows']:
 assert x['status']=='OBSERVED' and not x['errors']
 ph={a['name']:a for a in x['phases']};assert len(ph)==8
 for a in ph.values():
  f=PRIOR/a['shot'];assert hashlib.sha256(f.read_bytes()).hexdigest()==a['sha256'],f
 def phase_state(k):return ph[k]['state']
 def controls(k):return phase_state(k)['view']['controls']
 observed[x['caseId']]={'id':x['caseId'],'taskId':x['taskId'],'recipe':x['recipe'],'mainFieldsRetainedAfterVariation': {k:v for k,v in x['mainStateAfterVariation'].items() if k!='active'}=={k:v for k,v in phase_state('main-solution').items() if k not in ('view','active')},'mainRetainedAfterVariation':{k:v for k,v in x['mainStateAfterVariation'].items() if k!='active'}=={k:v for k,v in phase_state('main-solution').items() if k not in ('view','active')},'noNewCorrectSubmission':x['noNewCorrectSubmission'],'initialHelp':phase_state('initial')['help'],'mainSolutionHelp':phase_state('main-solution')['help'],'variationBeforeHelp':phase_state('variation-before')['help'],'variationHintHelp':phase_state('variation-hint-2')['help'],'variationDraftInput':phase_state('variation-draft')['input'],'variationControls':controls('variation-hint-2'),'phaseShotHashes':{a['name']:a['sha256'] for a in ph.values()},'figureCounts':{k:len(a['state']['view']['figures']) for k,a in ph.items()}}
(OUT/f'd-stage-fields-recovered-{ENGINE}-{SHARD}.json').write_text(json.dumps({'engine':ENGINE,'shard':SHARD,'sourceRun':45646170985,'records':list(observed.values())},ensure_ascii=False,indent=2))
print('D_FIELDS_RECOVERY '+json.dumps({'engine':ENGINE,'shard':SHARD,'rows':len(observed),'verifiedScreenshots':len(observed)*8,'mainRetainedOnVariation':sum(x['mainFieldsRetainedAfterVariation'] for x in observed.values()),'mainRetainedAfterVariation':sum(x['mainRetainedAfterVariation'] for x in observed.values()),'noNewCorrectSubmission':sum(x['noNewCorrectSubmission'] for x in observed.values()),'variationControls':sorted({(c['action'],c['label'],c['disabled']) for x in observed.values() for c in x['variationControls'] if c['scope']=='variation'},key=str)},ensure_ascii=False),flush=True)
# New action only: identify actual solution control from rendered DOM, not previous narrow role regex.
def view(p,scope):
 s=state(p,scope);s['dom']=p.evaluate("""()=>{let el=document.querySelector('details.competition-extension');return el?{text:el.innerText,controls:[...el.querySelectorAll('button,a,summary,[role=button],[data-action]')].filter(x=>x.getClientRects().length).map(x=>({tag:x.tagName,action:x.dataset.action||'',text:x.innerText.trim(),aria:x.getAttribute('aria-label'),disabled:!!x.disabled,html:x.outerHTML.slice(0,400)})),accessible:el.outerHTML}:null}""");return s
def run(batch):
 out=[]
 with sync_playwright() as pw:
  b=getattr(pw,ENGINE).launch(headless=True,**({'args':['--no-sandbox','--disable-dev-shm-usage']} if ENGINE=='chromium' else {}))
  for r in batch:
   ident=r['caseId'];x={'caseId':ident,'engine':ENGINE,'status':'PARTIAL','errors':[]}
   ctx=b.new_context(viewport={'width':1024,'height':768},has_touch=True);p=ctx.new_page();p.set_default_timeout(8000)
   try:
    p.goto(URL,wait_until='domcontentloaded');p.wait_for_function("Boolean(window.__AMC8_MATH_NAV)&&typeof progressStore!=='undefined'&&progressStore.getStatus()==='ready'",timeout=60000);p.add_script_tag(content=qa);p.wait_for_function('Boolean(window.AMC8_QA)')
    a=load(p,r);assert a['taskId']==observed[ident]['taskId'];x['taskId']=a['taskId']
    p.locator('#app [data-action=competitionIndependentVariation]:visible').click();ready(p)
    scope=p.evaluate("()=>topicSession()?.items?.[0]?.draft?.work?.activeScopeId");assert scope.startswith('variation:')
    ext=p.locator('details.competition-extension:visible').first
    x['before']=view(p,scope);x['mainBefore']=state(p,'main')
    # Actual labels/actions, including summary/details controls; exclude hint and check.
    def candidate():
     for el in ext.locator('button:visible,a:visible,summary:visible,[role=button]:visible,[data-action]:visible').all():
      name=(el.inner_text()+' '+(el.get_attribute('aria-label') or '')).strip();act=el.get_attribute('data-action') or ''
      if (__import__('re').search(r'解法|解析|答案|solution|reveal|explanation',name+' '+act,__import__('re').I) and not __import__('re').search(r'提示|hint|检查|提交|check|判分|输入答案|填写答案|你的答案|独立变式',name+' '+act,__import__('re').I) and el.is_enabled()):
       return el
    # Re-enter only to get prerequisite first hint. Do not reproduce old stage capture.
    h=ext.locator('[data-action=competitionHint]:visible')
    if h.count() and h.first.is_enabled():h.first.click();ready(p)
    x['afterInitialHint']=view(p,scope)
    x['actualAdditionalHints']=[]
    # The prior script did NOT operate this exact visible control.
    for i in range(12):
     more=ext.locator('[data-action=competitionHintMore]:visible:enabled')
     if not more.count():break
     prior=view(p,scope);more.first.click();ready(p);after=view(p,scope)
     x['actualAdditionalHints'].append({'before':prior['help'],'after':after['help'],'dom':after['dom']})
     if prior['help']==after['help'] and prior['dom']['text']==after['dom']['text']:break
    c=candidate()
    x['preClick']=view(p,scope)
    if c is not None:
     x['clicked']={'text':c.inner_text(),'action':c.get_attribute('data-action'),'tag':c.evaluate('e=>e.tagName')};c.click();ready(p)
     x['after']=view(p,scope);x['mainAfter']=state(p,'main')
     x['mainUnchanged']=x['mainBefore']==x['mainAfter']
     x['noCorrectSubmission']=x['after']['answerState']!='correct' and x['mainAfter']['answerState']!='correct'
     x['status']='CONTROL_OBSERVED' if x['noCorrectSubmission'] else 'REVIEW'
    else:x['status']='CONTROL_NOT_FOUND';x['mainAfter']=state(p,'main');x['mainUnchanged']=x['mainBefore']==x['mainAfter'];x['noCorrectSubmission']=state(p,scope)['answerState']!='correct' and x['mainAfter']['answerState']!='correct'
    f=OUT/f'{ident}-{ENGINE}-variation-solution-delta.png';p.screenshot(path=str(f),full_page=True);x['shot']=f.name;x['sha256']=hashlib.sha256(f.read_bytes()).hexdigest()
   except Exception as ex:x['errors'].append(repr(ex))
   finally:ctx.close()
   out.append(x)
   print('D_TRUE_HINT_DELTA '+json.dumps({'caseId':ident,'engine':ENGINE,'status':x['status'],'clicked':x.get('clicked'),'actualAdditionalHintCount':len(x.get('actualAdditionalHints',[])),'helpBefore':x.get('preClick',{}).get('help'),'helpAfter':x.get('after',{}).get('help'),'mainUnchanged':x.get('mainUnchanged'),'noCorrectSubmission':x.get('noCorrectSubmission'),'errors':x['errors']},ensure_ascii=False),flush=True)
  b.close()
 return out
try:
 with concurrent.futures.ThreadPoolExecutor(max_workers=3) as pool:result=[x for q in pool.map(run,[rows[i::3] for i in range(3)]) for x in q]
 (OUT/f'd-variation-true-hint-delta-{ENGINE}-{SHARD}.json').write_text(json.dumps({'formal':data['formal'],'engine':ENGINE,'shard':SHARD,'sourceRun':45646170985,'rows':result},ensure_ascii=False,indent=2))
 print('D_TRUE_HINT_COUNTS '+json.dumps(dict(Counter(x['status'] for x in result))),flush=True)
finally:srv.shutdown()
