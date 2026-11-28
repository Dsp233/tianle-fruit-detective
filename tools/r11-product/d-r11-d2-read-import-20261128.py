"""D2 shared continuation: actual saved original, normal supply, reading resume, parent export. Transit labels never count as independent answers."""
import time
from pathlib import Path
exec(Path("tools/r11-product/d-v3-public-natural-only-20261128.py").read_text().split("# Only uncovered public widths")[0])
KEY='tianle_amc8_question_design_v1'; RKEY=KEY+'_reading_r1'
x={'engine':ENGINE,'formal':'fcef9785308363379b028129871c92700e1f93d4','checks':{},'errors':[]}
original={'id':'AMC8-2013-04','prompt':'8人原约定均摊餐费，其中1人忘带钱，其余7人各比原计划多付2.50美元。餐费共多少美元？','givenText':'','options':[],'answer':'140','derivation':'7×2.50=17.50; 8×17.50=140; prepared application, not holdout.'}
expected[original['id']]=original
def ev():return state_report(p)['eventsById']
def rev():
 raw=p.evaluate("k=>localStorage.getItem(k)",RKEY)
 return {v['id']:v for v in json.loads(raw)['events']} if raw else {}
def view(name):
 return {'text':p.locator('#app').inner_text(),'controls':controls(p),'shot':snap(p,name),'reading':rdstate(p)}
def section(name,fn):
 try:x['checks'][name]=fn()
 except Exception as e:
  x['errors'].append(name+': '+repr(e))
  x['checks'][name]={'status':'PARTIAL','error':repr(e),'shot':snap(p,name+'-failure')}
def identity():
 r=p.request.get(PUB+'index.html?d2='+str(time.time_ns()),headers={'Cache-Control':'no-cache'});assert r.ok
 h=hashlib.sha256(r.body()).hexdigest();assert h==hashlib.sha256((ROOT/'index.html').read_bytes()).hexdigest();return h
def read_parent():
 reading_home(p);loc(p,'rdParent').last.click();rdready(p);p.locator('.rd-parent').wait_for()
def stat():
 rr=rdstate(p)['report'];return {k:rr.get(k) for k in ['completedDays','storyReadDays','first','levels','retries','historical','historicalDiagnostics','conditions','weeks','recommendation','due']}
def parent_import():
 ready_profile(p);m=ev();a=active(p);base=rev()
 read_parent();before=stat();z={'before':before,'beforeShot':snap(p,'reading-before-import')};x['checks']['importTrace']=z
 # Exercise actual reading backup merge idempotence with the same synthetic file only.
 with p.expect_download() as dl:loc(p,'rdExport').first.click()
 f=OUT/'reading-actual-export.json';dl.value.save_as(str(f));data=f.read_bytes()
 z['download']={'sha256':hashlib.sha256(data).hexdigest(),'bytes':len(data),'keys':list(json.loads(data))}
 unlock=loc(p,'rdSettingsUnlock')
 if unlock.count() and unlock.first.is_enabled():unlock.first.click();rdready(p)
 upload=p.locator('#app input[type=file]')
 if upload.count()==1:upload.set_input_files(str(f))
 else:
  t=p.locator('#app textarea:visible');assert t.count()==1;t.fill(data.decode())
 loc(p,'rdImport').first.click();rdready(p)
 z['after']={'report':stat(),'eventsExact':retained(base,rev()),'eventIdsBefore':len(base),'eventIdsAfter':len(rev()),'text':p.locator('#app').inner_text(),'shot':snap(p,'after-import')}
 # Reopen and ensure no first-attempt duplicate, and math unaffected.
 read_parent();z['reopen']={'report':stat(),'eventsExact':retained(base,rev()),'shot':snap(p,'import-reopen')}
 ready_profile(p);z['math']={'exact':retained(m,ev()),'sameActive':a==active(p)}
 return z['math']
