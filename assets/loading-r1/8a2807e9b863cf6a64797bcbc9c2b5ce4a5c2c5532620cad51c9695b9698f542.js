'use strict';
const ReadingUI=window.ReadingUI;
const CATALOG=window.__AMC8_CATALOG;
const SKILL_DATA=window.__AMC8_SKILLS;
const EXAM_REVIEW=window.__AMC8_EXAM_REVIEW;
const COURSES={...FOUNDATION_COURSES,...EXTENSION_COURSES,...REMAINING_COURSES};
const RECORD_TASK_INDEX=new Map();
function indexRecordTask(task,context){RECORD_TASK_INDEX.set((task.contentVersion??5)+':'+task.id,{task,...context})}
for(const t of Object.values(JOINT_TASKS))indexRecordTask(t,{view:'joint',skillId:t.skillId,jointKind:t.joint.kind});
for(const [sid,tasks] of Object.entries(STAGED_TASKS))for(const [kind,t] of Object.entries(tasks))indexRecordTask(t,{view:'stage',skillId:sid,stageKind:kind});
for(const [name,bank] of Object.entries(PRACTICE_BANKS))for(const t of Object.values(bank))indexRecordTask(t,{view:name});
for(const t of Object.values(MICRO_TASKS))indexRecordTask(t,{view:'micro'});
for(const t of FRUIT_TASKS)indexRecordTask(t,{view:'fruit'});
for(const c of Object.values(COURSES))for(const t of c.steps)indexRecordTask(t,{view:'course'});
for(const tasks of Object.values(FOCUS_REVIEW))for(const t of tasks)indexRecordTask(t,{view:'transfer'});
for(const t of Object.values(SAMPLE_TASKS))indexRecordTask(t,{view:'sample'});
const FAMILIES=[['A','数与运算','🔢'],['R','比例与应用','⚖️'],['L','代数与规律','🧩'],['N','整数与数论','🔍'],['G','几何与测量','📐'],['C','集合与计数','🍎'],['D','数据与概率','📊'],['S','空间与逻辑','🧭']];
const STORE='tianle_amc8_qa_normal_rc79_v1';
const REVIEW_DELAY_MS=24*60*60*1000;
const CONTENT_REVISION=window.__AMC8_RELEASE.contentRevision;
const STORAGE_VERSION=window.__AMC8_RELEASE.storageVersion;
let storageMessage='',canPersist=true,storedRaw=null,actionMessage='';
const progressAdapter={test:window.__AMC8_STORAGE_TEST===true,onStatus:state=>{storedRaw=state.raw;if(state.status==='conflict'){canPersist=false;storageMessage='另一个页面更新了记录。当前草稿已保留，请导出后刷新。'}else if(state.status==='read_only')storageMessage='当前页面暂未取得保存权限。请关闭其他练习页面后重试；原记录保留。';else if(state.status==='unsaved')storageMessage='本次记录未能保存。请导出草稿后检查存储空间。';else if(state.status==='ready'&&canPersist)storageMessage='';syncStorageStatus()}};
let progressStore=ProgressStore.open(STORE,progressAdapter);
const CHANGED_AT_V2={A01:1,C02:0,D01:3,D02:5,D03:1,R03:1,G04:1,G06:0,G07:3,C03:0,S01:3,S02:2,L03:3,L04:1,N02:3,N03:1};
const CHANGED_AT_V3=Object.fromEntries(Object.keys(COURSES).map(code=>[code,4]));
const CHANGED_AT_V4={A01:1,...Object.fromEntries(Object.entries(EXPLORATIONS).map(([code,[step]])=>[code,step]))};
const CHANGED_AT_V5={A03:0,A05:1,R02:0,L01:1,N03:0,G04:0,G07:0,C03:1,D01:0};
const SCOPE_NOTES={A05:'负数的方向和正方形格数是两条不同的学习线，可以分别回看。',G03:'这里学习剪去和拼上的面积；“数出所有大小的正方形”是另一种题目。',G06:'先认出直角，再比较三边上的正方形面积。',G07:'试着用纸剪出六个方格，沿边折起来核对纸盒的六个面。'};
const root=document.getElementById('app');
let saved={topicPractice:{selectedTopicIds:[],session:null,nextSeed:1,legacySession:null},competition:competitionRestoreRecords(null),fruitFrontier:0,fruitCursor:0,seen:{},courses:{},errors:{},reviews:{},attempts:[],taskHistory:{},pendingFormal:{},skillStage:{},jointProgress:{},displaySeed:"",recommendationPins:[],contentRevision:CONTENT_REVISION,storageVersion:STORAGE_VERSION,upgradePending:{},upgradeFrontiers:{},legacyReviews:{}};
CompetitionIdentity.attachHistoryProvider(record=>{if(record!==saved.competition)return {};const r=TransferEvidenceStore.inspect(saved.rtm1);if(r.readOnly)return {historyUnknown:true};const history=TransferEvidenceStore.history(r.state);return {...history,assistedMathKeys:[...new Set(TransferEvidenceStore.events(r.state).filter(e=>['hint_revealed','hint_read_requested','method_exposed','answer_revealed'].includes(e.type)).map(e=>e.mathKey))]}});
let migrated=false;
try{
 storedRaw=localStorage.getItem(STORE);
 const old=JSON.parse(storedRaw||'null');
 if(storedRaw&&(!old||typeof old!=='object'||Array.isArray(old)))throw Error('Invalid progress');
 if(old&&typeof old==='object'){
  if(old.storageVersion>STORAGE_VERSION||old.contentRevision>CONTENT_REVISION){canPersist=false;storageMessage='这份学习记录来自更新的版本。为保留记录，当前页面暂不保存修改。';}
  else if(old.storageVersion!==STORAGE_VERSION){
   try{const backupKey=STORE+'_backup_before_v'+STORAGE_VERSION;if(localStorage.getItem(backupKey)===null)progressStore.backup(backupKey,storedRaw);migrated=true;}
   catch{canPersist=false;storageMessage='旧记录未能备份，本次进度暂未保存。请检查浏览器的存储权限或可用空间，原记录保持不变。';}
  }
  if(canPersist&&(old.contentRevision||0)<CONTENT_REVISION){
   try{const backupKey=STORE+'_backup_before_rc70_'+ProgressStore.digest(storedRaw).slice(0,12);progressStore.backup(backupKey,storedRaw);}
   catch{canPersist=false;storageMessage='升级前的原始记录未能备份，本次进度暂不保存。原记录保持不变，请检查浏览器存储空间或权限。';}
  }
  const frontier=Math.max(0,Math.min(FRUIT_TASKS.length,Number.isInteger(old.fruitFrontier)?old.fruitFrontier:Number.isInteger(old.fruitAt)?old.fruitAt:0));
  saved={...old,fruitFrontier:frontier,fruitCursor:Math.max(0,Math.min(frontier,Number.isInteger(old.fruitCursor)?old.fruitCursor:frontier)),seen:old.seen&&typeof old.seen==='object'?old.seen:{},courses:{},errors:old.errors&&typeof old.errors==='object'?old.errors:{},reviews:{},attempts:Array.isArray(old.attempts)?old.attempts.filter(a=>a&&typeof a==='object'):[],taskHistory:{},pendingFormal:{},skillStage:{},jointProgress:{},displaySeed:typeof old.displaySeed==='string'?old.displaySeed:'',recommendationPins:Array.isArray(old.recommendationPins)?[...new Set(old.recommendationPins.filter(code=>code==='C01'||!!COURSES[code]))].slice(0,4):[],contentRevision:CONTENT_REVISION,storageVersion:STORAGE_VERSION,upgradePending:old.upgradePending&&typeof old.upgradePending==='object'?old.upgradePending:{},upgradeFrontiers:{},legacyReviews:old.legacyReviews&&typeof old.legacyReviews==='object'?old.legacyReviews:{}};
  saved.competition=competitionRestoreRecords(old.competition);
  saved.topicPractice=topicRestoreState(old.topicPractice);
  for(const [fid,state] of Object.entries(old.jointProgress||{}))if(JOINT_FAMILIES.has(fid)&&state&&Array.isArray(state.records))saved.jointProgress[fid]={...state,records:state.records.filter(a=>a&&typeof a==='object'&&a.jointFacts?.familyId===fid)};
  for(const [sid,state] of Object.entries(old.skillStage||{}))if(STAGED_TASKS[sid]&&state&&typeof state==='object')saved.skillStage[sid]={transferPassed:state.transferPassed===true,independentTried:state.independentTried===true,independent2Tried:state.independent2Tried===true,cleanIndependentAt:Number.isFinite(state.cleanIndependentAt)&&state.cleanIndependentAt>0?state.cleanIndependentAt:0,cleanTaskId:[STAGED_TASKS[sid].independent.id,STAGED_TASKS[sid].independent2.id].includes(state.cleanTaskId)?state.cleanTaskId:'',delayedTried:state.delayedTried===true,delayedFirstCorrect:false,legacyDelayedFirstCorrect:state.legacyDelayedFirstCorrect===true||state.delayedFirstCorrect===true,cleanInstances:Array.isArray(state.cleanInstances)?state.cleanInstances:[],legacyCleanInstances:Array.isArray(state.legacyCleanInstances)?state.legacyCleanInstances:[],reviewInstances:Array.isArray(state.reviewInstances)?state.reviewInstances:[],legacyReviewInstances:Array.isArray(state.legacyReviewInstances)?state.legacyReviewInstances:[]};
  for(const [key,h] of Object.entries(old.taskHistory||{})){
   if(!/^\d+:[A-Z0-9-]+$/.test(key)||!h||typeof h!=='object')continue;
   const descriptor=RECORD_TASK_INDEX.get(key),motionPrediction=motionSavedPrediction(descriptor?.task,h.motionPrediction);
   saved.taskHistory[key]={submissions:Number.isInteger(h.submissions)&&h.submissions>0?h.submissions:0,legacyExposure:h.legacyExposure===true||!!(h.motionPrediction&&!motionPrediction&&descriptor?.task.mode==='motionLab'),modelViewed:h.modelViewed===true,hintEvents:Array.isArray(h.hintEvents)?h.hintEvents.filter(e=>e&&Number.isFinite(e.at)&&['hint','explore'].includes(e.kind)).slice(0,2):[],displayOrders:h.displayOrders&&typeof h.displayOrders==='object'?h.displayOrders:{},teachingExposure:Array.isArray(h.teachingExposure)?h.teachingExposure.filter(e=>e&&CURRICULUM.lessons[e.skillId]&&['concept','demonstration','practice','relation','application-feedback'].includes(e.kind)&&Number.isFinite(e.at)):[],motionPrediction,priorMotionExposure:Array.isArray(h.priorMotionExposure)?h.priorMotionExposure.filter(k=>/^\d+:[A-Z0-9-]+$/.test(k)).slice(-20):[],unverifiedMotionPrediction:h.unverifiedMotionPrediction??(h.motionPrediction&&!motionPrediction?h.motionPrediction:null),viewedAt:Number.isFinite(h.viewedAt)&&h.viewedAt>0?h.viewedAt:0,jointSignature:typeof h.jointSignature==='string'&&h.jointSignature.length<20000?h.jointSignature:null,priorNativeExposure:h.priorNativeExposure===true,priorJointExposure:Array.isArray(h.priorJointExposure)?h.priorJointExposure.filter(k=>/^\d+:[A-Z0-9-]+$/.test(k)).slice(-20):[],firstPrediction:h.firstPrediction&&Array.isArray(h.firstPrediction.values)&&h.firstPrediction.values.length>0&&h.firstPrediction.values.length<=8&&h.firstPrediction.values.every(n=>Number.isInteger(n)&&n>=-100&&n<=10000)&&Number.isFinite(h.firstPrediction.lockedAt)&&h.firstPrediction.lockedAt>0?{values:[...h.firstPrediction.values],lockedAt:h.firstPrediction.lockedAt}:null};
  }
  // A changed response rule does not make an already seen mathematical instance new.
  for(const key of new Set([...Object.keys(old.taskHistory||{}),...Object.keys(old.pendingFormal||{}),...(old.attempts||[]).filter(a=>typeof a.taskInstanceId==='string'&&Number.isInteger(a.contentVersion)).map(a=>a.contentVersion+':'+a.taskInstanceId)])){
   const split=key.indexOf(':'),id=key.slice(split+1),version=Number(key.slice(0,split));
   if(!Number.isInteger(version)||version>=82)continue;
   const d=[...RECORD_TASK_INDEX.values()].find(d=>d.task.id===id&&d.task.mode==='motionLab'&&d.task.firstResponseRuleVersion===1);
   if(d){const h=taskHistory(d.task);h.legacyExposure=true;h.priorMotionExposure??=[];if(!h.priorMotionExposure.includes(key))h.priorMotionExposure.push(key)}
  }
  for(const [key,p] of Object.entries(old.pendingFormal||{})){const d=RECORD_TASK_INDEX.get(key);if(['stage','joint'].includes(d?.view)&&p?.taskId===d.task.id&&p.contentVersion===taskVersion(d.task)&&Number.isFinite(p.openedAt)&&assessmentEvidenceContext(d.task,d).formalEligible)saved.pendingFormal[key]={taskId:d.task.id,contentVersion:taskVersion(d.task),skillId:d.task.skillId,stageKind:d.stageKind||null,view:d.view,openedAt:p.openedAt};else{const current=JOINT_TASKS[p?.taskId];if(current&&key===p.contentVersion+':'+p.taskId&&p.view==='joint'&&Number.isFinite(p.openedAt)&&p.openedAt>0&&jointPriorRoleContract(current,p.contentVersion)){saved.pendingFormal[key]={taskId:p.taskId,contentVersion:p.contentVersion,skillId:current.skillId,stageKind:null,view:'joint',openedAt:p.openedAt,legacyContract:true};const h=taskHistory(current);h.legacyExposure=true;h.priorJointExposure??=[];if(!h.priorJointExposure.includes(key))h.priorJointExposure.push(key);h.jointSignature??=jointMathSignature(current);h.viewedAt=h.viewedAt?Math.min(h.viewedAt,p.openedAt):p.openedAt}}}
  const loggedCounts={};
  for(const a of saved.attempts){
   a.hintEvents=Array.isArray(a.hintEvents)?a.hintEvents.filter(e=>e&&Number.isFinite(e.at)&&['hint','explore'].includes(e.kind)):[];
   if(typeof a.taskInstanceId==='string'&&Number.isInteger(a.contentVersion)){
    const key=a.contentVersion+':'+a.taskInstanceId,h=saved.taskHistory[key]??(saved.taskHistory[key]=emptyHistory());
    loggedCounts[key]=(loggedCounts[key]||0)+1;h.submissions=Math.max(h.submissions,loggedCounts[key]);
    h.modelViewed=h.modelViewed||a.modelViewed===true;
    for(const e of Array.isArray(a.hintEvents)?a.hintEvents:[])if(e&&Number.isFinite(e.at)&&['hint','explore'].includes(e.kind)&&!h.hintEvents.some(x=>x.kind===e.kind))h.hintEvents.push(e);
   }
   if(a.evidenceRuleVersion!==ASSESSMENT_RULES.version)migrated=true;
   assessmentMigrateAttempt(a,RECORD_TASK_INDEX.get(a.contentVersion+':'+a.taskInstanceId));
  }
  for(const [sid,state] of Object.entries(saved.skillStage)){
   saved.skillStage[sid]=assessmentStageProgress(state,STAGED_TASKS[sid],saved.attempts);
   saved.skillStage[sid]=assessmentReviewProgress(saved.skillStage[sid],STAGED_TASKS[sid],saved.attempts);
  }
  for(const [code,course] of Object.entries(COURSES)){
   const record=old.courses?.[code];if(!record)continue;
   const n=Math.max(0,Math.min(course.steps.length,Number.isInteger(record.frontier)?record.frontier:0));
   saved.courses[code]={frontier:n,cursor:Math.max(0,Math.min(n,Number.isInteger(record.cursor)?record.cursor:n))};
  }
  for(const code of FOCUS_CODES){
   const review=old.reviews?.[code];if(!review||!Number.isFinite(review.dueAt))continue;
   saved.reviews[code]={dueAt:review.dueAt,cursor:Math.max(0,Math.min(FOCUS_REVIEW[code].length,Number.isInteger(review.cursor)?review.cursor:0)),clean:review.clean===true,verifiedAt:Number.isFinite(review.verifiedAt)?review.verifiedAt:0,result:review.result==='retry'?'retry':''};
  }
  for(const code of Object.keys(saved.upgradePending)){
   const record=saved.courses[code];if(!record||!COURSES[code]){delete saved.upgradePending[code];continue}
   const prior=old.upgradeFrontiers?.[code];
   saved.upgradeFrontiers[code]=Math.max(0,Math.min(COURSES[code].steps.length,Number.isInteger(prior)?prior:record.cursor));
   record.cursor=Math.min(record.cursor,saved.upgradeFrontiers[code]);
  }
  // A historical completed step proves prior exposure, not independent success.
  for(const [code,tasks] of [['C01',FRUIT_TASKS],...Object.entries(COURSES).map(([code,c])=>[code,c.steps])]){
   const frontier=code==='C01'?saved.fruitFrontier:saved.courses[code]?.frontier||0;
   for(const t of tasks.slice(0,frontier)){
    const key=taskVersion(t)+':'+t.id;if(!saved.taskHistory[key])saved.taskHistory[key]={...emptyHistory(),legacyExposure:true};
   }
  }
  for(const code of Object.keys(saved.seen))if(saved.seen[code]&&SAMPLE_TASKS[code]){
   const key=taskVersion(SAMPLE_TASKS[code])+':'+SAMPLE_TASKS[code].id;if(!saved.taskHistory[key])saved.taskHistory[key]={...emptyHistory(),legacyExposure:true};
  }
  if(old.contentRevision!==CONTENT_REVISION){
   const changes=old.contentRevision>=5?[]:old.contentRevision===4?[CHANGED_AT_V5]:old.contentRevision===3?[CHANGED_AT_V4,CHANGED_AT_V5]:old.contentRevision===2?[CHANGED_AT_V3,CHANGED_AT_V4,CHANGED_AT_V5]:[CHANGED_AT_V2,CHANGED_AT_V3,CHANGED_AT_V4,CHANGED_AT_V5];
   const changed={};for(const update of changes)for(const [code,i] of Object.entries(update))changed[code]=Math.min(changed[code]??i,i);
   for(const [code,i] of Object.entries(changed)){
    const record=saved.courses[code];if(!record||record.frontier<=i)continue;
    saved.upgradePending[code]=true;record.cursor=Math.min(record.cursor,i);saved.upgradeFrontiers[code]=Math.min(saved.upgradeFrontiers[code]??i,i);
    const review=saved.reviews[code];if(review?.verifiedAt){saved.legacyReviews[code]=review.verifiedAt;review.verifiedAt=0}
    migrated=true;
   }
  }
 }
}catch{canPersist=false;storageMessage='学习记录未能读取，本次进度暂未保存。请保留当前浏览器数据，修复存储问题后再试。';}
if(!canPersist)progressStore.close();
if(canPersist&&storedRaw){const oldRevision=JSON.parse(storedRaw).contentRevision||0;if(oldRevision<CONTENT_REVISION){saved.migrationReceipts={...(saved.migrationReceipts||{}),rc70:{fromContentRevision:oldRevision,toContentRevision:CONTENT_REVISION,sourceHash:ProgressStore.digest(storedRaw),workSchema:2}}}}
const periodicHistoryTimes=[...(saved.competition.attempts||[]).map(a=>a.at),...Object.values(saved.rtm1?.eventsById||{}).map(e=>e.at)].filter(t=>Number.isFinite(t)&&t>0);
saved.periodicPractice=PeriodicPractice.restore(saved.periodicPractice,periodicHistoryTimes.length?periodicHistoryTimes.reduce((a,b)=>Math.min(a,b),Infinity):Date.now());
let homePortal=true,parentMathEdit=false;
let view='home',sampleCode='',courseCode='',microSkillId='',stageSkillId='',stageKind='',filterYear='',filterTopic='',catalogPage=0;
let draft=freshDraft(),feedback=null,hintOpen=false,modelOpen=false,exploreOpen=false,speechMessage='',speechSequence=0;
function freshDraft(){return {selected:[],choice:-1,reason:-1,number:'',tokens:[],entries:[],explore:[],tens:0,ones:0,bundled:false,moves:0,position:null,values:null,source:-1,barHeights:[],work:null,startedAt:Date.now(),hintEvents:[],modelViewed:false,submissions:0}}
function syncStorageStatus(){const target=document.getElementById('storage-status');if(target){target.textContent=storageMessage;target.hidden=!storageMessage;
 if(storageMessage&&typeof document.createElement==='function'){
  const retry=document.createElement('button');retry.type='button';retry.dataset.action='storageRetry';retry.textContent='重试保存权限';target.appendChild(retry);
  const exportButton=document.createElement('button');exportButton.type='button';exportButton.dataset.action='progressExport';exportButton.textContent='导出记录与草稿';target.appendChild(exportButton);
 }
}}
function retryStorage(){
 if(!canPersist){storageMessage='记录存在冲突或版本不兼容，请先导出草稿，再刷新核对。';syncStorageStatus();return}
 const result=progressStore.retry();
 if(result.reason==='PENDING_DRAFT')storageMessage='本页有未保存草稿，请先导出，再刷新核对。';
 else if(result.reason==='LOCK_UNAVAILABLE')storageMessage='当前浏览器不能取得安全保存权限。请导出草稿，使用支持保存锁的浏览器。';
 else if(result.reason==='ACQUIRING')storageMessage='正在重新取得保存权限…';
 syncStorageStatus();
}
function jointPendingRecords(record=saved){return [...(record.attempts||[]),...Object.values(record.jointProgress||{}).flatMap(s=>s.records||[])].filter(a=>a.jointFacts&&a.pendingSave===true)}
function persist(){
 let outcome={ok:false,reason:'READ_ONLY'};topicCaptureDraft();if(canPersist){saved.profileRevision=(saved.profileRevision||0)+1;const pending=jointPendingRecords(),snapshot=pending.length?JSON.parse(JSON.stringify(saved)):saved;for(const a of jointPendingRecords(snapshot))delete a.pendingSave;const result=progressStore.commit(snapshot,storedRaw);outcome=result;if(result.ok){for(const a of pending)delete a.pendingSave;storedRaw=result.raw;storageMessage=''}else if(result.reason==='CONFLICT'){canPersist=false;storageMessage='另一个页面更新了记录。本页草稿仍在，请先导出再刷新。'}else if(!result.pending)storageMessage='本次记录未能保存，草稿仍在，可导出后再试。';}syncStorageStatus();return outcome;
}
function progressSnapshot(){
 const backups={};let currentStoredRecord=null,storageReadError=null;try{for(let i=0;i<(localStorage.length||0);i++){const key=localStorage.key(i);if(key&&key.startsWith(STORE+'_backup_'))backups[key]=localStorage.getItem(key)}currentStoredRecord=localStorage.getItem(STORE)}catch{storageReadError='STORAGE_READ_UNAVAILABLE'}
 const task=taskNow(),currentTaskDraft=task?{format:'unsaved-task-draft-v1',view,taskId:task.id,contentVersion:taskVersion(task),mathSignature:task.joint?jointMathSignature(task):taskFingerprint(task),draft:JSON.parse(JSON.stringify(draft)),feedback:feedback?{...feedback}:null,claim:'草稿和待保存首答用于恢复核对，不自动授予通过或独立证据。'}:null;
 let academyRecord=null;try{academyRecord=localStorage.getItem('tianle_academy_v5_prototype')}catch{}
 return {format:'tianle-record-backup-v1',exportedAt:new Date().toISOString(),release:window.__AMC8_RELEASE,store:STORE,record:JSON.parse(JSON.stringify(saved)),reading:ReadingUI.snapshot(),academyRecord,rtmDraft:ExamMappingUI.exportDraft(),currentTaskDraft,pendingJointAttemptIds:[...new Set(jointPendingRecords().map(a=>a.id))],currentStoredRecord,storageReadError,backups};
}
function progressExport(){
 if(typeof document.createElement!=='function')return;const url=URL.createObjectURL(new Blob([JSON.stringify(progressSnapshot(),null,2)],{type:'application/json'})),a=document.createElement('a');a.href=url;a.download='tianle-learning-records-'+Date.now()+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
}

