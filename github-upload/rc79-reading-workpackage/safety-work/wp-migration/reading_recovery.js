/* Reading-only recovery preparation. Does not replace the production record. */
(function(root,factory){
 'use strict';
 const api=factory();if(typeof module!=='undefined'&&module.exports)module.exports=api;
 if(root)root.ReadingRecovery=api;
})(typeof globalThis==='undefined'?null:globalThis,function(){
 'use strict';
 const MAX_TEXT=16000000,MAX_NODES=5000000,MAX_EVENTS=119999;
 const isObject=v=>v!==null&&typeof v==='object'&&!Array.isArray(v);
 const badKeys=new Set(['__proto__','prototype','constructor']);
 function safeTree(value){
  const queue=[[value,0]];let count=0;
  while(queue.length){const [item,depth]=queue.pop();if(++count>MAX_NODES||depth>30)return false;
   if(item===null||typeof item!=='object')continue;
   for(const key of Object.keys(item)){if(badKeys.has(key))return false;queue.push([item[key],depth+1]);}
  }return true;
 }
 function recordSummary(raw){
  if(typeof raw!=='string'||raw.length>MAX_TEXT)return {structural:false,reason:'RAW_SIZE_OR_TYPE'};
  let record;try{record=JSON.parse(raw)}catch(_){return {structural:false,reason:'INVALID_JSON'}}
  if(!isObject(record)||!safeTree(record)||record.schema!==1||typeof record.contentHash!=='string'||!record.contentHash||record.contentHash.length>200||!Number.isSafeInteger(record.revision)||record.revision<0||!isObject(record.settings)||!Array.isArray(record.events)||record.events.length>MAX_EVENTS||!(record.session===null||isObject(record.session))||!(record.suspendedSessions===undefined||Array.isArray(record.suspendedSessions))||!(record.legacy===undefined||Array.isArray(record.legacy)))return {structural:false,reason:'UNSUPPORTED_RECORD_STRUCTURE'};
  const ids=new Set();for(const event of record.events){if(!isObject(event)||typeof event.id!=='string'||!event.id||event.id.length>200||typeof event.type!=='string'||!event.type||ids.has(event.id))return {structural:false,reason:'INVALID_OR_DUPLICATE_EVENT'};ids.add(event.id)}
  return {structural:true,contentHash:record.contentHash,revision:record.revision,eventCount:record.events.length,hasSession:record.session!==null,suspendedCount:(record.suspendedSessions||[]).length};
 }
 function inspect(text,{currentContentHash=null,knownContentHashes=[]}={}){
  if(typeof text!=='string'||text.length>MAX_TEXT)return {ok:false,code:'BACKUP_SIZE_OR_TYPE'};
  let obj;try{obj=JSON.parse(text)}catch(_){return {ok:false,code:'BACKUP_INVALID_JSON'}}
  if(!isObject(obj)||!safeTree(obj))return {ok:false,code:'BACKUP_UNSAFE_STRUCTURE'};
  let protection,reading,format;
  if(obj.format==='tianle-record-backup-v1'){format='unified';protection=obj.readingProtection||{};reading=obj.reading;}
  else if(obj.schema==='amc8-reading-r1-backup'){format='reading';protection=obj;reading=obj.reading;}
  else return {ok:false,code:'UNSUPPORTED_BACKUP_FORMAT'};
  if(!isObject(protection)||!(reading===null||reading===undefined||isObject(reading)))return {ok:false,code:'BACKUP_UNSAFE_STRUCTURE'};
  const fields=['upgradeOriginal','currentStoredRecord','baselineStoredRecord','unreadableOriginal'],candidates=[],warnings=[];
  for(const name of fields){const raw=protection[name];if(raw===null||raw===undefined)continue;if(typeof raw!=='string'||raw.length>MAX_TEXT)return {ok:false,code:'RAW_SIZE_OR_TYPE'};
   let found=candidates.find(x=>x.raw===raw);if(found){found.sources.push(name);continue;}candidates.push({sources:[name],raw,exactRaw:true});}
  if(reading!==null&&reading!==undefined){let raw;try{raw=JSON.stringify(reading)}catch(_){return {ok:false,code:'BACKUP_UNSAFE_STRUCTURE'}}
   if(raw.length>MAX_TEXT)return {ok:false,code:'RAW_SIZE_OR_TYPE'};let found=candidates.find(x=>x.raw===raw);if(found)found.sources.push('readingSnapshot');else candidates.push({sources:['readingSnapshot'],raw,exactRaw:false});}
  if(protection.upgradeOriginalReadable===false)warnings.push('UPGRADE_ORIGINAL_UNREADABLE_OR_MISSING');
  if(protection.currentStoredReadable===false)warnings.push('CURRENT_STORED_RECORD_UNREADABLE');
  const known=new Set(Array.isArray(knownContentHashes)?knownContentHashes.filter(x=>typeof x==='string'):[]);
  for(const candidate of candidates){const summary=recordSummary(candidate.raw);candidate.summary=summary;
   candidate.compatibility=!summary.structural?'UNREADABLE':summary.contentHash===currentContentHash?'CURRENT_CONTENT_HASH_MATCH':known.has(summary.contentHash)?'KNOWN_OTHER_CONTENT_HASH':'UNKNOWN_CONTENT_HASH';
  }
  return {ok:true,format,candidates,warnings,note:'结构检查和内容哈希匹配不证明来源真实性，也不替代正式引擎校验。'};
 }
 function keyOk(key){return typeof key==='string'&&key.length>11&&key.length<=180&&/^[A-Za-z0-9_-]+_reading_r1$/.test(key)}
 function buildBundle({readingKey,expectedRaw,candidate,currentContentHash}){
  if(!keyOk(readingKey)||!(expectedRaw===null||typeof expectedRaw==='string')||typeof currentContentHash!=='string'||!currentContentHash||!candidate||typeof candidate.raw!=='string'||candidate.raw.length>MAX_TEXT||!Array.isArray(candidate.sources)||!candidate.sources.every(x=>typeof x==='string'&&x.length<=80))return {ok:false,code:'INVALID_ARGUMENT'};
  if(expectedRaw!==null&&expectedRaw.length>MAX_TEXT)return {ok:false,code:'CURRENT_RECORD_TOO_LARGE'};
  const summary=recordSummary(candidate.raw);
  const bundle={schema:'tianle-reading-recovery-stage-v1',readingKey,currentContentHash,baselineRaw:expectedRaw,candidateRaw:candidate.raw,candidateSources:[...candidate.sources],candidateExactRaw:candidate.exactRaw===true,candidateSummary:summary};
  const serialized=JSON.stringify(bundle);if(serialized.length>MAX_TEXT)return {ok:false,code:'STAGE_TOO_LARGE'};
  return {ok:true,bundle,serialized};
 }
 function digest(api,value){const x=api.digest(value);if(typeof x!=='string'||!/^[a-f0-9]{64}$/.test(x))throw Error('invalid digest');return x;}
 async function stage({storage,progressStore,readingKey,expectedRaw,candidate,currentContentHash,indexedDB,timeoutMs=20000}){
  const built=buildBundle({readingKey,expectedRaw,candidate,currentContentHash});if(!built.ok)return built;
  if(!storage||typeof storage.getItem!=='function'||typeof storage.setItem!=='function'||!progressStore||typeof progressStore.open!=='function'||typeof progressStore.digest!=='function'||!Number.isFinite(timeoutMs)||timeoutMs<1)return {ok:false,code:'INVALID_ARGUMENT'};
  let stageKey;try{stageKey=readingKey+'_recovery_stage_'+digest(progressStore,built.serialized)}catch(_){return {ok:false,code:'DIGEST_UNAVAILABLE'}}
  try{if(storage.getItem(readingKey)!==expectedRaw)return {ok:false,code:'BASELINE_CHANGED'};const existing=storage.getItem(stageKey);if(existing!==null&&existing!==built.serialized)return {ok:false,code:'STAGE_KEY_COLLISION'};}
  catch(_){return {ok:false,code:'STORAGE_UNAVAILABLE'}}
  return await new Promise(resolve=>{
   let store=null,queued=false,finished=false,timer=null;
   function finish(result){if(finished)return;finished=true;if(timer!==null)clearTimeout(timer);try{store?.close()}catch(_){}resolve(result);}
   function observe(result){if(finished||!queued)return;const status=result?.status||store?.getStatus();
    if(status==='ready'){
     try{if(storage.getItem(readingKey)!==expectedRaw)return finish({ok:false,code:'BASELINE_CHANGED',stageKey});if(storage.getItem(stageKey)===built.serialized)return finish({ok:true,code:'STAGED_ONLY',stageKey,summary:built.bundle.candidateSummary});}
     catch(_){return finish({ok:false,code:'STORAGE_UNAVAILABLE',stageKey});}
    }else if(['conflict','read_only','unsaved'].includes(status))finish({ok:false,code:'STAGE_NOT_CONFIRMED',status,stageKey});
   }
   try{
    const adapter={storage,transactional:true,expectedRaw,onStatus:result=>Promise.resolve().then(()=>observe(result))};
    if(indexedDB!==undefined)adapter.indexedDB=indexedDB;
    store=progressStore.open(readingKey,adapter);store.backup(stageKey,built.serialized);queued=true;
    timer=setTimeout(()=>finish({ok:false,code:'STAGE_TIMEOUT',stageKey}),timeoutMs);
    Promise.resolve().then(()=>observe({status:store.getStatus()}));
   }catch(_){finish({ok:false,code:'STAGE_NOT_CONFIRMED',stageKey});}
  });
 }
 function readStage({storage,progressStore,readingKey,stageKey}){
  if(!keyOk(readingKey)||typeof stageKey!=='string'||!stageKey.startsWith(readingKey+'_recovery_stage_')||!progressStore||typeof progressStore.digest!=='function')return {ok:false,code:'INVALID_ARGUMENT'};
  let raw;try{raw=storage.getItem(stageKey)}catch(_){return {ok:false,code:'STORAGE_UNAVAILABLE'}}
  if(raw===null)return {ok:false,code:'STAGE_NOT_FOUND'};if(typeof raw!=='string'||raw.length>MAX_TEXT)return {ok:false,code:'INVALID_STAGE'};
  try{if(stageKey!==readingKey+'_recovery_stage_'+digest(progressStore,raw))return {ok:false,code:'STAGE_DIGEST_MISMATCH'};
   const obj=JSON.parse(raw);if(!isObject(obj)||!safeTree(obj)||obj.schema!=='tianle-reading-recovery-stage-v1'||obj.readingKey!==readingKey||!(obj.baselineRaw===null||typeof obj.baselineRaw==='string')||typeof obj.candidateRaw!=='string'||obj.candidateRaw.length>MAX_TEXT||typeof obj.currentContentHash!=='string'||!obj.currentContentHash)return {ok:false,code:'INVALID_STAGE'};
   return {ok:true,bundle:obj};
  }catch(_){return {ok:false,code:'INVALID_STAGE'}}
 }
 function stable(value){if(Array.isArray(value))return '['+value.map(stable).join(',')+']';if(isObject(value))return '{'+Object.keys(value).sort().map(k=>JSON.stringify(k)+':'+stable(value[k])).join(',')+'}';return JSON.stringify(value);}
 function comparableEvent(e){const copy={...e};delete copy.imported;return stable(copy);}
 // This only reads the active reading key. The returned baseline can be
 // exported with buildBundle, and is rechecked immediately before staging.
 // It is a conservative structural review, not engine or provenance validation.
 function preflight({storage,readingKey,candidate,currentContentHash}){
  if(!keyOk(readingKey)||!storage||typeof storage.getItem!=='function'||!candidate||typeof candidate.raw!=='string'||candidate.raw.length>MAX_TEXT||typeof currentContentHash!=='string'||!currentContentHash)return {ok:false,code:'INVALID_ARGUMENT'};
  let baselineRaw;try{baselineRaw=storage.getItem(readingKey)}catch(_){return {ok:false,code:'STORAGE_UNAVAILABLE'}}
  if(!(baselineRaw===null||typeof baselineRaw==='string')||baselineRaw!==null&&baselineRaw.length>MAX_TEXT)return {ok:false,code:'CURRENT_RECORD_TOO_LARGE'};
  const baseline=baselineRaw===null?null:recordSummary(baselineRaw),incoming=recordSummary(candidate.raw),warnings=[];
  if(baseline&&!baseline.structural)warnings.push('CURRENT_RECORD_UNREADABLE');
  if(!incoming.structural)warnings.push('CANDIDATE_UNREADABLE');
  if(incoming.structural&&incoming.contentHash!==currentContentHash)warnings.push('CANDIDATE_CONTENT_VERSION_DIFFERS');
  if(baseline?.structural&&baseline.contentHash!==currentContentHash)warnings.push('CURRENT_CONTENT_VERSION_DIFFERS');
  let eventIdConflictCount=null,sessionIdOverlapCount=null,legacyWithoutDigestCount=null;
  if(incoming.structural){
   const other=JSON.parse(candidate.raw);
   legacyWithoutDigestCount=(other.legacy||[]).filter(entry=>!entry||typeof entry.digest!=='string'||!entry.digest).length;
   if(legacyWithoutDigestCount)warnings.push('LEGACY_ARCHIVES_REQUIRE_SPECIAL_HANDLING');
   if(baseline?.structural){
    const here=JSON.parse(baselineRaw),eventById=new Map(here.events.map(e=>[e.id,e]));
    eventIdConflictCount=other.events.filter(e=>eventById.has(e.id)&&comparableEvent(e)!==comparableEvent(eventById.get(e.id))).length;
    const ids=new Set([here.session,...(here.suspendedSessions||[])].filter(isObject).map(s=>s.id).filter(id=>typeof id==='string'));
    sessionIdOverlapCount=[other.session,...(other.suspendedSessions||[])].filter(s=>isObject(s)&&typeof s.id==='string'&&ids.has(s.id)).length;
    if(eventIdConflictCount)warnings.push('EVENT_ID_CONTENT_CONFLICT');
    if(sessionIdOverlapCount)warnings.push('SESSION_ID_OVERLAP_REQUIRES_REVIEW');
   }
  }
  return {ok:true,code:'READ_ONLY_PREFLIGHT',baselineRaw,baseline,candidate:incoming,eventIdConflictCount,sessionIdOverlapCount,legacyWithoutDigestCount,warnings,restorationSupported:false,note:'暂存与结构检查不会恢复记录；结构检查和哈希匹配不证明来源真实性，也不能代替正式引擎与人工核验。'};
 }
 // FIX15 importBackup skips legacy archives without a digest and can skip
 // overlapping sessions. Do not mutate a live record until a complete,
 // independently tested restore transaction preserves all fields.
 function mergeIntoCurrent(){return {ok:false,code:'RESTORE_NOT_IMPLEMENTED'};}
 async function mergeAndConfirm(){return {ok:false,code:'RESTORE_NOT_IMPLEMENTED'};}
 return {inspect,recordSummary,preflight,buildBundle,stage,readStage,mergeIntoCurrent,mergeAndConfirm};
});
