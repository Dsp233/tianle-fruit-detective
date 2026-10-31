'use strict';
// Synthetic records and an asynchronous IndexedDB simulator only.
const assert=require('node:assert/strict');
const crypto=require('node:crypto');
const Recovery=require('./reading_recovery');
const ProgressStore=require(process.env.READING_STORE_PATH||'./production_progress_store');

function database(){
 const records=new Map(),queue=[];let active=false,initialized=false,failPut=false;
 function pump(){if(active||!queue.length)return;active=true;const {tx,req}=queue.shift();setImmediate(()=>{
  if(tx.aborted){active=false;tx.onabort?.();pump();return;}
  req.result=records.get(tx.key);req.onsuccess?.();
  if(failPut&&tx.putValue){failPut=false;tx.aborted=true;}
  if(tx.aborted)tx.onabort?.();else{if(tx.putValue)records.set(tx.key,tx.putValue);tx.oncomplete?.();}
  active=false;pump();
 });}
 const db={objectStoreNames:{contains:()=>initialized},createObjectStore(){initialized=true;},close(){},transaction(){
  const tx={abort(){this.aborted=true;},objectStore(){return {get(key){tx.key=key;const req={};queue.push({tx,req});pump();return req;},put(value){tx.putValue=value;}};}};return tx;
 }};
 return {records,failNextPut(){failPut=true;},open(){const request={};setImmediate(()=>{request.result=db;if(!initialized)request.onupgradeneeded?.();request.onsuccess?.();});return request;}};
}
function storage(seed={}){const map=new Map(Object.entries(seed));return {map,failStage:false,failRead:false,getItem(k){if(this.failRead)throw Error('read');return map.has(k)?map.get(k):null;},setItem(k,v){if(this.failStage&&k.includes('_recovery_stage_'))throw Error('quota');map.set(k,String(v));}};}
const key='tianle_amc8_question_design_v1_reading_r1',mathKey='tianle_amc8_question_design_v1',hash='synthetic-content-v1';
function record(events=[],legacy=[],session=null){return {schema:1,contentHash:hash,revision:3,createdAt:1,settings:{pinyin:'all',rate:.85,remoteVoiceConsent:false,knownMath:[]},events,session,suspendedSessions:[],legacy};}
const raw=JSON.stringify(record([{id:'first',type:'attempt',at:1,selected:0,correct:false,first:true}]),null,2);
const candidateRaw=JSON.stringify(record([{id:'candidate',type:'attempt',at:2,selected:1,correct:true,first:true}],[{schema:'amc8-reading-content-upgrade-session-archive',sessions:[{id:'old-draft'}]}]));
const candidate={raw:candidateRaw,sources:['upgradeOriginal'],exactRaw:true};
const mathRaw='{"attempts":[{"first":false,"selected":"kept"}]}';
const checks=[];
async function check(name,fn){await fn();checks.push(name);}
function sameMap(storage,before){assert.deepEqual([...storage.map.entries()],before);}
const args=(s,db)=>({storage:s,progressStore:ProgressStore,readingKey:key,expectedRaw:raw,candidate,currentContentHash:hash,indexedDB:db,timeoutMs:1000});

