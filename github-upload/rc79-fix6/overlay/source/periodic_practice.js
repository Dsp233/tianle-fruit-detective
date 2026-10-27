'use strict';
// Local calendar and evidence records. A wrong-answer count is never a diagnosis.
const PeriodicPractice=(()=>{
 const DAY=86400000,copy=x=>JSON.parse(JSON.stringify(x));
 function restore(raw,firstAt,now=Date.now()){
  if(raw&&raw.schema!==1)return copy(raw);
  if(raw){const next=copy(raw);if(clock(raw,now).ok)next.lastObservedAt=now;return next;}
  const start=Number.isFinite(firstAt)&&firstAt>0?firstAt:now;
  return {schema:1,startedAt:start,lastObservedAt:Math.max(start,now),biweeklyCompletedAt:null,monthlyCompletedAt:null,probeResponses:[],confirmations:[],reviews:[],probe:null};
 }
 function clock(s,now){
  if(s?.schema!==1)return {ok:false,reason:'记录格式暂不能核验'};
  if(!['probeResponses','confirmations','reviews'].every(k=>Array.isArray(s[k])&&s[k].every(r=>r&&typeof r==='object'&&!Array.isArray(r)))||s.probe!==null&&(!s.probe||typeof s.probe!=='object'||Array.isArray(s.probe)))return {ok:false,reason:'复习记录结构暂不能核验，原记录保留'};
  if(!Number.isFinite(now)||!Number.isFinite(s.startedAt)||s.startedAt<=0||!Number.isFinite(s.lastObservedAt)||now<s.lastObservedAt||now<s.startedAt)return {ok:false,reason:'本地日期未知或发生回拨，暂不判断到期'};
  return {ok:true};
 }
 function due(s,kind,now=Date.now()){
  const c=clock(s,now);if(!c.ok)return {due:false,reason:c.reason};
  const field=kind==='biweekly'?'biweeklyCompletedAt':'monthlyCompletedAt',days=kind==='biweekly'?14:30;
  const anchor=s[field]===null||s[field]===undefined?s.startedAt:s[field];
  if(!Number.isFinite(anchor)||anchor>s.lastObservedAt)return {due:false,reason:'复习日期记录尚待核验'};
  const dueAt=anchor+days*DAY;return {due:now>=dueAt,dueAt,daysRemaining:Math.max(0,Math.ceil((dueAt-now)/DAY))};
 }
 function complete(s,kind,now){const d=due(s,kind,now);if(!d.due)return null;return {...copy(s),[kind==='biweekly'?'biweeklyCompletedAt':'monthlyCompletedAt']:now,lastObservedAt:now};}
 function unseenPlans(plans,history){
  const seen=new Set([...(history.exposedMathKeys||[]),...(history.solvedMathKeys||[])]);
  return plans.filter(p=>!seen.has(p.candidate.mathKey)&&p.pendingTaskIds.every(id=>!seen.has(p.training.find(t=>t.id===id)?.mathKey)));
 }
 return {DAY,restore,clock,due,complete,unseenPlans};
})();
if(typeof module!=='undefined')module.exports=PeriodicPractice;

