'use strict';
// One projection serves delivery, parent counts and exported audit tables.
const ChildReviewStatus=(()=>{
 const Scaffolds=typeof module!=='undefined'?require('./task_scaffold_review'):TaskScaffoldReview;
 const scaffoldRegistry=typeof module!=='undefined'?require('./task_scaffold_reviews.json'):window.__AMC8_TASK_SCAFFOLDS;
 const routeKeys=['routeId','examId','routeRevision','requiredKnowledge','requiredSkills','policyGaps','judgmentIds','integrationTaskIds','counterexampleTaskIds'];
 const bindingKeys=['bindingId','examId','judgmentId','taskRef','role','matchLevel','policyGaps','evidenceScope'];
 const canonical=x=>x===null||typeof x!=='object'?JSON.stringify(x):Array.isArray(x)?'['+x.map(canonical).join(',')+']':'{'+Object.keys(x).sort().map(k=>JSON.stringify(k)+':'+canonical(x[k])).join(',')+'}';
 const fields=(x,keys)=>Object.fromEntries(keys.filter(k=>k in x).map(k=>[k,x[k]]));
 const clone=x=>JSON.parse(JSON.stringify(x));
 function label(checked){
  if(checked?.status==='REVIEWED')return '题目形式已审通过';
  if(checked?.status==='REVIEWED_RESTRICTED')return '题目形式已审受限'+(checked.record?.restrictionReason?'：'+checked.record.restrictionReason:'');
  if(checked?.status==='STALE')return '题目形式变更需复审';
  if(checked?.status==='UNMAPPED')return '映射待核验';
  return '题目形式待审';
 }
 function recipePresentationSnapshot(p){
  try{
   const C=typeof module!=='undefined'?require('./competition_reviewed'):null,D=typeof module!=='undefined'?require('./competition_content_contracts'):CompetitionContentContracts;
   const t=C?C.competitionCreate(p.recipe):competitionCreate(p.recipe),d=D.resolve(t);
   return clone({recipe:t.competition.recipe,math:t.competition.math,presentation:d,diagram:t.competition.diagram||null});
  }catch{return {invalidRecipe:true}}
 }
 function create(data,reviews,options={}){
  const scaffolds=Scaffolds.create(data,reviews,options.scaffoldReviews||scaffoldRegistry);
  let taskIndex=null,taskCount=-1;
  let reviewSnapshot=null;
  // Cache within this synchronous read only. The next operation revalidates
  // source content, approvals, routes, bindings and available assets.
  function withReviewSnapshot(read){if(reviewSnapshot)return read();reviewSnapshot=new Map();try{return read()}finally{reviewSnapshot=null}}
  function taskIds(eid){const count=Object.keys(data.tasks).length;if(taskCount!==count){taskIndex={};for(const t of Object.values(data.tasks))(taskIndex[t.originProblemGroupId]??=[]).push(t.taskId);taskCount=count}return (taskIndex[eid]||[]).slice().sort()}
  function problemSnapshot(p){return {examId:p.examId,mathFacts:p.mathFacts||p.facts||null,answerContract:p.answerContract,presentation:p.presentation||null,recipe:p.recipe||null,...(p.sourceCorrection?{sourceCorrection:p.sourceCorrection}:{}),...(p.recipe?{recipePresentation:recipePresentationSnapshot(p)}:{}),load:p.load||null,routeIds:p.routeIds,routes:p.routeIds.map(id=>fields(data.routes[id],routeKeys)),bindings:p.trainingBindingIds.map(id=>fields(data.bindings[id],bindingKeys))}}
  function taskSnapshot(t){return fields(t,['taskId','contentRevision','prompt','answerContract','mathFacts','requiredKnowledge','role','load','options','hints','givenText','givenFigures','givenTable'])}
  function definition(candidate,row){const result=clone(candidate.definition);for(const key of ['prompt','givenText','givenFigures','givenTable','options','hints','renderingMode'])if(row[key]!==undefined)result[key]=clone(row[key]);return result}
  function assetReady(f){
   if(options.assetReady)return options.assetReady(f);
   if(typeof window!=='undefined')return !!window.__AMC8_SOURCE_FIGURES?.[f.sha256];
   if(options.checkFiles){try{const fs=require('fs'),path=require('path'),crypto=require('crypto'),root=path.resolve(__dirname,'..'),target=path.resolve(root,f.path);return target.startsWith(root+'/source/content/')&&crypto.createHash('sha256').update(fs.readFileSync(target)).digest('hex')===f.sha256}catch{return false}}
   return true;
  }
  function evaluate(p){
   if(!p)return {eligible:false,status:'UNMAPPED',reasonCodes:['MAPPING_REVIEW_PENDING']};
   const r=reviews.problems[p.examId];
   if(!r||!['REVIEWED','REVIEWED_RESTRICTED'].includes(r.status))return {eligible:false,status:'PENDING',reasonCodes:['CHILD_FORM_REVIEW_PENDING']};
   if(canonical(problemSnapshot(p))!==canonical(r.problemSnapshot))return {eligible:false,status:'STALE',reasonCodes:['CHILD_FORM_REVIEW_STALE']};
   if(canonical(taskIds(p.examId))!==canonical(Object.keys(r.tasks||{}).sort()))return {eligible:false,status:'STALE',reasonCodes:['CHILD_TASK_SET_CHANGED']};
   for(const [id,row] of Object.entries(r.tasks))if(!data.tasks[id]||canonical(taskSnapshot(data.tasks[id]))!==canonical(row.taskSnapshot))return {eligible:false,status:'STALE',reasonCodes:['CHILD_TASK_REVIEW_STALE']};
   if(r.status==='REVIEWED_RESTRICTED')return {eligible:false,status:'REVIEWED_RESTRICTED',reasonCodes:['CHILD_FORM_REVIEW_RESTRICTED'],record:r};
   for(const row of [{...p.presentation,...r},...Object.values(r.tasks)])if((row.givenFigures||[]).some(f=>!assetReady(f)))return {eligible:false,status:'STALE',reasonCodes:['CHILD_FORM_ASSET_MISSING_OR_CHANGED']};
   const scaffold=scaffolds.project(p,r);
   if(!scaffold.ok)return {eligible:false,status:'STALE',reasonCodes:[scaffold.reason]};
   return {eligible:true,status:'REVIEWED',reasonCodes:[],record:scaffold.record};
  }
  function review(p){if(reviewSnapshot?.has(p))return reviewSnapshot.get(p);const checked=evaluate(p);if(reviewSnapshot)reviewSnapshot.set(p,checked);return checked}
  function projection(){return Object.keys(data.registeredProblems).sort().map(eid=>{const registered=data.registeredProblems[eid],checked=review(data.problems[eid]);return {examId:eid,mappingVerification:registered.status.verificationStatus,mappingRuntimeStatus:registered.status.runtimeStatus,childFormStatus:checked.status,automaticPoolCandidate:checked.eligible&&registered.status.runtimeStatus==='eligible',reasonCode:checked.reasonCodes.join(';')||'REVIEWED',restrictionReason:checked.record?.restrictionReason||''}})}
  function coverage(){const rows=projection(),count=status=>rows.filter(r=>r.childFormStatus===status).length;return {registered:rows.length,unmapped:count('UNMAPPED'),mapped:Object.keys(data.problems).length,reviewed:count('REVIEWED'),restricted:count('REVIEWED_RESTRICTED'),stale:count('STALE'),pending:count('PENDING'),assessed:count('REVIEWED')+count('REVIEWED_RESTRICTED')}}
  return {problemSnapshot,taskSnapshot,definition,review,projection,coverage,withReviewSnapshot};
 }
 const value=typeof module!=='undefined'?create(require('./exam_runtime_index.json'),require('./child_form_reviews.json'),{checkFiles:true}):create(window.__AMC8_EXAM_MAPPING,window.__AMC8_CHILD_FORMS);
 return {...value,create,recipePresentationSnapshot,label};
})();
if(typeof module!=='undefined')module.exports=ChildReviewStatus;

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
 function deferredPlan(descriptor,originals,training,profile,history,state,preparedPlans=null){
  const groups=[...(state?.sessions.connectedArchive||[]),state?.sessions.connected].filter(Boolean),source=groups.find(g=>g.groupId===descriptor?.sourceGroupId);
  const recorded=source?.deferredTargets?.find(d=>d.deferredId===descriptor?.deferredId),attempt=[...(state?.sessions.archived||[]),state?.sessions.active].find(a=>a?.attemptId===descriptor?.sourceAttemptId);
  if(!recorded||M.canonical(recorded)!==M.canonical(descriptor)||!attempt||attempt.connectedGroupId!==source.groupId||!source.attemptIds.includes(attempt.attemptId)||descriptor.failedTaskId!==attempt.id||!['LEARNER_DEFERRED','GROUP_LIMIT'].includes(descriptor.reason))return {plan:null,reason:'DEFERRED_RECORD_INVALID'};
  const finished=S.attempt(state,attempt.attemptId).events.find(e=>e.type==='attempt_finished');
  if(!finished||descriptor.reason==='LEARNER_DEFERRED'&&finished.reason!=='skipped'||descriptor.reason==='GROUP_LIMIT'&&source.attemptIds.length!==source.total)return {plan:null,reason:'DEFERRED_RECORD_INVALID'};
  if(!M.compatibleBuild(descriptor.mappingBuildId)||descriptor.targetSnapshot!==targetSnapshot(descriptor.target))return {plan:null,reason:'DEFERRED_CONTENT_CHANGED'};
  const plan=(preparedPlans||plans(originals,training,profile,history,state)).find(p=>p.examId===descriptor.target.examId&&p.routeId===descriptor.target.routeId&&M.canonical(p.taskIds)===M.canonical(descriptor.target.taskIds));
  return plan?{plan,reason:null}:{plan:null,reason:'DEFERRED_TARGET_OUTSIDE_CURRENT_SCOPE_OR_SUPPLY'};
 }
 function freshGroup(profile,seed=1){return {schemaVersion:1,groupId:'connected-'+Date.now()+'-'+Math.random().toString(36).slice(2,10),mappingBuildId:M.data.mappingBuildId,profileSnapshot:copy(profile),total:10,attemptIds:[],deferredExamIds:[],deferredTargets:[],target:null,lastStructure:null,status:'active',seed,startedAt:Date.now()}}
 function coverage(){return R.coverage()}
 return {problemSnapshot,taskSnapshot,definition,taskEvidenceKey,givenVisual,review,success,plans,focusPlans,routeTopics,next,nextFromPlans,targetSnapshot,defer,deferredPlan,freshGroup,coverage};
})(typeof module!=='undefined'?require('./exam_mapping'):ExamMapping,typeof module!=='undefined'?require('./transfer_policy'):TransferPolicy,typeof module!=='undefined'?require('./transfer_evidence_store'):TransferEvidenceStore,typeof module!=='undefined'?require('./child_form_reviews.json'):window.__AMC8_CHILD_FORMS);
if(typeof module!=='undefined')module.exports=ConnectedLearning;


;
'use strict';
const ExamDiagnostics=((M,R,registry)=>{
 const copy=x=>JSON.parse(JSON.stringify(x));
 function presentation(d){return Object.fromEntries(['taskId','prompt','givenText','givenFigures','givenTable','answerContract','options','hints','auxiliaryFigure','grantsJudgmentEvidence'].map(k=>[k,d[k]??(['givenFigures','givenTable','options'].includes(k)?[]:k==='givenText'?'':null)]))}
 function snapshot(parentId,probeTaskId,judgmentId){
  const parentTask=M.data.tasks[parentId],p=M.getProblem(parentTask?.originProblemGroupId||parentId),probe=M.data.tasks[probeTaskId];
  if(!p||!probe||probe.originProblemGroupId!==p.examId||!p.judgmentIds.includes(judgmentId))return null;
  const checked=R.review(p);if(!checked.eligible)return null;const r=checked.record;
  const parentDefinition=parentTask?R.definition({definition:parentTask},r.tasks[parentId]):{taskId:p.examId,...p.presentation,...r,answerContract:p.answerContract,grantsJudgmentEvidence:false,auxiliaryFigure:null};
  return {problem:R.problemSnapshot(p),reviewedProblem:r,parentTask:parentTask?R.taskSnapshot(parentTask):null,
   probeTask:R.taskSnapshot(probe),judgment:Object.fromEntries(['judgmentId','examId','judgmentTypeId','diagnosticProbeTaskId','evidenceScope','decision','reviewIdentity'].map(k=>[k,M.data.judgments[judgmentId][k]])),
   parentPresentation:presentation(parentDefinition),probePresentation:presentation(R.definition({definition:probe},r.tasks[probeTaskId]))};
 }
 function review(link){
  if(link?.status!=='REVIEWED'||link.scope!=='SUPPORT_ONLY_RETURN_TO_PARENT'||link.parentId===link.probeTaskId)return {eligible:false,reason:'REMEDIATION_REVIEW_PENDING'};
  const current=snapshot(link.parentId,link.probeTaskId,link.judgmentId);
  return current&&M.canonical(current)===M.canonical(link.snapshot)?{eligible:true,link}:{eligible:false,reason:'REMEDIATION_REVIEW_STALE'};
 }
 function choose(parent,tasks,allowedRouteIds,history){
  for(const link of registry.links||[]){
   if(link.parentId!==parent.id||!review(link).eligible||!allowedRouteIds.includes(link.routeId))continue;
   const probe=tasks.find(t=>t.id===link.probeTaskId);if(!probe||history.exposedMathKeys.includes(probe.mathKey)||history.solvedMathKeys.includes(probe.mathKey))continue;
   if(M.canonical(presentation(parent.definition))!==M.canonical(link.snapshot.parentPresentation)||M.canonical(presentation(probe.definition))!==M.canonical(link.snapshot.probePresentation))continue;
   return {link:copy(link),candidate:{...copy(probe),definition:{...copy(probe.definition),grantsJudgmentEvidence:false}}};
  }
  return null;
 }
 function propose(attempt){
  const evidence=attempt?.judgmentEvidence||[];
  if(!evidence.length)return {certainty:'insufficient',hypotheses:[],probes:[],message:'目前只有终答，先观察一道简短的新任务再判断原因。'};
  const failed=evidence.filter(e=>e.outcome==='INCORRECT'),unknown=evidence.filter(e=>e.outcome==='UNRECOGNIZED');
  return {certainty:failed.length?'observed':'insufficient',hypotheses:failed.map(e=>({judgmentId:e.judgmentId,claim:'本次局部判断尚未通过',scope:'this_instance_only'})),probes:[...new Set(failed.map(e=>e.probeTaskId).filter(Boolean))],unknownCount:unknown.length,changesDeclaredKnowledge:false};
 }
 return {propose,presentation,snapshot,review,choose};
})(typeof module!=='undefined'?require('./exam_mapping'):ExamMapping,typeof module!=='undefined'?require('./child_review_status'):ChildReviewStatus,typeof module!=='undefined'?require('./remediation_reviews.json'):window.__AMC8_REMEDIATION_REVIEWS);
if(typeof module!=='undefined')module.exports=ExamDiagnostics;


;

;
'use strict';
// Read-only projection. No entry point rewrites old attempts or awards mastery.
const JointReuseReview=(()=>{
 const copy=x=>JSON.parse(JSON.stringify(x)),same=(a,b)=>M.canonical(a)===M.canonical(b);
 const M=typeof module!=='undefined'?require('./exam_mapping'):ExamMapping,R=typeof module!=='undefined'?require('./child_review_status'):ChildReviewStatus;
 const baselineUiHashes={'index.template.html':'9dde809a2712423ef18cf52d2443802d157df0b0c1a39b10cc8fae08a7e32c36','selection_diagnostics.js':'540382e8d169d2f304502e9ad8fd8b0fa418f9670d5cabf64fc9f69b9c2ef8ac'};
 function compatibleUiHashes(current,approved){
  if(same(current,approved))return true;
  const release=typeof module!=='undefined'?require('./version.json'):window.__AMC8_RELEASE,allowed=release?.jointReuseCompatibleUiHashes;
  if(release?.compatibleMappingSemanticSha256!=='f55f248abb8f46e201ead1d35a20598e387484f93a49874123d80f2513b37839'||!allowed||!current||!approved)return false;
  const keys=new Set([...Object.keys(current),...Object.keys(approved)]);
  return [...keys].every(key=>current[key]===approved[key]||Object.hasOwn(baselineUiHashes,key)&&approved[key]===baselineUiHashes[key]&&current[key]===allowed[key]);
 }
 function create(config){
  const {mapping,joint,baseline,registry,tasks,contracts,sourceHashes}=config,reviewer=R.create(mapping,config.childReviews,config.reviewOptions||{}),byId=new Map(joint.families.map(f=>[f.id,f]));
  function snapshot(familyId,targets=[]){
   const f=byId.get(familyId),b=baseline.families.find(f=>f.familyId===familyId);if(!f||!b||!same(b.instanceIds,f.instances.map(t=>t.id))||f.primarySkillId!==b.primarySkillId||config.nativeCacheCurrent===false||config.capturedFamilies&&!same(config.capturedFamilies[familyId],f))return null;
   if(b.instanceIds.some(id=>!tasks[id]||!contracts[id]))return null;
   const targetRows=[];
   for(const target of targets){
    const t=mapping.tasks[target.taskId],p=t&&mapping.problems[t.originProblemGroupId],checked=reviewer.review(p),j=mapping.judgments[target.judgmentId];
    const binding=Object.values(mapping.bindings).find(b=>b.judgmentId===target.judgmentId&&b.taskRef.taskId===target.taskId&&b.taskRef.contentRevision===t?.contentRevision&&['PARTIAL_DECISION','FULL_STRUCTURE'].includes(b.matchLevel)&&!b.policyGaps?.length);
    if(!checked.eligible||!j||j.examId!==p.examId||!mapping.routes[target.routeId]?.judgmentIds.includes(j.judgmentId)||!binding)return null;
    targetRows.push({target,problem:reviewer.problemSnapshot(p),review:checked.record,task:reviewer.taskSnapshot(t),judgmentIdentity:j.reviewIdentity});
   }
   return copy({family:f,tasks:Object.fromEntries(b.instanceIds.map(id=>[id,tasks[id]])),contracts:Object.fromEntries(b.instanceIds.map(id=>[id,contracts[id]])),sourceHashes,targets:targetRows});
  }
  function review(familyId){
   const row=registry.families[familyId];if(!row||row.status!=='REVIEWED')return {eligible:false,status:'REVIEW_REQUIRED',matchLevel:'NO_MATCH',reason:'尚未记录逐实例的语义审核'};
   const ids=baseline.families.find(f=>f.familyId===familyId)?.instanceIds;
   if(!['FOUNDATION_ONLY','PARTIAL_DECISION'].includes(row.matchLevel)||!Array.isArray(row.targets)||row.matchLevel==='FOUNDATION_ONLY'&&row.targets.length||row.matchLevel==='PARTIAL_DECISION'&&!row.targets.length||!ids||!same(Object.keys(row.instanceReviews||{}).sort(),ids.slice().sort())||ids.some(id=>typeof row.instanceReviews[id]!=='string'||!row.instanceReviews[id])||!row.reviewNote)return {eligible:false,status:'STALE',matchLevel:'NO_MATCH',reason:'审核结论或适用范围不合法'};
   const current=snapshot(familyId,row.targets);
   const comparable=current&&row.snapshot&&compatibleUiHashes(current.sourceHashes,row.snapshot.sourceHashes)?{...current,sourceHashes:row.snapshot.sourceHashes}:current;
   if(!comparable||!same(comparable,row.snapshot))return {eligible:false,status:'STALE',matchLevel:'NO_MATCH',reason:'原题族、实际任务、判分来源或对应真题变化，需复审'};
   if(row.targets.some(t=>t.scope!=='LEGACY_LOCAL_PREPARATION_ONLY'||!t.instanceIds.length||t.instanceIds.some(id=>!current.tasks[id])))return {eligible:false,status:'STALE',matchLevel:'NO_MATCH',reason:'复用范围未锁定到已审实例'};
   return {eligible:row.matchLevel==='PARTIAL_DECISION',status:'REVIEWED',matchLevel:row.matchLevel,reason:row.reviewNote,record:row};
  }
  function projection(){return baseline.families.map(b=>{const r=review(b.familyId);return {...b,candidateExamRouteIds:Object.values(mapping.routes).filter(r=>r.requiredKnowledge.includes(b.primarySkillId)).map(r=>r.routeId),status:r.status,matchLevel:r.matchLevel,reason:r.reason,targets:r.record?.targets||[],instanceReviews:r.record?.instanceReviews||{}}})}
  function matches(record,t,contract){
   const f=record?.jointFacts,s=t.joint,eq=(a,b)=>Array.isArray(a)&&same(a,b);
   return record?.pendingSave!==true&&!!f&&record.evidenceVersion===2&&record.evidenceRuleVersion===contract.evidenceRuleVersion&&record.evidenceScope===contract.evidenceScope&&record.assessmentType===contract.assessmentType&&record.formalEligible===contract.formalEligible&&record.contentVersion===t.contentVersion&&record.gradingResult==='correct'&&Number.isFinite(record.submittedAt)&&record.submittedAt>0&&typeof record.id==='string'&&typeof record.modelViewed==='boolean'&&Array.isArray(record.hintEvents)&&typeof record.firstSubmissionCorrect==='boolean'&&f.familyId===s.familyId&&f.kind===s.kind&&eq(f.targetNodeIds,s.targetNodeIds)&&eq(record.skillIds,s.targetNodeIds)&&eq(f.supportNodeIds,s.supportNodeIds)&&eq(f.relationIds,s.relationIds)&&f.nativeAnchorPassed===true&&f.supportAnchorPassed===true&&f.signature===contract.signature;
  }
  function readLegacy(records){
   const grants=[],seen=new Set();
   const byId=new Map(),conflicts=new Set();
   for(const record of records||[]){if(!record||typeof record.id!=='string')continue;if(byId.has(record.id)&&!same(byId.get(record.id),record))conflicts.add(record.id);else byId.set(record.id,record)}
   for(const record of byId.values()){
    if(conflicts.has(record.id))continue;
    const t=tasks[record?.taskInstanceId];if(!t)continue;const checked=review(t.joint.familyId);if(!checked.eligible||!matches(record,t,contracts[t.id]))continue;
    for(const target of checked.record.targets){
     if(!target.instanceIds.includes(t.id))continue;const key=record.id+':'+target.taskId;if(seen.has(key))continue;seen.add(key);
     grants.push({familyId:t.joint.familyId,taskInstanceId:t.id,sourceRecordId:record.id,sourceSubmittedAt:record.submittedAt,sourceUsedHelp:record.modelViewed===true||!!record.hintEvents?.length,sourceFirstResponseCorrect:record.firstSubmissionCorrect===true,targetTaskId:target.taskId,judgmentId:target.judgmentId,routeId:target.routeId,matchLevel:'PARTIAL_DECISION',evidenceScope:'legacy_local_preparation_only',readOnly:true,independent:false,holdout:false,grantsMastery:false});
    }
   }
   return grants;
  }
  return {snapshot,review,projection,readLegacy,matches};
 }
 let config;
 if(typeof module!=='undefined'){
  const fs=require('fs'),path=require('path'),cp=require('child_process'),native=require('./joint_native_snapshot.json'),joint=require('./joint_families.json');
  const hashes=JSON.parse(cp.execFileSync('python3',[path.join(__dirname,'native_reuse_inputs.py')],{encoding:'utf8'}));
  const {captureIdentity,...payload}=native;if(Object.keys(native.tasks).length&&require('crypto').createHash('sha256').update(M.canonical(payload)).digest('hex')!==captureIdentity)throw Error('Native capture identity changed; rebuild the bundle and run capture_joint_reuse.js');
  config={mapping:M.data,joint,baseline:require('./joint_reuse_baseline_95.json'),registry:require('./joint_reuse_reviews.json'),childReviews:require('./child_form_reviews.json'),tasks:native.tasks,contracts:native.contracts,sourceHashes:hashes,nativeCacheCurrent:compatibleUiHashes(hashes,native.sourceHashes),capturedFamilies:native.families,reviewOptions:{checkFiles:true}};
 }else config={mapping:M.data,joint:JOINT_CONTENT,baseline:window.__AMC8_REUSE_BASELINE,registry:window.__AMC8_REUSE_REVIEWS,childReviews:window.__AMC8_CHILD_FORMS,tasks:copy(JOINT_TASKS),contracts:Object.fromEntries(Object.values(JOINT_TASKS).map(t=>[t.id,{...assessmentEvidenceContext(t,{view:'joint'}),evidenceRuleVersion:ASSESSMENT_RULES.version,signature:jointMathSignature(t)}])),sourceHashes:window.__AMC8_REUSE_SOURCE_HASHES};
 return {...create(config),create,config};
})();
if(typeof module!=='undefined')module.exports=JointReuseReview;

