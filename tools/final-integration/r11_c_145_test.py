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

# Exercise only selected supplemental tasks, using frozen source answers as transit.
report={'browser':a.browser,'status':'NOT_PROVEN','checks':{},'rows':[]}
root=a.candidate
manifest=json.loads((a.out/'course-supply.json').read_text())
selected=manifest['selected'];assert len(selected)==27
byday={}
for q in selected:byday.setdefault(q['day'],[]).append(q)
def open_reserve(p,d):
 home(p);loc(p,'rdPlan').first.click();p.locator(f'[data-action=rdFreshDay][data-reserve="true"][data-day="{d}"]:visible').click();ready(p)
 return p.evaluate("()=>window.__AMC8_ReadingRuntime.engine().current()?.material?.id")
def report_week(p,w):return state(p)['report']['readiness'][w-1]
def click_answer(p,q):
 v=q['options'][q['answer']];hits=[x for x in loc(p,'rdPick').all() if clean(x)==v];assert len(hits)==1,(q['id'],v,loc(p,'rdPick').all_inner_texts())
 hits[0].click();loc(p,'rdSubmit').first.click();ready(p)
def next_step(p):
 n=loc(p,'rdNext');assert n.count()==1;n.first.click();ready(p)
try:
 with sync_playwright() as pw:
  b=getattr(pw,a.browser).launch(headless=True,**({'args':['--no-sandbox','--disable-dev-shm-usage']} if a.browser=='chromium' else {}))
  ctx=b.new_context(viewport={'width':1024,'height':768});p=ctx.new_page();p.set_default_timeout(15000)
  home(p);r=state(p)['report']['readiness'];assert len(r)==12 and not any(w.get('evaluable') is False or w['ready'] for w in r),r
  report['checks']['capacityAndEmpty']={'capacity':manifest['capacity'],'emptyNotReady':True,'thresholds':[w['thresholds'] for w in r]}
  settings(p)
  # Before confirmation: math reserve is not available, no fake evidence.
  prev=attempts(state(p));opened=open_reserve(p,36)
  assert opened!='R2-D036-SUP' and attempts(state(p))==prev
  report['checks']['mathBeforePrerequisites']=True
  parent(p);loc(p,'rdSettingsUnlock').first.click();ready(p)
  required=set(k for q in selected for k in q['prerequisites'])
  for k in sorted(required):
   v=p.locator('[data-action=rdKnown]:visible').filter(has_text=k)
   v=p.locator('[data-action=rdKnown][data-value='+json.dumps(k,ensure_ascii=False)+']:visible')
   assert v.count()==1,(k,loc(p,'rdKnown').all_inner_texts())
   v.first.click();ready(p)
  # Take each supplement once in a clean synthetic learner profile, all dates
  # intentionally equal; actual positive evidence must not grant weekly readiness.
  for d,qs in byday.items():
   before=report_week(p,qs[0]['week'])
   assert open_reserve(p,d)==qs[0]['materialId'],d
   loc(p,'rdReadDone').first.click();ready(p)
   for q in qs:
    actual=p.evaluate("()=>window.__AMC8_ReadingRuntime.engine().current().question")
    assert actual['id']==q['id'] and actual['prompt']==q['prompt'],(q,actual)
    click_answer(p,q);e=attempts(state(p))[-1]
    assert e['questionId']==q['id'] and e['correct'] and e['first'] and not e['priorExposure'],e
    assert e['aidLevel']==0 and (q['category']!='math' or e['prerequisitesConfirmed']),e
    report['rows'].append({'id':q['id'],'attempt':e})
    next_step(p)
   after=report_week(p,qs[0]['week'])
   deltaR=sum(q['category']!='math' for q in qs);deltaM=sum(q['category']=='math' for q in qs)
   assert after['reading']['total']==before['reading']['total']+deltaR and after['extraction']['total']==before['extraction']['total']+deltaM,(d,before,after)
   assert not after['ready'];assert not any(e.get('day')==d and e['type']=='session_complete' for e in state(p)['snapshot']['events']),d
   report['checks'][str(d)]={'readingDelta':deltaR,'mathDelta':deltaM,'noCalendarCompletion':True}
   # Reopening does not create another eligible first answer.
   prior=attempts(state(p));assert open_reserve(p,d)!=qs[0]['materialId'];assert attempts(state(p))==prior
  old=attempts(state(p));p.reload(wait_until='domcontentloaded');ready(p);assert attempts(state(p))==old
  assert len(old)==27 and len({q['questionId'] for q in old})==27
  report['checks']['exactReload']=True;report['status']='PASS';ctx.close();b.close()
finally:
 (a.out/f'c145-{a.browser}.json').write_text(json.dumps(report,ensure_ascii=False,indent=2))
 print('C145 '+json.dumps({'browser':a.browser,'status':report['status'],'rows':len(report['rows']),'checks':list(report['checks'])},ensure_ascii=False),flush=True)
 srv.shutdown()
