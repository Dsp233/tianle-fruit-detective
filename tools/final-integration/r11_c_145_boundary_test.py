"""Bounded C #142 browser regression, not a new independent W1 or W2 grade."""
import argparse,json,threading,sys,traceback
from pathlib import Path
from http.server import SimpleHTTPRequestHandler,ThreadingHTTPServer
from playwright.sync_api import sync_playwright
p=argparse.ArgumentParser()
for k in ('base','candidate','out'):p.add_argument('--'+k,type=Path,required=True)
p.add_argument('--browser',required=True);a=p.parse_args();a.out.mkdir(parents=True,exist_ok=True)
root=a.base
class H(SimpleHTTPRequestHandler):
 def __init__(self,*args,**kw):super().__init__(*args,directory=str(root),**kw)
 def log_message(self,*args):pass
 def end_headers(self):self.send_header('Cache-Control','no-store');super().end_headers()
srv=ThreadingHTTPServer(('127.0.0.1',0),H);threading.Thread(target=srv.serve_forever,daemon=True).start()
url=f'http://127.0.0.1:{srv.server_port}/index.html'
def loc(p,act):return p.locator(f'#app [data-action={act}]:visible')
def ready(p):p.wait_for_function("window.__AMC8_ReadingRuntime&&window.__AMC8_ReadingRuntime.engine().status().status==='ready'",timeout=45000)
def state(p):return p.evaluate("()=>{let r=window.__AMC8_ReadingRuntime;return {snapshot:r.snapshot(),report:r.report()}}")
def attempts(s):return [e for e in s['snapshot']['events'] if e['type']=='attempt']
def shot(p,name):p.screenshot(path=str(a.out/f'{a.browser}-{name}.png'),full_page=True)
def clean(x):return x.evaluate("""e=>{let c=e.cloneNode(true);c.querySelectorAll('.rd-pinyin,[hidden]').forEach(x=>x.remove());return c.textContent.trim()}""")
def home(p):
 p.goto(url,wait_until='domcontentloaded')
 p.wait_for_function("Boolean(document.querySelector('[data-home-hub]')||window.__AMC8_ReadingRuntime||window.__AMC8_MATH_NAV)",timeout=45000)
 if not loc(p,'rdPlan').count():
  if loc(p,'rdHome').count():loc(p,'rdHome').first.click()
  else:
   b=p.locator('[data-action=reading]:visible')
   if b.count():b.first.click()
   else:
    b=p.get_by_role('button',name='阅读训练',exact=True)
    if not b.count():b=p.get_by_role('button',name='进入中文阅读',exact=False)
    b.first.click()
  ready(p)
  if not loc(p,'rdPlan').count() and loc(p,'rdHome').count():loc(p,'rdHome').first.click()
 ready(p);loc(p,'rdPlan').first.wait_for(timeout=12000)
def day(p,d):
 home(p);loc(p,'rdPlan').first.click();p.locator(f'[data-action=rdStart][data-day="{d}"]:visible').click();ready(p)
 loc(p,'rdReadDone').first.click();ready(p)
def choice(p,d,n,correct):
 q=p.evaluate("()=>window.__AMC8_ReadingRuntime.engine().current().question")
 assert q['id']==f'R2-S{d:02d}-{n}' and q['type']=='choice',q['id']
 # Existing answer used only to exercise positive/negative UI, not regrade W1.
 idx=q['answer'] if correct else next(i for i in range(len(q['options'])) if i!=q['answer'])
 v=q['options'][idx];hits=[x for x in loc(p,'rdPick').all() if clean(x)==v];assert len(hits)==1
 hits[0].click();loc(p,'rdSubmit').first.click();ready(p)
 e=attempts(state(p))[-1];assert e['questionId']==q['id'] and e['correct']==correct,e
 return e
def parent(p):
 home(p);loc(p,'rdParent').last.click();p.locator('.rd-parent').wait_for();ready(p)
def settings(p,prereq=None):
 parent(p);loc(p,'rdSettingsUnlock').first.click();ready(p)
 none=p.locator('[data-action=rdSetMode][data-mode=none]:visible')
 if none.count():none.first.click();ready(p)
 if prereq:
  b=p.locator('[data-action=rdKnown]:visible').filter(has_text=prereq)
  if not b.count():b=p.locator(f'[data-action=rdKnown][data-value="{prereq}"]:visible')
  assert b.count()==1,(prereq,loc(p,'rdKnown').all_inner_texts());b.first.click();ready(p)
def live_inventory(p):
 return p.evaluate("""()=>{const d=window.__AMC8_ReadingRuntime.engine().data,ms=d.materials.filter(m=>m.courseId===d.courseScope.activeCourseId);return {course:ms.flatMap(m=>m.questions).map(q=>({id:q.id,category:q.category,ability:q.ability,errorType:q.errorType,status:q.metadataStatus})),diagnostics:d.diagnostics,contentHash:d.contentHash,materials:ms.map(m=>({id:m.id,prerequisites:m.prerequisites,status:m.prerequisitesStatus}))}}""")


