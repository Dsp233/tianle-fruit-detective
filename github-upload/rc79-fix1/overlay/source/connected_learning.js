'use strict';
// A correct local decision is preparation for application, not a mastery claim.
const ConnectedLearning=((M,P,S,reviews)=>{
 const copy=x=>JSON.parse(JSON.stringify(x));
 const R=typeof module!=='undefined'?require('./child_review_status'):ChildReviewStatus;
 const scaffolds=typeof module!=='undefined'?require('./task_scaffold_reviews.json'):window.__AMC8_TASK_SCAFFOLDS;
 const Evidence=typeof module!=='undefined'?require('./judgment_evidence'):JudgmentEvidence;
 const skillData=typeof module!=='undefined'?require('./skills.json'):window.__AMC8_SKILLS;
 const skillUnit=new Map(skillData.skills.map(skill=>[skill.id,skill.unitId]));
 const {problemSnapshot,taskSnapshot,definition}=R;
 function givenVisual(t,presented){
  const id=t.taskId||t.id,prompt=presented?.prompt||t.prompt;
  if(id==='RTM-2000-24-DECISION'&&prompt==='FA与FD反向，FG与FB同向，AFG=70°，BFD多少？')return 'afg-rays-70-v1';
  if(id==='RTM-2000-24-CONTRAST'&&prompt==='两角一组边反向、一组同向，能当对顶角相等吗？')return 'afg-rays-contrast-v1';
  return null;
 }
 function taskEvidenceKey(t,presented){const row=presented?null:R.review(M.getProblem(t.originProblemGroupId)).record?.tasks[t.taskId],d=presented||{...t,...row},visual=givenVisual(t,d);return M.canonical({task:taskSnapshot(t),presentedPrompt:d.prompt,presentedGivens:d.givenText||'',presentedOptions:d.options||t.options,presentedHints:d.hints,presentedFigures:d.givenFigures||[],presentedTable:d.givenTable||[],...(visual?{presentedGivenVisual:visual}:{})})}
 function review(p){
  return R.review(p);
 }
 function routeTopics(routeId){
  const route=M.data.routes[routeId];
  return [...new Set((route?.requiredKnowledge||[]).map(id=>skillUnit.get(id)).filter(Boolean))];
 }
 function focusPlans(prepared,profile){
  // Explicitly specified examination problems remain exact. When broader
  // topics were selected, use their direct knowledge rather than treating
  // arithmetic prerequisites as the only goal of every group.
  if((profile?.examIds||[]).length)return prepared;
  const focus=(profile?.topicIds||[]).filter(id=>id!=='A01'&&id!=='A02');
  if(!focus.length)return prepared;
  const selected=new Set(focus);
  return prepared.filter(plan=>(plan.focusTopics||routeTopics(plan.routeId)).some(id=>selected.has(id)));
 }
 function success(state,t,checked=null){
  checked=checked||R.review(M.getProblem(t.originProblemGroupId));if(!checked.eligible)return null;
  const key=taskEvidenceKey(t,{...t,...checked.record.tasks[t.taskId]}),mathKey=M.taskKey(t);
  const scaffold=scaffolds.entries[t.taskId],legacyKey=scaffold?.legacyReadinessPolicy==='EXACT_BASE_PREPARATION_ONLY'?taskEvidenceKey(t,scaffold.baseSnapshot.presentation):null;
  const row=S.events(state).find(e=>e.type==='response_submitted'&&e.evidenceScope!=='remediation_support_only'&&!e.diagnosticOf&&e.result?.outcome==='VERIFIED'&&(e.taskEvidenceKey===key||legacyKey&&e.taskEvidenceKey===legacyKey&&Evidence.task(t,e.input).outcome==='VERIFIED')&&e.taskId===t.taskId&&M.resolveMathKey(e.mathKey)===mathKey);
  if(!row)return null;
  const first=S.instance(state,mathKey).firstSubmission;
  return {taskId:t.taskId,eventId:row.eventId,attemptId:row.attemptId,firstSubmissionEventId:first?.eventId||null,firstCorrect:first?.result?.outcome==='VERIFIED',usedHelp:!!row.supportSnapshot?.methodHelpCount,...(row.taskEvidenceKey!==key?{legacyPresentationReuse:{scope:'exact_base_local_preparation_only',grantsNewScaffoldObservation:false,independent:false}}:{})};
 }
 function plans(originals,training,profile,history,state){
  const byId=new Map(training.map(t=>[t.id,t])),result=[];
  const bindingsByJudgment=new Map();for(const binding of Object.values(M.data.bindings)){const rows=bindingsByJudgment.get(binding.judgmentId)||[];rows.push(binding);bindingsByJudgment.set(binding.judgmentId,rows)}
  for(const c of originals){
   if(!P.check(c,history,'practice').eligible)continue;
   const p=M.getProblem(c.examId),checked=review(p);if(!checked.eligible)continue;
   const allowed=M.check(p,profile,history,'practice');if(!allowed.eligible)continue;
   const r=checked.record;
   for(const routeId of allowed.allowedRouteIds){
    const route=M.data.routes[routeId],ids=[];let valid=true;
    for(const judgmentId of route.judgmentIds){
     const binding=(bindingsByJudgment.get(judgmentId)||[]).find(b=>['PARTIAL_DECISION','FULL_STRUCTURE'].includes(b.matchLevel)&&!b.policyGaps?.length&&byId.has(b.taskRef.taskId)&&r.tasks[b.taskRef.taskId]&&M.data.tasks[b.taskRef.taskId].contentRevision===b.taskRef.contentRevision);
     if(!binding){valid=false;break}ids.push(binding.taskRef.taskId);
    }
    if(!valid||!route.integrationTaskIds.length)continue;
    ids.push(...route.counterexampleTaskIds,...route.integrationTaskIds);
    const taskIds=[...new Set(ids)];
    if(!taskIds.every(id=>byId.has(id)&&r.tasks[id]&&M.taskAllowed(M.data.tasks[id],profile).eligible))continue;
    const evidence=taskIds.map(id=>success(state,M.data.tasks[id],checked)).filter(Boolean);
    const pendingTaskIds=taskIds.filter(id=>!evidence.some(e=>e.taskId===id));
    // Solved duplicates may be excluded without importing an unreviewed
    // cross-task judgment correspondence as readiness evidence.
    if(pendingTaskIds.some(id=>!P.check(byId.get(id),history,'practice').eligible))continue;
    result.push({examId:p.examId,routeId,taskIds,pendingTaskIds,evidence,focusTopics:routeTopics(routeId),structureClusterId:p.structureClusterId,
     difficulty:route.requiredSkills.length+(p.problemNumber||0),candidate:{...c,definition:definition(c,r)},
     training:taskIds.map(id=>({...byId.get(id),definition:definition(byId.get(id),r.tasks[id])}))});
   }
  }
  return result;
 }
 function next(originals,training,profile,history,state,group){
  return nextFromPlans(plans(originals,training,profile,history,state),group);
 }
 function nextFromPlans(prepared,group){
  const candidates=prepared.filter(p=>!(group.deferredExamIds||[]).includes(p.examId)&&(!group.retryTarget||p.examId===group.retryTarget.examId&&p.routeId===group.retryTarget.routeId));
  let plan=candidates.find(p=>p.examId===group.target?.examId&&p.routeId===group.target.routeId);
  if(!plan){
   const covered=new Set(group.coveredFocusTopics||[]),selected=new Set(group.profileSnapshot?.topicIds||[]);
   const newFocus=plan=>(plan.focusTopics||routeTopics(plan.routeId)).filter(id=>selected.has(id)&&!covered.has(id)&&id!=='A01'&&id!=='A02').length;
   candidates.sort((a,b)=>(newFocus(b)-newFocus(a))||(a.pendingTaskIds.length-b.pendingTaskIds.length)||
    (Number(a.structureClusterId===group.lastStructure)-Number(b.structureClusterId===group.lastStructure))||a.difficulty-b.difficulty||a.examId.localeCompare(b.examId));
   plan=candidates[0];
  }
  if(!plan)return {candidate:null,reasonCodes:['NO_REVIEWED_CONNECTED_SUPPLY']};
  const target={examId:plan.examId,routeId:plan.routeId,taskIds:plan.taskIds};
  if(plan.pendingTaskIds.length){
   const candidate=plan.training.find(t=>t.id===plan.pendingTaskIds[0]);
   return {candidate,mode:'training',stage:candidate.definition.role,target,readiness:null};
  }
  return {candidate:plan.candidate,mode:'practice',stage:'application',target,
   readiness:{kind:'prepared_application',routeId:plan.routeId,evidence:copy(plan.evidence),independentHoldout:false}};
 }
 function targetSnapshot(target){
  const p=M.getProblem(target?.examId),checked=review(p);if(!checked.eligible||!p.routeIds.includes(target.routeId)||!Array.isArray(target.taskIds))return null;
  return M.canonical({problem:problemSnapshot(p),review:checked.record,route:M.data.routes[target.routeId],tasks:target.taskIds.map(id=>M.data.tasks[id]&&taskSnapshot(M.data.tasks[id]))});
 }
 function defer(group,attempt,reason){
  const target=group.target,snapshot=targetSnapshot(target);if(!snapshot)return group;
  const descriptor={deferredId:group.groupId+':'+attempt.attemptId,sourceGroupId:group.groupId,sourceAttemptId:attempt.attemptId,
   failedTaskId:attempt.id,mappingBuildId:group.mappingBuildId,target:copy(target),targetSnapshot:snapshot,reason,createdAt:Date.now()};
  group.deferredTargets??=[];
  if(!group.deferredTargets.some(d=>d.deferredId===descriptor.deferredId))group.deferredTargets.push(descriptor);
  group.deferredExamIds=[...new Set([...(group.deferredExamIds||[]),target.examId])];group.target=null;return group;
 }
 function deferredPlan(descriptor,originals,training,profile,history,state){
  const groups=[...(state?.sessions.connectedArchive||[]),state?.sessions.connected].filter(Boolean),source=groups.find(g=>g.groupId===descriptor?.sourceGroupId);
  const recorded=source?.deferredTargets?.find(d=>d.deferredId===descriptor?.deferredId),attempt=[...(state?.sessions.archived||[]),state?.sessions.active].find(a=>a?.attemptId===descriptor?.sourceAttemptId);
  if(!recorded||M.canonical(recorded)!==M.canonical(descriptor)||!attempt||attempt.connectedGroupId!==source.groupId||!source.attemptIds.includes(attempt.attemptId)||descriptor.failedTaskId!==attempt.id||!['LEARNER_DEFERRED','GROUP_LIMIT'].includes(descriptor.reason))return {plan:null,reason:'DEFERRED_RECORD_INVALID'};
  const finished=S.attempt(state,attempt.attemptId).events.find(e=>e.type==='attempt_finished');
  if(!finished||descriptor.reason==='LEARNER_DEFERRED'&&finished.reason!=='skipped'||descriptor.reason==='GROUP_LIMIT'&&source.attemptIds.length!==source.total)return {plan:null,reason:'DEFERRED_RECORD_INVALID'};
  if(descriptor.mappingBuildId!==M.data.mappingBuildId||descriptor.targetSnapshot!==targetSnapshot(descriptor.target))return {plan:null,reason:'DEFERRED_CONTENT_CHANGED'};
  const plan=plans(originals,training,profile,history,state).find(p=>p.examId===descriptor.target.examId&&p.routeId===descriptor.target.routeId&&M.canonical(p.taskIds)===M.canonical(descriptor.target.taskIds));
  return plan?{plan,reason:null}:{plan:null,reason:'DEFERRED_TARGET_OUTSIDE_CURRENT_SCOPE_OR_SUPPLY'};
 }
 function freshGroup(profile,seed=1){return {schemaVersion:1,groupId:'connected-'+Date.now()+'-'+Math.random().toString(36).slice(2,10),mappingBuildId:M.data.mappingBuildId,profileSnapshot:copy(profile),total:10,attemptIds:[],deferredExamIds:[],deferredTargets:[],target:null,lastStructure:null,status:'active',seed,startedAt:Date.now()}}
 function coverage(){return R.coverage()}
 return {problemSnapshot,taskSnapshot,definition,taskEvidenceKey,givenVisual,review,success,plans,focusPlans,routeTopics,next,nextFromPlans,targetSnapshot,defer,deferredPlan,freshGroup,coverage};
})(typeof module!=='undefined'?require('./exam_mapping'):ExamMapping,typeof module!=='undefined'?require('./transfer_policy'):TransferPolicy,typeof module!=='undefined'?require('./transfer_evidence_store'):TransferEvidenceStore,typeof module!=='undefined'?require('./child_form_reviews.json'):window.__AMC8_CHILD_FORMS);
if(typeof module!=='undefined')module.exports=ConnectedLearning;
