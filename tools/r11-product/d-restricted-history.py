#!/usr/bin/env python3
"""Independent restricted-history delta; synthetic records only, no formal learner data."""
import functools,threading,subprocess,json,hashlib,concurrent.futures
from pathlib import Path
from http.server import SimpleHTTPRequestHandler,ThreadingHTTPServer
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[2]; OUT=ROOT/'r11-probe-output'; OUT.mkdir(exist_ok=True)
BASE='72f2f229246af362f9024db217479357890c8cd3'
assert (ROOT/'index.html').read_bytes()==subprocess.check_output(['git','show',BASE+':index.html'],cwd=ROOT)
TARGETS=['RTM-2017-25-CONTRAST','RTM-2017-25-DECISION','RTM-2017-25-INTEGRATION']
class H(SimpleHTTPRequestHandler):
 def log_message(self,*a):pass
srv=ThreadingHTTPServer(('127.0.0.1',0),functools.partial(H,directory=str(ROOT)));threading.Thread(target=srv.serve_forever,daemon=True).start()
URL=f'http://127.0.0.1:{srv.server_port}/index.html#math'
def one(ident):
 row={'id':ident,'fixture':'synthetic pre-existing restricted record, not recovered learner history','status':'NOT_PROVEN'}
 try:
  with sync_playwright() as p:
   b=p.chromium.launch(headless=True,args=['--no-sandbox','--disable-dev-shm-usage']);ctx=b.new_context(viewport={'width':1024,'height':768},accept_downloads=True);page=ctx.new_page();page.set_default_timeout(8000)
   page.goto(URL,wait_until='domcontentloaded');page.wait_for_function("Boolean(window.__AMC8_MATH_NAV) && typeof progressStore!=='undefined' && progressStore.getStatus()==='ready'",timeout=45000)
   # Construct a historical test fixture through the production event store API; do not submit a new restricted answer.
   row['fixtureInfo']=page.evaluate("""id=>{
    const t=ExamMapping.data.tasks[id]; if(!t)throw Error('missing target '+id);
    const group=t.originProblemGroupId, p=ExamMapping.getProblem(group), profile=SourceCatalog.profile({sourceIds:['AMC8'],examIds:[group],topicIds:SKILL_DATA.units.map(u=>u.id)});
    const def=JSON.parse(JSON.stringify(t)), mathKey=ExamMapping.taskKey(t), attemptId='D-SYNTHETIC-'+id;
    const choice=def.answerContract?.kind==='choice', first=choice?String(def.options[0].id):'314159', draft=choice?String(def.options[def.options.length-1].id):'271828';
    const label=v=>choice?def.options.find(o=>String(o.id)===v).text:v;
    let s=TransferEvidenceStore.fresh();s.sessions.active={id,kind:'training',examId:null,originProblemGroupId:group,structureClusterId:t.structureClusterId,mathKey,mappingBuildId:ExamMapping.data.mappingBuildId,presentationKind:'synthetic',renderingMode:'authored_training',definition:def,attemptId,mode:'training',priorExposure:false,priorMethodHelp:false,nextSequence:1,submissionOrdinal:0,helpLevel:0,hintsOpen:false,input:'',feedback:null,finished:false,startedAt:1700000000000,shown:true,profileSnapshot:profile};
    const append=(type,extra={})=>{const a=s.sessions.active,n=a.nextSequence;const ev={eventId:attemptId+':'+n,type,at:1700000000000+n,attemptId,sequence:n,mathKey,examId:null,originProblemGroupId:group,structureClusterId:t.structureClusterId,mappingBuildId:ExamMapping.data.mappingBuildId,presentationKind:'synthetic',renderingMode:'authored_training',priorExposure:false,mode:'training',assignmentId:null,pathwayStage:null,taskId:id,taskEvidenceKey:ConnectedLearning.taskEvidenceKey(t,def),connectedGroupId:null,connectedStage:null,readinessSnapshot:null,evidenceScope:'local_decision_prompt',diagnosticOf:null,supportSnapshot:{methodHelpCount:0,answerRevealed:false,statementRead:false},...extra};const v=TransferEvidenceStore.append(s,ev);if(!v.ok)throw Error(type+': '+v.reason);s=v.state;s.sessions.active.nextSequence=n+1;};
    append('problem_presented');
    // Historical response is an explicit synthetic fixture, not a claimed grading result.
    const result={outcome:'INCORRECT',level:null,evidenceScope:'local_decision_prompt',grantsJudgmentEvidence:false};
    append('response_submitted',{input:first,normalizedInput:first,parserRevision:1,result,submissionOrdinal:1});
    Object.assign(s.sessions.active,{submissionOrdinal:1,input:first,feedback:result,lastSubmittedInput:first,lastSubmittedHelp:0});
    append('hint_revealed',{hintId:'h1'});Object.assign(s.sessions.active,{helpLevel:1,hintsOpen:true,input:draft});
    saved.topicPractice.selectedTopicIds=SKILL_DATA.units.map(u=>u.id);saved.topicPractice.sourceIds=['AMC8'];saved.topicPractice.examIds=[group];saved.rtm1=s;persist();
    return {group,first:label(first),draft:label(draft),attemptId,expectedHelp:1,scopeAllowed:ExamMapping.taskAllowed(t,profile).eligible,childEligible:ConnectedLearning.review(p).eligible};
   }""",ident)
   page.wait_for_function("progressStore.getStatus()==='ready'")
   assert row['fixtureInfo']['childEligible'] is False
   # Reload first, so a transient injected JS object cannot pass as persisted history.
   page.reload(wait_until='domcontentloaded');page.wait_for_function("Boolean(window.__AMC8_MATH_NAV) && typeof progressStore!=='undefined' && progressStore.getStatus()==='ready'",timeout=45000)
   snapshot="()=>JSON.stringify(ExamMappingUI.exportDraft().record)"
   before=page.evaluate(snapshot);row['beforeSha256']=hashlib.sha256(before.encode()).hexdigest()
   assert page.evaluate("()=>!!ExamMappingUI.exportDraft().record && !ExamMappingUI.exportDraft().readOnly")
   # Enter the existing parent review action and exercise visible history controls.
   page.evaluate("()=>ExamMappingUI.handle('rtmOpen',{})")
   paused=page.locator('[data-rtm-scope-paused]')
   assert paused.is_visible(),'restricted active record did not pause'
   row['pausedText']=paused.inner_text();assert page.locator('[data-action=rtmSubmit]:visible').count()==0
   assert page.locator('[data-action=rtmHint]:visible').count()==0
   # Even direct invocation of existing guarded handlers must not create success/help events.
   page.evaluate("()=>{ExamMappingUI.handle('rtmSubmit',{});ExamMappingUI.handle('rtmHint',{});}")
   assert page.evaluate(snapshot)==before,'restricted action changed history'
   page.locator('[data-action=rtmHistory]:visible').first.click();page.locator('[data-rtm-history]').wait_for(state='visible')
   page.locator('[data-action=rtmReview][data-id="'+row['fixtureInfo']['attemptId']+'"]:visible').click()
   hist=page.locator('[data-rtm-history]');hist.wait_for(state='visible')
   row['historyText']=hist.inner_text();assert '只读' in row['historyText']
   assert row['fixtureInfo']['first'] in page.locator('[data-rtm-first]').inner_text()
   assert row['fixtureInfo']['draft'] in page.locator('[data-rtm-draft]').inner_text()
   assert '提示使用：1级' in row['historyText']
   assert not page.locator('[data-action=rtmSubmit]:visible').count()
   page.screenshot(path=str(OUT/(ident+'-history.png')),full_page=True)
   assert page.evaluate(snapshot)==before,'review changed history'
   with page.expect_download(timeout=10000) as d:page.locator('[data-action=progressExport]:visible').first.click()
   download=d.value;download.save_as(str(OUT/(ident+'-export.json')))
   raw=(OUT/(ident+'-export.json')).read_text();assert row['fixtureInfo']['attemptId'] in raw and ident in raw
   row['downloadSha256']=hashlib.sha256(raw.encode()).hexdigest()
   assert page.evaluate(snapshot)==before
   page.reload(wait_until='domcontentloaded');page.wait_for_function("Boolean(window.__AMC8_MATH_NAV) && typeof progressStore!=='undefined' && progressStore.getStatus()==='ready'",timeout=45000)
   after=page.evaluate(snapshot);assert before==after,'reload altered history'
   row['afterSha256']=hashlib.sha256(after.encode()).hexdigest();row['status']='VERIFIED_SYNTHETIC_HISTORY'
   ctx.close();b.close()
 except Exception as e:row['error']=repr(e)
 print('RESTRICTED_HISTORY '+json.dumps(row,ensure_ascii=False),flush=True)
 return row
try:
 with concurrent.futures.ThreadPoolExecutor(max_workers=3) as pool:rows=list(pool.map(one,TARGETS))
 receipt={'base':BASE,'rows':rows,'verified':sum(r['status']=='VERIFIED_SYNTHETIC_HISTORY' for r in rows),'limitation':'synthetic historical protection only; no recovery of missing FIX6 historical attempt identity'}
 (OUT/'restricted-history-receipt.json').write_text(json.dumps(receipt,ensure_ascii=False,indent=2))
 print('RESTRICTED_HISTORY_SUMMARY '+json.dumps(receipt,ensure_ascii=False),flush=True)
finally:srv.shutdown()