report={'browser':a.browser,'checks':{},'status':'NOT_PROVEN'}
root=a.base
def current(p):return p.evaluate("()=>window.__AMC8_ReadingRuntime.engine().current()")
def reserve(p,d):
 home(p);loc(p,'rdPlan').first.click();p.locator(f'[data-action=rdFreshDay][data-reserve="true"][data-day="{d}"]:visible').click();ready(p)
 return current(p)
def go_next(p):
 b=loc(p,'rdNext');assert b.count()==1;b.first.click();ready(p)
def choose_core(p,q):
 def clean(x):return x.evaluate("""e=>{let c=e.cloneNode(true);c.querySelectorAll('.rd-pinyin,[hidden]').forEach(x=>x.remove());return c.textContent.trim()}""")
 if q['type']=='choice':
  val=q['options'][q['answer']];hits=[x for x in loc(p,'rdPick').all() if clean(x)==val];assert len(hits)==1
  hits[0].click()
 elif q['type']=='order':
  for n in q['answer']:
   val=q['options'][n];hits=[x for x in loc(p,'rdPick').all() if clean(x)==val];assert len(hits)==1;hits[0].click()
 else:raise AssertionError(('unsupported transit',q['id'],q['type']))
 loc(p,'rdSubmit').first.click();ready(p)
 e=attempts(state(p))[-1];assert e['questionId']==q['id'] and e['correct'],e
 return e
def threshold(p,w):return state(p)['report']['readiness'][w-1]
try:
 with sync_playwright() as pw:
  b=getattr(pw,a.browser).launch(headless=True,**({'args':['--no-sandbox','--disable-dev-shm-usage']} if a.browser=='chromium' else {}))
  ctx=b.new_context(viewport={'width':1024,'height':768});p=ctx.new_page();p.set_default_timeout(15000)
  # Actual legacy material-open on the predecessor in a synthetic browser; no production records.
  home(p);p.evaluate("()=>window.__AMC8_ReadingRuntime.engine().start(['R-D008-S2'],{day:null,purpose:'practice'})");ready(p)
  legacy=state(p)['snapshot']['events'];assert any(e.get('materialId')=='R-D008-S2' and e['type']=='material_open' for e in legacy)
  root=a.candidate;home(p);assert all(e in state(p)['snapshot']['events'] for e in legacy)
  prior=attempts(state(p));c=reserve(p,8);assert not c or c['material']['id']!='R2-D008-SUP'
  assert attempts(state(p))==prior and threshold(p,2)['reading']['total']==0
  report['checks']['legacyExposureExcluded']=True
  ctx.close();ctx=b.new_context(viewport={'width':1024,'height':768});p=ctx.new_page();p.set_default_timeout(15000)
  # Use existing W2 selected core identities only to transit to a positive
  # readiness boundary; never award new content or correctness credit.
  p.clock.set_fixed_time(1795572000000)
  settings(p);parent(p);loc(p,'rdSettingsUnlock').first.click();ready(p)
  req=p.evaluate("()=>{const d=window.__AMC8_ReadingRuntime.engine().data;return [...new Set(d.materials.filter(m=>m.courseId===d.courseScope.activeCourseId&&m.week===2&&m.kind==='story').flatMap(m=>m.prerequisites))]}")
  for k in req:
   v=p.locator('[data-action=rdKnown][data-value='+json.dumps(k,ensure_ascii=False)+']:visible');assert v.count()==1,k;v.first.click();ready(p)
  before=threshold(p,2);assert not before['ready']
  for d in range(8,15):
   if d==12:p.clock.set_fixed_time(1795658400000)
   day(p,d)
   for n in range(3):
    q=current(p)['question'];assert q['id']==f'R2-S{d:02d}-{n+1}'
    choose_core(p,q);go_next(p)
  pre=threshold(p,2)
  assert pre['reading']['total']==9 and pre['extraction']['total']>=3 and pre['dates']>=2 and not pre['ready'],pre
  c=reserve(p,8);assert c['material']['id']=='R2-D008-SUP'
  loc(p,'rdReadDone').first.click();ready(p);q=current(p)['question'];assert q['id']=='R2-D008-SUP-Q1';choose_core(p,q);go_next(p)
  post=threshold(p,2)
  assert post['reading']['total']==10 and post['extraction']['total']>=3 and post['dates']>=2 and post['ready'],post
  report['checks']['positiveBoundary']={'before':pre,'after':post}
  ev=attempts(state(p));p.reload(wait_until='domcontentloaded');ready(p);assert attempts(state(p))==ev
  report['checks']['reload']=True;report['status']='PASS';ctx.close();b.close()
finally:
 (a.out/f'c145-boundary-{a.browser}.json').write_text(json.dumps(report,ensure_ascii=False,indent=2))
 print('C145_BOUNDARY '+json.dumps(report,ensure_ascii=False),flush=True)
 srv.shutdown()