'use strict';
// Every value in the public prompt is a given. Derived quantities stay in the
// private answer/route contract until the learner verifies a relation or asks.
const CompetitionIntegrated=(()=>{
 const config={integratedWeightedPlan:['mean-admission','score-training'],integratedRatioPlan:['length-border','perimeter-fence']};
 const skillSets={
  'mean-admission':['R01.01','D02.02','A02.01','A02.04','A02.05','C02.03','N01.02','A01.04'],
  'score-training':['R01.01','D02.02','A02.01','A02.04','A02.05','C02.03','A01.04','N01.02'],
  'length-border':['R01.01','R01.05','G01.02','G01.03','A02.01','A02.04','A02.05','A03.02','A03.04','N01.02'],
  'perimeter-fence':['R01.01','R01.05','G01.02','A02.01','A02.04','A02.05','C02.03','N01.02','A01.04']
 };
 const catalog=Object.entries(config).map(([id,configurations])=>({id,integrated:true,configurations,title:id==='integratedWeightedPlan'?'积分与活动规划':'尺寸与采购规划',topicIds:id==='integratedWeightedPlan'?['R01','D02','A02','C02','N01']:['R01','G01','A02','A03','C02','N01'],level:3,reasoningKey:id,strategy:id,origin:'rc70-integrated',selectionLoads:{calculationLoad:{level:2,operations:8,enumeration:12,fractional:false,digits:4},readingLoad:{level:3}}}));
 const ceilDiv=(n,d)=>Math.floor((n+d-1)/d);
 function purchase(need,pack=5,bundle=70,single=15){const rows=[];for(let b=0;b<=Math.ceil(need/pack);b++){const s=Math.max(0,need-b*pack);rows.push({b,s,cost:b*bundle+s*single,bought:b*pack+s})}return rows.sort((a,b)=>a.cost-b.cost||a.bought-b.bought)[0]}
 function data(kind,seed){
  const n=(seed-1)%5,N=30+5*n,offset=2*n,red=N*2/5,blue=N*3/5,low=60+offset,high=80+offset,total=red*low+blue*high;
  if(kind==='mean-admission'){
   const target=75+offset,score=90+offset,limit=N+10,rows=[];for(let x=0;x<=limit;x++)if(total+score*x>=target*(N+x))rows.push({x,packs:ceilDiv((N+x)*4,8),cost:ceilDiv((N+x)*4,8)*18});const best=rows[0];
   return {math:{N,red,blue,low,high,total,target,score,cap:best.x+4},prompt:`红蓝两队共${N}人，人数比2:3，每人平均得分分别为${low}、${high}。最多增加${best.x+4}名平均得分${score}的新成员，使全体平均分至少${target}。活动给每人4份材料，每包8份、18元，只能整包买。最少材料费多少元？`,answer:best.cost,variation:{prompt:`其余条件不变，但最多只能增加${best.x-1}人。若仍能达到平均分目标，填最少材料费；无法达到则填0。`,answer:0,key:'cap-feasibility-v1',parameters:{cap:best.x-1}},nodes:[['counts','红蓝两队分别有多少人？先填写红队人数。',red,'人',[],`${N}*2/(2+3)`],['total','按实际人数合计原来的总分。',total,'分',['counts'],`${red}*${low}+${blue}*${high}`],['admission','列出允许的新人数，最少加几人才能达到目标？',best.x,'人',['total'],'bounded-admission-table'],['materials','应为新整体准备多少份材料？',(N+best.x)*4,'份',['admission'],`(${N}+${best.x})*4`],['packages','满足材料量至少需多少整包？',best.packs,'包',['materials'],'whole-pack-ceiling'],['target','计算费用，并检查增加人数会不会降低采购需求。',best.cost,'元',['packages'],'minimum-feasible-purchase']]};
  }
  if(kind==='score-training'){
   const mean=72+offset,target=75+offset,deficit=target*N-total,rows=[];for(let g=0;g<=2;g++)for(let y=0;y<=red-3*g;y++)if(g*30+y*20>=deficit)rows.push({g,y,cost:g*16+y*12,people:g*3+y});const best=[...rows].sort((a,b)=>a.cost-b.cost)[0],budget=Math.max(60,best.cost+12),v=Math.min(...rows.filter(x=>x.cost<=budget).map(x=>x.people));
   return {math:{N,red,blue,low,high,total,mean,target,deficit},prompt:`红蓝两队共${N}人，人数比2:3，蓝队均分${high}，全体均分${mean}；红队每人原成绩相同。只培训红队，要求全体均分至少${target}。个人班每人12元，使该人成绩达到${80+offset}；三人班每组16元，使每人成绩达到${70+offset}，最多2组。每人只能参加一种。最少费用多少元？`,answer:best.cost,variation:{prompt:`培训规则不变，改问：总预算${budget}元以内，至少培训多少名红队成员能达成目标？`,answer:v,key:'min-people-with-budget-v1',parameters:{budget}},nodes:[['red-count','先确定红队人数。',red,'人',[],`${N}*2/5`],['red-score','从全体和蓝队总分反求红队每人的原成绩。',low,'分',['red-count'],`(${N}*${mean}-${blue}*${high})/${red}`],['deficit','全体至少还需要增加多少总分？',deficit,'分',['red-score'],`${N}*${target}-${total}`],['personal-gain','个人班每人增加多少分？',20,'分',['red-score'],`${80+offset}-${low}`],['group-gain','三人班每组增加多少总分？',30,'分',['red-score'],`3*(${70+offset}-${low})`],['target','枚举0、1、2个三人班，并检查人数限制，选最低费用。',best.cost,'元',['deficit','personal-gain','group-gain'],'bounded-training-optimization']]};
  }
  if(kind==='length-border'){
   const L=12+3*n,W=8+2*n,border=1+n%2,area=L*W-(L-2*border)*(W-2*border),tiles=area*4,packs=ceilDiv(tiles,10),price=25+n,budget=packs*price;let maxBorder=0;for(let b=1;2*b<W;b++)if(ceilDiv((L*W-(L-2*b)*(W-2*b))*4,10)*price<=budget)maxBorder=b;
   return {math:{L,W,perimeter:2*(L+W),border,area,tiles,packs,price},prompt:`长方形长宽比3:2，周长${2*(L+W)}米。沿内部四边铺${border}米宽边框，每块砖覆盖0.25平方米，每包10块、${price}元，只能整包买，忽略切割损耗。最少费用多少元？`,answer:budget,variation:{prompt:`长方形、砖和价格不变，总预算${budget}元。边框宽度必须为正整数米，且中央留下的长宽均大于0；边框最宽多少米？`,answer:maxBorder,key:'budget-to-width-v1',parameters:{budget}},nodes:[['side-sum','先求一条长与一条宽的和。',L+W,'米',[],`${2*(L+W)}/2`],['width','利用同一份比例，求宽。',W,'米',['side-sum'],`${L+W}/5*2`],['area','外面积减内部未铺部分，边框面积是多少？',area,'平方米',['width'],`${L}*${W}-(${L}-2*${border})*(${W}-2*${border})`],['tiles','单位面积换算后需要多少块砖？',tiles,'块',['area'],`${area}/0.25`],['packages','完整包装限制下至少买几包？',packs,'包',['tiles'],'whole-pack-ceiling'],['target','给出最少费用，核对单位与角部是否重算。',budget,'元',['packages'],`${packs}*${price}`]]};
  }
  const W=8+2*n,L=12+3*n,gate=3+n%2,perimeter=2*(L+W),panels=Math.ceil((perimeter-gate)/2),best=purchase(panels),additional=Math.max(0,Math.ceil(perimeter/2)-best.bought),extra=purchase(additional).cost;
  return {math:{L,W,gate,perimeter,panels,best},prompt:`长方形长宽比3:2，宽${W}米，外围留${gate}米门洞。围栏板每块2米，可裁剪，余料可跨边拼用。单块15元，5块装70元。另需4个角柱，每个6元。最少总费用多少元？`,answer:best.cost+24,variation:{prompt:`原方案已有${best.bought}块板材，均可继续使用，角柱已备好。现在把门洞也封上，最少还要花多少元？`,answer:extra,key:'reuse-stock-close-gate-v1',parameters:{stock:best.bought}},nodes:[['length','根据长宽比确定长。',L,'米',[],`${W}/2*3`],['perimeter','先求完整的一周长度。',perimeter,'米',['length'],`2*(${L}+${W})`],['fence','门洞之外实际需围多长？',perimeter-gate,'米',['perimeter'],`${perimeter}-${gate}`],['panels','余料可拼用，但板材必须整块买，至少几块？',panels,'块',['fence'],'whole-panel-ceiling'],['purchase','比较整包与单块组合，最低板材费多少？',best.cost,'元',['panels'],'bounded-bundle-table'],['target','加入必要角柱，给出最低总费用。',best.cost+24,'元',['purchase'],`${best.cost}+4*6`]]};
 }
 function create(recipe){
  const f=catalog.find(x=>x.id===recipe.familyId),kind=recipe.configurationId||f?.configurations[0],seed=recipe.seed;
  if(!f||!f.configurations.includes(kind)||recipe.generatorRevision!==5||!Number.isInteger(seed)||seed<1||seed>2147483647)throw Error('INVALID_INTEGRATED_RECIPE');
  const d=data(kind,seed),answer=String(d.answer),signature=JSON.stringify({family:f.id,configuration:kind,math:d.math}),id='COMP-I-'+f.id+'-'+kind+'-'+seed;
  const nodes=d.nodes.map(([nodeId,prompt,value,unit,deps,rule])=>({id:nodeId,prompt,answer:String(value),unit,prerequisiteIds:deps,inputIds:deps,outputId:nodeId,requiredSkillIds:skillSets[kind],rule:{kind:'family-quantity-relation',statement:prompt},relationRuleId:rule,acceptedExpressions:[String(value)],hints:[prompt+'先回到题给条件选择所需的量。','核对这个关系的整体、单位和允许范围。'],errorCheck:'核对所用的量、条件与整数限制。',disclosure:'current-node-only'}));
  const routes=[{id:'integrated-plan',name:'建立关系并比较合法方案',requiredSkills:skillSets[kind],nodes}],goal={id:kind+'-cost',quantityId:'target',unit:'元',questionText:d.prompt},answerContract={kind:'exact-rational',value:answer,unit:'元'};
  const diagram=f.id==='integratedWeightedPlan'?{kind:'scene-units',groups:[{name:'红队',count:2,unit:'人数份',score:kind==='mean-admission'?d.math.low:'?'},{name:'蓝队',count:3,unit:'人数份',score:d.math.high}],object:'person',average:kind==='score-training'?d.math.mean:'?',caption:'比例代表2份与3份，不是实际人数；总人数'+d.math.N+'，各队实际人数由你求。'}:{kind:'scene-ratioBorder',width:kind==='perimeter-fence'?d.math.W:'?',perimeter:kind==='length-border'?d.math.perimeter:'?',border:kind==='length-border'?d.math.border:null,gate:kind==='perimeter-fence'?d.math.gate:null,caption:'只表示题给比例、边框或门洞；未填写求解结果，尺寸以题给为准。'};
  const extension={...d.variation,answer:String(d.variation.answer),signature:JSON.stringify({main:signature,variation:d.variation.key}),solution:'按变式的新目标重新检查整体、可行条件与最优性。',diagram:kind==='length-border'?{...diagram,border:'?'}:kind==='perimeter-fence'?{...diagram,gate:0}:JSON.parse(JSON.stringify(diagram)),solutionFrames:[],problemState:{schemaVersion:1,familyId:f.id,math:{...d.math,...d.variation.parameters},goal:{id:d.variation.key,quantityId:'variation-target',unit:''},answerContract:{kind:'exact-rational',value:String(d.variation.answer),unit:''},adapterStatus:'explicit'}};
  const variantState=extension.problemState,variantUnit=kind==='score-training'?'人':kind==='length-border'?'米':'元';
  Object.assign(variantState,{id:id+':variation',expectedAnswer:extension.answer,normalizedModel:'integrated-'+kind,relations:['使用变式给定的新限制与目标，重新核对合法方案及最优性'],quantityIds:Object.keys(variantState.math).map(key=>({id:id+':variation:'+key,key})),quantityDomain:'nonnegative-rational'});
  variantState.goal.unit=variantUnit;variantState.answerContract.unit=variantUnit;extension.answerContract=variantState.answerContract;
  Object.assign(extension.diagram,{mathStateId:variantState.id,targetQuantityId:variantState.goal.id,statePhase:'variation-givens'});variantState.projection={diagram:extension.diagram,diagramPhase:'variation-givens'};
  const options=[answer,...[1,2,3,4].map(n=>String(d.answer+n))];
  return {id,contentVersion:112,mode:'competition',skillId:f.topicIds[0]+'.01',phase:'综合挑战',prompt:d.prompt,options,optionIds:options.map(v=>id+':'+v),answer:0,competition:{family:f.id,title:f.title,integrated:true,configurationId:kind,math:d.math,prompt:d.prompt,answer,answerContract,signature,topicIds:f.topicIds,recipe:{...recipe,configurationId:kind},level:3,reasoningKey:f.reasoningKey,hints:['先选择已学工具，把题给条件与最终目标连接起来；不急着计算所有数字。','比较可行性、整体和整包限制，保留合法方案后再判断最少。'],methods:[{name:'建立关系并验证最优性',steps:d.nodes.map(x=>x[1]+' '+x[2]+x[3])}],extension,diagram,problemState:{schemaVersion:1,familyId:f.id,math:d.math,goal,answerContract},routes,authoredGraph:{schemaVersion:1,graphRevision:4,familyId:f.id,configurationId:kind,goal,coverageStatus:'authored',routes},calculationLoad:{level:2,operations:8,enumeration:12,fractional:false,digits:4},readingLoad:{level:3},quality:{modelId:kind.includes('border')||kind.includes('fence')?'boundary-and-area':'total-and-position',variationSpec:{change:extension.key,transferStrength:'changed-goal-or-constraint'}}}};
 }
 return {catalog,config,skillSets,data,create,purchase};
})();
if(typeof module!=='undefined')module.exports=CompetitionIntegrated;

