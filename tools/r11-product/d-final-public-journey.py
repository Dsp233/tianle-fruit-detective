"""D independent public entry/return delta; previously frozen answers transit only."""
import hashlib,json,re,time,traceback,concurrent.futures,os
from pathlib import Path
from playwright.sync_api import sync_playwright
OUT=Path('r11-probe-output');OUT.mkdir(exist_ok=True)
BASE='6e5de89a8313d64b7aeef2efb1955501afe2829d'
ROOT=Path(os.environ['D_PRODUCT'])
PUB='https://dsp233.github.io/tianle-fruit-detective/'
URL=PUB+'index.html#math'
def math_ready(p):
 p.wait_for_function("Boolean(window.__AMC8_MATH_NAV) && typeof progressStore!=='undefined' && progressStore.getStatus()==='ready'",timeout=60000)
def page(ctx):
 p=ctx.new_page();p.set_default_timeout(15000);p.goto(URL,wait_until='domcontentloaded');math_ready(p);return p
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


def loc(p,k):return p.locator(f'#app [data-action={k}]:visible')
def rdready(p):p.wait_for_function("window.__AMC8_ReadingRuntime&&window.__AMC8_ReadingRuntime.engine().status().status==='ready'",timeout=50000)
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
  rdready(p)
  if not loc(p,'rdPlan').count() and loc(p,'rdHome').count():loc(p,'rdHome').first.click()
 rdready(p);loc(p,'rdPlan').first.wait_for(timeout=15000)
def parent(p,url):
 home(p,url);loc(p,'rdParent').last.click();p.locator('.rd-parent').wait_for();rdready(p)
def set_none(p,url):
 parent(p,url);loc(p,'rdSettingsUnlock').first.click();rdready(p)
 p.locator('[data-action=rdSetMode][data-mode=none]:visible').first.click();rdready(p)
def start(p,url,d):
 home(p,url);loc(p,'rdPlan').first.click();p.locator(f'[data-action=rdStart][data-day="{d}"]:visible').click();rdready(p);loc(p,'rdReadDone').first.click();rdready(p)
def choose(p,d,pos,text,want):
 q=p.evaluate("()=>window.__AMC8_ReadingRuntime.engine().current().question");assert q['id']==f'R2-S{d:02d}-{pos}',q
 # Use prior frozen W1 correct/incorrect ordinal only as behavior transit.
 pick=loc(p,'rdPick');assert pick.count()==len(q['options'])
 def norm(v):return ''.join(v.split())
 matches=[v for v in pick.all() if norm(v.evaluate("e=>{let c=e.cloneNode(true);c.querySelectorAll('.rd-pinyin,[hidden]').forEach(x=>x.remove());return c.textContent.trim()}"))==norm(text)]
 assert len(matches)==1,(text,pick.all_inner_texts())
 matches[0].click();loc(p,'rdSubmit').first.click();rdready(p)
 e=ats(p)[-1];assert e['questionId']==q['id'] and e['correct']==want,e
 return e

def one(engine,route):
 out={'engine':engine,'route':route,'base':BASE,'checks':{},'errors':[]}
 label=engine+'-'+('amc8' if route else 'root')
 with sync_playwright() as pw:
  b=getattr(pw,engine).launch(headless=True,**({'args':['--no-sandbox','--disable-dev-shm-usage']} if engine=='chromium' else {}))
  ctx=b.new_context(viewport={'width':1024,'height':768})
  p=ctx.new_page();p.set_default_timeout(15000)
  out['pageErrors']=[];out['httpErrors']=[]
  p.on('pageerror',lambda e:out['pageErrors'].append(str(e)))
  p.on('response',lambda r:out['httpErrors'].append({'status':r.status,'url':r.url}) if r.status>=400 and r.url.startswith(PUB) else None)
  try:
   entry=PUB+route
   expected=hashlib.sha256((ROOT/(route+'index.html')).read_bytes()).hexdigest()
   h=p.request.get(entry+'index.html?d='+str(time.time_ns()),headers={'Cache-Control':'no-cache'})
   assert h.ok and hashlib.sha256(h.body()).hexdigest()==expected
   out['checks']['identity']={'sha256':expected,'url':h.url}
   start_time=time.monotonic();p.goto(entry+'index.html',wait_until='domcontentloaded')
   p.wait_for_function("Boolean(document.querySelector('[data-home-hub]'))",timeout=45000)
   p.locator('[data-home-hub] [data-action=home]').click();math_ready(p)
   out['checks']['coldReadySeconds']=round(time.monotonic()-start_time,3)
   select_decision(p)
   pre=p.evaluate(events)
   a=submit(p,'3+2','VERIFIED')
   m=p.evaluate(events);assert len(m)==len(pre)+1
   out['checks']['math']={'attempt':a,'eventId':m[-1]['eventId']}
   p.screenshot(path=str(OUT/(label+'-math.png')),full_page=True)
   # Actual visible module switch, not a synthetic state assignment.
   loc(p,'reading').first.click();rdready(p)
   if not loc(p,'rdPlan').count() and loc(p,'rdHome').count():loc(p,'rdHome').first.click()
   rdready(p);loc(p,'rdPlan').first.click()
   p.locator('[data-action=rdStart][data-day="3"]:visible').click();rdready(p)
   loc(p,'rdReadDone').first.click();rdready(p)
   read=choose(p,3,1,'甲盆多长了 1 厘米。',True)
   rr=ats(p);out['checks']['reading']={'questionId':read['questionId'],'correct':read['correct'],'category':read['category'],'aidLevel':read['aidLevel']}
   p.screenshot(path=str(OUT/(label+'-reading.png')),full_page=True)
   # Return through ordinary navigation/reload; both exact event lists must survive.
   p.goto(entry+'index.html#math',wait_until='domcontentloaded');math_ready(p)
   assert p.evaluate(events)==m
   home(p,entry);assert ats(p)==rr
   p.reload(wait_until='domcontentloaded');rdready(p);assert ats(p)==rr
   out['checks']['crossReturn']={'mathEventExact':True,'readingEventExact':True,'reloadExact':True}
   assert not out['pageErrors'] and not out['httpErrors'],(out['pageErrors'],out['httpErrors'])
   out['status']='PASS'
  except Exception as ex:
   out['status']='PARTIAL';out['errors'].append(repr(ex))
   try:out['visible']=p.locator('#app').inner_text()[:1300];p.screenshot(path=str(OUT/(label+'-error.png')),full_page=True)
   except:pass
  finally:ctx.close();b.close()
 return out
with concurrent.futures.ThreadPoolExecutor(max_workers=2) as pool:
 rows=list(pool.map(lambda spec:one(*spec),[('chromium',''),('webkit','amc8/')]))
(OUT/'d-final-public-journey.json').write_text(json.dumps(rows,ensure_ascii=False,indent=2))
for row in rows:print('D_PUBLIC_JOURNEY '+json.dumps(row,ensure_ascii=False),flush=True)
assert all(r['status']=='PASS' for r in rows)
