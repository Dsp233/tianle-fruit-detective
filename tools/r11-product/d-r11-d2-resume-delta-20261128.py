"""Only missing close/reopen and read exception clauses. Continue from actual next contrast."""
import time
from pathlib import Path
exec(Path("tools/r11-product/d-v3-public-natural-only-20261128.py").read_text().split("# Only uncovered public widths")[0])
KEY='tianle_amc8_question_design_v1'
x={'engine':ENGINE,'checks':{},'errors':[]}
frozen={'id':'RTM-2013-04-CONTRAST','prompt':'8人原计划均摊餐费，1人忘钱，其余7人代付后算出缺付者原来的一份为17.5美元。就直接报总账单17.5，漏了什么？','givenText':'','options':['这是8份中的1份','没有漏','应除8'],'answer':'这是8份中的1份','derivation':'17.5 is one of eight equal shares; whole bill 8*17.5=140.'}
def resume(p):
 ready_profile(p)
 if not p.locator('[data-rtm-task]').is_visible():loc(p,'rtmConnectedResume').first.click();ready(p)
 wait_task(p)
def ev(p):return state_report(p)['eventsById']
def raw(p):return p.evaluate("k=>localStorage.getItem(k)",KEY)
def inspect_second(q):
 q.goto(URL,wait_until='domcontentloaded')
 q.wait_for_function("typeof progressStore!=='undefined'&&['read_only','ready','conflict'].includes(progressStore.getStatus())",timeout=45000)
 return {'status':q.evaluate("progressStore.getStatus()"),'active':active(q),'text':q.locator('#app').inner_text()[:2000]}
def identity(p):
 h=hashlib.sha256(p.request.get(PUB+'index.html?d2='+str(time.time_ns())).body()).hexdigest()
 assert h==hashlib.sha256((ROOT/'index.html').read_bytes()).hexdigest()
 return h
def tab(b,st):
 ctx=b.new_context(storage_state=st,viewport={'width':1024,'height':768},accept_downloads=True)
 p=ctx.new_page();p.set_default_timeout(20000)
 resume(p);a=active(p);base=ev(p);before=raw(p)
 assert a['id']==frozen['id'] and fingerprint(p,frozen) and a['submissionOrdinal']==0
 q=ctx.new_page();first=inspect_second(q);q.close()
 q=ctx.new_page();second=inspect_second(q);second['shot']=snap(q,'reopened-second')
 x['checks']['reopen']={'first':first,'second':second,'rawUnchanged':raw(p)==before,'eventsRetained':retained(base,ev(p))}
 assert second['status']=='read_only' and second['active']['attemptId']==a['attemptId'] and raw(p)==before
 p.bring_to_front();post=submit_label(p,frozen,frozen['answer']);events=ev(p)
 x['checks']['writer']={'after':post,'newEvents':[v for k,v in events.items() if k not in base],'oldEventsExact':retained(base,events),'shot':snap(p,'writer')}
 assert post['feedback']['outcome']=='VERIFIED' and retained(base,events)
 q.close();q=ctx.new_page();third=inspect_second(q)
 x['checks']['reopenAfterWrite']={'view':third,'shot':snap(q,'reopened-after-write'),'writerEventsExact':retained(events,ev(p))}
 assert third['active']['attemptId']==a['attemptId'] and third['active']['submissionOrdinal']==1 and retained(events,ev(q))
 q.close()
 if next_task(p):x['checks']['nextActual']={'active':active(p),'shot':snap(p,'next')}
 math_home(p);ctx.storage_state(path=str(OUT/'d2-resume-storage.json'));ctx.close()
def read_error(b,st):
 ctx=b.new_context(storage_state=st,viewport={'width':1024,'height':768})
 p=ctx.new_page();p.set_default_timeout(20000)
 resume(p);base=ev(p);before=raw(p);a=active(p)
 p.add_init_script("""k=>{if(!sessionStorage.getItem('__d2ReadOnce')){sessionStorage.setItem('__d2ReadOnce','1');let get=Storage.prototype.getItem;Storage.prototype.getItem=function(n){if(n===k){window.__d2ReadHits=(window.__d2ReadHits||0)+1;throw new DOMException('controlled read exception','SecurityError')}return get.call(this,n)}}}""".replace("k=>","("+ "k=>" ,1)+")("+json.dumps(KEY)+")")
 p.reload(wait_until='domcontentloaded')
 p.wait_for_timeout(1500)
 hit=p.evaluate("window.__d2ReadHits||0")
 x['checks']['readFailure']={'hits':hit,'status':p.evaluate("typeof progressStore==='undefined'?'unavailable':progressStore.getStatus()"),'text':p.locator('body').inner_text()[:2500],'shot':snap(p,'read-failure')}
 assert hit>0
 p.reload(wait_until='domcontentloaded');ready(p)
 x['checks']['readRecovery']={'sameAttempt':active(p)['attemptId']==a['attemptId'],'oldEventsExact':retained(base,ev(p)),'rawUnchanged':raw(p)==before,'shot':snap(p,'read-recovery')}
 assert x['checks']['readRecovery']['sameAttempt'] and x['checks']['readRecovery']['oldEventsExact']
 ctx.close()
try:
 with sync_playwright() as pw:
  b=getattr(pw,ENGINE).launch(headless=True,**({'args':['--no-sandbox','--disable-shm-usage']} if ENGINE=='chromium' else {}))
  st=json.loads(next(Path('/tmp/d-latest').rglob('d2-natural-continuation-storage.json')).read_text())
  c=b.new_context();p=c.new_page();x['identityBefore']=identity(p);c.close()
  for f in [tab,read_error]:
   try:f(b,st);x['checks'][f.__name__+'Result']='OBSERVED'
   except Exception as e:x['errors'].append(f.__name__+': '+repr(e))
  c=b.new_context();p=c.new_page();x['identityAfter']=identity(p);c.close();b.close()
finally:
 srv.shutdown()
 (OUT/'d2-resume-delta.json').write_text(json.dumps(x,ensure_ascii=False,indent=2))
 print('D2_RESUME '+json.dumps({'engine':ENGINE,'checks':list(x['checks']),'errors':x['errors']},ensure_ascii=False),flush=True)
