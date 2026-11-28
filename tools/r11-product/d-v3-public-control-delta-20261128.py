#!/usr/bin/env python3
"""R1.1 D V3 controls only: no repeated math/reading grades; isolated normal UI."""
import json,subprocess,functools,threading,hashlib,os,time
from pathlib import Path
from http.server import SimpleHTTPRequestHandler,ThreadingHTTPServer
from playwright.sync_api import sync_playwright
ROOT=Path(os.environ['D_PRODUCT']);OUT=ROOT/'r11-probe-output';OUT.mkdir(exist_ok=True)
BASE='fcef9785308363379b028129871c92700e1f93d4'
assert (ROOT/'index.html').read_bytes()==subprocess.check_output(['git','show',BASE+':index.html'],cwd=ROOT)
class H(SimpleHTTPRequestHandler):
 def log_message(self,*a):pass
srv=ThreadingHTTPServer(('127.0.0.1',0),functools.partial(H,directory=str(ROOT)));threading.Thread(target=srv.serve_forever,daemon=True).start()
url='https://dsp233.github.io/tianle-fruit-detective/'
def clean(loc):
 return loc.evaluate("""e=>{let c=e.cloneNode(true);c.querySelectorAll('.rd-pinyin,[hidden]').forEach(x=>x.remove());return c.textContent.trim()}""")
def read_ready(page):
 page.wait_for_function("window.__AMC8_ReadingRuntime && window.__AMC8_ReadingRuntime.engine().status().status==='ready'",timeout=45000)
def action(page,name):return page.locator(f'[data-action={name}]:visible')
def attempts(page):return page.evaluate("()=>window.__AMC8_ReadingRuntime.snapshot().events.filter(e=>e.type==='attempt')")
def control_state(loc):
 return loc.evaluate_all("""xs=>xs.map(e=>({text:e.innerText,plain:(()=>{let c=e.cloneNode(true);c.querySelectorAll('.rd-pinyin,[hidden]').forEach(x=>x.remove());return c.textContent.trim()})(),pressed:e.getAttribute('aria-pressed'),selected:e.getAttribute('aria-selected'),className:e.className,disabled:!!e.disabled}))""")
def choice_state(loc):
 return [{k:v for k,v in x.items() if k!='text'} for x in control_state(loc)]
def snap(page,tag,row):
 shot=OUT/(row['case']+'-'+tag+'.png');page.screenshot(path=str(shot),full_page=True)
 return hashlib.sha256(shot.read_bytes()).hexdigest()
