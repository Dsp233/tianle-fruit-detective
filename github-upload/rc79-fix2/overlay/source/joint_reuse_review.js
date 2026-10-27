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
