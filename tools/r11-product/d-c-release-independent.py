"""Independent D closeout of #131/#132 only, using actual formal release UI."""
import csv,functools,hashlib,io,json,os,re,subprocess,sys,threading,zipfile
from fractions import Fraction
from pathlib import Path
from http.server import SimpleHTTPRequestHandler,ThreadingHTTPServer
from playwright.sync_api import sync_playwright
ROOT=Path(os.environ['D_PRODUCT']); BASE=Path(os.environ['D_OLD'])
OUT=Path('r11-probe-output');OUT.mkdir(exist_ok=True)
ENGINE=os.environ['D_ENGINE']
sys.path.insert(0,str(ROOT/'tools'))
from g1_reading_packets import config,unpack
sha=subprocess.check_output(['git','-C',str(ROOT),'rev-parse','HEAD'],text=True).strip()
assert sha=='3f22d8002406857a33a3e254ebafc4366f6cec51'
oldsha=subprocess.check_output(['git','-C',str(BASE),'rev-parse','HEAD'],text=True).strip()
assert oldsha=='72f2f229246af362f9024db217479357890c8cd3'
assert hashlib.sha256((ROOT/'index.html').read_bytes()).hexdigest()=='d51b53efa75987524e998737af53e57c8447ff7734d34806012f6cdaec17f69b'
current=ROOT
class Handler(SimpleHTTPRequestHandler):
 def __init__(self,*args,**kwargs):super().__init__(*args,directory=str(current),**kwargs)
 def log_message(self,*args):pass
 def end_headers(self):self.send_header('Cache-Control','no-store');super().end_headers()
srv=ThreadingHTTPServer(('127.0.0.1',0),Handler)
threading.Thread(target=srv.serve_forever,daemon=True).start()
URL=f'http://127.0.0.1:{srv.server_port}/index.html#math'
legacy=config((BASE/'qa/index.html').read_text())['math']['scripts'][-1]
assert legacy['id']=='f12930312b8e007ab222216e6f478d87b24a0856ed7b0e191a98326ce32bec85'
qa=unpack(legacy,lambda n:(BASE/n).read_bytes()).decode()
with zipfile.ZipFile(ROOT/'muse/rc73/rc73-muse-acceptance-kit.zip') as z:
 cases=[r for r in csv.DictReader(io.StringIO(z.read('ledgers/instance-environments.csv').decode('utf-8-sig'))) if r['environment']=='native_chrome' and r['caseId'] in {f'M72-I{i:04d}' for i in range(166,171)}]
assert len(cases)==5
def recipe(r):return dict(familyId=r['familyId'],configuration=r['configurationId'],seed=int(r['seed']),generatorRevision=int(r['generatorRevision']))
def ready(p):
 p.wait_for_function("Boolean(window.__AMC8_MATH_NAV) && typeof progressStore!=='undefined' && progressStore.getStatus()==='ready'",timeout=60000)
def page(ctx):
 p=ctx.new_page();p.set_default_timeout(15000);p.goto(URL,wait_until='domcontentloaded');ready(p);return p
active="""()=>{let a=ExamMappingUI.exportDraft().record?.sessions?.active;return a?{id:a.id,attemptId:a.attemptId,ordinal:a.submissionOrdinal,help:a.helpLevel,input:a.input,outcome:a.feedback?.outcome??null}:null}"""
events="""()=>{let result=[];const seen=new Set();function walk(o){if(!o||typeof o!=='object'||seen.has(o))return;seen.add(o);if(o.type==='response_submitted')result.push(o);for(const v of Object.values(o))walk(v)}walk(ExamMappingUI.exportDraft().record);return result}"""
def select_decision(p):
 p.on('dialog',lambda d:d.accept() if '家长' in d.message and ('确认'in d.message or '调整'in d.message) else d.dismiss())
 p.locator('[data-action=topicParentUnlock]:visible').first.click()
 for topic in ['A01','A02','N01','N02']:
  button=p.locator(f'[data-action=topicSelect][data-code="{topic}"]:visible')
  if button.get_attribute('aria-pressed')!='true':
   button.click();p.wait_for_function("""id=>document.querySelector('[data-action=topicSelect][data-code="'+id+'"]')?.getAttribute('aria-pressed')==='true' && progressStore.getStatus()==='ready'""",arg=topic)
 picker=p.locator('[data-source-exam-picker]')
 if not picker.is_visible():p.get_by_text('细化已掌握知识 / 指定真题',exact=True).click()
 picker.select_option('AMC8-2016-09');p.locator('[data-action=sourceExamReplace]:visible').click()
 p.wait_for_function("document.querySelector('[data-selected-exam-summary]')?.innerText.includes('AMC8-2016-09') && progressStore.getStatus()==='ready'")
 p.locator('[data-action=topicStart]:visible:enabled').first.click()
 p.wait_for_function("""()=>{let a=ExamMappingUI.exportDraft().record?.sessions?.active;return a?.id==='RTM-2016-09-DECISION'&&a.submissionOrdinal===0&&progressStore.getStatus()==='ready'}""")
 task=p.locator('[data-rtm-task]')
 assert task.locator('.task-title').inner_text()=='72=2³×3²，不同质因数之和如何求？'
 assert set(task.locator('[data-action=rtmChoice]:visible').all_inner_texts())=={'2+3','3+2','2+2+2+3+3'}
