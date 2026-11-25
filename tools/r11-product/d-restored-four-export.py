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

   # Export an exact previously exercised synthetic profile, not a fresh replay.
   v=p.get_by_text('家长查看',exact=True)
   if v.count() and v.first.is_visible():v.first.click()
   loc('progress').first.click();ready()
   dl=loc('progressExport');assert dl.count()==1
   with p.expect_download(timeout=15000) as d:dl.click()
   down=d.value;path=OUT/f'{name}-actual-export.json';down.save_as(str(path));raw=path.read_bytes();data=json.loads(raw)
   response=[e for e in events.values() if e.get('type')=='response_submitted']
   grouped={}
   for e in response:grouped.setdefault(e.get('attemptId'),[]).append(e)
   sequences=[]
   for k,es in grouped.items():
    es.sort(key=lambda e:e.get('submissionOrdinal',0))
    if len(es)>1:
     sequences.append({'attemptId':k,'events':es})
   # Verify exact event identity, not substring/answer matching.
   found={}
   def walk(o):
    if isinstance(o,dict):
     k=o.get('eventId')
     if k in events:found[k]=o
     for v in o.values():walk(v)
    elif isinstance(o,list):
     for v in o:walk(v)
   walk(data)
   exact=[k for k,v in events.items() if found.get(k)==v]
   after=record()
   assert len(exact)==len(events),(len(exact),len(events),list(data)[:10])
   assert all(after['eventsById'].get(k)==v for k,v in events.items())
   r['checks']['export']={'filename':down.suggested_filename,'bytes':len(raw),'sha256':hashlib.sha256(raw).hexdigest(),'oldEvents':len(events),'exactExported':len(exact),'oldEventsAfterExact':True,'correctionSequences':sequences,'shot':snapshot('export')}
   r['status']='OBSERVED'
  except Exception as ex:
   r['status']='PARTIAL';r['errors'].append(repr(ex))
   try:r['visible']=p.locator('#app').inner_text()[:1800];r['errorShot']=snapshot('error')
   except:pass
  finally:ctx.close();b.close()
 return r
with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:rows=list(pool.map(one,['R-A','R-B','R-C','R-D']))
(OUT/'d-restored-four-export.json').write_text(json.dumps(rows,ensure_ascii=False,indent=2))
for r in rows:print('D_RESTORED_EXPORT '+json.dumps(r,ensure_ascii=False),flush=True)