'use strict';
// Engine 3 is an editorial layer. Engine 1/2 stay unchanged for record replay.
const {COMPETITION_REVIEWED,competitionReviewedEligible,competitionReviewedCreate,competitionReviewedRecipe}=((base,extra,helpers,fresh,rules,design,structured,sources)=>{
 const {competitionCanonicalIds,competitionHash,competitionFraction:F,competitionRatioText}=helpers;
 const revision=93;
 const diagnosticFamilies=new Set(['digitInsert','telescopingDifferences']);
 const descriptions={1:'关系较直接，辨认一个关键条件后即可求解',2:'需要衔接两步推理，或在两种表示之间转换',3:'需要处理多重约束、隐含结构，或证明极值与不变量'};
 // Each row records a content decision, not a claim of learning effectiveness.
 const rows=[
 ['reverseDigits',2,'交换数字','交换前后的位值差与数字和共同确定两个数字'],
 ['fractionBackwards',2,'两天的贴纸','两次分数的整体不同，可逆推或统一原量'],
 ['percentRoundTrip',2,'价格变化','两次百分比的基准不同，变化量不能直接抵消'],
 ['squareBorder',2,'积木边框','求新增部分可用面积差或不重叠的边界计数'],
 ['ratioEqualize',2,'两色球','增加量对应比例中的差额而非总份数'],
 ['packPrice',2,'买笔','便宜单位价仍受整包与恰好数量约束'],
 ['equalDistanceSpeed',2,'往返行程','相等路程对应不等时间，平均速度的权重是时间'],
 ['oppositeScale',2,'图形尺寸','面积不变要求两个方向的长度倍率互为倒数'],
 ['balanceCancel',1,'天平上的盒子','相同部分可从平衡的两边同时移去'],
 ['tickets',2,'买票的人数','人数与总价共同约束两类数量'],
 ['recurrenceBackwards',2,'数列的起点','给定相邻末项后，递推可通过相减反向还原'],
 ['linearTable',1,'机器表格','输入差与输出差确定固定变化率'],
 ['divisibleDigits',3,'数字空格','同时满足两种整除限制并比较位值取得最大数'],
 ['factorBalance',2,'一对整数','合法因数对中比较和，需覆盖全部候选'],
 ['bells',2,'两只铃','共同周期的计数必须同时处理起止端点'],
 ['lastDigit',2,'幂的个位','指数的余数必须对应从一次方开始的循环位置'],
 ['fixedPerimeter',3,'长方形设计','整数约束下证明边长尽量接近会增大面积'],
 ['outsideAngle',2,'三角形的外角','等腰条件与内外角关系可沿两条路线使用'],
 ['overlapSquares',2,'两张正方形纸','移动量决定交集边长，覆盖区域须避免重计'],
 ['circleRoute',1,'圆形跑道','圆周的两条补弧中比较较短的一条'],
 ['similarAreaPerimeter',2,'两个相似图形','面积比先还原为长度比，再用于周长'],
 ['ladderShift',2,'靠墙的梯子','固定斜边对应两组直角边，可计算或识别结构'],
 ['paintedCube',2,'涂色小块','边界位置决定涂色面数，角块须单独分类'],
 ['exactlyOneSet',2,'两个活动组','恰好一组与至少一组对交集有不同处理'],
 ['gridDetour',3,'方格中的路线','通过限制点的前后路径配对，或直接逐点递推'],
 ['adjacentLine',2,'朋友排队','相邻对象可捆绑，也可先选相邻位置'],
 ['restrictedTeam',3,'三人小队','无序选人与禁止同选的约束需要完整分类'],
 ['digitComplement',2,'数字密码','至少出现一次可用补集或首个出现位置计数'],
 ['chartScale',1,'三个小组','已知柱高确定刻度，再转换另一部分的数量'],
 ['missingAverage',2,'删去的数','平均数要与人数结合为总和，也可平衡偏差'],
 ['diceSum',2,'两枚骰子','等可能对象是有序点数对，数字和并不等可能'],
 ['foldHoles',2,'纸上的孔','折痕上的孔与内部孔有不同的对称复制次数'],
 ['checkerDomino',3,'棋盘与骨牌','颜色给出上界后，还需构造达到上界的摆法'],
 ['natural-weighted',2,'两队的得分','人数比例决定平均数的权重'],
 ['natural-fractionWeighted',2,'两队的积分','人数权重决定平均结果，不能直接平均两个队的每人得分'],
 ['natural-catch',2,'两人的行程','领先距离由延迟形成，差速决定追及时间'],
 ['natural-tiles',2,'铺地砖','边长须共同整除两边，求最大规格后数铺排'],
 ['natural-pairChance',2,'袋中的球','不放回的球对可按无序组合或有序取出计数'],
 ['natural-unionChance',2,'抽到的组员','先去重确定有利人数，再与全体比较'],
 ['natural-complementChance',2,'抽到的小朋友','既未参加任何组的人数是并集的补集'],
 ['natural-offers',2,'两家商店','固定配送费和每件折后价作用于不同量'],
 ['natural-angleRatio',1,'三角形的三个角','内角总和对应完整比例份数'],
 ['natural-digitCount',2,'两位数卡','十位个位的有序选择同时受整除限制'],
 ['natural-distinctDigitCount',3,'两位数卡','有序选择、整除和不重复三项约束共同限制'],
 ['natural-coordinateDistance',2,'两个点','直线距离与横纵距离的合计不是同一个量'],
 ['routeProbability',3,'随机路线','完整路线等可能，受限制的路径数决定概率'],
 ['cubeProbability',2,'随机小块','空间边界分类得到有利数，分母为全部小块'],
 ['overlapProbability',2,'随机落点','等可能区域是并集，交集面积不能重复放入分母'],
 ['ratioUnion',3,'参加活动的人','先从不同人数还原参加次数，再用比例反求各组'],
 ['chartAverage',2,'得分图','频数决定权重，可合计总分或平衡基准偏差'],
 ['parityPermutations',3,'数字排列','先确定不相邻的位置，再安排不同数字'],
 ['recurrenceRemainders',3,'数列的余数','相邻余数对构成状态，确认周期后分段求和']
 ];
 const benchmarkMap={
 signedProduct:['AMC8-2000-07'],digitDivisor:['AMC8-2000-11'],overlapAverages:['AMC8-2000-23'],
 ageDifference:['AMC8-2000-01'],lShapeArea:['AMC8-2000-06'],cumulativeChart:['AMC8-2000-04'],
 fixedPerimeter:['AMC8-2000-16'],tickets:['AMC8-2000-20'],stampConstraint:['AMC8-2000-20'],
 missingAverage:['AMC8-2000-23'],outsideAngle:['AMC8-2000-13'],parallelTriangle:['AMC8-2000-25'],
 paintedCube:['AMC8-2000-08','AMC8-2000-22'],cubeProbability:['AMC8-2000-08'],
 lastDigit:['AMC8-2000-14'],recurrenceRemainders:['AMC8-2000-14'],divisibleDigits:['AMC8-2000-09']
 };
 const oneMethod=new Set(['factorBalance','lastDigit','similarAreaPerimeter','natural-tiles','natural-angleRatio','parityPermutations','recurrenceRemainders','pairedSum','percentRestore','divisorPowers','circleRingRatio','cubeSteps','numberAppend','riverTravel','parallelTriangle','cumulativeChart','allThreeColors','fractionSharedRemainder','threeDivisors']);
 const M=(name,...steps)=>({name,steps});
 const X=(prompt,answer,solution)=>({prompt,answer:String(answer),solution,kind:'condition-change',key:'condition-transfer'});
 const fact=n=>n<2?1:n*fact(n-1);
 const choose=(n,k)=>k<0||k>n?0:Array.from({length:k},(_,i)=>i+1).reduce((v,i)=>v*(n-i+1)/i,1);
 const routes=(w,h,blocked)=>{let a=Array.from({length:h+1},()=>Array(w+1).fill(0));for(let y=0;y<=h;y++)for(let x=0;x<=w;x++)a[y][x]=blocked&&x===blocked[0]&&y===blocked[1]?0:x+y===0?1:(x?a[y][x-1]:0)+(y?a[y-1][x]:0);return a[h][w]};
 function transfer(id,m,c){
  switch(id){
   case 'reverseDigits':return X(`现在改为两个数字相差 ${m.a-m.b}，交换前后两个数的和仍与原题相同。满足条件的较小两位数是多少？`,10*m.b+m.a,'数位互换后，两数之和等于数字和的11倍。先还原数字和，再配合数字差；把较小数字放十位。');
   case 'fractionBackwards':return X('第二天改为用掉最初总数的 1/3，其余不变。最后剩多少枚？',F(m.left,2),'新的两次分数都以最初总数为整体，剩下1−1/2−1/3=1/6；不能沿用原题剩原量1/3的结论。');
   case 'percentRoundTrip':return X(`只涨价 ${m.percent}% 后，若想恢复原价，应按涨后价降百分之几？填写百分号前的数。`,F(100*m.percent,100+m.percent),'需减少的是原价的涨幅，但分母改为涨后的价格；可取原价100比较。');
   case 'squareBorder':return X('改成只在左侧与上侧加宽1块的一条边框，两侧在左上角相接。需要增加多少块？',2*m.n+1,'大阵每边只多1；新增两条各长n的边和一个公共外角，计2n+1。');
   case 'ratioEqualize':return X(`改为只取走 ${((m.b-m.a)*m.unit)} 个蓝球，不加红球。此时两种球合计多少个？`,2*m.a*m.unit,'取走的数量仍是原来的数量差；两种都变成原来的红球数，而非原来的蓝球数。');
   case 'packPrice':{let cost=Infinity;for(let k=0;k<=Math.ceil(m.count/3);k++)cost=Math.min(cost,k*m.pack+Math.max(0,m.count-3*k)*m.single);return X('数量条件改为至少买够，允许多买；最少需要多少元？',cost,'比较原来的恰好方案与再多买一整包的方案。单价便宜不能代替对总费用的比较。')}
   case 'equalDistanceSpeed':return X('两段速度不变，改为在两个方向行走同样长的时间，平均速度是多少？',F(3*m.speed,2),'这次权重是相同时间，两个速度可以等权平均；原题是相同路程，不能照搬。');
   case 'oppositeScale':return X('两边都改为原来长的相同倍率，面积是原来的几倍？',F(m.b*m.b,m.a*m.a),'面积随两个长度倍率相乘；原题保持面积不变的条件已取消。');
   case 'balanceCancel':return X('同一副天平，右边拿走一个盒子后，为重新平衡，右边应该加几克砝码？',m.x,'去掉右边一个盒子的重量后，补回等量砝码。重量差变化，而不是两边仍有相同盒子数。');
   case 'tickets':{const total=m.adults*m.adult+(m.people-m.adults)*m.child;return X(`票价不变，但同样总价 ${total} 元不限定总人数，允许一种票完全不买。不同的成人、儿童人数方案有几种？`,(()=>{let n=0;for(let a=0;a*m.adult<=total;a++)if((total-a*m.adult)%m.child===0)n++;return n})(),'解除人数限制后，固定成人票数，检查余款能否恰好买整数张儿童票。原来的唯一人数不能直接沿用。')}
   case 'recurrenceBackwards':return X('把求出的第一项增加1，第二项不变，递推规则不变。原题最后已知的那一项会增加多少？',(()=>{let a=1,b=0;for(let i=2;i<m.n;i++)[a,b]=[b,a+b];return b})(),'增量也满足相同递推，从1、0开始逐项相加；不必把原数列从头重算。');
   case 'linearTable':return X(`把每次规则改为先加原来的固定加数、再乘原来的固定乘数，输入 ${m.target} 的输出是多少？`,m.k*(m.target+m.b),'先由两个已知对应求乘数和加数，再按新顺序计算；两个步骤不可任意交换。');
   case 'divisibleDigits':return X('仍用原题数字空格，但改成被9整除且为偶数，求最大的四位数。',(()=>{let best=0;for(let b=0;b<10;b++)for(let d=0;d<10;d+=2){const n=1000*m.a+100*b+10*m.b+d;if(n%9===0)best=Math.max(best,n)}return best})(),'末位的可选数字改为0、2、4、6、8；再检查数字和。原来的末位0或5限制已不成立。');
   case 'factorBalance':return X('如果改为求这两个正整数的和最大，答案是多少？',m.product+1,'检查因数对的另一个极端：1与原乘积。不能把求最小和的“尽量接近”直接用于最大和。');
   case 'bells':{let t=m.a;while(t%m.b)t+=m.a;return X(`时间改为恰好 ${t} 分钟，而且起点与终点都计入。两铃同时响几次？`,2,'区间是闭区间，0与一个完整共同周期这两个端点都应计入。')}
   case 'lastDigit':return X(`把两个连续幂 ${m.base} 的 ${m.exponent} 次方与 ${m.exponent+1} 次方相加，和的个位是多少？`,(Number(c.answer)+Number(BigInt(m.base)**BigInt(m.exponent+1)%10n))%10,'分别定位两个相邻幂的末位，再把末位相加取个位；循环位置不直接成为和的末位。');
   case 'fixedPerimeter':return X('周长不变，改为要求两边都是正偶数。若没有这样的长方形，填写0；否则填最大面积。',(()=>{let a=0;for(let w=2;w<m.half;w+=2)if((m.half-w)%2===0)a=Math.max(a,w*(m.half-w));return a})(),'先检查长宽和能否由两个偶数组成；若可行，在偶数的合法候选中找最接近的一对。');
   case 'outsideAngle':return X('若给定的同一个外角不变，但改问另一个底角，是多少度？',90-m.apex/2,'外角与相邻底角互补；等腰使另一个底角相同。目标改变后不能仍填写原外角。');
   case 'overlapSquares':return X('改为只给恰好被一张纸覆盖的部分上色，面积是多少？',2*m.n*m.n-2*(m.n-m.dx)*(m.n-m.dy),'两张面积相加后，重叠中的每一点出现两次；现在两次都要扣除。');
   case 'circleRoute':return X('若要从A到B再回A，并且必须经过跑道的每一段至少一次，最短总路程是多少米？',m.sectors*m.unit,'走完整圆周可满足要求；每段至少走一次意味着总长不能少于圆周长，两条补弧分别用于去和回。');
   case 'similarAreaPerimeter':return X(`再做一个周长为较小图形 ${m.b} 倍的相似图形，它的面积是较小图形的几倍？`,m.b*m.b,'周长给出长度倍率，面积要用倍率的平方；这次不是从面积比开平方。');
   case 'ladderShift':return X(`仍用这根梯子，让梯顶离地 ${4*m.k} 米，底端离墙多少米？`,3*m.k,'改为以高度作为已知直角边，用固定梯长求另一直角边，或识别原来的3-4-5对应。');
   case 'paintedCube':return X('改为只涂大正方体顶面和底面，再按原样切开。恰好一个面涂色的小块有多少个？',2*m.n*m.n,'顶底面互不相邻，没有小块同时接触这两个面；因此两个完整表层都符合，不能仍只数棱。');
   case 'exactlyOneSet':return X('有一个原来只在棋类组的人又加入球类组，总人数不变。此后恰好参加一组的人数是多少？',Number(c.answer)-1,'棋类不变，球类与交集各增1；只有这一个人由恰好一组变为两组。');
   case 'gridDetour':return X('取消避开P的限制，改为要求路线的第一步向上。这样的最短路线有多少条？',routes(m.w,m.h-1),'第一步已固定，之后剩下同一个宽度、少一段向上的自由路径；无需扣原来的P。');
   case 'adjacentLine':return X('改为小乐与小明不能相邻，共有多少种排列？',fact(m.n)-2*fact(m.n-1),'用所有排列减相邻排列；内部两种顺序仍要包括在被扣除的部分中。');
   case 'restrictedTeam':return X('仍不分职位，但改为必须同时选中小乐和小明，第三人有几种选择？',m.n-2,'两人已固定，只从剩余人中选第三人。原题的禁止条件变成必须条件。');
   case 'digitComplement':return X(`改为恰好一位是 ${m.digit}，密码有多少个？`,m.length*9**(m.length-1),'先选唯一一次出现的位置，其他每位都不能再用它；不是原题的“至少一次”。');
   case 'chartScale':return X('三组柱高各增加一格，但刻度不变。合计人数增加多少？',3*m.unit,'每格所代表的人数由原图确定；三个柱各加一格，合计增加三格。');
   case 'missingAverage':return X('删去的数已取出；现在把它再放回去两次。新平均数是多少？',F(m.count*m.mean+Number(c.answer),m.count+1),'原来全部数放回后，再多一个被删去的数；总和与人数都要增加，不能只给平均数加2。');
   case 'diceSum':{let v=0;for(let a=1;a<=m.faces;a++)for(let b=1;b<=m.faces;b++)if(a+b===m.target&&a!==b)v++;return X(`已知两枚点数不同，点数和仍为 ${m.target} 的概率是多少？`,F(v,m.faces*(m.faces-1)),'新的样本空间去掉所有点数相同的结果；分子也要重新检查是否有原先符合但点数相同的结果。')}
   case 'foldHoles':return X('把其中一个位于单条折痕边的孔移到内部，其余孔不变。展开后总孔数是多少？',Number(c.answer)+2,'该孔由两个镜像位置变成四个位置，增加2；不是一律乘4或总数加4。');
   case 'checkerDomino':return X('改为去掉左上角和右上角，其他条件不变，最多能放几块骨牌？',m.w*m.h/2-1,'去掉一黑一白，第一行剩偶数格可横铺，其余各行也可横铺。颜色数量允许且构造达到剩余格数的一半。');
   case 'natural-weighted':case 'natural-fractionWeighted':{
    const red=2*m.red,blue=m.blue,people=red+blue,redScore=F(m.redScore,m.den),blueScore=F(m.blueScore,m.den);
    const redTotal=F(red*m.redScore,m.den),blueTotal=F(blue*m.blueScore,m.den),total=F(red*m.redScore+blue*m.blueScore,m.den),average=F(red*m.redScore+blue*m.blueScore,people*m.den);
    const operand=v=>String(v).includes('/')?'('+v+')':String(v);
    return X('把红队人数变为原来两倍，蓝队人数不变，每人得分不变。新的平均分是多少？',average,
     `改变的是权重，不是每人得分；重新计算总份数和总得分，不能把原平均数直接加倍。按新人数比取红队 ${red} 人、蓝队 ${blue} 人的一组，共 ${people} 人。红队总分 ${red} × ${operand(redScore)} = ${redTotal}，蓝队总分 ${blue} × ${operand(blueScore)} = ${blueTotal}。合计 ${operand(redTotal)} + ${operand(blueTotal)} = ${total} 分。新平均 ${operand(total)} ÷ ${people} = ${average} 分。`);
   }
   case 'natural-catch':return X('小明追上后立即停住，让小乐再走原来的延迟时长，两人的距离是多少米？',m.slow*m.delay,'追上时领先距离归零；此后只有小乐移动，距离按他的速度与这段时间计算，差速不再适用。');
   case 'natural-tiles':return X('地面尺寸都变为两倍，并且允许重新选择最大的整块正方形砖。最少需要多少块砖？',m.w*m.h/(m.side*m.side),'长宽的最大公因数也变为两倍；砖面积与地面面积同时变为四倍，所以最少块数不变。');
   case 'natural-pairChance':return X('改成每次取球后放回并充分混合，再取第二次。两次都是红球的概率是多少？',F(m.red*m.red,(m.red+m.blue)**2),'放回后每次红球比例不变，两次概率相乘；原题第二次分母减1的规则失效。');
   case 'natural-unionChance':case 'natural-complementChance':return X('改为已知抽到的人至少参加了其中一组。这个人参加两组的概率是多少？',F(m.both,m.red+m.blue-m.both),'样本范围缩到至少一组的不同人数；用交集人数除以并集人数，不能仍除以全体。');
   case 'natural-offers':return X('价格规则不变，至少买多少件时甲店整单总价不高于乙店？件数必须是整数。',Math.ceil(m.fee/(m.price/4-1)),'每件价差与固定配送费共同决定临界数量。甲折后单价是原价的3/4，乙是原单价少1元；固定费除以每件差后向上取整数，再核对相邻件数。');
   case 'natural-angleRatio':return X(`另一个四边形的四个内角之比为 ${[...m.ratios,Math.max(...m.ratios)].join(':')}。最小内角是多少度？`,F(360*Math.min(...m.ratios),m.ratios.reduce((a,b)=>a+b,0)+Math.max(...m.ratios)),'四边形内角和为360°，共有新的四个比例份数；先确定图形的总角量，不能沿用三角形的180°。');
   case 'natural-digitCount':case 'natural-distinctDigitCount':return {...c.extension,kind:'condition-change',key:'repeat-permission'};
   case 'natural-coordinateDistance':return {...c.extension,kind:'condition-change',key:'grid-distance'};
   case 'routeProbability':return X('取消P的限制，随机路线第一步向上的概率是多少？',F(routes(m.w,m.h-1),routes(m.w,m.h)),'仍然是完整路线等可能。固定第一步向上后的路线数与全部路线数比较，不能默认两个方向各1/2。');
   case 'cubeProbability':return X('已知取到的小块至少一面涂色，恰好两面涂色的概率是多少？',F(12*(m.n-2),m.n**3-(m.n-2)**3),'样本空间变成外层小块，先排除完全未涂色的小块；符合数量仍为棱上非角的小块。');
   case 'overlapProbability':return X('改为只在第一张正方形的区域中等可能选点，落在重叠区域的概率是多少？',F((m.n-m.dx)*(m.n-m.dy),m.n*m.n),'重叠面积不变，可选整体从并集变成一个正方形，因此只改变分母。');
   case 'ratioUnion':return X('有一个原来只参加棋类组的人又加入球类组，其他人不变。新的棋类与球类人数之比为多少？请填写棋类人数除以球类人数。',F(m.a*m.unit,m.b*m.unit+1),'棋类人数不变，球类加1，交集也加1，不同人数不变。原比例不能沿用来重新分配全部人。');
   case 'chartAverage':return X('再来一个得6分的人，原来的其他人得分不变。新的平均分是多少？',F(2*m.counts[0]+4*m.counts[1]+6*m.counts[2]+6,m.counts.reduce((a,b)=>a+b,0)+1),'总分加6，总人数加1；平均数改变取决于新分数与原平均的关系。');
   case 'parityPermutations':return X('改为任意两个奇数都不能相邻，其余不变。有多少种排列？',fact(Math.floor(m.n/2))*choose(Math.floor(m.n/2)+1,Math.ceil(m.n/2))*fact(Math.ceil(m.n/2)),'先排偶数再把奇数放入空位，核对空位数量是否足够。原题奇偶可交换角色，但两类数量未必相同。');
   case 'recurrenceRemainders':return X(`前两项都改为2，递推规则不变，前 ${m.n} 项各自除以3的余数之和是多少？`,(()=>{let a=2,b=2,s=0;for(let i=0;i<m.n;i++){s+=a%3;[a,b]=[b,(a+b)%3]}return s})(),'数列加倍后，原余数1变2、2变1、0仍为0；余数的和不能直接加倍，需重算周期和及余段。');
   default:throw Error('Missing reviewed transfer: '+id);
  }
 }
 function polish(c,id){
  if(id==='percentRoundTrip'){
   const {start,percent}=c.math;
   c.methods=c.methods.map(m=>({...m,steps:[...m.steps]}));
   const parts=100/percent,first=start/parts,raised=start+first;
   c.methods[0].steps=[`把原价 ${start} 元分成 ${parts} 等份，${percent}% 是其中一份：${start}÷${parts}=${first} 元。加上这一份，涨后 ${raised} 元。`,
    `第二次以涨后 ${raised} 元为整体，再分成 ${parts} 等份，每份 ${F(raised,parts)} 元。减去这一份，剩 ${F(raised*(parts-1),parts)} 元；与原价相比少 ${F(first,parts)} 元。`];
  }
  const m=c.math;
  if(id==='fixedPerimeter'){
   const pairs=Array.from({length:Math.floor(m.half/2)},(_,i)=>[i+1,m.half-i-1]),a=Math.floor(m.half/2),b=m.half-a;
   c.methods=[M('列全长宽配对并比较',`由周长得到长+宽=${m.half}。交换长宽不改变面积，只列短边不大于长边的配对。`,pairs.map(([x,y])=>`${x}×${y}=${x*y}`).join('；')+'。',`比较全部合法面积，最大为${a}×${b}=${c.answer}。`),M('把较长一边挪给较短一边',`当长边比短边至少长2时，把长减1、短加1，长宽和不变。`,`增加的一排有“原长−1”个单位格，去掉的一排有“原短”个单位格；前者至少多1格，面积增加。`,`不断这样调整，直到两边相等或只差1，故最优边长${a}与${b}，面积${c.answer}。`)];
  }
  if(id==='recurrenceBackwards'){
   const seq=[m.first,m.second],coeff=[[1,0],[0,1]];for(let i=2;i<m.n;i++){seq.push(seq[i-1]+seq[i-2]);coeff.push([coeff[i-1][0]+coeff[i-2][0],coeff[i-1][1]+coeff[i-2][1]])}
   const p=coeff[m.n-2],q=coeff[m.n-1],x=seq[m.n-2],y=seq[m.n-1],det=p[0]*q[1]-q[0]*p[1],rhs=q[1]*x-p[1]*y;
   c.methods=[c.methods[0],M('用未知起点表示并消去第二项','设第1项为a，第2项为b，每个后续项都按同样的相加规则表示。',`第${m.n-1}项：${p[0]}a+${p[1]}b=${x}；第${m.n}项：${q[0]}a+${q[1]}b=${y}。`,`第一式乘${q[1]}，第二式乘${p[1]}再相减，b项抵消，得到${det}a=${rhs}，所以a=${m.first}。`,`代回得b=${m.second}；从这两项正向相加，可核对最后两个已知数。`)];
  }
  if(id==='signedProduct'){
   const cards=[-4*m.k,-3*m.k,-m.k,0,2*m.k,5*m.k],negative=[];for(let a=0;a<cards.length;a++)for(let b=a+1;b<cards.length;b++)for(let d=b+1;d<cards.length;d++){const v=cards[a]*cards[b]*cards[d];if(v<0)negative.push(`${cards[a]}×${cards[b]}×${cards[d]}=${v}`)}
   c.methods=[c.methods[0],M('列出负乘积逐个比较','有负乘积可选，零和正乘积都不会取得最小值；按数字卡顺序列每一组三张，避免重复。',negative.join('；')+'。',`所有负乘积都在这张列表内，比较得到最小值${c.answer}。`)];
  }
  if(id==='cubeSteps')c.methods=[M('把列高正反写成两行',`每列只有1块宽，块数为1+2+……+${m.n}。把这列高度再倒写一行。`,`两行同一列的和都是${m.n+1}，共${m.n}列，所以两倍块数=${m.n}×${m.n+1}。`,`除以2得到${c.answer}块；列数为奇数时也适用。`)];
  if(id==='openBox'){
   const choices=[];for(let x=1;2*x<m.side;x++)choices.push(`x=${x}时体积${x*(m.side-2*x)**2}`);
   c.diagram={kind:'boxNet',side:m.side};c.methods=[M('由展开图确定尺寸再比较',`每条底边的两端各少x，高为x，故底边=${m.side}−2x，体积=x×(${m.side}−2x)²。`,`x为正整数且底边为正，只需检查1到${(m.side-2)/2}。`,choices.join('；')+'。',`完整比较这些合法切角方案，最大体积为${c.answer}。`)];
  }
  if(id==='natural-angleRatio')c.diagram={kind:'angleRatioTriangle',ratios:[...m.ratios]};
  return c;
 }
 function edit(family,seed){
  const t=base.competitionCreate({engine:2,familyId:family.id,seed}),c={...t.competition},m=c.math;
  c.title=family.title;c.level=family.level;c.insight=family.insight;c.extension=transfer(family.id,m,c);
  if(oneMethod.has(family.id))c.methods=[c.methods[0]];
  if(family.id==='fractionBackwards')c.diagram=null;
  if(family.id==='fixedPerimeter')c.diagram={kind:'rectangle',labels:['长 ?','宽 ?',`周长 ${2*m.half}，边长为正整数`]};
  if(['paintedCube','cubeProbability'].includes(family.id))c.methods=[c.methods[0],M('按六个面计数再去重',`每个面边缘去掉四个角，剩4×${m.n-2}个有两个面涂色的小块，共计六个面。`,`每个这样的块在两个面中各计一次，所以总数6×4×${m.n-2}÷2=${12*(m.n-2)}。`+(family.id==='cubeProbability'?`再除全部${m.n**3}块得到概率。`:''))];
  if(family.id==='checkerDomino')c.methods=[M('颜色上界与达到上界的摆法',...c.methods[0].steps,...c.methods[1].steps)];
  if(family.id==='routeProbability')c.methods=[c.methods[0],M('直接逐点累加可行路线',`A写1，P写0；其余点写左边和下边的路线数之和，直接得到不经过P的${routes(m.w,m.h,[m.x,m.y])}条路线。`,`分母用不封闭P的同类路径表，得到${routes(m.w,m.h)}条。两者之比为${c.answer}。`)];
  return polish(c,family.id);
 }
 const COMPETITION_REVIEWED=rows.map(([id,level,title,insight])=>{const f=base.COMPETITION_CATALOG.find(x=>x.id===id);return {...f,level,title,insight,origin:'reviewed-rc60',build:seed=>edit({id,level,title,insight},seed)}}).concat(extra.COMPETITION_EXPANSION.map(f=>({...f,origin:'new-structure',build(seed){const c=f.build(seed);if(oneMethod.has(f.id))c.methods=[c.methods[0]];return polish(c,f.id)}}))).concat(fresh.COMPETITION_FRESH.map(f=>({...f,origin:'rc64-structure'}))).map(f=>({...f,levelReason:descriptions[f.level]+'；'+f.insight,benchmarkMatch:['signedProduct','digitDivisor','overlapAverages','ageDifference','lShapeArea'].includes(f.id)?'相近推理结构':'同领域推理参照，不宣称同构',benchmarks:benchmarkMap[f.id]||[],benchmarkKind:benchmarkMap[f.id]?'已复核台账中的结构参照，原创题不等同真题':'原创结构，未宣称对应已复核真题'}));
 COMPETITION_REVIEWED.push(...rules.catalog.map(f=>({...f,levelReason:descriptions[f.level]+'；'+f.insight,benchmarkKind:'原创规则题，未宣称对应真题',benchmarks:[]})));
 COMPETITION_REVIEWED.push(...structured.catalog);
 for(const f of COMPETITION_REVIEWED){f.reasoningKey=f.reasoningKey||rules.reasoningKey(f.id)||f.strategy;Object.assign(f,design.family(f))}
 const integrated=typeof module!=='undefined'?require('./competition_integrated'):CompetitionIntegrated;
 COMPETITION_REVIEWED.push(...integrated.catalog);
 for(const f of COMPETITION_REVIEWED)if(diagnosticFamilies.has(f.id))f.generatorRevision=6;
 function competitionReviewedEligible(ids){const scope=new Set(competitionCanonicalIds(ids));return COMPETITION_REVIEWED.filter(f=>f.topicIds.every(id=>scope.has(id)))}
 function competitionReviewedCreate(recipe){
  if(integrated.catalog.some(f=>f.id===recipe?.familyId))return integrated.create(recipe);
  const f=COMPETITION_REVIEWED.find(f=>f.id===recipe?.familyId),seed=recipe?.seed;
  const generatorRevision=recipe?.generatorRevision===undefined?1:recipe.generatorRevision;
  if(recipe?.engine!==3||!f||![1,2,3,4,5,6].includes(generatorRevision)||!Number.isInteger(seed)||seed<1||seed>2147483647)throw Error('Invalid reviewed competition recipe');
  if(generatorRevision===6&&!diagnosticFamilies.has(f.id))throw Error('Generator revision 6 is not registered for this family');
  if(generatorRevision===5&&f.id!=='natural-weighted')throw Error('Generator revision 5 is not registered for this family');
  if(f.id==='threeGroupBalance'&&generatorRevision!==4)throw Error('New family requires generator revision 4');
  const config=recipe.configurationId;
  if(config&&generatorRevision!==4)throw Error('New configurations require generator revision 4');
  let c=(generatorRevision===4&&(config||f.id==='threeGroupBalance'))?structured.create(f.id,config||'main',seed):null;
  if(!c){c=rules.decorate(f.build(seed,generatorRevision>=3?2:generatorRevision),f.id);if(generatorRevision>=3)c=design.revise(c,f,seed);if(config){c.configurationId=config;c.math={...c.math,configurationId:config}}}
  c=design.decorate(c,f,generatorRevision);
  if(f.id==='parityPermutations'&&config==='first-odd-transfer')c.quality.variationSpec={...c.quality.variationSpec,
   decision:'首位新增限制使第一个空隙不可用；重查可用空隙和不同数字的顺序',transferStrength:'changed-boundary'};
  else if(f.id==='parityPermutations')c.quality.variationSpec={...c.quality.variationSpec,
   transferStrength:c.math.n%2===0?'isomorphic-role-swap':'unequal-role-swap'};
  c=(typeof module!=='undefined'?require('./variation_state'):VariationState).normalize(c,f,generatorRevision);
  if(generatorRevision===5&&f.id==='natural-weighted'){
   const m=c.math,den=m.den||1,lo=Math.min(m.redScore,m.blueScore),hi=Math.max(m.redScore,m.blueScore),target=(lo+hi)/(2*den),count=m.red+m.blue,total=(m.red*m.redScore+m.blue*m.blueScore)/den,highCount=m.redScore>m.blueScore?m.red:m.blue,score=hi/den;
   let k=0;while(k<=highCount&&(count-k<=0||(total-score*k)>target*(count-k)))k++;
   if(k>highCount)throw Error('Unreachable weighted removal target');
   const prompt=`两队改为只让得分较高队的成员离开，其他人的每人得分不变。至少离开多少人，才能让剩余整体均分不超过${target}？`;
   c.quality={...c.quality,variationSpec:{...c.quality.variationSpec,change:'移除高分队成员，整体人数与总分同时变化',decision:'重建分子和分母并核对最少整数人数',transferStrength:'changed-whole-with-unknown-weight'}};
   c.extension={...c.extension,prompt,answer:String(k),key:'remove-high-to-target-v2',answerContract:{kind:'exact-rational',value:String(k),unit:'人',allowApproximation:false},math:{...m,target,highCount,score,count,total},diagram:null,solution:'移除成员时，总分和总人数同时变化；在合法整数人数中比较新均分。',solutionFrames:[],problemState:{...c.extension.problemState,math:{...m,target,highCount,score,count,total},expectedAnswer:String(k),normalizedModel:'population-removal',projection:{...c.extension.problemState.projection,diagram:null,diagramPhase:'variation-givens'},goal:{id:'remove-high-to-target-v2',quantityId:'removed-members',unit:'人'},answerContract:{kind:'exact-rational',value:String(k),unit:'人'},adapterStatus:'explicit'}};
  }
  c.sourceProvenance=sources.provenance(f.id,config);c.requiredSkillsByRoute=sources.definitions[f.id]?.routes||[];
  if([3,5,6].includes(generatorRevision)&&!config||generatorRevision===4&&f.id==='parityPermutations'&&config==='first-odd-transfer')c.skillContractKey=sources.skillContractKey(f.id);
  const authoredGraph=(typeof module!=='undefined'?require('./reasoning_graph'):ReasoningGraph).create(c);
  c.routes=authoredGraph.routes;c.reasoningCoverage=authoredGraph.coverageStatus;c.answerContract=c.problemState.answerContract;
  if(c.sourceProvenance.matchType==='full_structure'||f.id==='threeGroupBalance'){if(c.methods.length!==authoredGraph.routes.length)throw Error('Source method/route mapping mismatch');c.methods=c.methods.map((m,i)=>({...m,routeId:authoredGraph.routes[i].id}));}
  c.variantTransform={kind:'declared-family-change',conditionId:c.extension.key||'condition-transfer',description:c.quality.variationSpec.change,baseStateId:c.problemState.id,targetStateId:c.extension.problemState.id,normalizationStatus:c.extension.problemState.adapterStatus};
  if(authoredGraph.routes.length&&!c.rc68Diagram){const ns=authoredGraph.routes[0].nodes;c.ruleHints=[ns[0].prompt,ns[Math.min(1,ns.length-1)].prompt];c.hintDiagram={...c.diagram,stage:{kind:'hint',text:c.ruleHints[1]}}}
  const rc69Hints={
   coordinateHorizontal:['两点的哪个坐标相同？先确定要沿哪条数轴比较。','在同一条数轴上标出两个横坐标，检查从左点到右点跨过多少单位。'],
   repeatedOnes:['先试由1个1和2个1组成的数，比较除以7的余数。','在末尾添1相当于原数乘10再加1；只追踪余数，看看何时重复。'],
   mixedPacks:['必须恰好，还是至少买够？先保留满足数量要求的整包方案。','尝试不同包数，核对总支数是否合格，再比较费用；不要只比较单包价格。'],
   mapScale:['同一条路在两张地图上的长度怎样对应？','把原长度看成同样的一份，检查放大或缩小的是哪一张地图。'],
   riverTravel:['顺流和逆流时，船与水流的方向分别是什么？','先求两段实际速度，再检查去回路程相同是否代表时间也相同。'],
   telescopingDifferences:['同一个中间数在相邻两个括号中怎样出现？','先写出相邻的两项比较，检查哪些项会抵消；由你确认最后留下的端点。']
  };
  if(rc69Hints[f.id]){c.ruleHints=rc69Hints[f.id];c.hintDiagram={...c.diagram,stage:{kind:'hint',text:c.ruleHints[1]}};}
  // Presentation-only staged quantities leave historical mathematical identity intact.
  if(['recurrenceRemainders','consecutiveRepresentations','remainderProbability','rotatingColors','stepwiseRoute'].includes(f.id)){
   const graph=(typeof module!=='undefined'?require('./reasoning_graph'):ReasoningGraph).create(c),nodes=graph.routes[0].nodes;
   c.methods=c.methods.map(method=>({...method,frames:method.steps.map((text,step)=>({kind:'scene-stage',scene:{kind:'scene-quantities',quantities:nodes.slice(0,Math.max(1,Math.ceil((step+1)*nodes.length/method.steps.length))).map(n=>({label:n.prompt,value:n.answer,unit:n.unit})),caption:'按这条路线连接已经得到的量'},stage:{kind:'solution',step,text}}))}));
  }
  if(f.id==='rule-packs-enough'){
   const p=c.math.params,plans=[];for(let k=0;k<=Math.ceil(p.count/p.size);k++){const single=Math.max(0,p.count-k*p.size),cost=k*p.pack+single*p.single;if(cost===Number(c.answer))plans.push(`${k}包加${single}支单买`)}
   if(plans.length>1)c.methods[0].steps[c.methods[0].steps.length-1]+=' 同价最优方案：'+plans.join('；')+'。';
  }
  if(generatorRevision===6){
   const m=c.math,values=f.id==='digitInsert'
    ?[100*m.d+10*m.a+m.b,100*m.a+10*m.d+m.b,100*m.a+10*m.b+m.d,100*m.d+10*m.b+m.a,100*m.b+10*m.a+m.d]
    :[m.n*m.step,(m.n-1)*m.step,(m.n+1)*m.step,m.step,m.start+m.n*m.step];
   c.options=[...new Set(values.map(String))].sort((a,b)=>competitionHash('diagnostic-v1:'+f.id+':'+seed+':'+a).localeCompare(competitionHash('diagnostic-v1:'+f.id+':'+seed+':'+b)));
   c.optionDesign={revision:1,scope:'generated_training_only',kind:f.id==='digitInsert'?'legal-position-and-order':'term-count-and-endpoint',legacyGeneratorRevision:3};
   c.misconceptions=f.id==='digitInsert'
    ?[{value:String(100*m.a+10*m.d+m.b),feedback:'这次插入保留了原数字顺序。再从最高位开始比较，哪一个位置能得到更大的数？'},{value:String(100*m.a+10*m.b+m.d),feedback:'末尾插入是合法位置。最大值要把各个合法位置都比较一次。'}]
    :[{value:String((m.n-1)*m.step),feedback:'检查你数的是端点还是相邻的差；从第一项到最后一项，每个括号都算一次。'}];
  }
  const ids=competitionCanonicalIds(f.topicIds);
  const identityMath=f.origin==='rc65-rules'?{ruleVersion:c.math.ruleVersion,variant:c.math.variant,params:c.math.params}:c.math;
  // RC65 identities are immutable. New fractional recipes distinguish reviewed
  // countable-item and volume domains rather than silently conflating units.
  if(generatorRevision>=2&&f.origin==='rc65-rules'&&c.relationModel.key==='fraction-wholes')identityMath.quantityDomain=c.math.context==='supplies'?'count-items':'volume-litre';
  const signature=JSON.stringify({engine:1,topicIds:ids,family:c.family,math:identityMath}),id='COMP-'+competitionHash(signature);
  if(!c.prompt||c.clues||!c.extension||c.options.length!==5||new Set(c.options).size!==5||!c.options.includes(c.answer)||c.methods.length<1||c.methods.length>3)throw Error('Invalid reviewed competition content');
  const extension={...c.extension,key:c.extension.key||'condition-transfer'};
  extension.signature=JSON.stringify({main:signature,variation:extension.key});
  if(extension.topicIds&&!extension.topicIds.every(t=>ids.includes(t)))throw Error('Variation outside main scope');
  const restoredRecipe={engine:3,familyId:f.id,seed};if(recipe.generatorRevision!==undefined)restoredRecipe.generatorRevision=generatorRevision;if(config)restoredRecipe.configurationId=config;
  return {id,contentVersion:generatorRevision===6?153:revision,skillId:ids[0]+'.01',phase:'挑战',mode:'competition',prompt:c.prompt,options:c.options,optionIds:c.options.map(v=>id+':'+v),answer:c.options.indexOf(c.answer),competition:{...c,reasoningKey:f.reasoningKey,hints:c.ruleHints||[f.insight],level:f.level,levelReason:f.levelReason,insight:f.insight,benchmarks:f.benchmarks,benchmarkKind:c.sourceProvenance.matchType==='full_structure'?'四个首批来源的完整结构配置，本地数学与结构已核验；整版发布验收待完成':'原创配置；历史索引仅作领域参考，未宣称完整同构',extension,signature,topicIds:ids,recipe:restoredRecipe}};
 }
 function competitionReviewedRecipe(familyId,seed){return {engine:3,familyId,seed,generatorRevision:integrated.catalog.some(f=>f.id===familyId)?5:familyId==='threeGroupBalance'?4:familyId==='natural-weighted'?5:diagnosticFamilies.has(familyId)?6:3,...(integrated.catalog.some(f=>f.id===familyId)?{configurationId:integrated.config[familyId][0]}:{})}}
 return {COMPETITION_REVIEWED,competitionReviewedEligible,competitionReviewedCreate,competitionReviewedRecipe};
})(typeof module!=='undefined'?require('./competition_catalog'):{COMPETITION_CATALOG,competitionCreate:competitionCatalogCreate},typeof module!=='undefined'?require('./competition_expansion'):{COMPETITION_EXPANSION},typeof module!=='undefined'?require('./competition'):{competitionCanonicalIds,competitionHash,competitionFraction,competitionRatioText},typeof module!=='undefined'?require('./competition_fresh'):{COMPETITION_FRESH},typeof module!=='undefined'?require('./competition_rules'):CompetitionRules,typeof module!=='undefined'?require('./competition_design'):CompetitionDesign,typeof module!=='undefined'?require('./structured_recipes'):StructuredRecipes,typeof module!=='undefined'?require('./source_catalog'):SourceCatalog);
if(typeof module!=='undefined')module.exports={COMPETITION_REVIEWED,competitionReviewedEligible,competitionCreate:competitionReviewedCreate,competitionReviewedRecipe};

