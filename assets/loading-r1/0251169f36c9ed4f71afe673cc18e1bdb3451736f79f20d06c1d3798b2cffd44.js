'use strict';
const ExamMappingUI=(()=>{
 let message='',volatileInput=null,showHistory=false,reviewingAttemptId=null;
 function enabled(){return window.__AMC8_RELEASE.features?.examMappingV1===true||/^tianle_amc8_qa_(?:normal_|history_)?rc\d+_v1$/.test(STORE)}
 function childEntryEnabled(){return enabled()&&!/^tianle_amc8_qa_rc\d+_v1$/.test(STORE)}
 function restored(){return TransferEvidenceStore.inspect(saved.rtm1)}
 function readState(){return restored().state}
 function state(){return TransferEvidenceStore.restore(saved.rtm1).state}
 function active(){return readState()?.sessions?.active||null}
 function commit(next){
  if(!canPersist||restored().readOnly||progressStore.getStatus()!=='ready'){message='当前记录暂不能写入，已保存的历史仍可导出。';return false}
  const previous=saved.rtm1;saved.rtm1=next;const result=persist();
  if(!result?.ok){saved.rtm1=previous;message='本次记录未能保存，输入仍在页面中。请导出记录后重试。';return false}
  message='';return true;
 }
 function appendEvent(current,type,extra={}){
  const a=current?.sessions.active;if(!a)return {ok:false,reason:'NO_ACTIVE_ATTEMPT'};
  const e={eventId:a.attemptId+':'+a.nextSequence,type,at:Date.now(),attemptId:a.attemptId,
   sequence:a.nextSequence,mathKey:a.mathKey,examId:a.examId||null,originProblemGroupId:a.originProblemGroupId,
   structureClusterId:a.structureClusterId,mappingBuildId:a.mappingBuildId,presentationKind:a.presentationKind,
   renderingMode:a.renderingMode,priorExposure:a.priorExposure===true,mode:a.mode,
   assignmentId:a.assignmentId||null,pathwayStage:a.pathwayStage||null,
   taskId:a.definition.taskId,taskEvidenceKey:a.kind==='training'&&ExamMapping.data.tasks[a.id]?ConnectedLearning.taskEvidenceKey(ExamMapping.data.tasks[a.id],a.definition):null,
   connectedGroupId:a.connectedGroupId||null,connectedStage:a.connectedStage||null,readinessSnapshot:a.readinessSnapshot||null,
   evidenceScope:a.diagnosticOf?'remediation_support_only':'local_decision_prompt',diagnosticOf:a.diagnosticOf||null,
   supportSnapshot:{methodHelpCount:Math.max(a.helpLevel,a.priorMethodHelp?1:0),answerRevealed:false,statementRead:a.statementRead===true},...extra};
  const appended=TransferEvidenceStore.append(current,e);
  if(appended.ok)appended.state.sessions.active.nextSequence++;
  return appended;
 }
 function event(type,extra={},update){
  const appended=appendEvent(readState(),type,extra);if(!appended.ok){message=appended.reason;return false}
  if(update)update(appended.state);
  return commit(appended.state);
 }
 function profile(){return SourceCatalog.profile({...saved.topicPractice,topicIds:saved.topicPractice.selectedTopicIds})}
 function currentScopeAllowed(a=active()){
  if(!a)return false;
  const known=profile(),p=ExamMapping.getProblem(a.examId||a.originProblemGroupId);
  if(!p||childEntryEnabled()&&!ConnectedLearning.review(p).eligible)return false;
  if(a.kind==='training'){
   const t=ExamMapping.data.tasks[a.id];
   return !!t&&known.sourceIds.includes(p.sourceId)&&(!known.examIds.length||known.examIds.includes(p.examId))&&ExamMapping.taskAllowed(t,known).eligible;
  }
  return ExamMapping.check(p,known,history(),'practice').eligible;
 }
 function requireCurrentScope(){
  if(!canPersist||restored().readOnly||progressStore.getStatus()!=='ready'){stop();message='当前记录暂不能写入，已暂停作答和提示。原首答、帮助及本页草稿都保留，可以先导出再刷新。';render();return false;}
  if(currentScopeAllowed())return true;
  stop();message='这道保留题目前不符合家长当前选择的知识、来源、负担或题目审核范围，已暂停。原首答、提示和草稿都保留。';render();return false;
 }
 function legacyHistory(){
  const index=CompetitionIdentity.index(saved.competition),rows=[...index.values()],exposed=rows;
  const exposedOriginGroups=[],assistedOriginGroups=[];
  for(const p of Object.values(ExamMapping.data.problems)){
   if(!p.recipe)continue;
   const t=competitionCreate(p.recipe),key=CompetitionIdentity.key(t),row=index.get(key);
   if(row){exposedOriginGroups.push(p.examId);if(row.hinted||row.solutionViewed)assistedOriginGroups.push(p.examId)}
  }
  return {solvedMathKeys:[...CompetitionIdentity.solvedKeys(saved.competition)],exposedMathKeys:exposed.map(h=>h.key),assistedMathKeys:rows.filter(h=>h.hinted||h.solutionViewed).map(h=>h.key),exposedOriginGroups,assistedOriginGroups,historyUnknown:restored().historyUnknown};
 }
 function history(){return TransferEvidenceStore.history(readState(),legacyHistory())}
 function originals(known=profile()){
  const selected=known.examIds?.length?new Set(known.examIds):null;
  const scoped=Object.values(ExamMapping.data.problems).filter(p=>(!known.sourceIds||known.sourceIds.includes(p.sourceId))&&(!selected||selected.has(p.examId)));
  if(!scoped.length)return [];
  const h=history(),result=[];
  for(const p of scoped){
   const allowed=ExamMapping.check(p,known,h,'practice');if(!allowed.eligible)continue;
   const checked=ConnectedLearning.review(p);
   if(childEntryEnabled()&&!checked.eligible)continue;
   if(!p.recipe){
    const content=checked.eligible?{...p.presentation,...checked.record}:p.presentation;
    if((content.givenFigures||[]).some(f=>!window.__AMC8_SOURCE_FIGURES?.[f.sha256]))continue;
    result.push({id:p.examId,kind:'exam',examId:p.examId,mathKey:ExamMapping.problemKey(p),
     originProblemGroupId:p.originProblemGroupId,structureClusterId:p.structureClusterId,
     presentationKind:p.presentationKind,renderingMode:content.renderingMode,
     definition:{taskId:p.examId,prompt:content.prompt,givenText:content.givenText||'',
      answerContract:p.answerContract,options:content.options||[],hints:content.hints,
      givenFigures:content.givenFigures||[],givenTable:content.givenTable||[],auxiliaryFigure:null,grantsJudgmentEvidence:false}});
    continue;
   }
   const task=competitionCreate(p.recipe);if(!ExamMapping.sourceMatch(task,p)||!SourceCatalog.loadsAllowed(task,known))continue;
   const content=CompetitionContentContracts.resolve(task),name=p.recipe.familyId;
   let hints=name==='overlapAverages'?['这些平均数分别对应多少个数？怎样知道各组总量？','核对第4个数进入了哪些组，分别算了几次。','比较前组总量、后组总量与全体总量，保留目标一次。']:
    name==='lShapeArea'?(allowed.allowedRouteIds.some(id=>id.endsWith(':complete-remove'))?['先确定阴影所对应的外包区域。','补成正方形后，需要扣除哪一块？']:['把阴影分成不重叠的两条。','分别确认两条的长和宽，并检查交叠处。']):
    ['先检查严格范围与非零个位这两个条件。','选择按个位或十位分组，逐一检验候选，避免重复或遗漏。'];
   const candidate={id:p.examId,kind:'exam',examId:p.examId,mathKey:CompetitionIdentity.key(task),
    originProblemGroupId:p.originProblemGroupId,structureClusterId:p.structureClusterId,
    presentationKind:p.presentationKind,renderingMode:content.givenText?'verified_text_description':'equivalent_translation',
    definition:{taskId:p.examId,prompt:content.promptText,givenText:content.givenText||'',
     answerContract:p.answerContract,options:[],hints,auxiliaryFigure:task.competition.diagram,
     grantsJudgmentEvidence:false},recipe:p.recipe};
   result.push(checked.eligible?{...candidate,renderingMode:checked.record.renderingMode||candidate.renderingMode,definition:ConnectedLearning.definition(candidate,checked.record)}:candidate);
  }
  return result;
 }
 function candidates(mode,p=profile()){
  if(mode!=='training')return originals(p);
  if(!p.sourceIds.includes('AMC8'))return [];
  const selected=p.examIds.length?new Set(p.examIds):null;
  return Object.values(ExamMapping.data.tasks).filter(t=>t.verificationStatus==='PASS'&&
   (!selected||selected.has(t.originProblemGroupId))&&ExamMapping.taskAllowed(t,p).eligible).flatMap(t=>{const checked=ConnectedLearning.review(ExamMapping.getProblem(t.originProblemGroupId));if(childEntryEnabled()&&!checked.eligible)return [];const row=checked.record?.tasks[t.taskId];return [{id:t.taskId,kind:'training',mathKey:ExamMapping.taskKey(t),originProblemGroupId:t.originProblemGroupId,structureClusterId:t.structureClusterId,presentationKind:'synthetic',renderingMode:'authored_training',definition:row?ConnectedLearning.definition({definition:t},row):t}]});
 }
 function stop(){CompetitionSpeech.stop()}
 function start(mode,options={}){
  stop();const old=active();if(options.connectedGroup?.attemptIds.length>=10){message='本组已达到十题，当前尝试已保留。';render();return}
  if(old&&!old.finished&&!options.suspendParent&&!finish(old.feedback?.outcome==='VERIFIED'?'completed':'skipped'))return;
  const current=readState()||TransferEvidenceStore.fresh(),seed=(current.sessions.nextSeed||1),selection=options.candidate?{candidateRef:options.candidate}:TransferPolicy.allocate(candidates(mode),history(),mode==='training'?'practice':mode,seed);
  if(!selection.candidateRef){message='当前范围内没有合格的新题。可以查看历史，或由家长调整已掌握范围。';open('examMapping');return}
  const c=selection.candidateRef,next=JSON.parse(JSON.stringify(current)),attemptId='rtm-'+Date.now()+'-'+Math.random().toString(36).slice(2,10);
  const previous=active();if(previous){next.sessions.archived??=[];next.sessions.archived.push({...previous})}
  if(options.assignment){
   next.assignmentsById??={};
   if(next.assignmentsById[options.assignment.assignmentId]){message='这组训练已经登记，请从当前记录继续。';return}
   next.assignmentsById[options.assignment.assignmentId]=options.assignment;
   next.sessions.pathway={assignmentId:options.assignment.assignmentId,attemptedTaskIds:[],completedTaskIds:[],stage:'training'};
  }
  if(options.connectedGroup){
   if(next.sessions.connected&&next.sessions.connected.groupId!==options.connectedGroup.groupId){next.sessions.connectedArchive??=[];next.sessions.connectedArchive.push(next.sessions.connected)}
   next.sessions.connected=JSON.parse(JSON.stringify(options.connectedGroup));next.sessions.connected.attemptIds.push(attemptId);
  }
  const prior=history(),instance=TransferEvidenceStore.instance(current,c.mathKey);
  const correctedOriginal=c.kind==='exam'&&ExamMapping.getProblem(c.examId)?.sourceCorrection;
  next.sessions.nextSeed=seed+1;next.sessions.active={...c,attemptId,mode,mappingBuildId:ExamMapping.data.mappingBuildId,
   priorExposure:prior.exposedMathKeys.includes(c.mathKey)||!!correctedOriginal&&prior.exposedOriginGroups.includes(c.originProblemGroupId),priorMethodHelp:!!options.diagnosticOf||!!options.readinessSnapshot||instance.methodExposed||legacyHistory().assistedMathKeys.includes(c.mathKey)||!!correctedOriginal&&prior.assistedOriginGroups.includes(c.originProblemGroupId),
   nextSequence:1,submissionOrdinal:0,helpLevel:0,hintsOpen:false,input:'',feedback:null,finished:false,
   assignmentId:options.assignment?.assignmentId||options.assignmentId||null,pathwayStage:options.pathwayStage||null,
   diagnosticOf:options.diagnosticOf||null,connectedGroupId:options.connectedGroup?.groupId||null,connectedStage:options.connectedStage||null,
   readinessSnapshot:options.readinessSnapshot||null,
   profileSnapshot:options.profileSnapshot||options.connectedGroup?.profileSnapshot||profile(),startedAt:Date.now(),shown:true};
  let presented=appendEvent(next,'problem_presented');if(!presented.ok)return;
  if(options.diagnosticOf)presented=appendEvent(presented.state,'method_exposed',{reason:'remediation_support',linkId:options.diagnosticOf.linkId});
  if(!presented.ok||!commit(presented.state))return;
  volatileInput=null;showHistory=false;reviewingAttemptId=null;open('examMapping');
 }
 function ensureShown(){const a=active();if(!a||a.shown||a.mappingBuildId!==ExamMapping.data.mappingBuildId)return;
  event('problem_presented',{},next=>{next.sessions.active.shown=true});
 }
 function finish(reason){
  const a=active();if(!a||a.finished)return true;stop();return event('attempt_finished',{reason},next=>{next.sessions.active.finished=true});
 }
 function input(value){volatileInput=String(value).slice(0,1000);const next=state();if(next?.sessions.active){next.sessions.active.input=volatileInput;commit(next)}}
 function submit(){
  const a=active();if(!a||a.finished||a.mappingBuildId!==ExamMapping.data.mappingBuildId)return;
  if(!requireCurrentScope())return;
  const raw=String(volatileInput!==null?volatileInput:a.input||'').trim();if(!raw){message='先写下你的答案。';render();return}
  if(a.lastSubmittedInput===raw&&a.lastSubmittedHelp===a.helpLevel){message='这次答案已记录，可继续下一题。';render();return}
  let result=JudgmentEvidence.task(a.definition,raw,{methodHelpCount:Math.max(a.helpLevel,a.priorMethodHelp?1:0),evidenceScope:a.diagnosticOf?'remediation_support_only':'local_decision_prompt'});
  if(a.diagnosticOf)result={...result,level:null,evidenceScope:'remediation_support_only',grantsJudgmentEvidence:false};
  const ordinal=a.submissionOrdinal+1;
  if(!event('response_submitted',{input:raw,result,submissionOrdinal:ordinal},next=>{
   const current=next.sessions.active;current.submissionOrdinal=ordinal;current.feedback=result;current.input=raw;current.lastSubmittedInput=raw;current.lastSubmittedHelp=current.helpLevel;
   if(current.diagnosticOf){
    const probe=appendEvent(next,'diagnostic_probe_submitted',{parentAttemptId:current.diagnosticOf.attemptId,judgmentId:current.diagnosticOf.judgmentId,result});
    if(!probe.ok)throw Error(probe.reason);Object.assign(next,probe.state);
   }
  })){render();return}
  message='';render();
 }
 function help(){
  const a=active();if(!a||a.finished)return;
  if(!requireCurrentScope())return;
  let next=state();
  if(a.mode==='exam_holdout'){
   const changed=appendEvent(next,'mode_changed',{fromMode:'exam_holdout',toMode:'practice',reason:'learner_requested_method_help'});
   if(!changed.ok)return;next=changed.state;next.sessions.active.originalMode='exam_holdout';next.sessions.active.mode='practice';next.sessions.active.independentAbandoned=true;
  }
  const item=next.sessions.active;if(item.helpLevel===0)item.helpLevel=1;else if(item.hintsOpen&&item.helpLevel<item.definition.hints.length)item.helpLevel++;
  item.hintsOpen=true;
  const revealed=appendEvent(next,'hint_revealed',{hintId:'h'+item.helpLevel});
  if(revealed.ok)commit(revealed.state);render();
 }
 function read(hint=false){
  const a=active();if(!a)return;
  if(hint&&!requireCurrentScope())return;
  const tableText=(a.definition.givenTable||[]).map((row,i)=>'数据表第'+(i+1)+'行：'+row.join('，')).join('；');
  const text=hint?a.hintsOpen&&a.definition.hints[a.helpLevel-1]:a.definition.prompt+' '+(a.definition.givenText||'')+(tableText?' '+tableText:'');if(!text)return;
  if(!event(hint?'hint_read_requested':'statement_read_requested',{hintId:hint?'h'+a.helpLevel:null},next=>{if(!hint)next.sessions.active.statementRead=true}))return;
  if(!CompetitionSpeech.speak({text,scope:'rtm',attemptId:a.attemptId})){message='当前浏览器暂不能出声，文字仍可阅读。';render()}
 }
 function feedbackText(r){return r?.outcome==='VERIFIED'?'本题答案正确。'+(r.level==='E2'?'已记录这次局部判断证据。':r.level==='E1'?'这次完成使用过提示。':'终答已记录，具体判断过程尚未核验。'):r?.outcome==='INCORRECT'?'答案还未通过，可以保留草稿继续想。':r?'输入已保留，过程暂未自动核验。':''}
 function connectedStatus(){
  const g=readState()?.sessions.connected;
  if(!enabled()||g?.schemaVersion!==1||typeof g.groupId!=='string'||typeof g.mappingBuildId!=='string'||g.total!==10||!Array.isArray(g.attemptIds)||g.attemptIds.length>10||new Set(g.attemptIds).size!==g.attemptIds.length||!g.attemptIds.every(id=>typeof id==='string')||!Array.isArray(g.deferredExamIds)||g.deferredTargets!==undefined&&!Array.isArray(g.deferredTargets)||!['active','completed','exhausted'].includes(g.status)||!g.profileSnapshot)return null;
  const p=SourceCatalog.profile(g.profileSnapshot);return ExamMapping.canonical(p)===ExamMapping.canonical(g.profileSnapshot)?JSON.parse(JSON.stringify(g)):null;
 }
 function connectedPlans(p=profile()){return ChildReviewStatus.withReviewSnapshot(()=>ConnectedLearning.plans(originals(p),candidates('training',p),p,history(),readState()))}
 function connectedAvailability(p=profile()){return childEntryEnabled()?connectedPlans(p).length:0}
 function launchConnected(savedGroup,preparedPlans=null){
  const group=JSON.parse(JSON.stringify(savedGroup));
  if(group.mappingBuildId!==ExamMapping.data.mappingBuildId){message='这组草稿已保留，内容更新后请从新一组继续。';open('examMapping');return}
  if(group.attemptIds.length>=group.total){
   const next=state();next.sessions.connected={...group,status:'completed',finishedAt:Date.now()};if(commit(next)){PeriodicPracticeUI.finishBiweekly(group.periodic,group.attemptIds.length);open('examMapping');}return;
  }
  const p=profile(),plans=preparedPlans||connectedPlans(p),step=ConnectedLearning.nextFromPlans(group.periodic?.newOnly?PeriodicPractice.unseenPlans(plans,history()):plans,group);
  if(!step.candidate){
   const next=state();next.sessions.connected={...group,status:'exhausted',finishedAt:Date.now()};if(commit(next)){PeriodicPracticeUI.finishBiweekly(group.periodic,group.attemptIds.length);open('examMapping');}return;
  }
  group.target=step.target;
  start(step.mode,{candidate:step.candidate,profileSnapshot:p,connectedGroup:group,connectedStage:step.stage,readinessSnapshot:step.readiness});
 }
 function beginConnected(p=profile(),options={}){
  if(!childEntryEnabled())return false;const basePlans=connectedPlans(p),plans=options.periodic?.newOnly?PeriodicPractice.unseenPlans(basePlans,history()):basePlans;if(!plans.length)return false;
  if(restored().readOnly){message='这份记录暂时只读，请先导出保留。';open('examMapping');return true}
  const group=ConnectedLearning.freshGroup(p,readState()?.sessions.nextSeed||1);if(options.periodic)group.periodic=JSON.parse(JSON.stringify(options.periodic));launchConnected(group,plans);return true;
 }
 function resumeConnected(){
  const group=connectedStatus();if(!group||group.status!=='active')return;
  const a=active();if(a&&!a.finished&&a.connectedGroupId===group.groupId){showHistory=false;reviewingAttemptId=null;volatileInput=null;open('examMapping');return}
  launchConnected(group);
 }
 function nextConnected(){
  const a=active(),group=connectedStatus();if(!a?.connectedGroupId||a.connectedGroupId!==group?.groupId)return false;
  if(!finish(a.feedback?.outcome==='VERIFIED'?'completed':'skipped'))return true;
  const next=state(),g=next.sessions.connected;
  if(a.feedback?.outcome!=='VERIFIED'){
   ConnectedLearning.defer(g,a,'LEARNER_DEFERRED');
  }else if(a.connectedStage==='application'){g.lastStructure=a.structureClusterId;g.target=null}
  if(g.attemptIds.length>=g.total&&g.target)ConnectedLearning.defer(g,a,'GROUP_LIMIT');
  if(commit(next))launchConnected(g);return true;
 }
 function retryDeferred(id){
  const group=connectedStatus();if(!group||group.status==='active')return;
  const descriptor=group.deferredTargets?.find(d=>d.deferredId===id);if(!descriptor)return;
  const p=profile(),checked=ConnectedLearning.deferredPlan(descriptor,originals(p),candidates('training',p),p,history(),readState());
  if(!checked.plan){message='这项保留任务目前不满足知识、来源、题号、负担或内容审核要求；原记录已保留。';render();return}
  const next=ConnectedLearning.freshGroup(p,readState().sessions.nextSeed||1);
  next.target=JSON.parse(JSON.stringify(descriptor.target));next.retryTarget=JSON.parse(JSON.stringify(descriptor.target));next.retryOf=descriptor.deferredId;
  launchConnected(next);
 }
 function connectedSummary(){
  const g=connectedStatus(),s=readState(),sessions=[...(s.sessions.archived||[]),...(s.sessions.active?[s.sessions.active]:[])].filter(a=>g.attemptIds.includes(a.attemptId));
  const completed=sessions.filter(a=>a.feedback?.outcome==='VERIFIED').length,applications=sessions.filter(a=>a.connectedStage==='application');
  return `<section class="panel completed" data-connected-summary><h1>${g.status==='completed'?'这组练习完成了':'这组先做到这里'}</h1>${g.periodic?.kind==='biweekly'?'<p data-periodic-shortage>双周新题：本次安排 '+g.attemptIds.length+'/10 道。'+(g.attemptIds.length<10?'当前已掌握范围内可继续衔接的合格新实例不足十题；不复用已做题，也不加入未学题。':'')+'</p>':''}<p>完成 ${completed} 道，保留了 ${sessions.length-completed} 道尝试；其中遇到了 ${applications.length} 道真题。</p><p>相关练习后的真题按应用练习记录，首次作答和提示使用分别保留。</p><p role="status">${esc(message)}</p>${(g.deferredTargets||[]).map((d,i)=>'<button class="secondary" data-action="rtmConnectedRetry" data-id="'+esc(d.deferredId)+'">继续第'+(i+1)+'个保留任务</button>').join('')}${g.status==='exhausted'?'<p>当前范围暂时没有更多通过题目形式检查的新题，可以回到首页继续其他练习。</p>':''}<button class="primary" data-action="rtmConnectedNew">再来一组</button><button class="secondary" data-action="rtmBack">回到首页</button><details><summary>家长查看</summary><p>本组保留开始时的声明快照；继续与后续供题会重新检查首页当前知识、来源及负担设置。只核验了作答结果，没有自动认定知识已掌握。</p><button class="secondary" data-action="rtmHistory">查看作答记录</button></details></section>`;
 }
 function beginPathway(){
  const current=readState();if(!current){message='这份记录暂时只读，原始内容仍可导出。';render();return}const prepared=TransferPolicy.preparePathway(originals(),candidates('training'),history(),current.sessions.nextSeed||1);
  if(!prepared.plan){message='当前范围内还没有配齐未见真题的训练组。可以先练关键判断，或由家长查看供应。';render();return}
  const plan={...prepared.plan,assignmentId:'path-'+Date.now()+'-'+Math.random().toString(36).slice(2,10),assignedAt:Date.now(),profileSnapshot:profile()};
  const candidate=candidates('training').find(t=>t.id===plan.taskIds[0]);
  start('training',{candidate,assignment:plan,pathwayStage:'training'});
 }
 function nextInPathway(){
  const a=active(),s=readState(),progress=s?.sessions.pathway,plan=s?.assignmentsById?.[a?.assignmentId];
  if(!a||!progress||!plan||plan.assignmentId!==progress.assignmentId)return false;
  if(!finish(a.feedback?.outcome==='VERIFIED'?'completed':'skipped'))return true;
  const next=state(),p=next.sessions.pathway;
  if(a.pathwayStage==='training'){
   p.attemptedTaskIds=[...new Set([...p.attemptedTaskIds,a.id])];
   if(a.feedback?.outcome==='VERIFIED')p.completedTaskIds=[...new Set([...p.completedTaskIds,a.id])];
   const available=candidates('training').filter(t=>plan.taskIds.includes(t.id)&&!p.attemptedTaskIds.includes(t.id)&&TransferPolicy.check(t,history()).eligible);
   const candidate=plan.taskIds.map(id=>available.find(t=>t.id===id)).find(Boolean);
   if(candidate){if(commit(next))start('training',{candidate,assignmentId:plan.assignmentId,pathwayStage:'training'});return true}
   const target=TransferPolicy.reservedTarget(plan,originals(),history());
   if(target.candidateRef){p.stage='holdout';if(commit(next))start('exam_holdout',{candidate:target.candidateRef,assignmentId:plan.assignmentId,pathwayStage:'holdout'});return true}
   p.stage='blocked';p.reasonCodes=target.reasonCodes;
   if(commit(next)){message='相关练习已保留；预留真题已经见过或不在当前知识范围，暂不能计作未见检验。';render()}
   return true;
  }
  p.stage='completed';p.finishedAt=Date.now();
  if(commit(next)){message='这一组尝试已保存。训练表现与新真题的首次作答分别记录。';render()}
  return true;
 }
 function diagnosticPlan(a){
  if(!a||a.diagnosticOf||a.finished||a.feedback?.outcome!=='INCORRECT')return null;
  const group=connectedStatus();if(a.connectedGroupId&&!a.monthlyReturn&&(!group||a.connectedGroupId!==group.groupId||group.attemptIds.length>=group.total))return null;
  const known=profile(),p=ExamMapping.getProblem(a.examId||a.originProblemGroupId),allowed=ExamMapping.check(p,known,history()).allowedRouteIds;
  return ExamDiagnostics.choose(a,candidates('training',known),allowed,history());
 }
 function diagnostic(){
  const a=active(),plan=diagnosticPlan(a);if(!plan){message='当前没有已复核且可用的相关短题，已保留这次尝试。';render();return}
  const {link,candidate}=plan,known=profile();let next=state();
  if(a.mode==='exam_holdout'){
   const changed=appendEvent(next,'mode_changed',{fromMode:'exam_holdout',toMode:'practice',reason:'learner_requested_diagnostic'});
   if(!changed.ok)return;next=changed.state;next.sessions.active.mode='practice';next.sessions.active.originalMode='exam_holdout';next.sessions.active.independentAbandoned=true;
  }
  next.sessions.active.priorMethodHelp=true;
  const helped=appendEvent(next,'method_exposed',{reason:'related_probe_opened',judgmentId:link.judgmentId,linkId:link.linkId});
  if(helped.ok&&commit(helped.state))start('training',{candidate,suspendParent:true,profileSnapshot:known,connectedGroup:a.connectedGroupId&&!a.monthlyReturn?connectedStatus():null,connectedStage:'remediation',diagnosticOf:{attemptId:a.attemptId,mathKey:a.mathKey,judgmentId:link.judgmentId,linkId:link.linkId,scope:link.scope}});
 }
 function returnFromDiagnostic(){
  const a=active();if(!a?.diagnosticOf)return;
  if(!finish(a.feedback?.outcome==='VERIFIED'?'completed':'skipped'))return;
  const next=state(),archived=next.sessions.archived||[],at=archived.findIndex(s=>s.attemptId===a.diagnosticOf.attemptId);
  if(at<0){message='原尝试保留在历史记录中。';render();return}
  const parent=archived.splice(at,1)[0];archived.push({...next.sessions.active});parent.finished=false;parent.priorMethodHelp=true;next.sessions.active=parent;
  if(commit(next)){volatileInput=null;showHistory=false;open('examMapping')}
 }
 function resumeMonthly(attemptId){
  const target=PeriodicPracticeUI.monthlyPlan().targets.find(t=>t.parent.attemptId===attemptId&&t.confirmation);
  if(!target||restored().readOnly||!currentScopeAllowed(target.parent)||target.parent.mappingBuildId!==ExamMapping.data.mappingBuildId||ExamMapping.canonical(ExamDiagnostics.presentation(target.parent.definition))!==ExamMapping.canonical(target.link.snapshot.parentPresentation))return false;
  const candidate=candidates('training',profile()).find(c=>c.id===target.link.probeTaskId);if(!candidate)return false;
  const next=state(),old=next.sessions.active,archived=next.sessions.archived||[];
  // Resume the current reviewed support task without replacing its draft or first response.
  if(old&&!old.finished&&old.kind==='training'&&old.id===candidate.id&&old.mathKey===candidate.mathKey&&
   old.mappingBuildId===ExamMapping.data.mappingBuildId&&old.diagnosticOf?.attemptId===attemptId&&
   old.diagnosticOf.linkId===target.link.linkId&&currentScopeAllowed(old)&&
   ExamMapping.canonical(ExamDiagnostics.presentation(old.definition))===ExamMapping.canonical(ExamDiagnostics.presentation(candidate.definition))){
   volatileInput=null;showHistory=false;reviewingAttemptId=null;message='';open('examMapping');return true;
  }
  next.sessions.archived=archived.filter(a=>a.attemptId!==attemptId);
  if(old&&old.attemptId!==attemptId&&!next.sessions.archived.some(a=>a.attemptId===old.attemptId))next.sessions.archived.push(old);
  next.sessions.active={...JSON.parse(JSON.stringify(target.parent)),finished:false,monthlyReturn:true,priorMethodHelp:true};
  const helped=appendEvent(next,'method_exposed',{reason:'monthly_related_task',linkId:target.link.linkId});
  if(!helped.ok||!commit(helped.state))return false;
  volatileInput=null;showHistory=false;reviewingAttemptId=null;
  // The related task is support only. It cannot create independent evidence.
  start('training',{candidate,suspendParent:true,profileSnapshot:profile(),connectedStage:'remediation',diagnosticOf:{attemptId,mathKey:target.parent.mathKey,judgmentId:target.link.judgmentId,linkId:target.link.linkId,scope:target.link.scope}});
  return active()?.diagnosticOf?.attemptId===attemptId;
 }
 function dashboard(){
  const rows=JointReuseReview.projection(),count=level=>rows.filter(r=>r.status==='REVIEWED'&&r.matchLevel===level).length;
  const oldRecords=[...(saved.attempts||[]),...Object.values(saved.jointProgress||{}).flatMap(g=>g.records||[])],references=JointReuseReview.readLegacy(oldRecords);
  return supplyDashboard()+`<details class="panel"><summary>家长：旧练习与真题的对应</summary><p>旧练习共 ${rows.length} 组，其中 ${count('FOUNDATION_ONLY')} 组已复核为基础支持，${count('PARTIAL_DECISION')} 组有指定局部关系的对应，${rows.filter(r=>r.status!=='REVIEWED').length} 组等待复核。</p><p>当前历史中有 ${references.length} 条可供参考的局部准备记录。真题应用仍保留当前训练、首次作答与提示使用记录。</p><p>局部对应包括：两份覆盖相加后扣除多算的一次，以及长度按放大倍数变化。几何定位、完整解法和未见题检验需分别作答。</p></details>`;
 }
 function supplyDashboard(){
  const s=readState(),stat=TransferEvidenceStore.statistics(s),c=ExamMapping.data.coverage,childCoverage=ConnectedLearning.coverage();
  return `<section class="panel"><div class="page-head"><h1>家长：真题供应与记录复核</h1><button class="secondary" data-action="home">回到主题选择</button></div><p>孩子从首页“开始做题”进入，真题会在相关练习完成后自然出现。这里用于家长检查供应、呈现与历史记录。</p><div class="stage-buttons"><button class="primary" data-action="rtmPathway">复核跨题训练链</button><button class="secondary" data-action="rtmStart" data-mode="practice">复核单题呈现</button><button class="secondary" data-action="rtmStart" data-mode="training">复核准备任务</button><button class="secondary" data-action="rtmStart" data-mode="exam_holdout">复核未见题分配</button></div><p role="status">${esc(message)}</p><details><summary>家长查看供应与记录</summary><p>映射已核验题中，自动衔接入口题目形式已审通过 ${childCoverage.reviewed} 题，已审受限 ${childCoverage.restricted} 题，待审 ${childCoverage.pending} 题，内容变更需复审 ${childCoverage.stale} 题。另有 ${c.mappingPending} 题待编写映射。</p><p>登记${c.fixed}题：已取得来源资料${c.sourceRetrieved}题，映射已核验${c.mappingVerified}题，待映射${c.mappingPending}题。完整训练链${c.fullChain}题，数学与政策候选${c.runtimeEligible}题，知识限制${c.policyBlocked}题。映射数量与儿童题目形式审核分别统计。</p><p>本入口展示${stat.shown}次，首答提交${stat.submitted}次，无方法提示首答正确${stat.firstUnassistedCorrect}次，跳过${stat.skipped}次，进行中${stat.inProgress}次。</p><p>未见真题检验首次提交${stat.holdoutSubmitted}次，无方法提示首答正确${stat.holdoutFirstUnassistedCorrect}次，主动求助转练习${stat.holdoutHelpConversions}次。</p><p>本次记录来自当前设备。题干朗读与方法提示分别保存；当前尚未测得真实学习效果。</p><button class="secondary" data-action="progressExport">导出完整记录</button></details><button class="secondary" data-action="rtmHistory">历史记录</button></section>`;
 }
 function historyPage(){
  const s=readState(),selected=[...(s?.sessions.archived||[]),...(s?.sessions.active?[s.sessions.active]:[])].find(a=>a.attemptId===reviewingAttemptId);
  return (selected&&TransferEvidenceStore.supersededOriginal(selected)?'<aside class="panel" role="note"><p>这次尝试使用来源纠错前的题目版本。原内容和原结果保留为历史，当前版本的正确记录另行核验。</p></aside>':'')+historyPageBody();
 }
 function historyPageBody(){
  const s=readState(),sessions=[...(s?.sessions.archived||[]),...(s?.sessions.active?[s.sessions.active]:[])];
  const selected=sessions.find(a=>a.attemptId===reviewingAttemptId);
  if(selected){const first=TransferEvidenceStore.attempt(s,selected.attemptId).firstSubmission;return `<section class="panel rtm-record" data-rtm-history><h1>回看以前的尝试</h1><p>${esc(selected.definition.prompt)}</p>${selected.definition.givenText?'<p>'+esc(selected.definition.givenText)+'</p>':''}${statementFigures(selected)}${statementTable(selected)}${(selected.definition.options||[]).length?'<ul>'+selected.definition.options.map(o=>'<li>'+esc(o.id)+'：'+esc(o.text)+'</li>').join('')+'</ul>':''}<p>本次尝试首次提交：${esc(first?.input||'尚未提交')}</p><p>当前草稿：${esc(selected.input||'空')}</p><p>提示使用：${selected.helpLevel}级</p><p>这里只读回看，保留原首答与曝光记录。</p><button class="secondary" data-action="rtmHistory">返回历史列表</button><button class="secondary" data-action="progressExport">导出完整记录</button></section>`}
  return `<section class="panel" data-rtm-history><h1>以前的尝试</h1>${sessions.length?'<div class="stage-buttons">'+sessions.slice().reverse().map(a=>'<button class="secondary" data-action="rtmReview" data-id="'+esc(a.attemptId)+'">'+esc(a.examId||'运用练习')+' · '+esc(a.definition.prompt.slice(0,45))+'</button>').join('')+'</div>':'<p>还没有记录。</p>'}<button class="secondary" data-action="rtmReturn">返回当前练习</button></section>`;
 }
 function figure(a){
  const f=a.definition.auxiliaryFigure;if(!f||!a.hintsOpen||!a.helpLevel)return '';
  if(f.kind==='groups')return `<figure data-rtm-help-figure><figcaption>按顺序核对两组成员</figcaption><p>${Array.from({length:f.n},(_,i)=>i+1).join('　')}</p><p>甲组：${f.groups[0].join('、')}；乙组：${f.groups[1].join('、')}</p></figure>`;
  if(f.kind==='lshape')return `<figure data-rtm-help-figure><figcaption>外包${f.outer}，去掉${f.inner}；核对重叠处</figcaption><svg viewBox="0 0 180 180" width="180" role="img" aria-label="L形辅助分割图"><path d="M20 20 H80 V100 H160 V160 H20 Z" fill="#a8d7bc" stroke="#346d54" stroke-width="2"/></svg></figure>`;
  return '<div data-rtm-help-figure>'+competitionDiagram(f)+'</div>';
 }
 function statementFigures(a){
  return (a.definition.givenFigures||[]).map((f,i)=>{
   const src=window.__AMC8_SOURCE_FIGURES?.[f.sha256];
   if(!src||!/^data:image\/png;base64,[A-Za-z0-9+/=]+$/.test(src))return '';
   return `<figure class="rtm-given-figure" data-rtm-given-figure><img src="${src}" alt="题目原有图示 ${i+1}"/><figcaption>题目图示 ${i+1}</figcaption><details data-rtm-figure-zoom><summary>放大查看图示 ${i+1}</summary><div tabindex="0" role="region" aria-label="放大的题目图示 ${i+1}，可横向滚动" style="overflow:auto;max-height:75vh;border:1px solid currentColor;padding:8px"><img src="${src}" alt="放大的题目原有图示 ${i+1}" style="width:auto;min-width:100%;max-width:none;height:auto"/></div></details></figure>`;
  }).join('');
 }
 function statementTable(a){
  const table=a.definition.givenTable;
  if(!table?.length)return '';
  return '<div class="rtm-given-table" data-rtm-given-table><table aria-label="题目数据表"><tbody>'+table.map(row=>'<tr>'+row.map(value=>'<td>'+esc(value)+'</td>').join('')+'</tr>').join('')+'</tbody></table></div>';
 }
 function page(){
  if(!enabled())return '<section class="panel"><p>这项练习暂未开放。</p><button class="secondary" data-action="home">返回</button></section>';
  if(showHistory)return historyPage();
  const r=restored();if(r.readOnly)return dashboard()+'<p role="alert">这份新格式记录暂时只读，原始内容保留在完整导出中。</p>';
  const a=active(),group=connectedStatus();if(group&&group.status!=='active'&&(!a||a.finished&&a.connectedGroupId===group.groupId))return connectedSummary();
  if(a?.connectedGroupId&&(!group||a.connectedGroupId!==group.groupId))return dashboard()+'<p>这组资料不完整，原草稿仍可导出，请从首页开始新一组。</p>';
  if(!a||a.finished)return dashboard();
  if(a.mappingBuildId!==ExamMapping.data.mappingBuildId)return dashboard()+'<p>旧草稿已保留，当前内容版本发生变化，请从新题继续。</p><button class="secondary" data-action="rtmArchive">保留旧草稿并继续</button>';
  if(!currentScopeAllowed(a))return `<section class="panel" data-rtm-scope-paused><h1>这道保留题已暂停</h1><p>当前知识、来源、负担或题目审核范围不满足继续条件。原首答、提示和草稿都保留，可以由家长调整范围，或只读回看原记录。</p><button class="secondary" data-action="rtmBack">返回首页</button><button class="secondary" data-action="rtmHistory">只读回看历史</button><button class="secondary" data-action="progressExport">导出完整记录与草稿</button></section>`;
  const def=a.definition,answer=def.answerContract,readonly=a.mode==='history_review';
  return `<section class="panel rtm-task" data-rtm-task="${esc(a.id)}">
   <div class="page-head"><p>${a.connectedGroupId?`本组已练 ${group.attemptIds.length}/${group.total} 题 · ${a.kind==='exam'?'把知识用起来 · AMC8真题':'一起想一想'}`:a.kind==='exam'?'AMC8真题 · '+esc(a.examId):'综合运用练习'}</p><button class="secondary" data-action="rtmBack">返回首页</button>${a.connectedGroupId?'':'<button class="secondary" data-action="rtmModes">换练习类型</button><button class="secondary" data-action="rtmHistory">历史记录</button>'}</div>
   <h1 class="task-title">${esc(def.prompt)}</h1>${def.givenText?'<p data-rtm-givens>'+esc(def.givenText)+'</p>':''}${statementFigures(a)}${statementTable(a)}<button class="secondary" data-action="rtmRead">🔊 朗读题目</button><button class="secondary" data-action="rtmStop">停止朗读</button>
   <section class="competition-hints"><button class="secondary" data-action="rtmHint" aria-expanded="${a.hintsOpen}">${a.helpLevel?'查看提示':'提示'}</button>${a.hintsOpen?`<div>${def.hints.slice(0,a.helpLevel).map(h=>'<p>'+esc(h)+'</p>').join('')}<button class="secondary" data-action="rtmReadHint">🔊 朗读提示</button><button class="secondary" data-action="rtmStop">停止朗读</button>${a.helpLevel<def.hints.length?'<button class="secondary" data-action="rtmHint">下一条提示</button>':''}<button class="secondary" data-action="rtmCloseHint">收起提示</button>${figure(a)}</div>`:''}</section>
   <form data-rtm-form>${answer.kind==='choice'?`<div class="choices">${def.options.map(o=>`<button type="button" class="${a.input===o.id?'primary':'secondary'}" data-action="rtmChoice" data-value="${esc(o.id)}" aria-pressed="${a.input===o.id}">${esc(o.text)}</button>`).join('')}</div>`:`<label>你的答案<input data-rtm-input="answer" inputmode="${a.connectedGroupId?'text':answer.kind==='rational'?'decimal':'text'}" maxlength="1000" value="${esc(volatileInput!==null?volatileInput:a.input||'')}" aria-label="你的答案"></label>`}<button type="submit" class="primary" data-action="rtmSubmit">提交答案</button></form>
   <p role="status" data-rtm-feedback>${esc(message||(a.diagnosticOf?(a.feedback?.outcome==='VERIFIED'?'短题完成了，回到刚才那题再试一试。':a.feedback?'还可以继续想一想，也可以回到刚才那题。':''):a.connectedGroupId?(a.feedback?.outcome==='VERIFIED'?'答对了，可以继续。':a.feedback?'还可以继续想一想；也可以查看提示。':''):feedbackText(a.feedback)))}</p>
   ${diagnosticPlan(a)?'<p>可以先试一道相关短题，再回到这里继续。</p><button class="secondary" data-action="rtmDiagnostic">试一道相关短题</button>':''}${a.diagnosticOf?'<button class="secondary" data-action="rtmReturnParent">回到刚才那题</button>':''}
   <div class="stage-buttons"><button class="secondary" data-action="rtmNext">${a.diagnosticOf?'回到刚才那题':a.feedback?.outcome==='VERIFIED'?'下一题':'保留当前尝试，换一道新题'}</button></div>${a.feedback?'<p class="tiny-note">首次作答已保留，后续修改另外记录。</p>':''}</section>`;
 }
 function handle(action,data){
  if(!action.startsWith('rtm'))return false;
  if(!enabled())return true;
  if(['rtmChoice','rtmDiagnostic'].includes(action)&&!requireCurrentScope())return true;
  if(action==='rtmOpen'){message='';showHistory=false;reviewingAttemptId=null;open('examMapping')}
  if(action==='rtmStart')start(['training','practice','exam_holdout'].includes(data.mode)?data.mode:'practice');
  if(action==='rtmPathway')beginPathway();
  if(action==='rtmDiagnostic')diagnostic();
  if(action==='rtmReturnParent')returnFromDiagnostic();
  if(action==='rtmSubmit')submit();
  if(action==='rtmChoice'){input(data.value);render()}
  if(action==='rtmHint')help();
  if(action==='rtmCloseHint'){stop();const next=state();if(next?.sessions.active){next.sessions.active.hintsOpen=false;commit(next);render()}}
  if(action==='rtmRead')read();if(action==='rtmReadHint')read(true);if(action==='rtmStop')stop();
  if(action==='rtmConnectedResume')resumeConnected();
  if(action==='rtmConnectedRetry')retryDeferred(data.id);
  if(action==='rtmConnectedNew'){if(!beginConnected(profile()))open('home')}
  if(action==='rtmNext'){if(active()?.monthlyReturn&&!active()?.diagnosticOf){const parent=active();if(finish(parent.feedback?.outcome==='VERIFIED'?'completed':'skipped')){PeriodicPracticeUI.returned(parent);open('periodicReview')}return true;}if(active()?.diagnosticOf)returnFromDiagnostic();else if(!nextConnected()&&!nextInPathway()){const a=active(),mode=a?.mode||'practice';if(finish(a?.feedback?.outcome==='VERIFIED'?'completed':'skipped'))start(mode)}}
  if(action==='rtmBack'){stop();open('home')}
  if(action==='rtmModes'){if(finish(active()?.feedback?.outcome==='VERIFIED'?'completed':'skipped'))render()}
  if(action==='rtmArchive'){const next=state();if(next?.sessions.active){next.sessions.active.finished=true;commit(next);render()}}
  if(action==='rtmHistory'){showHistory=true;reviewingAttemptId=null;render()}
  if(action==='rtmReview'){showHistory=true;reviewingAttemptId=data.id;render()}
  if(action==='rtmReturn'){showHistory=false;reviewingAttemptId=null;render()}
  return true;
 }
 function afterRender(){if(view==='examMapping'&&typeof document.querySelector==='function'&&document.querySelector('[data-rtm-task]'))ensureShown()}
 document.addEventListener('input',e=>{if(e.target.dataset?.rtmInput)input(e.target.value)});
 document.addEventListener('submit',e=>{if(e.target.matches('[data-rtm-form]')){e.preventDefault();submit()}});
 function exportDraft(){return {mappingBuildId:ExamMapping.data.mappingBuildId,record:saved.rtm1??null,activeInput:volatileInput!==null?volatileInput:active()?.input||'',readOnly:restored().readOnly}}
 return {page,handle,afterRender,stop,history,exportDraft,enabled,childEntryEnabled,beginConnected,connectedStatus,connectedAvailability,resumeMonthly};
})();