function emptyHistory(){return {submissions:0,legacyExposure:false,modelViewed:false,hintEvents:[],displayOrders:{},firstPrediction:null,motionPrediction:null};}
function displayOrder(task,kind){
 const list=kind==='reason'?task.reason?.options:kind==='objects'?task.objects:task.options;if(!list)return [];
 const h=taskHistory(task),ids=list.map((_,i)=>assessmentOptionId(task,kind,i));h.displayOrders??={};
 const prior=Array.isArray(h.displayOrders[kind])?h.displayOrders[kind].map(id=>ids.indexOf(id)):[];if(assessmentValidOrder(prior,list.length))return prior;
 if(!saved.displaySeed)saved.displaySeed=`${Date.now()}-${Math.random().toString(36).slice(2)}`;
 const order=task.displayOrderPolicy==='ordered'?list.map((_,i)=>i):assessmentPermutation(list.length,`${saved.displaySeed}:${task.id}:${taskVersion(task)}:${kind}`);
 h.displayOrders[kind]=order.map(i=>ids[i]);persist();return order;
}
function taskVersion(task){return task.contentVersion??5}
function taskHistory(task){const key=taskVersion(task)+':'+task.id;return saved.taskHistory[key]??(saved.taskHistory[key]=emptyHistory());}
function noteSupport(kind){const task=taskNow();if(!task)return;const h=taskHistory(task);if(kind==='model')h.modelViewed=true;else if(!h.hintEvents.some(e=>e.kind===kind))h.hintEvents.push({at:Date.now(),kind});persist();}
function recordAttempt(task,ok){
 // Only explicitly curated partial links are recorded; a task result is not mastery.
 const answer={selected:[...draft.selected],selectedIds:draft.selected.map(i=>assessmentOptionId(task,task.objects?'objects':'options',i)),choice:draft.choice,choiceId:draft.choice<0?null:assessmentOptionId(task,'options',draft.choice),reason:draft.reason,reasonId:draft.reason<0?null:assessmentOptionId(task,'reason',draft.reason),displayOrders:{...taskHistory(task).displayOrders},number:draft.number,tokens:[...draft.tokens],entries:[...draft.entries],explore:[...draft.explore]};
 const operationSummary={mode:task.mode,moves:draft.moves,position:draft.position,values:draft.values?[...draft.values]:null,bundled:draft.bundled,tens:draft.tens,ones:draft.ones,barHeights:[...draft.barHeights],work:draft.work?JSON.parse(JSON.stringify(draft.work)):null};
 const skillIds=task.joint?[...task.joint.targetNodeIds]:SKILL_DATA.skills.filter(skill=>skill.taskIds.includes(task.id)).map(skill=>skill.id);
 const history=taskHistory(task),first=history.submissions===0&&!history.legacyExposure;
 const context=assessmentEvidenceContext(task,{view,stageKind}),unassistedFirstSubmissionCorrect=first&&ok&&!history.hintEvents.length&&!history.modelViewed;
 const attempt={id:`${sessionId}-${++attemptSequence}`,taskInstanceId:task.id,skillIds,contentVersion:taskVersion(task),evidenceVersion:2,evidenceRuleVersion:ASSESSMENT_RULES.version,...context,startedAt:draft.startedAt,submittedAt:Date.now(),firstSubmissionCorrect:first&&ok,unassistedFirstSubmissionCorrect,independent:context.formalEligible&&unassistedFirstSubmissionCorrect,repeatOfKnownInstance:!first,hintEvents:[...history.hintEvents],teachingExposure:[...(history.teachingExposure||[])],motionFirstResponse:history.motionPrediction?JSON.parse(JSON.stringify(history.motionPrediction)):null,modelViewed:history.modelViewed,operationSummary,answer,gradingResult:ok?'correct':'incorrect',explanationEvidence:task.reason?{selected:draft.reason,selectedId:answer.reasonId,correct:answer.reasonId===assessmentOptionId(task,'reason',task.reason.answer)}:null,phase:task.phase||'样题',stageKind:view==='stage'?stageKind:null,changeDimension:view==='stage'?task.changeDimension:null,sessionId,diagnosticFollowUpId:null};
 if(task.joint){const result=taskAdapter(task).grade(task);attempt.jointFacts=jointFacts(task,result);rememberJointRecord(attempt)}
 saved.attempts.push(attempt);
 delete saved.pendingFormal[taskVersion(task)+':'+task.id];
 if(task.joint)for(const id of [...task.joint.targetNodeIds,...task.joint.supportNodeIds])noteTeachingExposure(id,'application-feedback');
 history.submissions++;
 draft.submissions++;
 if(view==='stage'){
  const state=saved.skillStage[stageSkillId]??(saved.skillStage[stageSkillId]={});
  if(stageKind==='transfer'&&ok)state.transferPassed=true;
  if(stageKind==='independent')state.independentTried=true;
  if(stageKind.startsWith('independent'))state[stageKind+'Tried']=true;
  if(stageKind.startsWith('independent'))Object.assign(state,assessmentStageProgress(state,STAGED_TASKS[stageSkillId],saved.attempts));
  if(stageKind.startsWith('delayed')){state[stageKind+'Tried']=true;Object.assign(state,assessmentReviewProgress(assessmentStageProgress(state,STAGED_TASKS[stageSkillId],saved.attempts),STAGED_TASKS[stageSkillId],saved.attempts))}
 }

 const outcome=persist();if(task.joint&&!outcome.ok){attempt.pendingSave=true;for(const state of Object.values(saved.jointProgress))for(const record of state.records||[])if(record.id===attempt.id)record.pendingSave=true;}
}
const sessionId=`${Date.now()}-${Math.random().toString(36).slice(2)}`;
let attemptSequence=0;
if(migrated)persist();
function esc(x){return String(x).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function titleFor(code){return CATALOG.topics.find(t=>t.code===code)?.title||code}
function courseRecord(code){if(!COURSES[code])return null;return saved.courses[code]??(saved.courses[code]={frontier:0,cursor:0})}
function finished(code){return code==='C01'?saved.fruitFrontier===FRUIT_TASKS.length:!!COURSES[code]&&!saved.upgradePending[code]&&courseRecord(code).frontier===COURSES[code].steps.length}
function reviewRecord(code){if(!FOCUS_REVIEW[code]||!finished(code)||saved.upgradePending[code])return null;if(!saved.reviews[code]){saved.reviews[code]={dueAt:Date.now()+REVIEW_DELAY_MS,cursor:0,clean:true,verifiedAt:0,result:''};persist()}return saved.reviews[code]}
function reviewStatus(code){if(saved.upgradePending[code])return '新版内容待复习';const r=reviewRecord(code);return !r?(finished(code)?'路线走完':'学习中'):r.verifiedAt?'隔日两题通过':Date.now()<r.dueAt?'隔日巩固待开放':'隔日巩固可挑战'}
function reviewAction(code){const r=reviewRecord(code);if(!r||r.verifiedAt)return '';return `${r.result==='retry'?'<p class="retry-note">上次巩固中有一题先答错了。已经练习过，24小时后可重新独立挑战。</p>':''}<button class="primary" data-action="transfer" data-code="${esc(code)}" ${Date.now()<r.dueAt?'disabled':''}>${Date.now()<r.dueAt?'隔日巩固待开放':'开始隔日巩固 · 2题'}</button><p class="tiny-note">${Date.now()<r.dueAt?'请在完成路线24小时后，于同一浏览器回来。':'换情境独立解答，两题首答正确才记录这组巩固题通过。'}这不是整个考点的掌握认证。</p>`}
function todayCodes(){
 const candidates=[...saved.recommendationPins,...['C01',...Object.keys(COURSES)].filter(code=>{
  const n=code==='C01'?saved.fruitFrontier:courseRecord(code).frontier;
  return n>0&&!finished(code);
 }), 'A01','C01','A02','D01','L01'];
 return [...new Set(candidates)].filter(code=>code==='C01'||COURSES[code]).slice(0,4);
}
function todayPanel(){return `<section class="panel today-panel"><div><h2>今天可以探索</h2><p class="tiny-note">最多四个入口；按手动置顶、当前进度和起步路线展示。只是导航建议，不表示已掌握先修。</p></div><div class="today-list">${todayCodes().map(code=>`<div class="today-item"><button class="secondary" data-action="network" data-code="${code}">${esc(titleFor(code))}</button><button class="secondary mini" data-action="todayPin" data-code="${code}" aria-pressed="${saved.recommendationPins.includes(code)}">${saved.recommendationPins.includes(code)?'取消置顶':'置顶'}</button></div>`).join('')}</div><p class="tiny-note">全部${CATALOG.topics.length}区域在下方知识地图里都可打开。</p></section>`}
function open(viewName,code=''){
 if(viewName!=='home'||homePortal)parentMathEdit=false;
 if(view==='reading'&&viewName!=='reading')ReadingUI.leave();
 ExamMappingUI.stop();
 topicCaptureDraft();if(topicActive&&!topicOpening&&!['learn','demo'].includes(viewName))topicActive=false;
 if(viewName==='network'&&!networkSelect(code||networkSkillId))return;
 demoStop();if(viewName==='joint'){jointTaskId=code;const t=JOINT_TASKS[code];if(['G','C'].includes(t?.joint.kind))for(const id of [...t.joint.targetNodeIds,...t.joint.supportNodeIds])noteTeachingExposure(id,'practice')}if(viewName==='learn'){learnTab='definition';learnCounterOpen=false;noteTeachingExposure(code,'concept')}if(viewName==='demo'){demoSkillId=code;demoCursor=0;noteTeachingExposure(code,'demonstration')}if(PRACTICE_BANKS[viewName]?.[code])noteTeachingExposure(code,'practice');
 if('speechSynthesis' in window)try{window.speechSynthesis.cancel()}catch{}
 view=viewName;sampleCode=code;courseCode=code;microSkillId=code;stageSkillId='';stageKind='';if(viewName==='stage'){[stageSkillId,stageKind]=code.split('|');microSkillId=stageSkillId}draft=freshDraft();feedback=null;hintOpen=false;modelOpen=false;exploreOpen=false;speechMessage='';speechSequence++;if(viewName==='joint'&&taskNow())prepareJointOpen(taskNow());if(taskNow()&&(!TASK_PLAYERS[view]?.readOnly||view==='demo')){const h=taskHistory(taskNow());if(!h.viewedAt)h.viewedAt=Date.now();persist()}rememberFormalOpen(taskNow());if(!topicOpening)render();window.scrollTo({top:0,behavior:'instant'})
}
function treeArt(){return `<div class="tree-art" aria-hidden="true"><div class="sun"></div><div class="hill"></div><svg viewBox="0 0 440 310" role="presentation"><path d="M214 300 Q216 235 212 180 M211 232 Q146 159 94 134 M211 217 Q278 147 347 114 M208 181 Q174 126 143 91 M218 184 Q259 107 293 73" fill="none" stroke="#654d36" stroke-width="24" stroke-linecap="round"/><path d="M214 300 Q216 235 212 180 M211 232 Q146 159 94 134 M211 217 Q278 147 347 114 M208 181 Q174 126 143 91 M218 184 Q259 107 293 73" fill="none" stroke="#8d6843" stroke-width="9" stroke-linecap="round"/><ellipse cx="215" cy="89" rx="170" ry="75" fill="#428565"/><ellipse cx="153" cy="68" rx="88" ry="57" fill="#5a9a65"/><ellipse cx="311" cy="79" rx="93" ry="61" fill="#4e9468"/><ellipse cx="219" cy="51" rx="77" ry="49" fill="#69a76b"/><g fill="#f8d572" stroke="#fff2bb" stroke-width="3"><circle cx="105" cy="102" r="11"/><circle cx="149" cy="57" r="10"/><circle cx="193" cy="100" r="12"/><circle cx="254" cy="35" r="11"/><circle cx="290" cy="101" r="12"/><circle cx="345" cy="81" r="10"/></g><g fill="#efffcf" font-size="15" font-weight="bold"><text x="100" y="108">✦</text><text x="144" y="63">✦</text><text x="188" y="106">✦</text><text x="249" y="41">✦</text><text x="285" y="107">✦</text><text x="340" y="87">✦</text></g></svg></div>`}
function home(){for(const t of CATALOG.topics)reviewRecord(t.code);return homePortal?LearningPortal.page():topicSelectionPage()}
function knowledgeHome(){
 // Preserve historical route review clocks without treating them as node mastery.
 for(const t of CATALOG.topics)reviewRecord(t.code);
 return `<section class="hero"><div class="hero-copy"><div class="eyebrow">数学 · 相连的知识森林</div><h1>先看懂，再把知识用起来。</h1><p>从一个知识点出发，自己动手，再看看它能联系到哪里。</p><div class="hero-cta"><button class="primary" data-action="network" data-code="A01">从数与数量出发 →</button><button class="light-button" data-action="network" data-code="C01">🍎 探索集合与重叠</button></div></div>${treeArt()}</section>${todayPanel()}<div class="section-head"><div><h2>${CATALOG.topics.length} 盏知识灯</h2><p>33 个区域，179 个相连的知识点。点开一盏灯，看概念、自己操作、挑战新题。</p></div><span class="note-chip">${FAMILIES.length} 个主题 · ${CATALOG.topics.length} 个区域</span></div><div class="forest">${FAMILIES.map(([key,name,icon])=>`<section class="branch"><h3><span>${icon}</span>${name}</h3><div class="lamps">${CATALOG.topics.filter(t=>t.code.startsWith(key)).map(t=>{
  const progress=knowledgeRegionSummary(t.code),status=progress.qualified?`${progress.qualified}/${progress.skills}点有独立新题证据`:`${progress.skills}个知识点`;
  return `<button class="lamp focus ${progress.qualified?'seen':''}" data-action="network" data-code="${esc(t.code)}" aria-label="${esc(titleFor(t.code))}，${esc(status)}"><span class="lamp-glow">✦</span><b>${esc(titleFor(t.code))}</b><small>${esc(status)}${saved.upgradePending[t.code]?' · 旧路线新版待复习':''}</small></button>`
 }).join('')}</div></section>`).join('')}</div>${contentCounts()}`
}

function contentCounts(){
 const route=FRUIT_TASKS.length+Object.values(COURSES).reduce((n,c)=>n+c.steps.length,0),samples=Object.keys(SAMPLE_TASKS).length,reviews=Object.values(FOCUS_REVIEW).reduce((n,tasks)=>n+tasks.length,0),micro=Object.keys(MICRO_TASKS).length,workshop=Object.keys(WORKSHOP_TASKS).length,staged=Object.values(STAGED_TASKS).reduce((n,tasks)=>n+Object.keys(tasks).length,0),fraction=Object.keys(FRACTION_TASKS).length,percent=Object.keys(PERCENT_TASKS).length,integer=Object.keys(INTEGER_TASKS).length,ratio=Object.keys(RATIO_TASKS).length,rate=Object.keys(RATE_TASKS).length,journey=Object.keys(JOURNEY_TASKS).length,scale=Object.keys(SCALE_TASKS).length,equation=Object.keys(EQUATION_TASKS).length,constraint=Object.keys(CONSTRAINT_TASKS).length,pattern=Object.keys(PATTERN_TASKS).length,coordinate=Object.keys(COORDINATE_TASKS).length,grouping=Object.keys(GROUPING_TASKS).length,factor=Object.keys(FACTOR_TASKS).length,common=Object.keys(COMMON_TASKS).length,cycle=Object.keys(CYCLE_TASKS).length,measure=Object.keys(MEASURE_TASKS).length,angle=Object.keys(ANGLE_TASKS).length,composite=Object.keys(COMPOSITE_TASKS).length,circle=Object.keys(CIRCLE_TASKS).length,similar=Object.keys(SIMILAR_TASKS).length,right=Object.keys(RIGHT_TASKS).length,solid=Object.keys(SOLID_TASKS).length,sets=Object.keys(SETS_TASKS).length,invariant=Object.keys(INVARIANT_TASKS).length,motion=Object.keys(MOTION_TASKS).length,chance=Object.keys(CHANCE_TASKS).length,stats=Object.keys(STATS_TASKS).length,chart=Object.keys(CHART_TASKS).length,combin=Object.keys(COMBIN_TASKS).length;
 const linked=SKILL_DATA.skills.filter(s=>s.taskIds.length).length,published=SKILL_DATA.skills.filter(s=>s.releaseStatus==='published').length,families=Object.keys(STAGED_TASKS).length,manipulatives=workshop+fraction+percent+integer+ratio+rate+journey+scale+equation+constraint+pattern+coordinate+grouping+factor+common+cycle+measure+angle+composite+circle+similar+right+solid+sets+combin+chart+stats+chance+motion+invariant;
 return `<details class="panel content-counts"><summary>家长：内容数量与验收范围</summary><section class="content-counts" aria-label="当前内容数量"><div class="content-count-grid"><div><strong>${CATALOG.topics.length}</strong><span>可打开单元</span></div><div><strong>${published}</strong><span>已发布微技能</span></div><div><strong>${route+samples+reviews+micro+manipulatives+staged+Object.keys(DEMO_TASKS).length+Object.keys(JOINT_TASKS).length}</strong><span>已编写固定任务</span></div><div><strong>${CATALOG.entries.length}</strong><span>真题索引题位</span></div></div><p class="tiny-note">规划 ${SKILL_DATA.skills.length} 个微技能，${linked} 个已有部分任务链接；已编写 ${Object.keys(DEMO_TASKS).length} 个不同实例的可回放操作示范、${micro} 个对象辨识题、${manipulatives} 个动手操作题，以及 ${families} 组阶段题族、共 ${staged} 个写定实例。每组含迁移、独立主备和隔日新题，部分须解锁或隔日开放。操作链接仍是局部覆盖，逐项解释、完整六阶段、教材真题对应与设备验收继续记录。固定任务另含 ${route} 个路线步骤、${samples} 个样题和 ${reviews} 个隔日题。实际共享题另有 ${JOINT_FAMILIES.size} 族、${Object.keys(JOINT_TASKS).length} 个共同目标实例，支持知识不自动得分；其余 ${SKILL_DATA.skills.length-JOINT_FAMILIES.size} 族仍待编写。真题索引不计入已编写任务。<button class="secondary mini" data-action="skillMap">查看微技能任务 →</button></p></section></details>`;
}
function stepBadge(task,i,total,frontier){return `<span class="phase">${esc(task.phase)} · ${i+1}/${total}</span><div class="step-bar" role="progressbar" aria-label="已完成步骤" aria-valuenow="${frontier}" aria-valuemin="0" aria-valuemax="${total}"><i style="width:${frontier/total*100}%"></i></div>`}
function peopleBoard(clickable){return `<div class="board"><h3>这 7 张卡始终是同一批小朋友</h3><div class="people">${PEOPLE.map((p,i)=>{const tag=clickable?'button':'div',attr=clickable?`data-action="person" data-index="${i}" aria-pressed="${draft.selected.includes(i)}"`:'';return `<div class="person-wrap"><${tag} class="person ${p.group} ${draft.selected.includes(i)?'selected':''}" ${attr}><span class="face">${['🧒','👧','🧒','👧','🧒','👧','🧒'][i]}</span><strong>${esc(p.name)}</strong><span class="fruit">${p.fruit}</span></${tag}><button class="read-inline person-speech" data-action="speakPerson" data-index="${i}" aria-label="只朗读${esc(p.name)}的卡片">🔊</button></div>`}).join('')}</div><div class="legend"><span class="r">红＝只苹果 2</span><span class="o">橙＝两种都喜欢 3</span><span class="y">黄＝只香蕉 2</span></div></div>`}
function groupNames(task){return task.groupLabels|| (task.prompt.includes('绘画')?['绘画','音乐']:['苹果','香蕉'])}
function fruitBoard(task){if(!task.counts)return peopleBoard(task.mode==='people');const n=parts(task.counts),[a,b]=groupNames(task),showOnly=task.mode==='formula';return `<div class="board"><div class="full-groups"><span>${esc(a)}整组 <b>${n.A}</b></span><span>${esc(b)}整组 <b>${n.B}</b></span><span>共同 <b>${n.O}</b></span></div><div class="groups"><div class="group r"><span>只${esc(a)}</span><b>${showOnly?n.R:'?'}</b></div><div class="group o"><span>两种都参加</span><b>${n.O}</b></div><div class="group y"><span>只${esc(b)}</span><b>${showOnly?n.Y:'?'}</b></div></div><p class="tiny-note">红＝只${esc(a)} · 橙＝两种都有 · 黄＝只${esc(b)}。完整的${esc(a)}组含红＋橙；${esc(b)}组含橙＋黄。</p></div>`}
function choices(task){const many=task.mode==='multi'||task.mode==='pairs';return `<div class="answer-list">${displayOrder(task,'options').map((i,pos)=>{const option=task.options[i];return `<div class="option-unit"><button class="answer-option ${draft.choice===i||draft.selected.includes(i)?'selected':''}" data-action="${many?'multi':'choice'}" data-index="${i}" data-option-id="${esc(assessmentOptionId(task,'options',i))}" aria-pressed="${many?draft.selected.includes(i):draft.choice===i}">${esc(option)}</button><button class="read-inline option-speech" data-action="speakOption" data-index="${i}" aria-label="只朗读第${pos+1}个选项">🔊</button></div>`}).join('')}</div>`}
function reasonBlock(task){if(!task.reason)return '';const r=task.reason;return `<div class="reason-block"><h3>先说理由，再选依据</h3><button class="read-inline" data-action="speakReasonPrompt" aria-label="朗读为什么这样做">🔊 听理由题</button><p>${esc(r.prompt)}</p><div class="answer-list">${displayOrder(task,'reason').map((i,pos)=>{const option=r.options[i];return `<div class="option-unit"><button class="answer-option ${draft.reason===i?'selected':''}" data-action="reason" data-index="${i}" data-option-id="${esc(assessmentOptionId(task,'reason',i))}" aria-pressed="${draft.reason===i}">${esc(option)}</button><button class="read-inline option-speech" data-action="speakReasonCard" data-index="${i}" aria-label="只朗读第${pos+1}张依据卡">🔊</button></div>`}).join('')}</div><p class="tiny-note">选一张最能说明你做法的依据卡。</p></div>`}
function exploreBlock(task){if(!task.explore)return '';const x=task.explore;return `<div class="explore-block"><button class="secondary mini" data-action="exploreToggle" aria-expanded="${exploreOpen}">${exploreOpen?'收起思路卡':'想解释自己的做法？点开思路卡（可选）'}</button>${exploreOpen?`<p>${esc(x.prompt)}</p><button class="read-inline" data-action="speakExplorePrompt">🔊 听思路题</button><div class="explore-chain" aria-label="已摆出的步骤">${draft.explore.length?draft.explore.map((i,n)=>`<span>${n+1}. ${esc(x.cards[i])}</span>`).join('<b aria-hidden="true">→</b>'):'<span class="empty">可以选两张卡，说说自己怎么想</span>'}</div><div class="explore-cards">${x.cards.map((card,i)=>`<div class="option-unit"><button class="secondary" data-action="explorePick" data-index="${i}" ${draft.explore.includes(i)||draft.explore.length>=2?'disabled':''}>${esc(card)}</button><button class="read-inline option-speech" data-action="speakExploreCard" data-index="${i}" aria-label="只朗读第${i+1}张思路卡">🔊</button></div>`).join('')}</div><button class="secondary mini" data-action="exploreUndo" ${draft.explore.length?'':'disabled'}>↩ 撤销上一步</button>`:''}</div>`}
function formula(task){const n=parts(task.counts),[a,b]=groupNames(task),names={R:'只'+a,O:'两种都参加',Y:'只'+b,A:a+'整组',B:b+'整组'};return `<div class="formula-display" aria-label="已经组装的算式">${draft.tokens.length?draft.tokens.map(x=>x==='+'||x==='-'?`<span>${x==='-'?'−':'＋'}</span>`:`<span>${n[x]}</span>`).join(''):'<span class="blank">先点一张人数卡，再点 ＋ 或 −，接着点下一张人数卡</span>'}</div><div class="chip-row">${task.allowed.map(id=>`<button class="term ${id.toLowerCase()}" data-action="term" data-id="${id}" aria-label="${esc(names[id])} ${n[id]} 人">${n[id]}<small>${esc(names[id])}</small></button>`).join('')}</div><div class="chip-row"><button class="operator" data-action="op" data-id="+" aria-label="加号">＋</button><button class="operator" data-action="op" data-id="-" aria-label="减号">−</button></div><div class="line-actions"><button data-action="undo">↩ 撤销一步</button><button data-action="clear">清空算式</button></div><p class="tiny-note">系统按红、橙、黄三块各被数几次来判定，不只核对最终数字。</p>`}
function feedbackHtml(){return feedback?`<div class="feedback ${feedback.ok?'good':'wrong'}" role="status">${esc(feedback.text)}</div>`:''}
function workedHtml(task){return task.worked&&task.phase==='学'?`<div class="worked"><button class="secondary mini" data-action="model" aria-expanded="${modelOpen}">${modelOpen?'收起例子':'👀 先看一个不同的例子'}</button>${modelOpen?`<div class="worked-body"><b>${esc(task.worked.title)}</b><ol>${task.worked.steps.map(s=>`<li>${esc(s)}</li>`).join('')}</ol><button class="secondary mini" data-action="speakWorked">🔊 听例子</button></div>`:''}</div>`:''}
function actionRow(task){return `${hintOpen&&task.hint&&!feedback?.ok?`<div class="hint">💡 ${esc(task.hint)} <button class="read-inline" data-action="speakHint" aria-label="朗读小提示">🔊 听提示</button></div>`:''}${feedbackHtml()}${feedback?`<button class="read-inline" data-action="speakFeedback">🔊 听${feedback.ok?'讲解':'反馈'}</button>`:''}<div id="speech-status" class="tiny-note" role="status">${esc(speechMessage)}</div><div class="bottom-actions"><button class="secondary" data-action="speak">🔊 听题目</button>${operationSpeech(task)?'<button class="secondary" data-action="speakState">🔊 听当前状态</button>':''}${!feedback?.ok&&task.hint&&task.phase!=='测'&&task.phase!=='巩固'?`<button class="secondary" data-action="hint">💡 小提示</button>`:''}${feedback?.ok?`<button class="primary" data-action="next">${topicSessionMatches()?'下一题 →':'继续 →'}</button>`:`<button class="primary" data-action="check">检查答案 ✓</button>`}</div>`}
function navRow(cursor,frontier){return `<div class="lesson-nav"><button class="secondary" data-action="previous" ${cursor===0?'disabled':''}>← 上一题</button>${cursor<frontier&&!feedback?.ok?'<button class="secondary" data-action="nextSolved">下一题 →</button>':''}${cursor+1<frontier?'<button class="secondary" data-action="frontier">回到最新进度 ⇥</button>':''}</div>`}
function fruitPage(){const i=saved.fruitCursor;if(i>=FRUIT_TASKS.length)return `<div class="panel completed"><div class="award">${reviewRecord('C01')?.verifiedAt?'★':'✓'}</div><h1>水果集合 · 路线走完</h1><p>你练习了点选人物、去重和多条组式路线。${esc(reviewStatus('C01'))}。</p>${reviewAction('C01')}<button class="secondary" data-action="review">重新练习</button> <button class="secondary" data-action="previous">回看上一题</button> <button class="secondary" data-action="home">回知识森林</button></div>`;
 const task=FRUIT_TASKS[i];return `<div class="page-head"><div><p class="kicker">🍎 水果集合</p><h1>${task.phase==='测'?'自己试一试':task.phase==='练'?'换个情境':'看图、动手、说理由'}</h1></div><button class="back" data-action="home">← 地图</button></div><div class="work"><article class="panel">${stepBadge(task,i,FRUIT_TASKS.length,saved.fruitFrontier)}${navRow(i,saved.fruitFrontier,FRUIT_TASKS.length)}${workedHtml(task)}<h2 class="task-title">${esc(task.prompt)}</h2>${fruitBoard(task)}${task.mode==='choice'?choices(task):task.mode==='number'?`<label class="num-entry"><input data-input="number" type="number" inputmode="numeric" min="0" max="999" value="${esc(draft.number)}" aria-label="输入人数"><b>人</b></label>`:task.mode==='formula'?formula(task):'<p class="muted">点选人物卡片，再检查。</p>'}${actionRow(task)}</article><aside class="side-stack"><section class="panel"><h3>这一步在想什么？</h3><p class="muted">${task.mode==='formula'?'把每一块不同的人恰好算一次。算式顺序可以不同；数学含义必须正确。':task.mode==='people'?'同一张人物卡片不会换人。对照手里的水果，再点选。':'先看图中的完整组和共同部分，再决定怎样数。'}</p></section><section class="panel"><h3>学习路线</h3>${[['学',12],['练',4],['测',10]].map(([label,count],j)=>{const from=j===0?0:j===1?12:16;return `<div class="milestone ${i>=from&&i<from+count?'active':''}"><b>${j+1}</b>${label} · ${count} 步<small>${saved.fruitFrontier>=from+count?'已走过':i>=from&&i<from+count?i-from+1+'/'+count:'未开始'}</small></div>`}).join('')}</section></aside></div>`}
function sceneHtml(scene){const t=scene?.type;if(!t)return '';
 const tiles=x=>`<div class="tiles">${x.map(v=>`<span class="tile">${esc(v)}</span>`).join('')}</div>`;
 if(t==='fruit')return `<div class="scene">${peopleBoard(false)}</div>`;
 if(t==='placeValue')return `<div class="scene"><div class="two-up">${scene.values.map(([ten,one])=>`<div class="place-picture" role="img" aria-label="${ten}根十棒、${one}个圆点"><div class="ten-bars">${Array.from({length:ten},()=>'<span></span>').join('')}</div><div class="one-dots">${Array.from({length:one},()=>'<i></i>').join('')}</div></div>`).join('')}</div></div>`;
 if(t==='spinner')return `<div class="scene"><svg class="spinner" viewBox="0 0 220 220" role="img" aria-label="等分为六格的转盘，标有1到6"><circle cx="110" cy="110" r="88" fill="#fce6b4" stroke="#6ba187" stroke-width="3"/><path d="M110 110L110 22M110 110L186 66M110 110L186 154M110 110L110 198M110 110L34 154M110 110L34 66" fill="none" stroke="#6ba187" stroke-width="2"/>${[[149,50],[179,113],[149,175],[70,175],[41,113],[70,50]].map(([x,y],i)=>`<text x="${x}" y="${y}" text-anchor="middle" font-size="23" fill="#17354b" font-weight="bold">${esc(scene.labels[i])}</text>`).join('')}<circle cx="110" cy="110" r="5" fill="#367c5d"/></svg></div>`;
 if(t==='barChart'){const max=scene.max,step=scene.step,values=scene.values,labels=scene.labels,base=180,top=20,scale=(base-top)/max;return `<div class="scene"><svg class="bar-chart" viewBox="0 0 320 230" role="img" aria-label="柱形图，纵轴从0到${max}每格${step}；${labels.map((x,i)=>`${x}${values[i]}`).join('，')}"><g stroke="#b3d3c5" stroke-width="1">${Array.from({length:max/step+1},(_,i)=>{const n=i*step,y=base-n*scale;return `<path d="M48 ${y}H300"/><text x="32" y="${y+5}" text-anchor="end" fill="#244b42" stroke="none" font-size="15">${n}</text>`}).join('')}</g><path d="M48 ${top}V${base}H300" fill="none" stroke="#315f58" stroke-width="2"/>${values.map((n,i)=>`<rect x="${72+i*78}" y="${base-n*scale}" width="46" height="${n*scale}" rx="5" fill="${['#eb8b71','#73b69c','#e8bb69'][i%3]}"/><text x="${95+i*78}" y="208" text-anchor="middle" font-size="16" fill="#17354b">${esc(labels[i])}</text>`).join('')}</svg></div>`}
 if(t==='tiles'||t==='equation'||t==='sequence')return `<div class="scene">${tiles(scene.tokens)}</div>`;
 if(t==='dots'||t==='strips')return `<div class="scene">${scene.groups.map(([label,icon,n])=>`<div class="dot-row"><b>${esc(label)}</b><span class="dots">${Array.from({length:n},()=>esc(icon)).join('')}</span></div>`).join('')}</div>`;
 if(t==='ten')return `<div class="scene"><div class="two-up">${scene.values.map(value=>`<div><div class="mini-grid" style="--cols:10">${Array.from({length:scene.target||20},(_,i)=>`<i class="cell ${i<value?'filled':''}"></i>`).join('')}</div><p class="scene-label">${scene.target===10?'十格板':'哪张卡？'}</p></div>`).join('')}</div></div>`;
 if(t==='fractions')return `<div class="scene"><div class="two-up">${scene.values.map(([a,b])=>`<div class="fraction-whole"><div class="fraction" role="img" aria-label="同样长的整体，平均分成${b}份，涂色${a}份">${Array.from({length:b},(_,i)=>`<span class="${i<a?'on':''}"></span>`).join('')}</div><p class="scene-label">${a}/${b}</p></div>`).join('')}</div></div>`;
 if(t==='grid'){const total=scene.cols*scene.rows;return `<div class="scene"><div class="mini-grid" style="--cols:${scene.cols}">${Array.from({length:total},(_,i)=>`<i class="cell ${scene.cut?.includes(i)?'cut':scene.cut?'filled':i<scene.fill?'filled':''}"></i>`).join('')}</div></div>`}
 if(t==='line')return `<div class="scene">${tiles(scene.labels)}<p class="scene-label">← 小　数轴　大 →</p></div>`;
 if(t==='table')return `<div class="scene"><table>${scene.rows.map(row=>`<tr>${row.map(x=>`<td>${esc(x)}</td>`).join('')}</tr>`).join('')}</table></div>`;
 if(t==='rectangles')return `<div class="scene"><div class="two-up">${scene.values.map(([w,h])=>`<div><div class="mini-grid" style="--cols:${w}">${Array.from({length:w*h},()=>'<i class="cell filled"></i>').join('')}</div><p class="scene-label">${w} × ${h}</p></div>`).join('<span aria-hidden="true">→</span>')}</div></div>`;
 if(t==='circle'){const r=scene.radius??3,measure=scene.measure||(/^直径/.test(scene.label||'')?'diameter':'radius'),label=scene.label||(measure==='diameter'?`直径 ${r*2}`:`半径 ${r}`);return `<div class="scene"><svg viewBox="0 0 200 150" role="img" aria-label="圆心在中间，${measure==='diameter'?'从左侧圆边穿过圆心到右侧圆边画的是直径':'从圆心到右侧圆边画的是半径'}，${esc(label)}"><circle cx="100" cy="75" r="55" fill="#d8f0e0" stroke="#398763" stroke-width="3"/><path d="${measure==='diameter'?'M45 75H155':'M100 75H155'}" stroke="#ce8250" stroke-width="4"/><circle cx="100" cy="75" r="4" fill="#17354b"/><text x="100" y="137" text-anchor="middle" font-size="18" fill="#17354b">${esc(label)}</text></svg></div>`}
 if(t==='circleArc')return `<div class="scene"><svg viewBox="0 0 220 180" role="img" aria-label="圆周平均分为四段，高亮其中一段四分之一圆弧。${esc(scene.label||'')}"><circle cx="110" cy="78" r="54" fill="#f0faef" stroke="#9bb9aa" stroke-width="4"/><path d="M110 78V24M110 78H164" stroke="#b8d9c7" stroke-width="2"/><path d="M110 24 A54 54 0 0 1 164 78" fill="none" stroke="#e47e4f" stroke-width="10" stroke-linecap="round"/><circle cx="110" cy="78" r="4" fill="#315f58"/><text x="110" y="164" text-anchor="middle" font-size="15" fill="#17354b">${esc(scene.label||'高亮为整圈的四分之一')}</text></svg></div>`;
 if(t==='pythagoras'){const [a,b]=scene.legs;return `<div class="scene"><div class="square-proof"><div><div class="mini-grid" style="--cols:${a}">${Array.from({length:a*a},()=>'<i class="cell filled"></i>').join('')}</div><b>${a} × ${a}</b></div><span>＋</span><div><div class="mini-grid" style="--cols:${b}">${Array.from({length:b*b},()=>'<i class="cell filled"></i>').join('')}</div><b>${b} × ${b}</b></div></div><p class="scene-label">先数两块正方形，再想直角三角形的斜边。</p></div>`}
 if(t==='triangle'){
  const [first,second]=scene.labels,angles=[first,second].map(x=>Number.parseFloat(x)),isAngle=[first,second].every(x=>String(x).includes('°'))&&angles.every(x=>x>0&&x<170)&&angles[0]+angles[1]<180;
  let left=25,right=225,apexX=144,apexY=18;
  if(isAngle){const a=Math.tan(angles[0]*Math.PI/180),b=Math.tan(angles[1]*Math.PI/180),dx=200*b/(a+b),height=dx*a,scale=Math.min(1,118/height);left=130-100*scale;right=130+100*scale;apexX=left+dx*scale;apexY=155-height*scale}
  const description=isAngle?`三角形底边两个角分别为${first}和${second}，图形角度按比例绘制，顶角待求`:`三角形示意，标签依次为${scene.labels.join('、')}，边长未按比例绘制`;
  return `<div class="scene"><svg viewBox="0 0 260 180" role="img" aria-label="${esc(description)}"><path d="M${left} 155L${right} 155L${apexX} ${apexY}Z" fill="#dcf0e2" stroke="#398763" stroke-width="3"/><text x="${left+8}" y="149" font-size="17" fill="#17354b">${esc(first)}</text><text x="${right-54}" y="149" font-size="17" fill="#17354b">${esc(second)}</text><text x="${apexX-13}" y="${apexY+25}" font-size="17" fill="#17354b">${esc(scene.labels[2])}</text></svg></div>`
 }
 if(t==='rightTriangle'){const [a,b]=scene.legs||[3,4];return `<div class="scene"><svg viewBox="0 0 260 165" role="img" aria-label="直角三角形，两直角边为${a}和${b}"><path d="M32 140L32 30L205 140Z" fill="#dcf0e2" stroke="#398763" stroke-width="3"/><path d="M32 125h15v15" fill="none" stroke="#ce8250" stroke-width="3"/><text x="10" y="93" font-size="18" fill="#17354b">${a}</text><text x="106" y="158" font-size="18" fill="#17354b">${b}</text><text x="120" y="72" font-size="18" fill="#17354b">?</text></svg></div>`}
 if(t==='cube')return `<div class="scene"><svg viewBox="0 0 220 160" aria-label="立方体图"><path d="M40 45L110 20L180 45L110 70Z" fill="#aee0bc" stroke="#3d8c68" stroke-width="3"/><path d="M40 45L110 70V140L40 110Z" fill="#67af91" stroke="#3d8c68" stroke-width="3"/><path d="M180 45L110 70V140L180 110Z" fill="#82c9a9" stroke="#3d8c68" stroke-width="3"/></svg></div>`;
 if(t==='coordinate'){const points=scene.points||[];return `<div class="scene"><svg class="coordinate" viewBox="0 0 230 210" role="img" aria-label="坐标方格，${esc(points.map(([x,y,name])=>`${name||'点'}在${x},${y}`).join('；'))}"><g stroke="#c6ddd1" stroke-width="1">${Array.from({length:7},(_,i)=>`<path d="M28 ${178-i*24}H202M${28+i*26} 34V178"/>`).join('')}</g><path d="M28 178H207M28 183V28" stroke="#315f58" stroke-width="3"/><g fill="#526f68" font-size="11">${Array.from({length:7},(_,i)=>`<text x="${28+i*26}" y="197" text-anchor="middle">${i}</text>${i?`<text x="18" y="${182-i*24}" text-anchor="middle">${i}</text>`:''}`).join('')}</g>${points.map(([x,y,name],i)=>`<g><circle cx="${28+x*26}" cy="${178-y*24}" r="7" fill="${i?'#ed8a64':'#3f9973'}"/><text x="${38+x*26}" y="${171-y*24}" font-size="12" fill="#17354b" font-weight="bold">${esc(name||String.fromCharCode(65+i))}</text></g>`).join('')}</svg></div>`}
 if(t==='cuboid'){const [a,b,c]=scene.dims||[2,3,4];return `<div class="scene"><svg viewBox="0 0 260 175" role="img" aria-label="长方体，长${a}、宽${b}、高${c}"><path d="M45 55L145 28L215 65L112 94Z" fill="#bce4c7" stroke="#3d8c68" stroke-width="3"/><path d="M45 55L112 94V150L45 110Z" fill="#73b596" stroke="#3d8c68" stroke-width="3"/><path d="M215 65L112 94V150L215 119Z" fill="#91cfad" stroke="#3d8c68" stroke-width="3"/><text x="151" y="156" font-size="16" fill="#17354b">长 ${a}</text><text x="50" y="139" font-size="16" fill="#17354b">高 ${c}</text><text x="188" y="46" font-size="16" fill="#17354b">宽 ${b}</text></svg></div>`}
 if(t==='net')return `<div class="scene"><div class="cube-net" role="img" aria-label="由六个正方形组成的立方体展开图">${[[1,0],[0,1],[1,1],[2,1],[3,1],[1,2]].map(([x,y])=>`<i style="--x:${x};--y:${y}"></i>`).join('')}</div></div>`;
 if(t==='mirror')return `<div class="scene"><svg viewBox="0 0 250 130" aria-label="沿中央虚线左右对折"><path d="M20 20h210v90H20Z" fill="#ecf8ef" stroke="#45916e" stroke-width="3"/><path d="M125 15v100" stroke="#ce9d56" stroke-width="3" stroke-dasharray="7 5"/><circle cx="55" cy="43" r="10" fill="#ed765f"/><text x="145" y="45" font-size="21" fill="#456b65">？</text></svg></div>`;
 return '';
}
function foundationBoard(task){
 if(task.mode==='selectIcons'){
  let offset=0;
  return `<div class="board"><h3>点图中的对象，每个图标代表一个</h3><div class="icon-groups">${task.scene.groups.map(([name,icon,count])=>{const from=offset;offset+=count;return `<div class="icon-group"><b>${esc(name)}</b><div>${Array.from({length:count},(_,j)=>`<button data-action="selectIcon" data-index="${from+j}" aria-label="${esc(name)}第${j+1}个，${draft.selected.includes(from+j)?'已圈出':'未圈出'}" aria-pressed="${draft.selected.includes(from+j)}" class="${draft.selected.includes(from+j)?'chosen':''}">${esc(icon)}</button>`).join('')}</div></div>`}).join('')}</div><p class="tiny-note">已圈出 ${draft.selected.length} 个。再核对它们是不是同一种对象。</p></div>`
 }
 if(task.mode==='cycleOverlap'){
  const [a,b]=task.periods,times=Array.from(new Set([...Array.from({length:Math.floor(task.max/a)},(_,i)=>(i+1)*a),...Array.from({length:Math.floor(task.max/b)},(_,i)=>(i+1)*b)])).sort((x,y)=>x-y);
  return `<div class="board"><h3>从第0分钟后，看两盏灯何时又一起亮</h3><div class="cycle-grid">${times.map(n=>`<button data-action="cycleTime" data-time="${n}" class="${draft.choice===n?'chosen':''}" aria-pressed="${draft.choice===n}" aria-label="第${n}分钟，${n%a===0?'红灯亮':'红灯不亮'}，${n%b===0?'蓝灯亮':'蓝灯不亮'}"><b>${n}分</b><span>${n%a===0?'🔴':'○'} ${n%b===0?'🔵':'○'}</span></button>`).join('')}</div><p class="tiny-note">🔴红灯每${a}分钟亮；🔵蓝灯每${b}分钟亮。第0分钟是起点。</p></div>`
 }
 if(task.mode==='netFold'){
  const folded=new Set(draft.selected),face=(index,label,kind,child='')=>`<div class="cube-fold-hinge ${kind} ${folded.has(index)?'folded':''}"><button data-action="netFoldFace" data-index="${index}" aria-label="${label}面，${folded.has(index)?'已折起，点按展开':'点按折起'}" aria-pressed="${folded.has(index)}">${label}</button>${child}</div>`;
  const cap=face(4,'E','cap');
  return `<div class="board"><h3>点面沿边折起，也可点下方的面名</h3><div class="cube-fold-stage"><div class="cube-fold-viewport"><div class="cube-fold-base"><span>C</span>${face(0,'A','north')}${face(1,'B','west')}${face(3,'D','east',cap)}${face(5,'F','south')}</div></div><div class="cube-fold-key">${[0,1,3,4,5].map(i=>`<button data-action="netFoldFace" data-index="${i}" aria-pressed="${folded.has(i)}">${'ABCDEF'[i]} ${folded.has(i)?'✓':'折起'}</button>`).join('')}</div></div><p class="tiny-note">C 是中间底面；已折起 ${folded.size}/5。E 连在 D 的外侧，先折 D 才能折 E。</p></div>`
 }
 if(task.mode==='bundleTen'){
  const selected=new Set(draft.selected),left=Array.from({length:task.initialOnes},(_,i)=>i).filter(i=>!selected.has(i));
  const tenBar=()=>'<span role="img" aria-label="一根十棒，表示十个一"></span>';
  return `<div class="board exchange-board"><h3>把10个一放进捆扎框</h3><p class="tiny-note">点散点，它会进入捆扎框；点框里的散点可以放回。装满10个，再点“捆成十棒”。</p><div class="exchange-stages"><section class="exchange-zone"><b>已有的十棒 · ${task.initialTens}根</b><div class="ten-bars">${Array.from({length:task.initialTens},tenBar).join('')}</div></section><section class="exchange-zone"><b>散点盘 · ${draft.bundled?task.initialOnes-10:left.length}个</b><div class="loose-dots">${draft.bundled?Array.from({length:task.initialOnes-10},()=>'<span class="loose-dot" aria-hidden="true"></span>').join(''):left.map(i=>`<button class="loose-dot" data-action="bundleDot" data-index="${i}" aria-label="第${i+1}个散点，放进捆扎框"></button>`).join('')}</div></section><section class="exchange-zone bundle-zone ${draft.selected.length===10?'ready':''}" aria-label="捆扎框，已放入${draft.bundled?10:draft.selected.length}个散点"><b>捆扎框 · ${draft.bundled?'10个已捆成1根十棒':`${draft.selected.length}/10`}</b>${draft.bundled?`<div class="ten-bars new-ten">${tenBar()}</div>`:`<div class="bundle-slots">${Array.from({length:10},(_,slot)=>slot<draft.selected.length?`<button class="loose-dot chosen" data-action="bundleDot" data-index="${draft.selected[slot]}" aria-label="框中第${slot+1}个散点，点按放回"></button>`:'<span class="empty-slot" aria-hidden="true"></span>').join('')}</div>`}</section></div>${draft.bundled?`<p class="exchange-result" role="status">原来 ${task.initialTens}个十＋${task.initialOnes}个一；现在 ${task.tens}个十＋${task.ones}个一。总数变化了吗？</p><div class="answer-list exchange-meaning">${['一样多','变多了','变少了'].map((label,i)=>`<button class="answer-option ${draft.choice===i?'selected':''}" data-action="bundleMeaning" data-index="${i}" aria-pressed="${draft.choice===i}">${label}</button>`).join('')}</div><button class="secondary mini" data-action="unbundle">↩ 拆开这根新十棒</button>`:`<button class="secondary bundle-button" data-action="bundle" ${draft.selected.length===10?'':'disabled'}>🪢 ${draft.selected.length===10?'捆好这10个一，换成1根十棒':`还差${10-draft.selected.length}个一才能捆`}</button>`}</div>`;
 }
 if(task.mode==='pairs'&&task.pairRows){return `<div class="board"><h3>固定一行，逐格搭配</h3><div class="pair-matrix" style="--pair-cols:${task.pairCols.length}"><span class="matrix-corner">第一件×第二件</span>${task.pairCols.map(c=>`<b>${esc(c)}</b>`).join('')}${task.pairRows.map(r=>`<b>${esc(r)}</b>${task.pairCols.map(c=>{const label=r+c,index=task.options.indexOf(label);return `<button data-action="pairCell" data-index="${index}" class="matrix-cell ${draft.selected.some(i=>task.options[i]===label)?'chosen':''}" aria-pressed="${draft.selected.some(i=>task.options[i]===label)}" aria-label="${esc(label)}">${draft.selected.some(i=>task.options[i]===label)?'✓':'＋'}</button>`}).join('')}`).join('')}</div><p class="tiny-note">已记录 ${draft.selected.length} 张卡；每个格子代表一种不同的搭配。下方混入的重复卡不需要再点。</p></div>`}
 if(task.mode==='enumerate'){const symbols=task.items,entries=draft.entries;return `<div class="board"><h3>${task.orderMatters?'换位置会成为新顺序':'只选一组，前后互换仍是一组'}</h3><div class="pattern-line">${Array.from({length:task.slots},(_,i)=>`<span class="pattern-tile ${draft.tokens[i]?'':'missing'}">${esc(draft.tokens[i]??'？')}</span>`).join('')}</div><div class="pattern-palette">${symbols.map(x=>`<button class="pattern-tile" data-action="enumItem" data-value="${esc(x)}">${esc(x)}</button>`).join('')}</div><div class="enumerate-actions"><button class="secondary mini" data-action="enumUndo" ${draft.tokens.length?'':'disabled'}>↩ 撤销一个</button><button class="secondary mini" data-action="enumRecord" ${draft.tokens.length===task.slots?'':'disabled'}>记录这一种</button></div><div class="recorded"><b>已列出 ${entries.length} 种</b><div>${entries.map((x,i)=>`<button data-action="enumRemove" data-index="${i}" aria-label="移除第${i+1}种${esc(x.split('|').join('、'))}">${esc(x.split('|').join(' → '))} ×</button>`).join('')}</div></div></div>`}
 if(task.mode==='netSelect'){const faces=[['A',1,0],['B',0,1],['C',1,1],['D',2,1],['E',3,1],['F',1,2]];return `<div class="board"><h3>点纸盒展开图中的一面</h3><div class="cube-net interactive" aria-label="六个带字母的正方形纸面">${faces.map(([label,x,y],i)=>`<button style="--x:${x};--y:${y}" class="${draft.selected.includes(i)?'chosen':''}" data-action="netFace" data-index="${i}" aria-pressed="${draft.selected.includes(i)}" aria-label="第${label}面">${label}</button>`).join('')}</div><p class="tiny-note">中心 C 的上下左右分别是 A、F、B、D；想象它们沿边折起，哪一面会在背后？</p></div>`}
 if(task.mode==='parityMoves'){const value=task.start+task.delta*draft.moves;return `<div class="board"><h3>一次只做同样的操作</h3><div class="parity-track">${Array.from({length:draft.moves+1},(_,i)=>`<span class="${i===draft.moves?'current':''}">${task.start+i*task.delta}</span>`).join('<span>→</span>')}</div><div class="parity-dots">${Array.from({length:value},()=>'<i></i>').join('')}</div><p class="tiny-note">现在 ${value} 个点，能两两配对吗？已操作 ${draft.moves}/${task.moves} 次。</p><button class="secondary" data-action="applyMove" ${draft.moves>=task.moves?'disabled':''}>${task.delta>0?'再加一对（＋2）':'拿走一对（－2）'}</button><p>观察每一步，数量始终是：</p><div class="answer-list">${['奇','偶'].map(x=>`<button class="answer-option ${draft.choice===x?'selected':''}" data-action="parityChoice" data-value="${x}" aria-pressed="${draft.choice===x}">${x}数</button>`).join('')}</div></div>`}
 if(task.mode==='lineWalk'){const current=draft.position??task.start;return `<div class="board"><h3>在数轴上走到目标位置</h3><div class="walk-line">${Array.from({length:task.max-task.min+1},(_,i)=>task.min+i).map(n=>`<span class="${n===current?'current':''} ${n===task.target?'target':''}" aria-label="位置${n}${n===current?'，当前所在':''}${n===task.target?'，目标':''}">${n}</span>`).join('')}</div><p class="tiny-note">当前位置：${current}；目标：${task.target}。每按一次走1格。</p><div class="walk-actions"><button class="secondary" data-action="lineMove" data-delta="-1">← 向左1格</button><button class="secondary" data-action="lineMove" data-delta="1">向右1格 →</button></div></div>`}
 if(task.mode==='barBuild'){const heights=task.barLabels.map((_,i)=>draft.barHeights[i]??0);return `<div class="board"><h3>每格代表${task.barScale}张，逐根画柱</h3><div class="bar-builder">${task.barLabels.map((label,i)=>`<div class="bar-column"><div class="bar-well" aria-label="${esc(label)}当前${heights[i]}格，表示${heights[i]*task.barScale}张">${Array.from({length:task.barMax},(_,j)=>`<span class="${j>=task.barMax-heights[i]?'filled':''}">${(task.barMax-j)*task.barScale}</span>`).join('')}</div><b>${esc(label)}</b><div class="bar-controls"><button data-action="barChange" data-index="${i}" data-delta="-1" aria-label="${esc(label)}减少一格">−</button><button data-action="barChange" data-index="${i}" data-delta="1" aria-label="${esc(label)}增加一格">＋</button></div><small>${heights[i]}格 = ${heights[i]*task.barScale}张</small></div>`).join('')}</div></div>`}
 if(task.mode==='arcSelect')return `<div class="board"><h3>圆周四等分，点其中一段弧</h3><div class="arc-quarters">${Array.from({length:task.arcCount},(_,i)=>`<button class="arc-quarter ${draft.selected.includes(i)?'chosen':''}" data-action="arcPart" data-index="${i}" aria-label="第${i+1}段四分之一圆弧，${draft.selected.includes(i)?'已选':'未选'}" aria-pressed="${draft.selected.includes(i)}">${i+1}</button>`).join('')}</div><p class="tiny-note">已选 ${draft.selected.length} 段；每段占整个圆周的1/4。</p></div>`;
 if(task.mode==='placeValue')return `<div class="board"><h3>看图，再自己点数量</h3>${sceneHtml({type:'placeValue',values:[[task.tens,task.ones]]})}<div class="place-controls"><div><b>十棒</b><button data-action="place" data-unit="tens" data-delta="-1" aria-label="减少一根十棒">−</button><strong>${draft.tens}</strong><button data-action="place" data-unit="tens" data-delta="1" aria-label="增加一根十棒">＋</button></div><div><b>圆点</b><button data-action="place" data-unit="ones" data-delta="-1" aria-label="减少一个圆点">−</button><strong>${draft.ones}</strong><button data-action="place" data-unit="ones" data-delta="1" aria-label="增加一个圆点">＋</button></div></div></div>`;
 if(task.mode==='tenTap')return `<div class="board"><h3>把空格点亮</h3><div class="interactive-grid" style="--cols:5">${Array.from({length:task.target},(_,i)=>i<task.filled?`<span class="grid-cell fixed" aria-label="已经点亮的第${i+1}格"></span>`:`<button class="grid-cell ${draft.selected.includes(i)?'chosen':''}" data-action="tenCell" data-index="${i}" aria-label="第${i+1}格 ${draft.selected.includes(i)?'已点亮':'未点亮'}" aria-pressed="${draft.selected.includes(i)}"></button>`).join('')}</div><p class="tiny-note">已点亮 ${task.filled} 格；你又点亮 ${draft.selected.length} 格。</p></div>`;
 if(task.mode==='sequence')return `<div class="board"><h3>${esc(task.boardTitle||`观察规律，接着补${task.answer.length}块`)}</h3><div class="pattern-line">${task.pattern.map(x=>`<span class="pattern-tile">${esc(x)}</span>`).join('')}${task.pattern.length?'<span aria-hidden="true">→</span>':''}${Array.from({length:task.answer.length},(_,i)=>`<span class="pattern-tile missing">${esc(draft.tokens[i]??'？')}</span>`).join('')}</div><div class="pattern-palette">${task.palette.map(x=>`<button class="pattern-tile" data-action="seqToken" data-value="${esc(x)}">${esc(x)}</button>`).join('')}</div><button class="secondary mini" data-action="seqUndo" ${draft.tokens.length?'':'disabled'}>↩ 撤销一块</button></div>`;
 if(task.mode==='sides'){
  const [w,h]=task.rect,labels=[`上面 ${w} 格`,`右边 ${h} 格`,`下面 ${w} 格`,`左边 ${h} 格`];
  const edge=i=>`<button class="edge edge-${i} ${draft.selected.includes(i)?'chosen':''}" data-action="side" data-index="${i}" aria-pressed="${draft.selected.includes(i)}">${labels[i]}</button>`;
  return `<div class="board"><h3>沿图形外圈选边</h3><div class="perimeter-board">${edge(0)}${edge(3)}<div class="perimeter-grid" style="--cols:${w}">${Array.from({length:w*h},()=>'<span></span>').join('')}</div>${edge(1)}${edge(2)}</div><button class="interior-choice ${draft.selected.includes(4)?'chosen':''}" data-action="side" data-index="4" aria-pressed="${draft.selected.includes(4)}">中间的小格也算外边？</button></div>`
 }
 if(task.mode==='gridSelect')return `<div class="board"><h3>${esc(task.boardTitle||'点选要剪掉的小格')}</h3><div class="cut-grid" style="--cols:${task.cols}">${Array.from({length:task.cols*task.rows},(_,i)=>task.marked?.includes(i)?`<span class="cut-cell marked" aria-label="左侧已有孔或切口的第${i+1}格">✂</span>`:`<button class="cut-cell ${task.selectionRule==='count'?'':task.cue&&task.answer.includes(i)?'guide':''} ${draft.selected.includes(i)?'chosen':''}" data-action="cutCell" data-index="${i}" aria-pressed="${draft.selected.includes(i)}" aria-label="${i+1}号小格，${draft.selected.includes(i)?'已选择':'未选择'}"></button>`).join('')}</div>${task.marked?'<p class="tiny-note">✂ 是已打孔或剪过的左侧位置；点展开后右侧对应的格子。</p>':task.selectionRule==='count'?`<p class="tiny-note">已点亮 ${draft.selected.length} / ${task.answer.length} 格，位置可以自己选。</p>`:''}</div>`;
 if(task.mode==='redistribute'){const values=draft.values??task.values;return `<div class="board"><h3>${esc(task.pileLabels?'先点钱箱，再点要收到钱币的苹果':'先点要拿出的一盘，再点要收到的一盘')}</h3><div class="share-piles" style="--pile-count:${task.values.length}">${values.map((count,i)=>`<button class="share-pile ${draft.source===i?'selected':''}" data-action="movePile" data-index="${i}" aria-pressed="${draft.source===i}"><b>${esc(task.pileLabels?.[i]??['甲盘','乙盘','丙盘'][i]??`第${i+1}组`)}</b><span class="share-dots">${Array.from({length:count},()=>'<i></i>').join('')}</span><strong>${count}${task.pileLabels?'枚':'颗'}</strong></button>`).join('')}</div><button class="secondary mini" data-action="resetMoves">重新分</button></div>`}
 if(task.mode==='balanceUnknown'){const taken=draft.moves>0,remaining=task.total-task.known;return `<div class="board"><h3>天平两边做同一个动作</h3><div class="balance-pans"><div class="balance-pan"><b>左盘</b><span class="unknown-bag">□</span>${!taken?`<span class="balance-dots">${'●'.repeat(task.known)}</span>`:''}</div><strong>＝</strong><div class="balance-pan"><b>右盘</b><span class="balance-dots">${'●'.repeat(taken?remaining:task.total)}</span></div></div><p class="tiny-note">${taken?`两边各拿走${task.known}颗，现在右边剩${remaining}颗。`:'先看两边的等量关系。'}</p><button class="secondary" data-action="balanceTake" ${taken?'disabled':''}>两边各拿走${task.known}颗</button> <button class="secondary mini" data-action="balanceUndo" ${taken?'':'disabled'}>↩ 撤销</button></div>`}
 return `<div class="board">${sceneHtml(task.scene)}</div>`;
}
function coursePage(){const course=COURSES[courseCode],record=courseRecord(courseCode);if(!course||!record)return `<div class="panel">单元不存在。<button data-action="home">回地图</button></div>`;
 const i=record.cursor;if(i>=course.steps.length)return `<div class="panel completed"><div class="award">${reviewRecord(courseCode)?.verifiedAt?'★':'✓'}</div><h1>${esc(course.title)} · 路线走完</h1><p>学、练、测 8 步已走完。${FOCUS_REVIEW[courseCode]?esc(reviewStatus(courseCode))+'。':'这是一条入门练习路线，完成不代表整个考点已掌握。'}</p>${SCOPE_NOTES[courseCode]?`<p class="tiny-note">${esc(SCOPE_NOTES[courseCode])}</p>`:''}${reviewAction(courseCode)}<button class="secondary" data-action="review">从第一步复习</button> <button class="secondary" data-action="previous">回看上一题</button> <button class="secondary" data-action="sample" data-code="${esc(course.code)}">再挑战一题</button> <button class="secondary" data-action="home">回知识森林</button></div>`;
 const task=course.steps[i],pending=!!saved.upgradePending[courseCode],shownFrontier=pending?saved.upgradeFrontiers[courseCode]??i:record.frontier;return `<div class="page-head"><div><p class="kicker">${esc(course.code)} · ${esc(course.stage||'起步')}</p><h1>${esc(course.icon)} ${esc(course.title)}</h1></div><button class="back" data-action="home">← 地图</button></div><div class="work ${task.mode==='bundleTen'?'exchange-layout':''}"><article class="panel">${stepBadge(task,i,course.steps.length,shownFrontier)}${pending?'<p class="tiny-note">旧版进度已保留。这条路线有新版任务，请顺序完成后再参加新版隔日巩固。</p>':''}${navRow(i,shownFrontier)}${workedHtml(task)}<h2 class="task-title">${esc(task.prompt)}</h2>${task.mode==='formula'?fruitBoard(task):foundationBoard(task)}${exploreBlock(task)}${courseAnswerHtml(task)}${reasonBlock(task)}${actionRow(task)}${SCOPE_NOTES[courseCode]?`<p class="tiny-note">${esc(SCOPE_NOTES[courseCode])}</p>`:''}<button class="sample-link" data-action="sample" data-code="${esc(course.code)}">再挑战一题 ↗</button></article><aside class="side-stack"><section class="panel"><h3>学 · 练 · 测</h3><p class="muted">先看图、动手操作，再换情境独立解答。测试步骤没有提示。</p>${[['学',0,4],['练',4,2],['测',6,2]].map(([label,start,count])=>`<div class="milestone ${i>=start&&i<start+count?'active':''}"><b>${label}</b>${count} 步<small>${shownFrontier>=start+count?'已走过':i>=start&&i<start+count?i-start+1+'/'+count:'未开始'}</small></div>`).join('')}</section></aside></div>`
}
function courseAnswerHtml(task){return ['choice','multi','pairs'].includes(task.mode)?choices(task):['number','netFold','balanceUnknown'].includes(task.mode)?`<label class="num-entry"><input data-input="number" type="number" inputmode="decimal" value="${esc(draft.number)}" aria-label="输入答案"></label>`:task.mode==='formula'?formula(task):''}
function transferPage(){const r=reviewRecord(courseCode),tasks=FOCUS_REVIEW[courseCode];if(!r||!tasks||r.verifiedAt||Date.now()<r.dueAt)return `<div class="panel"><h1>巩固尚未开放</h1><button class="secondary" data-action="home">回知识森林</button></div>`;
 const task=tasks[r.cursor];if(!task)return `<div class="panel"><h1>巩固记录已完成</h1><button class="secondary" data-action="home">回知识森林</button></div>`;
 return `<div class="page-head"><div><p class="kicker">${esc(courseCode)} · 隔日巩固</p><h1>换情境，自己想办法</h1></div><button class="back" data-action="home">← 地图</button></div><div class="work"><article class="panel">${stepBadge(task,r.cursor,tasks.length,r.cursor)}<p class="tiny-note">${r.cursor+1}/${tasks.length} · 无提示。两题都要首答正确；答错可以练习，但下次再验证。</p><h2 class="task-title">${esc(task.prompt)}</h2>${task.mode==='formula'?fruitBoard(task):foundationBoard(task)}${courseAnswerHtml(task)}${actionRow(task)}</article><aside class="side-stack"><section class="panel"><h3>本次只验证这个具体模型</h3><p class="muted">换过数字和情境，观察孩子能否独立找对象、拆关系、再作答。结果保存在这台设备的当前浏览器。</p></section></aside></div>`
}
function samplePage(){const task=SAMPLE_TASKS[sampleCode],topic=CATALOG.topics.find(t=>t.code===sampleCode);if(!task||!topic)return `<div class="panel">样题不存在。<button data-action="home">回地图</button></div>`;return `<div class="page-head"><div><p class="kicker">${esc(topic.code)} · ${esc(task.level)} · 挑战题</p><h1>${esc(topic.title)}</h1></div><button class="back" data-action="home">← 地图</button></div><div class="work"><article class="panel"><span class="phase">试一题</span><h2 class="task-title">${esc(task.prompt)}</h2><div class="board">${sceneHtml(task.scene)}</div>${task.mode==='number'?`<label class="num-entry"><input data-input="number" type="number" inputmode="numeric" value="${esc(draft.number)}" aria-label="输入答案"><b>${['G02'].includes(sampleCode)?'°':' '}</b></label>`:choices(task)}${actionRow({...task,phase:'练'})}</article><aside class="side-stack"><section class="panel"><h3>这盏灯学什么？</h3><p>${esc(topic.title)}</p><p class="muted">这是一道挑战题。做完后还可以探索其他知识灯。</p></section></aside></div>`}
// The parent view projects existing journals. It never rewrites their evidence.
function mathRecordDate(value){
 const n=Number(value),date=new Date(n);
 return Number.isFinite(n)&&n>0&&Number.isFinite(date.getTime())?date.toLocaleString('zh-CN',{hour12:false}):'时间未记录';
}
function mathLegacyDetails(records){
 const rows=records.slice(-15).reverse().map(a=>{
  const task=RECORD_TASK_INDEX.get((a.contentVersion??5)+':'+a.taskInstanceId)?.task,answer=a.answer||{};
  let input='';
  if(typeof answer.number==='string'&&answer.number!=='')input=answer.number;
  else if(Number.isInteger(answer.choice)&&answer.choice>=0&&typeof task?.options?.[answer.choice]==='string'&&answer.choiceId===assessmentOptionId(task,'options',answer.choice))input=task.options[answer.choice];
  else if(Array.isArray(answer.selected)&&answer.selected.length&&task?.options&&Array.isArray(answer.selectedIds)&&answer.selected.every((i,n)=>answer.selectedIds[n]===assessmentOptionId(task,'options',i)))input=answer.selected.map(i=>task.options[i]).filter(x=>typeof x==='string').join('、');
  else if(Array.isArray(answer.tokens)&&answer.tokens.length)input=answer.tokens.join('、');
  else if(Array.isArray(answer.entries)&&answer.entries.length)input=answer.entries.join('、');
  const prefix=a.repeatOfKnownInstance===true?'再次练习':a.repeatOfKnownInstance===false?'首次提交':'提交顺序待核对';
  const result=a.gradingResult==='correct'?'答对':a.gradingResult==='incorrect'?'未答对':'结果待核对';
  const support=Array.isArray(a.hintEvents)&&typeof a.modelViewed==='boolean'?(a.hintEvents.length||a.modelViewed?'用过提示或示范':'未记录提示或示范'):'帮助情况待核对';
  const topics=[...new Set((Array.isArray(a.skillIds)?a.skillIds:[]).map(id=>String(id).split('.')[0]))].map(id=>SKILL_DATA.units.find(x=>x.id===id)?.title||id);
  return '<li><b>'+esc(task?.prompt||a.taskInstanceId||'旧路线题目')+'</b><br>'+esc(mathRecordDate(a.submittedAt))+(topics.length?' · '+esc(topics.join('、')):'')+'<br>'+esc(prefix+'：'+(input||'作答详情见完整记录')+'（'+result+'） · '+support)+'</li>';
 });
 return '<details data-legacy-math-records><summary>旧路线最近的作答明细</summary><ol>'+(rows.join('')||'<li>暂无作答明细。</li>')+'</ol></details>';
}
function mathCompetitionDetails(records){
 const groups=new Map();
 for(const [index,a] of records.entries()){
  const key=typeof a.signature==='string'&&a.signature?a.signature:'unknown-'+index;
  if(!groups.has(key))groups.set(key,[]);groups.get(key).push(a);
 }
 const grouped=[...groups.values()].map(group=>group.sort((a,b)=>(Number(a.at)||0)-(Number(b.at)||0)||(Number(a.order)||0)-(Number(b.order)||0)))
  .sort((a,b)=>(Number(b[b.length-1].at)||0)-(Number(a[a.length-1].at)||0)).slice(0,15);
 const rows=grouped.map(group=>{
  const a=group[0],last=group[group.length-1];let task=null;
  try{const t=competitionCreate(a.recipe);if(t.competition.signature===a.signature)task=t}catch(_){}
  const input=typeof a.freeInput==='string'&&a.freeInput!==''?a.freeInput:
   Number.isInteger(a.choice)&&a.choice>=0&&task?.options?.[a.choice]!==undefined?String(task.options[a.choice]):'作答详情见完整记录';
  const first=a.firstAttempt===true?'首次提交':'历史首答待核对';
  const result=x=>x.correct===true?'答对':x.correct===false?'未答对':'结果待核对';
  const when=a.firstAttempt===true?'首次提交前':'这条记录提交前';
  const support=a.hinted===true||a.priorSolutionViewed===true?when+'用过提示或看过解法':
   a.hinted===false&&a.priorSolutionViewed===false?when+'未记录提示或解法':'帮助情况待核对';
  const topics=(Array.isArray(a.topicIds)?a.topicIds:[]).map(id=>SKILL_DATA.units.find(x=>x.id===id)?.title||id);
  return '<li><b>'+esc(task?.prompt||a.taskId||'竞赛练习')+'</b><br>'+esc(mathRecordDate(a.at))+(topics.length?' · '+esc(topics.join('、')):'')+'<br>'+esc(first+'：'+input+'（'+result(a)+'） · '+support)+(group.length>1?'；之后提交 '+(group.length-1)+' 次，最近'+result(last):'')+'</li>';
 });
 return '<details data-competition-math-records><summary>竞赛练习最近的作答明细</summary><ol>'+(rows.join('')||'<li>暂无作答明细。</li>')+'</ol></details>';
}
// Read existing journals without modifying their independent evidence or schema.
function mathActivityPanel(){
 const legacy=Array.isArray(saved.attempts)?saved.attempts:[];
 const competition=Array.isArray(saved.competition?.attempts)?saved.competition.attempts:[];
 const inspected=TransferEvidenceStore.inspect(saved.rtm1);
 const groups=new Map(),sessions=new Map();
 if(!inspected.readOnly){
  const state=inspected.state;
  for(const item of [...(state.sessions.archived||[]),...(state.sessions.active?[state.sessions.active]:[])])
   if(item?.attemptId)sessions.set(item.attemptId,item);
  for(const event of TransferEvidenceStore.events(state)){
   if(!groups.has(event.attemptId))groups.set(event.attemptId,[]);
   groups.get(event.attemptId).push(event);
  }
 }
 let submissionCount=0;
 const rows=[],supportQueue=[],solvedKeys=new Set();
 for(const events of groups.values())for(const event of events){
  if(event.type==='response_submitted'&&event.evidenceScope!=='remediation_support_only'&&!event.diagnosticOf&&event.result?.outcome==='VERIFIED'&&typeof event.mathKey==='string')solvedKeys.add(ExamMapping.resolveMathKey(event.mathKey));
 }
 for(const [id,events] of groups){
  const responses=events.filter(e=>e.type==='response_submitted').sort((a,b)=>a.submissionOrdinal-b.submissionOrdinal||a.sequence-b.sequence);
  if(!responses.length)continue;
  submissionCount+=responses.length;
  const first=responses[0],last=responses[responses.length-1],session=sessions.get(id);
  const ordinals=responses.map(e=>e.submissionOrdinal),conflict=new Set(ordinals).size!==ordinals.length;
  const helped=!!first.supportSnapshot?.methodHelpCount||events.some(e=>e.recordOrdinal<first.recordOrdinal&&['hint_revealed','hint_read_requested','method_exposed','answer_revealed'].includes(e.type));
  const result=e=>e?.result?.outcome==='VERIFIED'?'答对':e?.result?.outcome==='INCORRECT'?'未答对':'未自动判定';
  const name=session?.definition?.prompt||first.taskId||first.examId||'题目记录';
  const label=session?' · '+ExamMappingUI.sourceLabel(session):first.examId?' · 记录题号 '+first.examId+'（来源待核验）':'';
  const raw=String(first.input??''),option=session?.definition?.answerContract?.kind==='choice'?session.definition.options?.find(o=>String(o.id)===raw):null;
  const displayed=option?.text||raw,when=Number.isFinite(first.at)&&first.at>0?new Date(first.at).toLocaleString('zh-CN',{hour12:false}):'时间未记录';
  const topics=ConnectedLearning.routeTopics(session?.connectedTarget?.routeId).map(id=>SKILL_DATA.units.find(unit=>unit.id===id)?.title||id);
  const mathKey=typeof first.mathKey==='string'?ExamMapping.resolveMathKey(first.mathKey):null;
  if(!conflict&&session&&typeof session.definition?.prompt==='string'&&!session.diagnosticOf&&first.evidenceScope!=='remediation_support_only'&&last.result?.outcome==='INCORRECT'&&(!mathKey||!solvedKeys.has(mathKey)))supportQueue.push({id,at:Number(last.at)||0,name,label});
  const firstText=conflict?'首次提交顺序需要核对':'本次首次提交：'+displayed+'（'+result(first)+'）';
  rows.push({at:Number(first.at)||0,html:'<li><b>'+esc(name)+'</b>'+esc(label)+'<br>'+esc(when)+(topics.length?' · '+esc(topics.join('、')):'')+'<br>'+esc(firstText)+(helped?' · 首次提交前用过帮助':'')+(session?.relatedPracticeOf?' · 看过相关思路后的练习':'')+(responses.length>1?'；之后提交 '+(responses.length-1)+' 次，最近'+result(last):'')+'</li>'});
 }
 rows.sort((a,b)=>b.at-a.at);
 const linked=inspected.readOnly
  ?'<p role="alert">真题和衔接记录暂不能读取，原记录仍可导出。</p>'
  :'<p>真题及衔接练习：已提交 '+submissionCount+' 次，涉及 '+rows.length+' 次题目尝试。未提交的草稿不计入。</p><ol>'+rows.slice(0,15).map(row=>row.html).join('')+'</ol>'+(rows.length?'':'<p>还没有真题或衔接练习的提交记录。</p>');
 supportQueue.sort((a,b)=>b.at-a.at);
 const reviewQueue=inspected.readOnly?'':'<section data-math-support-queue><h3>真题与衔接：可以回看的错题</h3><p>只列最近一次仍未答对的尝试；点击只读回看，不会重新判分或自动加入新题。</p>'+(supportQueue.length?'<ol>'+supportQueue.slice(0,10).map(row=>'<li><button class="secondary" data-action="rtmReview" data-id="'+esc(row.id)+'">'+esc(row.name+row.label)+'</button></li>').join('')+'</ol>':'<p>当前没有需要回看的未答对尝试。</p>')+(supportQueue.length>10?'<p>显示最近 10 项；完整记录可导出。</p>':'')+'</section>';
 return '<section class="panel math-activity" data-math-activity><h2>数学学习记录</h2>'+
  '<p>本机按原始记录显示；首次提交、后续练习和帮助分别保留。</p>'+
  '<p>旧路线提交 '+legacy.length+' 次；竞赛练习提交 '+competition.length+' 次。不同来源分开统计，避免把同一练习重复合并。</p>'+
  linked+reviewQueue+mathLegacyDetails(legacy)+mathCompetitionDetails(competition)+'<div class="stage-buttons"><button class="secondary" data-action="rtmHistory">查看真题及衔接历史</button><button class="secondary" data-action="competitionRecords">查看竞赛练习记录</button><button class="secondary" data-action="progressExport">导出全部记录与草稿</button></div></section>';
}
function progressPage(){
 const routes=[{code:'C01',title:'水果集合',frontier:saved.fruitFrontier,total:FRUIT_TASKS.length},...CATALOG.topics.filter(t=>COURSES[t.code]).map(t=>({code:t.code,title:COURSES[t.code].title,frontier:courseRecord(t.code).frontier,total:COURSES[t.code].steps.length}))];
 const taskMap=new Map([...FRUIT_TASKS.map((task,i)=>[task.id,{task,code:'C01',i,title:'水果集合'}]),...Object.entries(COURSES).flatMap(([code,course])=>course.steps.map((task,i)=>[task.id,{task,code,i,title:course.title}]))]);
 const mistakes=Object.entries(saved.errors).map(([id,count])=>({...taskMap.get(id),count:Number(count)||0})).filter(x=>x.task&&x.count>0).sort((a,b)=>b.count-a.count||a.code.localeCompare(b.code));
 return `<div class="page-head"><div><p class="kicker">仅限当前浏览器</p><h1>本机学习进度</h1></div><button class="back" data-action="home">← 地图</button></div>${mathActivityPanel()}<div class="panel"><p class="muted">✓ 只表示路线走完；每条路线隔24小时换情境两题首答正确才显示 ★，也不代表整个考点已掌握。错误次数仅是复习线索。旧版已通过的巩固记录会保留，但修订过的路线须回看新版任务，隔日独立通过后才重新显示 ★。</p><div class="progress-grid">${routes.map(r=>`<div class="progress-card"><b>${esc(r.title)}</b><small>${r.frontier}/${r.total} 步 · ${esc(reviewStatus(r.code))}</small><div class="step-bar" role="progressbar" aria-valuenow="${r.frontier}" aria-valuemin="0" aria-valuemax="${r.total}"><i style="width:${r.frontier/r.total*100}%"></i></div><button class="secondary mini" data-action="${r.code==='C01'?'fruit':'course'}" data-code="${esc(r.code)}">${r.frontier===r.total?'回看路线':'继续学习'}</button></div>`).join('')}</div><p class="tiny-note">已试做单题样例：${Object.values(saved.seen).filter(Boolean).length}/33。记录只保存在这台设备的当前浏览器。</p></div><section class="panel review-panel"><h2>曾经答错的步骤</h2><p class="muted">按错误尝试次数排序。点一下可回看该题，再请孩子说一说当时怎么想。</p>${mistakes.length?`<div class="review-list">${mistakes.slice(0,12).map(m=>`<button data-action="jump" data-code="${esc(m.code)}" data-step="${m.i}"><span><b>${esc(m.title)} · 第${m.i+1}步</b><small>${esc(m.task.prompt)}</small></span><strong>错过 ${m.count} 次 →</strong></button>`).join('')}</div>`:'<p class="muted">尚无错误尝试记录。</p>'}<p class="tiny-note">隔日巩固在再次打开页面时按本机时间开放；没有后台定时任务，不生成新题，也不上传记录。</p></section><section class="panel"><h2>本机作答证据</h2><p class="muted">保存了 ${saved.attempts.length} 次有效提交，其中微技能正式测验/回访 ${assessmentEvidenceCounts(saved.attempts).microSkill} 个不同实例、旧路线测验/巩固 ${assessmentEvidenceCounts(saved.attempts).legacyRoute} 个不同实例留下无提示首答正确记录。样题、操作练习和迁移练习另记练习结果。重开、刷新、回看和重做保留练习记录，不再重复增加独立证据。旧版日志保留作参考，无法据此确认独立首答；路线进度不受影响。</p><div class="attempt-list">${saved.attempts.slice(-12).reverse().map(a=>`<div><b>${esc(a.taskInstanceId||'题号缺失（旧记录）')}</b><span>${esc(a.phase||'任务')} · ${a.gradingResult==='correct'?'答对':'待改正'} · ${assessmentIndependentRecord(a)?(a.evidenceScope==='micro-skill'?'微技能正式首答':'旧路线正式首答'):['legacy-unverified','version-unverified'].includes(a.evidenceStatus)?'旧日志：独立性未核验':a.repeatOfKnownInstance?'同实例再次练习':a.unassistedFirstSubmissionCorrect?'练习首答正确':'未形成独立首答证据'}${a.hintEvents?.some(e=>e.kind==='hint')?' · 看过提示':''}${a.hintEvents?.some(e=>e.kind==='explore')?' · 看过思路卡':''}${a.modelViewed?(a.teachingExposure?.length?' · 回看过概念、示范或操作':' · 看过示范'):''}</span></div>`).join('')||'<p>暂无作答记录。</p>'}</div></section>`
}
function catalogPageHtml(){
 const registered=ExamMapping.data.registeredProblems||{},coverage=ExamMapping.data.coverage,years=[...new Set(CATALOG.entries.map(e=>e.year))].sort((a,b)=>b-a),list=CATALOG.entries.filter(e=>(!filterYear||e.year===Number(filterYear))&&(!filterTopic||(filterTopic==='__pending__'?!e.code:e.code===filterTopic))),pageSize=25,pages=Math.max(1,Math.ceil(list.length/pageSize));catalogPage=Math.min(catalogPage,pages-1);
 return `<div class="page-head"><div><p class="kicker">家长 · 真题资料与映射进度</p><h1>${years.length} 届 · ${CATALOG.entries.length} 题</h1></div><button class="back" data-action="home">← 地图</button></div><div class="panel"><p class="muted">已取得来源资料 ${coverage.sourceRetrieved} 题，完成解法与训练映射 ${coverage.mappingVerified} 题，另有 ${coverage.mappingPending} 题待编写映射。儿童题目形式另行审核，符合已选知识和负担要求后才进入练习。2021年没有AMC8赛事。</p><div class="catalog-controls"><label>年份<select data-filter="year"><option value="">全部</option>${years.map(y=>`<option value="${y}" ${String(y)===filterYear?'selected':''}>${y}</option>`).join('')}</select></label><label>知识点<select data-filter="topic"><option value="">全部</option><option value="__pending__" ${filterTopic==='__pending__'?'selected':''}>知识映射待编写</option>${CATALOG.topics.map(t=>`<option value="${t.code}" ${filterTopic===t.code?'selected':''}>${t.code} ${esc(t.title)}</option>`).join('')}</select></label></div><p class="tiny-note">当前 ${list.length} 题。已标注题目按一个主要教学目标筛选；待映射题目保留原卷年份和题号。</p><div class="catalog-list">${list.slice(catalogPage*pageSize,(catalogPage+1)*pageSize).map(e=>{const id='AMC8-'+e.year+'-'+String(e.no).padStart(2,'0'),row=registered[id],mapped=ExamMapping.data.problems[id],label=mapped?'映射已核验 · '+ChildReviewStatus.label(ConnectedLearning.review(mapped)):row?.sourceRetrieved?'题干、选项、图示及参考答案已导入 · 映射待编写':'来源资料待补';return `<div class="catalog-item"><b>${e.year} · 第 ${e.no} 题　${e.code?esc(e.code)+' '+esc(titleFor(e.code)):'知识映射待编写'}</b><small>${esc(e.summary)} · ${esc(label)}</small></div>`}).join('')}</div><div class="pager"><button data-action="page" data-delta="-1" ${catalogPage===0?'disabled':''}>← 上一页</button><span>${catalogPage+1} / ${pages}</span><button data-action="page" data-delta="1" ${catalogPage===pages-1?'disabled':''}>下一页 →</button></div></div>`;
}
function skillMapPage(){return `<div class="page-head"><div><p class="kicker">33 单元 · ${SKILL_DATA.skills.length} 个微技能</p><h1>微技能练习</h1></div><button class="back" data-action="home">← 地图</button></div><div class="panel"><p class="muted">先看概念、条件和反例，再看另一道例子的示范，轮到自己动手。每项还有对象辨识、迁移和后续新题，按当前需要进入。</p></div>${SKILL_DATA.units.map(u=>`<section class="panel micro-unit"><h2>${esc(u.id)} ${esc(u.title)}</h2><div class="micro-list">${u.skillIds.map(id=>{const skill=SKILL_DATA.skills.find(s=>s.id===id),task=MICRO_TASKS[id],tried=saved.attempts.some(a=>a.taskInstanceId===task?.id&&a.gradingResult==='correct');return `<button class="primary" data-action="learn" data-code="${esc(id)}">${esc(id)} · ${esc(skill.title)} <small>学概念、条件与反例</small></button><button class="secondary" data-action="micro" data-code="${esc(id)}">${esc(id)} ${esc(skill?.name||skill?.title||'')} <small>${tried?'本题已练过':'练一题'}</small></button>${WORKSHOP_TASKS[id]?`<button class="secondary" data-action="workshop" data-code="${esc(id)}">${esc(id)} · 动手操作 <small>另一个数学任务</small></button>`:''}${FRACTION_TASKS[id]?`<button class="secondary" data-action="fraction" data-code="${esc(id)}">${esc(id)} · 分数操作 <small>实际涂格、比较或取余</small></button>`:''}${PERCENT_TASKS[id]?`<button class="secondary" data-action="percent" data-code="${esc(id)}">${esc(id)} · 百分数操作 <small>涂格、复制、变基准或估算</small></button>`:''}${INTEGER_TASKS[id]?`<button class="secondary" data-action="integer" data-code="${esc(id)}">${esc(id)} · 数轴与方格操作 <small>走格、铺方格或逐轮相乘</small></button>`:''}${RATIO_TASKS[id]?`<button class="secondary" data-action="ratio" data-code="${esc(id)}">${esc(id)} · 比与份数操作 <small>圈份、摆两色、复制或分袋</small></button>`:''}${RATE_TASKS[id]?`<button class="secondary" data-action="rate" data-code="${esc(id)}">${esc(id)} · 单位率操作 <small>逐格均分或换算单位卡</small></button>`:''}${JOURNEY_TASKS[id]?`<button class="secondary" data-action="journey" data-code="${esc(id)}">${esc(id)} · 行程操作 <small>摆时间格、路程和共同产出</small></button>`:''}${SCALE_TASKS[id]?`<button class="secondary" data-action="scale" data-code="${esc(id)}">${esc(id)} · 比例变化操作 <small>同比复制、铺面积或按新基准增减</small></button>`:''}${EQUATION_TASKS[id]?`<button class="secondary" data-action="equation" data-code="${esc(id)}">${esc(id)} · 等量操作 <small>摆天平、同取、逆向移数或代回</small></button>`:''}${CONSTRAINT_TASKS[id]?`<button class="secondary" data-action="constraint" data-code="${esc(id)}">${esc(id)} · 方程与限制操作 <small>逆向分组、配对或试装库存</small></button>`:''}${PATTERN_TASKS[id]?`<button class="secondary" data-action="pattern" data-code="${esc(id)}">${esc(id)} · 模式递推操作 <small>圈周期、续数列或涂二维方格</small></button>`:''}${COORDINATE_TASKS[id]?`<button class="secondary" data-action="coordinate" data-code="${esc(id)}">${esc(id)} · 表格坐标操作 <small>实际落点、位移或运行对应</small></button>`:''}${GROUPING_TASKS[id]?`<button class="secondary" data-action="grouping" data-code="${esc(id)}">${esc(id)} · 整除数位操作 <small>实际分组、配对或组成数卡</small></button>`:''}${FACTOR_TASKS[id]?`<button class="secondary" data-action="factor" data-code="${esc(id)}">${esc(id)} · 因数质数操作 <small>拼长方阵并收录不同因数</small></button>`:''}${COMMON_TASKS[id]?`<button class="secondary" data-action="common" data-code="${esc(id)}">${esc(id)} · 共同关系操作 <small>摆双时间线、分组或试铺方块</small></button>`:''}${CYCLE_TASKS[id]?`<button class="secondary" data-action="cycle" data-code="${esc(id)}">${esc(id)} · 余数循环操作 <small>实际装袋、绕环或生成末位</small></button>`:''}${MEASURE_TASKS[id]?`<button class="secondary" data-action="measure" data-code="${esc(id)}">${esc(id)} · 测量操作 <small>量线、描边、铺格或重排</small></button>`:''}${ANGLE_TASKS[id]?`<button class="secondary" data-action="angle" data-code="${esc(id)}">${esc(id)} · 角与分割操作 <small>转射线、拼角或连对角线</small></button>`:''}${COMPOSITE_TASKS[id]?`<button class="secondary" data-action="composite" data-code="${esc(id)}">${esc(id)} · 剪拼与计数操作 <small>移动原格、剪孔或收录方块</small></button>`:''}${CIRCLE_TASKS[id]?`<button class="secondary" data-action="circle" data-code="${esc(id)}">${esc(id)} · 圆与弧操作 <small>连接半径、走弧或搬扇形片</small></button>`:''}${SIMILAR_TASKS[id]?`<button class="secondary" data-action="similar" data-code="${esc(id)}">${esc(id)} · 相似缩放操作 <small>配点边角、同比缩放或实际测量</small></button>`:''}${RIGHT_TASKS[id]?`<button class="secondary" data-action="right" data-code="${esc(id)}">${esc(id)} · 直角与平方操作 <small>核对角边、拼原格或量距离</small></button>`:''}${SOLID_TASKS[id]?`<button class="secondary" data-action="solid" data-code="${esc(id)}">${esc(id)} · 立体与展开操作 <small>折原面、堆原块或选外面</small></button>`:''}${COMBIN_TASKS[id]?`<button class="secondary" data-action="combin" data-code="${esc(id)}">${esc(id)} · 搭配与排列 <small>动手操作并核对</small></button>`:''}${CHART_TASKS[id]?`<button class="secondary" data-action="chart" data-code="${esc(id)}">${esc(id)} · 图表与刻度 <small>动手操作并核对</small></button>`:''}${STATS_TASKS[id]?`<button class="secondary" data-action="stats" data-code="${esc(id)}">${esc(id)} · 统计与频数 <small>动手操作并核对</small></button>`:''}${CHANCE_TASKS[id]?`<button class="secondary" data-action="chance" data-code="${esc(id)}">${esc(id)} · 概率与结果树 <small>动手操作并核对</small></button>`:''}${MOTION_TASKS[id]?`<button class="secondary" data-action="motion" data-code="${esc(id)}">${esc(id)} · 空间变换与折剪 <small>动手操作并核对</small></button>`:''}${INVARIANT_TASKS[id]?`<button class="secondary" data-action="invariant" data-code="${esc(id)}">${esc(id)} · 条件与不变量 <small>动手操作并核对</small></button>`:''}${SETS_TASKS[id]?`<button class="secondary" data-action="sets" data-code="${esc(id)}">${esc(id)} · 集合与补集操作 <small>登记原人、分区与逐身份计数</small></button>`:''}`}).join('')}</div></section>`).join('')}`}
function objectSortBoard(task){const selected=new Set(draft.selected),order=displayOrder(task,'objects');const card=i=>`<div class="object-unit"><button class="object-card ${selected.has(i)?'selected':''}" data-action="sortObject" data-index="${i}" data-object-id="${esc(assessmentOptionId(task,'objects',i))}" aria-pressed="${selected.has(i)}">${esc(task.objects[i])}</button>${CompetitionSpeech.numericOption(task.objects[i])?'':`<button class="read-inline object-speech" data-action="speakObject" data-index="${i}" aria-label="只朗读这张卡片">🔊</button>`}</div>`;return `<div class="board object-board"><p class="tiny-note">点卡片放进或移出托盘；点喇叭只听这张卡。</p><div class="object-area"><section class="object-zone"><h3>待分的对象</h3><div class="object-grid">${order.map(i=>!selected.has(i)?card(i):'').join('')}</div></section><section class="object-zone object-tray"><h3>我的托盘 · ${selected.size} 件</h3><div class="object-grid">${order.map(i=>selected.has(i)?card(i):'').join('')}</div></section></div><button class="secondary mini" data-action="sortUndo" ${draft.selected.length?'':'disabled'}>↩ 撤销最后一件</button></div>`}
function microPage(){const task=MICRO_TASKS[microSkillId],skill=SKILL_DATA.skills.find(s=>s.id===microSkillId);if(!task||!skill)return `<div class="panel">任务不存在。<button data-action="skillMap">回微技能目录</button></div>`;return `<div class="page-head"><div><p class="kicker">${esc(task.skillId)} · 单项对象练习</p><h1>${esc(skill.name||skill.title||titleFor(task.skillId.split('.')[0]))}</h1></div><button class="back" data-action="skillMap">← 微技能</button></div><div class="work"><article class="panel"><span class="phase">练 · 一题</span><h2 class="task-title">${esc(task.prompt)}</h2>${objectSortBoard(task)}${actionRow(task)}</article><aside class="side-stack"><section class="panel">${DEMO_TASKS[task.skillId]?`<button class='secondary' data-action='demo' data-code='${esc(task.skillId)}'>先看另一道例子的示范 →</button>`:''}<button class="primary" data-action="learn" data-code="${esc(task.skillId)}">学概念、为什么与反例 →</button><h3>这题能证明什么？</h3><p class="muted">记录一次选择与反馈。托盘里的对象会随点击进出；当前题不证明你已完成本技能的示范、完整教具操作、解释、迁移、独立测验和隔日新题。</p>${WORKSHOP_TASKS[task.skillId]?`<button class="secondary mini" data-action="workshop" data-code="${esc(task.skillId)}">继续动手操作 →</button>`:''}${FRACTION_TASKS[task.skillId]?`<button class="secondary mini" data-action="fraction" data-code="${esc(task.skillId)}">涂分数条并比较 →</button>`:''}${PERCENT_TASKS[task.skillId]?`<button class="secondary mini" data-action="percent" data-code="${esc(task.skillId)}">操作百分数模型 →</button>`:''}${INTEGER_TASKS[task.skillId]?`<button class="secondary mini" data-action="integer" data-code="${esc(task.skillId)}">操作数轴与方格 →</button>`:''}${RATIO_TASKS[task.skillId]?`<button class="secondary mini" data-action="ratio" data-code="${esc(task.skillId)}">操作比与份数 →</button>`:''}${RATE_TASKS[task.skillId]?`<button class="secondary mini" data-action="rate" data-code="${esc(task.skillId)}">操作单位率 →</button>`:''}${JOURNEY_TASKS[task.skillId]?`<button class="secondary mini" data-action="journey" data-code="${esc(task.skillId)}">操作行程与时间 →</button>`:''}${SCALE_TASKS[task.skillId]?`<button class="secondary mini" data-action="scale" data-code="${esc(task.skillId)}">操作比例变化 →</button>`:''}${EQUATION_TASKS[task.skillId]?`<button class="secondary mini" data-action="equation" data-code="${esc(task.skillId)}">操作等量天平 →</button>`:''}${CONSTRAINT_TASKS[task.skillId]?`<button class="secondary mini" data-action="constraint" data-code="${esc(task.skillId)}">操作方程与库存 →</button>`:''}${PATTERN_TASKS[task.skillId]?`<button class="secondary mini" data-action="pattern" data-code="${esc(task.skillId)}">操作模式与递推 →</button>`:''}${COORDINATE_TASKS[task.skillId]?`<button class="secondary mini" data-action="coordinate" data-code="${esc(task.skillId)}">操作表格与坐标 →</button>`:''}${GROUPING_TASKS[task.skillId]?`<button class="secondary mini" data-action="grouping" data-code="${esc(task.skillId)}">操作整除与数位 →</button>`:''}${FACTOR_TASKS[task.skillId]?`<button class="secondary mini" data-action="factor" data-code="${esc(task.skillId)}">操作因数与质数 →</button>`:''}${COMMON_TASKS[task.skillId]?`<button class="secondary mini" data-action="common" data-code="${esc(task.skillId)}">操作公因数与公倍数 →</button>`:''}${CYCLE_TASKS[task.skillId]?`<button class="secondary mini" data-action="cycle" data-code="${esc(task.skillId)}">操作余数与循环 →</button>`:''}${MEASURE_TASKS[task.skillId]?`<button class="secondary mini" data-action="measure" data-code="${esc(task.skillId)}">操作长度周长与面积 →</button>`:''}${ANGLE_TASKS[task.skillId]?`<button class="secondary mini" data-action="angle" data-code="${esc(task.skillId)}">操作角与多边形 →</button>`:''}${COMPOSITE_TASKS[task.skillId]?`<button class="secondary mini" data-action="composite" data-code="${esc(task.skillId)}">实际剪拼与收录方块 →</button>`:''}${CIRCLE_TASKS[task.skillId]?`<button class="secondary mini" data-action="circle" data-code="${esc(task.skillId)}">实际连接圆与操作弧面 →</button>`:''}${SIMILAR_TASKS[task.skillId]?`<button class="secondary mini" data-action="similar" data-code="${esc(task.skillId)}">实际配对应与缩放测量 →</button>`:''}${RIGHT_TASKS[task.skillId]?`<button class="secondary mini" data-action="right" data-code="${esc(task.skillId)}">操作直角、平方与距离 →</button>`:''}${SOLID_TASKS[task.skillId]?`<button class="secondary mini" data-action="solid" data-code="${esc(task.skillId)}">操作立体与展开 →</button>`:''}${COMBIN_TASKS[task.skillId]?`<button class="secondary mini" data-action="combin" data-code="${esc(task.skillId)}">操作搭配与排列 →</button>`:''}${CHART_TASKS[task.skillId]?`<button class="secondary mini" data-action="chart" data-code="${esc(task.skillId)}">操作图表与刻度 →</button>`:''}${STATS_TASKS[task.skillId]?`<button class="secondary mini" data-action="stats" data-code="${esc(task.skillId)}">操作统计与频数 →</button>`:''}${CHANCE_TASKS[task.skillId]?`<button class="secondary mini" data-action="chance" data-code="${esc(task.skillId)}">操作概率与结果树 →</button>`:''}${MOTION_TASKS[task.skillId]?`<button class="secondary mini" data-action="motion" data-code="${esc(task.skillId)}">操作空间变换与折剪 →</button>`:''}${INVARIANT_TASKS[task.skillId]?`<button class="secondary mini" data-action="invariant" data-code="${esc(task.skillId)}">操作条件与不变量 →</button>`:''}${SETS_TASKS[task.skillId]?`<button class="secondary mini" data-action="sets" data-code="${esc(task.skillId)}">操作原身份与集合 →</button>`:''}<button class="secondary mini" data-action="${task.skillId.startsWith('C01.')?'fruit':'course'}" data-code="${esc(task.skillId.split('.')[0])}">进入所属单元路线 →</button></section></aside></div>${stageLinks(task.skillId)}`}
function render(){
 syncStorageStatus();
 const active=document.activeElement,action=active?.dataset?.action,focusIndex=action==='bundleDot'?active.dataset.index:null;
 root.innerHTML=view==='reading'?ReadingUI.render():playerPage();
 if(view==='home'&&!homePortal||view==='knowledge'||view==='progress')root.innerHTML+=ReadingUI.entry();
 if(view!=='reading')root.innerHTML+=ReadingUI.mathBridge(taskNow(),feedback);
 if(actionMessage)root.innerHTML+='<p class="feedback no" role="alert">'+esc(actionMessage)+'</p>';
 ReadingUI.afterRender();
 ExamMappingUI.afterRender();
 if(focusIndex!==null)root.querySelector?.(`[data-action="bundleDot"][data-index="${focusIndex}"]`)?.focus({preventScroll:true});
 if(action==='learnTab')root.querySelector?.('[data-action="learnTab"][data-value="'+learnTab+'"]')?.focus({preventScroll:true});
 if(action==='learnCounter')root.querySelector?.('[data-action="learnCounter"]')?.focus({preventScroll:true});
 if(action==='topicSelect')root.querySelector?.('[data-action="topicSelect"][data-code="'+active.dataset.code+'"]')?.focus({preventScroll:true});
 if(action?.startsWith('competition')){const selector='[data-action="'+action+'"]'+(Number.isInteger(Number(active.dataset.index))&&active.dataset.index!==undefined?'[data-index="'+Number(active.dataset.index)+'"]':'');root.querySelector?.(selector+':not(:disabled)')?.focus({preventScroll:true})}
 if(action==='explorePick'||action==='exploreUndo')root.querySelector?.('[data-action="explorePick"]:not(:disabled),[data-action="exploreUndo"]:not(:disabled)')?.focus({preventScroll:true});

}
function taskNow(){return playerTask()}
function check(){if(view==='competition'){competitionSubmit();return}if(TASK_PLAYERS[view]?.readOnly||feedback?.ok)return;const task=taskNow();if(!task)return;if(task.joint&&!jointReady(task)){feedback={ok:false,text:'先把共同目标的响应填完整；0也要明确填写。'};render();return;}let ok=false,reason='再观察图中的对象和数量，然后调整答案。';
 if(taskAdapter(task)){const result=taskAdapter(task).grade(task);ok=result.ok;reason=result.reason}
 else if(task.mode==='people'){ok=sameSet(draft.selected,task.want);reason='再核对每位小朋友手里的水果：有没有漏选或多选？'}
 else if(task.mode==='choice'){ok=draft.choice===task.answer;reason=view==='fruit'?'先看清要找的是完整的一组、只属于一组，还是共同部分。':'对照图和题目，再看每个选项代表什么。'}
 else if(task.mode==='multi'){ok=sameSet(draft.selected,task.answer);reason='试着逐个检查，别漏选，也别多选。'}
 else if(task.mode==='objectSort'){ok=sameSet(draft.selected,task.answer);reason='托盘里还有不符合条件的对象，或者遗漏了符合条件的对象。逐个对照题目限定的整体、单位和关系。'}
 else if(view==='workshop'){const result=workshopGrade(task);ok=result.ok;reason=result.reason}
 else if(task.mode==='fractionLab'){const result=fractionGrade(task);ok=result.ok;reason=result.reason}
 else if(task.mode==='percentLab'){const result=percentGrade(task);ok=result.ok;reason=result.reason}
 else if(task.mode==='integerLab'){const result=integerGrade(task);ok=result.ok;reason=result.reason}
 else if(task.mode==='ratioLab'){const result=ratioGrade(task);ok=result.ok;reason=result.reason}
 else if(task.mode==='rateLab'){const result=rateGrade(task);ok=result.ok;reason=result.reason}
 else if(task.mode==='journeyLab'){const result=journeyGrade(task);ok=result.ok;reason=result.reason}
 else if(task.mode==='scaleLab'){const result=scaleGrade(task);ok=result.ok;reason=result.reason}
 else if(task.mode==='equationLab'){const result=equationGrade(task);ok=result.ok;reason=result.reason}
 else if(task.mode==='constraintLab'){const result=constraintGrade(task);ok=result.ok;reason=result.reason}
 else if(task.mode==='patternLab'){const result=patternGrade(task);ok=result.ok;reason=result.reason}
  else if(task.mode==='coordinateLab'){const result=coordinateGrade(task);ok=result.ok;reason=result.reason}
  else if(task.mode==='groupingLab'){const result=groupingGrade(task);ok=result.ok;reason=result.reason}
  else if(task.mode==='factorLab'){const result=factorGrade(task);ok=result.ok;reason=result.reason}
  else if(task.mode==='commonLab'){const result=commonGrade(task);ok=result.ok;reason=result.reason}
  else if(task.mode==='cycleLab'){const result=cycleGrade(task);ok=result.ok;reason=result.reason}
  else if(task.mode==='measureLab'){const result=measureGrade(task);ok=result.ok;reason=result.reason}
  else if(task.mode==='angleLab'){const result=angleGrade(task);ok=result.ok;reason=result.reason}
  else if(task.mode==='compositeLab'){const result=compositeGrade(task);ok=result.ok;reason=result.reason}
  else if(task.mode==='circleLab'){const result=circleGrade(task);ok=result.ok;reason=result.reason}
  else if(task.mode==='similarLab'){const result=similarGrade(task);ok=result.ok;reason=result.reason}
  else if(task.mode==='rightLab'){const result=rightGrade(task);ok=result.ok;reason=result.reason}
  else if(task.mode==='solidLab'){const result=solidGrade(task);ok=result.ok;reason=result.reason}
  else if(task.mode==='combinLab'){const result=combinGrade(task);ok=result.ok;reason=result.reason}
  else if(task.mode==='chartLab'){const result=chartGrade(task);ok=result.ok;reason=result.reason}
  else if(task.mode==='statsLab'){const result=statsGrade(task);ok=result.ok;reason=result.reason}
  else if(task.mode==='chanceLab'){const result=chanceGrade(task);ok=result.ok;reason=result.reason}
  else if(task.mode==='motionLab'){const result=motionGrade(task);ok=result.ok;reason=result.reason}
  else if(task.mode==='invariantLab'){const result=invariantGrade(task);ok=result.ok;reason=result.reason}
  else if(task.mode==='setsLab'){const result=setsGrade(task);ok=result.ok;reason=result.reason}
 else if(task.mode==='pairs'){const chosen=draft.selected.map(i=>task.options[i]);ok=chosen.length===task.answer.length&&new Set(chosen).size===chosen.length&&task.answer.every(x=>chosen.includes(x));reason='先固定第一种物品逐个搭配，重复的卡片只选一张。'}
 else if(task.mode==='bundleTen'){ok=draft.bundled&&draft.choice===0&&task.initialTens+1===task.tens&&task.initialOnes-10===task.ones;reason=draft.bundled?draft.choice<0?'已经换出新十棒。再判断两种摆法的总数是否一样。':'把10个一换成1个十，没有添点也没有拿走点，再想想总数。':draft.selected.length===10?'10个散点已在捆扎框里。请点框下方的“捆好这10个一，换成1根十棒”。':`捆扎框里有${draft.selected.length}个，还差${10-draft.selected.length}个一。点散点盘里的圆点放进去。`}
 else if(task.mode==='enumerate'){ok=draft.entries.length===task.answer.length&&new Set(draft.entries).size===task.answer.length&&task.answer.every(x=>draft.entries.includes(x));reason=task.orderMatters?'固定第一位，逐个列出全部不同顺序；检查有没有漏掉。':'前后互换只算同一组；检查是否漏了某一对。'}
 else if(task.mode==='netSelect'){ok=sameSet(draft.selected,task.answer);reason='试着把与C相邻的四面沿边折起，找中心C背后的那一面。'}
 else if(task.mode==='netFold'){ok=draft.selected.length===5&&Number(draft.number)===task.answer;reason=draft.selected.length<5?'先把五个面逐个沿边折起；E 要在 D 折起后才能折。':'连同中间的 C，再数一数纸盒的六个面。'}
 else if(task.mode==='selectIcons'){ok=sameSet(draft.selected,task.answer);reason='逐个核对圈出的图标：只圈出题目问的那一类。'}
 else if(task.mode==='cycleOverlap'){ok=draft.choice===task.answer;reason='找两盏灯同时亮的第一个正时刻；第0分钟是起点。'}
 else if(task.mode==='balanceUnknown'){ok=draft.moves===1&&draft.number.trim()!==''&&Number(draft.number)+task.known===task.total;reason=draft.moves!==1?'先让天平左右各拿走同样的3颗，再看袋子等于右边剩下的数量。':'把袋子里的数放回原式，检查两边是否一样多。'}
 else if(task.mode==='parityMoves'){ok=draft.moves===task.moves&&draft.choice===task.answer&&(task.start+task.delta*draft.moves)%2===(task.answer==='奇'?1:0);reason='按相同操作做满次数，再看每一次能不能两两配对，选一直保持的奇偶性。'}
 else if(task.mode==='tenTap'){ok=draft.selected.length===task.answer&&draft.selected.every(i=>i>=task.filled&&i<task.target);reason='只点空着的格子，看看还差几格才能补满。'}
 else if(task.mode==='sequence'){ok=draft.tokens.length===task.answer.length&&draft.tokens.every((x,i)=>x===task.answer[i]);reason=task.sequenceFeedback||'先圈出重复的一组，或者看相邻数字怎样变化。'}
 else if(task.mode==='lineWalk'){ok=draft.moves>0&&draft.position===task.target;reason='沿数轴一次走一格，注意左边更小、右边更大。'}
 else if(task.mode==='barBuild'){ok=task.barValues.every((v,i)=>(draft.barHeights[i]??0)===v);reason='先把每组张数换成格数；三根柱子都要与刻度一致。'}
 else if(task.mode==='arcSelect'){ok=draft.selected.length===task.answer;reason='圆周四段等长，选其中一段表示四分之一。'}
 else if(task.mode==='sides'){ok=sameSet(draft.selected,task.answer);reason='沿最外面绕一圈，中间的小格不在外边。'}
 else if(task.mode==='placeValue'){ok=draft.tens===task.tens&&draft.ones===task.ones;reason='先数十棒，再数单个圆点。两个位置都要对。'}
 else if(task.mode==='gridSelect'){ok=task.selectionRule==='count'?draft.selected.length===task.answer.length:sameSet(draft.selected,task.answer);reason=task.selectionRule==='count'?'数一数点亮了几格；位置由你决定。':'沿题目说的位置数行和列，检查剪掉的格子。'}
 else if(task.mode==='redistribute'){const values=draft.values??task.values;ok=values.length===task.answer.length&&values.every((n,i)=>n===task.answer[i])&&values.reduce((a,b)=>a+b,0)===task.values.reduce((a,b)=>a+b,0);reason='总数不变；从多的一盘搬到少的一盘，让每盘一样多。'}
 else if(task.mode==='number'){ok=draft.number.trim()!==''&&Number(draft.number)===task.answer;reason='检查图中每一块代表什么，再试一次。'}
 else if(task.mode==='formula'){const result=checkExpression(draft.tokens,task.counts,{min:task.terms??task.minTerms??2,max:task.terms??task.maxTerms??5});ok=result.ok;reason=result.reason}
 if(!ok&&task.mode==='choice'&&draft.choice<0)reason='先选一个答案，再检查它与图中的数量是否一致。';
 if(!ok&&task.mode==='number'&&draft.number.trim()==='')reason='先输入你算出或数到的数字。';
 if(!ok&&task.mode==='choice'&&task.distractorFeedback?.[draft.choice])reason=task.distractorFeedback[draft.choice];
 if(!ok&&task.mode==='number'&&task.numberFeedback?.[draft.number])reason=task.numberFeedback[draft.number];
 if(!ok&&task.mode==='gridSelect'&&task.positionFeedback&&draft.selected.length===task.answer.length)reason=task.positionFeedback;
 // Exploration cards are optional guided explanation; actual mathematical actions
 // and independent answers are graded by the task-specific relation above.
 if(ok&&task.reason&&draft.reason<0){feedback={ok:false,text:'先说一说你的理由，再选一张依据卡。'};render();return}
 if(ok&&task.reason&&draft.reason!==task.reason.answer){ok=false;reason=task.reason.feedback?.[draft.reason]||'这张依据卡不能说明你的做法，再看一遍题目。'}
 const incomplete=!ok&&(taskAdapter(task)?.grade(task).incomplete||view==='workshop'&&workshopGrade(task).incomplete||task.mode==='fractionLab'&&fractionGrade(task).incomplete||task.mode==='percentLab'&&percentGrade(task).incomplete||task.mode==='integerLab'&&integerGrade(task).incomplete||task.mode==='ratioLab'&&ratioGrade(task).incomplete||task.mode==='rateLab'&&rateGrade(task).incomplete||task.mode==='journeyLab'&&journeyGrade(task).incomplete||task.mode==='scaleLab'&&scaleGrade(task).incomplete||task.mode==='equationLab'&&equationGrade(task).incomplete||task.mode==='constraintLab'&&constraintGrade(task).incomplete||task.mode==='patternLab'&&patternGrade(task).incomplete||task.mode==='coordinateLab'&&coordinateGrade(task).incomplete||task.mode==='groupingLab'&&groupingGrade(task).incomplete||task.mode==='factorLab'&&factorGrade(task).incomplete||task.mode==='commonLab'&&commonGrade(task).incomplete||task.mode==='cycleLab'&&cycleGrade(task).incomplete||task.mode==='measureLab'&&measureGrade(task).incomplete||task.mode==='angleLab'&&angleGrade(task).incomplete||task.mode==='compositeLab'&&compositeGrade(task).incomplete||task.mode==='circleLab'&&circleGrade(task).incomplete||task.mode==='similarLab'&&similarGrade(task).incomplete||task.mode==='rightLab'&&rightGrade(task).incomplete||task.mode==='solidLab'&&solidGrade(task).incomplete||task.mode==='combinLab'&&combinGrade(task).incomplete||task.mode==='chartLab'&&chartGrade(task).incomplete||task.mode==='statsLab'&&statsGrade(task).incomplete||task.mode==='chanceLab'&&chanceGrade(task).incomplete||task.mode==='motionLab'&&motionGrade(task).incomplete||task.mode==='invariantLab'&&invariantGrade(task).incomplete||task.mode==='setsLab'&&setsGrade(task).incomplete||['choice','cycleOverlap'].includes(task.mode)&&draft.choice<0||['number','netFold'].includes(task.mode)&&draft.number.trim()===''||task.mode==='balanceUnknown'&&(draft.moves===0||draft.number.trim()==='')||task.mode==='formula'&&draft.tokens.length===0||['people','multi','pairs','tenTap','sides','gridSelect','netSelect','arcSelect','selectIcons','objectSort'].includes(task.mode)&&draft.selected.length===0||task.mode==='sequence'&&draft.tokens.length===0||task.mode==='lineWalk'&&draft.moves===0||task.mode==='barBuild'&&draft.barHeights.every(x=>!x)||task.mode==='redistribute'&&!draft.values||task.mode==='bundleTen'&&!draft.bundled||task.mode==='enumerate'&&draft.entries.length===0||task.mode==='parityMoves'&&(draft.moves<task.moves||draft.choice===-1));
 if(incomplete){feedback={ok:false,text:reason};render();return}
 recordAttempt(task,ok);
 feedback={ok,text:ok?'答对了！'+task.explain:reason};if(ok&&view==='sample'){saved.seen[sampleCode]=true;persist()}else if(!ok&&(view==='fruit'||view==='course'||view==='transfer')){saved.errors[task.id]=(Number(saved.errors[task.id])||0)+1;if(view==='transfer')reviewRecord(courseCode).clean=false;persist()}render();
}
function sceneSpeech(scene){if(!scene)return '';if(scene.type==='dots'||scene.type==='strips')return ' 图中：'+scene.groups.map(([name,,n])=>name+n+'个').join('，');if(['tiles','equation','sequence'].includes(scene.type))return ' 图中依次是：'+scene.tokens.join('，');if(scene.type==='table')return ' 表格：'+scene.rows.map(r=>r.join('，')).join('；');if(scene.type==='barChart')return ` 柱形图纵轴从零到${scene.max}，每格${scene.step}；请自己读柱顶对应的刻度。`;if(scene.type==='grid')return ` 图为${scene.cols}列${scene.rows}行的方格。`;if(scene.type==='placeValue')return ' 图中：'+scene.values.map(([t,o])=>t+'根十棒、'+o+'个圆点').join('；');if(scene.type==='spinner')return ' 转盘平均分为六格，依次标记：'+scene.labels.join('，');if(scene.type==='fractions')return ' 分数条分别涂色'+scene.values.map(([a,b])=>a+'格，共'+b+'格').join('；');if(scene.type==='coordinate')return ' 坐标图：'+scene.points.map(([x,y,name])=>(name||'点')+'在横坐标'+x+'，纵坐标'+y).join('；');if(scene.type==='cuboid')return ` 长方体的长、宽、高分别是${scene.dims.join('、')}。`;if(scene.type==='circle')return ' 圆形示意：'+(scene.label||'观察半径和直径。');if(scene.type==='circleArc')return ' 圆周被平均分成四段，高亮其中一段。'+(scene.label||'');if(scene.type==='pythagoras')return ` 直角三角形两直角边上的正方形边长分别是${scene.legs.join('和')}。`;if(scene.type==='rightTriangle')return ' 直角三角形两条直角边是'+(scene.legs||[3,4]).join('和');if(scene.type==='net')return ' 图中是六个正方形相连的展开图。';return ''}
function operationSpeech(task){
 if(!task)return '';
 if(taskAdapter(task))return taskAdapter(task).speech(task);
 if(task.mode==='fractionLab')return fractionSpeech(task);
 if(task.mode==='percentLab')return percentSpeech(task);
 if(task.mode==='integerLab')return integerSpeech(task);
 if(task.mode==='ratioLab')return ratioSpeech(task);
 if(task.mode==='rateLab')return rateSpeech(task);
 if(task.mode==='journeyLab')return journeySpeech(task);
 if(task.mode==='scaleLab')return scaleSpeech(task);
 if(task.mode==='equationLab')return equationSpeech(task);
 if(task.mode==='constraintLab')return constraintSpeech(task);
 if(task.mode==='patternLab')return patternSpeech(task);
 if(task.mode==='coordinateLab')return coordinateSpeech(task);
 if(task.mode==='groupingLab')return groupingSpeech(task);
 if(task.mode==='factorLab')return factorSpeech(task);
 if(task.mode==='commonLab')return commonSpeech(task);
 if(task.mode==='cycleLab')return cycleSpeech(task);
 if(task.mode==='measureLab')return measureSpeech(task);
 if(task.mode==='angleLab')return angleSpeech(task);
 if(task.mode==='compositeLab')return compositeSpeech(task);
 if(task.mode==='circleLab')return circleSpeech(task);
 if(task.mode==='similarLab')return similarSpeech(task);
 if(task.mode==='rightLab')return rightSpeech(task);
 if(task.mode==='solidLab')return solidSpeech(task);
 if(task.mode==='combinLab')return combinSpeech(task);
 if(task.mode==='chartLab')return chartSpeech(task);
 if(task.mode==='statsLab')return statsSpeech(task);
 if(task.mode==='chanceLab')return chanceSpeech(task);
 if(task.mode==='motionLab')return motionSpeech(task);
 if(task.mode==='invariantLab')return invariantSpeech(task);
 if(task.mode==='setsLab')return setsSpeech(task);
 if(view==='workshop'){const w=workshopState(task);return task.mode==='equalGroups'?`三盘依次有${w.counts.join('、')}颗，待分区有${task.groups*task.each-w.counts.reduce((a,b)=>a+b,0)}颗。`:task.mode==='reverseExchange'?`现在${w.tens}根十棒、${w.ones}个散点，总数${w.tens*10+w.ones}。`:task.mode==='compareBuild'?`左盘${w.left}，右盘${w.right}。`:task.mode==='counterRemove'?`盘里${task.initial-w.removed.length}颗，旁边放了${w.removed.length}颗。`:task.mode==='inverseMove'?`当前${task.initial+w.added-w.removed}颗，已添${w.added}、已拿走${w.removed}。`:task.mode==='orderGroups'?`两组分别${w.first}颗和${w.second}颗。`:`已经摆了${w.count}颗。`}
 if(task.mode==='objectSort')return `托盘里有${draft.selected.length}件：${draft.selected.map(i=>task.objects[i]).join('，')||'空'}。`;
 if(task.mode==='people')return `已经圈出${draft.selected.length}张人物卡。${draft.selected.map(i=>PEOPLE[i].name).join('、')}`;
 if(task.mode==='bundleTen')return draft.bundled?`散点盘还剩${task.initialOnes-10}个散点；框内十个散点已换成一根十棒。`:`散点盘中有${task.initialOnes-draft.selected.length}个散点，捆扎框里有${draft.selected.length}个散点。`;
 if(task.mode==='netFold')return `中心C面保持不动，已经折起${draft.selected.map(i=>'ABCDEF'[i]).join('、')||'零'}面。E必须在D折起后才可以折。`;
 if(task.mode==='balanceUnknown')return draft.moves?`天平两边各拿走${task.known}颗，现在左边是未知袋，右边剩${task.total-task.known}颗。`:`左边是未知袋和${task.known}颗，右边是${task.total}颗，两边还没有拿走物品。`;
 if(task.mode==='redistribute')return `现在各${task.pileLabels?'组':'盘'}依次有${(draft.values??task.values).join('、')}${task.pileLabels?'枚':'颗'}。${draft.source>=0?'已选出第'+(draft.source+1)+'处作来源。':''}`;
 if(task.mode==='lineWalk')return `从${task.start}出发，已经走${draft.moves}格，现在在${draft.position??task.start}。`;
 if(task.mode==='selectIcons')return `已经圈出${draft.selected.length}枚图标。`;
 if(task.mode==='cycleOverlap')return draft.choice>0?`目前选择第${draft.choice}分钟。`:'还没有选中共同亮起的时刻。';
 if(task.mode==='enumerate')return `已记录${draft.entries.length}种，当前摆了${draft.tokens.join('、')||'空位'}。`;
 if(task.mode==='barBuild')return `各柱当前高度依次是${task.barLabels.map((name,i)=>name+(draft.barHeights[i]??0)+'格').join('，')}。`;
 if(task.mode==='placeValue')return `已点出${draft.tens}根十棒和${draft.ones}个圆点。`;
 if(['gridSelect','tenTap','arcSelect','sides','netSelect','multi','pairs'].includes(task.mode))return `当前已点选${draft.selected.length}处。`;
 if(task.mode==='sequence')return `已经补了${draft.tokens.length}块：${draft.tokens.join('、')||'还没有'}。`;
 if(task.mode==='parityMoves')return `已完成${draft.moves}次操作，当前有${task.start+task.delta*draft.moves}个点。`;
 return '';
}
function setSpeechStatus(message){speechMessage=message;const target=document.getElementById('speech-status');if(target)target.textContent=message}
function stopAllSpeech(){speechSequence++;demoStop();ExamMappingUI.stop();if('speechSynthesis' in window)try{window.speechSynthesis.cancel()}catch{}setSpeechStatus('已停止朗读。')}
function speak(kind='prompt',index=-1,override=''){const task=taskNow();if(!task)return;if(!('speechSynthesis' in window)){setSpeechStatus('此浏览器暂不支持朗读，可以继续看图操作。');return}const sequence=++speechSequence;try{window.speechSynthesis.cancel();let extra=task.options?' 选项：'+displayOrder(task,'options').map(i=>task.options[i]).join('，'):'';
 if(view==='sample'||view==='course'||view==='transfer')extra+=sceneSpeech(task.scene);
 if((view==='course'||view==='transfer')&&task.mode==='tenTap')extra+=` 十格板已有${task.filled}格，请点空格。`;
 if((view==='course'||view==='transfer')&&task.mode==='sequence')extra+=' 图中依次是：'+task.pattern.join('，')+'。可选：'+task.palette.join('，');
 if((view==='course'||view==='transfer')&&task.mode==='sides')extra+=` 图为${task.rect[0]}列${task.rect[1]}行的小方格，选外边。`;
 if((view==='course'||view==='transfer')&&task.mode==='placeValue')extra+=` 图有${task.tens}根十棒、${task.ones}个圆点，请分别点选。`;
 if((view==='course'||view==='transfer')&&task.mode==='bundleTen')extra+=` 图中有${task.initialTens}根十棒和${task.initialOnes}个散点。点十个散点放进捆扎框，再点捆棒按钮，最后判断总数有没有变化。`;
 if((view==='course'||view==='transfer')&&task.mode==='enumerate')extra+=` 可选卡片：${task.items.join('、')}。每次摆${task.slots}张并记录。`;
 if((view==='course'||view==='transfer')&&task.mode==='parityMoves')extra+=` 从${task.start}开始，每次${task.delta>0?'加':'拿走'}${Math.abs(task.delta)}个，请操作${task.moves}次。`;
 if((view==='course'||view==='transfer')&&task.mode==='gridSelect')extra+=` 图有${task.cols}列${task.rows}行的小方格，${task.selectionRule==='count'?'点亮指定数量，位置可以自己选。':'按题意选指定位置。'}`;
 if(task.mode==='lineWalk')extra+=` 从${task.start}出发，目标是${task.target}，每次走一格。`;
 if(task.mode==='barBuild')extra+=` 每格代表${task.barScale}张；${task.barLabels.map((x,i)=>x+'有'+task.barValues[i]*task.barScale+'张').join('，')}。`;
 if(task.mode==='arcSelect')extra+=' 圆周平均分为四段，可以点任意一段。';
 if(task.mode==='netFold')extra+=' 先把 A、B、D、F 折起，再把连接在 D 外侧的 E 折起来。中间的 C 也算一面。';
 if(task.mode==='balanceUnknown')extra+=` 左盘是未知袋加${task.known}颗，右盘是${task.total}颗；两边必须做同样动作。`;
 if(task.mode==='objectSort')extra+=' 待分对象依次是：'+displayOrder(task,'objects').map(i=>task.objects[i]).join('，')+'。逐件选择符合条件的对象。';
 if(task.explore&&exploreOpen)extra+=' 你也可以用思路卡解释做法。'+task.explore.prompt+' 可选卡片：'+task.explore.cards.join('，');
 if(task.reason)extra+=' 请先说理由，再选依据。'+task.reason.prompt+' 依据卡：'+displayOrder(task,'reason').map(i=>task.reason.options[i]).join('，');
 if(view==='fruit'&&task.mode==='people')extra+=' 人物卡：'+PEOPLE.map(p=>p.name+'喜欢'+(p.group==='o'?'苹果和香蕉':p.group==='r'?'苹果':'香蕉')).join('，');
 if(task.mode==='formula'){const n=parts(task.counts),[a,b]=groupNames(task),labels={R:'只'+a,O:'两种都参加',Y:'只'+b,A:a+'整组',B:b+'整组'};extra+=' 可选人数卡：'+task.allowed.map(id=>labels[id]+n[id]+'人').join('，')}
 const person=PEOPLE[index];
 const content=kind==='surface'?override:kind==='workChoice'?workshopChoiceSpeech(task,index):kind==='person'&&person?`${person.name}喜欢${person.group==='o'?'苹果和香蕉':person.group==='r'?'苹果':'香蕉'}`:kind==='object'?task.objects?.[index]:kind==='option'?task.options?.[index]:kind==='reasonPrompt'?task.reason?.prompt:kind==='reasonCard'?task.reason?.options?.[index]:kind==='explorePrompt'&&exploreOpen?task.explore?.prompt:kind==='exploreCard'&&exploreOpen?task.explore?.cards?.[index]:kind==='scene'?sceneSpeech(task.scene):kind==='state'?operationSpeech(task):kind==='hint'&&hintOpen&&task.hint?task.hint:kind==='feedback'&&feedback?feedback.text:kind==='worked'&&modelOpen&&task.worked?task.worked.steps.join('。'):kind==='prompt'?(view==='network'?NODE_BY_ID.get(networkSkillId).concept:task.prompt+extra):'';
 if(!content)return;const current=()=>{const active=taskNow();return sequence===speechSequence&&(active===task||active?.competition&&task.competition&&active.competition.signature===task.competition.signature)};const u=new SpeechSynthesisUtterance(content);u.lang='zh-CN';u.rate=.85;u.onerror=()=>{if(current())setSpeechStatus('朗读未成功，请检查设备音量或换用系统可用的中文声音。')};u.onend=()=>{if(current()&&speechMessage==='正在尝试朗读…')setSpeechStatus('朗读已结束。')};window.speechSynthesis.speak(u);setSpeechStatus('正在尝试朗读…')}catch{if(sequence===speechSequence)setSpeechStatus('朗读未成功，请直接阅读题目。')}}
document.addEventListener('submit',e=>{const form=e.target.closest?.('[data-competition-form]');if(!form)return;e.preventDefault();competitionHandleAction(form.dataset.competitionForm==='extension'?'competitionExtensionCheck':'check',{});});
document.addEventListener('input',e=>{if(ReadingUI.input(e.target))return;if(learnerSketchHandleInput(e.target)||competitionHandleInput(e.target))return;const field=e.target.dataset?.jointField;if(field&&view==='joint'&&taskNow()&&jointFields(taskNow()).some(([k])=>k===field)&&!feedback?.ok){jointState().responses[field]=String(e.target.value).slice(0,40);feedback=null;if(topicSessionMatches())persist();return;}if(e.target.matches('[data-input="number"]')&&!feedback?.ok){draft.number=e.target.value;if(topicSessionMatches())persist()}});
document.addEventListener('change',e=>{if(ReadingUI.input(e.target))return;if(learnerSketchHandleInput(e.target))return;const key=e.target.dataset.filter;if(!key)return;if(key==='year')filterYear=e.target.value;if(key==='topic')filterTopic=e.target.value;catalogPage=0;render()});
document.addEventListener('keydown',e=>{if(e.isComposing)return;if(e.key==='Enter'){const key=e.target.dataset?.competitionInput;if(['relation','candidates'].includes(key)){e.preventDefault();competitionHandleAction(key==='relation'?'competitionRelationCheck':'competitionCandidatesCheck',{scope:e.target.dataset.scope||'main'});return}if(['final','extension','reasoning'].includes(key)){e.preventDefault();const action=key==='extension'?'competitionExtensionCheck':key==='reasoning'?'reasoningCheck':'check';competitionHandleAction(action,{});return}if(['expressionInput','semanticExpressionInput'].includes(e.target.dataset?.learnerSketchInput)){e.preventDefault();learnerSketchHandleAction(e.target.dataset.learnerSketchInput==='semanticExpressionInput'?'learnerSketchSemanticCheck':'learnerSketchCheck',{scope:e.target.closest?.('[data-sketch-scope]')?.dataset.sketchScope||'main'});return}}if(!['Enter',' '].includes(e.key))return;const face=e.target.closest('[data-action="solidFace"][role="button"], [data-action="learnerSketchSelect"][role="button"]');if(!face)return;e.preventDefault();face.dispatchEvent(new MouseEvent('click',{bubbles:true}));});
document.addEventListener('click',e=>{const btn=e.target.closest('[data-action]');if(!btn)return;const action=btn.dataset.action;if(action==='storageRetry'){retryStorage();return}if(btn.type==='submit'&&btn.closest?.('[data-competition-form]'))e.preventDefault?.();
 try{actionMessage='';
 if(action==='hubHome'){homePortal=true;open('home');return;}
 if(action==='home'||action.startsWith('topic')||action.startsWith('source'))homePortal=false;
 if((action==='reading'||action.startsWith('rd'))&&view!=='reading'){parentMathEdit=false;stopAllSpeech();}if(ReadingUI.handle(action,btn.dataset))return;
 if(action==='progressExport'){progressExport();return;}
 if(action==='speechStop'){if(view==='reading')ReadingUI.handle('rdVoiceStop',{});stopAllSpeech();return;}
 if(PeriodicPracticeUI.handle(action,btn.dataset))return;
 if(action==='rtmSubmit')e.preventDefault?.();if(ExamMappingUI.handle(action,btn.dataset))return;
 if(learnerSketchHandleAction(action,{...btn.dataset,scope:btn.dataset.scope||btn.closest?.('[data-sketch-scope]')?.dataset.sketchScope||'main'})||topicHandleAction(action,btn.dataset))return;
 if(competitionHandleAction(action,btn.dataset))return;
 if(action==='knowledge'){open('knowledge');return}
 if(action==='home'||action==='fruit'||action==='catalog'||action==='progress'||action==='sample'||action==='course'||action==='skillMap'){open(action,btn.dataset.code);return}
 if(action==='joint'){if(JOINT_TASKS[btn.dataset.code])open('joint',btn.dataset.code);return}
 if(action==='raffleTicketSpeak'){const task=taskNow(),ticket=task&&jointRaffle(task)?raffleState().tickets.find(t=>t.id===btn.dataset.id):null;if(ticket)speak('surface',-1,ticket.label);return}
 if(action==='jointMaterialSpeak'){if(view==='joint'&&taskNow())speak('surface',-1,jointMaterialText(taskNow()));return}
 if(action==='network'){open('network',btn.dataset.code||networkSkillId);return}
 if(action==='networkGraphNode'){if(view==='network'&&networkGraphModel().shown.some(item=>item.code===btn.dataset.code)){open('network',btn.dataset.code);document.getElementById('network-title')?.focus?.()}return}
 if(action==='networkGraphScope'){if(view==='network'&&['nodes','regions'].includes(btn.dataset.value)){networkGraphScope=btn.dataset.value;networkGraphPage=0;networkGraphZoom=1;render();document.getElementById('network-graph-scope-'+btn.dataset.value)?.focus?.()}return}
 if(action==='networkGraphPage'){if(view==='network'&&['-1','1'].includes(btn.dataset.delta)){const model=networkGraphModel(),page=model.page+Number(btn.dataset.delta);if(page>=0&&page<model.pages){networkGraphPage=page;render();document.getElementById(page+1>=model.pages?'network-graph-prev':page===0?'network-graph-next':btn.dataset.delta==='1'?'network-graph-next':'network-graph-prev')?.focus?.()}}return}
 if(action==='networkGraphZoom'){if(view==='network'&&['in','out','fit'].includes(btn.dataset.value)){networkGraphZoom=btn.dataset.value==='fit'?1:Math.max(1,Math.min(2.5,networkGraphZoom+(btn.dataset.value==='in'?0.25:-0.25)));render();document.getElementById('network-zoom-'+(networkGraphZoom===1||networkGraphZoom===2.5?'fit':btn.dataset.value))?.focus?.()}return}
 if(action==='networkSkill'){if(view==='network'&&NODE_BY_ID.get(btn.dataset.code)?.regionId===networkRegionId)open('network',btn.dataset.code);return}
 if(action==='networkFilter'){if(view==='network'&&(btn.dataset.value==='all'||RELATION_LABELS[btn.dataset.value])){networkFilter=btn.dataset.value;networkRelationId='';networkGraphPage=0;render();document.getElementById('network-graph-filter-'+btn.dataset.value)?.focus?.()}return}
 if(action==='networkExplain'){
  const r=RELATION_BY_ID.get(btn.dataset.code);if(view==='network'&&r&&(r.fromNodeIds.includes(networkSkillId)||r.toNodeIds.includes(networkSkillId))){networkRelationId=networkRelationId===r.id?'':r.id;if(networkRelationId)for(const sid of new Set([...r.fromNodeIds,...r.toNodeIds]))noteTeachingExposure(sid,'relation',r.id);render()}return;
 }
 if(action==='networkExplainSpeak'){const r=RELATION_BY_ID.get(btn.dataset.code);if(view==='network'&&networkRelationId===r?.id)speak('surface',-1,r.meaning+'。'+r.applicableConditions);return}
 if(action==='learn'){if(CURRICULUM.lessons[btn.dataset.code])open('learn',btn.dataset.code);return}
 if(action==='learnTab'){if(view==='learn'&&['definition','why','use'].includes(btn.dataset.value)){learnTab=btn.dataset.value;render()}return}
 if(action==='learnCounter'){if(view==='learn'){learnCounterOpen=!learnCounterOpen;render()}return}
 if(action==='learnSpeak'){if(view==='learn'&&['definition','why','use','counterexample'].includes(btn.dataset.value)&&(btn.dataset.value!=='counterexample'||learnCounterOpen))speak('surface',-1,CURRICULUM.lessons[microSkillId][btn.dataset.value]);return}
 if(action==='learnExplainSpeak'){if(view==='learn')speak('surface',-1,practiceFor(microSkillId).task.reason?.prompt||'用操作中的对象说明为什么成立。');return}
 if(action==='demo'){if(DEMO_TASKS[btn.dataset.code])open('demo',btn.dataset.code);return}
 if(action==='demoNext'){if(view==='demo'){demoStop();demoAdvance()}return}
 if(action==='demoPlay'){if(view==='demo')demoPlay();return}
 if(action==='demoPause'){demoStop();render();return}
 if(action==='demoReset'){if(view==='demo')demoReset();return}
 if(action==='demoSpeak'){if(view==='demo'){const t=DEMO_TASKS[demoSkillId],groups=demoGroups(t);speak('surface',-1,demoCursor?demoReason(t,groups[demoCursor-1],demoCursor-1,groups.length):t.prompt)}return}
 if(action==='micro'){if(MICRO_TASKS[btn.dataset.code])open('micro',btn.dataset.code);return}
 if(action==='workshop'){if(WORKSHOP_TASKS[btn.dataset.code])open('workshop',btn.dataset.code);return}
 if(action==='fraction'){if(FRACTION_TASKS[btn.dataset.code])open('fraction',btn.dataset.code);return}
 if(action==='percent'){if(PERCENT_TASKS[btn.dataset.code])open('percent',btn.dataset.code);return}
 if(action==='integer'){if(INTEGER_TASKS[btn.dataset.code])open('integer',btn.dataset.code);return}
 if(action==='ratio'){if(RATIO_TASKS[btn.dataset.code])open('ratio',btn.dataset.code);return}
 if(action==='rate'){if(RATE_TASKS[btn.dataset.code])open('rate',btn.dataset.code);return}
 if(action==='journey'){if(JOURNEY_TASKS[btn.dataset.code])open('journey',btn.dataset.code);return}
 if(action==='scale'){if(SCALE_TASKS[btn.dataset.code])open('scale',btn.dataset.code);return}
 if(action==='equation'){if(EQUATION_TASKS[btn.dataset.code])open('equation',btn.dataset.code);return}
 if(action==='constraint'){if(CONSTRAINT_TASKS[btn.dataset.code])open('constraint',btn.dataset.code);return}
 if(action==='pattern'){if(PATTERN_TASKS[btn.dataset.code])open('pattern',btn.dataset.code);return}
  if(action==='coordinate'){if(COORDINATE_TASKS[btn.dataset.code])open('coordinate',btn.dataset.code);return}
  if(action==='grouping'){if(GROUPING_TASKS[btn.dataset.code])open('grouping',btn.dataset.code);return}
  if(action==='factor'){if(FACTOR_TASKS[btn.dataset.code])open('factor',btn.dataset.code);return}
  if(action==='common'){if(COMMON_TASKS[btn.dataset.code])open('common',btn.dataset.code);return}
  if(action==='cycle'){if(CYCLE_TASKS[btn.dataset.code])open('cycle',btn.dataset.code);return}
  if(action==='measure'){if(MEASURE_TASKS[btn.dataset.code])open('measure',btn.dataset.code);return}
  if(action==='angle'){if(ANGLE_TASKS[btn.dataset.code])open('angle',btn.dataset.code);return}
  if(action==='composite'){if(COMPOSITE_TASKS[btn.dataset.code])open('composite',btn.dataset.code);return}
  if(action==='circle'){if(CIRCLE_TASKS[btn.dataset.code])open('circle',btn.dataset.code);return}
  if(action==='similar'){if(SIMILAR_TASKS[btn.dataset.code])open('similar',btn.dataset.code);return}
  if(action==='right'){if(RIGHT_TASKS[btn.dataset.code])open('right',btn.dataset.code);return}
  if(action==='solid'){if(SOLID_TASKS[btn.dataset.code])open('solid',btn.dataset.code);return}
  if(action==='combin'){if(COMBIN_TASKS[btn.dataset.code])open('combin',btn.dataset.code);return}
  if(action==='chart'){if(CHART_TASKS[btn.dataset.code])open('chart',btn.dataset.code);return}
  if(action==='stats'){if(STATS_TASKS[btn.dataset.code])open('stats',btn.dataset.code);return}
  if(action==='chance'){if(CHANCE_TASKS[btn.dataset.code])open('chance',btn.dataset.code);return}
  if(action==='motion'){if(MOTION_TASKS[btn.dataset.code])open('motion',btn.dataset.code);return}
  if(action==='invariant'){if(INVARIANT_TASKS[btn.dataset.code])open('invariant',btn.dataset.code);return}
  if(action==='sets'){if(SETS_TASKS[btn.dataset.code])open('sets',btn.dataset.code);return}
 if(action==='stage'){const [sid,kind]=(btn.dataset.code||'').split('|');if(stageAccess(sid,kind).allowed)open('stage',sid+'|'+kind);return}
 if(action==='todayPin'){const code=btn.dataset.code;if(code!=='C01'&&!COURSES[code])return;const pins=saved.recommendationPins;const i=pins.indexOf(code);if(i>=0)pins.splice(i,1);else {pins.unshift(code);pins.splice(4)}persist();render();return}
 if(action==='transfer'){const r=reviewRecord(btn.dataset.code);if(r&&!r.verifiedAt&&Date.now()>=r.dueAt)open('transfer',btn.dataset.code);return}
 if(action==='jump'){
  const code=btn.dataset.code,i=Number(btn.dataset.step);
  if(!Number.isInteger(i)||i<0)return;
  if(code==='C01'&&i<FRUIT_TASKS.length&&i<=saved.fruitFrontier){saved.fruitCursor=i;persist();open('fruit')}
  else if(COURSES[code]&&i<COURSES[code].steps.length&&i<=(saved.upgradePending[code]?saved.upgradeFrontiers[code]:courseRecord(code).frontier)){courseRecord(code).cursor=i;persist();open('course',code)}
  return
 }
 if(action==='review'){if(view==='fruit')saved.fruitCursor=0;else if(view==='course')courseRecord(courseCode).cursor=0;else return;persist();open(view,courseCode);return}
 if(action==='previous'||action==='frontier'){
  if(view==='fruit'){saved.fruitCursor=action==='previous'?Math.max(0,saved.fruitCursor-1):saved.fruitFrontier}
  else if(view==='course'){const record=courseRecord(courseCode);record.cursor=action==='previous'?Math.max(0,record.cursor-1):saved.upgradePending[courseCode]?saved.upgradeFrontiers[courseCode]:record.frontier}
  else return;persist();open(view,courseCode);return
 }
 if(action==='nextSolved'){
  if(view==='fruit'&&saved.fruitCursor<saved.fruitFrontier){saved.fruitCursor++;persist();open('fruit')}
  else if(view==='course'){const record=courseRecord(courseCode),limit=saved.upgradePending[courseCode]?saved.upgradeFrontiers[courseCode]:record.frontier;if(record.cursor<limit){record.cursor++;persist();open('course',courseCode)}}
  return
 }
 if(action==='page'){catalogPage+=Number(btn.dataset.delta);render();return}
 if(action==='speakControl'){speak('surface',-1,btn.dataset.label||'');return}
 const speakActions={speak:'prompt',speakState:'state',speakHint:'hint',speakFeedback:'feedback',speakWorked:'worked',speakOption:'option',speakObject:'object',speakReasonPrompt:'reasonPrompt',speakReasonCard:'reasonCard',speakExplorePrompt:'explorePrompt',speakExploreCard:'exploreCard',speakScene:'scene',speakPerson:'person',workSpeakChoice:'workChoice'};
 if(action==='speakObject'&&CompetitionSpeech.numericOption(taskNow()?.objects?.[Number(btn.dataset.index)]))return;
 if(speakActions[action]){speak(speakActions[action],Number(btn.dataset.index));return}
 if(action==='model'){const task=taskNow();if(!task?.worked||task.phase!=='学')return;modelOpen=!modelOpen;if(modelOpen){draft.modelViewed=true;noteSupport('model');}render();return}
 if(action==='hint'){const task=taskNow();if(!task?.hint||task.phase==='测'||task.phase==='巩固')return;if(!hintOpen)draft.hintEvents.push({at:Date.now(),kind:'hint'});hintOpen=true;noteSupport('hint');render();return}
 if(action==='next'){if(!feedback?.ok)return;if(view==='micro')open('skillMap');else if(view==='joint')open('network',JOINT_TASKS[jointTaskId].skillId);else if(PRACTICE_BANKS[view])open('network',microSkillId);else if(view==='stage')open('network',stageSkillId);else if(view==='fruit'){saved.fruitCursor++;saved.fruitFrontier=Math.max(saved.fruitFrontier,saved.fruitCursor);persist();open('fruit')}else if(view==='course'){const record=courseRecord(courseCode);record.cursor++;record.frontier=Math.max(record.frontier,record.cursor);if(saved.upgradePending[courseCode]){saved.upgradeFrontiers[courseCode]=Math.max(saved.upgradeFrontiers[courseCode]??0,record.cursor);if(record.cursor===COURSES[courseCode].steps.length){delete saved.upgradePending[courseCode];delete saved.upgradeFrontiers[courseCode];saved.reviews[courseCode]={dueAt:Date.now()+REVIEW_DELAY_MS,cursor:0,clean:true,verifiedAt:0,result:''}}}persist();open('course',courseCode)}else if(view==='transfer'){const r=reviewRecord(courseCode);r.cursor++;if(r.cursor>=FOCUS_REVIEW[courseCode].length){if(r.clean){r.verifiedAt=Date.now();r.result='verified'}else{r.cursor=0;r.dueAt=Date.now()+REVIEW_DELAY_MS;r.clean=true;r.result='retry'}persist();open(courseCode==='C01'?'fruit':'course',courseCode)}else{persist();open('transfer',courseCode)}}else if(view==='sample'&&COURSES[sampleCode])open('course',sampleCode);else open('home');return}
 if(feedback?.ok)return;
 if(action.startsWith('prediction')){const task=taskNow();if(task&&taskAdapter(task)?.act(action,btn.dataset,task)){feedback=null;render()}return}
 if(view!=='demo'&&taskAdapter(taskNow())?.act(action,btn.dataset,taskNow())){feedback=null;render();return}
 if(predictionNeeded(taskNow()||{})&&!predictionState(taskNow(),taskAdapter(taskNow()).state(taskNow())).locked)return;
 if((view==='workshop'||view==='stage')&&WORKSHOP_MODES.includes(taskNow()?.mode)&&action.startsWith('work')){if(workshopAct(action,btn.dataset,taskNow())){feedback=null;render()}return}
 if((view==='fraction'||view==='stage')&&action.startsWith('fraction')){const task=taskNow();if(task?.mode==='fractionLab'&&fractionAct(action,btn.dataset,task)){feedback=null;render()}return}
 if((view==='percent'||view==='stage'||view==='scale')&&action.startsWith('percent')){const task=taskNow();if((task?.mode==='percentLab'||task?.mode==='scaleLab'&&task.kind==='change')&&percentAct(action,btn.dataset,task)){feedback=null;render()}return}
 if((view==='integer'||view==='stage')&&action.startsWith('integer')){const task=taskNow();if(task?.mode==='integerLab'&&integerAct(action,btn.dataset,task)){feedback=null;render()}return}
 if((view==='ratio'||view==='stage')&&action.startsWith('ratio')){const task=taskNow();if(task?.mode==='ratioLab'&&ratioAct(action,btn.dataset,task)){feedback=null;render()}return}
 if((view==='rate'||view==='stage')&&action.startsWith('rate')){const task=taskNow();if(task?.mode==='rateLab'&&rateAct(action,btn.dataset,task)){feedback=null;render()}return}
 if((view==='journey'||view==='stage')&&action.startsWith('journey')){const task=taskNow();if(task?.mode==='journeyLab'&&journeyAct(action,btn.dataset,task)){feedback=null;render()}return}
 if((view==='scale'||view==='stage')&&action.startsWith('scale')){const task=taskNow();if(task?.mode==='scaleLab'&&scaleAct(action,btn.dataset,task)){feedback=null;render()}return}
 if((view==='equation'||view==='stage')&&action.startsWith('equation')){const task=taskNow();if(task?.mode==='equationLab'&&equationAct(action,btn.dataset,task)){feedback=null;render()}return}
 if((view==='constraint'||view==='stage')&&action.startsWith('constraint')){const task=taskNow();if(task?.mode==='constraintLab'&&constraintAct(action,btn.dataset,task)){feedback=null;render()}return}
 if((view==='combin'||view==='stage')&&action.startsWith('combin')){const task=taskNow();if(task?.mode==='combinLab'&&combinAct(action,btn.dataset,task)){feedback=null;render()}return}
 if((view==='chart'||view==='stage')&&action.startsWith('chart')){const task=taskNow();if(task?.mode==='chartLab'&&chartAct(action,btn.dataset,task)){feedback=null;render()}return}
 if((view==='stats'||view==='stage')&&action.startsWith('stats')){const task=taskNow();if(task?.mode==='statsLab'&&statsAct(action,btn.dataset,task)){feedback=null;render()}return}
 if((view==='chance'||view==='stage')&&action.startsWith('chance')){const task=taskNow();if(task?.mode==='chanceLab'&&chanceAct(action,btn.dataset,task)){feedback=null;render()}return}
 if((view==='motion'||view==='stage')&&action.startsWith('motion')){const task=taskNow();if(task?.mode==='motionLab'&&motionAct(action,btn.dataset,task)){feedback=null;render()}return}
 if((view==='invariant'||view==='stage')&&action.startsWith('invariant')){const task=taskNow();if(task?.mode==='invariantLab'&&invariantAct(action,btn.dataset,task)){feedback=null;render()}return}
 if((view==='sets'||view==='stage')&&action.startsWith('sets')){const task=taskNow();if(task?.mode==='setsLab'&&setsAct(action,btn.dataset,task)){feedback=null;render()}return}
 if((view==='solid'||view==='stage')&&action.startsWith('solid')){const task=taskNow();if(task?.mode==='solidLab'&&solidAct(action,btn.dataset,task)){feedback=null;render()}return}
 if((view==='right'||view==='stage')&&action.startsWith('right')){const task=taskNow();if(task?.mode==='rightLab'&&rightAct(action,btn.dataset,task)){feedback=null;render()}return}
 if((view==='similar'||view==='stage')&&action.startsWith('similar')){const task=taskNow();if(task?.mode==='similarLab'&&similarAct(action,btn.dataset,task)){feedback=null;render()}return}
 if((view==='circle'||view==='stage')&&action.startsWith('circle')){const task=taskNow();if(task?.mode==='circleLab'&&circleAct(action,btn.dataset,task)){feedback=null;render()}return}
 if((view==='composite'||view==='stage')&&action.startsWith('composite')){const task=taskNow();if(task?.mode==='compositeLab'&&compositeAct(action,btn.dataset,task)){feedback=null;render()}return}
 if((view==='angle'||view==='stage')&&action.startsWith('angle')){const task=taskNow();if(task?.mode==='angleLab'&&angleAct(action,btn.dataset,task)){feedback=null;render()}return}
  if((view==='measure'||view==='stage')&&action.startsWith('measure')){const task=taskNow();if(task?.mode==='measureLab'&&measureAct(action,btn.dataset,task)){feedback=null;render()}return}
  if((view==='cycle'||view==='stage')&&action.startsWith('cycle')){const task=taskNow();if(task?.mode==='cycleLab'&&cycleAct(action,btn.dataset,task)){feedback=null;render()}return}
  if((view==='common'||view==='stage')&&action.startsWith('common')){const task=taskNow();if(task?.mode==='commonLab'&&commonAct(action,btn.dataset,task)){feedback=null;render()}return}
  if((view==='factor'||view==='stage')&&action.startsWith('factor')){const task=taskNow();if(task?.mode==='factorLab'&&factorAct(action,btn.dataset,task)){feedback=null;render()}return}
  if((view==='grouping'||view==='cycle'||view==='stage')&&action.startsWith('group')){const task=taskNow();if(task?.mode==='groupingLab'&&groupingAct(action,btn.dataset,task)){feedback=null;render()}return}
  if((view==='coordinate'||view==='stage')&&action.startsWith('coord')){const task=taskNow();if(task?.mode==='coordinateLab'&&coordinateAct(action,btn.dataset,task)){feedback=null;render()}return}
  if((view==='pattern'||view==='cycle'||view==='stage')&&action.startsWith('pattern')){const task=taskNow();if(task?.mode==='patternLab'&&patternAct(action,btn.dataset,task)){feedback=null;render()}return}
 if(action==='sortObject'){const task=taskNow(),i=Number(btn.dataset.index);if(task?.mode!=='objectSort'||!Number.isInteger(i)||i<0||i>=task.objects.length)return;const set=new Set(draft.selected);if(set.has(i))set.delete(i);else set.add(i);draft.selected=[...set];draft.moves++;feedback=null;render();return}
 if(action==='sortUndo'){if(taskNow()?.mode!=='objectSort')return;draft.selected.pop();draft.moves++;feedback=null;render();return}
 if(action==='person'||action==='multi'){const index=Number(btn.dataset.index),set=new Set(draft.selected);set.has(index)?set.delete(index):set.add(index);draft.selected=[...set];feedback=null;render();return}
 if(action==='pairCell'){const task=taskNow(),i=Number(btn.dataset.index);if(task?.mode!=='pairs'||!Number.isInteger(i)||i<0||i>=task.options.length)return;const set=new Set(draft.selected);set.has(i)?set.delete(i):set.add(i);draft.selected=[...set];feedback=null;render();return}
 if(action==='enumItem'){const task=taskNow(),value=btn.dataset.value;if(task?.mode!=='enumerate'||!task.items.includes(value)||draft.tokens.length>=task.slots||!task.allowRepeat&&draft.tokens.includes(value))return;draft.tokens.push(value);feedback=null;render();return}
 if(action==='enumUndo'){if(taskNow()?.mode!=='enumerate')return;draft.tokens.pop();feedback=null;render();return}
 if(action==='enumRemove'){const i=Number(btn.dataset.index);if(taskNow()?.mode!=='enumerate'||!Number.isInteger(i)||i<0||i>=draft.entries.length)return;draft.entries.splice(i,1);feedback=null;render();return}
 if(action==='enumRecord'){const task=taskNow();if(task?.mode!=='enumerate'||draft.tokens.length!==task.slots)return;const key=(task.orderMatters?draft.tokens:draft.tokens.slice().sort((a,b)=>task.items.indexOf(a)-task.items.indexOf(b))).join('|');draft.tokens=[];if(draft.entries.includes(key)){feedback={ok:false,text:'这一种已经记录过了，试着换一张或换顺序。'}}else{draft.entries.push(key);feedback=null}render();return}
 if(action==='netFace'){const task=taskNow(),i=Number(btn.dataset.index);if(task?.mode!=='netSelect'||!Number.isInteger(i)||i<0||i>=6)return;const set=new Set(draft.selected);set.has(i)?set.delete(i):set.add(i);draft.selected=[...set];feedback=null;render();return}
 if(action==='selectIcon'){const task=taskNow(),i=Number(btn.dataset.index),total=task?.scene?.groups?.reduce((sum,g)=>sum+g[2],0);if(task?.mode!=='selectIcons'||!Number.isInteger(i)||i<0||i>=total)return;const set=new Set(draft.selected);set.has(i)?set.delete(i):set.add(i);draft.selected=[...set];feedback=null;render();return}
 if(action==='cycleTime'){const task=taskNow(),n=Number(btn.dataset.time);if(task?.mode!=='cycleOverlap'||!Number.isInteger(n)||n<=0||n>task.max||!task.periods.some(p=>n%p===0))return;draft.choice=n;feedback=null;render();return}
 if(action==='netFoldFace'){const task=taskNow(),i=Number(btn.dataset.index);if(task?.mode!=='netFold'||![0,1,3,4,5].includes(i))return;const set=new Set(draft.selected);if(i===4&&!set.has(3)){feedback={ok:false,text:'E 连在 D 外侧，先把 D 沿边折起。'};render();return}if(set.has(i)){set.delete(i);if(i===3)set.delete(4)}else set.add(i);draft.selected=[...set];feedback=null;render();return}
 if(action==='applyMove'){const task=taskNow();if(task?.mode!=='parityMoves'||draft.moves>=task.moves||task.start+task.delta*(draft.moves+1)<0)return;draft.moves++;feedback=null;render();return}
 if(action==='parityChoice'){if(taskNow()?.mode!=='parityMoves'||!['奇','偶'].includes(btn.dataset.value))return;draft.choice=btn.dataset.value;feedback=null;render();return}
 if(action==='bundleDot'){const task=taskNow(),i=Number(btn.dataset.index);if(task?.mode!=='bundleTen'||draft.bundled||!Number.isInteger(i)||i<0||i>=task.initialOnes)return;const set=new Set(draft.selected);if(set.has(i))set.delete(i);else if(set.size<10)set.add(i);draft.selected=[...set];feedback=null;render();return}
 if(action==='bundle'){if(taskNow()?.mode!=='bundleTen'||draft.bundled||draft.selected.length!==10)return;draft.bundled=true;draft.choice=-1;feedback=null;render();return}
 if(action==='unbundle'){if(taskNow()?.mode!=='bundleTen'||!draft.bundled)return;draft.bundled=false;draft.choice=-1;feedback=null;render();return}
 if(action==='bundleMeaning'){const i=Number(btn.dataset.index);if(taskNow()?.mode!=='bundleTen'||!draft.bundled||!Number.isInteger(i)||i<0||i>2)return;draft.choice=i;feedback=null;render();return}
 if(action==='exploreToggle'){if(!taskNow()?.explore)return;exploreOpen=!exploreOpen;if(exploreOpen)noteSupport('explore');render();return}
 if(action==='explorePick'){const task=taskNow(),i=Number(btn.dataset.index);if(!task?.explore||!Number.isInteger(i)||i<0||i>=task.explore.cards.length||draft.explore.includes(i)||draft.explore.length>=2)return;draft.explore.push(i);feedback=null;render();return}
 if(action==='exploreUndo'){if(!taskNow()?.explore||!draft.explore.length)return;draft.explore.pop();feedback=null;render();return}
 if(action==='choice'){draft.choice=Number(btn.dataset.index);feedback=null;render();return}
 if(action==='reason'){const task=taskNow(),i=Number(btn.dataset.index);if(!task?.reason||!Number.isInteger(i)||i<0||i>=task.reason.options.length)return;draft.reason=i;feedback=null;render();return}
 if(action==='lineMove'){const task=taskNow(),delta=Number(btn.dataset.delta);if(task?.mode!=='lineWalk'||![-1,1].includes(delta))return;const next=(draft.position??task.start)+delta;if(next<task.min||next>task.max)return;draft.position=next;draft.moves++;feedback=null;render();return}
 if(action==='balanceTake'){const task=taskNow();if(task?.mode!=='balanceUnknown'||draft.moves)return;draft.moves=1;feedback=null;render();return}
 if(action==='balanceUndo'){if(taskNow()?.mode!=='balanceUnknown')return;draft.moves=0;feedback=null;render();return}
 if(action==='barChange'){const task=taskNow(),i=Number(btn.dataset.index),delta=Number(btn.dataset.delta);if(task?.mode!=='barBuild'||!Number.isInteger(i)||i<0||i>=task.barLabels.length||![-1,1].includes(delta))return;draft.barHeights[i]=Math.max(0,Math.min(task.barMax,(draft.barHeights[i]??0)+delta));feedback=null;render();return}
 if(action==='arcPart'){const task=taskNow(),i=Number(btn.dataset.index);if(task?.mode!=='arcSelect'||!Number.isInteger(i)||i<0||i>=task.arcCount)return;const set=new Set(draft.selected);set.has(i)?set.delete(i):set.add(i);draft.selected=[...set];feedback=null;render();return}
 if(action==='tenCell'||action==='side'){const index=Number(btn.dataset.index),set=new Set(draft.selected),task=taskNow();if(!task||action==='tenCell'&&(index<task.filled||index>=task.target)||action==='side'&&(index<0||index>4))return;set.has(index)?set.delete(index):set.add(index);draft.selected=[...set];feedback=null;render();return}
 if(action==='seqToken'){const task=taskNow();if(!['course','transfer'].includes(view)||task?.mode!=='sequence'||draft.tokens.length>=task.answer.length)return;draft.tokens.push(btn.dataset.value);feedback=null;render();return}
 if(action==='seqUndo'){draft.tokens.pop();feedback=null;render();return}
 if(action==='place'){
  if(!['course','transfer'].includes(view)||taskNow()?.mode!=='placeValue'||!['tens','ones'].includes(btn.dataset.unit))return;
  const unit=btn.dataset.unit,delta=Number(btn.dataset.delta);if(![-1,1].includes(delta))return;
  draft[unit]=Math.max(0,Math.min(9,draft[unit]+delta));feedback=null;render();return
 }
 if(action==='cutCell'){
  const task=taskNow(),i=Number(btn.dataset.index);if(!['course','transfer'].includes(view)||task?.mode!=='gridSelect'||!Number.isInteger(i)||i<0||i>=task.cols*task.rows)return;
  if(task.marked?.includes(i))return;const chosen=new Set(draft.selected);chosen.has(i)?chosen.delete(i):chosen.add(i);draft.selected=[...chosen];feedback=null;render();return
 }
 if(action==='movePile'){
  const task=taskNow(),i=Number(btn.dataset.index);if(!['course','transfer'].includes(view)||task?.mode!=='redistribute'||!Number.isInteger(i)||i<0||i>=task.values.length)return;
  draft.values??=[...task.values];
  if(draft.source<0){if(draft.values[i]>0)draft.source=i}
  else if(draft.source===i)draft.source=-1;
  else {draft.values[draft.source]--;draft.values[i]++;draft.source=-1}
  feedback=null;render();return
 }
 if(action==='resetMoves'){if(!['course','transfer'].includes(view)||taskNow()?.mode!=='redistribute')return;draft.values=null;draft.source=-1;feedback=null;render();return}
 if(action==='term'){if(draft.tokens.length%2===0){draft.tokens.push(btn.dataset.id);feedback=null}else{feedback={ok:false,text:'先点 ＋ 或 −，再点下一张人数卡。'}}render();return}
 if(action==='op'){if(draft.tokens.length%2===1){draft.tokens.push(btn.dataset.id);feedback=null}else{feedback={ok:false,text:'先点一张人数卡。'}}render();return}
 if(action==='undo'){draft.tokens.pop();feedback=null;render();return}
 if(action==='clear'){draft.tokens=[];feedback=null;render();return}
 if(action==='check')check();
 }catch(error){console.error('Action failed:',action,error);actionMessage='这一步未能完成，当前草稿仍在。请导出记录，或稍后刷新重试。';try{render()}catch{const root=document.getElementById('app');if(root)root.innerHTML+='<p role="alert">'+actionMessage+'</p>';}}
});
const readingHost=window.__AMC8_READING_HOST;
const previousReadingView=readingHost.view;
Object.defineProperties(readingHost,{view:{configurable:true,get:()=>view,set:value=>{view=value}},saved:{configurable:true,get:()=>saved}});
readingHost.render=render;readingHost.taskNow=taskNow;
if(previousReadingView==='reading')view='reading';
window.__AMC8_MATH_NAV={
 math(){homePortal=false;open('home')},home(){homePortal=true;open('home')},progress(){homePortal=false;open('progress')},stop(){stopAllSpeech()},
 route(){if(view==='reading')return null;if(view==='home')return {page:homePortal?'hub':'math-select'};if(view==='progress')return {page:'math-progress'};if(view==='examMapping'){const a=saved.rtm1?.sessions?.active;return {page:'math-work',attemptId:a?.attemptId||null,finished:a?.finished===true}}if(view==='competition'&&topicActive&&topicSession()){const s=topicSession();return {page:'math-topic',sessionId:s.id,cursor:s.cursor,taskId:s.items[s.cursor]?.taskId||null}}return {page:'math-select'}},
 restore(target){
  homePortal=false;
  if(target?.page==='math-progress'){open('progress');return}
  if(target?.page==='math-topic'){const s=topicSession();if(s?.id===target.sessionId&&s.cursor===target.cursor&&s.items[s.cursor]?.taskId===target.taskId){topicOpenCurrent();return}open('progress');return}
  if(target?.page==='math-work'){
   const a=saved.rtm1?.sessions?.active;
   if(!target.attemptId||a?.attemptId===target.attemptId&&(!a.finished||target.finished)){ExamMappingUI.handle('rtmOpen',{});return}
   const old=a?.attemptId===target.attemptId?a:(saved.rtm1?.sessions?.archived||[]).find(x=>x.attemptId===target.attemptId);
   if(old){ExamMappingUI.handle('rtmHistory',{});ExamMappingUI.handle('rtmReview',{id:old.attemptId});return}
   open('progress');return;
  }
  open('home');
 }
};


if(window.addEventListener){window.addEventListener('beforeunload',()=>progressStore.close());window.addEventListener('pagehide',()=>progressStore.close());window.addEventListener('pageshow',event=>{if(event.persisted){if(localStorage.getItem(STORE)!==storedRaw){canPersist=false;storageMessage='记录已由其他页面更新，请先导出草稿再刷新。';syncStorageStatus()}else progressStore=ProgressStore.open(STORE,progressAdapter)}});window.addEventListener('storage',event=>{if(event.key===STORE&&event.newValue!==storedRaw){canPersist=false;storageMessage='其他页面更新了记录，本页草稿已保留，请导出后刷新。';syncStorageStatus()}});}