'use strict';
// Mathematical aliases are reviewed explicitly. Strategy names and coincident
// answers never identify the same problem. Raw task signatures stay unchanged.
const CompetitionIdentity=((create,math)=>{
 const rules=typeof module!=='undefined'?require('./evidence_rules'):EvidenceRules;
 const cache=new WeakMap();
 let historyProvider=null;
 function attachHistoryProvider(provider){historyProvider=typeof provider==='function'?provider:null}
 function additionalHistory(state){try{return historyProvider?.(state)||{}}catch{return {historyUnknown:true}}}
 const METHOD_WINDOW_MS=24*60*60*1000;
 const affinities={
  'natural-weighted':'weighted-total','natural-fractionWeighted':'weighted-total','rule-weighted-mean':'weighted-total','rule-weighted-score':'weighted-total',
  fractionBackwards:'fraction-wholes','rule-fraction-reverse':'fraction-wholes','rule-fraction-original':'fraction-wholes',
  packPrice:'whole-pack-and-single','rule-packs-exact':'whole-pack-and-single','rule-packs-enough':'whole-pack-and-single'
 };
 const methodKey=recipe=>'method-v1:'+(affinities[recipe?.familyId]||recipe?.familyId||'unknown');
 function noteMethodExposure(state,task,type,at=Date.now()){
  state.methodExposures||={};const key=methodKey(task.competition.recipe),prior=state.methodExposures[key];
  state.methodExposures[key]={key,firstAt:Math.min(prior?.firstAt||at,at),lastAt:Math.max(prior?.lastAt||at,at),types:[...new Set([...(prior?.types||[]),type])].slice(-20),recipe:task.competition.recipe,exactTimestamp:true};
 }
 function methodContext(state,task,now=Date.now()){
  const key=methodKey(task.competition.recipe),times=[],bounds=[],sources=[],stored=state.methodExposures?.[key];let estimated=false;
  if(stored){times.push(stored.lastAt);sources.push('method-exposure-log');estimated||=stored.exactTimestamp!==true}
  for(const e of state.events||[])if(e.help&&e.recipe&&methodKey(e.recipe)===key&&Number.isFinite(e.at)&&e.at<=now){times.push(e.at);sources.push(e.type)}
  // A legacy opening time is not the time help was seen. The first RC68
  // observation supplies an upper bound, never a fabricated exposure time.
  for(const h of [...Object.values(state.views||{}),...Object.values(state.extensionViews||{})]){
   let recipe=h.recipe;try{recipe||={familyId:JSON.parse(h.signature).family}}catch{}
   if(!recipe||methodKey(recipe)!==key||!(h.hinted||h.solutionViewed||h.priorSolutionViewed))continue;
   const precise=[h.hinted&&h.hintedAt,(h.solutionViewed||h.priorSolutionViewed)&&h.solutionViewedAt].filter(t=>Number.isFinite(t)&&t>0&&t<=now);
   times.push(...precise);sources.push('historical-view');
   if(h.hinted&&!h.hintedAt||(h.solutionViewed||h.priorSolutionViewed)&&!h.solutionViewedAt){estimated=true;const upper=state.methodHistoryObservedAt;if(Number.isFinite(upper)&&upper>0&&upper<=now)bounds.push(upper);else bounds.push(now)}
  }
  const valid=times.filter(t=>Number.isFinite(t)&&t>0&&t<=now),lastAt=valid.length?Math.max(...valid):null;
  const recentExact=lastAt!==null&&now-lastAt<METHOD_WINDOW_MS,upperBound=bounds.length?Math.max(...bounds):null,possiblyRecent=upperBound!==null&&now-upperBound<METHOD_WINDOW_MS;
  return {affinityId:key,everExposed:lastAt!==null||bounds.length>0,lastAt,elapsedMs:lastAt===null?null:now-lastAt,recent:recentExact||possiblyRecent,recentStatus:recentExact?'known_recent':possiblyRecent?'possibly_recent':lastAt!==null||bounds.length?'outside_window':'none',windowMs:METHOD_WINDOW_MS,timestampEstimated:estimated,unknownTimestampUpperBound:upperBound,sources:[...new Set(sources)]};
 }
 const integer=v=>{const n=Number(v);if(!Number.isSafeInteger(n))throw Error('Unsafe identity quantity');return n};
 function fraction(variant,params,domain){
  const p={d1:integer(params.d1),d2:integer(params.d2)};
  p[variant==='fraction-reverse'?'left':'start']=integer(params[variant==='fraction-reverse'?'left':'start']);
  return 'math-v1:'+JSON.stringify({model:'fraction-wholes',domain,variant,params:p});
 }
 function purchase(variant,params){
  const p={};for(const key of ['size','single','pack','count'])p[key]=integer(params[key]);
  return 'math-v1:'+JSON.stringify({model:'finite-purchase',domain:'count-items/yuan',variant,params:p});
 }
 function semantic(family,math,kind='main',context=null){
  if(family==='fractionBackwards')return fraction(kind==='main'?'fraction-reverse':'fraction-original',{d1:2,d2:3,left:math.left,start:3*integer(math.left)},'count-items');
  if(family==='packPrice')return purchase(kind==='main'?'packs-exact':'packs-enough',{...math,size:3});
  const variant=math.variant,p=math.params;
  if(family.startsWith('rule-')&&p){
   if(['packs-exact','packs-enough'].includes(variant))return purchase(variant,p);
   if(['fraction-reverse','fraction-original'].includes(variant)){
    const domain=context==='supplies'?'count-items':context==='water'?'volume-litre':math.quantityDomain;
    if(domain)return fraction(variant,p,domain);
   }
  }
  return null;
 }
 function key(task,kind='main'){
  const c=task.competition,m=kind==='main'?c.math:c.extension.math;
  try{return semantic(c.family,m||c.math,kind,m?.context)||'signature:'+(kind==='main'?c.signature:c.extension.signature)}catch{return 'signature:'+(kind==='main'?c.signature:c.extension.signature)}
 }
 function signatureKey(signature){
  try{const s=JSON.parse(signature);if(s.family&&s.math)return semantic(s.family,s.math)||'signature:'+signature}catch{}
  return 'signature:'+signature;
 }
 function uncertainKeys(signature){
  // RC65 omitted both unit domain and recipe on help-only new-rule views.
  // Keep that uncertainty; block an unsupported fresh first opportunity without
  // asserting which domain was actually seen or merging their solved counts.
  try{const s=JSON.parse(signature),m=s.math;if(s.family?.startsWith('rule-fraction-')&&m?.params&&!m.quantityDomain)return ['count-items','volume-litre'].map(d=>fraction(m.variant,m.params,d))}catch{}
  return [];
 }
 const earlier=(a,b)=>a.at-b.at||(a.order||0)-(b.order||0)||(a.correct===true?1:0)-(b.correct===true?1:0);
 function index(state){
  const cached=cache.get(state);if(cached&&cached.attempts===state.attempts&&cached.extensions===state.extensions&&cached.views===state.views&&cached.extensionViews===state.extensionViews&&cached.sequence===state.sequence&&cached.attemptCount===(state.attempts||[]).length&&cached.extensionCount===(state.extensions||[]).length&&cached.viewCount===Object.keys(state.views||{}).length)return cached.groups;
  const groups=new Map(),tasks=new Map(),add=(k)=>{if(!groups.has(k))groups.set(k,{key:k,attempted:false,hinted:false,solutionViewed:false,first:null,unknown:[],solvedMain:false,solvedExtension:false,firstCandidates:[]});return groups.get(k)};
  function task(recipe,signature,kind){
   if(!recipe)return null;const rk=JSON.stringify(recipe),t=tasks.has(rk)?tasks.get(rk):(()=>{try{return create(recipe)}catch{return null}})();tasks.set(rk,t);
   return t&&(kind==='main'?t.competition.signature:t.competition.extension.signature)===signature?t:null;
  }
  function first(g,s){g.firstCandidates.push(s);if(!g.first||earlier(s,g.first)<0)g.first=s}
  function mainSnapshot(t,s){
   if(!s||!Number.isFinite(s.at)||s.at<=0||(!(s.inputMode==='free'&&typeof s.freeInput==='string')&&(!Number.isInteger(s.choice)||s.choice<0||s.choice>=5)))return null;
   return {...s,kind:'main',independenceStatus:rules.known(s.evidenceVersion)?'known':'unknown',signature:t.competition.signature,recipe:t.competition.recipe,correct:s.inputMode==='free'?math.equal(s.freeInput,t.competition.answer):s.choice===t.answer,independent:s.independent!==false};
  }
  for(const h of Object.values(state.views||{})){
   const t=task(h.recipe,h.signature,'main')||task(h.first?.recipe,h.signature,'main')||task(h.last?.recipe,h.signature,'main')||task(h.solved?.recipe,h.signature,'main')||task((state.attempts||[]).find(a=>a.signature===h.signature)?.recipe,h.signature,'main');
   if(!t&&(h.attempted||h.hinted||h.solutionViewed))for(const possible of uncertainKeys(h.signature)){const g=add(possible);g.uncertain=true;g.unknown.push({at:h.at,order:0})}
   const g=add(t?key(t):signatureKey(h.signature));g.hinted||=h.hinted===true;g.solutionViewed||=h.solutionViewed===true;g.attempted||=h.attempted===true;
   const f=t?mainSnapshot(t,h.first):null,solved=t?mainSnapshot(t,h.solved):null;
   if(f){first(g,f);g.attempted=true}
   if(solved?.correct||f?.correct){g.solvedMain=true}
   if(!f&&(h.attempted||h.hinted||h.solutionViewed))g.unknown.push({at:h.hintedAt||h.at,order:h.hintOrder||0,attempted:h.attempted===true,helped:h.hinted===true||h.solutionViewed===true});
  }
  for(const a of state.attempts||[]){
   const t=task(a.recipe,a.signature,'main'),s=t?mainSnapshot(t,a):null;if(!s)continue;
   const g=add(key(t));g.attempted=true;g.hinted||=a.hinted===true;g.solutionViewed||=a.priorSolutionViewed===true;g.solvedMain||=s.correct;
   if(a.firstAttempt===true||a.firstCorrect===true)first(g,s);
  }
  for(const h of Object.values(state.extensionViews||{})){
   const t=task(h.recipe,h.signature,'extension')||task(h.solved?.recipe,h.signature,'extension'),g=add(t?key(t,'extension'):'signature:'+h.signature);g.attempted||=h.attempted===true;
   if(t&&typeof h.firstInput==='string'){
    const correct=rules.known(h.evidenceVersion)?math.equal(h.firstInput,t.competition.extension.answer):valueEqual(h.firstInput,t.competition.extension.answer);
    first(g,{kind:'extension',recipe:t.competition.recipe,signature:h.signature,at:h.at,order:h.order||0,correct,independent:h.firstIndependent!==false&&h.independenceStatus!=='unknown',relatedMainSolutionViewed:h.relatedMainSolutionViewed===true,hinted:h.hinted===true,priorSolutionViewed:h.priorSolutionViewed===true,input:h.firstInput});
    g.solvedExtension||=correct;g.solutionViewed||=correct;
   }else if(h.attempted)g.unknown.push({at:h.at,attempted:true});
   if(t&&h.solved&&((rules.known(h.solved.evidenceVersion)||rules.known(h.evidenceVersion))?math.equal(h.solved.input,t.competition.extension.answer):valueEqual(h.solved.input,t.competition.extension.answer))){g.solvedExtension=true;g.solutionViewed=true}
  }
  for(const a of state.extensions||[]){
   const t=task(a.recipe,a.variationSignature,'extension');if(!t||typeof a.input!=='string')continue;
   const g=add(key(t,'extension')),correct=rules.known(a.evidenceVersion)?math.equal(a.input,t.competition.extension.answer):valueEqual(a.input,t.competition.extension.answer);g.attempted=true;g.solvedExtension||=correct;g.solutionViewed||=correct;
   if(a.firstAttempt===true)first(g,{...a,kind:'extension',correct,independent:rules.known(a.evidenceVersion)?a.independent===true:undefined,independenceStatus:rules.known(a.evidenceVersion)?'known':'unknown'});
  }
  for(const g of groups.values())g.cleanFirst=!!g.first&&g.first.correct&&g.first.independenceStatus!=='unknown'&&(g.first.kind==='extension'?g.first.independent===true:g.first.independent!==false)&&!g.first.hinted&&!g.first.priorSolutionViewed&&!g.first.relatedMainSolutionViewed&&!g.unknown.some(u=>!Number.isFinite(u.at)||earlier(u,g.first)<=0);
  cache.set(state,{groups,attempts:state.attempts,extensions:state.extensions,views:state.views,extensionViews:state.extensionViews,sequence:state.sequence,attemptCount:(state.attempts||[]).length,extensionCount:(state.extensions||[]).length,viewCount:Object.keys(state.views||{}).length});return groups;
 }
 function valueEqual(a,b){const n=s=>{const p=String(s).trim().split('/').map(Number);return p.length===1?p[0]:p.length===2&&p[1]!==0?p[0]/p[1]:NaN};return Number.isFinite(n(a))&&Math.abs(n(a)-n(b))<1e-10}
 function exposure(state,task,kind='main'){const groups=index(state),own=groups.get(key(task,kind))||{attempted:false,hinted:false,solutionViewed:false,first:null,cleanFirst:false},extra=additionalHistory(state),externalSeen=(extra.exposedMathKeys||[]).includes(key(task,kind)),externalHelp=(extra.assistedMathKeys||[]).includes(key(task,kind)),merged={...own,attempted:own.attempted||externalSeen,hinted:own.hinted||externalHelp,uncertain:own.uncertain||extra.historyUnknown===true},relatedMethod=methodContext(state,task);if(kind!=='extension')return {...merged,relatedMethod};const main=groups.get(key(task)),events=(state.events||[]).filter(e=>e.signature===task.competition.signature&&e.type==='solution-main');return {...merged,relatedMethod,relatedMainSolutionViewed:main?.solutionViewed===true||events.length>0,relatedSolutionAt:events.at(-1)?.at||null}}
 function counts(state){const g=[...index(state).values()];return {solved:g.filter(x=>x.solvedMain).length,first:g.filter(x=>x.solvedMain&&x.first?.kind==='main'&&x.cleanFirst).length,extensions:g.filter(x=>x.solvedExtension).length}}
 function solvedKeys(state){return new Set([...index(state).values()].filter(g=>g.solvedMain||g.solvedExtension).map(g=>g.key).concat(additionalHistory(state).solvedMathKeys||[]))}
 function solved(state,task,kind='main'){return solvedKeys(state).has(key(task,kind))}
 return {key,signatureKey,index,exposure,counts,solvedKeys,solved,methodKey,methodContext,noteMethodExposure,METHOD_WINDOW_MS,attachHistoryProvider,invalidate:state=>cache.delete(state)};
})(typeof module!=='undefined'?require('./competition').competitionCreate:competitionCreate,typeof module!=='undefined'?require('./problem_state'):ProblemState);
if(typeof module!=='undefined')module.exports=CompetitionIdentity;

'use strict';
const {competitionAdaptiveProfile,competitionAdaptiveTarget}=((catalog,create,valueEqual,identity)=>{
 const byId=new Map(catalog.map(f=>[f.id,f]));
 function competitionAdaptiveProfile(records,extensionRecords,topicIds,extensionViews={},mainViews={}){
  const scope=new Set(topicIds),events=[],seen=new Set(),variations=new Map(),state={attempts:records,extensions:extensionRecords,views:mainViews,extensionViews};
  for(const h of Object.values(extensionViews||{})){
   if(!h.attempted||typeof h.firstInput!=='string')continue;
   try{const t=create(h.recipe);if(h.signature===t.competition.extension.signature&&h.mainSignature===t.competition.signature){const g=identity.exposure(state,t,'extension');variations.set(h.mainSignature,g.first?.kind==='extension'&&g.cleanFirst)}}catch{}
  }
  // Retrying a variation is useful practice but never an independent first try.
  for(const a of extensionRecords||[]){
   if(a.firstAttempt!==true||variations.has(a.signature))continue;
   try{const t=create(a.recipe);if(t.competition.signature===a.signature&&a.variationSignature===t.competition.extension.signature){const g=typeof a.input==='string'?identity.exposure(state,t,'extension'):null;variations.set(a.signature,g?g.first?.kind==='extension'&&g.cleanFirst:a.correct===true)}}catch{}
  }
  const durable=[];
  for(const h of Object.values(mainViews||{})){
   const a=h.first;if(!a||a.priorSolutionViewed===true)continue;
   try{const t=create(a.recipe);if(t.competition.signature!==h.signature||!Number.isInteger(a.choice)||a.choice<0||a.choice>=5||!Number.isFinite(a.at)||a.at<=0)continue;durable.push({...a,signature:h.signature,correct:a.choice===t.answer,firstAttempt:true,firstCorrect:a.choice===t.answer&&a.hinted!==true})}catch{}
  }
  const candidates=durable.concat(records||[]).map((a,index)=>({...a,order:Number.isSafeInteger(a.order)&&a.order>0?a.order:index+1})).sort((a,b)=>a.at-b.at||a.order-b.order);
  for(const a of candidates){
   const f=byId.get(a.recipe?.familyId);if(!f||!f.topicIds.every(id=>scope.has(id)))continue;
   // Old first-correct facts are usable; unknown first failures are not invented.
   if(!(a.firstAttempt===true&&a.priorSolutionViewed!==true)&&a.firstCorrect!==true)continue;
   let t;try{t=create(a.recipe);if(t.competition.signature!==a.signature||a.correct!==(a.choice===t.answer))continue}catch{continue}
   if(t.competition.integrated&&a.processVerificationVersion!==2)continue;
   const canonical=identity.key(t),g=identity.exposure(state,t);if(seen.has(canonical)||g.first?.kind!=='main'||g.first.signature!==a.signature||g.first.at!==a.at)continue;
   seen.add(canonical);
   const recentMethodOnly=a.correct===true&&a.strategyIndependent===false&&a.relatedMethodExposure?.recent===true&&!a.hinted&&!a.priorSolutionViewed;
   events.push({signature:a.signature,mathKey:canonical,at:a.at,topicIds:f.topicIds,structure:f.reasoningKey||f.strategy,level:f.level,clean:g.cleanFirst===true&&a.strategyIndependent===true,recentMethodOnly,transfer:variations.get(a.signature)});
  }
  const topics={};
  for(const id of topicIds){
   let band=2,stage=[],recent=[],promotions=0,demotions=0;
   for(const e of events.filter(e=>e.topicIds.includes(id))){
    recent.push(e);recent=recent.slice(-4);stage.push(e);stage=stage.slice(-8);
    const struggle=e=>!e.clean&&!e.recentMethodOnly||e.transfer===false;
    // Require two different first attempts, never two clicks on one problem.
    if(recent.filter(struggle).length>=2&&struggle(e)){
     if(band>1){band--;demotions++}recent=[];stage=[];continue;
    }
    const clean=stage.filter(e=>e.clean&&e.transfer!==false&&e.level>=band),structures=new Set(clean.map(e=>e.structure));
    const transfer=clean.some(e=>e.transfer===true),probe=clean.some(e=>e.level>band);
    if(band<3&&probe&&structures.size>=2&&clean.length>=(transfer?2:3)){
     band++;promotions++;stage=[];recent=[];
    }
   }
   const clean=stage.filter(e=>e.clean&&e.transfer!==false&&e.level>=band);
   const ready=band<3&&recent.length>=2&&recent.slice(-2).every(e=>e.clean&&e.transfer!==false&&e.level>=band);
   topics[id]={band,target:ready?band+1:band,probe:ready,firstProblems:events.filter(e=>e.topicIds.includes(id)).length,promotions,demotions,cleanRecent:clean.length};
  }
  return {topics,eventCount:events.length};
 }
 function competitionAdaptiveTarget(profile,family){
  const rows=family.topicIds.map(id=>profile.topics[id]||{band:2,target:2,probe:false});
  return {level:Math.min(...rows.map(r=>r.target)),probe:rows.every(r=>r.probe),band:Math.min(...rows.map(r=>r.band))};
 }
 return {competitionAdaptiveProfile,competitionAdaptiveTarget};
})(typeof module!=='undefined'?require('./competition_reviewed').COMPETITION_REVIEWED:COMPETITION_REVIEWED,typeof module!=='undefined'?require('./competition').competitionCreate:competitionCreate,typeof module!=='undefined'?require('./competition').competitionValueEqual:competitionValueEqual,typeof module!=='undefined'?require('./competition_identity'):CompetitionIdentity);
if(typeof module!=='undefined')module.exports={competitionAdaptiveProfile,competitionAdaptiveTarget};

