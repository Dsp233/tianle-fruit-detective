/* Reading R1: additive local evidence. This module never opens the mathematics key. */
window.ReadingEngine=(()=>{
 'use strict';
 const DAY=86400000, MODES=['all','demand','focus','none'];
 const clone=x=>JSON.parse(JSON.stringify(x));
 const voiceKinds=new Set(['voice','story','sentence','word','character','question','repeat','option']);
 const aidKeys=new Set(['all','focus']);
 function hash(value){let h=2166136261;for(const c of String(value)){h^=c.codePointAt(0);h=Math.imul(h,16777619);}return (h>>>0).toString(16).padStart(8,'0');}
 function create(data,storage,key,clock=()=>Date.now()){
  if(!data||!Array.isArray(data.materials)||typeof key!=='string'||!key)throw Error('阅读数据或存储键无效');
  const diagnostics=data.diagnostics?.sets||[];
  const materials=[...data.materials,...diagnostics.flatMap(s=>s.forms.flatMap(f=>f.materials))];
  const bank=new Map(materials.map(m=>[m.id,m])),qs=new Map(materials.flatMap(m=>m.questions.map(q=>[q.id,{q,m}])));
  const writer=clock().toString(36)+'-'+Math.random().toString(36).slice(2,10);let sequence=0,raw=null,writeStatus='ready',writeMessage='';
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
  if(writeStatus==='ready'&&raw!==null&&state.contentHash!==data.contentHash){
   const previous=state.contentHash,policy=data.compatibility||{},knownUpgrade=policy.fromContentHash===previous,changed=new Set(policy.changedMaterialIds||[]),affected=s=>!knownUpgrade||!!s.diagnostic||s.materialIds.some(id=>changed.has(id));
   const archived=[state.session,...state.suspendedSessions].filter(s=>s&&affected(s));
   if(archived.length){state.legacy.push({schema:'amc8-reading-content-upgrade-session-archive',fromContentHash:previous,toContentHash:data.contentHash,archivedAt:clock(),reason:'题文或选项已更新，旧选项和草稿仅归档，不按新题解释。',sessions:clone(archived)});if(state.session&&affected(state.session))state.session=null;state.suspendedSessions=state.suspendedSessions.filter(s=>!affected(s));}
   state.contentHash=data.contentHash;append('content_upgrade',{fromContentHash:previous,toContentHash:data.contentHash,archivedSessionIds:archived.map(s=>s.id),preservedSessionIds:[state.session,...state.suspendedSessions].filter(Boolean).map(s=>s.id)});
  }
  if(state.session){state.session.paused=true;state.session.lastTick=clock();}
  function persist(){
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
  function resume(){const s=state.session,scopeDay=s?.purpose==='optional-challenge'?s.scopeDay:s?.day;if(!s||Number.isInteger(scopeDay)&&!inDayRange(scopeDay)||s.purpose==='optional-challenge'&&s.materialIds.some(id=>!known(bank.get(id))))return false;state.session.paused=false;state.session.lastTick=clock();append('session_resume',{sessionId:state.session.id,day:state.session.day});return true;}
  function unfinished(){
   return [state.session,...state.suspendedSessions].filter(Boolean).map(s=>({id:s.id,active:s.id===state.session?.id,day:s.day,purpose:s.purpose,materialId:s.materialIds[s.materialIndex],title:bank.get(s.materialIds[s.materialIndex])?.title||'',diagnostic:clone(s.diagnostic||null),restoredFromBackup:s.restoredFromBackup===true}));
  }
  function resumeSession(id=state.session?.id){
   if(!id)return null;
   if(state.session?.id===id){if(!resume())return null;return current();}
   const selected=state.suspendedSessions.find(s=>s.id===id);if(!selected)return null;
   const scopeDay=selected.purpose==='optional-challenge'?selected.scopeDay:selected.day;
   if(Number.isInteger(scopeDay)&&!inDayRange(scopeDay)||selected.purpose==='optional-challenge'&&selected.materialIds.some(id=>!known(bank.get(id))))return null;
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
   if(diagnostic){const set=diagnostics.find(x=>x.id===diagnostic.setId),form=set?.forms.find(x=>x.id===diagnostic.formId),plan=rows('diagnostic_plan').some(e=>e.setId===diagnostic.setId&&e.formId===diagnostic.formId&&e.condition===diagnostic.condition&&!e.imported);if(!set||!form||!plan||JSON.stringify(form.materials.map(m=>m.id))!==JSON.stringify(ids)||diagnostic.knowledgeConfirmed!==true)throw Error('诊断必须使用已分配的未见平行材料。');}
   if(state.session){pause();state.suspendedSessions=state.suspendedSessions.filter(s=>s.id!==state.session.id);state.suspendedSessions.push(clone(state.session));}
   const existing=!diagnostic&&state.suspendedSessions.find(s=>s.day===day&&s.purpose===purpose&&JSON.stringify(s.materialIds)===JSON.stringify(ids));
   if(existing){state.session=clone(existing);state.suspendedSessions=state.suspendedSessions.filter(s=>s.id!==existing.id);resume();return current();}
   const session={id:writer+'-session-'+(++sequence),day,purpose,...(purpose==='optional-challenge'?{scopeDay}:{}),diagnostic:diagnostic?clone(diagnostic):null,materialIds:[...ids],materialIndex:0,questionIndex:0,panelIndex:0,openMaterialIds:[],priorExposure:{},drafts:{},activeMs:0,activeByDate:{},lastTick:clock(),paused:false,pinyinMode:diagnostic?diagnostic.condition==='B'?'all':'none':state.settings.pinyin,startedAt:clock(),questionActiveStart:0};
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
   const materialId=info.materialId||c.material.id;if(!bank.has(materialId))return false;
   const voice=typeof info.voice==='string'?info.voice:info.voice&&typeof info.voice==='object'?{name:String(info.voice.name||''),lang:String(info.voice.lang||''),localService:info.voice.localService===true}:null;
   append('speech_status',{sessionId:info.sessionId||c.session.id,materialId,questionId:c.question.id,status,kind:info.kind||'voice',spokenText:String(info.spokenText||info.text||'').slice(0,2000),voice});return true;
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
   const actualSpeech=state.events.some(e=>e.type==='speech_status'&&e.sessionId===c.session.id&&e.materialId===c.material.id&&['started','start'].includes(e.status));
   if(dx.condition==='A'&&aid.level>0)return {eligible:false,reason:'无辅助条件受到污染'};
   if(dx.condition==='B'&&(aid.voiceEver||aid.parentEver))return {eligible:false,reason:'拼音条件使用了听读或家长帮助'};
   if(dx.condition==='C'&&(aid.pinyinEver||aid.parentEver||!actualSpeech))return {eligible:false,reason:'听读未实际开始或使用了额外辅助'};
   if(dx.condition==='D'&&(aid.pinyinEver||!aid.parentEver&&!actualSpeech))return {eligible:false,reason:'原文代读未记录或使用了拼音'};
   return {eligible:true,reason:'未见材料、先修确认和指定辅助条件完整；仍需多次对照'};
  }
  function submit(value){const c=current();if(!c||state.session.paused)return null;const q=c.question;if(value===undefined)value=state.session.drafts[q.id];if(!validAnswer(q,value))return null;touch();
   const prior=rows('attempt',q.id),aid=aidState(c.material.id),practiceAid=aidState(c.material.id,c.session.id),correct=JSON.stringify(value)===JSON.stringify(q.answer),validity=diagnosticValidity(c,aid);
   const row=append('attempt',{sessionId:c.session.id,questionId:q.id,materialId:c.material.id,materialHash:hash(c.material.text),questionHash:hash(JSON.stringify(q)),pinyinHash:data.pinyinHash||null,day:c.session.day??c.material.day??null,week:c.material.week||c.session.diagnostic?.week||0,category:q.category,ability:q.ability,errorType:q.errorType,targetWords:q.targetWords?.length?q.targetWords:c.material.focusWords||[],tags:c.material.tags||[],prerequisitesConfirmed:c.session.diagnostic?.knowledgeConfirmed===true||known(c.material),selected:clone(value),correct,first:prior.length===0,attemptNumber:prior.length+1,aidLevel:aid.level,practiceAidLevel:practiceAid.level,pinyinEver:aid.pinyinEver,voiceEver:aid.voiceEver,parentEver:aid.parentEver,answerExposed:aid.answerExposed,feedbackHintEver:aid.feedbackHintEver,practiceFeedbackHintEver:practiceAid.feedbackHintEver,priorExposure:c.session.priorExposure[c.material.id]===true,independent:prior.length===0&&aid.level===0&&!aid.feedbackHintEver&&!c.session.priorExposure[c.material.id]&&!c.session.restoredFromBackup,purpose:c.session.purpose,diagnostic:c.session.diagnostic,diagnosticValidity:validity,activeMs:Math.max(0,state.session.activeMs-state.session.questionActiveStart),imported:c.session.restoredFromBackup===true});
   delete state.session.drafts[q.id];persist();return row;
  }
  function markReadDone(){const c=current();if(!c||c.session.paused||c.session.diagnostic)return false;if(state.events.some(e=>e.type==='reading_phase_complete'&&e.sessionId===c.session.id&&e.materialId===c.material.id))return false;touch();const activeMs=Math.max(0,state.session.activeMs-(state.session.readActiveStarts?.[c.material.id]||0));append('reading_phase_complete',{sessionId:c.session.id,materialId:c.material.id,activeMs,characters:Array.from(c.material.text).filter(ch=>/[\u3400-\u9fff]/u.test(ch)).length,aidLevel:aidState(c.material.id).level,method:'self-reported-read-button-interval'});return true;}
  function reveal(){const c=current();if(!c)return false;append('answer_revealed',{sessionId:c.session.id,materialId:c.material.id,questionId:c.question.id,kind:'explanation'});return true;}
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
   // successes filtered out of a longer sequence. Assistance or prior
   // exposure disqualifies an attempt; no mastery is awarded.
   const recent=firstRows().slice(-3);
   if(recent.length<3||recent.some(a=>!a.correct||!a.independent||a.imported||a.diagnostic||a.feedbackHintEver||a.answerExposed||a.priorExposure))return {eligible:false,materialId:null};
   const baseline=bank.get(recent[recent.length-1].materialId),nav=navigation();
   if(!baseline||!Number.isFinite(baseline.difficulty))return {eligible:true,materialId:null};
   const originalPrerequisites=new Set(baseline.prerequisites||[]);
   const candidates=data.materials.filter(m=>m.kind===baseline.kind&&inMaterialRange(m)&&known(m)&&!exposure(m.id)&&
    Number.isFinite(m.difficulty)&&m.difficulty>baseline.difficulty&&m.week<=Math.ceil(nav.day/7)&&
    (m.prerequisites||[]).every(k=>originalPrerequisites.has(k))&&Array.from(m.text||'').length>Array.from(baseline.text||'').length);
   candidates.sort((a,b)=>a.difficulty-b.difficulty||a.day-b.day||a.id.localeCompare(b.id));
   const candidate=candidates[0];
   return {eligible:true,materialId:candidate?.id||null,day:candidate?.day||null,title:candidate?.title||null,goal:candidate?.goal||null};
  }
  function startChallenge(){
   const offer=challenge();if(writeStatus!=='ready'||!offer.materialId||!inDayRange(offer.day))return null;
   // Keep day null so an older reader or rollback cannot mistake this single
   // optional passage for completion of the whole calendar day.
   return start([offer.materialId],{day:null,scopeDay:offer.day,purpose:'optional-challenge'});
  }
  function recommend(){const nav=navigation(),wrong=firstRows().filter(a=>!a.correct&&(!nav.held||a.week<=nav.held.week)),counts=Object.create(null);for(const r of wrong)counts[r.errorType]=(counts[r.errorType]||0)+1;const usedSignals=new Set(rows('remediation_assigned').map(e=>e.mathSignalId));const signal=rows('math_reading_signal').slice().reverse().find(e=>e.reason!=='math'&&!usedSignals.has(e.id));const errorType=signal?({character:'character',sentence:'sentence',conditions:'information',uncertain:'information'})[signal.reason]||null:Object.keys(counts).sort((a,b)=>counts[b]-counts[a])[0]||null;
   const available=data.materials.filter(m=>inMaterialRange(m)&&!exposure(m.id)&&known(m)&&(!nav.held||m.week<=nav.held.week)),candidate=available.find(m=>m.kind==='reserve'&&m.questions.some(q=>q.errorType===errorType))||available.find(m=>m.kind==='reserve')||available[0];
   return {materialId:candidate?.id||null,errorType,mathSignalId:signal?.id||null,fromMathTaskId:signal?.mathTaskId||null,stageReady:!nav.held,nextWeek:nav.held?nav.held.week:Math.min(12,Math.ceil(nav.calendar/7)),reason:signal?'根据数学读题时的自报困难推荐对应语言补强；这是支持线索，不改写数学能力。':nav.held?nav.held.reason:errorType?'按多次首答错误安排对应阅读补强；错误类别是线索，需要新材料核实。':'先读短篇材料，逐步积累独立证据；数学主线保持原进度。'};
  }
  function transfer(){const tags=new Set(firstRows().filter(a=>a.category==='math').slice(-8).flatMap(a=>a.tags||[]));const available=data.materials.filter(m=>m.kind==='math'&&inMaterialRange(m)&&!exposure(m.id)&&known(m));return available.find(m=>m.tags.some(t=>tags.has(t)))||available[0]||null;}
  function startDay(day){if(!inDayRange(day))return null;const l=data.lessons.find(x=>x.day===day);if(!l)return null;const queue=due().filter(x=>inMaterialRange(bank.get(x.materialId))),nav=navigation(),rec=nav.held&&day===nav.day?recommend():null;
   const ids=rec?.materialId?[rec.materialId]:l.kind==='light'?l.coreIds.slice(0,1):l.kind==='review'&&queue.length?[...new Set(queue.map(x=>x.materialId))].slice(0,2):l.coreIds;
   const result=start(ids,{day,purpose:rec?.materialId?'readiness-review':l.kind||'practice'});if(nav.held){state.session.adaptive={heldWeek:nav.held.week,reason:nav.held.reason,explicitSelection:day!==nav.day};persist();}return result;
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
  function report(){const first=firstRows(),all=rows('attempt'),complete=rows('session_complete'),levels=[0,1,2,3].map(level=>({level,...ratio(first.filter(a=>a.aidLevel===level&&!a.feedbackHintEver))}));
   const eligible=first.filter(a=>a.diagnosticValidity?.eligible&&a.diagnostic&&!a.imported&&a.contentHash===data.contentHash),conditions={};for(const condition of ['A','B','C','D'])conditions[condition]=ratio(eligible.filter(a=>a.diagnostic.condition===condition));
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
   return {storyReadDays,hintedFirst:ratio(first.filter(a=>a.feedbackHintEver)),supportEvidence,diagnosticExcluded:first.filter(a=>a.diagnostic&&(!a.diagnosticValidity?.eligible||a.imported||a.contentHash!==data.contentHash)).map(a=>({questionId:a.questionId,setId:a.diagnostic.setId,condition:a.diagnostic.condition,reason:a.imported?'导入证据独立性未核验':a.contentHash!==data.contentHash?'旧版本对照保留历史，不与本版本辅助条件混算':a.diagnosticValidity?.reason||'条件不完整',aidLevel:a.aidLevel})),readingPace,tappedCharacters,contentHash:data.contentHash,first:ratio(first),retries:Math.max(0,all.filter(e=>qs.has(e.questionId)&&e.questionHash===hash(JSON.stringify(qs.get(e.questionId).q))&&e.materialHash===hash(qs.get(e.questionId).m.text)).length-first.length),completedDays:new Set(complete.filter(e=>e.day).map(e=>e.day)).size,levels,explained:ratio(first.filter(a=>a.aidLevel===4)),conditions,matchedSets,weeks,readiness:weekReadiness(),errors,focusWords:vocabulary.filter(w=>w.status!=='跨材料稳定表现').sort((a,b)=>(b.total-b.correct)-(a.total-a.correct)).slice(0,20),vocabulary,due:due(),recommendation:recommend(),daily,signals,interpretation:'错误类型只是训练线索。需要在先修已确认、同蓝图、未见且辅助条件完整的多次对照中讨论可能原因；不能凭一次测验贴标签或把正确率差异当因果结论。',independenceCaution:'隐藏拼音不会清除已见拼音；已经看过的材料和已见讲解不计未见独立证据。',legacyCount:state.legacy.length,voiceRequests:state.events.filter(e=>e.type==='aid_requested'&&voiceKinds.has(e.kind)).length,voiceStarts:rows('speech_status').filter(e=>['started','start'].includes(e.status)).length,voiceFailures:rows('speech_status').filter(e=>['failed','error','blocked','no_voice','unsupported'].includes(e.status)).length,unverifiedImportedAttempts:first.filter(a=>a.imported).length,quarantinedAttempts:all.filter(e=>!qs.has(e.questionId)||e.questionHash!==hash(JSON.stringify(qs.get(e.questionId).q))||e.materialHash!==hash(qs.get(e.questionId).m.text)).length,diagnosticCaution:'四份材料仅按设计蓝图匹配，尚未经过真实儿童样本等值检验。'};
  }
  function localDate(at){const d=new Date(at);return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');}
  function backup(){return JSON.stringify({schema:'amc8-reading-r1-backup',exportedAt:clock(),contentHash:data.contentHash,reading:clone(state),unreadableOriginal:writeStatus==='read_only'?raw:null},null,2);}
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
  return {unfinished,resumeSession,markReadDone,key,data,start,startDay,startChallenge,challenge,current,nextDay,select,submit,next,panel,pause,resume,touch,setting,requestAid,speechStatus,reveal,due,recommend,transfer,startDiagnostic,mathSignal,report,backup,importBackup,externalChange,exposure,known,firstRows,attempts,snapshot:()=>clone(state),status:()=>({status:writeStatus,message:writeMessage}),persist};
 }
 return {create,hash};
})();

/* Original, controllable vector scenes; no external images, microphones or network calls. */
window.ReadingComic=(()=>{
 'use strict';
 const E=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const sceneNames={forest:'林间',school:'校园',home:'家中',garden:'花园',lab:'探索室',library:'图书角',park:'公园',station:'车站',workshop:'工作间',space:'太空想象'};
 const backgrounds={
  forest:'<path d="M0 185Q80 158 165 183T360 180V240H0Z" fill="#b9d9ad"/><g fill="#54886a"><path d="M15 165 42 55 70 165Z"/><path d="M282 160 314 42 347 160Z"/></g><g stroke="#7c6851" stroke-width="9"><path d="M42 145v55M314 143v53"/></g>',
  school:'<path d="M205 184V62h120v122" fill="#e9c28e"/><path d="M195 62 265 25 337 62" fill="#ad6e60"/><path d="M225 85h25v25h-25zm48 0h25v25h-25z" fill="#d8eef1"/><path d="M256 140h29v45h-29" fill="#8ab3b4"/>',
  home:'<path d="M20 183V67h120v116" fill="#e0d2b5"/><path d="M7 70 79 21 153 70" fill="#c68f7e"/><path d="M42 98h38v38H42Z" fill="#bae0e0"/><path d="M24 182h296" stroke="#a19279" stroke-width="7"/>',
  garden:'<path d="M0 187q80-38 180-1t180 0v54H0Z" fill="#c4dbaa"/><g fill="#688b58"><path d="M33 182v-35m0 17q-25 1-22-20 23-4 22 20m0-7q24-3 24-22-21 0-24 22M319 181v-40m0 17q-22-2-24-20 22-4 24 20"/></g><path d="M4 210h350" stroke="#b9b18a" stroke-width="4"/>',
  lab:'<path d="M18 180h324v13H18Z" fill="#a9b7b0"/><path d="M35 192v35m288-35v35" stroke="#7e928b" stroke-width="7"/><path d="M259 130v-35h23v35l14 28q-21 14-49 0Z" fill="#b3d8dd" stroke="#71989a" stroke-width="3"/><path d="M38 45h83v60H38Z" fill="#dae8dc"/><path d="M49 82 66 62l18 17 24-24" fill="none" stroke="#79a190" stroke-width="4"/>',
  library:'<path d="M16 39h95v145H16Zm233 0h95v145h-95Z" fill="#bca584"/><path d="M21 83h85M21 134h85m148-51h85m-85 51h85" stroke="#896f55" stroke-width="6"/><g stroke-width="12"><path d="M35 49v29m24-29v29m25-29v29m185-29v29m24-29v29m25-29v29" stroke="#8fa7b2"/><path d="M35 100v29m24-29v29m25-29v29m185-29v29m24-29v29m25-29v29" stroke="#b98e7d"/></g>',
  park:'<path d="M0 188q100-23 170 0t190-3v55H0Z" fill="#bfd3aa"/><path d="M260 134h73v13h-73zm-6 20h86v12h-86z" fill="#b99570"/><path d="M269 164v26m57-26v26" stroke="#826e58" stroke-width="5"/><path d="M22 160q-12-84 27-91 49 9 24 91" fill="#91b489"/><path d="M48 137v52" stroke="#8b735c" stroke-width="8"/>',
  station:'<path d="M0 204h360M0 215h360" stroke="#8c9b99" stroke-width="5"/><path d="M226 61h111v95H226Z" fill="#d5e4dd"/><path d="M218 61 281 30l65 31" fill="#89aaa3"/><path d="M271 85h33v34h-33Z" fill="#eff4e7"/><path d="M287 90v13l10 7" fill="none" stroke="#7a9991" stroke-width="3"/>',
  workshop:'<path d="M20 171h320v13H20Z" fill="#b9a07b"/><path d="M38 185v42m284-42v42" stroke="#8e785c" stroke-width="8"/><path d="M28 47h91v68H28Z" fill="#c4d6ca"/><path d="m50 58 23 42m17-42-23 42" stroke="#839c8c" stroke-width="6"/>',
  space:'<path d="M0 188q160-60 360 0v52H0Z" fill="#d2d4df"/><g fill="#fff7d9"><circle cx="30" cy="34" r="3"/><circle cx="87" cy="68" r="3"/><circle cx="312" cy="26" r="4"/><circle cx="272" cy="76" r="3"/></g><circle cx="293" cy="119" r="24" fill="#c4cfdb"/><path d="M250 123q44-17 85 0" fill="none" stroke="#a2b5cb" stroke-width="5"/>'
 };
 const props={
  basket:'<path d="M-20-1h40l-5 24h-30Z" fill="#d6af70" stroke="#997341" stroke-width="3"/><path d="M-14-1q0-25 28 0" fill="none" stroke="#997341" stroke-width="4"/>',
  book:'<path d="M-24-14q12-7 24 0 12-7 24 0v31q-12-5-24 1-12-6-24-1Z" fill="#f7f0d9" stroke="#6d969a" stroke-width="3"/><path d="M0-12v28" stroke="#6d969a" stroke-width="2"/>',
  seed:'<path d="M-18 18Q-33-7-10-22 19-37 25-7 20 23-5 26Z" fill="#af8056" stroke="#7c5a3d" stroke-width="3"/><path d="M-9 15Q8 0 10-14" fill="none" stroke="#d8b88d" stroke-width="3"/>',
  sprout:'<path d="M0 22V-2m0 8q-23-2-22-19 22-3 22 19m0-2q22-3 21-22Q1-18 0 4" fill="#6d9a69" stroke="#56865b" stroke-width="3"/>',
  robot:'<rect x="-21" y="-17" width="42" height="37" rx="9" fill="#8ebeb5" stroke="#527c78" stroke-width="3"/><circle cx="-8" cy="-3" r="3" fill="#284e4f"/><circle cx="8" cy="-3" r="3" fill="#284e4f"/><path d="M-8 9H8M0-17v-9" stroke="#527c78" stroke-width="3"/>',
  bridge:'<path d="M-34 18Q0-22 34 18M-34 7Q0-30 34 7" fill="none" stroke="#a58262" stroke-width="6"/><path d="M-23 2v14M0-8v14M23 2v14" stroke="#a58262" stroke-width="4"/>',
  map:'<path d="m-25-17 17 5 17-5 17 5v37l-17-5-17 5-17-5Z" fill="#efe1b3" stroke="#ad9563" stroke-width="3"/><path d="m-14 7 8-8L6 7l10-12" stroke="#91aa7b" fill="none" stroke-width="4"/>',
  clock:'<circle cy="2" r="23" fill="#f8f2de" stroke="#91a99a" stroke-width="4"/><circle cy="2" r="3" fill="#839a8d"/>',
  box:'<path d="m-24-9 24-12 25 12v31l-25 10-24-10Z" fill="#d4b186" stroke="#a37f57" stroke-width="3"/><path d="M-24-9 0 3 25-9M0 3v29" fill="none" stroke="#a37f57" stroke-width="3"/>',
  water:'<path d="M0-23q-35 40 0 46 35-6 0-46Z" fill="#a9d7e0" stroke="#6aa8ba" stroke-width="3"/>',
  paper:'<path d="M-20-25h27l15 14v39h-42Z" fill="#faf6e7" stroke="#a1b7aa" stroke-width="3"/><path d="M7-25v15h15M-10 2h22M-10 13h17" stroke="#b7c7ba" fill="none" stroke-width="3"/>',
  light:'<path d="M-12 10q-24-28 1-37 28-7 27 17-1 14-12 20v12h-16Z" fill="#f2da8e" stroke="#bba75f" stroke-width="3"/><path d="M-11 28h16" stroke="#82988c" stroke-width="5"/>',
  ball:'<circle r="24" fill="#d6a58b" stroke="#a77965" stroke-width="3"/><path d="M-23 0h46M0-23q-16 23 0 46M0-23q16 23 0 46" fill="none" stroke="#f2d5b5" stroke-width="3"/>',
  leaf:'<path d="M-22 22q-14-45 48-45 6 53-48 45Z" fill="#9bbe83" stroke="#6c965b" stroke-width="3"/><path d="m-23 23 40-39" stroke="#6c965b" stroke-width="3"/>',
  train:'<rect x="-32" y="-17" width="64" height="37" rx="8" fill="#8eb8bf" stroke="#6c989d" stroke-width="3"/><path d="M-22-8h44v13h-44Z" fill="#e6efde"/><path d="M-20 23h40" stroke="#6e8588" stroke-width="7"/>',
  tool:'<path d="m-12-25 12 11 13-11 7 14-13 12-7 26-12-4L-5-3-20-14Z" fill="#aab7b6" stroke="#7e9090" stroke-width="3"/>',
  umbrella:"<path d=\"M-48-54q48-61 96 0-13-12-25 0-12-12-23 0-12-12-24 0-12-12-24 0Z\" fill=\"#95b9c8\" stroke=\"#668b9c\" stroke-width=\"3\"/><path d=\"M0-87v96q0 14-11 12-8-2-7-11\" fill=\"none\" stroke=\"#866d58\" stroke-width=\"4\"/>",
  bell:"<path d=\"M-18 16q7-8 7-25 0-16 12-16 13 0 13 16 0 17 7 25Z\" fill=\"#d7be77\" stroke=\"#a18a51\" stroke-width=\"3\"/><path d=\"M-21 17h45M1-25v-9\" stroke=\"#a18a51\" stroke-width=\"4\"/><circle cx=\"1\" cy=\"21\" r=\"4\" fill=\"#a18a51\"/>",
  hat:"<path d=\"M-34 14h68l-11 9h-46Z\" fill=\"#cbac78\"/><path d=\"M-21 14V-13q21-24 42 0v27Z\" fill=\"#e3c48c\" stroke=\"#a88b5e\" stroke-width=\"3\"/>",
  glove:"<path d=\"M-16 25v-28l-10-12q-6-9 0-12 7-4 14 9v-24q1-9 6-7 5 0 5 8v12-20q4-8 9-1v25-19q5-7 9 0v23-14q7-7 10 2v33q-1 19-18 22Z\" fill=\"#cdafa0\" stroke=\"#9b7d70\" stroke-width=\"3\"/>",
  door:"<path d=\"M-28 34v-89h56v89Z\" fill=\"#d3b68c\" stroke=\"#8e785b\" stroke-width=\"4\"/><path d=\"M-19 34v-79h38v79\" fill=\"#f1dfb9\" stroke=\"#b29974\" stroke-width=\"2\"/><circle cx=\"10\" cy=\"-2\" r=\"3\" fill=\"#8e785b\"/>",
  none:"",
  boat:"<path d=\"M-43 5h86L24 27h-50Z\" fill=\"#d4c8ac\" stroke=\"#9d8d6c\" stroke-width=\"3\"/><path d=\"M-23 5 0-24 24 5Z\" fill=\"#f7edcf\" stroke=\"#b2a080\" stroke-width=\"3\"/>",
  windmill:"<path d=\"M0 9v43\" stroke=\"#9b8064\" stroke-width=\"6\"/><g fill=\"#91b8bd\" stroke=\"#658e97\" stroke-width=\"2\"><path d=\"M0 0-28-34 8-22Z\"/><path d=\"M0 0 34-28 22 8Z\"/><path d=\"M0 0 28 34-8 22Z\"/><path d=\"M0 0-34 28-22-8Z\"/></g><circle r=\"5\" fill=\"#d7be7b\"/>",
  scissors:"<path d=\"m-12 9 24-42M12 9-24-42\" stroke=\"#9aa9aa\" stroke-width=\"7\"/><circle cx=\"-17\" cy=\"18\" r=\"10\" fill=\"none\" stroke=\"#bd9581\" stroke-width=\"6\"/><circle cx=\"17\" cy=\"18\" r=\"10\" fill=\"none\" stroke=\"#bd9581\" stroke-width=\"6\"/><circle cy=\"0\" r=\"4\" fill=\"#7d898a\"/>",
  telescope:"<path d=\"m-32 8 55-27 12 25-55 27Z\" fill=\"#8fa9b1\" stroke=\"#607f8b\" stroke-width=\"3\"/><path d=\"m20-20 9-5 16 31-10 4Z\" fill=\"#b8d6d8\" stroke=\"#607f8b\" stroke-width=\"3\"/><path d=\"M0 20v19m0 0-16 13m16-13 16 13\" stroke=\"#8d806d\" stroke-width=\"5\"/>"
 };
 function person(id,x,action){const robot=id==='tuantuan',body=robot?'#70aaa0':id==='xiaohe'?'#db9c6a':'#76a7c4',skin='#efd0b3';let arms='M-16 8-34 25M16 8 34 25',legs='M-10 48-15 76M10 48l6 28';
  if(action==='carry'||action==='share')arms='M-16 8-33 5M16 8l27-8';
  if(action==='build'||action==='repair')arms='M-16 8-30 31M16 8 42 26';
  if(action==='plan'||action==='compare')arms='M-16 8-34 21M16 8 41-6';
  if(action==='read')arms='M-16 8-25 24M16 8 25 24';
  if(action==='celebrate')arms='M-16 8-32-18M16 8l18-26';
  if(action==='wait')arms='M-16 8-13 34M16 8 13 34';
  if(action==='observe')arms='M-16 8-32 26M16 8 27-8';
  return `<g transform="translate(${x} 126)"><path d="${legs}" fill="none" stroke="#5d767e" stroke-width="11" stroke-linecap="round"/><path d="${arms}" fill="none" stroke="${robot?body:skin}" stroke-width="11" stroke-linecap="round"/><rect x="-19" y="0" width="38" height="51" rx="12" fill="${body}"/>${robot?'<rect x="-23" y="-48" width="46" height="43" rx="12" fill="#9bc7bc" stroke="#5d8b83" stroke-width="3"/><path d="M0-48v-11" stroke="#5d8b83" stroke-width="4"/><circle cy="-62" r="4" fill="#d3b779"/>':`<circle cy="-27" r="25" fill="${skin}"/><path d="M-25-29q-1-35 28-24 23 5 22 28-10-5-14-15-15 13-36 11" fill="#535653"/>`}<circle cx="-8" cy="-28" r="2.7" fill="#36505a"/><circle cx="8" cy="-28" r="2.7" fill="#36505a"/><path d="M-6-16q6 5 12 0" fill="none" stroke="#826b61" stroke-width="2.5" stroke-linecap="round"/></g>`;
 }
 function panel(p={},index=0){const scene=Object.hasOwn(backgrounds,p.scene)?p.scene:'park',action=['observe','carry','share','build','plan','compare','read','wait','repair','celebrate'].includes(p.action)?p.action:'observe',prop=Object.hasOwn(props,p.prop)?p.prop:'book',cast=(Array.isArray(p.cast)?p.cast:['tianle']).filter(x=>['tianle','xiaohe','tuantuan'].includes(x)).slice(0,3),positions=cast.length===1?[172]:cast.length===2?[110,235]:[90,180,270];
  const background=scene==='space'?'#aebace':'#edf3e8';const propY=['carry','share','read'].includes(action)||['umbrella','bell','telescope'].includes(prop)?149:184,held=['carry','share','read','build','repair'].includes(action),propX=held?(positions[0]||172)+(action==='read'?0:32):180;
  return `<svg class="rd-art" viewBox="0 0 360 240" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${E(sceneNames[scene])}里的阅读情境；请从文字寻找答案"><rect width="360" height="240" rx="18" fill="${background}"/><path d="M0 194h360v46H0Z" fill="#d7e1ce"/>${backgrounds[scene]}${cast.map((id,i)=>person(id,positions[i],i===0?action:'observe')).join('')}<g transform="translate(${propX} ${propY})">${props[prop]}</g><path d="M15 225h330" stroke="#bdcdb9" stroke-width="2"/></svg>`;
 }
 return {panel};
})();

window.ReadingSpeech=(()=>{
 'use strict';
 function create(opts={}){
  const synth=window.speechSynthesis,U=window.SpeechSynthesisUtterance||(typeof SpeechSynthesisUtterance==='function'?SpeechSynthesisUtterance:null);let token=0,active=null,last=null,queue=[],currentState='idle',destroyed=false,voiceTimer=null,startTimer=null;
  const notify=(state,extra={})=>{currentState=state;opts.onStatus?.({state,status:state,...extra});};
  const voices=()=>{try{return synth?.getVoices?.()||[];}catch(_){return [];}};
  const mandarin=v=>/^(zh[-_]CN|zh[-_]Hans)(?:[-_]|$)/i.test(v.lang||'');
  const choose=()=>{const rows=voices().filter(mandarin),local=rows.find(v=>v.localService===true);return local||(opts.getRemoteConsent?.()===true?rows[0]:null);};
  function capabilities(){const rows=voices().filter(mandarin);return {available:!!(synth&&U),mandarinVoices:rows.length,confirmedLocalVoices:rows.filter(v=>v.localService===true).length,remoteConsent:opts.getRemoteConsent?.()===true,state:currentState,boundary:'device-dependent',recording:false,recognition:false,audioQuality:'NOT_VERIFIED'};}
  function clear(){opts.onHighlight?.(null);}
  function cancelTimer(which){const id=which==='voice'?voiceTimer:startTimer;if(id!==null)window.clearTimeout?.(id);if(which==='voice')voiceTimer=null;else startTimer=null;}
  function stop(){token++;cancelTimer('voice');cancelTimer('start');queue=[];active=null;try{synth?.cancel?.();}catch(_){}clear();if(!destroyed)notify('stopped');}
  function context(text,meta){if(meta.kind!=='character'&&meta.originKind!=='character'||!meta.contextText)return {text,from:meta.offset||0};const chars=Array.from(meta.contextText),i=Number(meta.charIndex)||0;const reviewed=window.__AMC8_READING_DATA?.contextReviewedPositions?.[meta.contextText]||[];if(reviewed.includes(i)){let from=i,to=i+1;while(from>0&&!/[。！？；\n]/u.test(chars[from-1]))from--;while(to<chars.length&&!/[。！？；\n]/u.test(chars[to-1]))to++;return {text:chars.slice(from,to).join(''),from};}const phrases=Object.keys(window.__AMC8_READING_DATA?.phrases||{}).filter(x=>Array.from(x).length<=8).sort((a,b)=>b.length-a.length);
   for(const word of phrases){const w=Array.from(word);for(let start=Math.max(0,i-w.length+1);start<=i;start++)if(start+w.length>i&&chars.slice(start,start+w.length).join('')===word)return {text:word,from:start};}
   return {text,from:i};
  }
  function segment(text){const out=[];let start=0;for(const match of text.matchAll(/[^。！？\n]+[。！？\n]?|[。！？\n]/gu)){out.push({text:match[0],from:Array.from(text.slice(0,match.index)).length});start=match.index+match[0].length;}return out.length?out:[{text,from:0}];}
  function speak(text,meta={}){
   if(destroyed)return false;text=String(text||'').slice(0,12000);if(!text.trim())return false;const resolved=context(text,meta),actualMeta={...meta,offset:resolved.from};
   opts.onAid?.(meta.kind||'voice',{requestedText:text,spokenText:resolved.text,materialId:meta.materialId,contextualWord:resolved.text!==text,recording:false});
   last={text,meta:{...meta,originKind:meta.originKind||meta.kind}};stop();const t=token;notify('requested',{spokenText:resolved.text,kind:meta.kind||'voice',contextualWord:resolved.text!==text});
   if(!synth||!U){notify('unsupported',{spokenText:resolved.text});return false;}const voice=choose();if(!voice){const rows=voices(),reason='No confirmed local Mandarin voice; remote voice requires parent consent.';
    if(!rows.length&&typeof window.setTimeout==='function'){notify('voices_loading',{spokenText:resolved.text});voiceTimer=window.setTimeout(()=>{voiceTimer=null;if(t===token&&currentState==='voices_loading')notify('no_voice',{spokenText:resolved.text,reason});},3000);}
    else notify(rows.some(mandarin)?'blocked':'no_voice',{spokenText:resolved.text,reason});return false;}
   queue=segment(resolved.text);const allText=resolved.text;
   const play=()=>{if(t!==token||destroyed)return;if(!queue.length){active=null;clear();notify('ended',{spokenText:allText,voice:voice.name||'',local:voice.localService===true});return;}const part=queue.shift(),u=new U(part.text);active=u;u.lang=voice.lang;u.voice=voice;u.rate=Math.max(.6,Math.min(1.1,Number(opts.getRate?.())||.85));u.pitch=1;
    const base=(actualMeta.offset||0)+part.from,info={materialId:meta.materialId,elementKey:meta.elementKey,spokenText:part.text};
    let started=false;u.onstart=()=>{if(t!==token)return;started=true;cancelTimer('start');notify('started',{spokenText:part.text,voice:voice.name||'',local:voice.localService===true});opts.onHighlight?.({...info,from:base,to:base+Array.from(part.text).length,source:'sentence',precise:false});};
    u.onboundary=e=>{if(t!==token||!Number.isFinite(e.charIndex))return;const from=base+Array.from(part.text.slice(0,e.charIndex)).length,length=e.charLength?Array.from(part.text.slice(e.charIndex,e.charIndex+e.charLength)).length:1;opts.onHighlight?.({...info,from,to:from+Math.max(1,length),utf16Index:e.charIndex,source:'boundary',precise:true});};
    u.onpause=()=>{if(t===token)notify('paused',{spokenText:part.text});};u.onresume=()=>{if(t===token)notify('started',{spokenText:part.text});};
    u.onend=()=>{if(t===token){cancelTimer('start');if(!started){queue=[];active=null;clear();notify('failed',{spokenText:part.text,error:'missing_start'});return;}play();}};u.onerror=e=>{if(t!==token)return;cancelTimer('start');queue=[];active=null;clear();notify('failed',{spokenText:part.text,error:String(e.error||'speech_error')});};
    try{synth.speak(u);if(!started&&t===token&&active===u&&typeof window.setTimeout==='function')startTimer=window.setTimeout(()=>{startTimer=null;if(t!==token||active!==u||started)return;token++;queue=[];active=null;try{synth.cancel();}catch(_){}clear();notify('failed',{spokenText:part.text,error:'start_timeout'});},8000);}catch(e){cancelTimer('start');queue=[];active=null;clear();notify('failed',{spokenText:part.text,error:String(e.message||e)});}
   };play();return true;
  }
  function pause(){if(!active||typeof synth?.pause!=='function')return false;try{synth.pause();notify('pause_requested');return true;}catch(_){notify('failed',{error:'pause_failed'});return false;}}
  function resume(){if(!active||typeof synth?.resume!=='function')return false;try{synth.resume();notify('resume_requested');return true;}catch(_){notify('failed',{error:'resume_failed'});return false;}}
  function repeat(){return last?speak(last.text,{...last.meta,kind:'repeat'}):false;}
  const voiceChange=()=>{if(destroyed||active||!['voices_loading','no_voice','blocked','voices_ready'].includes(currentState))return;const rows=voices();if(!rows.length)return;cancelTimer('voice');notify(choose()?'voices_ready':rows.some(mandarin)?'blocked':'no_voice',{capabilities:capabilities()});};synth?.addEventListener?.('voiceschanged',voiceChange);
  function destroy(){stop();destroyed=true;synth?.removeEventListener?.('voiceschanged',voiceChange);}
  return {speak,pause,resume,stop,repeat,capabilities,destroy};
 }
 return {create};
})();

/* Additive child and parent route; lazily attaches to the existing AMC8 application. */
window.__AMC8_ReadingRuntime=(()=>{
 const host=window.__AMC8_READING_HOST;
 const STORE=host.store;
 'use strict';
 const E=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const hash=s=>{let n=2166136261;for(const c of String(s)){n^=c.codePointAt(0);n=Math.imul(n,16777619);}return(n>>>0).toString(36);};
 const ui={screen:'home',phase:'read',parent:false,parentSettingsUnlocked:false,rangeStart:null,rangeEnd:null,message:'',allPanels:false,tapped:new Set(),texts:new Map(),voice:{state:'idle'},dxSet:'BASELINE',knowledgeConfirmed:false,importText:''};
 let engine=null,speech=null,heartbeat=null,phrases=null,paintState=null;
 function ensure(){if(engine)return engine;engine=window.ReadingEngine.create(window.__AMC8_READING_DATA,localStorage,STORE+'_reading_r1');
  speech=window.ReadingSpeech.create({getRemoteConsent:()=>engine.snapshot().settings.remoteVoiceConsent===true,getRate:()=>engine.snapshot().settings.rate,onAid:(kind,detail)=>engine.requestAid(kind,detail),onStatus:info=>{ui.voice=info;engine.speechStatus(info);const el=document.getElementById('rd-voice-state');if(el)el.textContent=voiceText(info);syncVoiceControls(info);},onHighlight:highlight});
  window.addEventListener?.('storage',e=>{if(e.key===engine.key){engine.externalChange();if(host.view==='reading')host.render();}});
  document.addEventListener?.('visibilitychange',()=>{if(document.hidden){engine.pause();speech.stop();}else if(host.view==='reading'&&ui.screen==='course'){ui.message='回来啦，点继续后再读。';host.render();}});
  window.addEventListener?.('pagehide',()=>{engine.pause();speech.stop();});
  document.addEventListener?.('keydown',e=>{if(e.isComposing||!['Enter',' '].includes(e.key))return;const node=e.target?.closest?.('[data-action="rdChar"]');if(node){e.preventDefault?.();handle('rdChar',node.dataset);}});
  if(typeof window.setInterval==='function')heartbeat=window.setInterval(()=>{if(host.view==='reading'&&ui.screen==='course'&&!document.hidden&&engine.current()&&!engine.current().session.paused){engine.touch();engine.persist();}},15000);
  return engine;
 }
 function pronounce(text){const d=window.__AMC8_READING_DATA,chars=Array.from(String(text)),exact=d.pinyinTexts?.[text];if(Array.isArray(exact)&&exact.length===chars.length)return exact;const out=chars.map(c=>d.pinyinMap?.[c]||'');phrases??=Object.entries(d.phrases||{}).sort((a,b)=>Array.from(b[0]).length-Array.from(a[0]).length);
  for(let i=0;i<chars.length;i++){for(const [word,pron] of phrases){const w=Array.from(word);if(chars.slice(i,i+w.length).join('')!==word)continue;const p=Array.isArray(pron)?pron:String(pron).split(' ');if(p.length!==w.length)continue;for(let j=0;j<w.length;j++)out[i+j]=p[j];i+=w.length-1;break;}}
  return out.map((p,i)=>chars[i]==='一'?'yī':chars[i]==='不'?'bù':p);
 }
 function rt(value,{clickable=false,mode=null,reference=null,offset=0,focus=null}={}){const text=String(value??''),whole=reference||text,key=hash(whole),pins=pronounce(whole),chars=Array.from(text),c=paintState?paintState.current:engine?.current(),setting=paintState?paintState.settings:engine?.snapshot().settings;ui.texts.set(key,whole);const m=mode||c?.session.pinyinMode||setting?.pinyin||'all',focusChars=new Set(Array.from((focus||c?.material.focusWords||[]).join('')));
  return chars.map((char,i)=>{if(!/[\u3400-\u9fff]/u.test(char))return E(char);const pos=i+offset,visible=m==='all'||m==='focus'&&focusChars.has(char)||m==='demand'&&ui.tapped.has(key+':'+pos);return `<ruby class="rd-char" data-rd-key="${key}" data-rd-index="${pos}" ${clickable?`role="button" tabindex="0" data-action="rdChar" data-key="${key}" data-index="${pos}" aria-label="${E(char)}，查看拼音和听读"`:''}><rb>${E(char)}</rb><rt aria-hidden="${!visible}">${visible?E(pins[pos]||''):''}</rt></ruby>`;}).join('');
 }
 const button=(action,label,attrs='',classes='rd-button')=>`<button class="${classes}" data-action="${action}" ${attrs}>${rt(label)}</button>`;
 const percent=x=>x?.total?`${Math.round(100*x.correct/x.total)}% (${x.correct}/${x.total})`:'暂无样本';
 const conditionLabels={A:'无拼音，自己读',B:'有拼音，自己读',C:'不看拼音，先听原文',D:'请家长只读原文，再自己回答'};
 function syncVoiceControls(info){const state=info.state||info.status,paused=['paused','pause_requested'].includes(state),playing=['requested','started','resume_requested'].includes(state),pause=document.getElementById('rd-voice-pause'),resume=document.getElementById('rd-voice-resume');if(pause)pause.hidden=!playing;if(resume)resume.hidden=!paused;}
 function voiceText(info){const s=info.state||info.status;return({idle:'需要时可以点喇叭。',requested:'正在准备朗读。',started:'正在朗读。',pause_requested:'正在请求暂停。',resume_requested:'正在请求继续朗读。',paused:'朗读已暂停。',ended:'朗读结束。',stopped:'朗读已停止。',voices_loading:'正在读取系统音色，请稍等。',blocked:'远程音色需要家长先授权，也可以请家长代读。',no_voice:'没有已确认的本地普通话音色，可再试或请家长代读原文。',unsupported:'当前环境无法朗读，可请家长代读原文。',failed:info.error==='start_timeout'?'浏览器未开始朗读，请再点一次或请家长代读。':'这次朗读未完成，请再试或请家长代读。',voices_ready:'音色已准备好，请再点一次朗读。'})[s]||'朗读状态已记录。';}
 function highlight(info){if(typeof document.querySelectorAll!=='function')return;for(const el of document.querySelectorAll('.rd-speaking'))el.classList.remove('rd-speaking');if(!info?.elementKey)return;for(const el of document.querySelectorAll(`[data-rd-key="${info.elementKey}"]`)){const i=Number(el.dataset.rdIndex);if(i>=info.from&&i<info.to)el.classList.add('rd-speaking');}}
 function show(screen){ensure();if(ui.screen==='course'&&screen!=='course')engine.pause();if(screen!=='parent'){ui.parent=false;ui.parentSettingsUnlocked=false;}speech.stop();ui.screen=screen;ui.message='';host.view='reading';host.render();window.scrollTo({top:0,behavior:'instant'});}
 function leave(){if(engine){engine.pause();speech.stop();}ui.parent=false;ui.parentSettingsUnlocked=false;}
 function header(title,sub=''){return `<header class="rd-header"><div><p class="rd-kicker">${rt('天乐的阅读探险队')}</p><h1>${rt(title)}</h1>${sub?`<p>${rt(sub)}</p>`:''}</div><nav class="rd-nav">${button('rdHome','阅读首页')}${button('home','回到数学')}</nav></header>`;}
 function entry(){const e=ensure(),r=e.report();return `<section class="panel rd-entry rd-app"><div><h2>${rt('今天的中文阅读冒险')}</h2><p>${rt('先自己读，需要时再用拼音和朗读。完成过课程')} ${r.completedDays}/84 ${rt('天。')}</p></div><button class="primary" data-action="reading">${rt('进入中文阅读')} →</button><button class="secondary" data-action="rdParent">家长阅读看板</button></section>`;}
 function mathBridge(task,feedback){if(!task||!feedback||feedback.ok)return '';return `<section class="panel rd-math-bridge"><h3>这次卡在哪里？</h3><p>读题和数学想法可以分别记录。</p><button class="secondary" data-action="rdMathConcern" data-reason="character">有字不认识</button><button class="secondary" data-action="rdMathConcern" data-reason="conditions">没有找清条件</button><button class="secondary" data-action="rdMathConcern" data-reason="math">读懂了，还在想解法</button></section>`;}
 function home(){const e=ensure(),r=e.report(),day=e.nextDay(),l=e.data.lessons.find(x=>x.day===day),w=e.data.weeks.find(x=>x.week===l.week),m=e.data.materials.find(x=>x.id===l.coreIds[0]);return `${header('今天的中文阅读冒险','先读故事，再读数学。需要帮助时可以点一下。')}<section class="rd-today"><div aria-hidden="true">${window.ReadingComic.panel({scene:'library',cast:['tianle','xiaohe','tuantuan'],action:'read',prop:'book'},0)}</div><div><p>${rt('第')} ${day} ${rt('天')} · ${rt(w?.theme||'阅读探索')}</p><h2>${rt(m?.title||'打开今天的故事')}</h2><p>${rt(l.kind==='light'?'轻量阅读和每周小发现':l.kind==='review'?'先复习，再换个情境':'故事阅读与数学读题')} · ${l.targetMinutes} ${rt('分钟左右')}</p>${button('rdStart','开始今天的冒险',`data-day="${day}"`,'rd-button rd-primary')}${e.current()?button('rdResume','继续上次的阅读'):''}</div></section><p class="rd-soft">${rt('蓝衣天乐 · 橙衣小禾 · 小机器人团团')}</p><nav class="rd-nav">${button('rdPlan','十二周地图')}${button('rdReview','到期复习')}${button('rdRemediate','补一小步')}${button('rdParent','家长看板')}</nav>${unfinishedCourses()}<p class="rd-soft">${rt('练习过不等于完全掌握。下一次可以换一段没见过的文字再试试。')}</p>`;}
 function plan(){const e=ensure(),range=e.snapshot().settings.dayRange||{start:1,end:84};return `${header('十二周阅读地图','按能力放慢或回看，不必赶日历。')}<p>当前阅读范围：第 ${range.start} 至 ${range.end} 天。范围外的课程与记录继续保留。</p><div class="rd-week-grid">${e.data.weeks.map(w=>`<section class="rd-week"><h2>${rt('第')} ${w.week} ${rt('周')} · ${rt(w.theme)}</h2><p>${rt((w.goals||[]).join('；'))}</p><div class="rd-days">${e.data.lessons.filter(l=>l.week===w.week).map(l=>button('rdStart',String(l.day),`data-day="${l.day}" aria-label="第${l.day}天课程" ${l.day<range.start||l.day>range.end?'disabled':''}`)).join('')}</div>${[4,8,12].includes(w.week)?button('rdOpenDiagnostic',w.week===12?'请家长安排终测':'请家长安排阶段诊断','data-set="W'+String(w.week).padStart(2,'0')+'"'):""}<details><summary>${rt('本周目标与复习')}</summary><p>${rt(w.reviewTask)}</p><p>${rt(w.standard)}</p><p>${rt(w.nextCriteria)}</p></details></section>`).join('')}</div>`;}
 function comic(m,s){const all=ui.allPanels,panels=all?m.panels:[m.panels[Math.min(s.panelIndex,m.panels.length-1)]];return `<div class="rd-comic-grid ${all?'rd-entire':''}">${panels.map((p,j)=>{const i=all?j:s.panelIndex,offset=Array.from(m.panels.slice(0,i).map(x=>x.text).join('')).length;return `<article class="rd-panel"><span class="rd-panel-number">${i+1}/${m.panels.length}</span>${window.ReadingComic.panel(p,i)}<div class="rd-story-text">${rt(p.text,{clickable:true,reference:m.text,offset})}</div>${button('rdSpeakSentence','听这一格',`data-index="${i}"`)}</article>`;}).join('')}</div><div class="rd-nav">${button('rdPanelPrev','上一格',s.panelIndex<=0?'disabled':'')}${button('rdPanelNext','下一格',s.panelIndex+1>=m.panels.length?'disabled':'')}${button('rdPanelAll',all?'逐格阅读':'整篇阅读')}${button('rdReadDone','我读好了，回答问题','','rd-button rd-primary')}</div>`;}
 function aids(c){const state=ui.voice.state||ui.voice.status,paused=['paused','pause_requested'].includes(state),playing=['requested','started','resume_requested'].includes(state);return `<section class="rd-aids" aria-label="阅读辅助"><div class="rd-nav">${button('rdPinyin',c.session.pinyinMode==='none'?'显示拼音':'隐藏拼音',`data-mode="${c.session.pinyinMode==='none'?'all':'none'}"`)}${button('rdSpeakAll','听全文')}${button('rdVoicePause','暂停朗读','id="rd-voice-pause"'+(playing?'':' hidden'))}${button('rdVoiceResume','继续朗读','id="rd-voice-resume"'+(paused?'':' hidden'))}${button('rdVoiceStop','停止朗读')}</div><p id="rd-voice-state" role="status">${rt(voiceText(ui.voice))}</p><p>${rt('点正文中的字，可以看拼音和听读。多音字可能连同所在词句一起读。')}</p><details><summary>${rt('更多阅读帮助')}</summary><div class="rd-nav">${button('rdVoiceRepeat','再听一次')}${button('rdParentRead','家长读过原文')}${button('rdFollow','我来跟读')}${button('rdRetell','我来复述')}</div><p>${rt('跟读与复述由自己或家长观察，不录音，不自动评分。')}</p></details></section>`;}
 function shuffled(q,sid){const arr=q.options.map((_,i)=>i);let n=parseInt(hash(q.id+sid),36)>>>0;for(let i=arr.length-1;i>0;i--){n=(Math.imul(n,1664525)+1013904223)>>>0;const j=n%(i+1);[arr[i],arr[j]]=[arr[j],arr[i]];}return arr;}
 // These examples are bound to the exact question, option order and passage;
 // edited or unreviewed material keeps the general, conservative prompt.
 function reviewedFeedback(m,q,last){
  const story='天乐先把书放进篮子，再把篮子搬到屋里。雨点落下来时，书还是干的。';
  const math='天乐有3张星星贴纸，小禾又送给他2张。天乐把这些贴纸放进同一个袋子，现在袋里共有多少张贴纸？';
  const rows={
   'R-D001-S1-Q1':{material:'R-D001-S1',text:story,prompt:'把天乐做的事排一排。',options:['把书放进篮子','看见书是干的','把篮子搬到屋里'],answer:[0,2,1]},
   'R-D001-S1-Q2':{material:'R-D001-S1',text:story,prompt:'书没有淋湿，哪件事帮了忙？',options:['只把书放进篮子，仍留门外','下雨前把装书的篮子搬进屋','下雨后才把装书的篮子搬进屋'],answer:1,hints:{0:'再看篮子放在哪里：门外和屋里有什么不同？',2:'比较搬进屋和雨落下的先后顺序。'}},
   'R-D001-M-Q1':{material:'R-D001-M',text:math,prompt:'这道题要找什么？',options:['小禾原来有几张','袋子的颜色','现在袋里的贴纸总数'],answer:2,hints:{0:'先找到问题里的对象，再看问题句：问的是谁现在的什么数量？',1:'先找到问题里的对象，再看问题末尾：它是在问数量，还是在问颜色？'}},
   'R-D001-M-Q2':{material:'R-D001-M',text:math,prompt:'哪两个数说的是合起来的贴纸？',options:['2张和1个袋子','3张和2张','3张和1个袋子'],answer:1,hints:{0:'比较已知条件里的“张”和“个”：袋子的个数是否也是贴纸的数量？',2:'找一找另一个以“张”为单位的已知条件；袋子以“个”为单位。'}},
   'R-D001-M-Q3':{material:'R-D001-M',text:math,prompt:'哪一个算式表示现在的贴纸数？',options:['3+2','3-2','3×2'],answer:0,hints:{1:'先看数量关系：“又送给他”表示贴纸增加还是减少？',2:'看数量关系：题目说的是增加一次，还是有若干组相同数量？'}},
   'R-D001-M-Q4':{material:'R-D001-M',text:math,prompt:'袋里共有多少张贴纸？',options:['1张','6张','5张'],answer:2,hints:{0:'先看数量关系：“又送给他”表示贴纸增加还是减少？',1:'先按数量关系数原有的3张，再数新收到的2张，核对有没有多算。'}}
  };
  const row=rows[q.id];
  const expectedType=q.id==='R-D001-S1-Q1'?'order':q.id==='R-D001-M-Q3'?'relation':'choice';
  if(!row||m?.id!==row.material||m.text!==row.text||q.type!==expectedType||q.prompt!==row.prompt||JSON.stringify(q.options)!==JSON.stringify(row.options)||JSON.stringify(q.answer)!==JSON.stringify(row.answer))return '';
  if(Array.isArray(row.answer)&&Array.isArray(last.selected)){
   if(last.selected[0]!==row.answer[0])return '从表示先后顺序的“先”后面核对第一张卡。';
   if(last.selected[1]!==row.answer[1])return '回看表示先后顺序的“再”后面的动作，核对第二张卡。';
   return '';
  }
  return Number.isInteger(last.selected)?row.hints?.[last.selected]||'':'';
 }
 function feedbackHint(q,last,m){
  const prompt={facts:'先找到问题里的对象，再回原文核对有没有提到。',sequence:'回看表示先后顺序的词，把发生过的事依次对照。',inference:'找出原文中能支持这个想法的句子，再比较选项。',conditions:'把题目问的对象和每个已知条件分别圈出来。',model:'留意文字中的动作或数量关系，再核对所选关系。',recognition:'回到这个字或词所在的句子，看看上下文在说什么。'}[q.ability]||'回到原文，对照问题和自己选择的内容。';
  const selected=Array.isArray(last.selected)?last.selected.map(i=>q.options[i]).filter(Boolean).join('、'):q.options[last.selected];
  return (selected?'再核对你选的“'+selected+'”。':'')+(reviewedFeedback(m,q,last)||prompt);
 }
 function hasFeedbackHint(c){return engine.snapshot().events.some(e=>e.type==='aid_requested'&&e.kind==='feedback_hint'&&e.sessionId===c.session.id&&e.questionId===c.question.id);}
 function quiz(c){const {material:m,question:q,session:s}=c,local=c.attempts.filter(a=>a.sessionId===s.id),last=local[local.length-1],pick=s.drafts[q.id],order=Array.isArray(pick)?pick:[],valid=q.type==='order'?order.length===q.options.length:Number.isInteger(pick),labels={reading:'读懂文字',math:'数学读题',literacy:'字词小发现'};
  return `<section class="rd-text-evidence"><h2>${rt('回到文字里找依据')}</h2><div class="rd-story-text">${rt(m.text,{clickable:true})}</div></section><section class="rd-question"><p>${rt(labels[q.category]||'阅读小挑战')}</p><h2>${rt(q.prompt)}</h2>${button('rdSpeakQuestion','听问题')}<div class="rd-options">${shuffled(q,s.id).map(i=>`<div class="rd-option-row">${button('rdPick',q.options[i],`data-index="${i}" aria-pressed="${q.type==='order'?order.includes(i):pick===i}"`,(q.type==='order'?order.includes(i):pick===i)?'rd-option rd-selected':'rd-option')}${button('rdSpeakOption','听',`data-index="${i}" aria-label="朗读这个选项"`,'rd-option-speak')}</div>`).join('')}</div>${q.type==='order'?`<p>${rt('我的顺序')}：${order.map(i=>rt(q.options[i])).join(' → ')}</p>${button('rdOrderUndo','撤回一张卡')}`:''}${button('rdSubmit',last?'再次提交':'我选好了',valid?'':'disabled','rd-button rd-primary')}${last?`<div class="rd-feedback ${last.correct?'rd-good':'rd-try'}" role="status"><strong>${rt(c.session.diagnostic?(last.correct?'选好了，说说你的依据。':'先别急，再读一次文字。'):(last.correct?'答对了，说说你的依据。':'这次还没答对，再读一次文字。'))}</strong>${!last.correct&&!c.session.diagnostic?(hasFeedbackHint(c)?'<p>'+rt(feedbackHint(q,last,m))+'</p>':button('rdTargetHint','查看一小步提示')):''}<p>${rt(last.first?'第一次的回答已经保留。':'这是再次练习，原来的首答仍然保留。')}</p>${!last.correct&&!c.revealed?button('rdRetry','再读或听原文，再试一次'):''}${button('rdReveal','看讲解')}${button('rdNext','下一步','','rd-button rd-primary')}</div>`:''}${c.revealed?`<aside class="rd-explanation"><h3>${rt('一起看依据')}</h3><p>${rt(q.explanation)}</p><p>${rt('答案')}：${Array.isArray(q.answer)?q.answer.map(i=>rt(q.options[i])).join(' → '):rt(q.options[q.answer])}</p></aside>`:''}</section>`;
 }
 function course(){const c=ensure().current();if(!c){ui.screen='finish';return finish();}const {material:m,session:s}=c,dx=s.diagnostic;const readingPhase=ui.phase==='read'&&!dx;const materialLabel=rt('第')+' '+(s.materialIndex+1)+'/'+s.materialIds.length+' '+rt('篇');const position=readingPhase?(ui.allPanels?rt('漫画共')+' '+m.panels.length+' '+rt('格'):rt('漫画第')+' '+(s.panelIndex+1)+'/'+m.panels.length+' '+rt('格')):rt('第')+' '+(s.questionIndex+1)+'/'+m.questions.length+' '+rt('题');const progress=materialLabel+' · '+position;return `${header(m.title,dx?conditionLabels[dx.condition]:'先看漫画和文字，再从文字里找依据。')}<div class="rd-session-line"><span>${progress}</span>${button(s.paused?'rdResume':'rdPause',s.paused?'继续':'休息一下')}</div>${s.restoredFromBackup?`<p class="rd-condition">${rt('本次为备份恢复，继续原来的位置；独立性另行核实。')}</p>`:''}${dx?`<p class="rd-condition">${rt('本次对照')} ${dx.condition} · ${rt('额外帮助会单独记录，不影响继续学习。')}</p>`:''}${s.paused?`<section class="rd-pause"><h2>${rt('休息一下吧')}</h2>${button('rdResume','继续阅读','','rd-button rd-primary')}</section>`:`${readingPhase?comic(m,s):quiz(c)}${aids(c)}`}`;}
 function finish(){const offer=engine.challenge();const challenge=!offer.eligible?'':offer.materialId?
  '<aside class="rd-condition" data-reading-challenge><p>'+rt('最近三道未见题都独立答对了。可以自愿试一段更长的文字，也可以继续原计划。')+'</p><p>'+rt('新段落：')+E(offer.title)+' · '+E(offer.goal||'阅读理解')+'</p><p>'+rt('挑战单独记录，不算完成当天的全部课程。')+'</p>'+button('rdChallenge','试试新的阅读挑战')+'</aside>':
  '<p class="rd-condition" data-reading-challenge>'+rt('最近三道未见题都独立答对了；当前范围暂时没有符合条件的更高阶段材料，可以继续原计划。')+'</p>';
  return `${header('这次阅读练习结束啦')}<section class="rd-finish"><h2>${rt(engine.status().status==='ready'?'这次练习已经保存。':'这次练习还没有保存，请家长导出草稿。')}</h2><p>${rt('换一段没见过的文字，看看能不能自己读懂。')}</p>${challenge}${button('rdTransfer','试一段没见过的数学题','','rd-button rd-primary')}${button('rdHome','回到阅读首页')}${button('rdParent','请家长看看记录')}</section>`;}
 function parent(){const e=ensure(),r=e.report(),s=e.snapshot().settings,known=[...new Set(e.data.materials.flatMap(m=>m.prerequisites||[]))],set=e.data.diagnostics?.sets.find(x=>x.id===ui.dxSet),math={attempts:host.saved.attempts?.length||0,topics:host.saved.topicPractice?.selectedTopicIds?.length||0};let academyInfo='学院历史记录可在原学院入口查看。';try{const academy=JSON.parse(localStorage.getItem('tianle_academy_v5_prototype')||'null');if(academy&&typeof academy==='object')academyInfo='已检测到原学院本机记录，保持原结构；仅在统一备份中保留。';}catch(_){academyInfo='原学院记录暂不能读取，未修改原文。';}
  return `<div class="rd-parent">${header('家长阅读看板','首答、求助、重试与最后结果分别保存。')}<section class="rd-summary"><div><b>${r.storyReadDays}/84</b><span>读过故事的天数</span></div><div><b>${r.completedDays}/84</b><span>完成过课程的天数</span></div><div><b>${percent(r.first)}</b><span>原始首答</span></div><div><b>${r.retries}</b><span>再次练习次数</span></div><div><b>${math.attempts}</b><span>旧路线提交</span></div></section><section class="rd-parent-card"><h2>家长设置</h2><p>确认后可调整阅读范围与设置；这是本机防误操作，不是账号安全锁。离开家长看板后会重新锁定。</p><button class="rd-button" data-action="rdSettingsUnlock" aria-pressed="${ui.parentSettingsUnlocked}">${ui.parentSettingsUnlocked?'锁定设置':'我是家长，确认调整设置'}</button><p>阅读范围：第 ${s.dayRange?.start||1} 至 ${s.dayRange?.end||84} 天。阶段测评需单独确认先修知识。</p><label>开始天 <input type="number" min="1" max="84" data-reading-field="rangeStart" value="${E(ui.rangeStart??s.dayRange?.start??1)}" ${ui.parentSettingsUnlocked?'':'disabled'}></label> <label>结束天 <input type="number" min="1" max="84" data-reading-field="rangeEnd" value="${E(ui.rangeEnd??s.dayRange?.end??84)}" ${ui.parentSettingsUnlocked?'':'disabled'}></label> <button class="rd-button" data-action="rdSaveRange" ${ui.parentSettingsUnlocked?'':'disabled'}>保存阅读范围</button><p>超出范围的课程不会被删除；如需继续，家长可以调整范围。</p></section><section class="rd-parent-card"><h2>辅助策略与隐私</h2><div class="rd-nav">${[['all','全拼音'],['demand','按需拼音'],['focus','重点字拼音'],['none','无拼音']].map(([m,t])=>`<button class="rd-button" data-action="rdSetMode" ${ui.parentSettingsUnlocked?'':'disabled'} data-mode="${m}" aria-pressed="${s.pinyin===m}">${t}</button>`).join('')}</div><p>由家长结合跨材料表现逐渐减少辅助，孩子仍可随时求助。隐藏拼音不抹去看过拼音的历史。重点字取自当前材料的焦点字词。</p><div class="rd-nav">${[[.65,'慢速'],[.85,'自然偏慢'],[1,'正常语速']].map(([rate,t])=>`<button class="rd-button" data-action="rdRate" ${ui.parentSettingsUnlocked?'':'disabled'} data-rate="${rate}" aria-pressed="${s.rate===rate}">${t}</button>`).join('')}</div><p>默认只使用浏览器明确标记为本地的普通话音色。不录音、不调用麦克风、不做语音识别。选择远程音色时，文字可能由设备语音服务传输处理。</p><button class="rd-button" data-action="rdRemoteConsent" ${ui.parentSettingsUnlocked?'':'disabled'} aria-pressed="${s.remoteVoiceConsent===true}">${s.remoteVoiceConsent?'撤销远程语音授权':'家长同意使用远程语音服务'}</button><p>音色能力：${E(JSON.stringify(speech.capabilities()))}。声调、停顿和实机音质需要实际听音复核。</p></section><section class="rd-parent-card"><h2>首答辅助分层</h2><div class="rd-summary">${r.levels.map(x=>`<div><b>${percent(x)}</b><span>L${x.level} · ${['无辅助','看过拼音','请求语音','家长代读'][x.level]||'额外支持'}</span></div>`).join('')}</div><p>看过题目提示后的首答：${percent(r.hintedFirst)}，单列，不计无辅助首答。</p><p>已见讲解后的首答：${percent(r.explained)}，单列，不混入 L3。待核实的旧版或未知题目作答：${r.quarantinedAttempts||0} 条，仅保留记录。</p><p>${E(r.independenceCaution||'首答关闭拼音不代表此前从未看过拼音。')}</p><p>语音请求与实际 started / failed 分别保存；未能播放也保留求助事实。听过后答对不能覆盖原始首答。</p></section><section class="rd-parent-card" id="rd-diagnostic" tabindex="-1"><h2>阅读与数学分离诊断</h2><p>请确认孩子已经掌握本组数学知识。A/B/C/D 使用同蓝图不同新材料，轮换分配，建议分次进行以控制疲劳。蓝图匹配尚不等于经过儿童样本校准的等难度。</p><div class="rd-nav">${(e.data.diagnostics?.sets||[]).map(x=>`<button class="rd-button" data-action="rdDxSet" data-set="${x.id}" aria-pressed="${x.id===ui.dxSet}">${x.week===0?'初测':`第${x.week}周${[4,8,12].includes(x.week)?'阶段诊断':'周测'}`}</button>`).join('')}</div><p>本组先修：${E((set?.blueprint.mathKnowledge||[]).join('、'))}</p><button class="rd-button" data-action="rdKnowledgeConfirm" aria-pressed="${ui.knowledgeConfirmed}">${ui.knowledgeConfirmed?'已确认本组先修':'家长确认：本组数学知识已掌握'}</button><button class="rd-button rd-primary" data-action="rdDiagnostic" ${ui.knowledgeConfirmed?'':'disabled'}>开始下一份未见材料</button><div class="rd-summary">${Object.entries(r.conditions||{}).map(([c,x])=>`<div><b>${c} · ${percent(x)}</b><span>${{A:'无拼音无语音',B:'有拼音无语音',C:'无拼音系统听读',D:'代读原文后解答'}[c]}</span></div>`).join('')}</div><p>${E(r.interpretation||'这些是支持需求线索，不是固定能力标签。')}</p><ul>${(r.signals||[]).map(x=>`<li>${E(x.label)}：${x.count} 条相关记录，需结合多次未见材料复核。</li>`).join('')}</ul><details><summary>同蓝图对照明细</summary><pre>${E(JSON.stringify({valid:r.matchedSets,excluded:r.diagnosticExcluded||[]},null,2))}</pre></details></section><section class="rd-parent-card"><h2>十二周变化</h2><div class="rd-table-wrap"><table><thead><tr><th>周</th><th>完成天数</th><th>首答</th><th>L0</th><th>L1</th><th>L2</th><th>L3</th></tr></thead><tbody>${r.weeks.map(w=>`<tr><td>${w.week}${[4,8,12].includes(w.week)?' 阶段':''}</td><td>${w.completedDays}/7</td><td>${percent(w.first)}</td><td>${percent(w.L0)}</td><td>${percent(w.L1)}</td><td>${percent(w.L2)}</td><td>${percent(w.L3)}</td></tr>`).join('')}</tbody></table></div><p>原数学仍保留 ${math.topics} 个已选知识区域。中文训练不降低或替代原数学主线。</p><button class="rd-button" data-action="progress">查看数学学习记录</button><p>${E(academyInfo)}</p><h3>本周与下一周准入</h3>${(r.readiness||[]).map(x=>`<p>第${x.week}周：${E(x.reason)}；样本 ${x.samples||0}，${x.ready?'达到本地准入条件':'继续观察与补强'}。</p>`).join('')}</section><section class="rd-parent-card"><h2>先看首答与求助事实</h2><p>${E(r.supportEvidence?.interpretation||'题目标签不等于实际错因。')}</p><div class="rd-table-wrap"><table><thead><tr><th>任务</th><th>未见无辅助首答</th><th>有辅助首答</th></tr></thead><tbody>${(r.supportEvidence?.byCategory||[]).map(x=>`<tr><td>${{reading:'阅读理解',math:'数学读题',literacy:'字词句'}[x.category]}</td><td>${percent(x.independent)}</td><td>${percent(x.assistedFirst)}</td></tr>`).join('')}</tbody></table></div><p>答错后借助帮助答对，仍保留原始首答。表中比例是任务记录，不是阅读障碍诊断。</p></section><section class="rd-parent-card"><h2>重点补强与下一阶段</h2><p>错误线索：${E(Object.entries(r.errors||{}).map(([k,v])=>`${k}: ${v}`).join('；')||'暂无首答错误记录')}</p><p>需要关注的字词：${E((r.focusWords||[]).map(x=>x.word).join('、')||'等待跨材料记录')}</p><p>字词稳定表现需要多个日期、多个不同题目的无辅助证据，不能凭一次作答确认识字。</p><p>${E(r.recommendation?.reason||'先积累短篇阅读表现。')}</p><button class="rd-button" data-action="rdRemediate">打开对应补强</button><p>到期复习 ${r.due?.length||0} 题。旧题复习不计未见迁移。</p><h3>家长选择已掌握的数学知识</h3><div class="rd-nav">${known.map(k=>`<button class="rd-button" data-action="rdKnown" ${ui.parentSettingsUnlocked?'':'disabled'} data-value="${E(k)}" aria-pressed="${s.knownMath.includes(k)}">${E(k)}</button>`).join('')}</div><p>若文字或条件理解不稳定，优先完成对应备用材料；周目标稳定后再提高文字复杂度，数学仍按原有进度学习。</p></section><section class="rd-parent-card"><h2>点字求助与读文间隔</h2><p>点字次数是求助线索，不是永久生字标签。</p><p>${E((r.tappedCharacters||[]).map(x=>x.character+'：'+x.requests).join('；')||'暂无点字记录')}</p><p>${E(r.readingPace?.caution||'读好按钮前的活动时间不是标准化阅读速度。')}</p>${(r.readingPace?.byAidLevel||[]).map(x=>`<p>L${x.level}：${x.observations} 段，${Math.round(x.activeMs/1000)} 秒，${x.characters} 字。</p>`).join('')}<h2>每日有效时长</h2><p>只累计前台互动和短心跳间的时间；后台、暂停和长时间空置不计。</p>${Object.entries(r.daily||{}).map(([d,t])=>`<p>${E(d)}：${Math.round(t/6000)/10} 分钟</p>`).join('')||'<p>暂无有效时长记录。</p>'}</section><section class="rd-parent-card"><h2>备份与旧版迁移</h2><p>数学与阅读记录分开保存，统一导出同时保留。旧 v2 记录只归档参考，不授予新版独立首答。题目更新后保留原始作答；受影响的未完成草稿归档在备份中，不按新版选项重判。导入合并记录并保留本机课程；同内容版本的未完成课程可暂停恢复，不更改本机语音授权。</p><div class="rd-nav"><button class="rd-button" data-action="progressExport">导出数学与阅读统一备份</button><button class="rd-button" data-action="rdExport">导出阅读备份</button><button class="rd-button" data-action="rdLegacyLocal">归档本机 v2 记录</button></div><label>选择阅读备份 JSON <input type="file" accept="application/json,.json" data-reading-import="true"></label><label>也可粘贴备份 JSON<textarea id="rd-import" data-reading-field="import" rows="5">${E(ui.importText)}</textarea></label><button class="rd-button" data-action="rdImport">合并阅读备份</button><p>已归档旧版备份 ${r.legacyCount||0} 份。</p></section></div>`;
 }
 function renderPage(){ensure();ui.texts.clear();paintState={current:engine.current(),settings:engine.snapshot().settings};try{const state=engine.status(),body=ui.screen==='course'?course():ui.screen==='plan'?plan():ui.screen==='parent'?parent():ui.screen==='finish'?finish():home();return `<div class="rd-app">${state.status!=='ready'?`<p class="rd-storage-alert" role="alert">${E(state.message)}</p>`:''}${ui.message?`<p class="rd-message" role="status">${rt(ui.message)}</p>`:''}${body}</div>`;}finally{paintState=null;}}
 function syncCoursePhase(){const c=engine.current();ui.phase=c?.session.diagnostic||c?.readingComplete?'quiz':'read';ui.allPanels=false;ui.tapped.clear();}
 function unfinishedCourses(){const pending=engine.unfinished().filter(s=>!s.active);return pending.length?`<details class="rd-unfinished"><summary>${rt('其他未完成的阅读')} (${pending.length})</summary><div class="rd-nav">${pending.map(s=>button('rdResume',s.title,`data-session="${E(s.id)}"`)).join('')}</div></details>`:'';}
 function begin(ids,opts={}){speech.stop();engine.start(ids,opts);syncCoursePhase();ui.screen='course';host.view='reading';host.render();}
 function handle(action,d={}){if(action!=='reading'&&!String(action).startsWith('rd'))return false;const e=ensure();ui.message='';
  if(action==='reading'||action==='rdHome'){show('home');return true;}
  if(action==='rdParent'){ui.parent=true;ui.parentSettingsUnlocked=false;ui.rangeStart=null;ui.rangeEnd=null;show('parent');return true;}
  if(action==='rdOpenDiagnostic'){const set=e.data.diagnostics?.sets.find(x=>x.id===d.set);if(!set)return true;ui.parent=true;ui.dxSet=set.id;ui.knowledgeConfirmed=false;show('parent');ui.message='已选择第'+set.week+'周诊断，请家长先确认已学知识。';host.render();const panel=document.getElementById('rd-diagnostic');panel?.scrollIntoView?.({block:'start'});return true;}
  if(action==='rdPlan'){show('plan');return true;}
  if(action==='rdStart'){speech.stop();const c=e.startDay(Math.max(1,Math.min(84,Number(d.day)||e.nextDay())));if(c){syncCoursePhase();ui.screen='course';}else{ui.screen='home';ui.message='这一天不在家长选择的阅读范围内；原课程和记录仍保留。';}host.view='reading';host.render();return true;}
  if(action==='rdChallenge'){speech.stop();const c=e.startChallenge();if(c){syncCoursePhase();ui.screen='course';}else ui.message='当前范围暂时没有符合条件的新挑战，原记录仍保留。';host.view='reading';host.render();return true;}
  if(action==='rdResume'){speech.stop();const c=e.resumeSession(d.session||e.current()?.session.id);if(c){syncCoursePhase();ui.screen='course';}else{ui.screen='home';ui.message='课程暂不可继续，可能不在当前阅读范围内；原记录和草稿仍保留。';}host.view='reading';host.render();return true;}
  if(action==='rdPause'){e.pause();speech.stop();host.render();return true;}
  if(action==='rdReadDone'){if(ui.phase==='read')e.markReadDone?.();speech.stop();ui.phase='quiz';host.render();return true;}
  if(action==='rdPanelPrev'||action==='rdPanelNext'){const c=e.current();if(c)e.panel(c.session.panelIndex+(action==='rdPanelNext'?1:-1));host.render();return true;}
  if(action==='rdPanelAll'){ui.allPanels=!ui.allPanels;host.render();return true;}
  if(action==='rdPick'){const c=e.current(),i=Number(d.index);if(ui.phase==='quiz'&&c&&Number.isInteger(i)&&i>=0&&i<c.question.options.length){if(c.question.type==='order'){const order=c.session.drafts[c.question.id]||[];if(!order.includes(i))e.select([...order,i]);}else e.select(i);}host.render();return true;}
  if(action==='rdOrderUndo'){const c=e.current();if(c)e.select((c.session.drafts[c.question.id]||[]).slice(0,-1));host.render();return true;}
  if(action==='rdSubmit'){const c=e.current();if(c&&ui.phase==='quiz'){const result=e.submit(c.session.drafts[c.question.id]);if(result&&!result.correct&&!c.session.diagnostic&&!hasFeedbackHint(c))e.requestAid('feedback_hint',{reason:'practice-feedback'});}host.render();return true;}
  if(action==='rdTargetHint'){const c=e.current();if(c&&!c.session.diagnostic&&c.attempts.some(a=>a.sessionId===c.session.id&&!a.correct)&&!hasFeedbackHint(c))e.requestAid('feedback_hint',{reason:'practice-feedback'});host.render();return true;}
  if(action==='rdNext'){const old=e.current();speech.stop();const result=e.next();if(result==='complete')ui.screen='finish';else if(result){const c=e.current();if(c&&old?.material.id!==c.material.id){ui.phase=c.session.diagnostic?'quiz':'read';ui.allPanels=false;}}host.render();window.scrollTo({top:0,behavior:'instant'});return true;}
  if(action==='rdReveal'){e.reveal();host.render();return true;}
  if(action==='rdRetry'){ui.message='可以再读文字，或点听全文。第一次的答案不会改变。';host.render();return true;}
  if(action==='rdPinyin'){e.setting('pinyin',d.mode==='none'?'none':'all');host.render();return true;}
  if(action==='rdSettingsUnlock'&&ui.parent&&ui.screen==='parent'){ui.parentSettingsUnlocked=!ui.parentSettingsUnlocked;host.render();return true;}
  if(action==='rdSaveRange'&&ui.parent&&ui.screen==='parent'&&ui.parentSettingsUnlocked){const current=e.snapshot().settings.dayRange||{start:1,end:84},start=Number(ui.rangeStart??current.start),end=Number(ui.rangeEnd??current.end);if(!e.setting('dayRange',{start,end}))ui.message='请填写 1 到 84 的起止天数，开始天不能晚于结束天。';else ui.message=e.status().status==='ready'?'阅读范围已保存；不在范围内的课程和草稿仍保留。':'范围尚未保存，请先导出并检查记录状态。';host.render();return true;}
  if(action==='rdSetMode'&&ui.parent&&ui.screen==='parent'&&ui.parentSettingsUnlocked){e.setting('pinyin',d.mode);host.render();return true;}
  if(action==='rdRate'&&ui.parent&&ui.screen==='parent'&&ui.parentSettingsUnlocked){e.setting('rate',Number(d.rate));host.render();return true;}
  if(action==='rdRemoteConsent'&&ui.parent&&ui.screen==='parent'&&ui.parentSettingsUnlocked){e.setting('remoteVoiceConsent',!e.snapshot().settings.remoteVoiceConsent);speech.stop();host.render();return true;}
  if(action==='rdKnown'&&ui.parent&&ui.screen==='parent'&&ui.parentSettingsUnlocked){const known=e.snapshot().settings.knownMath;e.setting('knownMath',known.includes(d.value)?known.filter(x=>x!==d.value):[...known,d.value]);host.render();return true;}
  if(action==='rdDxSet'&&ui.parent){ui.dxSet=d.set;ui.knowledgeConfirmed=false;host.render();return true;}
  if(action==='rdKnowledgeConfirm'&&ui.parent){ui.knowledgeConfirmed=!ui.knowledgeConfirmed;host.render();return true;}
  if(action==='rdDiagnostic'&&ui.parent){const result=e.startDiagnostic(ui.dxSet,ui.knowledgeConfirmed);if(result.ok){speech.stop();ui.phase='quiz';ui.screen='course';}else ui.message=result.reason;host.render();return true;}
  if(action==='rdReview'){const due=e.due();if(due.length)begin([...new Set(due.map(x=>x.materialId))].slice(0,2),{purpose:'review'});else{ui.message='今天没有到期复习，可以读一段新故事。';host.view='reading';host.render();}return true;}
  if(action==='rdRemediate'){const r=e.recommend();if(r.materialId)begin([r.materialId],{purpose:'remediation'});else{ui.message='暂时没有符合先修选择的新补强材料，请家长看看记录。';host.view='reading';host.render();}return true;}
  if(action==='rdTransfer'){const m=e.transfer();if(m)begin([m.id],{purpose:'unseen-math-transfer'});else{ui.message='暂时没有符合已掌握知识的新题，请家长看看先修选择。';host.render();}return true;}
  if(action==='rdMathConcern'){const task=host.taskNow();if(task)e.mathSignal(task,d.reason);const rec=e.recommend();if(d.reason!=='math'&&rec.materialId)begin([rec.materialId],{purpose:'remediation'});else show('home');return true;}
  if(action==='rdParentRead'){e.requestAid('parent',{attestation:'家长只读原文，不解释答案'});ui.message='已记录家长代读，请孩子继续自己回答。';host.render();return true;}
  if(action==='rdFollow'||action==='rdRetell'){e.requestAid(action==='rdFollow'?'follow_reading':'oral_retell',{evaluation:'self-or-parent-observation',recording:false});ui.message=action==='rdFollow'?'听一句，再自己读一句。不录音，不自动评分。':'说一说人物、发生的事和文字依据。家长观察，不自动评分。';host.render();return true;}
  if(action==='rdChar'){const text=ui.texts.get(d.key),i=Number(d.index);if(text&&Number.isInteger(i)&&i>=0&&i<Array.from(text).length){const mode=e.current()?.session.pinyinMode||e.snapshot().settings.pinyin,changed=mode==='none'?'demand':mode;ui.tapped.add(d.key+':'+i);e.requestAid('pinyin',{mode:changed,character:Array.from(text)[i]});if(mode==='none')e.setting('pinyin','demand');host.render();speech.speak(Array.from(text)[i],{kind:'character',contextText:text,charIndex:i,elementKey:d.key,materialId:e.current()?.material.id});}return true;}
  if(action==='rdVoicePause'){speech.pause();return true;}if(action==='rdVoiceResume'){speech.resume();return true;}if(action==='rdVoiceStop'){speech.stop();return true;}if(action==='rdVoiceRepeat'){speech.repeat();return true;}
  if(['rdSpeakAll','rdSpeakSentence','rdSpeakQuestion','rdSpeakOption'].includes(action)){const c=e.current();if(c){const index=Number(d.index),text=action==='rdSpeakAll'?c.material.text:action==='rdSpeakSentence'?c.material.panels[index]?.text:action==='rdSpeakQuestion'?c.question.prompt:c.question.options[index];if(text){const isPanel=action==='rdSpeakSentence',offset=isPanel?Array.from(c.material.panels.slice(0,index).map(x=>x.text).join('')).length:0;speech.speak(text,{kind:action==='rdSpeakAll'?'story':isPanel?'sentence':'question',offset,materialId:c.material.id,elementKey:hash(isPanel?c.material.text:text)});}}return true;}
  if(action==='rdExport'){download(e.backup(),'tianle-reading-r1-'+Date.now()+'.json');return true;}
  if(action==='rdImport'&&ui.parent){const result=importText(ui.importText);ui.message=result.ok?'阅读记录已合并，原数学记录保留。':result.reason;host.render();return true;}
  if(action==='rdLegacyLocal'&&ui.parent){try{const raw=localStorage.getItem('tianle-reading-v2');if(!raw)ui.message='本机没有 v2 阅读记录。';else{const r=e.importBackup(JSON.stringify({schema:'tianle-reading-v2-backup',store:JSON.parse(raw)}));ui.message=r.ok?'旧版记录已归档，原键保留，不授予新版独立证据。':r.reason;}}catch(_){ui.message='旧版记录未能安全读取，原记录保留。';}host.render();return true;}
  return true;
 }
 function importText(text){try{const b=JSON.parse(text);if(b.format==='tianle-record-backup-v1'&&b.reading)text=JSON.stringify({schema:'amc8-reading-r1-backup',reading:b.reading});}catch(_){}return engine.importBackup(text);}
 function download(text,name){if(typeof document.createElement!=='function'||typeof Blob==='undefined'||typeof URL==='undefined'){ui.message='当前环境无法下载，请用支持下载的浏览器导出。';return;}const u=URL.createObjectURL(new Blob([text],{type:'application/json'})),a=document.createElement('a');a.href=u;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(u),1000);}
 function input(target){if(target?.dataset?.readingField==='rangeStart'||target?.dataset?.readingField==='rangeEnd'){if(ui.parent&&ui.screen==='parent'&&ui.parentSettingsUnlocked)ui[target.dataset.readingField]=String(target.value||'');return true;}if(target?.dataset?.readingField==='import'){ui.importText=String(target.value||'').slice(0,16000000);return true;}if(target?.dataset?.readingImport&&target.files?.[0]&&ui.parent){target.files[0].text().then(text=>{const r=importText(text);ui.message=r.ok?'阅读记录已合并。':r.reason;host.render();}).catch(()=>{ui.message='未能读取所选备份。';host.render();});return true;}return false;}
 function afterRender(){if(host.view==='reading'&&engine?.current()?.session.paused)speech.stop();}
 function navigationState(){return {screen:ui.screen,sessionId:engine?.current()?.session.id||null};}
 function restoreNavigation(target){
  if(target?.screen==='course'&&target.sessionId){const c=ensure().resumeSession(target.sessionId);if(c){syncCoursePhase();ui.screen='course';ui.parent=false;ui.parentSettingsUnlocked=false;host.view='reading';host.render();return true}ui.message='这段课程暂不能继续；原记录仍保留，可在家长设置中检查阅读范围。';ui.screen='home';host.view='reading';host.render();return false;}
  if(target?.screen==='parent')return handle('rdParent');
  if(target?.screen==='plan')return handle('rdPlan');
  if(target?.screen==='finish'){show('finish');return true}
  return handle('reading');
 }
 return {render:renderPage,handle,input,entry,mathBridge,leave,afterRender,navigationState,restoreNavigation,snapshot:()=>ensure().snapshot(),report:()=>ensure().report(),engine:()=>ensure(),backup:()=>ensure().backup(),openMaterials:(ids,opts={})=>{ensure();return begin(ids,opts);},rt,pronounce};
})();