def submit(p,value,want):
 before=p.evaluate(active)
 task=p.locator('[data-rtm-task]')
 task.locator('[data-action=rtmChoice]:visible').filter(has_text=re.compile('^'+re.escape(value)+'$')).click()
 p.wait_for_function("progressStore.getStatus()==='ready'")
 task.locator('[data-action=rtmSubmit]:visible').click()
 p.wait_for_function("""a=>{let x=ExamMappingUI.exportDraft().record?.sessions?.active;return x?.attemptId===a.attemptId&&x.submissionOrdinal===a.ordinal+1&&!!x.feedback?.outcome&&progressStore.getStatus()==='ready'}""",arg=before)
 after=p.evaluate(active);assert after['outcome']==want and after['help']==0,after
 return after
def load(p,r):
 req=recipe(r);loaded=p.evaluate('r=>AMC8_QA.loadCase(r,true)',req)
 assert all(loaded[k]==v for k,v in req.items())
 p.wait_for_function("progressStore.getStatus()==='ready'")
 ident=p.evaluate("""()=>{let t=playerTask(),c=t.competition;return {id:t.id,version:t.contentVersion,recipe:c.recipe,signature:c.signature,main:t.prompt,key:c.extension.key}}""")
 p.locator('#app [data-action=competitionIndependentVariation]:visible').click()
 ex=p.locator('details.competition-extension');ex.wait_for(state='visible');assert ex.evaluate('el=>el.open')
 scope=p.evaluate("()=>topicSession()?.items?.[0]?.draft?.work?.activeScopeId")
 assert scope=='variation:remove-high-to-target-v2',scope
 return dict(caseId=r['caseId'],identity=ident,scope=scope,text=ex.inner_text(),requested=req)