'use strict';
let competitionSceneSerial=0;
function competitionScene(d){
 const e=esc,numeric=v=>typeof v==='string'&&v.includes('/')?v.split('/').map(Number).reduce((a,b)=>a/b):Number(v);
 const caption=d.caption||'',uid='scene-'+(++competitionSceneSerial),text=(x,y,t,anchor='middle')=>`<text x="${x}" y="${y}" text-anchor="${anchor}">${e(t)}</text>`;
 const svg=(art,description=caption,w=480,h=240)=>`<svg class="scene-svg" viewBox="0 0 ${w} ${h}" role="img" aria-label="${e(description)}"><title>${e(description)}</title><defs><linearGradient id="${uid}-shine" x2="0" y2="1"><stop stop-color="#fff9be"/><stop offset=".5" stop-color="#f7c64d"/><stop offset="1" stop-color="#ca8a18"/></linearGradient><linearGradient id="${uid}-blue" x2="0" y2="1"><stop stop-color="#adddf9"/><stop offset="1" stop-color="#4694cc"/></linearGradient><linearGradient id="${uid}-red" x2="0" y2="1"><stop stop-color="#ffb09e"/><stop offset="1" stop-color="#d8584b"/></linearGradient></defs>${art}</svg>`;
 const wrap=body=>`<figure class="competition-scene" data-scene-kind="${e(d.kind)}">${body}${caption?`<figcaption>${e(caption)}</figcaption>`:''}</figure>`;
 const person=(color='blue')=>`<span class="scene-person ${color}" data-quantity-glyph aria-hidden="true"><i class="scene-head"><b></b></i><i class="scene-body"></i><i class="scene-arm left"></i><i class="scene-arm right"></i><i class="scene-leg left"></i><i class="scene-leg right"></i></span>`;
 const object=(type,color)=>type==='person'?person(color):`<span class="scene-object ${e(type||'block')} ${color}" data-quantity-glyph aria-hidden="true"></span>`;
 const objects=(count,type='block',color='blue')=>{
  if(!Number.isInteger(count)||count<0)return `<span class="scene-unknown" data-count-mode="unknown" aria-label="数量未知">?</span>`;
  if(count>18)return `<span class="scene-compressed" data-count-mode="compressed" data-represented-count="${count}" aria-label="图标为示意，共${count}个">${object(type,color)}<b>× ${count}</b><small>图标为示意</small></span>`;
  return '<span class="scene-exact" data-count-mode="exact" data-represented-count="'+count+'">'+(Array.from({length:count},()=>object(type,color)).join('')||'<span class="scene-empty">0</span>')+'</span>';
 };
 const score=v=>{
  if(v===null||v===undefined)return '';
  const amount=numeric(v);
  let coins='',multiplier='';
  if(amount===0)coins='';
  else if(amount>0&&amount<=12){const whole=Math.floor(amount),part=amount-whole;coins=Array.from({length:whole},()=>'<i class="scene-point" aria-hidden="true"></i>').join('');if(part>1e-10)coins+=`<i class="scene-point scene-partial-point" style="--part:${part}" aria-hidden="true"></i>`}
  else {coins='<i class="scene-point" aria-hidden="true"></i>';multiplier='× '}
  return `<span class="scene-score"><span class="scene-points" data-token-value="${e(v)}"${Number.isInteger(amount)&&amount<=12?` data-token-count="${amount}"`:''}>${coins}</span><strong>${multiplier}${e(v)}</strong></span>`;
 };
 if(d.kind==='scene-stage'){
  const scene=d.stage.kind==='solution'&&d.scene?.kind==='scene-twoTimelines'?{...d.scene,draft:false}:d.scene;
  const picture=d.routeDiagram?competitionDiagram(d.routeDiagram):competitionDiagram(scene);
  return `<section class="scene-stage" data-scene-stage="${e(d.stage.kind)}" data-step="${d.stage.step||0}">${picture}<p class="scene-step-caption">${e(d.stage.text)}</p></section>`;
 }
 if(d.kind==='scene-quantities'){
  let art='';let y=18;const positions=new Map();for(const [i,q]of d.quantities.entries()){
   if(i&&!d.dependencyGraph)art+=`<path d="M240 ${y-12} V${y-2} l-4 -5 m4 5 l4 -5" class="scene-line"/>`;
   const lines=String(q.label).match(/.{1,25}/gu)||[''];const h=36+lines.length*18;
   if(d.dependencyGraph)for(const id of q.prerequisiteIds||[]){const p=positions.get(id);if(p)art+='<path d="M24 '+(p.y+p.h/2)+' H12 V'+(y+h/2)+' H24 l-5 -4 m5 4 l-5 4" class="scene-line" data-from="'+e(id)+'" data-to="'+e(q.id)+'"/>'}positions.set(q.id,{y,h});art+='<g data-quantity-id="'+e(q.id||'quantity-'+i)+'" data-provided-by="'+e(q.providedBy||'content')+'">';
   art+=`<rect x="24" y="${y}" width="432" height="${h}" rx="8" class="scene-shape"/>`;
   lines.forEach((line,j)=>art+=text(240,y+20+j*18,line));art+=text(240,y+23+lines.length*18,`${q.value} ${q.unit||''}`);art+='</g>';y+=h+18;
  }return wrap(svg(art,caption||'按条件连接已确认的中间量',480,Math.max(100,y)));
 }
 if(d.kind==='scene-groupDraft')return wrap(`<div class="scene-groups">${['甲','乙','丙'].map(name=>`<section class="scene-group"><b>${name}组</b><div class="scene-unknown">?</div></section>`).join('')}</div><p>总共 ${e(d.T)} 人；甲比乙${d.direction===1?'多':'少'} ${e(d.d)} 人；丙是${d.ref==='A'?'甲':'乙'} ${e(d.k)} 倍</p>`);
 if(d.kind==='scene-digitRange')return wrap(`<p>严格区间：${e(d.lo)} ＜ 数 ＜ ${e(d.hi)}${d.evenOnly?'；只计偶数':''}</p><div class="scene-choice-cards">${Array.from({length:9},(_,i)=>`<b>个位 ${i+1}</b>`).join('')}</div><p>按非零个位分组；每组的合法数由你检查。</p>`);
 if(d.kind==='scene-hiddenL'){
  const side=d.inner+2*d.border,b=d.border/side*160,q=d.inner/side*160,x=145,y=28;
  const art=`<rect x="${x}" y="${y}" width="160" height="160" class="scene-domain"/><path d="M${x} ${y+b} H${x+b} V${y+b+q} H${x+b+q} V${y+160} H${x} Z" fill="#94bbc7"/><rect x="${x}" y="${y}" width="${b}" height="${b}" class="scene-shape"/><rect x="${x+b}" y="${y+b}" width="${q}" height="${q}" class="scene-shape"/><rect x="${x+b+q}" y="${y+b+q}" width="${b}" height="${b}" class="scene-shape"/>`+text(x+b/2,y-8,d.border)+text(x+b+q/2,y+b+q-7,d.inner)+text(x+173,y+b/2,d.border)+text(x+173,y+b+q+b/2,d.border)+text(225,219,d.target==='perimeter'?'阴影周长 ?':'阴影面积 ?');return wrap(svg(art,'三个小正方形已知边长；需要推得阴影外框边长，不按图估测'));
 }
 if(d.kind==='scene-units')return wrap(`<div class="scene-groups">${d.groups.map((g,i)=>`<section class="scene-group" data-quantity-id="group-${i}" data-quantity-role="${e(g.quantityRole||'given')}" data-count="${e(g.count)}"><header><b>${e(g.name)}</b><span>${e(g.count)} ${e(g.unit)}</span></header><div class="scene-objects">${objects(g.count,d.object,i===0?'red':'blue')}</div>${g.score!==null&&g.score!==undefined?`<div class="scene-per-person">${d.scoreLabel||('每'+(d.object==='person'?'人':['ticket','stamp'].includes(d.object)?'张':d.object==='coin'?'枚':'个'))} ${score(g.score)} ${e(d.scoreUnit||(['ticket','stamp','coin'].includes(d.object)?'元':'分'))}</div>`:''}</section>`).join('')}</div>${d.average!==undefined?`<p class="scene-target">全体平均：${e(d.average)} 分</p>`:''}`);
 if(d.kind==='scene-share')return wrap(`<p class="scene-target">总分 ${e(d.totalScore)} ÷ ${d.people} 份</p><div class="scene-share-people">${Array.from({length:d.people},()=>`<div>${person('blue')}<div>${score(d.average)}</div></div>`).join('')}</div>${d.base!==null?`<p class="scene-target">每人 ${e(d.base)} + ${e(d.extraAverage)} = ${e(d.average)}</p>`:''}`);
 if(d.kind==='scene-areaPairs')return wrap(`<div class="scene-area-pairs">${d.rows.map(r=>`<div><svg class="scene-pair-svg" viewBox="0 0 150 95" role="img" aria-label="长${r.h}，宽${r.w}，面积${r.area}"><rect x="12" y="10" width="${110*r.h/Math.max(r.w,r.h)}" height="${65*r.w/Math.max(r.w,r.h)}" fill="#b8d8e9" stroke="#577b92"/><text x="75" y="91" text-anchor="middle">${r.w} × ${r.h} = ${r.area}</text></svg></div>`).join('')}</div>`);
 if(d.kind==='scene-purchase'){
  const packs=d.packs||[{size:d.size,price:d.pack}];
  const type=/苗/.test(d.object)?'seedling':'pencil',unit=d.object?.[0]||'支';
  return wrap(`<div class="scene-purchase"><div class="scene-products">${packs.map((p,i)=>`<section class="scene-package" data-quantity-id="pack-${i}"><div class="scene-package-top">每包 ${e(p.size)} ${e(unit)}</div><div class="scene-package-items" data-package-size="${e(p.size)}">${objects(p.size,type,'blue')}</div><div class="scene-price">每包 ${e(p.price)} 元</div></section>`).join('')}${d.single!==undefined?`<section class="scene-single" data-quantity-id="single"><b>单买 1 ${e(unit)}</b>${objects(1,type)}<p>单${e(unit)} ${e(d.single)} 元</p></section>`:''}</div><div class="scene-demand"><b>需要 ${d.enough?'至少':'恰好'} ${e(d.count)}</b><span>${e(d.object||'支笔')}</span></div></div>`);
 }
 if(d.kind==='scene-slots')return wrap(`<div class="scene-slots"${d.choose?` data-choose="${d.choose}"`:''}>${d.values.map((v,i)=>`<div class="scene-slot"><b>${e(v)}</b>${d.positions?`<span>${e(d.positionUnit&&typeof (d.positionLabels?.[i]??i+1)==='number'?'第'+(d.positionLabels?.[i]??i+1)+d.positionUnit:d.positionLabels?.[i]??i+1)}</span>`:''}</div>`).join('')}</div>`);
 if(d.kind==='scene-placeValue')return wrap(`<div class="scene-place-rows">${d.rows.map(r=>`<div><span>${e(r.label)}</span><div class="scene-slots">${r.digits.map((digit,i)=>`<div class="scene-slot"><b>${e(digit)}</b><small>${e(['百位','十位','个位'].slice(-r.digits.length)[i])}</small></div>`).join('')}</div></div>`).join('')}</div>`);
 if(d.kind==='scene-flow')return wrap(`<div class="scene-flow">${d.nodes.map((n,i)=>`${i?'<span class="scene-flow-arrow" aria-hidden="true">→</span>':''}<div class="scene-flow-node"><span>${e(n.label)}</span><b>${e(n.value)}</b></div>`).join('')}</div>`);
 if(d.kind==='scene-twoFlows')return wrap(`<div class="scene-two-flows">${d.rows.map(r=>`<div><b>${e(r.name)}</b><div class="scene-flow">${r.nodes.map((value,i)=>`${i?'<span class="scene-flow-arrow" aria-hidden="true">→</span>':''}<div class="scene-flow-node"><b>${e(value)}</b></div>`).join('')}</div></div>`).join('')}</div>`);
 if(d.kind==='scene-strips'){
  const max=Math.max(...d.rows.map(r=>r.parts));
  return wrap(`<div class="scene-strip-rows">${d.rows.map((r,i)=>{const cells=!d.continuous&&Number.isInteger(r.parts)&&r.parts<=24?Array.from({length:r.parts},()=>'<i></i>').join(''):'<i></i>';return `<div class="scene-strip-row"><b>${e(r.label)}</b><div class="scene-strip ${i%2?'blue':'red'}" style="width:${d.separateWholes?100:Math.max(6,100*r.parts/max)}%" data-parts="${r.parts}">${cells}</div><span>${e(r.value)}</span></div>`}).join('')}</div>`);
 }
 if(d.kind==='scene-fractions'){
  const cells=(n,used)=>Array.from({length:n},(_,i)=>`<i class="${i<used?'scene-used':''}"><span>${i<used?'用':'留'}</span></i>`).join('');
  return wrap(`<div class="scene-fraction-rows"><section><header>最初：${e(d.start)} ${e(d.unit)}</header><div class="scene-fraction-strip">${cells(d.d1,1)}</div><small>第一次的整体是最初全部</small></section><section class="${d.original?'':'scene-subwhole'}"${d.original?'':` style="width:${100*(d.secondOfUsed?1:d.d1-1)/d.d1}%"`}><header>第二次整体：${d.original?'最初全部':d.secondOfUsed?'第一次用掉':'第一次剩余'}</header><div class="scene-fraction-strip">${cells(d.d2,1)}</div><small>用掉这个整体的 1/${d.d2}</small></section><p>最后剩 ${e(d.left)} ${e(d.unit)}</p></div>`);
 }
 if(d.kind==='scene-join'){
  let art='';const pieceW=Math.min(116,360/d.n),lapW=pieceW*.16,x0=45,y=d.closed?45:85;
  if(!d.closed){for(let i=0;i<d.n;i++){const x=x0+i*(pieceW-lapW);art+=`<rect x="${x}" y="${y+i%2*7}" width="${pieceW}" height="35" rx="6" fill="url(#${uid}-${i%2?'red':'blue'})" stroke="#356878"/>`;if(i)art+=`<rect x="${x}" y="${y}" width="${lapW}" height="42" class="scene-overlap"/>`;art+=text(x+pieceW/2,y-14+i%2*7,'段'+(i+1))}
   art+=text(240,163,`每段 ${d.piece} 厘米；搭接 ${d.lap} 厘米`)+text(240,190,`长条总长 ${d.total} 厘米`);
  }else{
   for(let i=0;i<d.n;i++){const a=2*Math.PI*i/d.n,b=2*Math.PI*(i+1)/d.n,x=240+98*Math.cos(a),yy=102+65*Math.sin(a),xx=240+98*Math.cos(b),yyy=102+65*Math.sin(b);art+=`<path d="M${x} ${yy} L${xx} ${yyy}" stroke="${i%2?'#dc7664':'#64a7d4'}" stroke-width="19" stroke-linecap="round"/><circle cx="${x}" cy="${yy}" r="12" class="scene-overlap"/>`+text(240+140*Math.cos(a+Math.PI/d.n),102+85*Math.sin(a+Math.PI/d.n),'段'+(i+1))}
   art+=text(240,98,`每段 ${d.piece} 厘米`)+text(240,124,`每处重叠 ${d.lap} 厘米`);
  }return wrap(svg(art,`${d.n} 段${d.closed?'首尾闭合':'排成长条'}；每段 ${d.piece}，每处重叠 ${d.lap}；示意不按长度比例`));
 }
 if(d.kind==='scene-intervals'){
  if(d.draft)return wrap(svg('<path d="M40 92 H440" class="scene-line"/><circle cx="40" cy="92" r="6" class="scene-open-mark"/><circle cx="100" cy="92" r="6" class="scene-open-mark"/><path d="M125 92 H365" stroke-dasharray="8 7" class="scene-line"/>'+text(70,68,d.gap+'米')+text(245,145,'其余间隔与标记由你建立')+text(240,180,`总长 ${d.distance} 米；${d.ends?'两端放标记':'两端不放标记'}`),'一个间隔示意；未预先画出全部答案标记'));
  const k=d.distance/d.gap;let art='<path d="M35 92 H445" class="scene-line"/>';
  for(let i=0;i<=k;i++){const x=35+410*i/k,active=d.ends||i>0&&i<k;art+=`<circle cx="${x}" cy="92" r="${active?7:5}" class="${active?'scene-mark':'scene-open-mark'}"/>`+text(x,124,i*d.gap);if(i<k)art+=text(x+205/k,67,d.gap)}
  art+=text(240,172,`总长 ${d.distance} 米；${d.ends?'端点也放':'端点不放（空心）'}`);return wrap(svg(art));
 }
 if(d.kind==='scene-ratioBorder'){
  const art='<rect x="110" y="50" width="210" height="140" class="scene-shape"/>'+(d.border!==null?'<rect x="130" y="70" width="170" height="100" fill="white" stroke="#54758b"/>':'')+(d.gate?'<path d="M190 190 H240" stroke="white" stroke-width="6"/>':'')+text(215,215,'长3份；宽2份')+text(215,25,'周长 '+d.perimeter+' 米；宽 '+d.width+' 米')+(d.border!==null?text(395,115,'边框宽 '+d.border+' 米'):text(395,115,'门洞 '+d.gate+' 米'));
  return wrap(svg(art,caption));
 }
 if(d.kind==='scene-ratioRectangle'){
  let art=`<rect x="70" y="50" width="${290*d.b/(d.a+d.b)}" height="${120*d.a/(d.a+d.b)}" class="scene-shape"/>`+text(240,185,`长 ${d.b} 份`)+text(380,108,`宽 ${d.a} 份`)+text(240,24,`一周 ${d.perimeter} 米`)+(d.width!==null?text(240,211,`宽 ${d.width} 米`):text(240,211,`长 ${d.length} 米`));return wrap(svg(art,caption+'；示意图，比例按标注'));
 }
 if(d.kind==='scene-fixedPerimeter')return wrap(svg('<rect x="50" y="55" width="165" height="70" class="scene-shape"/><rect x="280" y="38" width="118" height="100" class="scene-shape"/>'+text(130,151,'长 ?，宽 ?')+text(340,162,'长 ?，宽 ?')+text(240,25,`同一周长 ${2*d.half}`),'同周长长方形的不同形状；示意图，边长未知'));
 if(d.kind==='scene-overlapSequence'){
  const start=40,cell=400/d.n,firstEnd=start+d.k*cell,lastStart=start+(d.k-1)*cell;
  let art=`<rect x="${start}" y="58" width="${d.k*cell}" height="56" rx="8" fill="#fbe1d7"/><rect x="${lastStart}" y="88" width="${d.k*cell}" height="56" rx="8" fill="#c4dfef"/>`;
  for(let i=0;i<d.n;i++)art+=`<rect x="${start+i*cell+2}" y="96" width="${cell-4}" height="30" rx="4" fill="${i===d.k-1?'#f9ca63':'white'}" stroke="#66858b"/>`+text(start+(i+.5)*cell,117,i===d.k-1&&d.knownMiddle!==null&&d.knownMiddle!==undefined?d.knownMiddle:'?')+text(start+(i+.5)*cell,163,i+1);
  art+=text((start+firstEnd)/2,40,`前 ${d.k} 个${d.totals?'合计 '+d.totals[0]:'平均 '+d.means[0]}`)+text((lastStart+440)/2,191,`后 ${d.k} 个${d.totals?'合计 '+d.totals[1]:'平均 '+d.means[1]}`)+text(240,216,`全部 ${d.n} 个${d.totals?'合计 '+d.totals[2]:'平均 '+d.means[2]}`);return wrap(svg(art,caption));
 }
 if(d.kind==='scene-balance'){
  let art='<path d="M240 91 V162 M195 166 H285 M86 65 H394 M98 65 V105 M382 65 V105" class="scene-line"/><path d="M42 105 Q98 160 154 105 Z M326 105 Q382 160 438 105 Z" class="scene-shape"/>';
  for(const [side,x]of [[d.left,52],[d.right,336]]){for(let i=0;i<side.boxes;i++)art+=`<rect x="${x+i*19}" y="83" width="16" height="20" rx="3" fill="url(#${uid}-blue)" stroke="#406d89"/>`;art+=text(x+44,151,side.weight+' 克')}
  art+=text(98,28,'左')+text(382,28,'右');return wrap(svg(art));
 }
 if(d.kind==='scene-circle'){
  const n=d.values.length;let art='';
  if(d.sectors){for(let i=0;i<n;i++){const a=-Math.PI/2+2*Math.PI*i/n,b=a+2*Math.PI/n,x=240+76*Math.cos(a),y=99+76*Math.sin(a),xx=240+76*Math.cos(b),yy=99+76*Math.sin(b),middle=(a+b)/2,val=d.values[i];art+=`<path d="M240 99 L${x} ${y} A76 76 0 ${b-a>Math.PI?1:0} 1 ${xx} ${yy} Z" fill="${d.excluded?.includes(val)?'#e8e8e8':val==='A'?'#f2bda5':val==='B'?'#b0d7ea':'#c6dfb5'}" stroke="white"/>`+text(240+54*Math.cos(middle),99+54*Math.sin(middle),val)}
  }else{art='<ellipse cx="240" cy="105" rx="118" ry="65" class="scene-tabletop"/>';for(let i=0;i<n;i++){const a=-Math.PI/2+2*Math.PI*i/n,x=240+143*Math.cos(a),y=105+79*Math.sin(a);art+=`<circle cx="${x}" cy="${y}" r="17" class="scene-shape"/>`+text(x,y+5,d.values[i])}}
  return wrap(svg(art));
 }
 if(d.kind==='scene-timeline'){
  const values=d.events,min=Math.min(...values),max=Math.max(...values),x=v=>55+370*(v-min)/(max-min||1);let art='<path d="M45 100 H440" class="scene-line"/>';
  for(const v of values)art+=`<circle cx="${x(v)}" cy="100" r="5" class="scene-mark"/>`+text(x(v),137,v);
  if(d.omittedInterval)art+=text((x(d.omittedInterval[0])+x(d.omittedInterval[1]))/2,82,'…');
  return wrap(svg(art,caption));
 }
 if(d.kind==='scene-twoTimelines'){
  if(d.draft)return wrap(`<div class="scene-timeline-draft">${d.periods.map((p,i)=>'<section><b>'+(i?'乙铃':'甲铃')+'</b><p>第一次：'+e(d.offsets?.[i]||0)+' 分钟；之后每 '+e(p)+' 分钟一次。</p><p class="scene-unknown">下一次：? → ? → …</p></section>').join('')}</div><p>把各自的时刻补上，再检查共同点。单位：分钟。</p>`);
  let art='';for(let j=0;j<2;j++){const y=68+78*j,offset=d.offsets?.[j]||0;art+=`<path d="M45 ${y} H440" class="scene-line"/>`+text(23,y+6,j?'乙':'甲');for(let t=offset;t<=d.end;t+=d.periods[j]){const x=45+395*t/(d.end||1);art+=`<circle cx="${x}" cy="${y}" r="4" class="${!t&&!d.includeStart?'scene-open-mark':'scene-mark'}"/>`+text(x,y+24,t)}}return wrap(svg(art));
 }
 if(d.kind==='scene-journey')return wrap(`<div class="scene-journeys">${d.segments.map((s,i)=>`<div><b>${e(s.name)}</b><div class="scene-track"><i>${i?'←':'→'}</i></div><span>${e(s.speed)} ${e(d.speedUnit||(d.distance?'千米/时':'米/分钟'))}</span>${d.distance?`<small>路程 ${d.distance}</small>`:''}</div>`).join('')}</div>${d.delay?`<p>先行时间 ${d.delay} 分钟</p>`:''}`);
 if(d.kind==='scene-climb'){
  const top=25,bottom=175,x=210;let art=`<path d="M${x} ${top} V${bottom}" class="scene-line"/><path d="M185 ${top} H255" stroke="#bf7256" stroke-width="4"/>`+text(289,top+5,d.height+'米')+text(184,bottom+20,'0');
  art+=`<path d="M170 ${bottom} V${bottom-140*d.up/d.height}" class="scene-up"/><path d="M250 ${bottom-140*d.up/d.height} V${bottom-140*(d.up-d.down)/d.height}" class="scene-down"/>`+text(113,111,'白天 +'+d.up)+text(326,144,'夜晚 −'+d.down);return wrap(svg(art));
 }
 if(d.kind==='scene-choices')return wrap(`<div class="scene-choice-cards">${d.values.map(x=>`<b>${e(x)}</b>`).join('')}</div><div class="scene-slots">${Array.from({length:d.places},(_,i)=>`<div class="scene-slot"><b>?</b><span>${i?'个位':'十位'}</span></div>`).join('')}</div><p>${d.repeat?'允许重复':'不能重复同一张卡'}</p>`);
 if(d.kind==='scene-product')return wrap(svg(`<rect x="54" y="35" width="135" height="135" class="scene-shape"/><rect x="272" y="35" width="157" height="112" class="scene-shape"/><rect x="272" y="35" width="23" height="112" fill="#f2c16b"/>`+text(120,197,`${d.n} × ${d.n}`)+text(350,180,`${d.n-d.delta} × ${d.n+d.delta}`),caption+'；分配关系示意，不按数字作单位格'));
 if(d.kind==='scene-squareBounds')return wrap(svg('<path d="M75 105 H405" class="scene-line"/><path d="M115 91 V119 M365 91 V119" class="scene-line"/><circle cx="240" cy="105" r="5" class="scene-mark"/>'+text(115,152,'?²')+text(240,81,d.n)+text(365,152,'(?+1)²')+text(240,193,d.upper?'求右侧边界整数':'求左侧边界整数'),caption));
 if(d.kind==='scene-age')return wrap(`<div class="scene-two-flows"><div><b>孩子</b><div class="scene-flow"><div class="scene-flow-node">${d.ago}年前 ?</div><span>→</span><div class="scene-flow-node">现在 ${e(d.child)}</div><span>→</span><div class="scene-flow-node">未来 ?</div></div></div><div><b>大人</b><div class="scene-flow"><div class="scene-flow-node">${d.ago}年前 ?</div><span>→</span><div class="scene-flow-node">现在 ${e(d.parent)}</div><span>→</span><div class="scene-flow-node">未来 ?</div></div></div><p>同一时刻，年龄差总为 ${d.gap}</p></div>`);
 if(d.kind==='scene-factorPairs')return wrap(svg('<rect x="55" y="45" width="160" height="90" class="scene-shape"/><rect x="280" y="26" width="80" height="160" class="scene-shape"/>'+text(135,165,'长 ? × 宽 ?')+text(400,108,'?')+text(240,213,`面积都为 ${d.product}`),caption+'；因数对应两条边，形状为示意'));
 if(d.kind==='scene-exponentGrid'){
  const cell=Math.min(25,330/(d.a+1),145/(d.b+1));let art='';for(let j=0;j<=d.b;j++)for(let i=0;i<=d.a;i++)art+=`<rect x="${70+i*cell}" y="${40+j*cell}" width="${cell}" height="${cell}" fill="${d.even&&(i%2||j%2)?'#ececea':'#acd1e7'}" stroke="white"/>`;
  art+=text(240,202,`2的指数：0…${d.a}；3的指数：0…${d.b}`)+text(240,22,'每个位置对应一个正因数');return wrap(svg(art));
 }
 if(d.kind==='scene-cumulative')return wrap(`<div class="scene-cumulative">${d.values.map((v,i)=>`<div><b>≤${i+1} 分：${v} 人</b><div class="scene-cumulative-bar" style="width:${100*v/d.values.at(-1)}%">${Array.from({length:i+1},(_,j)=>`<i>${j+1}分档</i>`).join('')}</div></div>`).join('')}</div>`);
 if(d.kind==='scene-branch')return wrap(`<div class="scene-branches">${d.branches.map(b=>`<div class="scene-flow"><div class="scene-flow-node"><b>${e(b.label)} ${b.count} 种</b></div>${b.next?`<span>→</span><div class="scene-flow-node"><b>${e(b.next.label)} ${b.next.count} 种</b></div>`:''}</div>`).join('<b class="scene-or">或</b>')}</div>${d.drinks?'<p class="scene-all-branches">两种午餐分支都再配：3种饮料</p>':''}`);
 if(d.kind==='scene-diceGrid'){
  const cell=Math.min(17,145/d.faces);let art='';for(let j=1;j<=d.faces;j++)for(let i=1;i<=d.faces;i++)art+=`<rect x="${125+(i-1)*cell}" y="${28+(j-1)*cell}" width="${cell}" height="${cell}" fill="${d.different&&i===j?'#e4e4e4':'#bdd9e9'}" stroke="white"/>`;
  art+=text(240,196,`行、列点数各 1 到 ${d.faces}，每格一个有序对`)+text(240,219,`目标：点数和 ${d.target}${d.different?'；灰色对角线不在样本中':''}`);return wrap(svg(art));
 }
 if(d.kind==='scene-remainderCards'){
  if(d.draft)return wrap(`<p>卡片范围：${d.includeZero?'0，':''}1 到 ${e(d.count)}；除以 ${e(d.mod)}，目标余数 ${e(d.wanted)}</p><div class="scene-slots">${Array.from({length:d.mod},(_,i)=>`<div class="scene-slot"><b>?</b><span>余 ${i}</span></div>`).join('')}</div><p>每种余数对应哪些卡？请自己分组。</p>`);
  const blocks=Math.floor(d.count/d.mod),tail=d.count%d.mod;return wrap(`<div class="scene-remainder-cards">${d.includeZero?'<b class="scene-card">0</b>':''}<div class="scene-slots">${Array.from({length:d.mod},(_,i)=>`<div class="scene-slot"><b>${i+1}</b><span>余 ${(i+1)%d.mod}</span></div>`).join('')}</div><p>这样的完整组共 ${blocks} 组</p><div class="scene-slots">${Array.from({length:tail},(_,i)=>`<div class="scene-slot"><b>${blocks*d.mod+i+1}</b><span>余 ${i+1}</span></div>`).join('')}</div><p>目标余数 ${d.wanted}</p></div>`);
 }
 if(d.kind==='scene-sets'){
  let art='<rect x="35" y="15" width="410" height="182" rx="12" class="scene-domain"/><ellipse cx="197" cy="102" rx="101" ry="64" fill="#ffb19c" fill-opacity=".55" stroke="#ab6554"/><ellipse cx="292" cy="102" rx="101" ry="64" fill="#86bfdf" fill-opacity=".55" stroke="#477693"/>';
  const names=d.names||['甲组','乙组'];art+=text(160,74,names[0]+' '+d.a)+text(333,74,names[1]+' '+d.b)+text(246,118,'交集 '+d.both);
  if(d.total!==null)art+=text(240,181,(d.conditional?'原全体 ':'全体 ')+d.total);
  if(d.conditional)art+=text(240,220,'圈外排除；只在两圈的覆盖区域取样');
  if(d.change)art+=text(240,220,d.change==='one-joins-second'?`一个只在${names[0]}的人 → 也加入${names[1]}`:'一个圈外的人 → 同时加入两组');
  return wrap(svg(art,caption+'；区域面积不代表人数'));
 }
 if(d.kind==='scene-threeSets')return wrap(svg('<circle cx="205" cy="91" r="67" fill="#efd7bd" fill-opacity=".6" stroke="#977c59"/><circle cx="280" cy="91" r="67" fill="#b2d1e4" fill-opacity=".6" stroke="#5b7a91"/><circle cx="242" cy="149" r="67" fill="#c9dcb2" fill-opacity=".6" stroke="#6d855d"/>'+text(242,59,'甲乙 '+d.ab)+text(186,152,'甲丙 '+d.ac)+text(300,152,'乙丙 '+d.bc)+text(242,115,'三组 '+d.triple),caption+'；两组数字包含中心，不按区域面积估人数'));
 if(d.kind==='scene-ballRule')return wrap(`<div class="scene-groups"><div class="scene-group"><b>白球 ${d.white}</b><div class="scene-objects">${objects(d.white,'ball','white')}</div></div><div class="scene-group"><b>黑球 ${d.black}</b><div class="scene-objects">${objects(d.black,'ball','black')}</div></div></div><div class="scene-flow"><span>白白 / 黑黑</span><span>→</span>${object('ball','black')}<span>；白黑</span><span>→</span>${object('ball','white')}</div>`);
 if(d.kind==='scene-direction'){
  const names=['上0','右1','下2','左3'];return wrap(svg('<circle cx="130" cy="105" r="59" class="scene-domain"/>'+names.map((t,i)=>text(130+87*Math.sin(i*Math.PI/2),105-70*Math.cos(i*Math.PI/2),t)).join('')+`<path d="M130 125 V62 L120 75 M130 62 L140 75" transform="rotate(${d.start*90} 130 105)" class="scene-line"/>`+text(330,82,(d.anticlockwise?'逆':'顺')+'时针 '+d.turns+'×90°')+(d.mirror?text(330,128,d.reverseOrder?'先镜像后旋转':'先旋转后镜像'):''),caption));
 }
 if(d.kind==='scene-stairs'){
  const size=Math.min(14,330/d.n,145/d.n);let art='';for(let x=0;x<d.n;x++)for(let y=0;y<=x;y++)for(let z=d.depth-1;z>=0;z--){const xx=65+x*size+z*size*.35,yy=190-y*size-z*size*.25;art+=`<path d="M${xx} ${yy} l${size} 0 v${-size} h${-size} Z" fill="url(#${uid}-blue)" stroke="#547a91" stroke-width=".5"/><path d="M${xx} ${yy-size} l${size} 0 l${size*.3} ${-size*.3} h${-size} Z" fill="#d2e6f6"/>`}
  art+=text(240,24,`${d.n} 列，厚 ${d.depth} 块；左起高度逐列加1`);return wrap(svg(art));
 }
 if(d.kind==='scene-tiledRectangle')return wrap(svg('<rect x="70" y="38" width="310" height="135" class="scene-shape"/><rect x="70" y="38" width="48" height="48" fill="#f6d495" stroke="#967858"/>'+text(94,66,'?')+text(225,204,`长 ${d.w} 米`)+text(424,112,`宽 ${d.h} 米`),caption+'；标出未知正方形规格，示意不按比例'));
 if(d.kind==='scene-coordinates'){
  const minX=Math.min(0,...[d.a[0],d.b[0]])-1,maxX=Math.max(0,d.a[0],d.b[0])+1,minY=Math.min(0,d.a[1],d.b[1])-1,maxY=Math.max(0,d.a[1],d.b[1])+1,X=x=>65+330*(x-minX)/(maxX-minX),Y=y=>185-145*(y-minY)/(maxY-minY);let art=`<path d="M${X(minX)} ${Y(0)} H${X(maxX)} M${X(0)} ${Y(minY)} V${Y(maxY)}" class="scene-line"/>`;
  for(const [name,p]of [['A',d.a],['B',d.b]])art+=`<circle cx="${X(p[0])}" cy="${Y(p[1])}" r="5" class="scene-mark"/>`+text(X(p[0]),Y(p[1])-14,`${name}(${p.join(',')})`);
  art+=`<path d="M${X(d.a[0])} ${Y(d.a[1])} ${d.gridOnly?`H${X(d.b[0])} V${Y(d.b[1])}`:`L${X(d.b[0])} ${Y(d.b[1])}`}" class="scene-up"/>`;return wrap(svg(art));
 }
 if(d.kind==='scene-ladder')return wrap(svg('<path d="M125 23 V175 H392" class="scene-line"/><path d="M125 40 L295 175" stroke="#c18b46" stroke-width="8"/>'+(!d.nextBase?'':'<path d="M125 72 L353 175" stroke="#668daf" stroke-width="7"/>')+text(213,69,`梯长 ${d.length}`)+text(230,204,`底距 ${d.base}`)+text(63,111,`高度 ${d.height}`),caption+'；只按标签给定长度，位置为示意'));
 if(d.kind==='scene-cube'){
  let art='<path d="M157 75 L240 30 L323 75 L323 166 L240 210 L157 166 Z" fill="#cfe3ef" stroke="#54758b"/><path d="M157 75 L240 118 L323 75 M240 118 V210" class="scene-line"/><path d="M157 75 L240 30 L323 75 L240 118 Z" fill="#f2bfa7" stroke="#9a7567"/>';
  for(let i=1;i<d.n;i++){const q=i/d.n;art+=`<path d="M${157+83*q} ${75+43*q} L${240+83*q} ${30+45*q} M${157+83*q} ${75-45*q} L${240+83*q} ${118-43*q} M${157+83*q} ${75+43*q} V${166+44*q} M${240+83*q} ${118-43*q} V${210-44*q}" class="scene-cube-grid"/>`}
  art+=text(391,145,`每棱 ${d.n} 个`)+text(391,181,d.faces.includes('all')?'六面涂色':'只涂顶、底');return wrap(svg(art,caption+'；显示三个可见面，其余面按条件说明'));
 }
 if(d.kind==='scene-holeRectangle')return wrap(svg(`<path d="M70 40 H380 V176 H70 Z M${140} 78 V132 H${140+130*d.a/d.w} V78 Z" fill="#c6dff0" fill-rule="evenodd" stroke="#54758b"/>`+text(224,207,`外长 ${d.w}；外宽 ${d.h}`)+text(242,24,`内部洞 ${d.a} × ${d.b}`),caption+'；洞位置为示意'));
 if(d.kind==='scene-fullCircle')return wrap(svg('<circle cx="240" cy="107" r="77" class="scene-shape"/><path d="M163 107 H317" class="scene-dashed"/>'+text(240,207,`半径 ${d.radius}；π=3`),caption));
 if(d.kind==='scene-polygonAngles')return wrap(svg('<path d="M112 38 L337 29 L381 173 L77 166 Z" class="scene-shape"/>'+d.ratios.map((r,i)=>text([117,334,355,100][i],[63,57,151,145][i],r+'份')).join(''),caption+'；角度以比例标注为准'));
 if(d.kind==='scene-rays'){
  let art='';for(let i=0;i<d.marks;i++){const a=-Math.PI/2+2*Math.PI*i/d.marks;art+=`<path d="M240 109 L${240+81*Math.cos(a)} ${109+81*Math.sin(a)}" class="${i===0||i===d.steps?'scene-up':'scene-dashed'}"/>`}
  art+=text(240,216,`${d.marks} 等份；${d.other?'另一个方向':'较短方向'} ${d.other?d.marks-d.steps:d.steps} 段`);return wrap(svg(art));
 }
 if(d.kind==='scene-polygon'){
  const pts=Array.from({length:d.n},(_,i)=>[240+80*Math.sin(2*Math.PI*i/d.n),108-80*Math.cos(2*Math.PI*i/d.n)]);let art=`<path d="M${pts.map(p=>p.join(' ')).join(' L')} Z" class="scene-shape"/>`;for(let i=0;i<d.steps;i++)art+=`<circle cx="${pts[i][0]}" cy="${pts[i][1]}" r="5" class="scene-mark"/>`;art+=text(240,215,`经过 ${d.steps} 个顶点`);return wrap(svg(art));
 }
 if(d.kind==='scene-shadows')return wrap(svg(`<path d="M45 171 H439 M70 171 V116 L180 171 M250 171 V39 L420 171" class="scene-line"/>`+text(58,109,'高 '+d.smallHeight)+text(123,198,'影 '+d.smallShadow)+text(227,32,'高 '+d.bigHeight)+text(354,198,'影 '+d.bigShadow),caption+'；图为对应关系示意'));
 if(d.kind==='scene-border'){
  const side=d.n+2,cell=Math.min(9,165/side),ox=140,oy=25;let art='';
  for(let y=0;y<side;y++)for(let x=0;x<side;x++){const original=x>0&&x<side-1&&y>0&&y<side-1,added=d.partial?(x===0&&y<side-1||y===0&&x<side-1):!original;if(!original&&!added)continue;art+=`<rect x="${ox+x*cell}" y="${oy+y*cell}" width="${cell}" height="${cell}" fill="${original?'#c6ddec':'#efc675'}" stroke="white" stroke-width=".4"/>`}
  art+=text(240,198,`原来 ${d.n}×${d.n}，黄色为新增`)+text(240,223,d.partial?'左上角归上边，左边不再重复计':'四个外角各计一次');return wrap(svg(art));
 }
 throw Error('Unsupported mathematical scene '+d.kind);
}

