'use strict';
// Navigation diagnostics only. The accepted selection and evidence engines stay unchanged.
const SelectionDiagnostics=(()=>{
 function plans(p,historyOverride=null){return ExamMappingUI.supplyPlans(p,historyOverride);}
 function explain(p=SourceCatalog.profile({...saved.topicPractice,topicIds:saved.topicPractice.selectedTopicIds})){
  if(!p.topicIds.length)return {reasonCode:'NO_TOPICS',message:'先选择孩子确实已掌握的知识。'};
  if(!p.sourceIds.length)return {reasonCode:'NO_SOURCES',message:'还没有选择题目来源，请在下方勾选一种。'};
  if(p.examIds.length&&!p.sourceIds.includes('AMC8'))return {reasonCode:'SOURCE_EXCLUDED',message:'已经指定 AMC8 真题，但当前题目来源未包含 AMC8。可由家长调整来源，或取消指定题号。'};
  if(!p.sourceIds.includes('AMC8')){const result=SourceCatalog.explain(COMPETITION_REVIEWED,p);return {...result,reasonCode:result.code};}
  const currentlyEligible=plans(p);
  if(ConnectedLearning.focusPlans(currentlyEligible,p).length)return {reasonCode:'AVAILABLE',available:true,message:'已选范围内有符合当前条件的题，可以开始。'};
  if(currentlyEligible.length&&!ConnectedLearning.focusPlans(currentlyEligible,p).length)
   return {reasonCode:'NO_FOCUSED_SUPPLY',message:'已选的进阶主题暂时没有符合当前知识、来源和审核条件的新题；基础知识不会代替本组重点。'};
  if((p.maxCalculationLoad||p.maxReadingLoad)&&ConnectedLearning.focusPlans(plans({...p,maxCalculationLoad:null,maxReadingLoad:null}),p).length)return {reasonCode:'LOAD_LIMIT',message:'当前计算量或阅读量限制挡住了匹配题。可以由家长调整这两项，已选知识范围保持不变。'};
  if(p.examIds.length){
   const selectedProblems=p.examIds.map(id=>ExamMapping.getProblem(id)).filter(Boolean);
   if(!selectedProblems.length)return {reasonCode:'UNKNOWN_EXAM',message:'指定的题号没有找到对应资料，请检查题号。'};
   if(selectedProblems.some(problem=>(window.__AMC8_CHILD_FORMS?.problems?.[problem.examId]?.givenFigures||[]).some(f=>!window.__AMC8_SOURCE_FIGURES?.[f.sha256])))
    return {reasonCode:'REQUIRED_FIGURE_UNAVAILABLE',message:'指定真题所需的题图暂不可用，暂不安排盲答。请检查网络或稍后重试；原记录保留。'};
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
  if(ExamMappingUI.history().historyUnknown)return {reasonCode:'HISTORY_UNVERIFIED',message:'现有练习记录的版本暂时不能核验。请先导出记录，再检查保存状态；不会覆盖原始内容。'};
  const noHistory={solvedMathKeys:[],exposedMathKeys:[],exposedOriginGroups:[],assistedOriginGroups:[],historyUnknown:false};
  if(!currentlyEligible.length&&ConnectedLearning.focusPlans(plans(p,noHistory),p).length)return {reasonCode:'EXPOSED_OR_SOLVED',message:'当前范围内对应的题目或必要准备步骤已有练习记录，暂不能重复当作新题。可查看历史，或保留已学范围再选其他题。'};
  const withoutExam={...p,examIds:[]};
  if(p.examIds.length&&ConnectedLearning.focusPlans(plans(withoutExam),withoutExam).length)return {reasonCode:'EXAM_FILTER',message:'指定题号当前没有符合审核、历史和题目范围的可用路线。可取消指定题号，按已选知识安排；原记录会保留。'};
  return {reasonCode:'NO_NEW_REVIEWED_SUPPLY',message:'模块可以跨类别混选。当前范围暂时没有尚未做对、且通过题目审核的新题；已选知识和历史记录都保留。'};
 }
 return {explain,plans};
})();