const PeriodicPracticeUI=(()=>{
 let message='';
 const copy=x=>JSON.parse(JSON.stringify(x));
 const current=()=>saved.periodicPractice;
 const profile=()=>SourceCatalog.profile({...saved.topicPractice,topicIds:saved.topicPractice.selectedTopicIds});
 function writable(){return canPersist&&progressStore.getStatus()==='ready'&&current()?.schema===1&&PeriodicPractice.clock(current(),Date.now()).ok;}
 function commit(next,rtmState=null){
  if(!writable()){message='日期或记录暂不能写入，原始学习记录保持保留。';return false;}
  const previous=current(),previousRtm=saved.rtm1,previousRevision=saved.profileRevision;saved.periodicPractice=next;if(rtmState)saved.rtm1=rtmState;
  if(!persist()?.ok){saved.periodicPractice=previous;saved.rtm1=previousRtm;if(previousRevision===undefined)delete saved.profileRevision;else saved.profileRevision=previousRevision;message='本次复习记录未保存，请先导出记录。';return false;}
  message='';return true;
 }
 function home(){
  const b=PeriodicPractice.due(current(),'biweekly'),m=PeriodicPractice.due(current(),'monthly');
  const status=(d,word)=>d.reason?d.reason:d.due?word+'已到期':word+'还需 '+d.daysRemaining+' 天';
  return `<section class="panel periodic-practice" aria-label="定期练习"><h2>定期回访</h2><p role="status">${esc(status(b,'双周新题'))}；${esc(status(m,'月度复练'))}。</p><div class="stage-buttons"><button class="secondary" data-action="periodicBiweekly" ${b.due?'':'disabled'}>双周新题 · 最多10题</button><button class="secondary" data-action="periodicMonthly" ${m.due?'':'disabled'}>月度复练</button></div><p>按当前已掌握范围安排；新题不足会如实说明。只有错误次数时先核对原因。</p>${message?'<p role="status">'+esc(message)+'</p>':''}</section>`;
 }
 function beginBiweekly(){
  const due=PeriodicPractice.due(current(),'biweekly');
  if(!due.due){message=due.reason||('双周新题还需 '+due.daysRemaining+' 天。');render();return;}
  if(!writable()){message='双周新题已到期，但当前记录暂不能写入。请先处理保存状态，原记录会保留。';render();return;}
  const group=ExamMappingUI.connectedStatus(),s=topicSession();
  if(group?.periodic?.kind==='biweekly'&&group.status==='active'){ExamMappingUI.handle('rtmConnectedResume',{});return;}
  if(s?.periodic?.kind==='biweekly'&&!s.exhausted&&topicFrontier()<s.total){topicResume();return;}
  if(group?.status==='active'||s&&!s.exhausted&&topicFrontier()<s.total){message='请先继续或完成上次练习，草稿不会被双周任务覆盖。';render();return;}
  const periodic={kind:'biweekly',cycleId:'biweekly-'+(current().biweeklyCompletedAt||current().startedAt),startedAt:Date.now(),newOnly:true};
  topicStart({periodic});
 }
 function finishBiweekly(periodic,count){
  if(periodic?.kind!=='biweekly')return;
  const next=PeriodicPractice.complete(current(),'biweekly',Date.now());if(!next)return;
  next.reviews.push({kind:'biweekly',cycleId:periodic.cycleId,at:Date.now(),presented:count,maximum:10});commit(next);
 }
 function state(){return TransferEvidenceStore.inspect(saved.rtm1);}
 function parents(){
  const r=state();if(r.readOnly)return [];
  const s=r.state,solved=new Set(TransferEvidenceStore.history(s).solvedMathKeys);
  return [...(s.sessions.archived||[]),...(s.sessions.active?[s.sessions.active]:[])].filter((a,i,all)=>all.findIndex(x=>x.attemptId===a.attemptId)===i&&!a.diagnosticOf&&!solved.has(ExamMapping.resolveMathKey(a.mathKey))&&TransferEvidenceStore.attempt(s,a.attemptId).events.some(e=>e.type==='response_submitted'&&e.result?.outcome==='INCORRECT'));
 }
 function linkFor(parent){
  const p=profile(),problem=ExamMapping.getProblem(parent.examId||parent.originProblemGroupId);
  if(!problem||!p.sourceIds.includes(problem.sourceId)||p.examIds.length&&!p.examIds.includes(problem.examId))return null;
  const allowed=ExamMapping.check(problem,p,{},'practice');if(!allowed.eligible)return null;
  return (window.__AMC8_REMEDIATION_REVIEWS.links||[]).find(l=>l.parentId===parent.id&&allowed.allowedRouteIds.includes(l.routeId)&&ExamDiagnostics.review(l).eligible&&ExamMapping.taskAllowed(ExamMapping.data.tasks[l.probeTaskId],p).eligible)||null;
 }
 function key(link){return ProgressStore.digest(ExamMapping.canonical(link.snapshot));}
 function definition(link){const task=ExamMapping.data.tasks[link.probeTaskId],review=ChildReviewStatus.review(ExamMapping.getProblem(task.originProblemGroupId));return ChildReviewStatus.definition({definition:task},review.record.tasks[task.taskId]);}
 function validResponse(row,parent,link){
  if(!row||row.parentAttemptId!==parent.attemptId||row.linkId!==link.linkId||row.snapshotHash!==key(link)||typeof row.input!=='string')return false;
  const event=state().state?.eventsById[row.responseEventId];
  return event?.type==='response_submitted'&&event.attemptId===row.probeAttemptId&&event.diagnosticOf?.attemptId===parent.attemptId&&event.input===row.input&&event.result?.outcome==='INCORRECT'&&JudgmentEvidence.task(definition(link),row.input,{methodHelpCount:0}).outcome==='INCORRECT';
 }
 function confirmation(parent,link){return current().confirmations.find(c=>c.parentAttemptId===parent.attemptId&&c.linkId===link.linkId&&c.snapshotHash===key(link)&&c.reviewedBy==='parent_local_process_review'&&current().probeResponses.some(r=>r.responseId===c.probeResponseId&&validResponse(r,parent,link)))||null;}
 function monthlyPlan(){
  if(state().readOnly||!PeriodicPractice.clock(current(),Date.now()).ok)return {kind:'UNKNOWN',targets:[],wrongCount:0};
  const targets=parents().map(parent=>{const link=linkFor(parent);return {parent,link,confirmation:link?confirmation(parent,link):null};});
  const legacyWrong=saved.competition.attempts.some(a=>{if(a.correct)return false;try{return !CompetitionIdentity.solved(saved.competition,competitionCreate(a.recipe))}catch{return true}});
  return {kind:targets.some(t=>t.confirmation)?'CONFIRMED_REMEDIATION':targets.length||legacyWrong?'PROBE_FIRST':'NONE',targets,wrongCount:targets.length+(legacyWrong?1:0)};
 }
 function beginMonthly(){
  if(!writable()||!PeriodicPractice.due(current(),'monthly').due){message='月度复练尚未到期，或本地日期暂不能核验。';render();return;}
  open('periodicReview');
 }
 function beginProbe(id){
  if(!writable())return;
  const target=monthlyPlan().targets.find(t=>t.parent.attemptId===id);if(!target?.link){message='当前范围暂无已复核的区分题，保留未知原因，不将错误次数当作诊断。';render();return;}
  const next=copy(current());next.probe={parentAttemptId:id,linkId:target.link.linkId,snapshotHash:key(target.link),input:'',responseId:null,attemptId:'monthly-probe-'+Date.now()+'-'+Math.random().toString(36).slice(2,10),nextSequence:1};
  let rtmState=state().state;
  for(const type of ['problem_presented','method_exposed']){const appended=appendProbeEvent(rtmState,next.probe,target,type);if(!appended.ok)return;rtmState=appended.state;next.probe.nextSequence++;}
  next.lastObservedAt=Date.now();if(commit(next,rtmState))render();
 }
 function appendProbeEvent(rtmState,probe,target,type,extra={}){
  const task=ExamMapping.data.tasks[target.link.probeTaskId];
  return TransferEvidenceStore.append(rtmState,{eventId:probe.attemptId+':'+probe.nextSequence,attemptId:probe.attemptId,type,at:Date.now(),sequence:probe.nextSequence,mathKey:ExamMapping.taskKey(task),mappingBuildId:ExamMapping.data.mappingBuildId,taskId:task.taskId,taskEvidenceKey:ConnectedLearning.taskEvidenceKey(task,definition(target.link)),originProblemGroupId:task.originProblemGroupId,presentationKind:'synthetic',mode:'training',evidenceScope:'remediation_support_only',diagnosticOf:{attemptId:target.parent.attemptId,linkId:target.link.linkId},supportSnapshot:{methodHelpCount:1},...extra});
 }
 function selectedProbe(){const p=current()?.probe,t=monthlyPlan().targets.find(t=>t.parent.attemptId===p?.parentAttemptId);return p&&t?.link&&p.linkId===t.link.linkId&&p.snapshotHash===key(t.link)?{probe:p,target:t}:null;}
 function submitProbe(){
  const selected=selectedProbe();if(!selected||!writable())return;
  const {probe,target}=selected,d=definition(target.link);
  if(!d.options?.some(o=>String(o.id??o.value)===probe.input)){message='先选择你认为符合条件的关系。';render();return;}
  const result=JudgmentEvidence.task(d,probe.input,{methodHelpCount:0}),next=copy(current());
  if(next.probe.responseId)return;
  const responseId='monthly-probe-'+Date.now()+'-'+next.probeResponses.length;
  const responseEventId=probe.attemptId+':'+probe.nextSequence,supportResult={...result,level:null,evidenceScope:'remediation_support_only',grantsJudgmentEvidence:false};
  const appended=appendProbeEvent(state().state,next.probe,target,'response_submitted',{input:probe.input,result:supportResult,submissionOrdinal:1});if(!appended.ok)return;next.probe.nextSequence++;
  next.probeResponses.push({responseId,parentAttemptId:probe.parentAttemptId,linkId:probe.linkId,snapshotHash:probe.snapshotHash,probeAttemptId:probe.attemptId,responseEventId,input:probe.input,outcome:result.outcome,at:Date.now(),scope:'local_discrimination_only',grantsMastery:false});next.probe.responseId=responseId;next.lastObservedAt=Date.now();if(commit(next,appended.state))render();
 }
 function confirmProbe(){
  const selected=selectedProbe();if(!selected||!writable())return;
  const {probe,target}=selected,row=current().probeResponses.find(r=>r.responseId===probe.responseId);
  if(!validResponse(row,target.parent,target.link))return;
  const next=copy(current());if(confirmation(target.parent,target.link))return;
  next.confirmations.push({parentAttemptId:target.parent.attemptId,linkId:target.link.linkId,snapshotHash:key(target.link),probeResponseId:row.responseId,judgmentId:target.link.judgmentId,reviewedBy:'parent_local_process_review',claim:'本组任务中的关键关系需要复练',scope:'this_parent_and_reviewed_contrast_only',at:Date.now(),changesDeclaredKnowledge:false});next.probe=null;next.lastObservedAt=Date.now();if(commit(next))render();
 }
 function remediate(id){
  const target=monthlyPlan().targets.find(t=>t.parent.attemptId===id);
  if(!target?.confirmation||!writable())return;
  if(!ExamMappingUI.resumeMonthly(id)){message='原任务或已复核短题目前不满足知识、来源、负担或内容要求，原记录保留。';render();}
 }
 function returned(parent){
  if(!writable())return;
  const next=copy(current());next.probe=null;next.reviews.push({kind:'monthly_return',parentAttemptId:parent.attemptId,at:Date.now(),outcome:parent.feedback?.outcome||'UNKNOWN',firstAnswerReplaced:false});next.lastObservedAt=Date.now();
  if(monthlyPlan().kind==='NONE')next.monthlyCompletedAt=Date.now();commit(next);
 }
 function page(){
  const plan=monthlyPlan(),selected=selectedProbe();
  let body=plan.kind==='UNKNOWN'?'<p>记录格式暂不能核验，先导出保留，不推断错因。</p>':plan.kind==='NONE'?'<p data-monthly-status="NONE">当前没有已确认需要复练的目标；不虚构诊断，也不改动已掌握范围。</p><button class="secondary" data-action="monthlyComplete">记录本次查看</button>':`<p data-monthly-status="${plan.kind}">${plan.kind==='CONFIRMED_REMEDIATION'?'有经区分题和家长过程复核确认的局部复练目标，先补相关关系，再回原尝试。':'目前只有错误记录，原因尚未确认。先用区分题核对，不按错误次数批量判不会。'}</p>`;
  if(selected){
   const {probe,target}=selected,d=definition(target.link),response=current().probeResponses.find(r=>r.responseId===probe.responseId);
   body+=`<section class="panel" data-monthly-probe><h2>先核对一个关系</h2><p>${esc(d.prompt)}</p><div class="stage-buttons">${d.options.map(o=>`<button class="secondary" data-action="monthlyProbeChoice" data-value="${esc(String(o.id??o.value))}" aria-pressed="${probe.input===String(o.id??o.value)}" ${response?'disabled':''}>${esc(o.text)}</button>`).join('')}</div><button class="primary" data-action="monthlyProbeSubmit" ${response?'disabled':''}>提交判断</button>${response?`<p>${response.outcome==='VERIFIED'?'这次区分题通过，不能据旧错误认定持续误区；可保留记录，再回原任务检查。':'这次区分题也未通过。仍需核对实际过程，不能只因两次错误就认定原因。'}</p>`:''}${response&&validResponse(response,target.parent,target.link)?'<details><summary>家长核对过程</summary><p>请结合原题和区分题的实际选择，确认本组关键关系确需复练。这里只确认这一组局部表现，不判断孩子普遍不会。</p><button class="secondary" data-action="monthlyConfirm">已核对过程，确认本组关系需复练</button></details>':''}</section>`;
  }
  body+=plan.targets.map(t=>`<section class="panel"><h2>保留的原任务</h2><p>${esc(t.parent.definition.prompt)}</p><p>首次作答、草稿和帮助记录保留。</p>${t.confirmation?`<p>本组关键关系已由区分题和家长过程复核确认需要复练。</p><button class="primary" data-action="monthlyRemediate" data-id="${esc(t.parent.attemptId)}">补相关短题，再回原尝试</button>`:t.link?`<button class="secondary" data-action="monthlyProbe" data-id="${esc(t.parent.attemptId)}">先做区分题</button>`:'<p>当前范围暂无已审核的对应区分题，原因保持未知。</p>'}</section>`).join('');
  if(plan.wrongCount&&!plan.targets.length)body+='<p>已有旧练习错误记录，但当前暂无已审核的对应区分题。原因保持未知，可保留记录，继续正常练习。</p>';
  return `<section class="periodic-review"><div class="page-head"><h1>月度复练</h1><button class="secondary" data-action="home">回到首页</button></div>${message?'<p role="status">'+esc(message)+'</p>':''}${body}<p>本页记录局部复查与帮助，不自动授予知识掌握或独立迁移结论。</p></section>`;
 }
 function handle(action,data){
  if(!/^(periodic|monthly)/.test(action))return false;
  if(action==='periodicBiweekly'&&view==='home')beginBiweekly();
  if(action==='periodicMonthly'&&view==='home')beginMonthly();
  if(view!=='periodicReview')return true;
  if(!writable()||!PeriodicPractice.due(current(),'monthly').due){message='日期或记录暂不能核验，原始记录保留。';render();return true;}
  if(action==='monthlyProbe')beginProbe(data.id);
  if(action==='monthlyProbeChoice'){const p=selectedProbe();if(p&&!p.probe.responseId){const next=copy(current());next.probe.input=String(data.value);next.lastObservedAt=Date.now();if(commit(next))render();}}
  if(action==='monthlyProbeSubmit')submitProbe();
  if(action==='monthlyConfirm')confirmProbe();
  if(action==='monthlyRemediate')remediate(data.id);
  if(action==='monthlyComplete'&&monthlyPlan().kind==='NONE'){const next=PeriodicPractice.complete(current(),'monthly',Date.now());if(next&&commit(next))open('home');}
  return true;
 }
 return {home,page,handle,finishBiweekly,monthlyPlan,returned};
})();
