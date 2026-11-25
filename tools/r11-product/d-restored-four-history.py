"""Continue four observed synthetic profiles; no math regrade; history/return/auto supply only."""
import json,hashlib,concurrent.futures,re
from pathlib import Path
from playwright.sync_api import sync_playwright
OUT=Path('r11-probe-output');OUT.mkdir(exist_ok=True)
PUB='https://dsp233.github.io/tianle-fruit-detective/'
PRIOR=Path('/tmp/d-restored')
def one(name):
 r={'profile':name,'checks':{},'errors':[]}
 with sync_playwright() as pw:
  b=pw.chromium.launch(headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
  s=json.loads((PRIOR/f'{name}-storage.json').read_text())
  for o in s['origins']:o['origin']='https://dsp233.github.io'
  ctx=b.new_context(storage_state=s,viewport={'width':1024,'height':768},accept_downloads=True)
  p=ctx.new_page();p.set_default_timeout(10000)
  def ready():p.wait_for_function("typeof progressStore!=='undefined'&&progressStore.getStatus()==='ready'",timeout=45000)
  def loc(a):return p.locator(f'[data-action={a}]:visible')
  def controls():return p.locator('#app button:visible').evaluate_all("xs=>xs.map(e=>({action:e.dataset.action,text:e.innerText,disabled:e.disabled}))")
  def record():return p.evaluate("()=>ExamMappingUI.exportDraft().record")
  def snapshot(n):
   f=OUT/f'{name}-{n}.png';p.screenshot(path=str(f),full_page=True);return hashlib.sha256(f.read_bytes()).hexdigest()
  try:
   p.goto(PUB+'index.html#math',wait_until='domcontentloaded');ready()
   if not loc('topicParentUnlock').count() and loc('rtmBack').count():loc('rtmBack').first.click();ready()
   before=record();events=before['eventsById'];assert events
   r['checks']['restored']={'events':len(events),'active':before.get('sessions',{}).get('active',{}).get('id')}
   # Real parent history, not a direct state setter.
   v=p.get_by_text('家长查看',exact=True)
   if v.count() and v.first.is_visible():v.first.click()
   loc('progress').first.click();ready()
   loc('rtmHistory').first.click();p.locator('[data-rtm-history]').wait_for()
   r['checks']['history']={'text':p.locator('[data-rtm-history]').inner_text()[:4000],'priorExact':all(record()['eventsById'].get(k)==v for k,v in events.items()),'shot':snapshot('history'),'controls':controls()}
   p.reload(wait_until='domcontentloaded');ready();r['checks']['reload']={'exact':all(record()['eventsById'].get(k)==v for k,v in events.items()),'shot':snapshot('reload')}
   # Restore previously revoked actual required theme explicitly as a parent.
   if not loc('topicParentUnlock').count() and loc('rtmBack').count():loc('rtmBack').first.click();ready()
   if not loc('topicParentUnlock').count():
    back=p.get_by_role('button',name='← 地图',exact=True)
    if back.count()==1:back.click();ready()
    elif loc('home').count():loc('home').last.click();ready()
    else:raise AssertionError(('No visible map return',controls()))
   gate=loc('topicParentUnlock').first
   if '确认调整' in gate.inner_text():gate.click();ready()
   active=record().get('sessions',{}).get('active') or {}
   required=(active.get('definition') or {}).get('requiredKnowledge',[])
   selected=set(p.locator('[data-action=topicSelect][aria-pressed=true]').evaluate_all("xs=>xs.map(e=>e.dataset.code)"))
   needed=sorted(set(k.split('.')[0] for k in required)-selected)
   for code in needed:
    el=p.locator(f'[data-action=topicSelect][data-code="{code}"]:visible');assert el.count()==1
    el.click();ready()
   resume=loc('rtmConnectedResume')
   if resume.count() and resume.first.is_enabled():
    resume.first.click();ready()
    current=record().get('sessions',{}).get('active') or {}
    r['checks']['resume']={'sameAttempt':current.get('attemptId')==active.get('attemptId'),'priorExact':all(record()['eventsById'].get(k)==v for k,v in events.items()),'id':current.get('id'),'shot':snapshot('resume')}
    if loc('rtmBack').count():loc('rtmBack').first.click();ready()
   r['checks']['homeControls']=controls()
   r['status']='OBSERVED'
  except Exception as ex:
   r['status']='PARTIAL';r['errors'].append(repr(ex))
   try:r['visible']=p.locator('#app').inner_text()[:1800];r['errorShot']=snapshot('error')
   except:pass
  finally:ctx.close();b.close()
 return r
with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:rows=list(pool.map(one,['R-A','R-B','R-C','R-D']))
(OUT/'d-restored-four-history.json').write_text(json.dumps(rows,ensure_ascii=False,indent=2))
for r in rows:print('D_RESTORED_HISTORY '+json.dumps(r,ensure_ascii=False),flush=True)
