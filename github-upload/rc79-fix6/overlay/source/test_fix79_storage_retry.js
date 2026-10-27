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
 assert.equal(fourth.commit({draft:'not discarded'},original).reason,'NOT_WRITER');
 third.close();await tick();assert.equal(fourth.retry().reason,'PENDING_DRAFT');
 assert.equal(JSON.parse(fourth.exportSnapshot().pending).draft,'not discarded');
 assert.equal(storage.values.record,original);fourth.close();
 console.log(JSON.stringify({result:'PASS',scope:'synthetic lock adapter',retryAfterOwnerCloses:true,pendingDraftNotOverwritten:true,nativeMultiTab:'NOT_RUN'}));
}
run().catch(error=>{console.error(error);process.exitCode=1});
