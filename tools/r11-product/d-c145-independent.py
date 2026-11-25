"""D independent #145: exact legacy resource derivation and public targeted behavior only."""
import os,sys,json,hashlib,threading,collections,concurrent.futures,urllib.request,time
from pathlib import Path
from http.server import SimpleHTTPRequestHandler,ThreadingHTTPServer
from playwright.sync_api import sync_playwright
ROOT=Path(os.environ['D_PRODUCT']);OUT=Path('r11-probe-output');OUT.mkdir(exist_ok=True)
BASE='fcef9785308363379b028129871c92700e1f93d4'
sys.path.insert(0,str(ROOT/'tools'))
from g1_reading_packets import config,unpack
def packet(root):
 cfg=config((root/'index.html').read_text())
 return json.loads(unpack(cfg['reading']['data'][0],lambda n:(root/n).read_bytes()))
old=packet(Path('/tmp/d-before'));new=packet(ROOT)
oldm={m['id']:m for m in old['materials']};newm={m['id']:m for m in new['materials']}
assert all(newm[k]==v for k,v in oldm.items())
assert old['diagnostics']==new['diagnostics'] and old['contentHash']==new['contentHash']
course=new['courseScope']['activeCourseId']
added=[m for k,m in newm.items() if k not in oldm]
expect={2:1,5:1,6:1,7:2,8:6,9:1,10:7,11:8}
assert len(added)==13
counts=collections.defaultdict(collections.Counter);delta=collections.Counter()
for m in newm.values():
 if m['courseId']==course and m['kind'] in ('story','reserve'):
  for q in m['questions']:counts[m['week']][q['category']]+=1
for m in added:
 assert m['courseId']==course and m['kind']=='reserve'
 o=oldm[m['legacyMaterialId']];assert o['courseId']!=course
 for q in m['questions']:
  oq=next(q0 for q0 in o['questions'] if q0['id']==q['legacyQuestionId'])
  for k in ('prompt','options','answer','type'):assert q[k]==oq[k],(q['id'],k)
  assert q['category']==('math' if m['week'] in (6,9) else q['category'])
  delta[m['week']]+=1
assert dict(delta)==expect
assert sum(q['category']=='math' for m in added for q in m['questions'])==2
coverage=[{'week':w,'reading':counts[w]['reading']+counts[w]['literacy'],'math':counts[w]['math']} for w in range(1,13)]
assert all(x['reading']>=10 and x['math']>=3 for x in coverage),coverage
print('D145_STATIC '+json.dumps({'coverage':coverage,'oldMaterialsExact':len(oldm),'diagnosticsExact':True,'added':27},ensure_ascii=False),flush=True)
class H(SimpleHTTPRequestHandler):
 def __init__(self,*args,**kw):super().__init__(*args,directory='/tmp/d-before',**kw)
 def log_message(self,*args):pass
srv=ThreadingHTTPServer(('127.0.0.1',0),H);threading.Thread(target=srv.serve_forever,daemon=True).start()
oldurl=f'http://127.0.0.1:{srv.server_port}/index.html'
pub='https://dsp233.github.io/tianle-fruit-detective/'
def await_public():
 for _ in range(75):
  try:
   with urllib.request.urlopen(pub+'amc8-g1-release.json?d='+str(time.time()),timeout=12) as r:j=json.load(r)
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
def choose(p,d,pos,text,want):
 q=p.evaluate("()=>window.__AMC8_ReadingRuntime.engine().current().question");assert q['id']==f'R2-S{d:02d}-{pos}',q
 # Use prior frozen W1 correct/incorrect ordinal only as behavior transit.
 pick=loc(p,'rdPick');assert pick.count()==len(q['options'])
 def norm(v):return ''.join(v.split())
 matches=[v for v in pick.all() if norm(v.evaluate("e=>{let c=e.cloneNode(true);c.querySelectorAll('.rd-pinyin,[hidden]').forEach(x=>x.remove());return c.textContent.trim()}"))==norm(text)]
 assert len(matches)==1,(text,pick.all_inner_texts())
 matches[0].click();loc(p,'rdSubmit').first.click();ready(p)
 e=ats(p)[-1];assert e['questionId']==q['id'] and e['correct']==want,e
 return e

def current(p):return p.evaluate("()=>window.__AMC8_ReadingRuntime.engine().current()")
def reserve(p,d):
 home(p,pub);loc(p,'rdPlan').first.click();p.locator(f'[data-action=rdFreshDay][data-reserve="true"][data-day="{d}"]:visible').click();ready(p)
 return current(p)
