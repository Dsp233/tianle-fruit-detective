"""D #142 independent evidence: public product, original course semantic coverage, exact old attempts.
No C test imports; no W1 content regrade or W2 regrade."""
import os,sys,json,hashlib,threading,zipfile,csv,io,collections,concurrent.futures,urllib.request,time
from pathlib import Path
from http.server import SimpleHTTPRequestHandler,ThreadingHTTPServer
from playwright.sync_api import sync_playwright
ROOT=Path(os.environ['D_PRODUCT']);OUT=Path('r11-probe-output');OUT.mkdir(exist_ok=True)
BASE='6e5de89a8313d64b7aeef2efb1955501afe2829d'
sys.path.insert(0,str(ROOT/'tools'))
from g1_reading_packets import config,unpack
def packet(root):
 cfg=config((root/'index.html').read_text())
 return json.loads(unpack(cfg['reading']['data'][0],lambda n:(root/n).read_bytes()))
old=packet(Path('/tmp/d-before'));new=packet(ROOT)
course=new['courseScope']['activeCourseId'];oldm={m['id']:m for m in old['materials']};newm={m['id']:m for m in new['materials']}
assert old['diagnostics']==new['diagnostics'] and old['contentHash']==new['contentHash']
counts=collections.defaultdict(collections.Counter);labels=[];old_materials=[]
for ident,m in newm.items():
 if m['courseId']!=course:assert m==oldm[ident];continue
 o=oldm[ident];assert len(m['questions'])==len(o['questions'])
 assert {k:v for k,v in m.items() if k not in ('metadataStatus','prerequisites','prerequisitesStatus','questions')}=={k:v for k,v in o.items() if k not in ('metadataStatus','prerequisites','prerequisitesStatus','questions')}
 for q,oq in zip(m['questions'],o['questions']):
  assert {k:v for k,v in q.items() if k not in ('metadataStatus','category','ability','errorType','classification')}=={k:v for k,v in oq.items() if k not in ('metadataStatus','category','ability','errorType','classification')}
  assert q['metadataStatus']=='reviewed' and q['category'] in ('reading','math','literacy') and q['ability'] in ('recognition','facts','sequence','inference','conditions','model') and q['errorType'] in ('character','vocabulary','sentence','information','relation','calculation')
  if m['kind']=='story':counts[m['week']][q['category']]+=1
  labels.append({'id':q['id'],'day':m['day'],'kind':m['kind'],'prompt':q['prompt'],'sourceAbility':q['sourceAbility'],'category':q['category'],'ability':q['ability'],'errorType':q['errorType']})
assert len(labels)==336
coverage=[{'week':i,'reading':counts[i]['reading']+counts[i]['literacy'],'math':counts[i]['math'],'capacity':counts[i]['reading']+counts[i]['literacy']>=10 and counts[i]['math']>=3} for i in range(1,13)]
(OUT/'d142-metadata.json').write_text(json.dumps({'base':BASE,'labels':labels,'coverage':coverage,'unchangedDiagnostics':True,'unchangedW1Content':True},ensure_ascii=False,indent=2))
print('D142_COVERAGE '+json.dumps(coverage,ensure_ascii=False),flush=True)
# Read the retained Muse source itself, not C's interpretations. Locate the
# original 604 ledger by its previously frozen sha, plus exact 84-row cases.
frozen='76200287a6a99f210e65e60e27095bc27e87c5bda911daa5912d4e4e36b78721'
prior=json.loads(Path('tools/r11-product/d-muse604-integrated-scoped-signoff-20261125.json').read_text())
prior_ids={r['contractId'] for r in prior['rows']}
found=[]
for f in sorted((ROOT/'muse').rglob('*.zip')):
 try:
  with zipfile.ZipFile(f) as z:
   for name in z.namelist():
    if not name.lower().endswith(('.csv','.json','.tsv','.md','.txt')):continue
    raw=z.read(name);h=hashlib.sha256(raw).hexdigest()
    if h==frozen:
     found.append((str(f.relative_to(ROOT)),name))
     (OUT/'original-muse604-ledger').write_bytes(raw)
     print('D_ORIGINAL_LEDGER '+json.dumps({'zip':str(f.relative_to(ROOT)),'name':name,'sha256':h,'size':len(raw)}),flush=True)
     # Preserve all raw source rows in artifact. Print exact rows relevant to
     # newly recovered storage/layout evidence and #142; no generic pass.
     data=raw.decode('utf-8-sig')
     for i,line in enumerate(data.splitlines()):
      if any(t in line for t in ['RD-16','RD-17','RD-18','V12-PROD-10','C09','FIX2-LOAD-02','PM-04','PM-05','PM-06','PM-07']) or i<3:
       print('D_ORIGINAL_ROW '+json.dumps({'index':i,'line':line},ensure_ascii=False),flush=True)
    elif any(k in name.lower() for k in ('persona','profile','holdout','muse604')) and len(raw)<250000:
     print('D_SOURCE_MEMBER '+json.dumps({'zip':str(f.relative_to(ROOT)),'name':name,'size':len(raw),'sha256':h},ensure_ascii=False),flush=True)
 except zipfile.BadZipFile:pass
