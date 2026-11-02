/* Fixed FIX15 reading restore into an isolated, initially empty profile only.
 * This is a candidate primitive, not a production UI or in-place rollback. */
(function(root,factory){'use strict';const api=factory();if(typeof module!=='undefined'&&module.exports)module.exports=api;if(root)root.Fix15FreshRestore=api;})(typeof globalThis==='undefined'?null:globalThis,function(){
 'use strict';
 const MATH='tianle_amc8_question_design_v1';
 const ACADEMY='tianle_academy_v5_prototype';
 const KEY=MATH+'_reading_r1';
 const STAGE=KEY+'_fixed15_restore_archive_v1';
 const OLD_HASH='caf6da5a174e84c77412909b259c9eea972f6e72a15a0a91649d940d6eb7fcdf';
 const NEW_HASH='71e53b7035d8a7a415473ffe204e95095ec9cb1b7004d75f9c41bb59dd418325';
 const LIMIT=16000000;
 function parseRecord(raw,expected){
  if(typeof raw!=='string'||raw.length>LIMIT)return null;
  try{const x=JSON.parse(raw);if(!x||typeof x!=='object'||Array.isArray(x)||x.schema!==1||x.contentHash!==expected||!Array.isArray(x.events)||!Object.prototype.hasOwnProperty.call(x,'session'))return null;return x;}catch(_){return null;}
 }
 async function prepareRecords({exportText,currentRaw,mathRaw,oldData,oldEngine}){
  if(!(mathRaw===null||typeof mathRaw==='string'&&mathRaw.length<=LIMIT))return {ok:false,code:'INVALID_MATH_RECORD'};
  if(typeof exportText!=='string'||exportText.length>LIMIT||!parseRecord(currentRaw,NEW_HASH))return {ok:false,code:'INVALID_CURRENT_RECORD'};
  let doc;try{doc=JSON.parse(exportText);}catch(_){return {ok:false,code:'INVALID_EXPORT'};}
  // Retain the entire unified export as an opaque exact string: it can carry
  // unsaved task drafts and additional profiles not represented by the two
  // live keys. A reading-only export is insufficient for complete recovery.
  if(doc?.format!=='tianle-record-backup-v1')return {ok:false,code:'UNIFIED_EXPORT_REQUIRED'};
  if(!(doc.academyRecord===null||typeof doc.academyRecord==='string'&&doc.academyRecord.length<=LIMIT))return {ok:false,code:'INVALID_ACADEMY_RECORD'};
  const backups=doc.backups??{};
  if(!backups||typeof backups!=='object'||Array.isArray(backups))return {ok:false,code:'INVALID_MATH_BACKUPS'};
  const backupEntries=Object.entries(backups);
  if(backupEntries.length>1000||backupEntries.some(([k,v])=>!k.startsWith(MATH+'_backup_')||k.length>512||typeof v!=='string'||v.length>LIMIT))return {ok:false,code:'INVALID_MATH_BACKUPS'};
  const protection=doc.readingProtection;
  if(!protection||protection.upgradeOriginalReadable!==true||!parseRecord(protection.upgradeOriginal,OLD_HASH))return {ok:false,code:'MISSING_EXACT_FIX15_RECORD'};
  if(!oldData||oldData.contentHash!==OLD_HASH||typeof oldEngine?.create!=='function')return {ok:false,code:'WRONG_FIX15_ENGINE_OR_DATA'};
  const oldRaw=protection.upgradeOriginal;
  let digest;try{const bytes=new TextEncoder().encode(oldRaw),result=await globalThis.crypto.subtle.digest('SHA-256',bytes);digest=Array.from(new Uint8Array(result),b=>b.toString(16).padStart(2,'0')).join('');}catch(_){return {ok:false,code:'DIGEST_UNAVAILABLE'};}
  const current=JSON.parse(currentRaw),upgrade=[...current.events].reverse().find(e=>e.type==='content_upgrade'&&e.toContentHash===NEW_HASH);
  if(!upgrade||upgrade.fromContentHash!==OLD_HASH||upgrade.backupKey!==KEY+'_backup_before_content_'+digest)return {ok:false,code:'ORIGINAL_DOES_NOT_MATCH_CURRENT_UPGRADE'};
  // A scratch-only copy: no production key is passed to the validating engine.
  const values=new Map([['isolated-validation',oldRaw]]),scratch={getItem:k=>values.has(k)?values.get(k):null,setItem:(k,v)=>values.set(k,String(v)),removeItem:k=>values.delete(k)};
  try{
   const e=oldEngine.create(oldData,scratch,'isolated-validation');
   if(e.status().status!=='ready'||scratch.getItem('isolated-validation')!==oldRaw)return {ok:false,code:'FIX15_ENGINE_REJECTED_RECORD'};
   const original=JSON.parse(oldRaw),snapshot=e.snapshot();
   for(const k of ['events','suspendedSessions','legacy'])if(JSON.stringify(original[k]??[])!==JSON.stringify(snapshot[k]??[]))return {ok:false,code:'FIX15_ENGINE_CHANGED_HISTORY_OR_DRAFT'};
   const sourceSession=original.session&&{...original.session},loadedSession=snapshot.session&&{...snapshot.session};
   if(sourceSession&&loadedSession){delete sourceSession.paused;delete sourceSession.lastTick;delete loadedSession.paused;delete loadedSession.lastTick;}
   if(JSON.stringify(sourceSession)!==JSON.stringify(loadedSession))return {ok:false,code:'FIX15_ENGINE_CHANGED_HISTORY_OR_DRAFT'};
  }catch(_){return {ok:false,code:'FIX15_ENGINE_REJECTED_RECORD'};}
  const academyRaw=doc.academyRecord;
  const archive=JSON.stringify({schema:'tianle-fix15-isolated-restore-v1',targetContentHash:OLD_HASH,sourceContentHash:NEW_HASH,oldRaw,currentRaw,mathRaw,academyRaw,backups,exportText});
  if(archive.length>LIMIT)return {ok:false,code:'ARCHIVE_TOO_LARGE'};
  return {ok:true,archive};
 }
 async function prepare({exportText,sourceStorage,oldData,oldEngine}){
  if(!sourceStorage||typeof sourceStorage.getItem!=='function')return {ok:false,code:'SOURCE_STORAGE_UNAVAILABLE'};
  let currentRaw,mathRaw;try{currentRaw=sourceStorage.getItem(KEY);mathRaw=sourceStorage.getItem(MATH)}catch(_){return {ok:false,code:'SOURCE_STORAGE_UNAVAILABLE'};}
  const result=await prepareRecords({exportText,currentRaw,mathRaw,oldData,oldEngine});
  try{if(sourceStorage.getItem(KEY)!==currentRaw||sourceStorage.getItem(MATH)!==mathRaw)return {ok:false,code:'SOURCE_CHANGED_DURING_PREPARATION'};}catch(_){return {ok:false,code:'SOURCE_STORAGE_UNAVAILABLE'};}
  return result;
 }
 async function restoreFresh({storage,locks,archive,confirmedFreshProfile,oldData,oldEngine}){
  if(confirmedFreshProfile!==true)return {ok:false,code:'FRESH_PROFILE_CONFIRMATION_REQUIRED'};
  if(!locks||typeof locks.request!=='function'||!storage||typeof storage.getItem!=='function'||typeof storage.setItem!=='function'||typeof storage.length!=='number')return {ok:false,code:'LOCK_OR_STORAGE_UNAVAILABLE'};
  if(typeof archive!=='string'||archive.length>LIMIT)return {ok:false,code:'INVALID_ARCHIVE'};
  let record;try{record=JSON.parse(archive);}catch(_){return {ok:false,code:'INVALID_ARCHIVE'};}
  if(record?.schema!=='tianle-fix15-isolated-restore-v1'||record.targetContentHash!==OLD_HASH||record.sourceContentHash!==NEW_HASH)return {ok:false,code:'INVALID_ARCHIVE'};
  // Revalidate both exact records, archive and real FIX15 engine at the boundary.
  const proof=await prepareRecords({exportText:record.exportText,currentRaw:record.currentRaw,mathRaw:record.mathRaw,oldData,oldEngine});
  if(!proof.ok||proof.archive!==archive)return {ok:false,code:'INVALID_ARCHIVE'};
  try{return await locks.request('amc8-writer:'+KEY,{mode:'exclusive',ifAvailable:true},async lock=>{
   if(!lock)return {ok:false,code:'LOCK_BUSY'};
   try{
    // An old or unrelated live origin is never accepted for replacement.
    if(storage.length!==0||storage.getItem(KEY)!==null||storage.getItem(STAGE)!==null)return {ok:false,code:'PROFILE_NOT_EMPTY'};
    storage.setItem(STAGE,archive);
    if(storage.getItem(STAGE)!==archive||storage.getItem(KEY)!==null||storage.length!==1)return {ok:false,code:'STAGE_NOT_CONFIRMED'};
    storage.setItem(KEY,record.oldRaw);
    if(record.mathRaw!==null)storage.setItem(MATH,record.mathRaw);
    if(record.academyRaw!==null)storage.setItem(ACADEMY,record.academyRaw);
    for(const [key,value] of Object.entries(record.backups))storage.setItem(key,value);
    if(storage.getItem(KEY)!==record.oldRaw||storage.getItem(MATH)!==record.mathRaw||storage.getItem(ACADEMY)!==record.academyRaw||storage.getItem(STAGE)!==archive)return {ok:false,code:'RESTORE_NOT_CONFIRMED'};
    for(const [key,value] of Object.entries(record.backups))if(storage.getItem(key)!==value)return {ok:false,code:'RESTORE_NOT_CONFIRMED'};
    return {ok:true,code:'ISOLATED_RECORD_RESTORED',software:'FIX15',separateNewRawPreserved:true,mathematicsRawPreserved:true};
   }catch(_){return {ok:false,code:'STORAGE_WRITE_OR_READ_FAILED'};}
  });}catch(_){return {ok:false,code:'LOCK_FAILED'};}
 }
 return {KEY,MATH,ACADEMY,STAGE,OLD_HASH,NEW_HASH,prepare,restoreFresh};
});
