"""C #148 targeted browser test using the D2 synthetic nonempty profile."""
import argparse,json,re,threading,traceback
from pathlib import Path
from http.server import SimpleHTTPRequestHandler,ThreadingHTTPServer
from playwright.sync_api import sync_playwright
p=argparse.ArgumentParser()
for k in ('base','candidate','out','fixture'):p.add_argument('--'+k,type=Path,required=True)
p.add_argument('--browser',required=True);a=p.parse_args()
KEY='tianle_amc8_question_design_v1'
BAD=['已提交 0 次','还没有真题或衔接练习的提交记录','当前没有需要回看的未答对尝试','暂无作答记录','已完成 0 次','尚无错误尝试记录']
root=a.candidate
class H(SimpleHTTPRequestHandler):
 def __init__(self,*args,**kw):super().__init__(*args,directory=str(root),**kw)
 def log_message(self,*args):pass
 def end_headers(self):self.send_header('Cache-Control','no-store');super().end_headers()
srv=ThreadingHTTPServer(('127.0.0.1',0),H);threading.Thread(target=srv.serve_forever,daemon=True).start()
origin=f'http://127.0.0.1:{srv.server_port}';url=origin+'/index.html'
profile=json.loads(next(a.fixture.rglob('d2-resume-storage.json')).read_text())
rows=[x for o in profile['origins'] for x in o['localStorage']]
assert sum(x['name']==KEY for x in rows)==1
original=next(x['value'] for x in rows if x['name']==KEY)
events=json.loads(original)['rtm1']['eventsById']
assert events and any(e['type']=='response_submitted' for e in events.values())
profile={'cookies':[],'origins':[{'origin':origin,'localStorage':rows}]}
report={'browser':a.browser,'status':'NOT_PROVEN','checks':{}}
def raw(p):return p.evaluate('k=>localStorage.getItem(k)',KEY)
def shot(p,n):p.screenshot(path=str(a.out/f'{a.browser}-{n}.png'),full_page=True)
def math(p):
 p.goto(url+'#math',wait_until='domcontentloaded')
 p.wait_for_function('Boolean(window.__AMC8_MATH_NAV)',timeout=60000)
 p.evaluate('window.__AMC8_MATH_NAV.progress()')
def ready(p):p.wait_for_function("typeof progressStore!=='undefined'&&progressStore.getStatus()==='ready'",timeout=45000)
def failure(p):
 p.add_init_script("""(k=>{if(!sessionStorage.getItem('__c148ReadOnce')){sessionStorage.setItem('__c148ReadOnce','1');const get=Storage.prototype.getItem;Storage.prototype.getItem=function(n){if(n===k){window.__c148ReadHits=(window.__c148ReadHits||0)+1;throw new DOMException('controlled read exception','SecurityError')}return get.call(this,n)}}})("""+json.dumps(KEY)+")")
def text(p):return p.locator('#app').inner_text()
def unknown(p):
 p.locator('[data-math-history-unavailable]').wait_for(timeout=20000)
 t=text(p);assert '学习记录暂不可用' in t and not any(x in t for x in BAD),t[:2500]
def reading(p):
 p.wait_for_function("Boolean(window.__AMC8_ReadingRuntime)",timeout=60000)
 p.locator('.rd-parent').wait_for(timeout=20000)
def summary(p):
 v=p.locator('.rd-summary > div').filter(has_text='旧路线提交')
 assert v.count()==1
 return v.locator('b').inner_text()
try:
 with sync_playwright() as pw:
  b=getattr(pw,a.browser).launch(headless=True,**({'args':['--no-sandbox','--disable-dev-shm-usage']} if a.browser=='chromium' else {}))
  # Baseline reproduced from the exact nonempty stored profile.
  root=a.base;c=b.new_context(storage_state=profile);q=c.new_page();failure(q);math(q)
  assert q.evaluate('window.__c148ReadHits||0')>0
  baseline=text(q);assert '已提交 0 次' in baseline and any(x in baseline for x in BAD[1:]),baseline[:2000]
  shot(q,'baseline-failure');report['checks']['baselineReproduced']=True;c.close()
  # Candidate normal nonempty and exact same record after refresh.
  root=a.candidate;c=b.new_context(storage_state=profile);q=c.new_page();math(q);ready(q)
  t=text(q);assert re.search(r'已提交 [1-9]\d* 次',t),t[:2500]
  assert raw(q)==original
  report['checks']['normalNonempty']={'events':len(events),'rawExact':True}
  shot(q,'normal-history')
  failure(q);q.reload(wait_until='domcontentloaded');q.wait_for_function('Boolean(window.__AMC8_MATH_NAV)',timeout=60000)
  q.evaluate('window.__AMC8_MATH_NAV.progress()');unknown(q)
  assert q.evaluate('window.__c148ReadHits||0')>0
  shot(q,'failure-progress')
  q.evaluate("open('competitionRecords')");unknown(q);shot(q,'failure-competition')
  q.evaluate("ExamMappingUI.handle('rtmHistory',{})");unknown(q);shot(q,'failure-rtm')
  q.evaluate("ReadingUI.handle('rdParent',{})");reading(q);assert summary(q)=='暂不可用'
  shot(q,'failure-warm-reading-parent')
  q.reload(wait_until='domcontentloaded');math(q);ready(q)
  assert raw(q)==original and re.search(r'已提交 [1-9]\d* 次',text(q))
  shot(q,'recovered-history');report['checks']['failureRecovery']={'fourAffectedViews':True,'rawExact':True,'oldEventsExact':json.loads(raw(q))['rtm1']['eventsById']==events};c.close()
  # Cold reading parent must not conflate inability to read math with an empty math history.
  c=b.new_context(storage_state=profile);q=c.new_page();failure(q);q.goto(url+'#reading-parent',wait_until='domcontentloaded');reading(q)
  assert q.evaluate('window.__c148ReadHits||0')>0 and summary(q)=='暂不可用'
  shot(q,'failure-cold-reading-parent');q.reload(wait_until='domcontentloaded');reading(q)
  assert summary(q)==str(len(json.loads(original).get('attempts',[]))) and raw(q)==original
  report['checks']['coldReadingSummary']={'unavailableThenExact':True};c.close()
  # Truly empty readable profile must still show real zero.
  c=b.new_context();q=c.new_page();math(q);ready(q)
  assert '已提交 0 次' in text(q) and not q.locator('[data-math-history-unavailable]').count()
  report['checks']['trueEmpty']=True;shot(q,'true-empty');c.close();b.close()
  report['status']='PASS'
except Exception:
 report['error']=traceback.format_exc();raise
finally:
 (a.out/f'c148-{a.browser}.json').write_text(json.dumps(report,ensure_ascii=False,indent=2))
 print('C148 '+json.dumps(report,ensure_ascii=False),flush=True);srv.shutdown()
