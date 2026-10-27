'use strict';
const TransferPolicy=((Mapping)=>{
 function check(candidate,history={},mode='practice'){
  const reasons=[],key=Mapping.resolveMathKey(candidate.mathKey),solved=new Set((history.solvedMathKeys||[]).map(Mapping.resolveMathKey)),seen=new Set((history.exposedMathKeys||[]).map(Mapping.resolveMathKey)),origins=new Set(history.exposedOriginGroups||[]);
  if(mode==='history_review')return {eligible:true,reasonCodes:[]};
  if(solved.has(key))reasons.push('ALREADY_SOLVED');
  if(mode==='exam_holdout'){
   if(!['original','equivalent_translation'].includes(candidate.presentationKind))reasons.push('NOT_VERIFIED_ORIGINAL');
   if(history.historyUnknown)reasons.push('HISTORY_UNKNOWN');
   if(seen.has(key)||origins.has(candidate.originProblemGroupId))reasons.push('HOLDOUT_CONTAMINATED');
  }
  if(mode==='transfer'&&seen.has(key))reasons.push('INSTANCE_ALREADY_SEEN');
  return {eligible:reasons.length===0,reasonCodes:reasons};
 }
 function allocate(candidates,history,mode='practice',seed=1){
  const eligible=[],rejected=[];
  for(const c of candidates){const result=check(c,history,mode);(result.eligible?eligible:rejected).push(result.eligible?c:{id:c.id,reasons:result.reasonCodes})}
  if(!eligible.length)return {candidateRef:null,reasonCodes:['NO_ELIGIBLE_SUPPLY'],rejected};
  const selected=eligible[(Math.abs(Number(seed)||1)-1)%eligible.length];
  return {candidateRef:selected,reasonCodes:[],rejected,eligibleCount:eligible.length};
 }
 function preparePathway(originals,training,history,seed=1){
  const originalById=new Map(originals.map(p=>[p.examId,p]));
  const trainingById=new Map(training.map(t=>[t.id,t]));
  const plans=[];
  for(const set of Object.values(Mapping.data.transferSets)){
   const available=set.trainingTaskIds.map(id=>trainingById.get(id)).filter(t=>t&&check(t,history,'practice').eligible);
   if(!available.length)continue;
   const order={decision:0,contrast:1,representation_transfer:2,integration:3,delayed_check:4};
   available.sort((a,b)=>(order[a.definition.role]??9)-(order[b.definition.role]??9)||a.id.localeCompare(b.id));
   const targets=set.holdoutExamIds.map(id=>originalById.get(id)).filter(p=>p&&check(p,history,'exam_holdout').eligible);
   for(const target of targets)plans.push({transferSetId:set.transferSetId,trainingExamId:set.examId,
    structureClusterId:set.structureClusterId,taskIds:available.map(t=>t.id),holdoutExamId:target.examId,
    holdoutMathKey:target.mathKey,holdoutOriginProblemGroupId:target.originProblemGroupId,
    assignmentVersion:1,mappingBuildId:Mapping.data.mappingBuildId});
  }
  if(!plans.length)return {plan:null,reasonCodes:['NO_MATCHED_UNSEEN_HOLDOUT']};
  return {plan:plans[(Math.abs(Number(seed)||1)-1)%plans.length],reasonCodes:[]};
 }
 function reservedTarget(plan,originals,history){
  if(!plan||!Mapping.compatibleBuild(plan.mappingBuildId))return {candidateRef:null,reasonCodes:['ASSIGNMENT_REVISION_CHANGED']};
  const target=originals.find(p=>p.examId===plan.holdoutExamId&&p.mathKey===plan.holdoutMathKey);
  if(!target)return {candidateRef:null,reasonCodes:['RESERVED_HOLDOUT_OUTSIDE_CURRENT_SCOPE']};
  const status=check(target,history,'exam_holdout');
  return {candidateRef:status.eligible?target:null,reasonCodes:status.reasonCodes};
 }
 function delayStatus(from,to,days){return !Number.isFinite(from)||!Number.isFinite(to)||from<=0||to<from?'unknown':to-from>=days*86400000?'due':'not_due'}
 return {check,allocate,preparePathway,reservedTarget,delayStatus};
})(typeof module!=='undefined'?require('./exam_mapping'):ExamMapping);
if(typeof module!=='undefined')module.exports=TransferPolicy;
