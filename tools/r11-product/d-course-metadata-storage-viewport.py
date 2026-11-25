"""D original PM-04/05/06/07 and FIX2-LOAD-02 selection/restore delta; no new math credit."""
import json,os,sys,threading,functools,hashlib,subprocess,concurrent.futures,re
from pathlib import Path
from http.server import SimpleHTTPRequestHandler,ThreadingHTTPServer
from playwright.sync_api import sync_playwright
ROOT=Path(os.environ['D_PRODUCT']);OUT=Path('r11-probe-output');OUT.mkdir(exist_ok=True)
assert subprocess.check_output(['git','-C',str(ROOT),'rev-parse','HEAD'],text=True).strip()=='d0c9c3e265a7a76052487d374255fcda35f21117'
D=Path('tools/r11-product')
expected={}
for f in sorted(D.glob('d-bulk-expected-*.json')):
 if f.name.endswith('freeze.json'):continue
 j=json.loads(f.read_text())
 for e in j.get('rows',[]):expected[e['id']]=e
class H(SimpleHTTPRequestHandler):
 def log_message(self,*a):pass
srv=ThreadingHTTPServer(('127.0.0.1',0),functools.partial(H,directory=str(ROOT)));threading.Thread(target=srv.serve_forever,daemon=True).start()
URL=f'http://127.0.0.1:{srv.server_port}/index.html#math'
def ready(p):p.wait_for_function("Boolean(window.__AMC8_MATH_NAV)&&typeof progressStore!=='undefined'&&progressStore.getStatus()==='ready'",timeout=45000)
def loc(p,a):return p.locator(f'#app [data-action={a}]:visible')
def controls(p):
 return p.evaluate("""()=>[...document.querySelectorAll('#app [data-action]')].filter(x=>x.getClientRects().length).map(x=>({action:x.dataset.action,code:x.dataset.code||null,source:x.dataset.source||null,pressed:x.getAttribute('aria-pressed'),text:x.innerText,disabled:x.matches(':disabled')}))""")
def selected(p):return sorted(x['code'] for x in controls(p) if x['action']=='topicSelect' and x['pressed']=='true')
def unlock(p):
 gate=loc(p,'topicParentUnlock').first
 if '确认调整' in gate.inner_text():gate.click();ready(p)
def snap(p,name):
 f=OUT/f'{name}.png';p.screenshot(path=str(f),full_page=True);return dict(file=f.name,sha256=hashlib.sha256(f.read_bytes()).hexdigest())
state="""()=>{let a=ExamMappingUI.exportDraft().record?.sessions?.active;return a?{id:a.id,attemptId:a.attemptId,origin:a.originProblemGroupId,kind:a.kind,ordinal:a.submissionOrdinal,help:a.helpLevel,input:a.input,outcome:a.feedback?.outcome??null}:null}"""
norm=lambda s:re.sub(r'\s+','',s or '')

import collections
sys.path.insert(0,str(ROOT/'tools'))
from g1_reading_packets import config,unpack

KEY='tianle_amc8_question_design_v1'
def inventory():
 d=config((ROOT/'index.html').read_text())['reading']['data'][0]
 j=json.loads(unpack(d,lambda n:(ROOT/n).read_bytes()))
 rows={}
 def walk(o,path=''):
  if isinstance(o,dict):
   id=o.get('id')
   if isinstance(id,str) and re.match(r'R2-(S|M|DRAFT-).+',id) and 'prompt' in o and 'options' in o:rows[id]={'id':id,'path':path,'metadataStatus':o.get('metadataStatus'),'category':o.get('category'),'ability':o.get('ability'),'errorType':o.get('errorType'),'metadata':o.get('metadata'),'keys':sorted(o.keys())}
   for k,v in o.items():walk(v,path+'/'+k)
  elif isinstance(o,list):
   for v in o:walk(v,path+'/*')
 walk(j)
 counts={}
 for typ,rr in [('course',[r for r in rows.values() if not r['id'].startswith('R2-DRAFT-')]),('diagnostic',[r for r in rows.values() if r['id'].startswith('R2-DRAFT-')])]:
  counts[typ]={'n':len(rr),'status':dict(collections.Counter(str(r['metadataStatus']) for r in rr)),'abilityMissing':sum(not r['ability'] for r in rr),'categoryMissing':sum(not r['category'] for r in rr),'metadataKeys':dict(collections.Counter(str(sorted(r['metadata'].keys()) if isinstance(r['metadata'],dict) else None) for r in rr))}
 x={'topKeys':list(j),'counts':counts,'rows':list(rows.values())}
 (OUT/'d-course-metadata-inventory.json').write_text(json.dumps(x,ensure_ascii=False,indent=2));print('D_META '+json.dumps({k:v for k,v in x.items() if k!='rows'},ensure_ascii=False),flush=True)
def init(p):
 p.goto(URL.split('#')[0],wait_until='domcontentloaded')
 p.wait_for_function("Boolean(document.querySelector('[data-home-hub]')||window.__AMC8_MATH_NAV)",timeout=45000)
 hub=p.locator('[data-home-hub] [data-action=home]:visible')
 if hub.count():hub.first.click()
 ready(p)
def store(p):
 return p.evaluate("k=>localStorage.getItem(k)",KEY)
def record(p):
 return p.evaluate("()=>ExamMappingUI.exportDraft().record")
def short(p):
 return p.evaluate("()=>({status:progressStore.getStatus(),text:document.querySelector('#app').innerText.slice(0,1800),controls:[...document.querySelectorAll('#app button')].filter(x=>x.getClientRects().length).map(e=>({a:e.dataset.action,t:e.innerText,d:e.disabled}))})")
