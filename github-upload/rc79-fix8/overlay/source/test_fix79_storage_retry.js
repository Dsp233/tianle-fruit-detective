'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const tick=()=>new Promise(resolve=>setImmediate(resolve));
function makeStorage(){const values={record:'{"first":"wrong"}'};return {values,getItem:key=>Object.hasOwn(values,key)?values[key]:null,setItem:(key,value)=>{values[key]=value}}}
async function run(){
 let held=false;
 const storage=makeStorage();
 const ctx={module:{exports:{}},localStorage:storage,Promise,navigator:{locks:{request:async(name,options,fn)=>{
  if(held)return fn(null);held=true;try{return await fn({name})}finally{held=false}
 }}}};
 vm.runInNewContext(fs.readFileSync(__dirname+'/progress_store.js','utf8'),ctx);
 const P=ctx.module.exports,first=P.open('record',{storage}),second=P.open('record',{storage});
 await tick();assert.equal(first.getStatus(),'ready');assert.equal(second.getStatus(),'read_only');
 first.close();await tick();
 assert.equal(second.retry().reason,'ACQUIRING');await tick();assert.equal(second.getStatus(),'ready');
 assert(second.commit({first:'wrong',next:'right'},storage.values.record).ok);second.close();await tick();
 assert.deepEqual(JSON.parse(storage.values.record),{first:'wrong',next:'right'});
 const third=P.open('record',{storage}),fourth=P.open('record',{storage});await tick();
 assert.equal(fourth.getStatus(),'read_only');
 const original=storage.values.record;
 assert.equal(fourth.commit({...JSON.parse(original),draft:'not discarded'},original).reason,'NOT_WRITER');
 assert.equal(JSON.parse(fourth.exportSnapshot().pending).draft,'not discarded');
 third.close();await tick();assert.equal(fourth.retry().reason,'ACQUIRING');await tick();
 assert.equal(fourth.getStatus(),'ready');assert.equal(fourth.exportSnapshot().pending,null);
 assert.deepEqual(JSON.parse(storage.values.record),{first:'wrong',next:'right',draft:'not discarded'});fourth.close();await tick();

 // Another page's newer record must never be replaced by the waiting draft.
 const owner=P.open('record',{storage}),stale=P.open('record',{storage});await tick();
 const baseline=storage.values.record;
 assert.equal(stale.commit({...JSON.parse(baseline),staleDraft:'keep for export'},baseline).reason,'NOT_WRITER');
 assert(owner.commit({...JSON.parse(baseline),ownerChange:'preserved'},baseline).ok);owner.close();await tick();
 assert.equal(stale.retry().reason,'CONFLICT');assert.equal(stale.getStatus(),'conflict');
 assert.equal(JSON.parse(stale.exportSnapshot().pending).staleDraft,'keep for export');
 assert.equal(JSON.parse(storage.values.record).ownerChange,'preserved');stale.close();await tick();

 // The lock remains held after a temporary quota error: retry should flush
 // the retained draft once storage becomes writable again.
 const quotaValues={record:'{"first":"wrong"}'},quota={fail:false,getItem:k=>quotaValues[k]??null,setItem(k,v){if(this.fail)throw Error('QuotaExceededError');quotaValues[k]=v;}};
 const quotaWriter=P.open('record',{storage:quota});await tick();quota.fail=true;
 assert.equal(quotaWriter.commit({first:'wrong',next:'right'},quotaValues.record).reason,'QUOTA');
 assert.equal(quotaWriter.getStatus(),'unsaved');assert.equal(JSON.parse(quotaWriter.exportSnapshot().pending).next,'right');
 quota.fail=false;assert.equal(quotaWriter.retry().ok,true);assert.equal(quotaWriter.getStatus(),'ready');
 assert.deepEqual(JSON.parse(quotaValues.record),{first:'wrong',next:'right'});quotaWriter.close();
 console.log(JSON.stringify({result:'PASS',scope:'synthetic lock adapter',retryAfterOwnerCloses:true,pendingDraftSavedWhenBaselineUnchanged:true,conflictingDraftExportable:true,quotaRecovery:true,nativeMultiTab:'NOT_RUN',fallbackStaleOwnerRecovery:'NOT_IMPLEMENTED'}));
}
run().catch(error=>{console.error(error);process.exitCode=1});