def solve(row):
 # Derive from the visible revised prompt and original per-person scores, never inspect answer keys.
 m=re.search(r'红队有\s*(\d+)\s*人、蓝队有\s*(\d+)\s*人',row['text'])
 s=re.search(r'红队每人得\s*(\d+)\s*分，蓝队每人得\s*(\d+)\s*分',row['identity']['main'])
 t=re.search(r'不超过\s*(\d+(?:\.\d+)?)',row['text'])
 assert m and s and t,row
 a,b=map(int,m.groups());x,y=map(int,s.groups());target=Fraction(t.group(1))
 n=max(x,y); count=a if x>y else b
 # a*x+b*y-k*n <= target*(a+b-k). Compute minimum integer via exact rational bound.
 gap=Fraction(a*x+b*y)-target*(a+b);step=Fraction(n)-target
 assert step>0
 q=gap/step; k=max(0,-(-q.numerator//q.denominator))
 assert k<=count and a+b-k>0
 mean=lambda j:Fraction(a*x+b*y-j*n,a+b-j)
 assert mean(k)<=target and (k==0 or mean(k-1)>target)
 return dict(answer=k,negative=k-1 if k>0 else k+1,derivation=f'({a}*{x}+{b}*{y}-{n}k)/({a+b}-k)<={target}; k>={q}; min={k}',atMinimum=str(mean(k)),atPrevious=str(mean(k-1)) if k else None)
def grade(p,row,value,want):
 scope=row['scope'];inp=p.locator('#app [data-competition-input="extension"]:visible');assert inp.count()==1
 inp.fill(str(value));p.locator('#app [data-action=competitionExtensionCheck]:visible').click()
 p.wait_for_function("""s=>{let m=topicSession()?.items?.[0]?.draft?.work?.scopes?.[s];return !!m?.feedback&&!!m?.lastSubmissionKey&&progressStore.getStatus()==='ready'}""",arg=scope)
 a=p.evaluate("""s=>{let w=topicSession().items[0].draft.work,m=w.scopes[s];return {input:m.input,feedback:m.feedback,state:m.answerState,help:m.help,main:w.scopes.main.answerState,scope:w.activeScopeId}}""",scope)
 assert Fraction(a['input']['raw'])==value and a['scope']==scope and bool(a['feedback']['ok'])==want and (a['state']=='correct')==want,a
 assert not a['help']['solutionSeen'] and not a['help']['revealedHintIds'],a
 return a
report={'base':sha,'old':oldsha,'engine':ENGINE,'issue131':{},'issue132':[],'status':'NOT_PROVEN'}
try:
 with sync_playwright() as p:
  b=getattr(p,ENGINE).launch(headless=True,args=['--no-sandbox','--disable-dev-shm-usage'] if ENGINE=='chromium' else [])
  # Independent expected outcomes from the math: distinct primes {2,3}; multiplicity is not requested.
  ctx=b.new_context(viewport={'width':1024,'height':768});current=BASE;pg=page(ctx);select_decision(pg)
  first=submit(pg,'3+2','INCORRECT');prior=pg.evaluate(events);assert prior
  current=ROOT;pg.reload(wait_until='domcontentloaded');ready(pg);assert all(e in pg.evaluate(events) for e in prior)
  report['issue131']['historicalUnchanged']=first;ctx.close()
  for v,w in [('3+2','VERIFIED'),('2+3','VERIFIED'),('2+2+2+3+3','INCORRECT')]:
   ctx=b.new_context(viewport={'width':1024,'height':768});pg=page(ctx);select_decision(pg);a=submit(pg,v,w)
   report['issue131'].setdefault('firstAnswers',[]).append(dict(expression=v,actual=a))
   if w=='INCORRECT':
    prior=pg.evaluate(events);retry=pg.locator('[data-action=rtmRetry]:visible')
    if retry.count():retry.click();pg.wait_for_function("progressStore.getStatus()==='ready'")
    second=submit(pg,'3+2','VERIFIED');pg.reload(wait_until='domcontentloaded');ready(pg)
    assert all(e in pg.evaluate(events) for e in prior)
    report['issue131']['retry']=second
   ctx.close()
  # Freeze visible prompts and independent calculations before first feedback. No existing C test imported.
  current=BASE;ctx=b.new_context(viewport={'width':1024,'height':768});pg=page(ctx);pg.add_script_tag(content=qa)
  old=[load(pg,r) for r in cases];ctx.close()
  current=ROOT;ctx=b.new_context(viewport={'width':1024,'height':768});pg=page(ctx);pg.add_script_tag(content=qa)
  frozen=[]
  for r,o in zip(cases,old):
   n=load(pg,r);assert n['identity']==o['identity'] and n['scope']==o['scope'],(o,n)
   assert n['text']!=o['text'];n['before']=o['text'];n['math']=solve(n);frozen.append(n)
  freeze=OUT/f'd-fix-freeze-{ENGINE}.json';freeze.write_text(json.dumps(frozen,ensure_ascii=False,indent=2))
  report['freezeSha256']=hashlib.sha256(freeze.read_bytes()).hexdigest()
  ctx.close()
  for r,f in zip(cases,frozen):
   ctx=b.new_context(viewport={'width':1024,'height':768});pg=page(ctx);pg.add_script_tag(content=qa)
   n=load(pg,r);assert n['text']==f['text'] and n['identity']==f['identity']
   neg=grade(pg,n,f['math']['negative'],False)
   ctx.close()
   ctx=b.new_context(viewport={'width':1024,'height':768});pg=page(ctx);pg.add_script_tag(content=qa);n=load(pg,r)
   pos=grade(pg,n,f['math']['answer'],True)
   report['issue132'].append(dict(caseId=r['caseId'],recipe=recipe(r),math=f['math'],negative=neg,positive=pos,identity=f['identity']))
   ctx.close()
  b.close()
  report['status']='PASS'
finally:
 (OUT/f'd-fix-receipt-{ENGINE}.json').write_text(json.dumps(report,ensure_ascii=False,indent=2))
 print('D_FIX_RECEIPT '+json.dumps(report,ensure_ascii=False),flush=True)
 srv.shutdown()