def answer(p,q,correct=True):
 def norm(v):return ''.join(v.split())
 val=q['options'][q['answer'] if correct else (q['answer']+1)%len(q['options'])]
 matches=[v for v in loc(p,'rdPick').all() if norm(v.evaluate("e=>{let c=e.cloneNode(true);c.querySelectorAll('.rd-pinyin,[hidden]').forEach(x=>x.remove());return c.textContent.trim()}"))==norm(val)]
 assert len(matches)==1,(q['id'],val)
 matches[0].click();loc(p,'rdSubmit').first.click();ready(p)
 e=ats(p)[-1];assert e['questionId']==q['id'] and e['correct']==correct,e
 return e
def run(engine):
 x={'engine':engine,'status':'INCOMPLETE','checks':{},'errors':[]}
 with sync_playwright() as pw:
  b=getattr(pw,engine).launch(headless=True,**({'args':['--no-sandbox','--disable-dev-shm-usage']} if engine=='chromium' else {}))
  ctx=b.new_context(viewport={'width':1024,'height':768});p=ctx.new_page();p.set_default_timeout(15000)
  try:
   home(p,oldurl);p.evaluate("()=>window.__AMC8_ReadingRuntime.engine().start(['R-D008-S2'],{day:null,purpose:'practice'})");ready(p)
   legacy=view(p)['snapshot']['events'];assert any(e.get('materialId')=='R-D008-S2' and e['type']=='material_open' for e in legacy)
   storage=ctx.storage_state();ctx.close()
   for o in storage['origins']:o['origin']='https://dsp233.github.io'
   ctx=b.new_context(storage_state=storage,viewport={'width':1024,'height':768});p=ctx.new_page();p.set_default_timeout(15000)
   home(p,pub);assert all(e in view(p)['snapshot']['events'] for e in legacy)
   c=reserve(p,8);assert not c or c['material']['id']!='R2-D008-SUP'
   assert view(p)['report']['readiness'][1]['reading']['total']==0
   x['checks']['legacyExposurePreservedAndExcluded']=True
   ctx.close();ctx=b.new_context(viewport={'width':1024,'height':768});p=ctx.new_page();p.set_default_timeout(15000)
   set_none(p,pub);parent(p,pub);loc(p,'rdSettingsUnlock').first.click();ready(p)
   req=sorted(set(k for m in added for k in m['prerequisites']))
   for k in req:
    v=p.locator('[data-action=rdKnown][data-value='+json.dumps(k,ensure_ascii=False)+']:visible');assert v.count()==1,k;v.first.click();ready(p)
   actual=[]
   for m in sorted(added,key=lambda m:m['day']):
    c=reserve(p,m['day']);assert c['material']['id']==m['id'],(m['id'],c)
    loc(p,'rdReadDone').first.click();ready(p)
    for q in m['questions']:
     assert current(p)['question']['id']==q['id']
     e=answer(p,q);actual.append(e['questionId'])
     loc(p,'rdNext').first.click();ready(p)
   assert len(actual)==27 and len(set(actual))==27
   assert not any(w['ready'] for w in view(p)['report']['readiness'])
   r=view(p)['report'];x['checks']['uniqueActual']=actual;x['checks']['readiness']=r['readiness']
   prior=ats(p);p.reload(wait_until='domcontentloaded');ready(p);assert ats(p)==prior
   x['checks']['refreshExact']=True;x['status']='PASS'
  except Exception as ex:
   x['errors'].append(repr(ex))
   try:p.screenshot(path=str(OUT/f'{engine}-error.png'),full_page=True)
   except Exception:pass
  finally:ctx.close();b.close()
 return x
try:
 await_public()
 target=hashlib.sha256((ROOT/'index.html').read_bytes()).hexdigest()
 with urllib.request.urlopen(pub+'index.html?d='+str(time.time()),timeout=15) as r:assert hashlib.sha256(r.read()).hexdigest()==target
 with concurrent.futures.ThreadPoolExecutor(max_workers=2) as pool:results=list(pool.map(run,['chromium','webkit']))
 (OUT/'d145-independent.json').write_text(json.dumps({'formal':BASE,'coverage':coverage,'results':results},ensure_ascii=False,indent=2))
 for x in results:print('D145_RESULT '+json.dumps(x,ensure_ascii=False),flush=True)
 assert all(x['status']=='PASS' for x in results)
finally:srv.shutdown()
