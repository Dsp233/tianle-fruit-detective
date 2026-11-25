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
report={'browser':a.browser,'status':'NOT_PROVEN','checks':{}}
try:
 with sync_playwright() as pw:
  b=getattr(pw,a.browser).launch(headless=True,**({'args':['--no-sandbox','--disable-dev-shm-usage']} if a.browser=='chromium' else {}))
  ctx=b.new_context(viewport={'width':1024,'height':768});p=ctx.new_page();p.set_default_timeout(12000)
  home(p);base=live_inventory(p);assert len(base['course'])==336 and all(q['status']=='unreviewed' for q in base['course'])
  settings(p);day(p,1);old=choice(p,1,1,False);assert old['metadataStatus']=='unreviewed'
  old_state=state(p);old_events=attempts(old_state);shot(p,'baseline-wrong')
  # Reopen on the candidate at precisely the same origin/storage. No fabricated events.
  root=a.candidate;home(p);new=live_inventory(p);after=state(p)
  assert len(new['course'])==336 and all(q['status']=='reviewed' and q['category'] and q['ability'] and q['errorType'] for q in new['course'])
  assert base['diagnostics']==new['diagnostics'] and base['contentHash']==new['contentHash']
  assert attempts(after)==old_events, (old_events,attempts(after))
  assert after['report']['quarantinedAttempts']==old_state['report']['quarantinedAttempts'],after['report']
  assert any(e['questionId']==old['questionId'] and e['itemTag']=='sentence' for e in after['report']['supportEvidence']['wrongFirst'])
  assert after['report']['supportEvidence']['causeConfirmed'] is False
  assert not any(w['ready'] for w in after['report']['readiness'])
  report['checks']['history']={'oldAttemptExact':True,'classificationProjection':True,'unearnedReady':False}
  recommendation=after['report']['recommendation'];assert recommendation['errorType']=='sentence' and recommendation['materialId']!='R2-D001-CORE',recommendation
  matched=next(m for m in new['materials'] if m['id']==recommendation['materialId'])
  assert recommendation['materialId'].endswith('-CORE')
  parent(p);shot(p,'parent')
  # Actual targeted practice entry, where available.
  rem=loc(p,'rdRemediate')
  if not rem.count():home(p);rem=loc(p,'rdRemediate')
  assert rem.count()>0,'missing remediation UI';rem.first.click();ready(p)
  current=p.evaluate("()=>window.__AMC8_ReadingRuntime.engine().current().material.id")
  assert current==recommendation['materialId'],(current,recommendation);shot(p,'targeted')
  report['checks']['remediation']={'match':recommendation,'opened':current}
  # Use a fresh profile so the prerequisite condition is not contaminated.
  ctx.close();ctx=b.new_context(viewport={'width':1024,'height':768});p=ctx.new_page();p.set_default_timeout(12000)
  settings(p);day(p,3);no=choice(p,3,1,True);assert no['category']=='math' and not no['prerequisitesConfirmed'],no
  assert not any(w['ready'] for w in state(p)['report']['readiness'])
  ctx.close();ctx=b.new_context(viewport={'width':1024,'height':768});p=ctx.new_page();p.set_default_timeout(12000)
  settings(p,'普通课程：整数减法与数量比较');day(p,3);yes=choice(p,3,1,True)
  assert yes['category']=='math' and yes['ability']=='model' and yes['prerequisitesConfirmed'],yes
  report['checks']['prerequisite']={'unconfirmed':no,'confirmed':yes}
  rd=state(p)['report']['readiness'];assert not any(w['ready'] for w in rd)
  assert rd[0]['samples']>=1 and rd[1].get('evaluable') is False
  report['checks']['readiness']=rd
  parent(p);shot(p,'math-readiness')
  # Reload actual browser profile and ensure newly classified attempt unchanged.
  before=attempts(state(p));p.reload(wait_until='domcontentloaded');ready(p);assert attempts(state(p))==before
  report['checks']['reload']=True
  ctx.close();b.close();report['status']='PASS'
finally:
 (a.out/f'receipt-{a.browser}.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
 print('C142 '+json.dumps({'browser':a.browser,'status':report['status'],'checks':list(report['checks'])},ensure_ascii=False),flush=True)
 srv.shutdown()