print('D_SOURCE_MATCH '+json.dumps(found),flush=True)
# Independent public browser test, generate exact old ordinary attempts via
# actual prior runtime in a separate origin; public candidate tested with
# same browser storage transported unchanged into public origin.
class H(SimpleHTTPRequestHandler):
 def __init__(self,*args,**kw):super().__init__(*args,directory='/tmp/d-before',**kw)
 def log_message(self,*args):pass
srv=ThreadingHTTPServer(('127.0.0.1',0),H);threading.Thread(target=srv.serve_forever,daemon=True).start()
oldurl=f'http://127.0.0.1:{srv.server_port}/index.html'
pub='https://dsp233.github.io/tianle-fruit-detective/'
def await_public():
 for _ in range(75):
  try:
   with urllib.request.urlopen(pub+'release-receipt.json?d='+str(time.time()),timeout=12) as r:j=json.load(r)
   if j.get('sourceSha')==BASE: return j
  except Exception:pass
  time.sleep(4)
 raise AssertionError('public receipt not ready')
# The public receipt name is taken from the existing formal public probe.
def loc(p,k):return p.locator(f'#app [data-action={k}]:visible')
def ready(p):p.wait_for_function("window.__AMC8_ReadingRuntime&&window.__AMC8_ReadingRuntime.engine().status().status==='ready'",timeout=50000)
def view(p):return p.evaluate("()=>{let r=window.__AMC8_ReadingRuntime;return {snapshot:r.snapshot(),report:r.report()}}")
def ats(p):return [e for e in view(p)['snapshot']['events'] if e['type']=='attempt']
def home(p,url):
 p.goto(url,wait_until='domcontentloaded')
 p.wait_for_function("Boolean(document.querySelector('[data-home-hub]')||window.__AMC8_ReadingRuntime||window.__AMC8_MATH_NAV)",timeout=50000)
 if not loc(p,'rdPlan').count():
  if loc(p,'rdHome').count():loc(p,'rdHome').first.click()
  else:
   b=p.locator('[data-action=reading]:visible')
   if not b.count():b=p.get_by_role('button',name='阅读训练',exact=True)
   if not b.count():b=p.get_by_role('button',name='进入中文阅读',exact=False)
   b.first.click()
  ready(p)
  if not loc(p,'rdPlan').count() and loc(p,'rdHome').count():loc(p,'rdHome').first.click()
 ready(p);loc(p,'rdPlan').first.wait_for(timeout=15000)
def parent(p,url):
 home(p,url);loc(p,'rdParent').last.click();p.locator('.rd-parent').wait_for();ready(p)
def set_none(p,url):
 parent(p,url);loc(p,'rdSettingsUnlock').first.click();ready(p)
 p.locator('[data-action=rdSetMode][data-mode=none]:visible').first.click();ready(p)
def start(p,url,d):
 home(p,url);loc(p,'rdPlan').first.click();p.locator(f'[data-action=rdStart][data-day="{d}"]:visible').click();ready(p);loc(p,'rdReadDone').first.click();ready(p)
def choose(p,d,pos,ordinal,want):
 q=p.evaluate("()=>window.__AMC8_ReadingRuntime.engine().current().question");assert q['id']==f'R2-S{d:02d}-{pos}',q
 # Use prior frozen W1 correct/incorrect ordinal only as behavior transit.
 pick=loc(p,'rdPick');assert pick.count()==len(q['options'])
 pick.nth(ordinal-1).click();loc(p,'rdSubmit').first.click();ready(p)
 e=ats(p)[-1];assert e['questionId']==q['id'] and e['correct']==want,e
 return e
