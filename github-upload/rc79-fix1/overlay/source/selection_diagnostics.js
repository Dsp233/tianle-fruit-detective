'use strict';
// Navigation diagnostics only. The accepted selection and evidence engines stay unchanged.
const SelectionDiagnostics=(()=>{
 function plans(p){return ChildReviewStatus.withReviewSnapshot(()=>{
  const history=ExamMappingUI.history(),state=TransferEvidenceStore.inspect(saved.rtm1).state;
  const originals=[];
  for(const problem of Object.values(ExamMapping.data.problems)){
   if(!ExamMapping.check(problem,p,history,'practice').eligible||!ConnectedLearning.review(problem).eligible)continue;
   let mathKey;
   if(problem.recipe){const task=competitionCreate(problem.recipe);if(!ExamMapping.sourceMatch(task,problem)||!SourceCatalog.loadsAllowed(task,p))continue;mathKey=CompetitionIdentity.key(task);}else mathKey=ExamMapping.problemKey(problem);
   originals.push({id:problem.examId,examId:problem.examId,kind:'exam',mathKey,originProblemGroupId:problem.originProblemGroupId,structureClusterId:problem.structureClusterId,definition:problem.presentation||{}});
  }
  const training=Object.values(ExamMapping.data.tasks).filter(t=>p.sourceIds.includes('AMC8')&&(!p.examIds.length||p.examIds.includes(t.originProblemGroupId))&&t.verificationStatus==='PASS'&&ExamMapping.taskAllowed(t,p).eligible&&ConnectedLearning.review(ExamMapping.getProblem(t.originProblemGroupId)).eligible).map(t=>({id:t.taskId,kind:'training',mathKey:ExamMapping.taskKey(t),originProblemGroupId:t.originProblemGroupId,structureClusterId:t.structureClusterId,definition:t}));
  return ConnectedLearning.plans(originals,training,p,history,state);
 });}
 function explain(p=SourceCatalog.profile({...saved.topicPractice,topicIds:saved.topicPractice.selectedTopicIds})){
  if(!p.topicIds.length)return {reasonCode:'NO_TOPICS',message:'先选择孩子确实已掌握的知识。'};
  if(!p.sourceIds.length)return {reasonCode:'NO_SOURCES',message:'还没有选择题目来源，请在下方勾选一种。'};
  if(!p.sourceIds.includes('AMC8')){const result=SourceCatalog.explain(COMPETITION_REVIEWED,p);return {...result,reasonCode:result.code};}
  const currentlyEligible=plans(p);
  if(currentlyEligible.length&&!ConnectedLearning.focusPlans(currentlyEligible,p).length)
   return {reasonCode:'NO_FOCUSED_SUPPLY',message:'已选的进阶主题暂时没有符合当前知识、来源和审核条件的新题；基础知识不会代替本组重点。'};
  if((p.maxCalculationLoad||p.maxReadingLoad)&&plans({...p,maxCalculationLoad:null,maxReadingLoad:null}).length)return {reasonCode:'LOAD_LIMIT',message:'当前计算量或阅读量限制挡住了匹配题。可以由家长调整这两项，已选知识范围保持不变。'};
  if(p.examIds.length){
   const selectedProblems=p.examIds.map(id=>ExamMapping.getProblem(id)).filter(Boolean);
   if(!selectedProblems.length)return {reasonCode:'UNKNOWN_EXAM',message:'指定的题号没有找到对应资料，请检查题号。'};
   if(selectedProblems.every(problem=>!ConnectedLearning.review(problem).eligible))
    return {reasonCode:'PRESENTATION_REVIEW_PENDING',message:'指定真题的儿童呈现或准备任务尚未全部核验，暂不能安排；原记录保留。'};
  }
  const declared=new Set(p.declaredSkillIds),selected=new Set(p.topicIds),allKnown={...p,declaredSkillIds:SKILL_DATA.skills.map(s=>s.id)},skills=new Map(SKILL_DATA.skills.map(s=>[s.id,s]));
  const nearest=plans(allKnown).map(plan=>{
   const required=ExamMapping.closure([...ExamMapping.data.routes[plan.routeId].requiredSkills,...plan.taskIds.flatMap(id=>ExamMapping.data.tasks[id].requiredKnowledge||[])]);
   const missing=required.filter(id=>!declared.has(id));
   return {missing,relevant:required.some(id=>selected.has(skills.get(id)?.unitId))};
  }).filter(row=>(p.examIds.length||row.relevant)&&row.missing.length).sort((a,b)=>a.missing.length-b.missing.length)[0];
  if(nearest){const missingTopicIds=[...new Set(nearest.missing.map(id=>skills.get(id).unitId))],names=missingTopicIds.map(id=>SKILL_DATA.units.find(u=>u.id===id).title);return {reasonCode:'MISSING_KNOWLEDGE',missingSkillIds:nearest.missing,missingTopicIds,message:(p.examIds.length?'指定真题的一条可用准备路线':'与当前范围相关的可用题')+'还需要声明已掌握：'+names.join('、')+'。请只补选孩子确实学过的知识。'};}
  if(p.examIds.length&&plans({...p,examIds:[]}).length)return {reasonCode:'EXAM_FILTER',message:'指定题号当前没有符合审核、历史和题目范围的可用路线。可取消指定题号，按已选知识安排；原记录会保留。'};
  return {reasonCode:'NO_NEW_REVIEWED_SUPPLY',message:'模块可以跨类别混选。当前范围暂时没有尚未做对、且通过题目审核的新题；已选知识和历史记录都保留。'};
 }
 return {explain,plans};
})();
