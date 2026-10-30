/* Reading R1: additive local evidence. This module never opens the mathematics key. */
window.ReadingEngine=(()=>{
 'use strict';
 const DAY=86400000, MODES=['all','demand','focus','none'];
 const clone=x=>JSON.parse(JSON.stringify(x));
 const voiceKinds=new Set(['voice','story','sentence','word','character','question','repeat','option']);
 const aidKeys=new Set(['all','focus']);
 function hash(value){let h=2166136261;for(const c of String(value)){h^=c.codePointAt(0);h=Math.imul(h,16777619);}return (h>>>0).toString(16).padStart(8,'0');}
 function create(data,storage,key,clock=()=>Date.now(),options={}){
  if(!data||!Array.isArray(data.materials)||typeof key!=='string'||!key)throw Error('阅读数据或存储键无效');
  const diagnostics=data.diagnostics?.sets||[];
  const materials=[...data.materials,...diagnostics.flatMap(s=>s.forms.flatMap(f=>f.materials))];
  const bank=new Map(materials.map(m=>[m.id,m])),qs=new Map(materials.flatMap(m=>m.questions.map(q=>[q.id,{q,m}])));
  const writer=clock().toString(36)+'-'+Math.random().toString(36).slice(2,10);let sequence=0,raw=null,writeStatus='ready',writeMessage='',contentUpgradeBlocked=false;
  const defaults=()=>({pinyin:'all',rate:.85,remoteVoiceConsent:false,knownMath:[],dayRange:{start:1,end:84}});
  const fresh=()=>({schema:1,contentHash:data.contentHash,revision:0,createdAt:clock(),settings:defaults(),events:[],session:null,suspendedSessions:[],legacy:[]});
  let state=fresh();
  const finite=v=>Number.isFinite(v)&&v>=0;
  function safeObject(value){return value&&typeof value==='object'&&!Array.isArray(value)&&Object.getPrototypeOf(value)===Object.prototype;}
  const validDayRange=value=>safeObject(value)&&Number.isInteger(value.start)&&Number.isInteger(value.end)&&value.start>=1&&value.start<=value.end&&value.end<=84;
  const inDayRange=day=>{const range=state.settings.dayRange||{start:1,end:84};return Number.isInteger(day)&&day>=range.start&&day<=range.end};
  const inMaterialRange=m=>Number.isInteger(m?.day)?inDayRange(m.day):Number.isInteger(m?.week)&&m.week>=Math.ceil((state.settings.dayRange?.start||1)/7)&&m.week<=Math.ceil((state.settings.dayRange?.end||84)/7);
  const shortString=(v,max=200)=>typeof v==='string'&&v.length<=max;
  const stringList=(v,max=200)=>Array.isArray(v)&&v.length<=max&&v.every(x=>shortString(x,100));
  function validSession(s){if(s===null)return true;if(!safeObject(s)||!shortString(s.id)||!stringList(s.materialIds,20)||!s.materialIds.length||s.materialIds.some(id=>!bank.has(id))||!Number.isInteger(s.materialIndex)||s.materialIndex<0||s.materialIndex>=s.materialIds.length||!Number.isInteger(s.questionIndex)||!safeObject(s.drafts)||!finite(s.activeMs)||!finite(s.lastTick)||!finite(s.questionActiveStart)||typeof s.paused!=='boolean'||!MODES.includes(s.pinyinMode)||!Number.isInteger(s.panelIndex)||!stringList(s.openMaterialIds,20)||!safeObject(s.priorExposure)||Object.values(s.priorExposure).some(x=>typeof x!=='boolean'))return false;
   if(s.purpose==='optional-challenge'&&(!Number.isInteger(s.scopeDay)||s.materialIds.some(id=>bank.get(id)?.day!==s.scopeDay)||s.day!==null))return false;
   if(s.purpose==='unseen-choice'&&(!Number.isInteger(s.scopeDay)||s.materialIds.some(id=>bank.get(id)?.day!==s.scopeDay)||s.day!==null))return false;
   if(s.purpose==='review'&&s.scopeDay!==undefined&&!Number.isInteger(s.scopeDay))return false;
   const material=bank.get(s.materialIds[s.materialIndex]);if(s.questionIndex<0||s.questionIndex>=material.questions.length||s.panelIndex<0||s.panelIndex>=material.panels.length)return false;
   for(const [qid,value]of Object.entries(s.drafts)){const q=qs.get(qid)?.q;if(!q)return false;if(q.type==='order'){if(!Array.isArray(value)||value.length>q.options.length||new Set(value).size!==value.length||value.some(i=>!Number.isInteger(i)||i<0||i>=q.options.length))return false;}else if(!validAnswer(q,value))return false;}
   if(s.diagnostic&&(!safeObject(s.diagnostic)||!['A','B','C','D'].includes(s.diagnostic.condition)||typeof s.diagnostic.knowledgeConfirmed!=='boolean'||!shortString(s.diagnostic.setId)||!shortString(s.diagnostic.formId)))return false;
   if(s.restoredFromBackup!==undefined&&typeof s.restoredFromBackup!=='boolean')return false;
   return !s.activeByDate||safeObject(s.activeByDate)&&Object.entries(s.activeByDate).every(([d,ms])=>/^\d{4}-\d{2}-\d{2}$/.test(d)&&finite(ms));
  }
  function safeTree(value,depth=0){if(depth>30)return false;if(!value||typeof value!=='object')return true;return Object.keys(value).every(k=>!['__proto__','prototype','constructor'].includes(k)&&safeTree(value[k],depth+1));}
  function validEvent(e){if(!safeObject(e)||!shortString(e.id)||!shortString(e.type,80)||!finite(e.at))return false;
   if(e.imported!==undefined&&typeof e.imported!=='boolean')return false;
   if(['material_open','aid_requested','speech_status','answer_revealed','attempt'].includes(e.type)&&(!shortString(e.sessionId)||!shortString(e.materialId)))return false;
   if(e.type==='aid_requested')return shortString(e.kind,50)&&(!e.mode||MODES.includes(e.mode));
   if(e.type==='speech_status')return shortString(e.status,50)&&(!e.spokenText||shortString(e.spokenText,2000));
   if(e.type==='material_open')return MODES.includes(e.pinyinMode)&&typeof e.priorExposure==='boolean';
   if(e.type!=='attempt')return true;
   if(!shortString(e.questionId)||!shortString(e.materialId)||typeof e.correct!=='boolean'||typeof e.first!=='boolean'||!Number.isInteger(e.aidLevel)||e.aidLevel<0||e.aidLevel>4||!Number.isInteger(e.practiceAidLevel)||e.practiceAidLevel<0||e.practiceAidLevel>4||!['character','vocabulary','sentence','information','relation','calculation'].includes(e.errorType)||!stringList(e.targetWords,50)||e.targetWords.some(w=>['__proto__','prototype','constructor'].includes(w))||!stringList(e.tags,100)||!['reading','math','literacy'].includes(e.category)||!['recognition','facts','sequence','inference','conditions','model'].includes(e.ability)||!finite(e.activeMs)||!Number.isInteger(e.attemptNumber)||e.attemptNumber<1||!Number.isInteger(e.week)||e.week<0||e.week>12||![e.independent,e.pinyinEver,e.voiceEver,e.parentEver,e.answerExposed,e.priorExposure,e.prerequisitesConfirmed].every(v=>typeof v==='boolean'))return false;
   const descriptor=qs.get(e.questionId);return !descriptor||e.questionHash!==hash(JSON.stringify(descriptor.q))||e.materialHash!==hash(descriptor.m.text)||e.materialId===descriptor.m.id&&validAnswer(descriptor.q,e.selected);
  }
  function valid(s){return safeObject(s)&&safeTree(s)&&s.schema===1&&Number.isSafeInteger(s.revision)&&s.revision>=0&&safeObject(s.settings)&&MODES.includes(s.settings.pinyin)&&[.65,.85,1].includes(s.settings.rate)&&typeof s.settings.remoteVoiceConsent==='boolean'&&stringList(s.settings.knownMath,100)&&(s.settings.dayRange===undefined||validDayRange(s.settings.dayRange))&&Array.isArray(s.events)&&s.events.length<120000&&s.events.every(validEvent)&&new Set(s.events.map(e=>e.id)).size===s.events.length&&validSession(s.session)&&(!s.legacy||Array.isArray(s.legacy))&&(!s.suspendedSessions||Array.isArray(s.suspendedSessions)&&s.suspendedSessions.every(validSession));}
  try{raw=storage.getItem(key);if(raw!==null){const parsed=JSON.parse(raw);if(valid(parsed))state=parsed;else{writeStatus='read_only';writeMessage='原阅读记录的格式或版本无法安全读取，已保留原文并停止覆盖。';}}}
  catch(_){writeStatus='read_only';writeMessage='原阅读记录未能安全读取，当前仅保留草稿，不覆盖原记录。';}
  state.settings={...defaults(),...state.settings};state.legacy??=[];state.suspendedSessions??=[];
  let persistence=null;
  if(writeStatus==='ready'&&typeof ProgressStore!=='undefined'&&window.__AMC8_STORAGE_TEST!==true){
   persistence=ProgressStore.open(key,{storage,transactional:true,expectedRaw:raw,onStatus:result=>{
    if(contentUpgradeBlocked){options.onStatus?.({status:writeStatus,message:writeMessage});return;}
    if(result.status!=='conflict')raw=result.raw;
    writeStatus=result.status;
    writeMessage=({ready:'',acquiring:'正在保存阅读草稿，请稍候。',unsaved:'阅读记录尚未保存，请先导出当前草稿，再检查存储空间。原记录未清空。',read_only:'暂时无法保存阅读记录。请保留本页并重试，或先导出草稿。',conflict:'另一个页面更新了阅读记录。当前草稿仍在，请导出后合并。'})[result.status]||'阅读草稿尚未保存。';
    options.onStatus?.({status:writeStatus,message:writeMessage});
   }});
  }
  else if(writeStatus==='ready'&&options.requireSafe&&window.__AMC8_STORAGE_TEST!==true){writeStatus='read_only';writeMessage='安全保存功能暂不可用。请先导出阅读草稿，原记录不会被覆盖。';}
  if(writeStatus==='ready'&&raw!==null&&state.contentHash!==data.contentHash){
   // Store the exact previous record before any upgrade is allowed to write.
   // The production transactional store orders this backup before the pending
   // new snapshot while holding the same serialized writer transaction.
   const backupDigest=typeof ProgressStore!=='undefined'&&typeof ProgressStore.digest==='function'?ProgressStore.digest(raw):hash(raw);
   const backupKey=key+'_backup_before_content_'+backupDigest;let protectedOriginal=false;
   try{
    if(persistence){const result=persistence.backup(backupKey,raw);protectedOriginal=result.ok===true||result.pending===true;}
    else {const existing=storage.getItem(backupKey);if(existing!==null&&existing!==raw)throw Error('BACKUP_CONFLICT');if(existing===null)storage.setItem(backupKey,raw);protectedOriginal=storage.getItem(backupKey)===raw;}
   }catch(_){protectedOriginal=false;}
   if(!protectedOriginal){contentUpgradeBlocked=true;writeStatus='read_only';writeMessage='升级前的原始阅读记录无法安全备份，已停止升级；请导出原记录并检查存储空间。';}
   else{
    const previous=state.contentHash,policy=data.compatibility||{},knownUpgrade=policy.fromContentHash===previous,changed=new Set(policy.changedMaterialIds||[]),affected=s=>!knownUpgrade||!!s.diagnostic||s.materialIds.some(id=>changed.has(id));
    const archived=[state.session,...state.suspendedSessions].filter(s=>s&&affected(s));
    if(archived.length){state.legacy.push({schema:'amc8-reading-content-upgrade-session-archive',fromContentHash:previous,toContentHash:data.contentHash,archivedAt:clock(),reason:'题文或选项已更新，旧选项和草稿仅归档，不按新题解释。',sessions:clone(archived)});if(state.session&&affected(state.session))state.session=null;state.suspendedSessions=state.suspendedSessions.filter(s=>!affected(s));}
    state.contentHash=data.contentHash;append('content_upgrade',{fromContentHash:previous,toContentHash:data.contentHash,backupKey,archivedSessionIds:archived.map(s=>s.id),preservedSessionIds:[state.session,...state.suspendedSessions].filter(Boolean).map(s=>s.id)});
   }
  }
  if(state.session){state.session.paused=true;state.session.lastTick=clock();}
  function persist(){
   if(contentUpgradeBlocked)return false;
   if(persistence){
    if(writeStatus==='conflict')return false;
    state.revision++;writeStatus='acquiring';writeMessage='正在保存阅读草稿，请稍候。';
    const result=persistence.commit(state,raw);
    if(result.reason==='CONFLICT'){writeStatus='conflict';writeMessage='另一个页面更新了阅读记录。当前草稿仍在，请导出后合并。';}
    if(result.reason==='NOT_WRITER')persistence.retry();
    return result.ok;
   }
   if(['read_only','conflict'].includes(writeStatus))return false;
   try{if(storage.getItem(key)!==raw){writeStatus='conflict';writeMessage='另一个页面更新了阅读记录。当前草稿仍在，请导出后合并。';return false;}
    const revision=state.revision+1,next=JSON.stringify({...state,revision});storage.setItem(key,next);state.revision=revision;raw=next;writeStatus='ready';writeMessage='';return true;
   }catch(_){writeStatus='unsaved';writeMessage='阅读记录尚未保存，请先导出当前草稿，再检查存储空间。原记录未清空。';return false;}
  }
  function append(type,detail={}){const row={...clone(detail),id:writer+'-'+(++sequence),type,at:clock(),contentHash:data.contentHash};state.events.push(row);persist();return clone(row);}
  const rows=(type,id)=>state.events.filter(e=>(!type||e.type===type)&&(!id||e.questionId===id));
  const attempts=id=>clone(rows('attempt',id));
  function exposure(materialId){return state.events.some(e=>e.materialId===materialId&&['material_open','attempt','answer_revealed','legacy_exposure'].includes(e.type));}
  function current(){const s=state.session;if(!s)return null;const m=bank.get(s.materialIds[s.materialIndex]),q=m?.questions[s.questionIndex];if(!m||!q)return null;
   return {session:clone(s),material:m,question:q,attempts:attempts(q.id),readingComplete:state.events.some(e=>e.sessionId===s.id&&e.materialId===m.id&&['reading_phase_complete','attempt'].includes(e.type))||Object.keys(s.drafts).some(id=>m.questions.some(q=>q.id===id)),revealed:state.events.some(e=>e.type==='answer_revealed'&&e.questionId===q.id)};
  }
  function touch(){const s=state.session;if(!s||s.paused)return;const now=clock(),dt=now-s.lastTick;if(dt>0&&dt<=60000){s.activeMs+=dt;s.activeByDate??={};let from=s.lastTick;while(from<now){const d=new Date(from),midnight=new Date(d.getFullYear(),d.getMonth(),d.getDate()+1).getTime(),end=Math.min(now,midnight),day=localDate(from);s.activeByDate[day]=(s.activeByDate[day]||0)+end-from;from=end;}}s.lastTick=now;}
  function pause(){if(!state.session)return false;touch();state.session.paused=true;append('session_pause',{sessionId:state.session.id,day:state.session.day,activeMs:state.session.activeMs,activeByDate:state.session.activeByDate||{}});return true;}
  function resume(){const s=state.session,scopeDay=['optional-challenge','unseen-choice','review'].includes(s?.purpose)?s.scopeDay:s?.day;if(!s||Number.isInteger(scopeDay)&&!inDayRange(scopeDay)||['optional-challenge','unseen-choice'].includes(s.purpose)&&s.materialIds.some(id=>!known(bank.get(id))))return false;state.session.paused=false;state.session.lastTick=clock();append('session_resume',{sessionId:state.session.id,day:state.session.day});return true;}
  function unfinished(){
   return [state.session,...state.suspendedSessions].filter(Boolean).map(s=>({id:s.id,active:s.id===state.session?.id,day:s.day,purpose:s.purpose,materialId:s.materialIds[s.materialIndex],title:bank.get(s.materialIds[s.materialIndex])?.title||'',diagnostic:clone(s.diagnostic||null),restoredFromBackup:s.restoredFromBackup===true}));
  }
  function resumeSession(id=state.session?.id){
   if(!id)return null;
   if(state.session?.id===id){if(!resume())return null;return current();}
   const selected=state.suspendedSessions.find(s=>s.id===id);if(!selected)return null;
   const scopeDay=['optional-challenge','unseen-choice','review'].includes(selected.purpose)?selected.scopeDay:selected.day;
   if(Number.isInteger(scopeDay)&&!inDayRange(scopeDay)||['optional-challenge','unseen-choice'].includes(selected.purpose)&&selected.materialIds.some(id=>!known(bank.get(id))))return null;
   if(state.session){pause();state.suspendedSessions.push(clone(state.session));}
   state.suspendedSessions=state.suspendedSessions.filter(s=>s.id!==id);
   state.session=clone(selected);resume();return current();
  }
  function openCurrent(){const c=current();if(!c)return null;const s=state.session;
   if(!s.openMaterialIds.includes(c.material.id)){const seen=exposure(c.material.id);s.priorExposure[c.material.id]=seen;s.openMaterialIds.push(c.material.id);s.readActiveStarts??={};s.readActiveStarts[c.material.id]=s.activeMs;append('material_open',{sessionId:s.id,materialId:c.material.id,priorExposure:seen,pinyinMode:s.pinyinMode,purpose:s.purpose,diagnostic:s.diagnostic,materialHash:hash(c.material.text)});}
   s.questionActiveStart=s.activeMs;s.openQuestionAt=clock();persist();return current();
  }
  function start(ids,{day=null,purpose='practice',diagnostic=null,scopeDay=null}={}){
   if(!Array.isArray(ids)||!ids.length||ids.some(id=>!bank.has(id)))throw Error('课程材料不存在');
   if(purpose==='optional-challenge'&&(day!==null||!inDayRange(scopeDay)||ids.some(id=>bank.get(id)?.day!==scopeDay||!known(bank.get(id)))))throw Error('挑战材料不在当前允许的范围内。');
   if(purpose==='unseen-choice'&&(day!==null||!inDayRange(scopeDay)||ids.length!==1||ids.some(id=>bank.get(id)?.day!==scopeDay||!known(bank.get(id))||exposure(id))))throw Error('未见材料不在当前允许的范围内。');
   if(diagnostic){const set=diagnostics.find(x=>x.id===diagnostic.setId),form=set?.forms.find(x=>x.id===diagnostic.formId),plan=rows('diagnostic_plan').some(e=>e.setId===diagnostic.setId&&e.formId===diagnostic.formId&&e.condition===diagnostic.condition&&!e.imported);if(!set||!form||!plan||JSON.stringify(form.materials.map(m=>m.id))!==JSON.stringify(ids)||diagnostic.knowledgeConfirmed!==true)throw Error('诊断必须使用已分配的未见平行材料。');}
   if(state.session){pause();state.suspendedSessions=state.suspendedSessions.filter(s=>s.id!==state.session.id);state.suspendedSessions.push(clone(state.session));}
   const existing=!diagnostic&&state.suspendedSessions.find(s=>s.day===day&&s.purpose===purpose&&(s.scopeDay??null)===scopeDay&&JSON.stringify(s.materialIds)===JSON.stringify(ids));
   if(existing){state.session=clone(existing);state.suspendedSessions=state.suspendedSessions.filter(s=>s.id!==existing.id);resume();return current();}
   const session={id:writer+'-session-'+(++sequence),day,purpose,...(Number.isInteger(scopeDay)?{scopeDay}:{}),diagnostic:diagnostic?clone(diagnostic):null,materialIds:[...ids],materialIndex:0,questionIndex:0,panelIndex:0,openMaterialIds:[],priorExposure:{},drafts:{},activeMs:0,activeByDate:{},lastTick:clock(),paused:false,pinyinMode:diagnostic?diagnostic.condition==='B'?'all':'none':state.settings.pinyin,startedAt:clock(),questionActiveStart:0};
   state.session=session;append('session_start',{sessionId:session.id,day,purpose,diagnostic:session.diagnostic});if(purpose==='remediation'){const rec=recommend();if(rec.mathSignalId&&ids.includes(rec.materialId))append('remediation_assigned',{sessionId:session.id,mathSignalId:rec.mathSignalId,materialIds:ids});}return openCurrent();
  }
  function classifyAid(e){
   if(e.type==='material_open'&&aidKeys.has(e.pinyinMode))return 1;
   if(e.type==='answer_revealed')return 4;
   if(e.type==='speech_status'&&['requested','started','start'].includes(e.status))return 2;
   if(e.type!=='aid_requested')return 0;
   if(e.kind==='pinyin')return 1;if(e.kind==='parent')return 3;if(voiceKinds.has(e.kind))return 2;return 0;
  }
  function aidState(materialId,sessionId=null){const relevant=state.events.filter(e=>e.materialId===materialId&&(!sessionId||e.sessionId===sessionId));let level=0,pinyin=false,voice=false,parent=false,revealed=false,hint=false;
   for(const e of relevant){const n=classifyAid(e);level=Math.max(level,n);pinyin||=n===1;voice||=n===2;parent||=n===3;revealed||=n===4;hint||=e.type==='aid_requested'&&e.kind==='feedback_hint';}
   return {level,pinyinEver:pinyin,voiceEver:voice,parentEver:parent,answerExposed:revealed,feedbackHintEver:hint};
  }
  function requestAid(kind,detail={}){const c=current();if(!c)return false;touch();
   if(kind==='pinyin'&&MODES.includes(detail.mode))state.session.pinyinMode=detail.mode;
   append('aid_requested',{...detail,kind,sessionId:c.session.id,materialId:c.material.id,questionId:c.question.id,condition:c.session.diagnostic?.condition||null});return true;
  }
  function speechStatus(info={}){const c=current(),status=info.state||info.status;if(!c||typeof status!=='string')return false;
   const scoped=typeof info.requestId==='string'&&info.requestId.length>0;
   // Async callbacks must stay attached to the question/session that requested
   // them; a late callback must not establish evidence for a newer context.
   if(scoped&&(!shortString(info.requestId,200)||info.sessionId!==c.session.id||info.materialId!==c.material.id||info.questionId!==c.question.id))return false;
   const materialId=info.materialId||c.material.id;if(!bank.has(materialId))return false;
   const voice=typeof info.voice==='string'?info.voice:info.voice&&typeof info.voice==='object'?{name:String(info.voice.name||''),lang:String(info.voice.lang||''),localService:info.voice.localService===true}:null;
   append('speech_status',{sessionId:info.sessionId||c.session.id,materialId,questionId:info.questionId||c.question.id,status,kind:info.kind||'voice',spokenText:String(info.spokenText||info.text||'').slice(0,2000),voice,...(scoped?{requestId:info.requestId,originKind:info.originKind||info.kind||'voice',startedBy:info.startedBy||null}:{})});return true;
  }
  // A request must contain the actual original text, and the matching browser
  // onstart callback must have happened before the answer being evaluated.
  // Browser onstart is not proof of audibility, completion or comprehension.
  function originalStoryStarted(sessionId,material,cutoff=state.events.length){
   if(!material)return false;const prior=state.events.slice(0,cutoff);
   for(let i=0;i<prior.length;i++){const request=prior[i];
    if(request.type!=='aid_requested'||request.sessionId!==sessionId||request.materialId!==material.id||!request.requestId||request.requestedText!==material.text||!(request.kind==='story'||request.kind==='repeat'&&request.originKind==='story'))continue;
    if(prior.slice(i+1).some(e=>e.type==='speech_status'&&e.status==='started'&&e.startedBy==='onstart'&&e.sessionId===sessionId&&e.materialId===material.id&&e.questionId===request.questionId&&e.requestId===request.requestId&&e.originKind==='story'))return true;
   }return false;
  }
  function setting(name,value){if(!['pinyin','rate','remoteVoiceConsent','knownMath','dayRange'].includes(name))return false;
   if(name==='pinyin'&&!MODES.includes(value))return false;if(name==='rate'&&![.65,.85,1].includes(Number(value)))return false;
   if(name==='remoteVoiceConsent'&&typeof value!=='boolean')return false;if(name==='knownMath'&&(!Array.isArray(value)||value.some(x=>typeof x!=='string'||x.length>80)||value.length>100))return false;
   if(name==='dayRange'&&!validDayRange(value))return false;
   state.settings[name]=name==='rate'?Number(value):clone(value);append('setting',{name,value:state.settings[name]});
   if(name==='pinyin'&&state.session){state.session.pinyinMode=value;if(aidKeys.has(value))requestAid('pinyin',{mode:value});else persist();}return true;
  }
  function validAnswer(q,value){if(q.type==='order')return Array.isArray(value)&&value.length===q.options.length&&new Set(value).size===value.length&&value.every(i=>Number.isInteger(i)&&i>=0&&i<q.options.length);return Number.isInteger(value)&&value>=0&&value<q.options.length;}
  function select(value){const c=current();if(!c||state.session.paused)return false;let ok;if(c.question.type==='order')ok=Array.isArray(value)&&value.length<=c.question.options.length&&new Set(value).size===value.length&&value.every(i=>Number.isInteger(i)&&i>=0&&i<c.question.options.length);else ok=validAnswer(c.question,value);
   if(!ok)return false;touch();state.session.drafts[c.question.id]=clone(value);persist();return true;
  }
  function diagnosticValidity(c,aid){const dx=c.session.diagnostic;if(!dx)return {eligible:false,reason:'普通练习'};if(c.session.restoredFromBackup)return {eligible:false,reason:'本次对照从备份恢复，跨设备独立性尚未核验'};
   if(dx.knowledgeConfirmed!==true)return {eligible:false,reason:'数学先修知识未确认'};
   if(c.session.priorExposure[c.material.id]||rows('attempt',c.question.id).length)return {eligible:false,reason:'材料或题目已经见过'};
   if(aid.answerExposed||aid.feedbackHintEver)return {eligible:false,reason:'本材料已经看过答案、讲解或针对性提示'};
   const actualSpeech=originalStoryStarted(c.session.id,c.material);
   if(dx.condition==='A'&&aid.level>0)return {eligible:false,reason:'无辅助条件受到污染'};
   if(dx.condition==='B'&&(aid.voiceEver||aid.parentEver))return {eligible:false,reason:'拼音条件使用了听读或家长帮助'};
   if(dx.condition==='C'&&(aid.pinyinEver||aid.parentEver||!actualSpeech))return {eligible:false,reason:'原文朗读未确认开始，或使用了拼音／家长帮助'};
   if(dx.condition==='D'&&(aid.pinyinEver||aid.voiceEver||!aid.parentEver))return {eligible:false,reason:'家长代读未记录，或请求过系统朗读或显示过拼音'};
   return {eligible:true,reason:'未见材料、先修确认和指定辅助条件完整；仍需多次对照'};
  }
  function submit(value){const c=current();if(!c||state.session.paused)return null;const q=c.question;if(value===undefined)value=state.session.drafts[q.id];if(!validAnswer(q,value))return null;touch();
   const prior=rows('attempt',q.id),aid=aidState(c.material.id),practiceAid=aidState(c.material.id,c.session.id),correct=JSON.stringify(value)===JSON.stringify(q.answer),validity=diagnosticValidity(c,aid);
   const row=append('attempt',{sessionId:c.session.id,questionId:q.id,materialId:c.material.id,materialHash:hash(c.material.text),questionHash:hash(JSON.stringify(q)),pinyinHash:data.pinyinHash||null,day:c.session.day??c.material.day??null,week:c.material.week||c.session.diagnostic?.week||0,category:q.category,ability:q.ability,errorType:q.errorType,targetWords:q.targetWords?.length?q.targetWords:c.material.focusWords||[],tags:c.material.tags||[],prerequisitesConfirmed:c.session.diagnostic?.knowledgeConfirmed===true||known(c.material),selected:clone(value),correct,first:prior.length===0,attemptNumber:prior.length+1,aidLevel:aid.level,practiceAidLevel:practiceAid.level,pinyinEver:aid.pinyinEver,voiceEver:aid.voiceEver,parentEver:aid.parentEver,answerExposed:aid.answerExposed,feedbackHintEver:aid.feedbackHintEver,practiceFeedbackHintEver:practiceAid.feedbackHintEver,priorExposure:c.session.priorExposure[c.material.id]===true,independent:prior.length===0&&aid.level===0&&!aid.feedbackHintEver&&!c.session.priorExposure[c.material.id]&&!c.session.restoredFromBackup,purpose:c.session.purpose,diagnostic:c.session.diagnostic,diagnosticValidity:validity,activeMs:Math.max(0,state.session.activeMs-state.session.questionActiveStart),imported:c.session.restoredFromBackup===true});
   delete state.session.drafts[q.id];persist();return row;
  }
  function markReadDone(){const c=current();if(!c||c.session.paused||c.session.diagnostic)return false;if(state.events.some(e=>e.type==='reading_phase_complete'&&e.sessionId===c.session.id&&e.materialId===c.material.id))return false;touch();const activeMs=Math.max(0,state.session.activeMs-(state.session.readActiveStarts?.[c.material.id]||0));append('reading_phase_complete',{sessionId:c.session.id,materialId:c.material.id,activeMs,characters:Array.from(c.material.text).filter(ch=>/[\u3400-\u9fff]/u.test(ch)).length,aidLevel:aidState(c.material.id).level,method:'self-reported-read-button-interval'});return true;}
  function reveal(){const c=current();if(!c)return false;
   if(c.session.diagnostic){if(c.material.questions.some(q=>!rows('attempt',q.id).some(a=>a.sessionId===c.session.id)))return false;
    for(const q of c.material.questions)if(!state.events.some(e=>e.type==='answer_revealed'&&e.sessionId===c.session.id&&e.questionId===q.id))append('answer_revealed',{sessionId:c.session.id,materialId:c.material.id,questionId:q.id,kind:'explanation'});
    return true;
   }append('answer_revealed',{sessionId:c.session.id,materialId:c.material.id,questionId:c.question.id,kind:'explanation'});return true;}

  function panel(index){const c=current();if(!c||!Number.isInteger(index)||index<0||index>=c.material.panels.length)return false;state.session.panelIndex=index;touch();persist();return true;}
  function next(){const c=current();if(!c||!rows('attempt',c.question.id).some(e=>e.sessionId===c.session.id))return false;touch();const s=state.session;
   if(s.questionIndex+1<c.material.questions.length)s.questionIndex++;else if(s.materialIndex+1<s.materialIds.length){s.materialIndex++;s.questionIndex=0;s.panelIndex=0;}else{const complete={sessionId:s.id,day:s.purpose==='optional-challenge'?null:s.day,purpose:s.purpose,diagnostic:s.diagnostic,activeMs:s.activeMs,activeByDate:s.activeByDate||{}};state.session=null;append('session_complete',complete);return 'complete';}
   openCurrent();return true;
  }
  function firstRows(){const seen=new Set();return clone(rows('attempt').filter(e=>{const d=qs.get(e.questionId);if(!d||e.questionHash!==hash(JSON.stringify(d.q))||e.materialHash!==hash(d.m.text)||seen.has(e.questionId))return false;seen.add(e.questionId);return true;}));}
  function due(){const list=[];for(const m of data.materials){for(const q of m.questions){const a=rows('attempt',q.id).filter(e=>e.materialHash===hash(m.text)&&e.questionHash===hash(JSON.stringify(q)));if(!a.length)continue;const retention=a[0].correct&&a[0].aidLevel===0&&!a[0].feedbackHintEver&&!a[0].priorExposure&&!a[0].imported;
    const practiceDays=new Set(a.filter(e=>e.correct&&e.practiceAidLevel===0&&!e.practiceFeedbackHintEver&&!e.imported&&e.at>a[0].at&&localDate(e.at)!==localDate(a[0].at)).map(e=>localDate(e.at))).size;const intervals=retention?[7,14,28]:[1,3,7,14];if(practiceDays>=intervals.length)continue;
    const last=a[a.length-1],interval=intervals[practiceDays],dueAt=last.at+interval*DAY;if(clock()>=dueAt)list.push({materialId:m.id,questionId:q.id,errorType:q.errorType,dueAt,reviewLevel:practiceDays});
   }}return list.sort((a,b)=>a.dueAt-b.dueAt||a.questionId.localeCompare(b.questionId));}
  const known=m=>(m.prerequisites||[]).every(k=>state.settings.knownMath.includes(k));
  function weekReadiness(){const first=firstRows().filter(a=>!a.imported&&!a.answerExposed&&!a.feedbackHintEver&&!a.priorExposure);return Array.from({length:12},(_,i)=>{const week=i+1,all=first.filter(a=>a.week===week),reading=all.filter(a=>a.category!=='math'&&a.aidLevel<=1),extraction=all.filter(a=>a.category==='math'&&['conditions','model'].includes(a.ability)&&a.aidLevel<=1&&a.prerequisitesConfirmed),L0=reading.filter(a=>a.aidLevel===0),readingRate=reading.length?reading.filter(a=>a.correct).length/reading.length:0,mathRate=extraction.length?extraction.filter(a=>a.correct).length/extraction.length:0,needL0=week<=3?0:week<=6?3:week<=9?5:8,dates=new Set([...reading,...extraction].map(a=>localDate(a.at))).size;
    const ready=reading.length>=10&&readingRate>=.75&&extraction.length>=3&&mathRate>=.75&&L0.length>=needL0&&(!needL0||L0.filter(a=>a.correct).length/L0.length>=.7)&&dates>=2;
    const reason=reading.length<10?'需积累至少10道无语音、无家长帮助的新材料首答。':readingRate<.75?'阅读首答尚未达到本周75%的观察标准，先补强常见错因。':extraction.length<3?'需积累至少3道先修已确认的条件提取或建模新题。':mathRate<.75?'数学文字条件提取尚不稳定，先补充语言任务；不降低数学主线。':L0.length<needL0?'本阶段还需要更多新材料的无拼音首答；家长可逐步减少辅助，不强制撤掉。':needL0&&L0.filter(a=>a.correct).length/L0.length<.7?'无拼音新材料首答还需巩固。':dates<2?'需要至少两个学习日期的观察，不能凭一次集中作答决定进阶。':'本周任务证据达到观察门槛，可尝试更长文字，并继续用未见材料核实。';
    return {week,ready,reason,samples:all.length,dates,reading:ratio(reading),extraction:ratio(extraction),L0:ratio(L0),thresholds:{readingItems:10,readingAccuracy:.75,extractionItems:3,extractionAccuracy:.75,L0Items:needL0,L0Accuracy:needL0?.7:null,learningDates:2},confidence:ready?'训练内观察达标，非固定能力标签':'证据不足或尚需补强'};});}
  function navigation(){const range=state.settings.dayRange||{start:1,end:84},completed=new Set(rows('session_complete').filter(e=>e.day).map(e=>e.day)),calendar=data.lessons.find(l=>inDayRange(l.day)&&!completed.has(l.day))?.day||range.end,week=Math.ceil(calendar/7),readiness=weekReadiness();const held=readiness.find(r=>r.week<week&&!r.ready&&r.week*7>=range.start);return {calendar,day:Math.max(range.start,Math.min(range.end,held?held.week*7:calendar)),held};}
  function challenge(){
   // Consecutive means the last three actual first attempts, not three
   // successes filtered out of a longer sequence. Language assistance may
   // inform a practice suggestion, but never changes the independence of the
   // underlying first answer. Hints, revealed answers and prior exposure do
   // not qualify; no mastery is awarded.
   const recent=firstRows().slice(-3);
   if(recent.length<3||recent.some(a=>!a.correct||!a.first||a.imported||a.diagnostic||a.feedbackHintEver||a.answerExposed||a.priorExposure||!a.prerequisitesConfirmed))return {eligible:false,materialId:null};
   const baseline=bank.get(recent[recent.length-1].materialId);
   if(!baseline||!Number.isFinite(baseline.difficulty))return {eligible:true,materialId:null};
   const originalPrerequisites=new Set(baseline.prerequisites||[]);
   const candidates=data.materials.filter(m=>m.kind===baseline.kind&&inMaterialRange(m)&&known(m)&&!exposure(m.id)&&
    Number.isFinite(m.difficulty)&&m.difficulty>baseline.difficulty&&
    (m.prerequisites||[]).every(k=>originalPrerequisites.has(k)));
   candidates.sort((a,b)=>a.difficulty-b.difficulty||a.day-b.day||a.id.localeCompare(b.id));
   const candidate=candidates[0];
   return {eligible:true,materialId:candidate?.id||null,day:candidate?.day||null,title:candidate?.title||null,goal:candidate?.goal||null};
  }
  function startChallenge(){
   const offer=challenge();if(!(writeStatus==='ready'||writeStatus==='acquiring'&&persistence)||!offer.materialId||!inDayRange(offer.day))return null;
   // Keep day null so an older reader or rollback cannot mistake this single
   // optional passage for completion of the whole calendar day.
   return start([offer.materialId],{day:null,scopeDay:offer.day,purpose:'optional-challenge'});
  }
  function recommend(){const nav=navigation(),wrong=firstRows().filter(a=>!a.correct&&(!nav.held||a.week<=nav.held.week)),counts=Object.create(null);for(const r of wrong)counts[r.errorType]=(counts[r.errorType]||0)+1;const usedSignals=new Set(rows('remediation_assigned').map(e=>e.mathSignalId));const signal=rows('math_reading_signal').slice().reverse().find(e=>e.reason!=='math'&&!usedSignals.has(e.id));const errorType=signal?({character:'character',sentence:'sentence',conditions:'information',uncertain:'information'})[signal.reason]||null:Object.keys(counts).sort((a,b)=>counts[b]-counts[a])[0]||null;
   const available=data.materials.filter(m=>inMaterialRange(m)&&!exposure(m.id)&&known(m)&&(!nav.held||m.week<=nav.held.week)),candidate=available.find(m=>m.kind==='reserve'&&m.questions.some(q=>q.errorType===errorType))||available.find(m=>m.kind==='reserve')||available[0];
   return {materialId:candidate?.id||null,errorType,mathSignalId:signal?.id||null,fromMathTaskId:signal?.mathTaskId||null,stageReady:!nav.held,nextWeek:nav.held?nav.held.week:Math.min(12,Math.ceil(nav.calendar/7)),reason:signal?'根据数学读题时的自报困难推荐对应语言补强；这是支持线索，不改写数学能力。':nav.held?nav.held.reason:errorType?'按多次首答错误安排对应阅读补强；错误类别是线索，需要新材料核实。':'先读短篇材料，逐步积累独立证据；数学主线保持原进度。'};
  }
  function transfer(){const tags=new Set(firstRows().filter(a=>a.category==='math').slice(-8).flatMap(a=>a.tags||[]));const available=data.materials.filter(m=>m.kind==='math'&&inMaterialRange(m)&&!exposure(m.id)&&known(m));return available.find(m=>m.tags.some(t=>tags.has(t)))||available[0]||null;}
  function freshDayCandidate(day){if(!inDayRange(day))return null;const lesson=data.lessons.find(x=>x.day===day);if(!lesson)return null;return [...lesson.coreIds,...lesson.reserveIds].map(id=>bank.get(id)).find(m=>m&&m.day===day&&known(m)&&!exposure(m.id))||null;}
  function startFreshDayChoice(day){const m=freshDayCandidate(day);if(!(writeStatus==='ready'||writeStatus==='acquiring'&&persistence)||!m)return null;return start([m.id],{day:null,scopeDay:day,purpose:'unseen-choice'});}
  function startDay(day){if(!inDayRange(day))return null;const l=data.lessons.find(x=>x.day===day);if(!l)return null;const queue=due().filter(x=>inMaterialRange(bank.get(x.materialId))),nav=navigation(),rec=nav.held&&day===nav.day?recommend():null;
   const isDueReview=!rec?.materialId&&l.kind==='review'&&queue.length>0;
   const ids=rec?.materialId?[rec.materialId]:l.kind==='light'?l.coreIds.slice(0,1):isDueReview?[...new Set(queue.map(x=>x.materialId))].slice(0,2):l.coreIds;
   // A scheduled review can still complete its calendar day, as in the
   // existing course, but its purpose and material provenance stay explicit.
   // A separately chosen unseen passage never completes the calendar day.
   const result=start(ids,{day,scopeDay:isDueReview?day:null,purpose:rec?.materialId?'readiness-review':isDueReview?'review':l.kind||'practice'});if(nav.held){state.session.adaptive={heldWeek:nav.held.week,reason:nav.held.reason,explicitSelection:day!==nav.day};persist();}return result;
  }
  function nextDay(){return navigation().day;}
  function startDiagnostic(setId,knowledgeConfirmed){const set=diagnostics.find(s=>s.id===setId);if(!set)return {ok:false,reason:'诊断套题不存在。'};if(knowledgeConfirmed!==true)return {ok:false,reason:'请家长先确认本组数学知识已经掌握。'};
   const used=rows('diagnostic_plan').filter(e=>e.setId===setId),form=set.forms.find(f=>!used.some(e=>e.formId===f.id)&&f.materials.every(m=>!exposure(m.id)));
   if(!form)return {ok:false,reason:'本套四份材料已经使用，不能重记为未见诊断；请保留结果并换新的套题。'};
   const rotation=(set.week||0)%4,condition=['A','B','C','D'][(set.forms.indexOf(form)+rotation)%4],diagnostic={setId,formId:form.id,condition,week:set.week,knowledgeConfirmed:true,blueprint:clone(set.blueprint)};
   append('diagnostic_plan',{setId,formId:form.id,condition,blueprint:set.blueprint,knowledgeConfirmed:true});start(form.materials.map(m=>m.id),{purpose:'diagnostic',diagnostic});return {ok:true,condition,setId,formId:form.id};
  }
  function mathSignal(task,reason){if(!task||!['character','sentence','conditions','math','uncertain'].includes(reason))return false;append('math_reading_signal',{mathTaskId:String(task.id||''),mathSkillId:String(task.skillId||''),mathContentVersion:task.contentVersion??null,reason,source:'learner-or-parent-self-report',statement:'不修改数学得分、原始首答、已学知识或掌握状态。'});return true;}
  const ratio=a=>({correct:a.filter(x=>x.correct).length,total:a.length});
  // Reinterpret only diagnostic comparison eligibility when historic D aids or
  // C audio provenance cannot be verified. Keep original events unchanged.
  function reportDiagnosticValidity(a){
   if(!a.diagnosticValidity?.eligible)return a.diagnosticValidity||{eligible:false,reason:'条件不完整'};
   if(a.diagnostic?.condition==='D'&&(!a.parentEver||a.voiceEver||a.pinyinEver))return {eligible:false,reason:'家长代读未记录，或请求过系统朗读或显示过拼音'};
   if(a.diagnostic?.condition==='C'){const index=state.events.findIndex(e=>e.id===a.id);if(index<0||!originalStoryStarted(a.sessionId,bank.get(a.materialId),index))return {eligible:false,reason:'历史事件无法核实同次原文朗读开始，暂不计入 C 组对照'};}
   return a.diagnosticValidity;
  }
  function report(){const first=firstRows(),all=rows('attempt'),complete=rows('session_complete'),levels=[0,1,2,3].map(level=>({level,...ratio(first.filter(a=>a.aidLevel===level&&!a.feedbackHintEver))}));
   const eligible=first.filter(a=>a.diagnostic&&reportDiagnosticValidity(a).eligible&&!a.imported&&a.contentHash===data.contentHash),conditions={};for(const condition of ['A','B','C','D'])conditions[condition]=ratio(eligible.filter(a=>a.diagnostic.condition===condition));
   const matchedSets=Object.create(null);for(const a of eligible){const g=matchedSets[a.diagnostic.setId]??={blueprint:a.diagnostic.blueprint,conditions:{}};(g.conditions[a.diagnostic.condition]??=[]).push({questionId:a.questionId,correct:a.correct,category:a.category,ability:a.ability});}
   const errors=Object.create(null),words=Object.create(null);for(const a of first){if(!a.correct)errors[a.errorType]=(errors[a.errorType]||0)+1;for(const word of a.targetWords||[]){const w=words[word]??={word,correct:0,total:0,independentCorrect:0,evidenceIds:[],dates:[]};w.total++;if(a.correct)w.correct++;if(a.correct&&a.independent&&a.category==='literacy'&&a.ability==='recognition'&&!a.imported){w.independentCorrect++;w.evidenceIds.push(a.questionId);w.dates.push(localDate(a.at));}}}
   const vocabulary=Object.values(words).map(w=>({...w,status:new Set(w.evidenceIds).size>=3&&new Set(w.dates).size>=2?'跨材料稳定表现':'继续观察',scope:'任务内字词表现，非标准化识字量认证'}));
   const weeks=Array.from({length:12},(_,i)=>{const a=first.filter(x=>x.week===i+1);return {week:i+1,completedDays:new Set(complete.filter(e=>e.day&&Math.ceil(e.day/7)===i+1).map(e=>e.day)).size,first:ratio(a),L0:ratio(a.filter(x=>x.aidLevel===0&&!x.feedbackHintEver)),L1:ratio(a.filter(x=>x.aidLevel===1&&!x.feedbackHintEver)),L2:ratio(a.filter(x=>x.aidLevel===2&&!x.feedbackHintEver)),L3:ratio(a.filter(x=>x.aidLevel===3&&!x.feedbackHintEver)),explained:ratio(a.filter(x=>x.aidLevel===4))};});
   const sessionTimes=Object.create(null);for(const e of state.events.filter(x=>['session_pause','session_complete'].includes(x.type))){const p=sessionTimes[e.sessionId];if(!p||e.activeMs>=p.activeMs)sessionTimes[e.sessionId]={at:e.at,activeMs:e.activeMs||0,activeByDate:e.activeByDate||{}};}
   if(state.session)sessionTimes[state.session.id]={at:clock(),activeMs:state.session.activeMs,activeByDate:state.session.activeByDate||{}};const daily=Object.create(null);for(const s of Object.values(sessionTimes)){if(Object.keys(s.activeByDate).length){for(const [d,ms]of Object.entries(s.activeByDate))daily[d]=(daily[d]||0)+ms;}else{const d=localDate(s.at);daily[d]=(daily[d]||0)+s.activeMs;}}
   const signals=[{key:'character',label:'识字标签题的首答错误',count:errors.character||0},{key:'language',label:'词句标签题的首答错误',count:(errors.vocabulary||0)+(errors.sentence||0)},{key:'listening',label:'符合条件的听读对照题',count:conditions.C.total+conditions.D.total},{key:'conditions',label:'信息提取标签题的首答错误',count:errors.information||0},{key:'math',label:'关系或计算标签题的首答错误',count:(errors.relation||0)+(errors.calculation||0)},{key:'independent',label:'未见无辅助首答正确',count:first.filter(a=>a.correct&&a.independent&&!a.imported).length}];
   const supportEvidence={interpretation:'题目标签不等于孩子答错的原因；先看首答与求助事实，再用多份未见材料核对。',byCategory:['reading','math','literacy'].map(category=>({category,first:ratio(first.filter(a=>a.category===category)),independent:ratio(first.filter(a=>a.category===category&&a.independent&&!a.imported)),assistedFirst:ratio(first.filter(a=>a.category===category&&a.aidLevel>0&&!a.imported)),imported:first.filter(a=>a.category===category&&a.imported).length})),wrongFirst:first.filter(a=>!a.correct).map(a=>({questionId:a.questionId,materialId:a.materialId,category:a.category,itemTag:a.errorType,aidLevel:a.aidLevel,prerequisitesConfirmed:a.prerequisitesConfirmed,imported:a.imported,at:a.at})),causeConfirmed:false};
   const observations=rows('reading_phase_complete').filter(e=>!e.imported&&bank.has(e.materialId)&&finite(e.activeMs)&&finite(e.characters));const readingPace={method:'self-reported-read-button-interval',caution:'按钮前的前台活动时间包含思考，不是标准化阅读速度；诊断不计此指标。',observations:clone(observations),byAidLevel:[0,1,2,3,4].map(level=>{const a=observations.filter(e=>e.aidLevel===level&&e.activeMs>0),characters=a.reduce((n,e)=>n+e.characters,0),activeMs=a.reduce((n,e)=>n+e.activeMs,0);return {level,observations:a.length,characters,activeMs,charactersPerMinute:activeMs?Math.round(characters*60000/activeMs):null};})};const tapped=Object.create(null);for(const e of rows('aid_requested').filter(e=>e.kind==='pinyin'&&typeof e.character==='string'))tapped[e.character]=(tapped[e.character]||0)+1;const tappedCharacters=Object.entries(tapped).map(([character,requests])=>({character,requests})).sort((a,b)=>b.requests-a.requests);
   const storyReadDays=new Set(rows('reading_phase_complete').map(e=>bank.get(e.materialId)).filter(m=>m?.kind==='story'&&Number.isInteger(m.day)&&m.day>=1&&m.day<=84).map(m=>m.day)).size;
   return {storyReadDays,hintedFirst:ratio(first.filter(a=>a.feedbackHintEver)),supportEvidence,diagnosticExcluded:first.filter(a=>a.diagnostic&&(!reportDiagnosticValidity(a).eligible||a.imported||a.contentHash!==data.contentHash)).map(a=>({questionId:a.questionId,setId:a.diagnostic.setId,condition:a.diagnostic.condition,reason:a.imported?'导入证据独立性未核验':a.contentHash!==data.contentHash?'旧版本对照保留历史，不与本版本辅助条件混算':reportDiagnosticValidity(a).reason||'条件不完整',aidLevel:a.aidLevel})),readingPace,tappedCharacters,contentHash:data.contentHash,first:ratio(first),retries:Math.max(0,all.filter(e=>qs.has(e.questionId)&&e.questionHash===hash(JSON.stringify(qs.get(e.questionId).q))&&e.materialHash===hash(qs.get(e.questionId).m.text)).length-first.length),completedDays:new Set(complete.filter(e=>e.day).map(e=>e.day)).size,levels,explained:ratio(first.filter(a=>a.aidLevel===4)),conditions,matchedSets,weeks,readiness:weekReadiness(),errors,focusWords:vocabulary.filter(w=>w.status!=='跨材料稳定表现').sort((a,b)=>(b.total-b.correct)-(a.total-a.correct)).slice(0,20),vocabulary,due:due(),recommendation:recommend(),daily,signals,interpretation:'错误类型只是训练线索。需要在先修已确认、同蓝图、未见且辅助条件完整的多次对照中讨论可能原因；不能凭一次测验贴标签或把正确率差异当因果结论。',independenceCaution:'隐藏拼音不会清除已见拼音；已经看过的材料和已见讲解不计未见独立证据。',legacyCount:state.legacy.length,voiceRequests:state.events.filter(e=>e.type==='aid_requested'&&voiceKinds.has(e.kind)).length,voiceStarts:rows('speech_status').filter(e=>['started','start'].includes(e.status)).length,voiceFailures:rows('speech_status').filter(e=>['failed','error','blocked','no_voice','unsupported'].includes(e.status)).length,unverifiedImportedAttempts:first.filter(a=>a.imported).length,quarantinedAttempts:all.filter(e=>!qs.has(e.questionId)||e.questionHash!==hash(JSON.stringify(qs.get(e.questionId).q))||e.materialHash!==hash(qs.get(e.questionId).m.text)).length,diagnosticCaution:'四份材料仅按设计蓝图匹配，尚未经过真实儿童样本等值检验。'};
  }
  function localDate(at){const d=new Date(at);return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');}
  function backup(){const preserveBoth=['conflict','read_only','unsaved'].includes(writeStatus);let currentStoredRecord=null,currentStoredReadable=preserveBoth?true:null;if(preserveBoth)try{currentStoredRecord=storage.getItem(key)}catch(_){currentStoredReadable=false}
   const latestUpgrade=[...state.events].reverse().find(e=>e.type==='content_upgrade'&&typeof e.backupKey==='string'&&e.backupKey.startsWith(key+'_backup_before_content_')&&e.backupKey.length<=512);let upgradeOriginal=null,upgradeOriginalReadable=latestUpgrade?true:null;
   if(latestUpgrade)try{upgradeOriginal=storage.getItem(latestUpgrade.backupKey);if(upgradeOriginal===null)upgradeOriginalReadable=false}catch(_){upgradeOriginalReadable=false}
   return JSON.stringify({schema:'amc8-reading-r1-backup',exportedAt:clock(),contentHash:data.contentHash,reading:clone(state),unreadableOriginal:writeStatus==='read_only'?raw:null,currentStoredRecord,currentStoredReadable,baselineStoredRecord:preserveBoth&&raw!==currentStoredRecord&&writeStatus!=='read_only'?raw:null,upgradeOriginal,upgradeOriginalReadable,saveStatus:writeStatus},null,2);}

  function importBackup(text){if(['read_only','conflict'].includes(writeStatus))return {ok:false,reason:'当前处于记录保护状态，请先导出草稿并刷新核对，不能覆盖原记录。'};if(typeof text!=='string'||text.length>16000000)return {ok:false,reason:'备份格式或大小无效。'};let parsed;try{parsed=JSON.parse(text);}catch(_){return {ok:false,reason:'备份不是有效 JSON。'};}
   if(parsed.format==='tianle-record-backup-v1'&&parsed.reading)parsed={schema:'amc8-reading-r1-backup',reading:parsed.reading};
   if(parsed.schema==='tianle-reading-v2-backup'&&parsed.store?.version===2&&safeObject(parsed.store.answers)&&safeObject(parsed.store.review)&&safeObject(parsed.store.readingAids)){
    const encoded=JSON.stringify(parsed.store);if(encoded.length>4000000)return {ok:false,reason:'旧版记录过大。'};const digest=hash(encoded);if(!state.legacy.some(x=>x.digest===digest&&JSON.stringify(x.data)===encoded))state.legacy.push({digest,schema:parsed.schema,importedAt:clock(),data:clone(parsed.store),evidenceStatus:'legacy-unverified'});const saved=persist();return {ok:saved,saved,legacy:true,count:Object.keys(parsed.store.answers).length,reason:saved?undefined:'旧版记录已加入草稿，但尚未保存，请导出草稿。'};
   }
   if(parsed.schema!=='amc8-reading-r1-backup'||!valid(parsed.reading))return {ok:false,reason:'不支持的记录版本或结构，原记录没有被替换。'};
   const knownIds=new Map(state.events.map(e=>[e.id,e]));for(const e of parsed.reading.events){const old=knownIds.get(e.id);if(old){const comparable=clone(old);delete comparable.imported;const incoming=clone(e);delete incoming.imported;if(JSON.stringify(comparable)!==JSON.stringify(incoming))return {ok:false,reason:'同一事件出现冲突内容，已停止合并。'};}}
   let count=0;for(const e of parsed.reading.events)if(!knownIds.has(e.id)){state.events.push({...clone(e),imported:true});count++;}
   const restoredSessions=[],sessionsSkipped=[];
   const completed=new Set(rows('session_complete').map(e=>e.sessionId));
   const localSessions=new Set([state.session,...state.suspendedSessions].filter(Boolean).map(s=>s.id));
   for(const incoming of [parsed.reading.session,...(parsed.reading.suspendedSessions||[])].filter(Boolean)){
    if(localSessions.has(incoming.id)||completed.has(incoming.id))continue;
    if(parsed.reading.contentHash!==data.contentHash){sessionsSkipped.push({id:incoming.id,reason:'content_mismatch'});continue;}
    const restored=clone(incoming);restored.paused=true;restored.lastTick=clock();restored.restoredFromBackup=true;
    // Previous reading and assistance remain exposure, never fresh L0 evidence.
    for(const id of restored.openMaterialIds)restored.priorExposure[id]=true;
    if(!state.session)state.session=restored;else state.suspendedSessions.push(restored);
    localSessions.add(restored.id);restoredSessions.push(restored.id);
   }
   for(const legacy of parsed.reading.legacy||[])if(legacy?.digest&&!state.legacy.some(x=>x.digest===legacy.digest&&JSON.stringify(x.data)===JSON.stringify(legacy.data)))state.legacy.push(clone(legacy));
   const saved=persist();return {ok:saved,saved,count,merged:true,restoredSessions,sessionsSkipped,reason:saved?undefined:'记录已合并到草稿，但尚未保存，请导出草稿。',note:'保留本机课程；备份恢复的未完成课程暂停待续，不更改家长语音授权；外部独立性单独标记，数学记录不变。'};
  }
  function externalChange(){try{if(storage.getItem(key)!==raw){writeStatus='conflict';writeMessage='另一页面修改了阅读进度，请先导出本页草稿再合并。';}}catch(_){writeStatus='unsaved';writeMessage='暂时不能读取存储，请导出草稿。';}return {status:writeStatus,message:writeMessage};}
  return {unfinished,resumeSession,markReadDone,key,data,start,startDay,startFreshDayChoice,freshDayCandidate,startChallenge,challenge,current,nextDay,select,submit,next,panel,pause,resume,touch,setting,requestAid,speechStatus,reveal,due,recommend,transfer,startDiagnostic,mathSignal,report,backup,importBackup,externalChange,exposure,known,firstRows,attempts,snapshot:()=>clone(state),status:()=>({status:writeStatus,message:writeMessage}),persist};
 }
 return {create,hash};
})();