def run(engine):
 x={'engine':engine,'status':'INCOMPLETE','checks':{},'errors':[]}
 with sync_playwright() as pw:
  b=getattr(pw,engine).launch(headless=True,**({'args':['--no-sandbox','--disable-dev-shm-usage']} if engine=='chromium' else {}))
  ctx=b.new_context(viewport={'width':1024,'height':768});p=ctx.new_page();p.set_default_timeout(15000)
  try:
   set_none(p,oldurl);start(p,oldurl,2);e=choose(p,2,1,1,False);assert e['metadataStatus']=='unreviewed'
   before=ats(p);storage=ctx.storage_state();ctx.close()
   for o in storage['origins']:o['origin']='https://dsp233.github.io'
   ctx=b.new_context(storage_state=storage,viewport={'width':1024,'height':768});p=ctx.new_page();p.set_default_timeout(15000)
   home(p,pub);s=view(p);assert ats(p)==before
   assert s['report']['quarantinedAttempts']==0
   assert any(r['questionId']==e['questionId'] and r['itemTag']=='information' for r in s['report']['supportEvidence']['wrongFirst'])
   assert not s['report']['supportEvidence']['causeConfirmed'];assert not any(w['ready'] for w in s['report']['readiness'])
   unavailable=[w['week'] for w in s['report']['readiness'] if w.get('evaluable') is False]
   assert unavailable==[w['week'] for w in coverage if not w['capacity']],unavailable
   rec=s['report']['recommendation'];assert rec['errorType']=='information' and rec['materialId']!='R2-D002-CORE'
   assert any(q['errorType']=='information' for q in newm[rec['materialId']]['questions'])
   parent(p,pub);p.screenshot(path=str(OUT/f'{engine}-parent.png'),full_page=True)
   rem=loc(p,'rdRemediate')
   if not rem.count():home(p,pub);rem=loc(p,'rdRemediate')
   rem.first.click();ready(p);opened=p.evaluate("()=>window.__AMC8_ReadingRuntime.engine().current().material.id");assert opened==rec['materialId']
   x['checks']['oldAttemptExact']=True;x['checks']['matchedRemediation']={'recommendation':rec,'opened':opened};x['checks']['coverageUnavailable']=unavailable
   ctx.close();ctx=b.new_context(viewport={'width':1024,'height':768});p=ctx.new_page();p.set_default_timeout(15000)
   set_none(p,pub);start(p,pub,3);a=choose(p,3,1,3,True);assert a['category']=='math' and a['ability']=='model' and not a['prerequisitesConfirmed']
   r=view(p)['report'];assert not any(w['ready'] for w in r['readiness']);x['checks']['unconfirmedMathExcluded']=True
   # Another profile, explicit parent knowledge confirmation; no retrospective
   # change of old prerequisite facts. D03-1 original W1 key C.
   ctx.close();ctx=b.new_context(viewport={'width':1024,'height':768});p=ctx.new_page();p.set_default_timeout(15000)
   set_none(p,pub);parent(p,pub);loc(p,'rdSettingsUnlock').first.click();ready(p)
   p.locator('[data-action=rdKnown][data-value="普通课程：整数减法与数量比较"]:visible').click();ready(p)
   start(p,pub,3);a=choose(p,3,1,3,True);assert a['prerequisitesConfirmed'] and a['category']=='math'
   r=view(p)['report'];assert not any(w['ready'] for w in r['readiness']);assert r['readiness'][0]['extraction']['total']>=1
   before=ats(p);p.reload(wait_until='domcontentloaded');ready(p);assert ats(p)==before
   x['checks']['confirmedMathCounted']=True;x['checks']['newAttemptReloadExact']=True;x['status']='PASS'
  except Exception as ex:
   x['errors'].append(repr(ex))
   try:x['visible']=p.locator('#app').inner_text()[:1500];p.screenshot(path=str(OUT/f'{engine}-error.png'),full_page=True)
   except Exception:pass
  finally:ctx.close();b.close()
 return x
try:
 # Exact public identity via the same receipt URL used in released workflow;
 # separately hash public index before browser operations.
 from urllib.parse import urljoin
 target=hashlib.sha256((ROOT/'index.html').read_bytes()).hexdigest()
 for _ in range(75):
  try:
   with urllib.request.urlopen(pub+'index.html?d='+str(time.time()),timeout=12) as r:actual=hashlib.sha256(r.read()).hexdigest()
   if actual==target:break
  except Exception:pass
  time.sleep(4)
 else:raise AssertionError('public index not at released candidate')
 with concurrent.futures.ThreadPoolExecutor(max_workers=2) as pool:results=list(pool.map(run,['chromium','webkit']))
 (OUT/'d142-independent.json').write_text(json.dumps({'formal':BASE,'publicIndexSha256':target,'coverage':coverage,'results':results},ensure_ascii=False,indent=2))
 for x in results:print('D142_RESULT '+json.dumps(x,ensure_ascii=False),flush=True)
 assert all(x['status']=='PASS' for x in results)
finally:srv.shutdown()
