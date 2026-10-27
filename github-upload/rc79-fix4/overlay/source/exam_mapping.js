'use strict';
const ExamMapping=((data,skillData,P)=>{
 const skills=new Map(skillData.skills.map(s=>[s.id,s]));
 const canonical=value=>value===null||typeof value!=='object'?JSON.stringify(value):Array.isArray(value)?'['+value.map(canonical).join(',')+']':'{'+Object.keys(value).sort().map(k=>JSON.stringify(k)+':'+canonical(value[k])).join(',')+'}';
 function compatibleBuild(id){const release=typeof module!=='undefined'?require('./version.json'):window.__AMC8_RELEASE;return typeof id==='string'&&(id===data.mappingBuildId||Array.isArray(release?.compatibleMappingBuildIds)&&release.compatibleMappingBuildIds.includes(id));}
 function closure(ids){const result=new Set();function add(id){if(result.has(id))return;if(!skills.has(id))throw Error('UNKNOWN_SKILL:'+id);result.add(id);skills.get(id).prerequisiteIds.forEach(add)}ids.forEach(add);return [...result].sort()}
 function getProblem(id,revision){const p=data.problems[id];return p&&(revision===undefined||p.mappingRevision===revision)?p:null}
 function routes(id){return (getProblem(id)?.routeIds||[]).map(id=>data.routes[id]).filter(Boolean)}
 const mathAliases=new Map();
 for(const group of data.mathAliases||[]){const key='rtm:'+canonical(group.coreMathFacts);for(const member of group.members)mathAliases.set('rtm:'+canonical(member.mathFactsSnapshot),key)}
 function resolveMathKey(key){return mathAliases.get(key)||key}
 function taskKey(task){return resolveMathKey('rtm:'+canonical(task.mathFacts))}
 function problemKey(problem){if(!problem?.mathFacts?.goal)throw Error('SEMANTIC_MATH_IDENTITY_REQUIRED');return taskKey(problem)}
 function taskAllowed(task,profile={}){
  const declared=new Set(profile.declaredSkillIds||[]),required=closure(task.requiredKnowledge||[]),missing=required.filter(id=>!declared.has(id));
  const allowed=!task.policyGaps?.length&&!missing.length&&(!profile.maxCalculationLoad||task.load.calculation<=profile.maxCalculationLoad)&&(!profile.maxReadingLoad||task.load.reading<=profile.maxReadingLoad);
  return {eligible:allowed,missingSkillIds:missing,reasonCodes:task.policyGaps?.length?['POLICY_KNOWLEDGE_GAP']:missing.length?['MISSING_KNOWLEDGE']:allowed?[]:['LOAD_LIMIT']};
 }
 function check(p,profile={},history={},mode='practice'){
  const errors=[],declared=new Set(profile.declaredSkillIds||[]);
  if(!p||p.status?.verificationStatus!=='PASS')return {eligible:false,allowedRouteIds:[],reasonCodes:['UNVERIFIED_MAPPING']};
  const allowed=routes(p.examId).filter(r=>!r.policyGaps?.length&&r.requiredSkills.every(id=>declared.has(id)));
  if(!allowed.length)errors.push(p.policyGaps?.length?'POLICY_KNOWLEDGE_GAP':'NO_COMPLETE_ALLOWED_ROUTE');
  if(p.status.publicationStatus!=='cleared'||p.status.runtimeStatus!=='eligible')errors.push('RUNTIME_DISABLED');
  if(profile.sourceIds&&!profile.sourceIds.includes(p.sourceId))errors.push('SOURCE_NOT_SELECTED');
  if(profile.examIds?.length&&!profile.examIds.includes(p.examId))errors.push('EXAM_NOT_SELECTED');
  if(p.load&&((profile.maxCalculationLoad&&p.load.calculation>profile.maxCalculationLoad)||(profile.maxReadingLoad&&p.load.reading>profile.maxReadingLoad)))errors.push('LOAD_LIMIT');
  if(mode==='exam_holdout'&&history.historyUnknown)errors.push('HISTORY_UNKNOWN');
  return {eligible:errors.length===0,allowedRouteIds:allowed.map(r=>r.routeId),reasonCodes:errors,sourceRevision:p.mappingRevision};
 }
 function sourceMatch(task,p){
  if(!p?.recipe||task?.competition?.recipe?.familyId!==p.recipe.familyId||task.competition.recipe.configurationId!==p.recipe.configurationId)return false;
  const m=task.competition.math,f=p.facts;
  if(p.recipe.familyId==='overlapAverages')return m.values?.length===f.n&&P.equal(m.values.slice(0,4).reduce((a,b)=>a+b,0)+'/4',f.averages[0])&&P.equal(m.values.slice(3).reduce((a,b)=>a+b,0)+'/4',f.averages[1])&&P.equal(m.values.reduce((a,b)=>a+b,0)+'/7',f.averages[2]);
  if(p.recipe.familyId==='digitDivisor')return m.lo===f.lo&&m.hi===f.hi&&f.strict===true&&f.zeroDivisorAllowed===false;
  if(p.recipe.familyId==='lShapeArea')return m.inner===f.smallSquareSides[1]&&m.border===f.smallSquareSides[0]&&m.border===f.smallSquareSides[2];
  if(p.recipe.familyId==='signedProduct')return canonical(m.cards)===canonical(f.cards)&&f.choose===3&&f.distinct===true;
  return false;
 }
 function match(task){return Object.values(data.problems).find(p=>sourceMatch(task,p))||null}
 return {data,canonical,compatibleBuild,closure,getProblem,routes,taskKey,problemKey,resolveMathKey,taskAllowed,check,sourceMatch,match};
})(typeof module!=='undefined'?require('./exam_runtime_index.json'):window.__AMC8_EXAM_MAPPING,typeof module!=='undefined'?require('./skills.json'):window.__AMC8_SKILLS,typeof module!=='undefined'?require('./problem_state'):ProblemState);
if(typeof module!=='undefined')module.exports=ExamMapping;