def route(p):
 if loc(p,'rtmBack').count():loc(p,'rtmBack').first.click();ready(p)
 if not loc(p,'topicParentUnlock').count():
  z=p.locator('[data-action=hubHome]:visible')
  if z.count():
   z.first.click();p.locator('[data-home-hub] [data-action=home]').click();ready(p)
 assert loc(p,'topicParentUnlock').count()
def run(engine):
 x={'engine':engine,'checks':{},'errors':[]}
 with sync_playwright() as pw:
  b=getattr(pw,engine).launch(headless=True,**({'args':['--no-sandbox','--disable-dev-shm-usage']} if engine=='chromium' else {}))
  s=json.loads(Path('/tmp/d-shared/P-D-storage.json').read_text());s['origins'][0]['origin']=URL.split('/index.html')[0]
  ctx=b.new_context(storage_state=s,viewport={'width':1024,'height':768},accept_downloads=True)
  p=ctx.new_page();p.set_default_timeout(10000)
  try:
   init(p);route(p);r0=record(p);before=store(p);assert before
   # Actual five viewport controls and visible horizontal boundary, not device UAT.
   viewport=[]
   for w in [320,375,768,1024,1180]:
    p.set_viewport_size({'width':w,'height':768});p.wait_for_timeout(150)
    v=p.evaluate("""()=>({width:innerWidth,scroll:document.documentElement.scrollWidth,visible:[...document.querySelectorAll('#app button')].filter(e=>e.getClientRects().length).map(e=>({a:e.dataset.action,r:e.getBoundingClientRect().right,l:e.getBoundingClientRect().left})).filter(e=>e.r>innerWidth+1||e.l< -1)})""")
    v['shot']=snap(p,engine+'-math-'+str(w));viewport.append(v)
   x['checks']['mathWidths']=viewport;p.set_viewport_size({'width':1024,'height':768})
   # Simultaneous second math tab should not silently acquire a competing writer.
   q=ctx.new_page();q.goto(URL,wait_until='domcontentloaded')
   q.wait_for_function("Boolean(window.__AMC8_MATH_NAV)&&typeof progressStore!=='undefined'&&progressStore.getStatus()!=='acquiring'",timeout=45000)
   x['checks']['secondTab']={'status':q.evaluate('progressStore.getStatus()'),'text':q.locator('#app').inner_text()[:1600],'sameRaw':store(q)==before,'shot':snap(q,engine+'-second-tab')}
   q.close();p.bring_to_front()
   # A real parent toggle is a persistence transition; controlled quota failure affects only the main key.
   unlock(p)
   saved=store(p);old=selected(p);target=next(v for v in ['A01','A02','N01','N02','G01','G02','R01','R02'] if v not in old)
   p.evaluate("""k=>{window.__dOriginalSet=Storage.prototype.setItem;Storage.prototype.setItem=function(n,v){if(n===k)throw new DOMException('controlled quota','QuotaExceededError');return window.__dOriginalSet.call(this,n,v)}}""",KEY)
   p.locator(f'[data-action=topicSelect][data-code="{target}"]:visible').click()
   p.wait_for_timeout(350);x['checks']['quota']={'beforeSelection':old,'target':target,'state':short(p),'rawUnchanged':store(p)==saved,'shot':snap(p,engine+'-quota')}
   p.evaluate("()=>{Storage.prototype.setItem=window.__dOriginalSet}")
   retry=p.get_by_role('button',name='重试保存',exact=True)
   if retry.count() and retry.first.is_visible():retry.first.click();p.wait_for_timeout(400)
   x['checks']['quotaRecovery']={'state':short(p),'selection':selected(p),'priorEventsIntact':all(record(p)['eventsById'].get(k)==v for k,v in r0['eventsById'].items()),'shot':snap(p,engine+'-recovered')}
   # Navigate reading by actual visible control.
   p.locator('[data-action=reading]:visible').first.click();p.wait_for_function("window.__AMC8_ReadingRuntime&&window.__AMC8_ReadingRuntime.engine().status().status==='ready'",timeout=45000)
   viewport=[]
   for w in [320,375,768,1024,1180]:
    p.set_viewport_size({'width':w,'height':768});p.wait_for_timeout(150)
    v=p.evaluate("""()=>({width:innerWidth,scroll:document.documentElement.scrollWidth,visible:[...document.querySelectorAll('#app button')].filter(e=>e.getClientRects().length).map(e=>({a:e.dataset.action,r:e.getBoundingClientRect().right,l:e.getBoundingClientRect().left})).filter(e=>e.r>innerWidth+1||e.l< -1)})""");v['shot']=snap(p,engine+'-reading-'+str(w));viewport.append(v)
   x['checks']['readingWidths']=viewport
   x['status']='OBSERVED'
  except Exception as e:x['errors'].append(repr(e));x['status']='PARTIAL';x['shot']=snap(p,engine+'-error')
  finally:ctx.close();b.close()
 return x
try:
 inventory()
 with concurrent.futures.ThreadPoolExecutor(max_workers=2) as pool:rows=list(pool.map(run,['chromium','webkit']))
 (OUT/'d-storage-viewport-delta.json').write_text(json.dumps(rows,ensure_ascii=False,indent=2))
 for x in rows:print('D_STORAGE '+json.dumps(x,ensure_ascii=False),flush=True)
finally:srv.shutdown()
