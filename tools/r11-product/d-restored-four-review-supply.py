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

   # Exercise a previously unobserved actual historic question entry, then the explicit return control.
   v=p.get_by_text('家长查看',exact=True)
   if v.count() and v.first.is_visible():v.first.click()
   loc('progress').first.click();ready()
   loc('rtmHistory').first.click();p.locator('[data-rtm-history]').wait_for()
   links=loc('rtmReview');assert links.count()>=2
   text=links.nth(1).inner_text();links.nth(1).click();ready()
   r['checks']['reviewActual']={'title':text,'visible':p.locator('#app').inner_text()[:1800],'priorExact':all(record()['eventsById'].get(k)==v for k,v in events.items()),'shot':snapshot('review')}
   back=loc('rtmReturn')
   if back.count():back.first.click();ready()
   else:
    b2=p.get_by_text('返回当前练习',exact=True)
    if b2.count():b2.first.click();ready()
    else:raise AssertionError(('missing actual return',controls()))
   r['checks']['reviewReturn']={'active':record().get('sessions',{}).get('active'),'priorExact':all(record()['eventsById'].get(k)==v for k,v in events.items()),'shot':snapshot('review-return')}
   # Enter the normal topic map without modifying a production or child profile.
   if loc('rtmBack').count():loc('rtmBack').first.click();ready()
   if not loc('topicParentUnlock').count():
    back=p.get_by_role('button',name='← 地图',exact=True)
    if back.count()==1:back.click();ready()
    elif loc('home').count():loc('home').last.click();ready()
   gate=loc('topicParentUnlock').first
   if '确认调整' in gate.inner_text():gate.click();ready()
   active=record().get('sessions',{}).get('active') or {}
   required=(active.get('definition') or {}).get('requiredKnowledge',[])
   selected=set(p.locator('[data-action=topicSelect][aria-pressed=true]').evaluate_all("xs=>xs.map(e=>e.dataset.code)"))
   needed=sorted(set(k.split('.')[0] for k in required)-selected)
   for code in needed:
    p.locator(f'[data-action=topicSelect][data-code="{code}"]:visible').click();ready()
   selected=sorted(set(p.locator('[data-action=topicSelect][aria-pressed=true]').evaluate_all("xs=>xs.map(e=>e.dataset.code)")))
   # Explicitly ordinary selected topics, not QA replay. No key lookup or answer.
   start=loc('topicStart').first;assert start.is_enabled()
   r['checks']['supplyBefore']={'selected':selected,'active':active.get('id'),'events':len(events),'controls':controls(),'shot':snapshot('before-new')}
   start.click();ready()
   p.wait_for_function("""()=>{let a=ExamMappingUI.exportDraft().record?.sessions?.active;return a&&document.querySelector('[data-rtm-task]')?.getAttribute('data-rtm-task')===a.id&&progressStore.getStatus()==='ready'}""",timeout=15000)
   new=record()['sessions']['active'];id=new['id']
   policy=p.evaluate("""({id,topics})=>{let t=ExamMapping.data.tasks[id],profile=SourceCatalog.profile({sourceIds:['AMC8'],examIds:[],topicIds:topics});return {required:t?.requiredKnowledge,eligible:t?ExamMapping.taskAllowed(t,profile).eligible:null,familyId:t?.familyId,criticalDecision:t?.criticalDecision,taskSignature:t?.taskSignature}}""",{'id':id,'topics':selected})
   # The exact previously observed task IDs are extracted from prior record, not guessed.
   old_ids=set()
   def walk(o):
    if isinstance(o,dict):
     for k,v in o.items():
      if k in ('id','taskId','instanceId') and isinstance(v,str) and (v.startswith('RTM-') or v.startswith('AMC8-')):old_ids.add(v)
      walk(v)
    elif isinstance(o,list):
     for v in o:walk(v)
   walk(before)
   r['checks']['newSupply']={'id':id,'attempt':new.get('attemptId'),'priorActive':active.get('attemptId'),'newId':id not in old_ids,'firstOrdinal':new.get('submissionOrdinal'),'eligible':policy['eligible'],'policy':policy,'oldIds':sorted(old_ids),'priorExact':all(record()['eventsById'].get(k)==v for k,v in events.items()),'shot':snapshot('new-supply')}
   r['status']='OBSERVED'
  except Exception as ex:
   r['status']='PARTIAL';r['errors'].append(repr(ex))
   try:r['visible']=p.locator('#app').inner_text()[:1800];r['errorShot']=snapshot('error')
   except:pass
  finally:ctx.close();b.close()
 return r
with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:rows=list(pool.map(one,['R-A','R-B','R-C','R-D']))
(OUT/'d-restored-four-review-supply.json').write_text(json.dumps(rows,ensure_ascii=False,indent=2))
for r in rows:print('D_REVIEW_SUPPLY '+json.dumps(r,ensure_ascii=False),flush=True)