def run(browser,case,day=None):
 row={'case':case,'status':'PARTIAL','errors':[]}
 c=browser.new_context(viewport={'width':1024,'height':768},has_touch=True);page=c.new_page();page.set_default_timeout(60000);page.on('pageerror',lambda e:row['errors'].append(str(e)))
 try:
  response=page.request.get(url+'index.html?d-r11-remote=20261128',headers={'Cache-Control':'no-cache'});assert response.ok and hashlib.sha256(response.body()).hexdigest()==hashlib.sha256((ROOT/'index.html').read_bytes()).hexdigest();row['publicSHA']=hashlib.sha256(response.body()).hexdigest();page.goto(url,wait_until='domcontentloaded');page.locator('[data-home-hub]').wait_for()
  if case=='F21':
   page.locator('[data-home-hub] [data-action=home]').click()
   page.wait_for_function("Boolean(window.__AMC8_MATH_NAV)&&typeof progressStore!=='undefined'&&progressStore.getStatus()==='ready'",timeout=45000)
   gate=action(page,'topicParentUnlock').first
   topic=action(page,'topicSelect').first
   storage=lambda:page.evaluate("()=>JSON.stringify(Object.entries(localStorage).sort())")
   before=storage();row['lockedGate']=clean(gate);row['lockedBefore']=choice_state(action(page,'topicSelect'))
   row['lockedEffectiveDisabled']=topic.is_disabled()
   try:topic.click(timeout=800);row['lockedClickReturned']=True
   except Exception as e:row['lockedClickReturned']=False;row['lockedClickError']=repr(e)
   page.wait_for_timeout(250)
   row['lockedAfter']=choice_state(action(page,'topicSelect'));row['lockedStorageUnchanged']=storage()==before;row['lockedScreenshot']=snap(page,'locked-attempt',row)
   row['lockedBlocked']=row['lockedBefore']==row['lockedAfter'] and row['lockedStorageUnchanged']
   gate.click();page.wait_for_timeout(250);row['unlockGate']=clean(gate)
   assert '锁定选题设置' in row['unlockGate']
   beforeSelection=choice_state(action(page,'topicSelect'));topic.click();page.wait_for_timeout(300)
   row['afterAuthorizedSelect']=choice_state(action(page,'topicSelect'))
   row['authorizedChange']=beforeSelection!=row['afterAuthorizedSelect'];row['authorizedScreenshot']=snap(page,'authorized',row)
   gate.click();page.wait_for_timeout(250);row['relockGate']=clean(gate)
   row['relockBefore']=choice_state(action(page,'topicSelect'));before=storage();row['relockEffectiveDisabled']=topic.is_disabled()
   try:topic.click(timeout=800);row['relockClickReturned']=True
   except Exception as e:row['relockClickReturned']=False;row['relockClickError']=repr(e)
   page.wait_for_timeout(250)
   row['relockAfter']=choice_state(action(page,'topicSelect'));row['relockStorageUnchanged']=storage()==before
   row['relockBlocked']=row['relockBefore']==row['relockAfter'] and row['relockStorageUnchanged'];row['relockScreenshot']=snap(page,'relocked',row)
   row['cancelBranch']='NO_SEPARATE_CANCEL_OBSERVED_DIRECT_LOCAL_CONFIRMATION'
   row['status']='OBSERVED_LOCK_UNLOCK_RELOCK' if row['lockedBlocked'] and row['authorizedChange'] and row['relockBlocked'] else 'REVIEW'
   return row
  page.locator('[data-home-hub] [data-action=reading]').click();read_ready(page)
  action(page,'rdPlan').click();page.locator(f'[data-action=rdStart][data-day="{day}"]:visible').click();page.locator('.rd-story-text').first.wait_for()
  row['storyBefore']=clean(page.locator('#app'));row['beforeAttempts']=attempts(page)
  if case=='V01':
   b=action(page,'rdPinyin');assert b.count()==1
   text0=clean(b);b.click();text1=clean(b);b.click();text2=clean(b)
   row['storyToggle']=[text0,text1,text2];row['storyRestored']=text0==text2 and text0!=text1
  done=action(page,'rdReadDone')
  if done.count():done.click()
  page.wait_for_function("Boolean(window.__AMC8_ReadingRuntime.engine().current()?.question?.id)")
  row['questionId']=page.evaluate("()=>window.__AMC8_ReadingRuntime.engine().current().question.id")
  assert row['questionId']==f'R2-S{day:02d}-1',row['questionId']
  submit=action(page,'rdSubmit');assert submit.is_disabled()
  if case=='V01':
   picks=action(page,'rdPick');assert picks.count()>=2;picks.first.click()
   row['choiceBefore']=choice_state(picks);assert not submit.is_disabled()
   b=action(page,'rdPinyin');text0=clean(b);b.click();text1=clean(b);row['choiceAfterHide']=choice_state(picks)
   row['hideScreenshot']=snap(page,'pinyin-hidden',row)
   b.click();text2=clean(b);row['choiceRestored']=choice_state(picks);row['questionToggle']=[text0,text1,text2]
   row['status']='OBSERVED_PRESERVED' if row['storyRestored'] and text0==text2 and text0!=text1 and row['choiceBefore']==row['choiceRestored'] and not submit.is_disabled() else 'REVIEW'
  elif case=='R05':
   picks=action(page,'rdPick');assert picks.count()==3
   row['initial']=control_state(picks)
   # Stable option text: selected options are moved to the sequence head.
   labels=[x['plain'] for x in row['initial']]
   def pick_label(label):
    matches=[x for x in picks.all() if __import__('re').sub(r'^\\d+\\s*·\\s*','',clean(x))==label]
    assert len(matches)==1,(label,control_state(picks))
    matches[0].click()
   pick_label(labels[2]);pick_label(labels[1])
   row['afterTwo']=control_state(picks);assert submit.is_disabled()
   action(page,'rdOrderUndo').click();row['afterUndo']=control_state(picks)
   pick_label(labels[1]);pick_label(labels[0]);row['afterThree']=control_state(picks)
   row['allSelectedSubmitEnabled']=not submit.is_disabled();row['fullScreenshot']=snap(page,'full',row)
   action(page,'rdOrderUndo').click();row['submitDisabledAfterUndo']=submit.is_disabled()
   row['status']='OBSERVED_ORDER_EDIT' if row['allSelectedSubmitEnabled'] and row['submitDisabledAfterUndo'] else 'REVIEW'
  elif case=='R07':
   strips=action(page,'rdWpStrip');assert strips.count()==3
   row['initial']=control_state(strips);strips.first.click();row['first']=choice_state(strips)
   row['firstScreenshot']=snap(page,'first',row)
   strips.last.click();row['changed']=choice_state(strips);row['changedScreenshot']=snap(page,'changed',row)
   strips.first.click();row['restored']=choice_state(strips);row['restoredScreenshot']=snap(page,'restored',row)
   row['status']='OBSERVED_SELECTION_REVERSIBLE' if row['first']!=row['changed'] and row['first']==row['restored'] and not submit.is_disabled() else 'REVIEW'
  elif case=='R08':
   cells=action(page,'rdWpCell');assert cells.count()==12
   row['initial']=control_state(cells);assert all(cells.nth(i).is_disabled() for i in (0,1,4,5,8,9))
   cells.nth(2).click();row['afterPick']=control_state(cells)
   cells.nth(2).click();row['afterToggle']=control_state(cells)
   for i in (3,6,11):cells.nth(i).click()
   row['threeSelected']=control_state(cells);row['selectedScreenshot']=snap(page,'three',row)
   action(page,'rdWpReset').click();row['afterReset']=control_state(cells)
   row['status']='OBSERVED_GRID_EDIT_RESET' if row['afterPick']!=row['initial'] and row['afterToggle']==row['initial'] and row['afterReset']==row['initial'] and submit.is_disabled() else 'REVIEW'
  read_ready(page);row['afterAttempts']=attempts(page);row['noAutoSubmit']=row['beforeAttempts']==row['afterAttempts']
  row['finalScreenshot']=snap(page,'final',row)
  if not row['noAutoSubmit']:row['status']='REVIEW_UNEXPECTED_ATTEMPT'
 except Exception as e:row['error']=repr(e)
 finally:c.close()
 return row

rows=[]
try:
 with sync_playwright() as p:
  engine=os.environ['D_ENGINE'];b=getattr(p,engine).launch(headless=True,**({'args':['--no-sandbox','--disable-dev-shm-usage']} if engine=='chromium' else {}))
  for case,day in [('V01',1),('R05',15),('R07',64),('R08',68)]:
   row=run(b,case,day);rows.append(row);print('D_REMOTE_CONTROL '+json.dumps({k:v for k,v in row.items() if k not in ('storyBefore','beforeAttempts','afterAttempts')},ensure_ascii=False),flush=True)
  b.close()
finally:
 (OUT/'d-v3-public-control-delta.json').write_text(json.dumps({'base':BASE,'scope':'actual public remote control delta; inherited local results not rerun for grade','rows':rows},ensure_ascii=False,indent=2))
 print('D_REMOTE_SUMMARY '+json.dumps([{k:r.get(k) for k in ('case','status','noAutoSubmit','error')} for r in rows],ensure_ascii=False),flush=True);srv.shutdown()