'use strict';
// Family-specific intermediate quantities; no published answer/solution parsing.
const ReasoningGraphExtra=((h)=>{
 const {competitionFraction:F}=h,sum=a=>a.reduce((s,v)=>s+v,0),fact=n=>n<2?1:n*fact(n-1),choose=(n,k)=>{let v=1;for(let i=1;i<=k;i++)v=v*(n-i+1)/i;return v},gcd=(a,b)=>{while(b)[a,b]=[b,a%b];return a},num=s=>String(s).split('/').map(Number).reduce((a,b)=>a/b);
 const seq=(a,b,n)=>{const s=[a,b];while(s.length<n)s.push(s.at(-1)+s.at(-2));return s};
 function make(c,N,R){const m=c.math,id=c.problemState.familyId||c.family,p=m.params||m;let nodes,decisionIndex=0;const alternatives=[];
  const n=(id,q,a,u='',more={})=>N(id,q,a,u,more),target=(q,a,u='')=>n('target',q,a,u),D=(q,choices,correct)=>n('decision-'+(++decisionIndex),q,correct,'',{choices,hints:['题目限制了哪些条件？分别检查每一种说法。','用一个小例子检验你的选择，看看是否满足全部条件。']});
  switch(id){
  case 'fractionBackwards':nodes=[n('second-remainder','最后的数量占第一天余量几分之几？','2/3'),n('after-first','第一天结束还剩多少枚？',F(3*m.left,2),'枚'),target('再还原最初数量。',3*m.left,'枚')];break;
  case 'percentRoundTrip':{const up=m.start*(100+m.percent)/100,down=up*(100-m.percent)/100;nodes=[n('raised','第一次变化后，价格是多少？',up,'元'),D('第二次百分比作用于哪个价格？',['最初原价','第一次变化后的价格'],'第一次变化后的价格'),n('final-price','第二次变化后的价格是多少？',down,'元'),target('回到题目所求，与原价比较差多少？',m.start-down,'元')];break}
  case 'squareBorder':nodes=[n('outer-side','新增一圈后，外方阵边长增加到多少块？',m.n+2,'块'),n('all-cells','外方阵共多少块？',(m.n+2)**2,'块'),n('old-cells','原方阵共多少块？',m.n**2,'块'),target('移除原有部分，新增多少块？',4*m.n+4,'块')];break;
  case 'ratioEqualize':nodes=[n('difference-parts','两种原来相差几份？',m.b-m.a,'份'),n('one-part','用实际差额确定一份的数量。',m.unit,'个'),target('回到原来蓝球对应的份数，原有多少个蓝球？',m.b*m.unit,'个')];break;
  case 'packPrice':case 'mixedPacks':{let costs=[];if(id==='packPrice')for(let k=0;k<=Math.floor(m.count/3);k++)costs.push({label:k+'包，其余单买',cost:k*m.pack+(m.count-3*k)*m.single});else for(let a=0;4*a<=m.count;a++)for(let b=0;4*a+6*b<=m.count;b++)if(4*a+6*b===m.count)costs.push({label:a+'个4支装、'+b+'个6支装',cost:a*m.p+b*m.q});nodes=[D('这题对购买数量有什么要求？',['至少买够','必须恰好'],'必须恰好'),...costs.map((x,i)=>n('cost-'+i,`检查合法方案：${x.label}，费用多少？`,x.cost,'元')),target('完整比较合法方案，最少费用是多少？',Math.min(...costs.map(x=>x.cost)),'元')];break}
  case 'equalDistanceSpeed':{const d=2*m.speed;nodes=[D('往返的平均速度，需要用哪个总量作分母？',['两个速度相加','总时间'],'总时间'),n('out-time',`取单程 ${d} 千米作代表，去程需几小时？`,2,'小时'),n('back-time',`同样 ${d} 千米，回程需几小时？`,1,'小时'),target('两程总路程除以总时间，平均速度是多少？',F(4*m.speed,3),'千米/时')];break}
  case 'oppositeScale':nodes=[n('length-ratio','长度变化后的倍率是多少？',F(m.b,m.a)),D('面积保持不变时，宽的倍率应怎样改变？',['同向同倍率','使用倒数倍率'],'使用倒数倍率'),target('用宽的倍率求新的宽。',F(m.old*m.a,m.b))];break;
  case 'balanceCancel':nodes=[D('水平天平两边有相同盒子，可以怎样做？',['只移去一边的相同盒子','两边同时移去相同盒子'],'两边同时移去相同盒子'),n('extra-boxes','移除相同部分后，两边相差几个盒子？',1,'个'),target('留下的重量差对应单盒重量，是多少？',m.x,'克')];break;
  case 'tickets':{const total=m.adults*m.adult+(m.people-m.adults)*m.child;nodes=[n('baseline','若全部按儿童票计算，总价是多少？',m.people*m.child,'元'),n('difference','实际总价比这个基准多多少？',total-m.people*m.child,'元'),n('per-change','把一张儿童票换为成人票，增加多少钱？',m.adult-m.child,'元'),target('用差额确定成人票数量。',m.adults,'张')];break}
  case 'linearTable':nodes=[n('input-gap','两个已知输入相差多少？',2),n('output-gap','对应输出相差多少？',2*m.k),n('multiplier','固定乘数是多少？',m.k),n('addition','扣掉乘法部分，固定加数是多少？',m.b),target('将目标输入送入原规则。',m.k*m.target+m.b)];break;
  case 'divisibleDigits':{let candidates=[];for(let b=0;b<10;b++)for(let d of [0,5]){const x=1000*m.a+100*b+10*m.b+d;if(x%9===0)candidates.push(x)}nodes=[D('被5整除对个位有什么限制？',['只能0或5','只要数字和是5的倍数'],'只能0或5'),n('candidate-count','同时检查被9整除条件，合法四位数共有几个？',candidates.length),target('比较合法候选，最大的数是多少？',Math.max(...candidates))];break}
  case 'factorBalance':{const ds=[];for(let a=1;a*a<=m.product;a++)if(m.product%a===0)ds.push([a,m.product/a]);nodes=[n('pairs','交换顺序不算新对，合法正整数因数对有几对？',ds.length),...ds.map((x,i)=>n('sum-'+i,`检查因数对 ${x[0]} 与 ${x[1]}，和是多少？`,sum(x))),target('完整比较因数对，最小和是多少？',Math.min(...ds.map(sum)))];break}
  case 'bells':{const period=m.a*m.b/gcd(m.a,m.b);nodes=[n('joint-period','两铃的共同周期是多少分钟？',period,'分钟'),D('题目是否计入开始时刻？',['计入','不计入'],'不计入'),target('按题目结束边界，共同时响几次？',Math.floor(m.duration/period),'次')];break}
  case 'lastDigit':{const cycle=[],seen=new Set();let x=m.base%10;while(!seen.has(x)){cycle.push(x);seen.add(x);x=x*m.base%10}nodes=[n('cycle-size','从一次方开始，个位循环有几个位置？',cycle.length),n('position','将指数对齐到循环，从1计的位置是多少？',(m.exponent-1)%cycle.length+1),target('该位置对应的个位数字是多少？',cycle[(m.exponent-1)%cycle.length])];break}
  case 'outsideAngle':nodes=[n('other-sum','两底角合计多少度？',180-m.apex,'度'),n('base-angle','等腰使一个底角是多少度？',(180-m.apex)/2,'度'),target('沿外角与内角关系，所求外角是多少？',90+m.apex/2,'度')];break;
  case 'overlapSquares':case 'overlapProbability':{const area=(m.n-m.dx)*(m.n-m.dy),union=2*m.n*m.n-area;nodes=[n('overlap-width','交叠区域的宽是多少？',m.n-m.dx),n('overlap-height','交叠区域的高是多少？',m.n-m.dy),n('intersection','交叠面积是多少？',area),n('union','至少一张覆盖的不同面积是多少？',union),target(id==='overlapSquares'?'回到题目所求的覆盖面积。':'目标区域占等可能样本区域几分之几？',id==='overlapSquares'?union:F(area,union))];break}
  case 'circleRoute':nodes=[n('other-arc','另一方向的补弧有几个小段？',m.sectors-m.steps),target('比较两条弧，较短路程是多少？',Math.min(m.steps,m.sectors-m.steps)*m.unit,'米')];break;
  case 'similarAreaPerimeter':nodes=[n('area-ratio','题干给的对应面积倍率是多少？',F(m.b*m.b,m.a*m.a)),n('length-ratio','把面积比还原成对应长度比的倍率。',F(m.b,m.a)),target('对应周长也用这个倍率，所求周长是多少？',m.b*m.unit)];break;
  case 'ladderShift':nodes=[n('initial-height','原来的直角三角形高度是多少？',4*m.k,'米'),n('new-height','底端变化后，高度是多少？',3*m.k,'米'),target('梯顶高度减少多少？',m.k,'米')];break;
  case 'paintedCube':case 'cubeProbability':{const one=6*(m.n-2)**2,two=12*(m.n-2),all=m.n**3;nodes=[D('恰好两面涂色的小块位于哪里？',['棱上但不是角','整张面的所有小块'],'棱上但不是角'),n('one-edge','每条棱除去两角，还剩多少块？',m.n-2),n('all-edges','有多少条棱？',12),n('two-painted','恰好两面涂色共有多少块？',two),target(id==='paintedCube'?'回到所求小块数量。':'恰好两面涂色占全体小块的概率是多少？',id==='paintedCube'?two:F(two,all))];break}
  case 'adjacentLine':nodes=[D('必须相邻时，怎样先处理两位朋友？',['先作为一个对象','把两人视为固定顺序的一个对象'],'先作为一个对象'),n('outer-arrange','捆绑后共有几个对象排列？',m.n-1),n('order-count','两人内部有几种顺序？',2),target('外部排列与内部顺序组合，共有多少种？',2*fact(m.n-1),'种')];break;
  case 'restrictedTeam':nodes=[n('all-teams','先不加限制，选3人共有多少种？',choose(m.n,3)),n('invalid','同时选中两位指定朋友时，第三人有几种选法？',m.n-2),target('剔除违规小队，合法选法有多少？',choose(m.n,3)-(m.n-2))];break;
  case 'digitComplement':nodes=[n('all-strings','先不要求特殊数字，所有密码有多少个？',10**m.length),n('avoid','所有位置都避开目标数字，有多少个密码？',9**m.length),target('至少出现一次的数量是多少？',10**m.length-9**m.length)];break;
  case 'chartScale':nodes=[n('unit','已知人数与柱高对应，每格多少人？',m.unit,'人'),n('B-count','乙柱对应的实际人数是多少？',m.b*m.unit,'人'),target('所求两柱人数合计是多少？',(m.b+m.c)*m.unit,'人')];break;
  case 'missingAverage':nodes=[n('whole-total','原来所有数的总和是多少？',m.count*m.mean),n('remaining-total','删去后余下数的总和是多少？',(m.count-1)*m.other),target('比较两种总和，被删掉的数是多少？',m.count*m.mean-(m.count-1)*m.other)];break;
  case 'diceSum':{let good=0;for(let a=1;a<=m.faces;a++)for(let b=1;b<=m.faces;b++)if(a+b===m.target)good++;nodes=[D('等可能的结果是什么？',['有序点数对','点数和'],'有序点数对'),n('all-pairs','所有有序点数对有多少个？',m.faces**2),n('good-pairs','点数和符合目标的有序对有多少个？',good),target('符合条件的概率是多少？',F(good,m.faces**2))];break}
  case 'foldHoles':nodes=[n('inside-copies','每个内部孔展开后对应几个位置？',4),n('edge-copies','每个单折痕上的孔对应几个位置？',2),n('center-copies','双折痕交点上的孔对应几个位置？',1),target('按位置分类合计总孔数。',4*m.interior+2*m.edge+m.center)];break;
  case 'checkerDomino':nodes=[n('remaining','去掉两格后剩几格？',m.w*m.h-2),D('一块骨牌会覆盖怎样的颜色？',['一个黑格和一个白格','任意两个同色格'],'一个黑格和一个白格'),n('limiting-color','去掉两个同色角后，较少的颜色还有几格？',m.w*m.h/2-2),target('用颜色上界并构造摆法，最多放几块？',m.w*m.h/2-2)];break;
  case 'natural-weighted':case 'natural-fractionWeighted':{const red=m.red*m.redScore,blue=m.blue*m.blueScore;nodes=[n('people-parts','代表组共有多少人数份？',m.red+m.blue,'份'),n('red-total','红队代表部分共得多少分？',F(red,m.den),'分'),n('blue-total','蓝队代表部分共得多少分？',F(blue,m.den),'分'),target('合计总分再按人数均分，平均是多少？',F(red+blue,m.den*(m.red+m.blue)),'分')];break}
  case 'natural-tiles':nodes=[n('largest-side','最大正方形规格需同时整除两边，边长是多少？',gcd(m.w,m.h)),n('along-width','一边有几块？',m.w/gcd(m.w,m.h)),n('along-height','另一边有几块？',m.h/gcd(m.w,m.h)),target('合计铺多少块？',m.w*m.h/gcd(m.w,m.h)**2)];break;
  case 'natural-pairChance':nodes=[n('all-pairs','所有具体球对共有多少？',choose(m.red+m.blue,2)),n('red-pairs','两球都是红色有多少对？',choose(m.red,2)),target('两球都是红色的概率是多少？',F(choose(m.red,2),choose(m.red+m.blue,2)))];break;
  case 'natural-unionChance':case 'natural-complementChance':{const union=m.red+m.blue-m.both;nodes=[n('attendance','两组人数直接相加，得到的参加次数是多少？',m.red+m.blue,'人次'),n('union','移除重复部分，至少参加一组的不同人数是多少？',union,'人'),...(id==='natural-complementChance'?[n('outside','都没参加的人数是多少？',m.total-union,'人')]:[]),target('目标人数占全体几分之几？',F(id==='natural-unionChance'?union:m.total-union,m.total))];break}
  case 'natural-offers':nodes=[n('shop-A','甲店整单费用是多少？',F(3*m.price*m.count,4)+'','元',{acceptedExpressions:[String(3*m.price*m.count/4+m.fee)],answer:String(3*m.price*m.count/4+m.fee)}),n('shop-B','乙店整单费用是多少？',(m.price-1)*m.count,'元'),target('比较两店整单费用之差。',Math.abs(3*m.price*m.count/4+m.fee-(m.price-1)*m.count),'元')];break;
  case 'natural-angleRatio':nodes=[n('parts','三角形内角比例共几份？',sum(m.ratios)),n('one-angle-part','一份多少度？',F(180,sum(m.ratios)),'度'),target('最大的内角是多少？',F(180*Math.max(...m.ratios),sum(m.ratios)),'度')];break;
  case 'natural-digitCount':case 'natural-distinctDigitCount':{const countA=m.digits.map(a=>m.digits.filter(b=>(!m.distinct||a!==b)&&(a+b)%3===0).length);nodes=[D('十位和个位是否有顺序？',['有顺序，交换可能产生新数','交换一律合为同一数'],'有顺序，交换可能产生新数'),...countA.map((v,i)=>n('first-'+i,`十位为 ${m.digits[i]} 时，符合全部限制的个位有几个？`,v)),target('按十位分组不重不漏，总共有几个？',sum(countA))];break}
  case 'natural-coordinateDistance':nodes=[n('x-gap','横坐标相差多少？',Math.abs(m.dx)),n('y-gap','纵坐标相差多少？',Math.abs(m.dy)),D('题目允许的距离是哪个？',['直线距离','只沿水平竖直网格'],'直线距离'),target('用直角边求直线距离。',Math.hypot(m.dx,m.dy))];break;
  case 'routeProbability':{const all=choose(m.w+m.h,m.w),through=choose(m.x+m.y,m.x)*choose(m.w+m.h-m.x-m.y,m.w-m.x);nodes=[D('题目怎样随机选路线？',['完整路线等可能','每个岔口单独等可能'],'完整路线等可能'),n('all-routes','所有最短路线有多少条？',all),n('allowed-routes','避开P的最短路线有多少条？',all-through),target('合法路线占全体路线的概率是多少？',F(all-through,all))];break}
  case 'ratioUnion':{const total=(m.a+m.b)*m.unit-m.both;nodes=[n('attendance','把不同人数还原成两组参加次数，合计多少？',total+m.both),n('parts','组人数比例共有几份？',m.a+m.b),n('part-value','每份实际对应多少人？',m.unit),n('B-total','球类组全部有多少人？',m.b*m.unit,'人'),target('从球类组移除同时参加棋类组的人，只参加球类组的有多少人？',m.b*m.unit-m.both,'人')];break}
  case 'chartAverage':{const count=sum(m.counts),total=m.counts[0]*2+m.counts[1]*4+m.counts[2]*6;nodes=[n('count','图中所有人数合计是多少？',count,'人'),n('score-total','每档分数乘人数后，总分是多少？',total,'分'),target('按全体人数平均，结果是多少？',F(total,count),'分')];break}
  case 'parityPermutations':{const even=Math.floor(m.n/2),odd=m.n-even;nodes=[n('odd-count','奇数有几个？',odd),n('gaps','安排奇数后，可放偶数的空隙有几个？',odd+1),n('gap-selection','从这些空隙选位置，有几种？',choose(odd+1,even)),target('再安排不同数字的顺序，共有多少种？',choose(odd+1,even)*fact(odd)*fact(even))];break}
  case 'recurrenceRemainders':{nodes=[D('要验证余数递推的周期，应该追踪什么状态？',['单个余数','相邻两个余数'],'相邻两个余数'),n('pair-period','从初始余数对返回同一对，周期有几项？',8),n('whole-cycles','目标项数中有几个完整周期？',Math.floor(m.n/8)),n('tail-size','周期后还有几项？',m.n%8),target('按完整周期与尾段累加余数，合计是多少？',(()=>{let x=1,y=1,s=2;for(let i=2;i<m.n;i++){[x,y]=[y,(x+y)%3];s+=y}return s})())];break}
  case 'digitInsert':{const values=[100*m.d+10*m.a+m.b,100*m.a+10*m.d+m.b,100*m.a+10*m.b+m.d];nodes=[n('positions','保留原数字顺序，可以插入几个位置？',3),target('按位值比较合法数，最大是多少？',Math.max(...values))];break}
  case 'numberAppend':nodes=[n('coefficient','末尾添一位后，原数被放大几倍？',10),n('net-factor','与原数比较差额，原数还剩几倍？',9),target('从已知差额移除末位数字，再反求原数。',m.n)];break;
  case 'pairedSum':nodes=[n('pair-total','首尾一对的和是多少？',m.n+1),target('两份数列配对后再还原一份，总和是多少？',m.n*(m.n+1)/2)];break;
  case 'telescopingDifferences':nodes=[D('相邻差合计时，中间项怎样出现？',['各出现一次相加','一正一负可以抵消'],'一正一负可以抵消'),n('first','保留下来的起点是多少？',m.start),n('last','保留下来的终点是多少？',m.start+m.n*m.step),target('由两个端点确定差的总和。',m.n*m.step)];break;
  case 'neighborProducts':nodes=[n('square','中间数的平方是多少？',m.n**2),n('neighbors','两个相邻数的乘积是多少？',(m.n-1)*(m.n+1)),target('比较这两种乘积，差是多少？',1)];break;
  case 'fractionDifferentWholes':nodes=[n('first-part','甲盒取出的量是多少？',m.a/4),n('second-part','乙盒取出的量是多少？',m.b/3),target('各自整体下的取出量合计是多少？',m.a/4+m.b/3)];break;
  case 'fractionSharedRemainder':{const remaining=5*m.unit+5*m.add/8,afterSecond=remaining*8/5,afterFirst=afterSecond-m.add;nodes=[n('after-second','由最后余量还原第二次操作前的量。',afterSecond),n('before-return','把放回的数量移除，第一次操作后剩多少？',afterFirst),target('再按第一次所用整体还原最初数量。',afterFirst*3/2)];break}
  case 'discountOrder':nodes=[D('题目指定的操作顺序是什么？',['先折扣，再用券','先用券，再折扣'],'先折扣，再用券'),n('discounted','第一步后价格是多少？',m.price*(100-m.p)/100,'元'),target('执行第二步后，实际价格是多少？',m.price*(100-m.p)/100-m.q,'元')];break;
  case 'percentRestore':nodes=[n('new-base','取原价100，变化后价格是多少？',100+m.p),n('difference','需要减少多少价格份？',m.p),target('这个差占当前基准的百分之几？填写精确百分数前的数。',F(100*m.p,100+m.p))];break;
  case 'squareBounds':nodes=[n('lower-square','找到不超过被开方数的最近平方，是多少？',m.k**2),n('upper-square','紧接着的下一个整数平方是多少？',(m.k+1)**2),target('回到目标，左侧最近整数是多少？',m.k)];break;
  case 'ratioTotal':nodes=[n('parts','总量对应几份？',m.a+m.b),n('one-part','一份的实际数量是多少？',m.u),target('所求颜色对应的实际数量是多少？',m.a*m.u)];break;
  case 'linkedRatios':{const green=m.b*m.d*m.u,blue=m.b*m.c*m.u,red=m.a*m.c*m.u;nodes=[n('green','题干给定的绿色实际数量是多少？',green),n('blue','从蓝绿比例还原同一个蓝色数量。',blue),n('red','再从红蓝比例还原红色数量。',red),target('三色总量是多少？',red+blue+green)];break}
  case 'unitConversion':nodes=[n('millilitres','把总容量写成毫升，是多少？',1000*m.liters,'毫升'),target('用相同单位求完整杯数。',1000*m.liters/m.cup,'杯')];break;
  case 'jointWork':nodes=[n('rate-total','两人同时做，每分钟共完成多少？',m.a+m.b),n('work-total','题目要求的工作总量是多少？',(m.a+m.b)*m.t),target('工作总量除以共同速度，需要几分钟？',m.t,'分钟')];break;
  case 'mapScale':nodes=[n('same-length-factor','两地图表示同一实际长度，图上长度倍率是多少？',m.k),target('目标地图上的长度是多少？',m.a*m.k,'厘米')];break;
  case 'scaleAreaReverse':nodes=[n('net-length','两次长度变化合在一起，净倍率是多少？',F(m.k,m.s)),n('net-area','对应的面积净倍率是多少？',F(m.k**2,m.s**2)),target('用最后面积与净倍率反求原面积。',m.old)];break;
  case 'ageDifference':nodes=[n('gap','题干给出或能得到的年龄差是多少？',m.parent-m.child,'岁'),n('past-child','过去孩子的年龄是多少？',(m.parent-m.child)/2,'岁'),target('沿时间线得到现在孩子年龄。',m.child,'岁')];break;
  case 'repeatedMachine':{const after=m.x*m.a+m.b;nodes=[n('undo-final-add','最终输出先移除最后的固定加数，剩多少？',after*m.a),n('undo-second','从最终输出逆推第二次操作前的数。',after),target('再逆推第一次操作前，原输入是多少？',m.x)];break}
  case 'twoCoins':nodes=[n('baseline','如果所有硬币都是1元，合计多少元？',m.n,'元'),n('excess','实际钱数比基准多多少元？',m.twos,'元'),target('每换一枚2元币多1元，2元币有多少枚？',m.twos,'枚')];break;
  case 'stampConstraint':{const plans=[];for(let a=1;3*a<m.total;a++)if((m.total-3*a)%5===0&&(m.total-3*a)/5>=1)plans.push([a,(m.total-3*a)/5]);nodes=[D('每种邮票的数量有什么边界？',['每种至少一张','每种允许零张'],'每种至少一张'),n('possible-three','3元邮票最多有几张仍能留够一张5元？',Math.floor((m.total-5)/3)),target('固定3元张数，检查余款能否买整数张5元邮票，合法方案有几种？',plans.length)];break}
  case 'recurrenceForward':case 'recurrenceTotal':{const a=seq(m.a,m.b,m.n);if(id==='recurrenceForward'){nodes=[D('每个新项由哪两个数决定？',['紧邻的前两项','最初的固定两项'],'紧邻的前两项'),target('追踪项号，题目问的第 '+m.n+' 项是多少？',a.at(-1))];break}nodes=a.slice(2).map((v,i)=>n('term-'+(i+3),`按照相邻两项规则求第 ${i+3} 项。`,v));nodes.push(target(id==='recurrenceForward'?'回到题目问的项，是多少？':'将实际项按目标区间累加，是多少？',id==='recurrenceForward'?a.at(-1):sum(a)));break}
  case 'machineMeeting':nodes=[n('rate-gap','同一输入每增加1，两机输出差增加多少？',m.c-m.a),n('constant-gap','两机固定加数相差多少？',m.d-m.b),target('让输出相等，输入应是多少？',m.x)];break;
  case 'machineOrder':{const ab=(m.x*m.a+m.b)*m.c+m.d,ba=(m.x*m.c+m.d)*m.a+m.b;nodes=[n('AB','先甲后乙，完整输出是多少？',ab),n('BA','先乙后甲，完整输出是多少？',ba),target('两种顺序的输出差是多少？',Math.abs(ab-ba))];break}
  case 'digitDivisor':{const counts=[];for(let u=1;u<=9;u++)if((10*m.tens+u)%u===0)counts.push(u);nodes=[D('个位为0可以作除数吗？',['可以','不可以'],'不可以'),...Array.from({length:9},(_,i)=>n('divisible-'+(i+1),`个位为 ${i+1} 的两位数符合吗？填1表示符合，0表示不符合。`,Number((10*m.tens+i+1)%(i+1)===0))),target('合计有几个合法数？',counts.length)];break}
  case 'divisibleEleven':{const valid=[];for(let b=0;b<10;b++)for(let d of [0,5]){const x=1000*m.a+100*b+10*m.c+d;if(x%11===0)valid.push(x)}nodes=[D('被5整除的个位只能是什么？',['0或5','2或5'],'0或5'),n('candidate-count','同时核对11整除条件，合法数有几个？',valid.length),target('合法列表中最大四位数是多少？',Math.max(...valid))];break}
  case 'threeDivisors':{const squares=[];for(let p=2;p*p<=m.limit;p++){let prime=true;for(let d=2;d*d<=p;d++)if(p%d===0)prime=false;if(prime)squares.push(p*p)}nodes=[D('恰好三个正因数，应该是哪种结构？',['一个质数的平方','任意完全平方数'],'一个质数的平方'),n('prime-limit','质数底数可以检查到哪个整数？',Math.floor(Math.sqrt(m.limit))),target('在目标区间逐个检查，符合的数有几个？',squares.length)];break}
  case 'divisorPowers':nodes=[n('two-exponents','2的指数有几种合法取值？',m.a+1),n('three-exponents','3的指数有几种合法取值？',m.b+1),target('每个因数由两个指数确定，合计有几个？',(m.a+1)*(m.b+1))];break;
  case 'equalBags':nodes=[D('要让两色都用完且每袋规格相同，袋数必须满足什么？',['只要是其中一种数量的因数','同时整除两种数量'],'同时整除两种数量'),n('common-divisor','两种数量的最大公因数是多少？',gcd(m.a,m.b)),target('回到目标，最多能分几袋？',gcd(m.a,m.b),'袋')];break;
  case 'offsetBells':{let t=1;while(t%m.a||(t<m.offset||(t-m.offset)%m.b))t++;nodes=[D('两铃开始时刻不同，直接取共同周期就是第一次吗？',['是','不是，需要保留偏移'],'不是，需要保留偏移'),n('offset','两铃的起点偏移是多少分钟？',m.offset,'分钟'),target('检查两条时间线，第一次同时响在第几分钟？',t,'分钟')];break}
  case 'cyclicPosition':nodes=[n('remainder','走完完整圈后，还剩几步？',m.steps%m.size),target('从实际起点按指定方向数余步，停在哪个位置？',(m.start-1+m.steps)%m.size+1)];break;
  case 'repeatedOnes':{let v=0;nodes=[];for(let i=1;i<=Math.min(m.n,6);i++){v=(10*v+1)%7;nodes.push(n('remainder-'+i,`末尾再添1后，第 ${i} 个全1数除以7的余数是多少？`,v))}nodes.push(target('用余数转换或周期继续到目标位数，最终余数是多少？',Number(BigInt('1'.repeat(m.n))%7n)));break}
  case 'rectangleDiagonalArea':nodes=[n('rectangle-area','整个长方形的面积是多少？',m.w*m.h),target('对角线分成相等两部分，所求三角形面积是多少？',m.w*m.h/2)];break;
  case 'angleMarks':nodes=[n('one-angle','完整一圈被等分后，每段多少度？',F(360,m.marks),'度'),target('目标跨过这些等角段，角度是多少？',F(360*m.step,m.marks),'度')];break;
  case 'polygonTurn':nodes=[D('这里追踪的是绕一周的转角，还是各个内角？',['绕一周的转角','各个内角'],'绕一周的转角'),n('turn-total','绕多边形走一整圈，外转角合计多少度？',360,'度'),target('等分到每个顶点，单个外转角多少度？',F(360,m.n),'度')];break;
  case 'lShapeArea':nodes=[n('outer-area','补成大长方形，面积是多少？',m.w*m.h),n('missing-area','需要移除的缺口面积是多少？',m.a*m.b),target('阴影L形面积是多少？',m.w*m.h-m.a*m.b)];break;
  case 'crossArea':nodes=[n('vertical','竖条面积是多少？',m.a*m.h),n('horizontal','横条面积是多少？',m.b*m.w),n('intersection','两条重叠面积是多少？',m.a*m.b),target('两条合并后不同覆盖面积是多少？',m.a*m.h+m.b*m.w-m.a*m.b)];break;
  case 'semicircleBoundary':nodes=[n('half-arc','半圆弧长是多少？',m.circumference/2),n('diameter','属于外周的直线直径多长？',2*m.radius),target('弧与直边合计，周长是多少？',m.circumference/2+2*m.radius)];break;
  case 'circleRingRatio':nodes=[n('inner-squared','小圆面积中的半径平方是多少？',m.r1**2),n('outer-squared','大圆面积中的半径平方是多少？',m.r2**2),target('扣掉小圆后，圆环占大圆面积几分之几？',F(m.r2**2-m.r1**2,m.r2**2))];break;
  case 'shadowSimilarity':nodes=[n('small-ratio','已知杆的杆高与影长之比是多少？','1/2'),target('同一时刻同一倍率，未知杆高是多少？',m.b*m.unit)];break;
  case 'parallelTriangle':nodes=[n('small-area-ratio','对应长度比平方后，小三角形占整体面积几分之几？',F(m.k**2,m.n**2)),n('small-area','小三角形面积是多少？',F(m.area*m.k**2,m.n**2)),target('整体扣掉小三角形，剩下面积是多少？',F(m.area*(m.n**2-m.k**2),m.n**2))];break;
  case 'coordinateHorizontal':nodes=[D('两点纵坐标相同，距离由什么决定？',['横坐标的差的绝对值','横坐标相加'],'横坐标的差的绝对值'),target('两点距离是多少？',Math.abs(m.b-m.a))];break;
  case 'hypotenuseMidpoint':nodes=[n('hypotenuse','直角三角形斜边长是多少？',5*m.k),D('M在哪条边的中点？',['斜边','较长直角边'],'斜边'),target('利用斜边中点关系，目标长度是多少？',F(5*m.k,2))];break;
  case 'cubeSteps':nodes=[n('first-last','第一列与最后一列合计多少块？',m.n+1),target('按列高1到目标列数合计，小块共多少？',m.n*(m.n+1)/2)];break;
  case 'setOutside':nodes=[n('attendance','先相加两组人数，共记录多少次参加？',m.a+m.b,'人次'),n('union','至少参加一组的不同人数是多少？',m.a+m.b-m.both,'人'),target('从全体移除这些人，都没参加的人数是多少？',m.total-m.a-m.b+m.both,'人')];break;
  case 'menuBranches':nodes=[D('米饭配菜与面是怎样的分支？',['两种都必须选','互斥二选一'],'互斥二选一'),n('rice-meals','米饭与菜能搭配多少种午餐？',m.rice*m.dish),n('noodle-meals','面这一分支有多少种？',m.noodle),target('合并互斥分支，共多少种午餐？',m.rice*m.dish+m.noodle)];break;
  case 'binaryNoNeighbors':{const ways=[1,2];for(let i=2;i<=m.n;i++)ways[i]=ways[i-1]+ways[i-2];nodes=[D('最后一盏亮时，倒数第二盏必须怎样？',['亮','灭'],'灭'),n('shorter','最后一盏灭时，前面还有多少种合法安排？',ways[m.n-1]),n('two-shorter','最后一盏亮且前一盏灭时，前面还有多少种？',ways[m.n-2]),target('两个互斥分支合计，合法安排多少种？',ways[m.n])];break}
  case 'unorderedPairs':nodes=[n('ordered','先临时区分第一人与第二人，安排有多少种？',m.n*(m.n-1)),n('multiplicity','交换一对的顺序重复计了几次？',2),target('不分角色的不同搭档有多少对？',m.n*(m.n-1)/2)];break;
  case 'circularSeating':nodes=[D('圆桌旋转后相同，应如何确定参照？',['固定一人作参照','把旋转位置全算不同'],'固定一人作参照'),n('neighbor','固定一位朋友后，另一位可坐哪几种相邻位置？',2),n('remaining','剩余其他朋友有几种排列？',fact(m.n-2)),target('合并合法位置与其余安排，共多少种？',2*fact(m.n-2))];break;
  case 'differentDigits':nodes=[n('first','第一位有几种选择？',m.digits),n('second','不能重复，第二位剩几种选择？',m.digits-1),target('顺序不同算不同，合法组合多少种？',m.digits*(m.digits-1))];break;
  case 'allThreeColors':nodes=[n('all-colorings','先不限制三色出现，所有安排有多少种？',3**m.n),n('avoid-one','缺少一种指定颜色有多少种安排？',2**m.n),n('pure-colorings','只用一种颜色的安排有多少种？',3),target('用容斥修正重复排除，三色全出现有多少种？',3**m.n-3*2**m.n+3)];break;
  case 'truncatedBars':nodes=[n('A','把轴起点与刻度算入，甲实际多少人？',m.base+m.step*m.a,'人'),n('B','乙实际多少人？',m.base+m.step*m.b,'人'),target('回到题目所求总人数。',2*m.base+m.step*(m.a+m.b),'人')];break;
  case 'cumulativeChart':nodes=[D('累计柱表示什么？',['包含当前档和此前所有档','只表示当前档'],'包含当前档和此前所有档'),n('up-to-one','截至1分共有多少人？',m.a,'人'),n('up-to-three','截至3分共有多少人？',m.a+m.b+m.c,'人'),target('差额对应所求两档，共多少人？',m.b+m.c,'人')];break;
  case 'medianSort':nodes=[n('middle-position','5个数排序后，中间在第几个位置？',3),target('按大小排序，该位置的数是多少？',m.start+2*m.gap)];break;
  case 'spinnerLabels':nodes=[n('sample-size','所有等面积扇区共有几个？',m.a+m.b+m.c),n('target-size','符合目标标签的扇区共有几个？',m.a+m.b),target('符合条件的概率是多少？',F(m.a+m.b,m.a+m.b+m.c))];break;
  case 'conditionalBalls':{const all=choose(m.red+m.blue,2),rr=choose(m.red,2),bb=choose(m.blue,2);nodes=[n('all-pairs','不放回取两个球，具体球对共有多少？',all),n('exclude-blue','不满足“至少一个红球”的全蓝球对有多少？',bb),n('conditional-space','条件筛选后样本空间剩多少球对？',all-bb),n('both-red','两球全红的具体球对有多少？',rr),target('在新的样本空间中，所求概率是多少？',F(rr,all-bb))];break}
  case 'quarterTurn':nodes=[n('full-cycle','转多少次90度回到原方向？',4),n('remaining','扣去完整圈后还需转几次？',m.turns%4),target('从原方向按指定方向转，最终方向编号是多少？',(m.start+m.turns)%4)];break;
  case 'transformOrder':nodes=[D('题干的先后顺序是什么？',['先旋转再镜像','先镜像再旋转'],'先旋转再镜像'),n('after-rotation','先完成旋转，方向编号是多少？',(m.start+m.rot)%4),target('再完成镜像，最终编号是多少？',(4-(m.start+m.rot)%4)%4)];break;
  case 'lightSwitchParity':nodes=[n('presses','一共按了几次？',m.groups*m.per+m.extra),n('parity','按压次数是偶数还是奇数？填0偶数、1奇数。',(m.groups*m.per+m.extra)%2),target('按初始状态追踪，最后状态编号是多少？',(m.on+(m.groups*m.per+m.extra)%2)%2)];break;
  case 'ballReplacement':nodes=[D('每次替换后，白球数量的奇偶性怎样变化？',['保持','每次翻转'],'保持'),n('parity','最初白球数量的奇偶性，填0偶数、1奇数。',m.white%2),target('最后只剩一球，白球数是多少？',m.white%2)];break;
  case 'transferBetweenBoxes':nodes=[n('gap-parts','原来数量差对应几份？',m.b-m.a),n('gap-count','内部转移后相等，原差额多少块？',2*m.moved),n('one-part','一份对应多少块？',F(2*m.moved,m.b-m.a)),target('原来甲盒数量是多少？',F(2*m.a*m.moved,m.b-m.a))];break;
  case 'rectanglePointAreas':nodes=[n('opposite-total','左右相对三角形面积合计是多少？',m.left+m.right),D('同一长方形中，上下相对三角形的总面积怎样？',['等于左右合计','等于其中任意单个面积'],'等于左右合计'),target('扣去已知顶部，底部面积是多少？',m.left+m.right-m.top)];break;
  case 'worstCaseColors':{const maximum=sum(m.caps.map(v=>Math.min(v,m.k-1)));nodes=[...m.caps.map((v,i)=>n('avoid-'+i,`第 ${i+1} 种颜色最多取几个，仍没达到目标同色数量？`,Math.min(v,m.k-1))),n('maximum-failure','仍可能失败的最多抽取总数是多少？',maximum),target('再多取一个才能保证，最少取多少？',maximum+1)];break}
  case 'stagedClimb':nodes=[n('net-day','未到终点的一天一夜，净上升多少？',m.up-m.down),D('白天已经达到终点，还需要夜晚回退吗？',['需要','不需要'],'不需要'),n('before-final','最后白天之前，至少需要净上升到多高？',Math.max(0,m.height-m.up)),target('计算完整天夜后，再加最后白天，是第几天？',Math.ceil((m.height-m.up)/(m.up-m.down))+1)];break;
  case 'consecutiveRepresentations':{
   const maximum=Math.floor((Math.sqrt(8*m.total+1)-1)/2),checks=[];let found=0;
   for(let length=2;length<=maximum;length++){
    const start=(m.total-length*(length-1)/2)/length,valid=Number.isInteger(start)&&start>=1;if(valid)found++;
    checks.push(n('length-'+length,`检查 ${length} 项：若能写成连续正整数之和，填首项；否则填“不成立”。`,valid?start:'不成立','',{
     dependsOn:['maximum-length'],candidateLength:length,
     acceptedExpressions:valid?[String(start)]:['不成立','无解','不能'],recognizedExpressions:['不成立','无解','不能'],
     hints:['把首项暂记为一个未知数，连接项数、相邻差和总量。','还原首项后，分别检查它是否为整数、是否至少为1。'],
     errorCheck:'用你的首项列出这些连续数，核对总和；首项还须是正整数。'}));
   }
   nodes=[D('同一个总量的连续表示，哪两个量需要一起受约束？',['首项与项数','只看首项'],'首项与项数'),
    n('maximum-length','至少从1开始，连续项数最多检查到多少？',maximum),...checks,
    n('target','检查全部候选项数后，不同的正整数表示共有几种？',found,'',{dependsOn:checks.map(x=>x.id)})];break}
  case 'remainderProbability':{const cycles=Math.floor(m.count/m.mod),tail=m.count%m.mod,extra=m.wanted>0&&m.wanted<=tail?1:0,good=cycles+extra;nodes=[n('whole-cycles','从1开始的卡片中，有几个完整余数循环？',cycles),n('tail','完整循环后剩几张卡？',tail),n('tail-good','剩余卡片中符合目标余数的有几张？',extra),n('good','全体符合条件的卡片有几张？',good),target('每张等可能，符合目标的概率是多少？',F(good,m.count))];break}
  case 'rotatingColors':{const classes=new Set();for(let mask=0;mask<2**m.n;mask++){let bits=Array.from({length:m.n},(_,i)=>mask>>i&1);if(sum(bits)!==m.red)continue;classes.add(bits.map((_,i)=>[...bits.slice(i),...bits.slice(0,i)].join('')).sort()[0])}nodes=[D('旋转后相同的涂法如何计数？',['合为同一种','每个旋转位置都算新种'],'合为同一种'),n('fixed-count','暂时给每个位置编号，固定位置涂法有几种？',choose(m.n,m.red)),target('按实际旋转等价归类，不同涂法有几种？',classes.size)];break}
  case 'stepwiseRoute':{
   const paths=[];function walk(x,y,p,hit){hit=hit||x===m.x&&y===m.y;if(x===m.w&&y===m.h){paths.push({p,hit});return}const exits=Number(x<m.w)+Number(y<m.h);if(x<m.w)walk(x+1,y,p/exits,hit);if(y<m.h)walk(x,y+1,p/exits,hit)}walk(0,0,1,false);
   const count=paths.filter(x=>x.hit).length,prob=sum(paths.filter(x=>x.hit).map(x=>x.p));
   nodes=[D('题目随机的是哪个对象？',['每个岔口的合法方向','完整路线'],'每个岔口的合法方向'),n('route-count','经过指定点的完整路线有几条？',count),D('边界只剩一个方向时，概率应怎样分配？',['继续乘1/2','沿唯一方向的概率为1'],'沿唯一方向的概率为1'),target('逐条相乘再合并经过指定点的事件，概率是多少？',prob)];
   const values=Array.from({length:m.y+1},()=>Array(m.x+1).fill(0)),arrivalId=(x,y)=>'arrival-'+x+'-'+y;
   const dp=[n('sampling-rule','本题在哪一步作等概率选择？','每个岔口的合法方向','',{dependsOn:[],choices:['每个岔口的合法方向','完整路线']}),
    n('boundary-rule','只有一个合法出口的点，沿它前进的概率是多少？',1,'',{dependsOn:[]})];
   for(let y=0;y<=m.y;y++)for(let x=0;x<=m.x;x++){
    const deps=['sampling-rule','boundary-rule'];let value=x+y===0?1:0;
    if(x){value+=values[y][x-1]/(Number(x-1<m.w)+Number(y<m.h));deps.push(arrivalId(x-1,y))}
    if(y){value+=values[y-1][x]/(Number(x<m.w)+Number(y-1<m.h));deps.push(arrivalId(x,y-1))}
    values[y][x]=value;
    dp.push(n(arrivalId(x,y),`到达点 (${x},${y}) 的概率是多少？`,value,'',{dependsOn:deps,
     hints:['哪些相邻点能走到这里？从各点传来的概率要按它的合法出口分配。','到达这里的不同最后一步互斥；合并左边和下边传来的概率。'],
     errorCheck:'逐个检查入口：概率由前一个点的出口数决定；不要把路线条数当等可能概率。'}));
   }
   dp.push(n('target','读出到达P的概率，回到题目所求。',values[m.y][m.x],'',{dependsOn:[arrivalId(m.x,m.y)]}));
   alternatives.push(R('probability-flow','把到达概率沿合法方向传递',dp));break}
  case 'rule-join-open':case 'rule-join-closed':case 'rule-join-piece':{const joins=id==='rule-join-closed'?p.n:p.n-1;nodes=[n('joins','根据是否首尾相接，共有几个连接处？',joins),n('overlap-total','这些连接处合计扣去多少长度？',joins*p.lap,'厘米'),target(id==='rule-join-piece'?'补回总重叠后，反求每段长度。':'从各段总长扣去重叠，连接后总长是多少？',id==='rule-join-piece'?(p.total+joins*p.lap)/p.n:p.n*p.piece-joins*p.lap,'厘米')];break}
  case 'rule-posts-both':case 'rule-posts-neither':nodes=[n('intervals','总距离能分成多少个完整间隔？',p.distance/p.gap),D('题目的两个端点如何计入？',['两端都计入','两端都不计入'],id==='rule-posts-both'?'两端都计入':'两端都不计入'),target('把间隔与标记对应，所求标记有几个？',p.distance/p.gap+(id==='rule-posts-both'?1:-1))];break;
  case 'rule-weighted-mean':nodes=[n('count-parts','总人数对应几份？',p.a+p.b),n('A-score','甲代表组的总分是多少？',p.a*p.low,'分'),n('B-score','乙代表组的总分是多少？',p.b*p.high,'分'),target('按人数平均，结果是多少？',F(p.a*p.low+p.b*p.high,p.a+p.b),'分')];break;
  case 'rule-weighted-score':{const [a,d=1]=String(p.mean).split('/').map(Number),total=a*(p.a+p.b),left=total-p.b*p.high*d;nodes=[n('total-score','用人数份与平均数还原代表组总分。',F(total,d),'分'),n('B-score','乙代表组总分是多少？',p.b*p.high,'分'),n('A-total','扣去乙，甲代表组总分是多少？',F(left,d),'分'),target('均分到甲的人数份，每人分数是多少？',F(left,d*p.a),'分')];break}
  case 'rule-ratio-length':nodes=[n('half','一长加一宽对应多少米？',p.perimeter/2,'米'),n('parts','长加宽共有几份？',p.a+p.b),n('one','一份是多少米？',p.perimeter/2/(p.a+p.b),'米'),target('所求长是多少米？',p.perimeter/2/(p.a+p.b)*p.b,'米')];break;
  case 'rule-ratio-perimeter':nodes=[n('one','已知宽对应的单位份是多少米？',p.width/p.a,'米'),n('length','长是多少米？',p.width/p.a*p.b,'米'),target('按两长两宽合计一周，周长是多少？',2*p.width/p.a*(p.a+p.b),'米')];break;
  case 'rule-fraction-reverse':{const afterFirst=F(p.left*p.d2,p.d2-1),start=F(p.left*p.d1*p.d2,(p.d1-1)*(p.d2-1));nodes=[D('第二次分数以什么为整体？',['原量','第一次余量'],'第一次余量'),n('after-first','由最后余量还原第一次余量。',afterFirst),target('再按第一次比例还原原量。',start)];break}
  case 'rule-fraction-original':{const first=F(p.start,p.d1),second=F(p.start,p.d2);nodes=[D('两次分数所用的整体是否相同？',['相同原量','第二次用余量'],'相同原量'),n('first-use','第一次用掉多少？',first),n('second-use','第二次用掉多少？',second),target('原量移除两次用量，最后剩多少？',F(p.start*(p.d1*p.d2-p.d1-p.d2),p.d1*p.d2))];break}
  case 'rule-packs-exact':{const costs=[];for(let k=0;k<=Math.floor(p.count/p.size);k++)costs.push(k*p.pack+(p.count-k*p.size)*p.single);nodes=[D('包装能否拆开？',['能拆','整包不能拆'],'整包不能拆'),...costs.map((v,k)=>n('cost-'+k,`买 ${k} 包，其余单买恰好满足数量，费用多少？`,v,'元')),target('在全部合法方案中比较最低费用。',Math.min(...costs),'元')];break}
  // Held-out content adapters added after functional interface freeze f0f013a.
  case 'reverseDigits':{const total=m.a+m.b,gap=m.a-m.b;nodes=[n('digit-gap','交换后的位值差由每份9产生，十位与个位数字相差多少？',gap),n('smaller-digit','结合数字和与数字差，较小的个位数字是多少？',(total-gap)/2),n('larger-digit','较大的十位数字是多少？',(total+gap)/2),target('按原来的位值合成两位数。',10*m.a+m.b)];break}
  case 'riverTravel':nodes=[n('down-speed','顺流时船与水同向，实际速度是多少？',m.v+m.c,'千米/时'),n('up-speed','逆流时船与水反向，实际速度是多少？',m.v-m.c,'千米/时'),n('down-time','顺流这段需要多少小时？',F(m.distance,m.v+m.c),'小时'),n('up-time','逆流这段需要多少小时？',F(m.distance,m.v-m.c),'小时'),target('两段实际时间合计多少小时？',F(2*m.v*m.distance,m.v*m.v-m.c*m.c),'小时')];break;
  case 'threeSetExactlyTwo':nodes=[n('only-AB','甲乙交集移除三组全参加的人，恰好甲乙多少人？',m.ab-m.triple,'人'),n('only-AC','甲丙交集移除三组全参加的人，恰好甲丙多少人？',m.ac-m.triple,'人'),n('only-BC','乙丙交集移除三组全参加的人，恰好乙丙多少人？',m.bc-m.triple,'人'),target('这三部分互不重叠，恰好参加两组共多少人？',m.ab+m.ac+m.bc-3*m.triple,'人')];break;
  case 'openBox':{const upper=Math.floor((m.side-1)/2),volumes=[];for(let x=1;x<=upper;x++)volumes.push({x,side:m.side-2*x,v:x*(m.side-2*x)**2});nodes=[n('largest-cut','底边必须为正，合法正整数剪角最多取多少？',upper),D('剪去四角后，一条底边相对原边减少多少？',['x','2x'],'2x'),...volumes.flatMap(q=>[n('base-'+q.x,`剪角 ${q.x} 时，底边长度是多少？`,q.side),n('volume-'+q.x,`底边与盒高共同决定体积，剪角 ${q.x} 时体积是多少？`,q.v)]),target('完整比较所有合法体积，最大是多少？',Math.max(...volumes.map(q=>q.v)))];break}
  default:return null;
  }
  if(id==='natural-unionChance'||id==='natural-complementChance'){
   const red=m.red-m.both,blue=m.blue-m.both,union=red+blue+m.both,outside=m.total-union;
   const parts=[n('only-red','只参加红组的人数是多少？',red,'人',{dependsOn:[]}),n('only-blue','只参加蓝组的人数是多少？',blue,'人',{dependsOn:[]}),
    n('region-total','合并互不重叠区域，至少参加一组的不同人数是多少？',union,'人',{dependsOn:['only-red','only-blue']})];
   if(id==='natural-complementChance')parts.push(n('neither','从全体移除这些区域，都不参加的有多少人？',outside,'人',{dependsOn:['region-total']}));
   parts.push(n('target','按题目规定的全体人数，求目标概率。',F(id==='natural-unionChance'?union:outside,m.total),'',{dependsOn:[id==='natural-unionChance'?'region-total':'neither']}));
   alternatives.push(R('disjoint-regions','按互不重叠区域直接计数',parts));
  }
  if(id==='routeProbability'){
   const counts=Array.from({length:m.h+1},()=>Array(m.w+1).fill(0)),cellId=(x,y)=>'ways-'+x+'-'+y;
   const dp=[n('sampling-rule','本题哪个对象等可能？','完整路线等可能','',{dependsOn:[],choices:['完整路线等可能','每个岔口单独等可能']}),
    n('all-routes','没有限制点时，全部最短路线共有多少条？',choose(m.w+m.h,m.w),'条',{dependsOn:['sampling-rule']})];
   for(let y=0;y<=m.h;y++)for(let x=0;x<=m.w;x++){
    const blocked=x===m.x&&y===m.y,deps=['sampling-rule'];let value=blocked?0:x+y===0?1:0;
    if(!blocked&&x){value+=counts[y][x-1];deps.push(cellId(x-1,y))}
    if(!blocked&&y){value+=counts[y-1][x];deps.push(cellId(x,y-1))}
    counts[y][x]=value;
    dp.push(n(cellId(x,y),`避开P，到达 (${x},${y}) 的最短路线有几条？`,value,'条',{dependsOn:deps,
     hints:['被排除的P能传出合法路线吗？其余点分别检查左边和下边。','到达一个点的不同最后一步不会重叠，把合法入口路线数合并。']}));
   }
   dp.push(n('target','避开P的完整路线占全部路线的概率是多少？',F(counts[m.h][m.w],choose(m.w+m.h,m.w)),'',{dependsOn:['all-routes',cellId(m.w,m.h)]}));
   alternatives.push(R('direct-route-count','直接逐点累加可行路线',dp));
  }
  if(c.skillContractKey){
   if(id==='squareBorder')alternatives.push(R('boundary-strips','按不重叠的四条边数新增格',[
    n('outer-side','新增后，上下两条边各有多少格？',m.n+2,'格',{dependsOn:[]}),n('top-bottom','上边和下边合计新增多少格？',2*(m.n+2),'格',{dependsOn:['outer-side']}),
    n('left-right','去掉已经计过的角格，左右两边合计多少格？',2*m.n,'格',{dependsOn:[]}),n('target','合并四条互不重叠的边，新增多少格？',4*m.n+4,'格',{dependsOn:['top-bottom','left-right']})]));
   if(id==='paintedCube'||id==='cubeProbability'){
    const faceNodes=[n('one-face','一个面去掉角格后，边缘共有多少小块？',4*(m.n-2),'块',{dependsOn:[]}),n('six-faces','先分别数六个面，共记录多少次？',24*(m.n-2),'次',{dependsOn:['one-face']}),
     n('multiplicity','每个恰好两面涂色的小块被记录几次？',2,'次',{dependsOn:[]})];
    faceNodes.push(n(id==='paintedCube'?'target':'two-painted','除去重复计数，恰好两面涂色的小块是多少？',12*(m.n-2),'块',{dependsOn:['six-faces','multiplicity']}));
    if(id==='cubeProbability')faceNodes.push(n('all-cubes','全部小块共有多少？',m.n**3,'块',{dependsOn:[]}),n('target','符合条件的块数占全部小块几分之几？',F(12*(m.n-2),m.n**3),'',{dependsOn:['two-painted','all-cubes']}));
    alternatives.push(R('face-deduplication','按六个面计数后修正重复',faceNodes));
   }
   if(id==='chartScale')alternatives.push(R('proportional-heights','按柱高的对应倍率求人数',[
    n('combined-height','乙丙的柱高合计多少格？',m.b+m.c,'格',{dependsOn:[]}),n('height-ratio','合并柱高是甲柱高的几倍？',F(m.b+m.c,m.a),'倍',{dependsOn:['combined-height']}),n('target','甲人数乘这个倍率，乙丙合计多少人？',(m.b+m.c)*m.unit,'人',{dependsOn:['height-ratio']})]));
   if(id==='missingAverage')alternatives.push(R('deviation-balance','用平均数的总偏差保持平衡',[
    n('mean-gap','余下平均数比原平均少多少？',m.mean-m.other,'',{dependsOn:[]}),n('remaining-deviation','余下所有数相对原平均合计少多少？',(m.count-1)*(m.mean-m.other),'',{dependsOn:['mean-gap']}),n('target','被删数高出原平均同样的量，它是多少？',m.mean+(m.count-1)*(m.mean-m.other),'',{dependsOn:['remaining-deviation']})]));
   if(id==='natural-weighted'||id==='natural-fractionWeighted')alternatives.push(R('baseline-difference','以红队分数作共同基准再均分差额',[
    n('score-gap','蓝队每人比红队每人多多少分？',F(m.blueScore-m.redScore,m.den),'分',{dependsOn:[]}),n('extra-total','蓝队人数份合计多出多少分？',F(m.blue*(m.blueScore-m.redScore),m.den),'分',{dependsOn:['score-gap']}),
    n('people-parts','代表组共多少人数份？',m.red+m.blue,'份',{dependsOn:[]}),n('extra-average','把差额均分到所有人数份，每份多多少分？',F(m.blue*(m.blueScore-m.redScore),m.den*(m.red+m.blue)),'分',{dependsOn:['extra-total','people-parts']}),n('target','在红队基准分上加每份差额，平均分是多少？',F(m.red*m.redScore+m.blue*m.blueScore,m.den*(m.red+m.blue)),'分',{dependsOn:['extra-average']})]));
   if(id==='telescopingDifferences')alternatives.push(R('equal-differences','按等大的相邻差计算',[
    n('gap','每个括号的差是多少？',m.step,'',{dependsOn:[]}),n('terms','从题目两个端点之间，共有几个这样的差？',m.n,'',{dependsOn:['gap']}),n('target','每个差乘括号数量，合计多少？',m.n*m.step,'',{dependsOn:['gap','terms']})]));
  }
  return [R('family-quantities','连接本题的数量关系',nodes),...alternatives];
 }
 function reviewedRoutes(c,N,R){
  if(!c.skillContractKey)return [];
  const m=c.math,id=c.problemState.familyId||c.family,n=(id,prompt,answer,unit='',dependsOn=[])=>N(id,prompt,answer,unit,{dependsOn}),out=[];
  if(id==='reverseDigits'){
   const candidates=[];for(let a=1;a<=9;a++)for(let b=1;b<a;b++)if(a+b===m.a+m.b)candidates.push(10*a+b);
   out.push(R('digit-pairs','先列数字对再核对交换差',[n('candidate-count','数字和满足题目且十位大于个位的两位数有几个？',candidates.length),n('target','逐一交换核对原来的差，符合的是哪个两位数？',10*m.a+m.b,'',['candidate-count'])]));
  }
  if(id==='natural-digitCount'||id==='natural-distinctDigitCount'){
   const sizes=[0,1,2].map(r=>m.digits.filter(d=>d%3===r).length);
   out.push(R('remainder-groups','按余数分类后配对',[...sizes.map((v,i)=>n('group-'+i,`允许数字中，除以3余${i}的有几个？`,v)),
    n('pairs-00','两位都取余数0的数字，考虑本题能否重复，有几种？',sizes[0]*(sizes[0]-Number(m.distinct)),'',['group-0']),
    n('pairs-12','十位余1、个位余2的有序对有几种？',sizes[1]*sizes[2],'',['group-1','group-2']),n('pairs-21','十位余2、个位余1的有序对有几种？',sizes[1]*sizes[2],'',['group-1','group-2']),
    n('target','合并三个互不重叠的有序分支，总共有几个合法两位数？',sizes[0]*(sizes[0]-Number(m.distinct))+2*sizes[1]*sizes[2],'',['pairs-00','pairs-12','pairs-21'])]));
  }
  if(id==='machineOrder')out.push(R('input-cancellation','先移除两条路径相同的输入部分',[
   n('AB-extra','先甲后乙时，原输入的共同倍数之外增加多少？',m.b*m.c+m.d),n('BA-extra','先乙后甲时，原输入的共同倍数之外增加多少？',m.d*m.a+m.b),n('target','相同输入部分抵消，两种最终结果的差是多少？',Math.abs(m.b*m.c+m.d-m.d*m.a-m.b),'',['AB-extra','BA-extra'])]));
  if(id==='digitDivisor'){
   const ds=Array.from({length:9},(_,i)=>i+1).filter(d=>(10*m.tens)%d===0);
   out.push(R('tens-divisors','找十位部分的一位正因数',[n('tens-part','十位部分的实际数量是多少？',10*m.tens),n('divisor-count','十位部分有几个1到9的正因数？',ds.length,'',['tens-part']),n('target','每个这样的因数对应一个个位，合法两位数共有几个？',ds.length,'',['divisor-count'])]));
  }
  if(id==='boundaryNotch')out.push(R('full-contour','沿新轮廓分水平和竖直边计数',[
   n('horizontal','沿全部新边界，水平段合计多长？',2*m.w),n('vertical','两侧和两条凹口深度边，竖直段合计多长？',2*m.h+2*m.depth),n('target','全部水平段与竖直段合计，周长是多少？',2*(m.w+m.h+m.depth),'',['horizontal','vertical'])]));
  if(id==='polygonTurn')out.push(R('interior-supplement','先拆三角形求内角再求相邻转角',[
   n('triangles','从一个顶点拆分，n边形共有几个三角形？',m.n-2),n('interior-total','这些三角形的角总量是多少度？',180*(m.n-2),'度',['triangles']),n('one-interior','正多边形一个内角是多少度？',F(180*(m.n-2),m.n),'度',['interior-total']),n('target','内角旁的转角与它合成平角，转角多少度？',F(360,m.n),'度',['one-interior'])]));
  if(id==='lShapeArea')out.push(R('disjoint-rectangles','把L形分成两块不重叠长方形',[
   n('bottom-area','下面完整一条长方形的面积是多少？',m.w*(m.h-m.b)),n('upper-left-area','左上角保留的长方形面积是多少？',(m.w-m.a)*m.b),n('target','合并两块没有重叠的面积，L形面积是多少？',m.w*m.h-m.a*m.b,'',['bottom-area','upper-left-area'])]));
  if(id==='crossArea')out.push(R('uncovered-corners','重排未覆盖角块后从整张移除',[
   n('unused-width','整张宽度扣掉竖条宽度后还剩多少？',m.w-m.a),n('unused-height','整张高度扣掉横条高度后还剩多少？',m.h-m.b),n('uncovered-area','四个未覆盖角块拼成的长方形面积是多少？',(m.w-m.a)*(m.h-m.b),'',['unused-width','unused-height']),n('whole-area','整张长方形的面积是多少？',m.w*m.h),n('target','整张扣去未覆盖区域，覆盖面积是多少？',m.a*m.h+m.b*m.w-m.a*m.b,'',['uncovered-area','whole-area'])]));
  if(id==='oppositeScale')out.push(R('representative-area','取方便的原长后保持实际面积',[
   n('original-area','取原长为比例分母，原长方形面积是多少？',m.a*m.old),n('new-length','这个代表长方形变化后的长是多少？',m.b),n('target','面积不变，新面积除以新长，新宽是多少？',F(m.a*m.old,m.b),'',['original-area','new-length'])]));
  if(id==='similarAreaPerimeter')out.push(R('integer-length-parts','从面积比的整数部分还原长度份数',[
   n('small-length-part','较小面积比部分的正平方根是多少？',m.a),n('large-length-part','较大面积比部分的正平方根是多少？',m.b),n('perimeter-one-part','较小周长除以它的对应长度份数，一份是多少？',m.unit,'',['small-length-part']),n('target','同一周长份量乘较大长度份数，周长是多少？',m.b*m.unit,'',['perimeter-one-part','large-length-part'])]));
  if(id==='scaleAreaReverse')out.push(R('reverse-area-stages','按两次面积倍率分别逆推',[
   n('before-second','把最后一次长度缩放对应的面积变化逆推，之前面积是多少？',m.old*m.k*m.k),n('target','再逆推第一次长度放大对应的面积倍率，原面积是多少？',m.old,'',['before-second'])]));
  if(id==='shadowSimilarity')out.push(R('shadow-factor','先求影长是杆高的整数倍数',[
   n('shadow-factor','题目中小杆的影长是它高度的几倍？',2),n('big-shadow','大杆影子的实际长度是多少？',2*m.b*m.unit),n('target','同一时刻用这个影长倍数还原大杆高度，是多少？',m.b*m.unit,'',['shadow-factor','big-shadow'])]));
  if(id==='natural-offers'){
   const a=F(3*m.price,4),gap=m.price-1-3*m.price/4;
   out.push(R('per-item-gap','先累计每件价差再处理整单费用',[
    n('A-unit','甲每本折后价格是多少？',a,'元/本'),n('unit-gap','乙每本比甲折后价多多少？',gap,'元/本',['A-unit']),n('before-fee-gap','这些本子的价差合计多少？',gap*m.count,'元',['unit-gap']),n('target','再算只属于甲的配送费，两店整单差额是多少？',Math.abs(gap*m.count-m.fee),'元',['before-fee-gap'])]));
  }
  return out;
 }
 return {make,reviewedRoutes};
})(typeof module!=='undefined'?require('./competition'):{competitionFraction});
if(typeof module!=='undefined')module.exports=ReasoningGraphExtra;

