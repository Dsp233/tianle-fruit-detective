#!/usr/bin/env python3
"""Batch actual browser grading, prompt/image frozen before feedback. Normal UI; one journey per family."""
import concurrent.futures,functools,hashlib,json,re,subprocess,sys,threading,time,os
from pathlib import Path
from http.server import SimpleHTTPRequestHandler,ThreadingHTTPServer
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[2];OUT=ROOT/'r11-probe-output';OUT.mkdir(exist_ok=True)
BASE='72f2f229246af362f9024db217479357890c8cd3'
FILE=os.environ.get('D_EXPECTED_FILE','d-delta-math-freeze.json')
EXPECTED=json.loads((ROOT/'tools/r11-product'/FILE).read_text())
assert EXPECTED['base']==BASE
assert (ROOT/'index.html').read_bytes()==subprocess.check_output(['git','show',BASE+':index.html'],cwd=ROOT)
EXPECTED_SHA=hashlib.sha256((ROOT/'tools/r11-product'/FILE).read_bytes()).hexdigest()
class H(SimpleHTTPRequestHandler):
 def log_message(self,*a): pass
server=ThreadingHTTPServer(('127.0.0.1',0),functools.partial(H,directory=str(ROOT)));threading.Thread(target=server.serve_forever,daemon=True).start()
URL=f'http://127.0.0.1:{server.server_port}/index.html#math'
GROUPS={}
for row in EXPECTED['rows']:GROUPS.setdefault(row['group'],{})[row['id']]=row
normalize=lambda s:re.sub(r'\s+','',s or '')
statejs="""()=>{const a=ExamMappingUI.exportDraft().record?.sessions?.active;return a?{id:a.id,attemptId:a.attemptId,origin:a.originProblemGroupId,kind:a.kind,ordinal:a.submissionOrdinal,helpLevel:a.helpLevel,feedback:a.feedback?{outcome:a.feedback.outcome}:null,input:a.input,finished:a.finished,store:progressStore.getStatus()}:null}"""
def run(group):
 t=time.monotonic(); result={'group':group,'attempts':[],'status':'NOT_RUN','errors':[]}
 known=GROUPS[group]; targets={i for i,e in known.items() if e['credit']=='RETROSPECTIVE_MATH_DERIVATION_PRIOR_EXPOSURE'}
 try:
  with sync_playwright() as p:
   b=p.chromium.launch(headless=True,args=['--no-sandbox','--disable-dev-shm-usage']);ctx=b.new_context(viewport={'width':1024,'height':768});page=ctx.new_page();page.set_default_timeout(10000);page.on('pageerror',lambda e:result['errors'].append(str(e)))
   page.goto(URL,wait_until='domcontentloaded')
   page.wait_for_function("Boolean(window.__AMC8_MATH_NAV) && typeof progressStore!=='undefined' && progressStore.getStatus()==='ready'",timeout=45000)
   result['entry']=page.evaluate("""id=>{let topics=SKILL_DATA.units.map(u=>u.id);const available=ts=>ExamMappingUI.connectedAvailability(SourceCatalog.profile({sourceIds:['AMC8'],examIds:[id],topicIds:ts}));if(!available(topics))return {available:0,topics:[]};for(const topic of [...topics]){const next=topics.filter(x=>x!==topic);if(available(next)>0)topics=next}return {available:available(topics),topics}}""",group)
   if not result['entry']['available']:raise RuntimeError('POLICY_BLOCKED')
   page.on('dialog',lambda d:d.accept() if '家长' in d.message and ('确认'in d.message or '调整'in d.message) else d.dismiss())
   page.locator('[data-action=topicParentUnlock]:visible').first.click()
   for topic in result['entry']['topics']:
    button=page.locator(f'[data-action=topicSelect][data-code="{topic}"]:visible')
    if button.get_attribute('aria-pressed')!='true':
     button.click();page.wait_for_function("(id)=>document.querySelector('[data-action=topicSelect][data-code=\"'+id+'\"]')?.getAttribute('aria-pressed')==='true' && progressStore.getStatus()==='ready'",arg=topic,timeout=5000)
   picker=page.locator('[data-source-exam-picker]')
   if not picker.is_visible():page.get_by_text('细化已掌握知识 / 指定真题',exact=True).click()
   picker.select_option(group);page.locator('[data-action=sourceExamReplace]:visible').click()
   page.wait_for_function("(id)=>document.querySelector('[data-selected-exam-summary]')?.innerText.includes(id) && progressStore.getStatus()==='ready'",arg=group,timeout=10000)
   result['entry']['selected']=page.locator('[data-selected-exam-summary]').inner_text()
   page.locator('[data-action=topicStart]:visible:enabled').first.click()
   seen=set()
   for step in range(10):
    page.wait_for_function("""()=>{const a=ExamMappingUI.exportDraft().record?.sessions?.active,el=document.querySelector('[data-rtm-task]');return !!a&&a.submissionOrdinal===0&&progressStore.getStatus()==='ready'&&el?.getAttribute('data-rtm-task')===a.id&&!!el.querySelector('[data-action=rtmSubmit]')}""",timeout=10000)
    a=page.evaluate(statejs); ident=a['id']
    if a['origin']!=group or ident not in known or ident in seen:
     result['identityStop']=a;break
    seen.add(ident);e=known[ident]; task=page.locator('[data-rtm-task]')
    title=task.locator('.task-title').inner_text();giv=task.locator('[data-rtm-givens]');given=giv.inner_text() if giv.count() else ''
    choices=task.locator('[data-action=rtmChoice]:visible').all_inner_texts()
    row={'id':ident,'role':e['role'],'credit':e['credit'],'identity':a,'title':title,'given':given,'choices':choices,'status':'NOT_RUN'}
    result['attempts'].append(row)
    if 'promptFingerprint' in e:
     observedFingerprint=hashlib.sha256(json.dumps([normalize(title),normalize(given),sorted(map(normalize,choices))],ensure_ascii=False,separators=(',',':')).encode()).hexdigest()
     row['observedPromptFingerprint']=observedFingerprint
     promptMismatch=observedFingerprint!=e['promptFingerprint']
    else:promptMismatch=normalize(title)!=normalize(e['prompt']) or normalize(given)!=normalize(e['givenText']) or sorted(map(normalize,choices))!=sorted(map(normalize,e['options']))
    if promptMismatch:
     row['status']='VISIBLE_PROMPT_MISMATCH';continue_after=False;break
    if e['figures']:
     try:
      page.wait_for_function("""n=>{const imgs=[...document.querySelectorAll('[data-rtm-statement-image]')];return imgs.length===n&&imgs.every(x=>x.complete&&x.naturalWidth>0)}""",arg=len(e['figures']),timeout=8000)
     except Exception as ex:row['figureError']=str(ex)
    imgs=task.locator('[data-rtm-statement-image]').evaluate_all("""xs=>xs.map(x=>({src:x.getAttribute('src'),naturalWidth:x.naturalWidth,naturalHeight:x.naturalHeight,complete:x.complete,visible:!!x.getClientRects().length}))""")
    row['figures']=imgs
    if len(imgs)!=len(e['figures']) or any(not f['complete'] or not f['naturalWidth'] or not f['visible'] or not any(h in f['src'] for h in e['figures']) for f in imgs):
     row['status']='FIGURE_BINDING_OR_RENDER_UNPROVED';break
    if imgs:
     # hash actual displayed file bytes, not just a hash-shaped URL.
     actual=[]
     for f in imgs:
      path=f['src'].split('/assets/')[-1].split('?')[0]
      file=ROOT/'assets'/path
      actual.append(hashlib.sha256(file.read_bytes()).hexdigest() if file.is_file() else None)
     row['actualFigureHashes']=actual
     if sorted(actual)!=sorted(e['figures']):row['status']='FIGURE_BYTES_MISMATCH';break
     task.screenshot(path=str(OUT/f'{ident}-before.png'))
    value=e['answer'];row['input']=value
    if choices:
     hits=[loc for loc in task.locator('[data-action=rtmChoice]:visible').all() if normalize(loc.inner_text())==normalize(value)]
     if len(hits)!=1:row['status']='CHOICE_NOT_UNIQUE';break
     hits[0].click()
    else:
     field=task.locator('[data-rtm-input]:visible')
     if field.count()!=1:row['status']='INPUT_NOT_UNIQUE';break
     field.fill(value)
    page.wait_for_function("progressStore.getStatus()==='ready'",timeout=8000)
    task.locator('[data-action=rtmSubmit]:visible').click()
    page.wait_for_function("""id=>{const a=ExamMappingUI.exportDraft().record?.sessions?.active;return a?.attemptId===id&&a.submissionOrdinal===1&&!!a.feedback?.outcome&&progressStore.getStatus()==='ready'&&!document.querySelector('[data-rtm-feedback]')?.innerText.includes('正在保存')}""",arg=a['attemptId'],timeout=12000)
    row['actual']=page.evaluate(statejs);row['feedback']=page.locator('[data-rtm-feedback]').inner_text()
    row['status']='VERIFIED' if row['actual']['feedback']['outcome']=='VERIFIED' and '答对了' in row['feedback'] else 'GRADE_DISAGREEMENT'
    task.screenshot(path=str(OUT/f'{ident}-after.png'))
    if row['status']!='VERIFIED' or a['kind']=='exam' or targets<=set(x['id'] for x in result['attempts'] if x['status']=='VERIFIED'):break
    page.locator('[data-action=rtmNext]:visible').click()
    try:
     page.wait_for_function("""old=>{const a=ExamMappingUI.exportDraft().record?.sessions?.active,el=document.querySelector('[data-rtm-task]');return !!a&&a.attemptId!==old&&a.submissionOrdinal===0&&progressStore.getStatus()==='ready'&&el?.getAttribute('data-rtm-task')===a.id&&!!el.querySelector('[data-action=rtmSubmit]')}""",arg=a['attemptId'],timeout=8000)
    except Exception as ex:
     row['transitionError']=str(ex);row['transitionState']=page.evaluate(statejs);row['transitionDOM']=page.locator('#app').inner_text()[:1800];break
   result['status']='COMPLETE' if targets<=set(x['id'] for x in result['attempts'] if x['status']=='VERIFIED') else 'PARTIAL'
   ctx.close();b.close()
 except Exception as e:result['status']='PARTIAL_OR_BLOCKED';result['error']=str(e)
 result['elapsedSeconds']=round(time.monotonic()-t,2)
 (OUT/f'{group}.json').write_text(json.dumps(result,ensure_ascii=False,indent=2))
 return result
try:
 start=time.monotonic()
 with concurrent.futures.ThreadPoolExecutor(max_workers=5) as pool:results=list(pool.map(run,GROUPS))
 report={'base':BASE,'expectedFile':FILE,'expectedSha256':EXPECTED_SHA,'elapsedSeconds':round(time.monotonic()-start,2),'groups':results}
 (OUT/'bulk-receipt.json').write_text(json.dumps(report,ensure_ascii=False,indent=2))
 for g in results:print('DELTA_GRADE_GROUP '+json.dumps(g,ensure_ascii=False,separators=(',',':')),flush=True)
 print('BULK_SUMMARY '+json.dumps({'groups':len(results),'elapsedSeconds':report['elapsedSeconds'],'attempts':sum(len(g['attempts']) for g in results),'verified':sum(x['status']=='VERIFIED' for g in results for x in g['attempts']),'independent':sum(x['status']=='VERIFIED' and x['credit']=='INDEPENDENT_CURRENT_PROMPT' for g in results for x in g['attempts']),'confirmedFigureObjects':sum(x['status']=='VERIFIED' and bool(x.get('figures')) for g in results for x in g['attempts'])},ensure_ascii=False))
finally:server.shutdown()
