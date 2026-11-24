#!/usr/bin/env python3
"""D batch 01, same frozen product; real rendered submissions; independent numeric expectations frozen separately."""
import concurrent.futures, functools, hashlib, json, re, subprocess, sys, threading
from pathlib import Path
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[2]
BASE='72f2f229246af362f9024db217479357890c8cd3'
OUT=ROOT/'r11-probe-output'
OUT.mkdir(exist_ok=True)
EXPECTED=json.loads((ROOT/'tools/r11-product/d-batch-01-expected.json').read_text())
assert (ROOT/'index.html').read_bytes()==subprocess.check_output(['git','show',BASE+':index.html'],cwd=ROOT)
class Handler(SimpleHTTPRequestHandler):
 def log_message(self,*a): pass
server=ThreadingHTTPServer(('127.0.0.1',0),functools.partial(Handler,directory=str(ROOT)))
threading.Thread(target=server.serve_forever,daemon=True).start()
url=f'http://127.0.0.1:{server.server_port}/index.html#math'
def run(g):
 group=g['group']; result={'group':group,'attempts':[],'status':'NOT_RUN','base':BASE,'expectationCommit':'afbf3318173ad59fb036b2826883b70893db0527'}
 try:
  with sync_playwright() as p:
   browser=p.chromium.launch(headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
   context=browser.new_context(viewport={'width':1024,'height':768})
   page=context.new_page();page.set_default_timeout(12000)
   page.goto(url,wait_until='domcontentloaded')
   page.wait_for_function('Boolean(window.__AMC8_MATH_NAV)',timeout=45000)
   # The same public connected-learning allocator, using an explicitly declared synthetic profile.
   result['entry']=page.evaluate("""id=>{const profile=SourceCatalog.profile({sourceIds:['AMC8'],examIds:[id],topicIds:SKILL_DATA.units.map(u=>u.id)});return {scope:profile.topicIds.length,allowed:ExamMappingUI.connectedAvailability(profile),started:ExamMappingUI.beginConnected(profile)}}""",group)
   seen=set()
   for i in range(8):
    try:
     page.locator('[data-rtm-task]').wait_for(state='visible',timeout=10000)
    except Exception:
     result['noTaskObservation']={'url':page.url,'body':page.locator('body').inner_text()[:10000],'root':page.locator('#app').inner_html()[:8000],'state':page.evaluate("""()=>{const e=ExamMappingUI.exportDraft(),a=e.record?.sessions?.active;return {record:!!e.record,readOnly:e.readOnly,active:a?{id:a.id,taskId:a.taskId,examId:a.examId,origin:a.originProblemGroupId,kind:a.kind,role:a.role}:null,group:e.record?.sessions?.connected?.status}}""")}
     page.screenshot(path=str(OUT/f'{group}-no-task.png'),full_page=True)
     break
    a=page.evaluate("""()=>{const a=ExamMappingUI.exportDraft().record?.sessions?.active;return a?{id:a.id,taskId:a.taskId,examId:a.examId,origin:a.originProblemGroupId,kind:a.kind,role:a.role,attemptId:a.attemptId,helpLevel:a.helpLevel,ordinal:a.submissionOrdinal}:null}""")
    if not a: result['status']='ACTIVE_NOT_IDENTIFIED';break
    ident=a.get('taskId') or a.get('id') or a.get('examId') or ''
    role='exam' if a.get('kind')=='exam' or ident==group else next((r for r in ('contrast','decision','integration') if ident.upper().endswith('-'+r.upper())),None)
    if a.get('origin') not in (None,group) or (role=='exam' and a.get('examId')!=group and ident!=group) or (role!='exam' and not ident.startswith('RTM-'+group[5:]+'-')) or role not in ('exam','contrast','decision','integration') or role in seen:
     result['identityStop']=a;break
    seen.add(role)
    body=page.locator('[data-rtm-task]').inner_text()
    choices=page.locator('[data-action=rtmChoice]:visible').all_inner_texts()
    imgs=page.locator('[data-rtm-task] img').evaluate_all('xs=>xs.map(x=>({src:x.getAttribute("src"),complete:x.complete,naturalWidth:x.naturalWidth}))')
    row={'role':role,'identity':a,'visibleText':body,'choices':choices,'figures':imgs,'credit':'TRANSIT_ONLY' if role in ('contrast','decision') else 'INDEPENDENT_NUMERIC','status':'NOT_RUN'}
    result['attempts'].append(row)
    if '图片暂不可用' in body or any(not x['naturalWidth'] for x in imgs):
     row['status']='FIGURE_BLOCKED';break
    value=(g['transit'] if role in ('contrast','decision') else g['independent'])[role]
    row['input']=value
    if choices:
     candidate=page.locator('[data-action=rtmChoice]:visible').filter(has_text=re.compile('^'+re.escape(value)+'$'))
     if candidate.count()!=1:row['status']='CHOICE_TEXT_MISMATCH';break
     candidate.click()
    else:
     field=page.locator('[data-rtm-input]:visible')
     if field.count()!=1:row['status']='INPUT_MISSING';break
     field.fill(value)
    page.locator('[data-action=rtmSubmit]:visible').click()
    row['feedback']=page.locator('[data-rtm-feedback]').inner_text()
    row['after']=page.evaluate("""()=>{const a=ExamMappingUI.exportDraft().record?.sessions?.active;return a?{input:a.input,feedback:a.feedback,ordinal:a.submissionOrdinal,helpLevel:a.helpLevel,attemptId:a.attemptId}:null}""")
    row['status']='VERIFIED' if ('答对了' in row['feedback'] and row['after'] and row['after'].get('feedback',{}).get('outcome')=='VERIFIED') else 'NOT_VERIFIED'
    page.screenshot(path=str(OUT/f'{group}-{role}.png'),full_page=True)
    if row['status']!='VERIFIED':break
    if role=='exam':break
    page.locator('[data-action=rtmNext]:visible').click()
   result['status']='ATTEMPTED' if result['attempts'] else 'NO_SUBMISSION_NOT_RUN'
   context.close();browser.close()
 except Exception as e:
  result['error']=str(e);result['status']='PARTIAL_OR_BLOCKED'
 (OUT/f'{group}.json').write_text(json.dumps(result,ensure_ascii=False,indent=2))
 return result
try:
 with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
  results=list(pool.map(run,EXPECTED['groups']))
 summary={'base':BASE,'expectationCommit':'afbf3318173ad59fb036b2826883b70893db0527','groups':results}
 (OUT/'batch-receipt.json').write_text(json.dumps(summary,ensure_ascii=False,indent=2))
 print(json.dumps(summary,ensure_ascii=False))
finally:
 server.shutdown()