'use strict';
// Explicit derivations for the final cohort; original mathematical identity is unchanged.
const ReasoningGraphFinal=(()=>{
 const sum=a=>a.reduce((s,x)=>s+x,0),fraction=(a,b)=>{let x=a,y=b;while(y)[x,y]=[y,x%y];return b/x===1?String(a/x):a/x+'/'+(b/x)};
 function review(c,routes,N,R){
  if(!c.skillContractKey)return null;
  const id=c.problemState.familyId||c.family,m=c.math,n=(id,q,a,more={})=>N(id,q,a,'',more),r=(id,name,nodes)=>R(id,name,nodes),out=[...routes];
  const replace=nodes=>{out[0]=r(out[0].id,out[0].name,nodes)},append=(id,name,nodes)=>out.push(r(id,name,nodes));
  const orders=(prefix,count)=>{let value=1;const nodes=[];for(let i=1;i<=count;i++){const choices=count-i+1;nodes.push(n(prefix+'-choice-'+i,`第 ${i} 个位置还有多少个不同对象可选？`,choices));value*=choices}nodes.push(n(prefix+'-orders','把每个位置的合法选择逐层配对，完整顺序有多少种？',value));return {nodes,value}};
  const compositions=(total,size)=>{const values=[];function visit(left,a){if(a.length===size-1){values.push([...a,left]);return}for(let v=0;v<=left;v++)visit(left-v,[...a,v])}visit(total,[]);return values};
  const classes=a=>{const by=new Map();for(const v of a){const key=v.map((_,i)=>[...v.slice(i),...v.slice(0,i)].join(',')).sort()[0];if(!by.has(key))by.set(key,[]);by.get(key).push(v)}return [...by].sort(([a],[b])=>a.localeCompare(b))};
  switch(id){
   case 'overlapSquares':append('new-strips','只添加第二块新增的两条',[n('first-area','第一块正方形的面积是多少？',m.n*m.n),n('right-strip',`第二块右侧新增条带宽 ${m.dx}、高 ${m.n}，面积是多少？`,m.dx*m.n),n('upper-strip',`扣去右侧条带后，新增上条带宽 ${m.n-m.dx}、高 ${m.dy}，面积是多少？`,(m.n-m.dx)*m.dy),n('target','三块互不重叠的区域合计覆盖多少面积？',m.n*m.n+m.dx*m.n+(m.n-m.dx)*m.dy)]);break;
   case 'gridDetour':{const counts=Array.from({length:m.h+1},()=>Array(m.w+1).fill(0)),nodes=[];for(let y=0;y<=m.h;y++)for(let x=0;x<=m.w;x++){const blocked=x===m.x&&y===m.y;counts[y][x]=blocked?0:x===0&&y===0?1:(x?counts[y][x-1]:0)+(y?counts[y-1][x]:0);const parents=[...(x?['cell-'+(x-1)+'-'+y]:[]),...(y?['cell-'+x+'-'+(y-1)]:[])];nodes.push(n('cell-'+x+'-'+y,blocked?`点 (${x},${y}) 是P，不能经过；可到这里的合法路线写几？`:`点 (${x},${y}) 从左边或下方到达；A本身有一条空路线。可到这里的合法路线有几条？`,counts[y][x],{dependsOn:blocked?[]:parents}))}nodes.push(n('target','B点累加得到多少条避开P的路线？',counts[m.h][m.w],{dependsOn:['cell-'+m.w+'-'+m.h]}));append('direct-grid','按最后一步逐点累加',nodes);break}
   case 'adjacentLine':{const a=orders('outer',m.n-1),b=orders('other',m.n-2);replace([n('decision-1','必须相邻时，怎样先处理两位朋友？','先作为一个对象',{choices:['先作为一个对象','把两人视为固定顺序的一个对象']}),n('outer-arrange','捆绑后共有几个外部对象？',m.n-1),...a.nodes,n('order-count','两位朋友的内部顺序有几种？',2),n('target','外部顺序与内部顺序配对，总共有多少种？',2*a.value)]);append('adjacent-position','先固定相邻位置',[n('starts','相邻位置的起始位置有几种？',m.n-1),n('inside','相邻两人的内部顺序有几种？',2),...b.nodes,n('target','起点、内部顺序和其余人顺序逐层配对，共多少种？',2*(m.n-1)*b.value)]);break}
   case 'restrictedTeam':{let neither=0,one=0;for(let a=0;a<m.n-2;a++)for(let b=a+1;b<m.n-2;b++){one+=2;for(let d=b+1;d<m.n-2;d++)neither++}append('specified-members','按指定朋友入选人数分组',[n('neither',`给其余 ${m.n-2} 人编号，按三个递增编号列全，两位朋友都不选的小队有多少？`,neither),n('one-friend',`从两位朋友选一位，再从其余 ${m.n-2} 人按两个递增编号列全，恰选一位朋友的小队有多少？`,one),n('target','两个互不重叠的合法类别共有多少队？',neither+one)]);break}
   case 'digitComplement':{const nodes=Array.from({length:m.length},(_,i)=>n('first-'+(i+1),`第一次出现 ${m.digit} 在第 ${i+1} 位：前面每位避开它，后面每位自由。这个分支有多少个密码？`,9**i*10**(m.length-i-1)));nodes.push(n('target','每个密码的第一次出现位置唯一，各分支相加是多少？',sum(nodes.map(x=>Number(x.answer)))));append('first-occurrence','按第一次出现的位置分组',nodes);break}
   case 'checkerDomino':{const nodes=out[0].nodes.slice(0,-1);nodes.push(n('first-row','第一行从第2列横着配对，留最右一白格；放几块？',m.w/2-1),n('middle-rows','中间所有完整行逐行横铺，共放几块？',(m.h-2)*m.w/2),n('last-row','最后一行从第1列横着配对，留最左一白格；放几块？',m.w/2-1),n('target','构造放满所有黑格并达到颜色上界，最多多少块？',m.w*m.h/2-2));replace(nodes);break}
   case 'natural-pairChance':append('ordered-draws','数两次具体取球的有序结果',[n('all-first','第一次可取多少个不同的具体球？',m.red+m.blue),n('all-second','取走一个后，第二次还有多少个具体球可取？',m.red+m.blue-1),n('all-ordered','两次具体球的有序结果共有多少？',(m.red+m.blue)*(m.red+m.blue-1)),n('red-first','第一次取红的具体球有多少？',m.red),n('red-second','已取走一红后，第二次可取多少个红球？',m.red-1),n('red-ordered','两次红球的有序结果有多少？',m.red*(m.red-1)),n('target','有序红红结果占有序全体的概率是多少？',fraction(m.red*(m.red-1),(m.red+m.blue)*(m.red+m.blue-1)))]);break;
   case 'overlapProbability':{const overlap=(m.n-m.dx)*(m.n-m.dy),only=m.n*m.n-overlap;append('three-regions','把样本区域分成三块',[n('shared-width','共享区域的宽是多少？',m.n-m.dx),n('shared-height','共享区域的高是多少？',m.n-m.dy),n('shared','共享长方形面积是多少？',overlap),n('only-first','只被第一块覆盖的面积是多少？',only),n('only-second','只被第二块覆盖的面积是多少？',only),n('whole','三个互不重叠的区域合计面积是多少？',2*only+overlap),n('target','共享区域占这三个区域之和几分之几？',fraction(overlap,2*only+overlap))]);break}
   case 'chartAverage':{const [low,,high]=m.counts,count=sum(m.counts),total=2*low+4*m.counts[1]+6*high;append('mean-baseline','先让每人都得4分再修正',[n('people','图里实际总人数是多少？',count),n('baseline-total','若每人暂按4分，总分是多少？',4*count),n('low-deficit','低分组比这个基准总共少几分？',2*low),n('high-surplus','高分组比这个基准总共多几分？',2*high),n('total','修正后实际总分是多少？',total),n('target','实际总分按总人数平均是多少？',fraction(total,count))]);break}
   case 'parityPermutations':{const odd=Math.ceil(m.n/2),even=Math.floor(m.n/2),a=orders('odd',odd),b=orders('even',even);let selections=0;for(let mask=0;mask<2**(odd+1);mask++)if(Array.from({length:odd+1},(_,i)=>mask>>i&1).reduce((s,x)=>s+x,0)===even)selections++;replace([n('odd-count','1到题目上限的奇数有几个？',odd),...a.nodes,n('gaps','奇数排好后，两端和中间共几个空隙？',odd+1),n('gap-selection',`给空隙编号，递增列全 ${even} 个不同空隙的选择，有几种？`,selections),...b.nodes,n('target','每个奇数顺序、空隙选择和偶数顺序一一配对，总共有多少种？',a.value*selections*b.value)]);break}
   case 'recurrenceRemainders':{const a=[1,1];while(a.length<10)a.push((a.at(-1)+a.at(-2))%3);const tail=m.n%8,cycles=Math.floor(m.n/8),cycleSum=sum(a.slice(0,8)),tailSum=sum(a.slice(0,tail));replace([n('decision-1','要验证余数递推的周期，应追踪哪个状态？','相邻两个余数',{choices:['单个余数','相邻两个余数']}),...a.slice(0,8).map((v,i)=>n('residue-'+(i+1),`按原规则推进，第 ${i+1} 项除以3的余数是多少？`,v)),n('returned-pair','继续推进，第9项、第10项的有序余数对是什么？','1,1',{choices:['1,1','1,0','0,1']}),n('pair-period','相邻余数对首次回到最初的1、1，完整周期有几项？',8),n('cycle-sum','刚才核对的一个完整周期，余数合计是多少？',cycleSum),n('whole-cycles','前指定项数包含几个完整周期？',cycles),n('tail-size','完整周期后还剩几项？',tail),n('tail-sum','按周期从头取这些尾项，余数和是多少？',tailSum),n('target','完整周期和加尾段和，共是多少？',cycles*cycleSum+tailSum)]);break}
   case 'recurrenceForward':{const a=[m.a,m.b];while(a.length<m.n)a.push(a.at(-1)+a.at(-2));replace([n('decision-1','每个新项需要哪两项？','紧邻前两项',{choices:['紧邻前两项','固定前两项']}),...a.slice(2).map((v,i)=>n('term-'+(i+3),`第 ${i+3} 项由紧邻前两项相加得到多少？`,v)),n('target','回到题目指定项号，填它的数值。',a[m.n-1])]);break}
   case 'recurrenceTotal':{const a=[m.a,m.b];while(a.length<m.n+2)a.push(a.at(-1)+a.at(-2));append('difference-cancellation','用相邻差抵消中间项',[n('next-term',`继续原递推，第 ${m.n+1} 项是多少？`,a[m.n]),n('second-next',`再推进一次，第 ${m.n+2} 项是多少？`,a[m.n+1]),n('cancel-middle','把每项写成后面两项的差，中间项以什么方式出现？','一加一减',{choices:['一加一减','都相加']}),n('target',`中间项抵消，留下第 ${m.n+2} 项减第2项，前指定项的和是多少？`,a[m.n+1]-m.b)]);break}
   case 'hypotenuseMidpoint':replace([n('half-turn','把直角顶点记为O、斜边两端记为B和C。绕中点M转180°，B和C怎样变化？','互换',{choices:['互换','各自不动']}),n('opposite-x',`取O=(0,0)、B=(${3*m.k},0)、C=(0,${4*m.k})。O转到D，旋转后的两直角边沿C的水平线、B的竖直线；D横坐标是多少？`,3*m.k),n('opposite-y','D也在经过C的水平线上，D纵坐标是多少？',4*m.k),n('hypotenuse','OD是所补长方形的对角线，用两个垂直方向的长度求OD是多少？',5*m.k),n('target','180°旋转使O和D关于M相对，OM是OD的一半。OM是多少？',fraction(5*m.k,2))]);break;
   case 'binaryNoNeighbors':{const a=[1,2];while(a.length<=m.n)a.push(a.at(-1)+a.at(-2));replace([n('decision-1','按第一盏灯分类，亮时第二盏必须怎样？','必须灭',{choices:['必须灭','可以亮']}),n('base-empty','0盏灯的空安排算几种？',1),n('base-one','1盏灯可亮或灭，有几种？',2),...a.slice(2).map((v,i)=>n('count-'+(i+2),`${i+2} 盏：首盏灭留下 ${i+1} 盏，首盏亮迫使第二盏灭留下 ${i} 盏。两分支共有几种？`,v)),n('shorter','比原题少一盏的合法安排有几种？',a[m.n-1]),n('two-shorter','比原题少两盏的合法安排有几种？',a[m.n-2]),n('target','原题首盏灭与亮两个分支合计多少种？',a[m.n])]);const counts=Array(Math.ceil(m.n/2)+1).fill(0);for(let mask=0;mask<2**m.n;mask++){if(mask&(mask<<1))continue;let k=0;for(let i=0;i<m.n;i++)k+=mask>>i&1;counts[k]++}append('lamp-enumeration','按亮灯个数逐个列合法位置',[...counts.map((v,i)=>n('on-count-'+i,`恰有 ${i} 盏亮，递增列亮灯位置并剔除相邻位置，有几种？`,v)),n('target','各亮灯个数互不重叠，总共多少种？',sum(counts))]);break}
   case 'unorderedPairs':append('forward-pairs','每个编号只与后面的编号配对',[...Array.from({length:m.n-1},(_,i)=>n('first-'+(i+1),`编号 ${i+1} 只与更大编号组成搭档，有几种？`,m.n-i-1)),n('target','每对的较小编号唯一，各分支共有多少对？',m.n*(m.n-1)/2)]);break;
   case 'circularSeating':{const a=orders('seat',m.n-2),b=orders('block',m.n-2);replace([n('decision-1','整体旋转相同，怎样先选每圈的一个代表？','固定小乐的位置',{choices:['固定小乐的位置','再把左右镜像合并']}),n('neighbor','小明可选小乐左右两个不同位置，有几种？',2),n('remaining','还有几个不同的人要依次安排？',m.n-2),...a.nodes,n('target','小明的位置与其余人的完整顺序配对，共多少种？',2*a.value)]);append('circle-block','把相邻两人合成圆桌上的一个对象',[n('block-objects','捆成一块后，圆桌有几个对象？',m.n-1),n('free-objects','固定这一块去掉整圈旋转，剩几个不同对象可依次安排？',m.n-2),...b.nodes,n('inside','块内的左右顺序有几种？',2),n('target','每个圆桌外部顺序与内部顺序配对，共多少种？',2*b.value)]);break}
   case 'allThreeColors':{let one=3,two=0,three=0;const nodes=[];for(let k=1;k<=m.n;k++){if(k>1)[one,two,three]=[one,2*two+2*one,3*three+two];nodes.push(n('one-'+k,`${k} 面旗只用一种颜色，延续同一种颜色，有几串？`,one,{dependsOn:k>1?['one-'+(k-1)]:[]}));nodes.push(n('two-'+k,`${k} 面旗恰用两色：已有两色各可续两色，已有一色各可添两种新色。共有几串？`,two,{dependsOn:k>1?['one-'+(k-1),'two-'+(k-1)]:[]}));nodes.push(n('three-'+k,`${k} 面旗全三色：已有三色各可续三色，已有两色只能添唯一缺色。共有几串？`,three,{dependsOn:k>1?['two-'+(k-1),'three-'+(k-1)]:[]}))}nodes.push(n('target','读出原题面数下，恰用三色的安排数量。',three,{dependsOn:['three-'+m.n]}));append('color-usage-states','每添一面旗按已用颜色数分组',nodes);break}
   case 'conditionalBalls':{const rr=m.red*(m.red-1)/2,rb=m.red*m.blue;append('retained-pairs','只保留红红和红蓝两类',[n('red-pairs','红红按递增球编号列全，共多少对？',rr),n('mixed-pairs','一红配一蓝，每个红球可配每个蓝球，共多少对？',rb),n('whole','红红与红蓝互不重叠，合起来是已知至少一红的完整结果，共多少对？',rr+rb),n('target','在保留的等可能球对中，红红的概率是多少？',fraction(rr,rr+rb))]);break}
   case 'ballReplacement':{const nodes=out[0].nodes;replace([n('white-white','取出两个白球，放回一个黑球；白球减少几个？',2),n('black-black','取出两个黑球再放回黑球；白球数量改变几个？',0),n('white-black','取出一白一黑再放回白球；白球数量改变几个？',0),...nodes]);break}
   case 'rectanglePointAreas':replace([n('height-span','每个三角形沿垂足分成两块，再分别复制翻转，可拼成以底和高为边的长方形。左右三角形的高相加等于什么？','长方形的宽',{choices:['长方形的宽','长方形的高']}),n('doubled-opposites','左右三角形各复制一份后，两块长方形正好拼成原长方形。四个三角形面积合计多少？',2*(m.left+m.right)),n('opposite-total','上下三角形也各复制一份，正好拼满同一个原长方形；原上下两块合计多少？',m.left+m.right),n('decision-1','上下的合计与原左右两块的合计是什么关系？','相等',{choices:['相等','上下是左右的两倍']}),n('target','上下合计扣去已知上方三角形，下方面积是多少？',m.left+m.right-m.top)]);break;
   case 'stagedClimb':{const days=Math.max(1,Math.ceil((m.height-m.up)/(m.up-m.down))+1);append('daily-highs','逐天列最高点找到首次到达',[...Array.from({length:days},(_,i)=>n('day-'+(i+1),`第 ${i+1} 天白天最高点是多少米？前面尚未到终点的完整昼夜，每次净增 ${m.up-m.down} 米。`,i*(m.up-m.down)+m.up)),n('target','按日期从前往后比较，第一个达到标记的是第几天？',days)]);break}
   case 'rotatingColors':{const records=[];for(let mask=0;mask<2**m.n;mask++){const v=Array.from({length:m.n},(_,i)=>mask>>i&1);if(sum(v)===m.red)records.push(v)}const grouped=classes(records),nodes=out[0].nodes.slice(0,-1);nodes.push(...grouped.map(([key,v],i)=>n('rotation-class-'+i,`从代表 ${key} 开始列所有循环换起点的记录，不同固定起点记录有几个？`,v.length)),n('target','每组只保留一个代表，共有几种涂法？',grouped.length));replace(nodes);const gaps=classes(compositions(m.n-m.red,m.red));append('gap-records','列红位置之间的蓝间隔并按循环归类',[n('blue-count','红位置之间总共有几个蓝位置？',m.n-m.red),n('gap-record-count',`把这些蓝位置分给 ${m.red} 个有序间隔，每个可为0，逐个列全有几份记录？`,sum(gaps.map(([,a])=>a.length))),...gaps.map(([key,a],i)=>n('gap-class-'+i,`间隔代表 (${key})，仅循环换起点属于同一组，这组有几份不同记录？`,a.length)),n('target','每组取一个间隔代表，能还原多少种圆环涂法？',gaps.length)]);break}
   default:return null;
  }
  return out;
 }
 return {review};
})();
if(typeof module!=='undefined')module.exports=ReasoningGraphFinal;