def gate():
 ready_profile(p);before=ev();read_parent();before_settings=rdstate(p)['snapshot']['settings'];g=loc(p,'rdSettingsUnlock')
 z={'locked':controls(p),'shot':snap(p,'gate-before')};x['checks']['gateTrace']=z
 q=loc(p,'rdSaveRange')
 z['lockedEffective']=q.first.is_disabled()
 if g.count():g.first.click();rdready(p)
 z['unlocked']={'controls':controls(p),'shot':snap(p,'gate-unlocked')}
 # Exit without adjusting settings, then reopen and check relock.
 reading_home(p);read_parent()
 z['return']={'lockedEffective':loc(p,'rdSaveRange').first.is_disabled(),'settingsExact':rdstate(p)['snapshot']['settings']==before_settings,'shot':snap(p,'gate-return')}
 ready_profile(p);z['mathExact']=retained(before,ev())
 return z['return']
def identity_all():
 # Exact eight original H1 files plus root and current entry aliases.
 names=['','index.html','source/index.html','amc8/index.html','academy/index.html','qa/index.html','qa/normal/index.html','qa/history/index.html','muse/rc79/maintenance.html']
 rows=[]
 for n in names:
  f=ROOT/(n or 'index.html')
  res=p.request.get(PUB+n,headers={'Cache-Control':'no-cache'},timeout=20000)
  raw=res.body();rows.append({'path':n,'status':res.status,'url':res.url,'sha256':hashlib.sha256(raw).hexdigest(),'expected':hashlib.sha256(f.read_bytes()).hexdigest() if f.is_file() else None,'headers':res.headers})
 # Check explicit release packet config referenced by production files; no blanket resource pass.
 return rows
def reading_more():
 ready_profile(p);m=ev();a=active(p);base=rev()
 reading_home(p);loc(p,'rdResume').first.click();rdready(p)
 z={'resume':{'text':p.locator('#app').inner_text(),'shot':snap(p,'day17-resume'),'state':rdstate(p)['snapshot'].get('session')}};x['checks']['continuationTrace']=z
 qid=p.evaluate("()=>window.__AMC8_ReadingRuntime.engine().current()?.question?.id")
 if qid=='R2-S17-1' and loc(p,'rdNext').count():loc(p,'rdNext').first.click();rdready(p)
 qid=p.evaluate("()=>window.__AMC8_ReadingRuntime.engine().current()?.question?.id")
 z['next']={'id':qid,'text':rdclean(p.locator('#app')),'options':[rdclean(v) for v in loc(p,'rdPick').all()],'controls':controls(p),'shot':snap(p,'day17-next')}
 # Freeze new questions from visible text, do not read answer keys. 
 # Remaining Day17 questions are intentionally not guessed without their actual wording.
 r=rev();ready_profile(p);z['mathExact']=retained(m,ev());z['sameActive']=a==active(p)
 reading_home(p);z['readingExact']=retained(r,rev());z['oldExact']=retained(base,rev())
 return {k:z[k] for k in ('mathExact','sameActive','readingExact','oldExact')}
try:
 with sync_playwright() as pw:
  b=getattr(pw,ENGINE).launch(headless=True,**({'args':['--no-sandbox','--disable-shm-usage']} if ENGINE=='chromium' else {}))
  st=json.loads(next(Path('/tmp/d-latest').rglob('d2-reading-storage.json')).read_text())
  ctx=b.new_context(storage_state=st,viewport={'width':1024,'height':768},has_touch=True,accept_downloads=True,record_har_path=str(OUT/'network.har'),record_video_dir=str(OUT/'video'),record_video_size={'width':1024,'height':768})
  p=ctx.new_page();p.set_default_timeout(15000);p.on('pageerror',lambda e:x['errors'].append(str(e)));p.on('dialog',lambda d:d.accept() if '家长' in d.message or '合并' in d.message else d.dismiss())
  x['identityBefore']=identity()
  section('identityAll',identity_all);section('readingMore',reading_more);section('parentImport',parent_import);section('gate',gate)
  x['identityAfter']=identity();ctx.storage_state(path=str(OUT/'d2-read-import-storage.json'));ctx.close();b.close()
finally:
 srv.shutdown()
 (OUT/'d2-read-import-delta.json').write_text(json.dumps(x,ensure_ascii=False,indent=2))
 print('D2_READING_IMPORT '+json.dumps({'engine':ENGINE,'checks':list(x['checks']),'errors':x['errors']},ensure_ascii=False),flush=True)
