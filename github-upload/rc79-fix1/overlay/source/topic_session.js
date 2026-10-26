'use strict';
let topicActive=false,topicOpening=false;
function topicIds(ids){const chosen=new Set(Array.isArray(ids)?ids:[]);return SKILL_DATA.units.filter(u=>chosen.has(u.id)).map(u=>u.id)}
function topicTaskKey(task){return taskVersion(task)+':'+task.id}
function topicTaskRegions(task){if(task.competition)return [...task.competition.topicIds];const ids=task.joint?[...task.joint.targetNodeIds,...task.joint.supportNodeIds]:[task.skillId];return [...new Set(ids.map(id=>NODE_BY_ID.get(id)?.regionId).filter(Boolean))]}
function topicDescriptor(item){
 if(item?.view!=='competition')return null;
 try{const task=competitionCreate(item.recipe);return {view:'competition',code:task.id,task}}catch{return null}
}
function topicRestoreDraft(value){
 const restored=freshDraft();if(!value||typeof value!=='object')return restored;
 if(Number.isInteger(value.choice)&&value.choice>=-1&&value.choice<5)restored.choice=value.choice;
 if(Number.isFinite(value.startedAt)&&value.startedAt>0)restored.startedAt=value.startedAt;
 restored.work=competitionRestoreWork(value.work);if(restored.work.eliminated.includes(restored.choice))restored.choice=-1;return restored;
}
function topicRestoreState(old){
 const state={maxCalculationLoad:[1,2].includes(old?.maxCalculationLoad)?old.maxCalculationLoad:null,maxReadingLoad:[1,2].includes(old?.maxReadingLoad)?old.maxReadingLoad:null,sourceIds:Array.isArray(old?.sourceIds)?old.sourceIds.filter(x=>SourceCatalog.banks.some(b=>b.id===x)):['AMC8'],examIds:Array.isArray(old?.examIds)?old.examIds.filter(x=>/^AMC8-\d{4}-\d{2}$/.test(x)):[],excludedSkillIds:Array.isArray(old?.excludedSkillIds)?old.excludedSkillIds.filter(x=>SKILL_DATA.skills.some(s=>s.id===x)):[],selectedTopicIds:topicIds(old?.selectedTopicIds),session:null,nextSeed:Number.isInteger(old?.nextSeed)&&old.nextSeed>0&&old.nextSeed<=2147483647?old.nextSeed:1,legacySession:null};
 const source=old?.session;
 // Preserve the old navigation snapshot without resuming isolated lessons.
 const legacy=source&&source.mode!=='competition-v2'?source:old?.legacySession;
 if(legacy&&typeof legacy==='object'&&JSON.stringify(legacy).length<500000)state.legacySession=legacy;
 if(source?.mode!=='competition-v2')return state;
 const ids=topicIds(source.topicIds);if(!ids.length||!Array.isArray(source.items)||!source.items.length||source.items.length>66)return state;
 const items=[],signatures=new Set();
 for(const row of source.items){
  const d=topicDescriptor(row),task=d?.task,c=task?.competition;
  if(!task||![2,3,4].includes(c.recipe.engine)||row.taskId!==task.id||row.code!==task.id||row.contentVersion!==task.contentVersion||!Number.isFinite(row.openedAt)||row.openedAt<=0||(!SourceCatalog.teachingScope(task,{...source,topicIds:ids})&&!c.topicIds.every(id=>ids.includes(id)))||signatures.has(c.signature))return state;
  signatures.add(c.signature);
  const solved=saved.competition.views[competitionHash(c.signature)]?.solved;
  const passed=solved?.correct===true&&solved.sessionId===source.id&&solved.at>=row.openedAt||saved.competition.attempts.some(a=>a.signature===c.signature&&a.sessionId===source.id&&a.correct&&a.at>=row.openedAt);
  const restoredDraft=topicRestoreDraft(row.draft),free=c.family==='threeGroupBalance'||c.integrated,input=free&&(restoredDraft.work?.scopes?.main?.reasoning?.signature===c.signature||restoredDraft.work?.reasoning?.signature===c.signature)?String(restoredDraft.work.scopes?.main?.input?.raw??restoredDraft.work.reasoning?.finalInput??''):!free&&restoredDraft.choice>=0?task.options[restoredDraft.choice]:'';
  const checked=SubmissionContract.numeric(input,c.answer);let restoredFeedback=passed&&checked.ok?{ok:true,status:'correct',text:'这题已经答对，可以比较解法或继续。'}:null;
  if(row.feedback?.ok===false){if(checked.recordAttempt&&!checked.ok)restoredFeedback={ok:false,status:'needs_revision',text:competitionDirectedFeedback(task,input)};else if(!checked.recordAttempt&&row.feedback.status===checked.status)restoredFeedback=checked;}
  items.push({view:'competition',code:task.id,taskId:task.id,contentVersion:task.contentVersion,recipe:c.recipe,openedAt:row.openedAt,passed,skipped:row.skipped===true,autoExcluded:row.autoExcluded===true&&CompetitionIdentity.solved(saved.competition,task),skipReason:row.skipReason==='previously_solved'?'previously_solved':null,draft:restoredDraft,feedback:restoredFeedback});
 }
 const first=items.findIndex(i=>!i.passed&&!i.skipped),limit=first<0?items.length-1:first;
 const declared=SourceCatalog.profile({...source,topicIds:ids,excludedSkillIds:Array.isArray(source.excludedSkillIds)?source.excludedSkillIds:[]});
 state.session={...declared,mode:'competition-v2',profileOrigin:source.profileVersion===1?'saved-declaration':'legacy-topic-declaration',id:typeof source.id==='string'?source.id.slice(0,100):'restored',planSeed:Number.isInteger(source.planSeed)&&source.planSeed>0?source.planSeed:1,total:Math.max(items.length,Math.min(66,Number.isInteger(source.total)?source.total:10)),cursor:Math.max(0,Math.min(limit,Number.isInteger(source.cursor)?source.cursor:limit)),...(source.periodic?.kind==='biweekly'&&typeof source.periodic.cycleId==='string'?{periodic:{kind:'biweekly',cycleId:source.periodic.cycleId.slice(0,100),startedAt:source.periodic.startedAt,newOnly:true}}:{}),items,exhausted:source.exhausted===true,selectionStatus:source.selectionStatus&&['FOUND','SEARCH_BUDGET_REACHED','NO_ELIGIBLE_SCOPE'].includes(source.selectionStatus.code)?{code:source.selectionStatus.code}:null};return state;
}
function topicSession(){return saved.topicPractice?.session||null}
function topicLegacyExamSession(session=topicSession()){return topicDescriptor(session?.items?.[session.cursor])?.task?.competition?.sourceProvenance?.sourceId==='AMC8'}
function topicSessionSettings(session=topicSession()){
 if(window.AMC8_QA&&session?.id?.startsWith('qa-'))return SourceCatalog.profile(session);
 return SourceCatalog.profile({...saved.topicPractice,topicIds:saved.topicPractice.selectedTopicIds});
}
function topicCurrentEligibility(){
 const task=topicDescriptor(topicCurrent())?.task;if(!task)return {eligible:false,reasonCodes:['NO_CURRENT_TASK']};
 const result=SourceCatalog.taskEligibility(task,topicSessionSettings()),c=task.competition;
 const validation=window.AMC8_QA&&topicSession()?.id?.startsWith('qa-')&&c.qaValidation===true&&c.sourceProvenance?.productionEnabled===false&&ValidationRuntime.catalog.some(f=>f.id===c.family);
 if(validation){result.reasonCodes=result.reasonCodes.filter(code=>code!=='SOURCE_NOT_SELECTED');result.eligible=result.reasonCodes.length===0;result.qaOnlyValidation=true}
 return result;
}
function topicPauseForScope(){
 topicActive=false;open('home');feedback={ok:false,status:'retained_scope_paused',text:'这道保留题目前不符合家长当前选择的知识、来源或负担范围，已暂停。原首答、提示和草稿都保留；可以调整已掌握范围后继续，或只读回看历史。'};persist();render();return false;
}
function topicRequireCurrentScope(){
 if(!canPersist||['read_only','conflict'].includes(progressStore.getStatus())){feedback={ok:false,status:'retained_storage_paused',text:'当前记录暂不能写入，已暂停作答和提示。原首答、帮助及本页草稿都保留，可以先导出再刷新。'};render();return false;}
 if(topicCurrentEligibility().eligible)return true;
 if(window.AMC8_QA&&topicSession()?.id?.startsWith('qa-')){feedback={ok:false,status:'unsupported_scope',text:'当前QA声明不包含这道题的完整知识、来源或负担范围；不授作答或帮助证据。'};render();return false;}
 topicCaptureDraft();return topicPauseForScope();
}
function topicCurrent(){const s=topicSession();return s?.items[s.cursor]||null}
function topicFrontier(){const s=topicSession();if(!s)return 0;const i=s.items.findIndex(row=>!row.passed&&!row.skipped&&!row.autoExcluded);return i<0?s.items.length:i}
function topicSessionMatches(){const item=topicCurrent();return !!topicActive&&view==='competition'&&!!item&&item.view===view&&!!topicDescriptor(item)}
function topicCaptureDraft(){if(topicOpening||!topicSessionMatches())return;const item=topicCurrent();item.draft=JSON.parse(JSON.stringify(draft));item.feedback=feedback?{ok:feedback.ok===true,status:feedback.status,text:String(feedback.text||'')}:null}
function topicPickNext(session){
 const tasks=session.items.map(row=>topicDescriptor(row).task),used=new Set(tasks.map(t=>CompetitionIdentity.key(t))),solved=CompetitionIdentity.solvedKeys(saved.competition),seen=new Set([...CompetitionIdentity.index(saved.competition).values()].filter(h=>session.periodic?.newOnly||h.attempted||h.hinted||h.solutionViewed).map(h=>h.key));
 // Prefer different problem structures and perspectives. No topic quotas.
 const profile=competitionAdaptiveProfile(saved.competition.attempts,saved.competition.extensions,session.topicIds,saved.competition.extensionViews,saved.competition.views);
 const settings=topicSessionSettings(session),families=competitionShuffle(SourceCatalog.eligible(COMPETITION_REVIEWED,settings).filter(f=>!ExamMappingUI.childEntryEnabled()||f.sourceId!=='AMC8'),competitionRng(session.planSeed+session.items.length));
 const byId=new Map(COMPETITION_REVIEWED.map(f=>[f.id,f])),history=[],historyMath=new Set(used);
 const activity=Object.values(saved.competition.views).filter(h=>h.last).map(h=>({...h.last,signature:h.signature})).concat(saved.competition.attempts).sort((a,b)=>b.at-a.at||(b.order||0)-(a.order||0));
 for(const a of activity){
  const f=byId.get(a.recipe?.familyId);let key;try{const t=competitionCreate(a.recipe);if(t.competition.signature!==a.signature)continue;key=CompetitionIdentity.key(t)}catch{continue}if(!f||historyMath.has(key)||!f.topicIds.every(id=>session.topicIds.includes(id)))continue;
  historyMath.add(key);history.unshift(f);if(history.length===12)break;
 }
 const trail=history.concat(tasks.map(t=>byId.get(t.competition.recipe.familyId)).filter(Boolean));
 const structure=f=>f.selectionReasoningKey||f.reasoningKey||f.strategy,
  poolStructures=new Set(families.map(structure)),sessionStructures=new Set(tasks.map(t=>structure(byId.get(t.competition.recipe.familyId)))),remaining=session.total-tasks.length;
 const lastTwo=tasks.slice(-2).map(t=>structure(byId.get(t.competition.recipe.familyId)));
 const preferNew=poolStructures.size>=5&&sessionStructures.size<5&&remaining<=5-sessionStructures.size;
 const admissible=f=>!(lastTwo.length===2&&lastTwo[0]===lastTwo[1]&&structure(f)===lastTwo[0]&&poolStructures.size>1)&&(!preferNew||!sessionStructures.has(structure(f)));
 const score=f=>{
  const target=competitionAdaptiveTarget(profile,f),count=tasks.filter(t=>t.competition.recipe.familyId===f.id).length;
  let streak=0;for(let i=trail.length-1;i>=0&&trail[i].id===f.id;i--)streak++;
  const canChange=families.some(g=>g.id!==f.id&&g.level<=competitionAdaptiveTarget(profile,g).level);
  // Keep a short reinforcing pair, then prefer another legal perspective.
  // A narrow low-band pool may repeat rather than force a harder question.
  const stayLow=target.band===1&&!target.probe&&f.level>target.level&&families.some(g=>g.level<=competitionAdaptiveTarget(profile,g).level);
  const reasoning=f.selectionReasoningKey||f.reasoningKey||f.strategy,reasoningCount=trail.filter(g=>(g.selectionReasoningKey||g.reasoningKey||g.strategy)===reasoning).length;
  let reasoningStreak=0;for(let i=trail.length-1;i>=0&&(trail[i].selectionReasoningKey||trail[i].reasoningKey||trail[i].strategy)===reasoning;i--)reasoningStreak++;
  const canChangeReasoning=families.some(g=>(g.selectionReasoningKey||g.reasoningKey||g.strategy)!==reasoning&&g.level<=competitionAdaptiveTarget(profile,g).level),loads=CompetitionDesign.familyLoads(f);
  return Math.abs(f.level-target.level)*80+(f.level>target.level?80*(f.level-target.level):0)+(stayLow?10000:0)+count*60+history.filter(g=>g.id===f.id).length*12+reasoningCount*8+(streak>=2&&canChange?100:0)+(reasoningStreak>=2&&canChangeReasoning?180:0)+loads.calculationLoad.level*5+loads.readingLoad.level*3+(f.topicIds.length>1?-4:0);
 };
 families.sort((a,b)=>score(a)-score(b));let repeated=null,generated=0;
 const ordered=[...families.filter(admissible),...families.filter(f=>!admissible(f))];
 for(const family of ordered){
  const candidates=[];
  for(let tries=0;tries<120;tries++){
   const seed=saved.topicPractice.nextSeed;saved.topicPractice.nextSeed=seed>=2147483647?1:seed+1;
   const task=competitionCreate({...competitionReviewedRecipe(family.id,seed),generatorRevision:family.generatorRevision||competitionReviewedRecipe(family.id,seed).generatorRevision,...(family.configurationId?{configurationId:family.configurationId}:{})}),signature=task.competition.signature,mathKey=CompetitionIdentity.key(task);generated++;if(used.has(mathKey)||solved.has(mathKey)||session.periodic?.newOnly&&seen.has(mathKey)||!SourceCatalog.loadsAllowed(task,settings)||!SourceCatalog.taskAllowed(task,settings).length)continue;
   const item={view:'competition',code:task.id,taskId:task.id,contentVersion:task.contentVersion,recipe:task.competition.recipe,openedAt:Date.now(),passed:false,draft:null,feedback:null};
   candidates.push({item,score:CompetitionDesign.comfort(task.competition),seen:seen.has(mathKey)});
   if(candidates.filter(c=>!c.seen).length>=12)break;
  }
  candidates.sort((a,b)=>Number(a.seen)-Number(b.seen)||a.score-b.score);
  if(candidates.some(c=>!c.seen)){session.selectionStatus={code:'FOUND',generated};return candidates.find(c=>!c.seen).item;}
  repeated??=candidates[0]?.item||null;
 }
 session.selectionStatus={code:repeated?'FOUND':families.length?'SEARCH_BUDGET_REACHED':'NO_ELIGIBLE_SCOPE',generated};
 return repeated;
}
function topicExcludeSolved(item){
 if(!item||item.passed||item.autoExcluded||topicSession()?.id?.startsWith('qa-'))return !!item?.autoExcluded;
 const task=topicDescriptor(item)?.task;if(!task||!CompetitionIdentity.solved(saved.competition,task))return false;
 item.autoExcluded=true;item.skipped=true;item.skipReason='previously_solved';return true;
}
function topicOpenCurrent(){
 const item=topicCurrent();if(!item||!topicDescriptor(item))return;
 if(!item.passed&&!topicCurrentEligibility().eligible&&!(window.AMC8_QA&&topicSession()?.id?.startsWith('qa-'))){topicPauseForScope();return;}
 const previousDraft=item.draft,previousFeedback=item.feedback;topicActive=true;topicOpening=true;
 try{CompetitionController.invalidate();open('competition',item.code);draft=topicRestoreDraft(previousDraft);CompetitionController.prepare(playerTask());feedback=previousFeedback||((item.passed&&draft.work.scopes.main.answerState==='correct')?{ok:true,status:'correct',text:'这题已有通过记录，可以继续。'}:null)}finally{topicOpening=false}
 persist();render();window.scrollTo({top:0,behavior:'instant'});
}
function topicFinish(){topicActive=true;topicOpening=true;try{open('topicSummary')}finally{topicOpening=false}persist();PeriodicPracticeUI.finishBiweekly(topicSession()?.periodic,topicSession()?.items.length||0);render();window.scrollTo({top:0,behavior:'instant'})}
function topicAdvance(){
 const s=topicSession();if(!s)return;topicExcludeSolved(topicCurrent());if(!topicCurrent()?.passed&&!topicCurrent()?.skipped)return;topicCaptureDraft();
 while(s.cursor+1<s.items.length){s.cursor++;if(topicExcludeSolved(topicCurrent()))continue;topicOpenCurrent();return}
 if(s.items.length>=s.total||s.exhausted){topicFinish();return}
 const next=topicPickNext(s);if(!next){s.exhausted=true;topicFinish();return}s.items.push(next);s.cursor++;topicOpenCurrent();
}
function topicStart(options={}){
 if(!canPersist||progressStore.getStatus()!=='ready'){storageMessage='当前记录暂不能写入，请关闭其他练习页面后重试，或先导出草稿。';syncStorageStatus();return}
 const settings=SourceCatalog.profile({...saved.topicPractice,topicIds:saved.topicPractice.selectedTopicIds}),ids=settings.topicIds;if(!ids.length)return;
 if(ExamMappingUI.beginConnected(settings,options))return;
 if(ExamMappingUI.childEntryEnabled()&&!SourceCatalog.eligible(COMPETITION_REVIEWED,settings).some(f=>f.sourceId!=='AMC8')){feedback={ok:false,status:'awaiting_reviewed_problem',text:SourceCatalog.explain(COMPETITION_REVIEWED,settings).code==='unverified_knowledge'?SourceCatalog.explain(COMPETITION_REVIEWED,settings).message:SelectionDiagnostics.explain(settings).message};render();return}
 const s={...settings,profileOrigin:'user-declared',mode:'competition-v2',id:Date.now()+'-'+Math.random().toString(36).slice(2,8),planSeed:saved.topicPractice.nextSeed,total:10,cursor:0,items:[],exhausted:false,...(options.periodic?{periodic:options.periodic}:{})};
 const first=topicPickNext(s);if(!first){feedback={ok:false,status:s.selectionStatus?.code==='SEARCH_BUDGET_REACHED'?'awaiting_new_problem':'awaiting_scope',text:s.selectionStatus?.code==='SEARCH_BUDGET_REACHED'?'本次在已选范围内暂未找到更多未答对的新题，已经答对的题不会重复安排。可以稍后再试，或由家长调整范围。':SourceCatalog.explain(COMPETITION_REVIEWED,{...s,topicIds:ids}).message};render();return;}s.items.push(first);saved.topicPractice.session=s;topicOpenCurrent();
}
function topicResume(){const s=topicSession();if(!s)return;if(ExamMappingUI.childEntryEnabled()&&topicLegacyExamSession(s)){feedback={ok:false,status:'legacy_exam_retained',text:'旧真题草稿已保留在完整记录中，可导出查看。请从首页开始新的练习。'};render();return}const frontier=topicFrontier();s.cursor=Math.min(frontier,s.items.length-1);if(frontier===s.items.length||topicExcludeSolved(topicCurrent())){topicAdvance();return}topicOpenCurrent()}
function topicNames(ids){return ids.map(id=>SKILL_DATA.units.find(u=>u.id===id)?.title||id).join('、')}
function topicSelectionGuidance(availability){
 if(availability.available||!saved.topicPractice.selectedTopicIds.length)return '';
 const p=SourceCatalog.profile({...saved.topicPractice,topicIds:saved.topicPractice.selectedTopicIds}),names=new Map(SKILL_DATA.skills.map(s=>[s.id,s.title]));
 const missing=(availability.missingSkillIds||[]).slice(0,8),original=!p.examIds.length&&!p.sourceIds.includes('original')&&SourceCatalog.eligible(COMPETITION_REVIEWED,{...p,sourceIds:['original']}).length>0;
 return `<aside class="selection-guidance" data-selection-reason="${availability.reasonCode||availability.code}" aria-label="选题条件说明"><p><b>为什么暂时不能开始？</b> ${esc(availability.message)}</p>${missing.length?'<p>这条匹配路线涉及的具体小项：</p><ul>'+missing.map(id=>'<li>'+esc(names.get(id)||id)+'</li>').join('')+'</ul>':''}<div class="stage-buttons">${availability.reasonCode==='EXAM_FILTER'?'<button class="secondary" data-action="sourceExamClear">取消指定题号，按知识安排</button>':''}${availability.reasonCode==='LOAD_LIMIT'?'<button class="secondary" data-action="sourceLoadReset">调整为不限计算量与阅读量</button>':''}${original?'<button class="secondary" data-action="sourceAddOriginal">开启范围内的原创拓展题</button>':''}<button class="secondary" data-action="knowledge">查看知识地图</button></div><p>不会自动勾选未学知识，也不会用已做对的题凑数。</p></aside>`;
}
function topicSelectionPage(){
 const selected=topicIds(saved.topicPractice.selectedTopicIds),session=topicSession(),unfinished=session&&(!ExamMappingUI.childEntryEnabled()||!topicLegacyExamSession(session))&&(topicFrontier()<session.items.length||session.items.length<session.total&&!session.exhausted);
 const availability=SourceCatalog.explain(COMPETITION_REVIEWED,{...saved.topicPractice,topicIds:selected});
 const connected=ExamMappingUI.connectedStatus(),resumeConnected=connected?.status==='active',connectedCount=selected.length?ExamMappingUI.connectedAvailability():0;
 if(connectedCount){availability.available=true;availability.code='CONNECTED_SUPPLY';availability.message='已选范围可衔接真题。先把相关判断和条件变化想清楚，再在同一组里试真题。'}
 else if(ExamMappingUI.childEntryEnabled()&&!SourceCatalog.eligible(COMPETITION_REVIEWED,{...saved.topicPractice,topicIds:selected}).some(f=>f.sourceId!=='AMC8')){availability.available=false;availability.code='NO_REVIEWED_CONNECTED_SUPPLY';Object.assign(availability,SelectionDiagnostics.explain());}
 return `<section class="topic-selection"><div class="topic-intro"><h1>今天想练什么？</h1><p>勾选你已经学会的主题。这是你或家长声明的范围，可展开细化小项。</p></div><div class="topic-start"><div class="topic-selection-status" role="status" aria-live="polite">${selected.length?'已选 '+selected.length+' 个主题：'+esc(topicNames(selected)):'先点选下面的主题'}</div><p class="topic-availability" data-pool-status="${availability.code}" role="status" aria-live="polite">${esc(availability.message)}</p><div class="topic-start-actions"><button class="primary" data-action="topicStart" ${availability.available?'':'disabled'}>开始做题 →</button>${selected.length?'<button class="secondary" data-action="topicClear">清空选择</button>':''}</div></div>${topicSelectionGuidance(availability)}${resumeConnected?`<section class="topic-resume"><div><b>上次的练习</b><p>已进入 ${connected.attemptIds.length}/${connected.total} 题，草稿和提示已保存。</p><p>继续前会按家长当前选择重新核验；原首答、提示和草稿保留。</p></div><button class="secondary" data-action="rtmConnectedResume">继续上次 →</button></section>`:''}${unfinished&&!resumeConnected?`<section class="topic-resume"><div><b>上次的挑战</b><p>${esc(topicNames(session.topicIds))} · 已完成 ${session.items.filter(i=>i.passed).length}/${session.total} 题</p><p>继续前会核验当前选择的知识、来源和负担；不符合时暂停，原记录保留。</p></div><button class="secondary" data-action="topicResume">继续上次 →</button></section>`:''}${PeriodicPracticeUI.home()}<div class="topic-groups">${FAMILIES.map(([prefix,name,icon])=>`<section class="topic-group"><h2><span aria-hidden="true">${icon}</span> ${name}</h2><div class="topic-choices">${SKILL_DATA.units.filter(u=>u.id.startsWith(prefix)).map(u=>`<button class="topic-choice" type="button" data-action="topicSelect" data-code="${u.id}" aria-pressed="${selected.includes(u.id)}"><span>${esc(u.title)}</span><span class="topic-selected-mark" aria-hidden="true">${selected.includes(u.id)?'✓':'＋'}</span></button>`).join('')}</div></section>`).join('')}</div>${sourceSelectionPanel(selected,availability)}<div class="topic-footer-actions"><span>${selected.length?'出题范围：'+selected.length+' 个主题 · 每组最多 10 题':'选择主题后开始'}</span><button class="primary" data-action="topicStart" ${availability.available?'':'disabled'}>开始做题 →</button></div><details class="panel topic-parent"><summary>家长查看</summary><div class="stage-buttons"><button class="secondary" data-action="progress">查看全部学习记录</button>${ExamMappingUI.enabled()?'<button class="secondary" data-action="rtmOpen">真题准备与作答记录</button>':''}<button class="secondary" data-action="competitionRecords">竞赛练习记录</button><button class="secondary" data-action="knowledge">知识地图与联系</button><button class="secondary" data-action="catalog">历年题目索引</button></div><p>勾选的是知识范围，每题可用其中一个或几个自然相关的主题。不要求每题用完所选主题，也不强求一组全部覆盖。题目重在关键推理、巧解和条件变化，直接开始，原有学习记录保留。</p></details></section>`;
}
function topicSummaryPage(){
 const s=topicSession();if(!s)return topicSelectionPage();const completed=s.items.filter(i=>i.passed).length,firstKeys=new Set();for(const row of s.items){const t=topicDescriptor(row).task,g=CompetitionIdentity.exposure(saved.competition,t),h=g.first;if(g.cleanFirst&&h?.kind==='main'&&h.sessionId===s.id&&h.at>=row.openedAt)firstKeys.add(g.key)}const first=firstKeys.size;
 return `<section class="panel completed topic-summary"><div class="award" aria-hidden="true">✓</div><h1>${s.exhausted?'这组先做到这里':'这组挑战完成了'}</h1>${s.periodic?.kind==='biweekly'?'<p data-periodic-shortage>双周新题：本次安排 '+s.items.length+'/10 道。'+(s.items.length<10?'当前范围内本次未找到更多合格新实例；不加入已做题或未学题凑数。':'')+'</p>':''}<p>${esc(topicNames(s.topicIds))}</p>${s.exhausted?'<p>本次在已选范围内暂未找到更多未答对的新题，已经答对的题不会重复安排。</p>':''}<p>完成 ${completed} 道题，跳过 ${s.items.filter(i=>i.skipped&&!i.passed&&!i.autoExcluded).length} 道，${first} 道未用提示首答正确。</p><div class="hero-cta"><button class="primary" data-action="topicStart">再来一组 →</button><button class="secondary" data-action="topicExit">换主题</button><button class="secondary" data-action="topicPrevious">回看上一题</button></div></section>`;
}
function topicHandleAction(action,data){
 if(sourceSelectionAction(action,data))return true;
 if(action==='topicSelect'){if(view!=='home'||!SKILL_DATA.units.some(u=>u.id===data.code))return true;const chosen=new Set(saved.topicPractice.selectedTopicIds);chosen.has(data.code)?chosen.delete(data.code):chosen.add(data.code);saved.topicPractice.selectedTopicIds=topicIds([...chosen]);feedback=null;persist();render();return true}
 if(action==='topicClear'){if(view==='home'){saved.topicPractice.selectedTopicIds=[];persist();render()}return true}
 if(action==='topicStart'){if(view==='home'||view==='topicSummary')topicStart();return true}
 if(action==='topicResume'){if(view==='home')topicResume();return true}
 if(action==='topicExit'){topicCaptureDraft();topicActive=false;persist();open('home');return true}
 if(action==='topicPrevious'){if(!topicActive||!topicSession())return true;const s=topicSession();topicCaptureDraft();if(view==='topicSummary')s.cursor=s.items.length-1;else if(s.cursor>0)s.cursor--;else return true;topicOpenCurrent();return true}
 if(action==='topicSkip'&&topicSessionMatches()){const row=topicCurrent();row.skipped=true;ReasoningSession.event(reasoningState().state,'skip');topicCaptureDraft();persist();topicAdvance();return true}
 if(action==='next'&&topicSessionMatches()){topicAdvance();return true}
 return false;
}