'use strict';
// Bounded linear algebra only. Expressions are parsed, never executed.
const RelationExpression=(()=>{
 const q=(n,d=1n)=>{if(!d)throw Error('zero divisor');return [n,d]},add=(a,b)=>q(a[0]*b[1]+b[0]*a[1],a[1]*b[1]),mul=(a,b)=>q(a[0]*b[0],a[1]*b[1]),neg=a=>q(-a[0],a[1]),zero=a=>a[0]===0n,equal=(a,b)=>a[0]*b[1]===b[0]*a[1],scalar=n=>({constant:n,terms:{}}),scale=(a,b)=>({constant:mul(a.constant,b),terms:Object.fromEntries(Object.entries(a.terms).map(([k,v])=>[k,mul(v,b)]))});
 function combine(a,b,sign=1){const x={constant:add(a.constant,sign<0?neg(b.constant):b.constant),terms:{...a.terms}};for(const [k,v]of Object.entries(b.terms))x.terms[k]=add(x.terms[k]||q(0n),sign<0?neg(v):v);return x}
 const isScalar=a=>Object.values(a.terms).every(zero);
 function parse(value){
  const s=String(value).replace(/\s/g,'').replace(/组/g,'').replace(/×/g,'*').replace(/÷/g,'/').replace(/−/g,'-').replace(/([0-9)])([甲乙丙(])/g,'$1*$2');
  if(!s||s.length>160||!/^[\d.+\-*/()甲乙丙]+$/.test(s))return null;
  const tokens=s.match(/\d+(?:\.\d*)?|\.\d+|[+\-*/()甲乙丙]/g)||[];if(tokens.join('')!==s)return null;let at=0;
  function atom(){const t=tokens[at++];if(t==='+'||t==='-')return scale(atom(),q(t==='-'?-1n:1n));if(t==='('){const x=expr();if(tokens[at++]!==')')throw Error('unclosed');return x}if(['甲','乙','丙'].includes(t))return {constant:q(0n),terms:{[t]:q(1n)}};if(!/^(?:\d+(?:\.\d*)?|\.\d+)$/.test(t||''))throw Error('invalid');const [n,f='']=t.split('.');return scalar(q(BigInt((n||'0')+f),10n**BigInt(f.length)))}
  function product(){let a=atom();while(['*','/'].includes(tokens[at])){const op=tokens[at++],b=atom();if(op==='/'){if(!isScalar(b)||zero(b.constant))throw Error('nonlinear');a=scale(a,q(b.constant[1],b.constant[0]))}else{if(!isScalar(a)&&!isScalar(b))throw Error('nonlinear');a=isScalar(b)?scale(a,b.constant):scale(b,a.constant)}}return a}
  function expr(){let a=product();while(['+','-'].includes(tokens[at])){const op=tokens[at++];a=combine(a,product(),op==='+'?1:-1)}return a}
  try{const x=expr();return at===tokens.length?x:null}catch{return null}
 }
 function substituted(a,aliases){let out=scalar(a.constant);for(const [k,v]of Object.entries(a.terms)){const replacement=aliases?.[k]?parse(aliases[k]):{constant:q(0n),terms:{[k]:q(1n)}};if(!replacement)throw Error('alias');out=combine(out,scale(replacement,v))}return out}
 function form(text,aliases){const parts=String(text).split('=');if(parts.length>2)return null;const a=parse(parts[0]),b=parts.length===2?parse(parts[1]):scalar(q(0n));if(!a||!b)return null;try{return {equation:parts.length===2,value:substituted(parts.length===2?combine(a,b,-1):a,aliases)}}catch{return null}}
 function equivalent(input,expected,aliases){
  const a=form(input,aliases),b=form(expected,aliases);if(!a||!b||a.equation!==b.equation)return false;
  const keys=['constant',...new Set([...Object.keys(a.value.terms),...Object.keys(b.value.terms)])],get=(v,k)=>k==='constant'?v.constant:v.terms[k]||q(0n);
  if(!a.equation)return keys.every(k=>equal(get(a.value,k),get(b.value,k)));
  const pivot=keys.find(k=>!zero(get(b.value,k)));if(!pivot||zero(get(a.value,pivot)))return false;
  const ap=get(a.value,pivot),bp=get(b.value,pivot);return keys.every(k=>equal(mul(get(a.value,k),bp),mul(get(b.value,k),ap)));
 }
 function accepts(node,input){return !!node.linearContract&&node.linearContract.expected.some(e=>equivalent(input,e,node.linearContract.aliases))}
 function recognizes(node,input){return !!node.linearContract&&!!form(input,node.linearContract.aliases)}
 return {parse,equivalent,accepts,recognizes};
})();
if(typeof module!=='undefined')module.exports=RelationExpression;

