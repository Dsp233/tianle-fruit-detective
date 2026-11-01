'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const api=require('./fix15_fresh_restore');
const ctx={window:{__AMC8_STORAGE_TEST:true},console,Math,Date};vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(__dirname,'../restored-workpackage/safety-work/baseline/source/reading_data.js'),'utf8'),ctx);
vm.runInContext(fs.readFileSync(path.join(__dirname,'fix15-reading-engine.js'),'utf8'),ctx);
const data=ctx.window.__AMC8_READING_DATA,engine=ctx.window.ReadingEngine;
function mem(initial={}){const m=new Map(Object.entries(initial));return {get length(){return m.size},getItem:k=>m.has(k)?m.get(k):null,setItem:(k,v)=>m.set(k,String(v)),removeItem:k=>m.delete(k),data:m};}
const oldStore=mem(),old=engine.create(data,oldStore,'fixture',()=>2000000000000);assert(old.startDay(1));
const q=old.current().question;let wrong=q.type==='order'?[...q.answer].reverse():(q.answer+1)%q.options.length;
const first=old.submit(wrong);assert(first.first&&!first.correct);assert(old.select(q.answer));
let oldRaw=oldStore.getItem('fixture');const oldObj=JSON.parse(oldRaw);oldObj.legacy.push({raw:'archive-without-digest'});oldRaw=JSON.stringify(oldObj,null,1);
const newObj=JSON.parse(oldRaw);newObj.contentHash=api.NEW_HASH;const digest=require('node:crypto').createHash('sha256').update(oldRaw).digest('hex');newObj.events.push({id:'new-event',type:'content_upgrade',fromContentHash:api.OLD_HASH,toContentHash:api.NEW_HASH,backupKey:api.KEY+'_backup_before_content_'+digest});const currentRaw=JSON.stringify(newObj,null,2);
const exportText=JSON.stringify({format:'tianle-record-backup-v1',readingProtection:{upgradeOriginalReadable:true,upgradeOriginal:oldRaw},academyRecord:'{"synthetic":"profile"}',currentTaskDraft:{synthetic:'unpersisted'}});
const mathRaw=JSON.stringify({synthetic:true,draft:'3+4'});
const args={exportText,sourceStorage:mem({[api.KEY]:currentRaw,[api.MATH]:mathRaw}),oldData:data,oldEngine:engine};
function locks(busy=false){let held=false;return {request:async(name,options,fn)=>{assert.equal(name,'amc8-writer:'+api.KEY);if(busy||held)return fn(null);held=true;try{return await fn({name})}finally{held=false}}};}
(async()=>{
 const prepared=await api.prepare(args);assert(prepared.ok,prepared.code);
 assert.equal((await api.prepare({...args,exportText:'{}'})).code,'UNIFIED_EXPORT_REQUIRED');
 assert.equal((await api.prepare({...args,exportText:JSON.stringify({format:'tianle-record-backup-v1'})})).code,'MISSING_EXACT_FIX15_RECORD');
 assert.equal((await api.prepare({...args,sourceStorage:mem({[api.KEY]:oldRaw})})).code,'INVALID_CURRENT_RECORD');
 assert.equal((await api.prepare({...args,oldData:{contentHash:'wrong'}})).code,'WRONG_FIX15_ENGINE_OR_DATA');
 const wrongBinding=JSON.parse(currentRaw);wrongBinding.events.at(-1).backupKey=api.KEY+'_backup_before_content_'+'0'.repeat(64);
 assert.equal((await api.prepare({...args,sourceStorage:mem({[api.KEY]:JSON.stringify(wrongBinding)})})).code,'ORIGINAL_DOES_NOT_MATCH_CURRENT_UPGRADE');
 let reads=0;const changing={getItem(k){if(k===api.MATH)return mathRaw;return ++reads===1?currentRaw:oldRaw}};
 assert.equal((await api.prepare({...args,sourceStorage:changing})).code,'SOURCE_CHANGED_DURING_PREPARATION');

 const fresh=mem(),input={storage:fresh,locks:locks(),archive:prepared.archive,confirmedFreshProfile:true,oldData:data,oldEngine:engine};
 assert.equal((await api.restoreFresh({...input,confirmedFreshProfile:false})).code,'FRESH_PROFILE_CONFIRMATION_REQUIRED');
 assert.equal((await api.restoreFresh({...input,locks:null})).code,'LOCK_OR_STORAGE_UNAVAILABLE');
 assert.equal((await api.restoreFresh({...input,locks:locks(true)})).code,'LOCK_BUSY');assert.equal(fresh.length,0);
 let result=await api.restoreFresh(input);assert(result.ok,result.code);assert.equal(fresh.getItem(api.KEY),oldRaw);
 const archive=JSON.parse(fresh.getItem(api.STAGE));assert.equal(archive.currentRaw,currentRaw);assert.equal(archive.oldRaw,oldRaw);assert.equal(archive.mathRaw,mathRaw);assert.equal(archive.exportText,exportText);assert.equal(fresh.getItem(api.MATH),mathRaw);
 assert.equal((await api.restoreFresh(input)).code,'PROFILE_NOT_EMPTY');
 const reopen=engine.create(data,fresh,api.KEY,()=>2000000000000);assert.equal(reopen.status().status,'ready');assert.equal(reopen.attempts(q.id)[0].correct,false);assert.equal(JSON.stringify(reopen.snapshot().session.drafts),JSON.stringify(oldObj.session.drafts));assert.equal(reopen.snapshot().legacy[0].raw,'archive-without-digest');
 const other=mem({unrelated:'do-not-touch'});assert.equal((await api.restoreFresh({...input,storage:other})).code,'PROFILE_NOT_EMPTY');assert.equal(other.getItem('unrelated'),'do-not-touch');
 const quota=mem();quota.setItem=()=>{throw Error('quota')};assert.equal((await api.restoreFresh({...input,storage:quota})).code,'STORAGE_WRITE_OR_READ_FAILED');assert.equal(quota.getItem(api.KEY),null);
 const failMain=mem();const set=failMain.setItem;failMain.setItem=(k,v)=>{if(k===api.KEY)throw Error('quota');set(k,v)};assert.equal((await api.restoreFresh({...input,storage:failMain})).code,'STORAGE_WRITE_OR_READ_FAILED');assert.equal(failMain.getItem(api.KEY),null);assert.equal(JSON.parse(failMain.getItem(api.STAGE)).currentRaw,currentRaw);
 const concurrentStorage=mem(),sharedLocks=locks(),sameInput={...input,storage:concurrentStorage,locks:sharedLocks};
 const concurrent=await Promise.all([api.restoreFresh(sameInput),api.restoreFresh(sameInput)]);
 assert.equal(concurrent.filter(x=>x.ok).length,1);assert(['LOCK_BUSY','PROFILE_NOT_EMPTY'].includes(concurrent.find(x=>!x.ok).code));
 assert.equal(concurrentStorage.getItem(api.KEY),oldRaw);assert.equal(JSON.parse(concurrentStorage.getItem(api.STAGE)).currentRaw,currentRaw);assert.equal(concurrentStorage.getItem(api.MATH),mathRaw);
 const tampered=JSON.parse(prepared.archive);tampered.oldRaw='{}';const empty=mem();assert.equal((await api.restoreFresh({...input,storage:empty,archive:JSON.stringify(tampered)})).code,'INVALID_ARCHIVE');assert.equal(empty.length,0);
 console.log(JSON.stringify({result:'PASS_SYNTHETIC_ISOLATED_ONLY',oldRecordExact:true,newRecordArchivedExact:true,oldEngineRead:true,wrongFirstDraftAndUndigestedArchivePreserved:true,emptyProfileRequired:true,locked:true,quotaFailsClosed:true,productionOrDevice:'NOT_TESTED'}));
})().catch(e=>{console.error(e);process.exitCode=1});