(async()=>{
 await check('FIX15 export formats and exact raw candidates',()=>{
  const snapshot=JSON.parse(candidateRaw),exactOriginal=JSON.stringify(snapshot,null,2),source=JSON.stringify({schema:'amc8-reading-r1-backup',reading:snapshot,upgradeOriginal:exactOriginal,baselineStoredRecord:raw,upgradeOriginalReadable:false,currentStoredReadable:false});
  const result=Recovery.inspect(source,{currentContentHash:hash});
  assert.equal(result.ok,true);assert.equal(result.format,'reading');
  assert.equal(result.candidates.length,3);
  assert.equal(result.candidates.find(c=>c.sources.includes('upgradeOriginal')).raw,exactOriginal);
  assert.equal(result.candidates.find(c=>c.sources.includes('readingSnapshot')).exactRaw,false);
  assert.deepEqual(result.warnings,['UPGRADE_ORIGINAL_UNREADABLE_OR_MISSING','CURRENT_STORED_RECORD_UNREADABLE']);
  const unified=Recovery.inspect(JSON.stringify({format:'tianle-record-backup-v1',reading:snapshot,readingProtection:{upgradeOriginal:raw},record:{math:'must be ignored'}}),{currentContentHash:hash});
  assert.equal(unified.format,'unified');assert.equal(unified.candidates[0].raw,raw);
  assert.equal(Recovery.inspect('not json').code,'BACKUP_INVALID_JSON');
  assert.equal(Recovery.inspect('{"schema":"amc8-reading-r1-backup","reading":{"__proto__":{"x":1}}}').code,'BACKUP_UNSAFE_STRUCTURE');
  assert.equal(Recovery.recordSummary(JSON.stringify(record([{id:'x',type:'a'},{id:'x',type:'b'}]))).reason,'INVALID_OR_DUPLICATE_EVENT');
 });
 await check('preflight is read-only and reports data that FIX15 would omit',()=>{
  const s=storage({[key]:raw,[mathKey]:mathRaw}),before=[...s.map.entries()];
  const result=Recovery.preflight({storage:s,readingKey:key,candidate,currentContentHash:hash});
  assert.equal(result.ok,true);assert.equal(result.baselineRaw,raw);
  assert.equal(result.legacyWithoutDigestCount,1);
  assert(result.warnings.includes('LEGACY_ARCHIVES_REQUIRE_SPECIAL_HANDLING'));
  assert.equal(result.restorationSupported,false);sameMap(s,before);
  const conflict=JSON.stringify(record([{id:'first',type:'attempt',at:1,selected:2,correct:false,first:true}]));
  assert.equal(Recovery.preflight({storage:s,readingKey:key,candidate:{raw:conflict},currentContentHash:hash}).eventIdConflictCount,1);
  const active=storage({[key]:JSON.stringify(record([],[],{id:'draft-1',drafts:{q:0}}))});
  const otherDraft={raw:JSON.stringify(record([],[],{id:'draft-1',drafts:{q:1}}))};
  const draftReview=Recovery.preflight({storage:active,readingKey:key,candidate:otherDraft,currentContentHash:hash});
  assert.equal(draftReview.sessionIdOverlapCount,1);assert(draftReview.warnings.includes('SESSION_ID_OVERLAP_REQUIRES_REVIEW'));
  assert.equal(Recovery.preflight({storage:s,readingKey:mathKey,candidate,currentContentHash:hash}).code,'INVALID_ARGUMENT');
  s.failRead=true;assert.equal(Recovery.preflight({storage:s,readingKey:key,candidate,currentContentHash:hash}).code,'STORAGE_UNAVAILABLE');s.failRead=false;sameMap(s,before);
 });
 await check('staging contains exact current and candidate reading records without touching mathematics',async()=>{
  const s=storage({[key]:raw,[mathKey]:mathRaw}),db=database(),result=await Recovery.stage(args(s,db));
  assert.equal(result.ok,true);assert.equal(result.code,'STAGED_ONLY');
  assert.equal(s.getItem(key),raw);assert.equal(s.getItem(mathKey),mathRaw);
  assert.equal(result.stageKey,key+'_recovery_stage_'+crypto.createHash('sha256').update(s.getItem(result.stageKey)).digest('hex'));
  const staged=Recovery.readStage({storage:s,progressStore:ProgressStore,readingKey:key,stageKey:result.stageKey});
  assert.equal(staged.bundle.baselineRaw,raw);assert.equal(staged.bundle.candidateRaw,candidateRaw);
  const again=await Recovery.stage(args(s,db));assert.equal(again.ok,true);assert.equal(again.stageKey,result.stageKey);
  assert.equal(s.getItem(key),raw);assert.equal(s.getItem(mathKey),mathRaw);
  s.setItem(result.stageKey,'{"modified":true}');
  assert.equal(Recovery.readStage({storage:s,progressStore:ProgressStore,readingKey:key,stageKey:result.stageKey}).code,'STAGE_DIGEST_MISMATCH');
 });
 await check('baseline change before or during transaction blocks staging',async()=>{
  const s=storage({[key]:raw,[mathKey]:mathRaw}),db=database(),newRaw=JSON.stringify(record([{id:'concurrent',type:'note',at:3}]));
  s.setItem(key,newRaw);let r=await Recovery.stage(args(s,db));assert.equal(r.code,'BASELINE_CHANGED');assert.equal(s.getItem(mathKey),mathRaw);
  s.setItem(key,raw);const pending=Recovery.stage(args(s,db));s.setItem(key,newRaw);r=await pending;
  assert.equal(r.ok,false);assert(['STAGE_NOT_CONFIRMED','BASELINE_CHANGED'].includes(r.code));assert.equal(s.getItem(key),newRaw);
  assert.equal(s.getItem(mathKey),mathRaw);assert.equal([...s.map.keys()].filter(k=>k.includes('_recovery_stage_')).length,0);
 });
 await check('simultaneous independent stages are serialized and retain both candidates',async()=>{
  const s=storage({[key]:raw,[mathKey]:mathRaw}),db=database(),otherCandidate={raw:JSON.stringify(record([{id:'other',type:'note',at:4}])),sources:['readingSnapshot'],exactRaw:false};
  const [a,b]=await Promise.all([Recovery.stage(args(s,db)),Recovery.stage({...args(s,db),candidate:otherCandidate})]);
  assert.equal(a.ok,true);assert.equal(b.ok,true);assert.notEqual(a.stageKey,b.stageKey);
  const x=Recovery.readStage({storage:s,progressStore:ProgressStore,readingKey:key,stageKey:a.stageKey});
  const y=Recovery.readStage({storage:s,progressStore:ProgressStore,readingKey:key,stageKey:b.stageKey});
  assert.equal(x.bundle.baselineRaw,raw);assert.equal(y.bundle.baselineRaw,raw);
  assert.equal(x.bundle.candidateRaw,candidateRaw);assert.equal(y.bundle.candidateRaw,otherCandidate.raw);
  assert.equal(s.getItem(key),raw);assert.equal(s.getItem(mathKey),mathRaw);
 });
 await check('quota, unavailable storage, unavailable lock and stage collision never overwrite originals',async()=>{
  for(const mode of ['quota','lock','collision','read']){
   const s=storage({[key]:raw,[mathKey]:mathRaw}),db=database();let cfg=args(s,db);
   if(mode==='quota')s.failStage=true;
   if(mode==='lock')cfg.indexedDB=null;
   if(mode==='read')s.failRead=true;
   if(mode==='collision'){const bad={...ProgressStore,digest:()=>('f'.repeat(64))};cfg.progressStore=bad;s.setItem(key+'_recovery_stage_'+'f'.repeat(64),'already different');}
   const before=[...s.map.entries()],r=await Recovery.stage(cfg);
   assert.equal(r.ok,false,mode);assert(['STAGE_NOT_CONFIRMED','STORAGE_UNAVAILABLE','STAGE_KEY_COLLISION'].includes(r.code),mode+': '+r.code);
   s.failRead=false;sameMap(s,before);assert.equal(s.getItem(key),raw);assert.equal(s.getItem(mathKey),mathRaw);
  }
 });
 await check('old lifetime claim and failed protocol transition remain protected',async()=>{
  const s=storage({[key]:raw,[mathKey]:mathRaw}),db=database();db.records.set(key,{owner:'unreleased-old-writer'});
  let r=await Recovery.stage(args(s,db));assert.equal(r.ok,false);assert.equal(r.status,'read_only');assert.equal(s.getItem(key),raw);assert.equal(s.getItem(mathKey),mathRaw);
  const db2=database();db2.failNextPut();r=await Recovery.stage(args(s,db2));assert.equal(r.ok,false);assert.equal(r.status,'read_only');assert.equal(s.getItem(key),raw);assert.equal(s.getItem(mathKey),mathRaw);
 });
 await check('all restore entry points fail closed without calling engine or writing storage',async()=>{
  const s=storage({[key]:raw,[mathKey]:mathRaw}),before=[...s.map.entries()];let calls=0;
  const testArgs={storage:s,readingKey:key,engine:{importBackup(){calls++;return {ok:true};}}};
  assert.equal(Recovery.mergeIntoCurrent(testArgs).code,'RESTORE_NOT_IMPLEMENTED');
  assert.equal((await Recovery.mergeAndConfirm(testArgs)).code,'RESTORE_NOT_IMPLEMENTED');
  assert.equal(calls,0);sameMap(s,before);
 });
 console.log(JSON.stringify({result:'PASS',checks:checks.length,passed:checks,scope:'synthetic records and simulated asynchronous IndexedDB; no production integration or physical-device validation'}));
})().catch(error=>{console.error(error.stack||error);process.exitCode=1;});
