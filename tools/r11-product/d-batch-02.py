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
PROMPTS=json.loads(r'''{"AMC8-2000-13":["△CAT中C、T两角相等，A角40°。R在AC上，TR平分∠CTA。∠CRT是多少度？","△CAT中C、T两角相等，A角36°。R在AC上，TR平分T角。∠CRT多少度？"],"AMC8-2000-14":["29的12次方加39的7次方，和的个位多少？","19的19次方加99的99次方，和的个位是多少？"],"AMC8-2000-15":["等边三角形ABC、ADE、EFG按图连接，D是AC中点，G是AE中点，AB=8。图形ABCDEFG的外周长是多少？","等边三角形ABC、ADE、EFG向外连接，D是AC中点，G是AE中点，AB=4。外轮廓AB—BC—CD—DE—EF—FG—GA的周长多少？"],"AMC8-2000-16":["长方形场地沿长边走12次共360米，沿边界走6圈共480米。面积是多少平方米？","一块长方形后院，沿长边走25次共1000米，沿周长走10圈也共1000米。后院面积是多少平方米？"],"AMC8-2015-10":["三位整数的数字互异，共多少个？","1000至9999中，四个数字互不相同的整数共多少个？"],"AMC8-2015-11":["首位A或E，中间从B、C、D中依次取不同两字母，末位0至4，均匀合法车牌恰为ABC3概率多少？","车牌依次为5个元音之一、21个辅音之一、不同于前项的另一个辅音、0至9数字，均按规则等可能选。恰为AMC8概率多少？"],"AMC8-2015-12":["正方体任取三条两两平行的棱，无序且不重复，共几组？","正方体的12条棱中，无序且不重复的平行棱对有几对？"],"AMC8-2015-13":["1至9集合删2个不同数，剩下均值5，可删无序对几组？","从1至11的集合删除两个不同数，使剩9数平均仍为6，可删除的无序数对有几组？"],"AMC8-2015-14":["9、15、21、27、30中，哪个不能为3个连续正奇数的和？","16、40、72、100、200中，哪个不能写成4个连续奇整数之和？"],"AMC8-2015-15":["100人中第一赞成65、第二60、双反对10，双赞成几人？","198人投两议题，赞成第一149、第二119，两项都反对29人。两项都赞成几人？"]}''')
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
   # Determine minimum legal synthetic topic declaration using allocation only, then operate actual normal UI.
   page.wait_for_function("typeof progressStore!=='undefined' && progressStore.getStatus()==='ready'",timeout=30000)
   result['entry']=page.evaluate("""id=>{let topics=SKILL_DATA.units.map(u=>u.id);const available=ts=>ExamMappingUI.connectedAvailability(SourceCatalog.profile({sourceIds:['AMC8'],examIds:[id],topicIds:ts}));if(!available(topics))return {available:0,topics:[]};for(const topic of [...topics]){const next=topics.filter(x=>x!==topic);if(available(next)>0)topics=next}return {available:available(topics),topics}}""",group)
   if not result['entry']['available']:raise RuntimeError('POLICY_BLOCKED')
   page.on('dialog',lambda dialog:dialog.accept() if ('家长' in dialog.message and ('确认' in dialog.message or '调整' in dialog.message)) else dialog.dismiss())
   unlock=page.locator('[data-action=topicParentUnlock]:visible')
   if unlock.count():unlock.first.click()
   for topic in result['entry']['topics']:
    button=page.locator(f'[data-action=topicSelect][data-code="{topic}"]:visible')
    if button.get_attribute('aria-pressed')!='true':
     button.click()
     page.wait_for_function("(id)=>document.querySelector('[data-action=topicSelect][data-code=\"'+id+'\"]')?.getAttribute('aria-pressed')==='true'",arg=topic,timeout=5000)
   summary=page.get_by_text('细化已掌握知识 / 指定真题',exact=True)
   if not page.locator('[data-source-exam-picker]').is_visible():summary.click()
   picker=page.locator('[data-source-exam-picker]:visible')
   picker.select_option(group)
   result['entry']['pickerText']=page.locator('[data-source-exam-picker] option:checked').inner_text()
   chip=page.locator(f'[data-action=sourceExamToggle][data-code="{group}"][aria-pressed=true]')
   try:
    chip.wait_for(state='visible',timeout=8000)
    page.wait_for_function("(id)=>typeof saved!=='undefined' && saved.topicPractice.examIds.includes(id) && progressStore.getStatus()==='ready'",arg=group,timeout=8000)
   except Exception as e:
    result['entry']['selectionEvidence']={'chipCount':chip.count(),'saved':page.evaluate("()=>({examIds:typeof saved==='undefined'?null:saved.topicPractice.examIds,storeStatus:progressStore.getStatus()})"),'error':str(e),'text':page.locator('#app').inner_text()[:3000]}
    page.screenshot(path=str(OUT/f'{group}-selection-not-confirmed.png'),full_page=True)
    raise RuntimeError('PICKER_SELECTION_NOT_CONFIRMED')
   result['entry']['selectionEvidence']={'chipCount':chip.count(),'saved':page.evaluate("()=>({examIds:saved.topicPractice.examIds,storeStatus:progressStore.getStatus()})")}

   start=page.locator('[data-action=topicStart]:visible:enabled').first
   start.click()

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
    if role in ('integration','exam'):
     normalize=lambda text:re.sub(r'\s+','',text)
     expectedPrompt=PROMPTS[group][0 if role=='integration' else 1]
     row['expectedPrompt']=expectedPrompt
     if normalize(expectedPrompt) not in normalize(body):
      row['status']='PROMPT_REVIEW_REQUIRED';break
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
    try:
     page.wait_for_function("()=>{const a=ExamMappingUI.exportDraft().record?.sessions?.active;return !!a?.feedback?.outcome && a.feedback.outcome!=='SAVING' && !document.querySelector('[data-rtm-feedback]')?.innerText.includes('正在保存')}",timeout=10000)
    except Exception as e: row['saveWait']=str(e)
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
  results=list(pool.map(run,[g for g in EXPECTED['groups'] if g['group']!='AMC8-2000-14']))
 summary={'priorRun':45386912884,'base':BASE,'expectationCommit':'afbf3318173ad59fb036b2826883b70893db0527','groups':results}
 (OUT/'batch-receipt.json').write_text(json.dumps(summary,ensure_ascii=False,indent=2))
 print(json.dumps(summary,ensure_ascii=False))
finally:
 server.shutdown()
