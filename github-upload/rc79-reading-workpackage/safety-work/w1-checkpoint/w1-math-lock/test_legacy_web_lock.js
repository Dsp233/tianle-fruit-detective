'use strict';
// Synthetic mixed-version compatibility; browser/physical device still required.
const assert=require('node:assert/strict'),fs=require('node:fs');
let held=false;
Object.defineProperty(globalThis,'navigator',{configurable:true,value:{locks:{request(name,options,callback){
 if(held)return Promise.resolve(callback(null));
 held=true;return Promise.resolve(callback({name})).finally(()=>{held=false});
}}}});
const {open}=require('./overlay/source/progress_store');
const helper=fs.readFileSync(__dirname+'/test_transaction_store.js','utf8');
const first=helper.indexOf('function database(){'),last=helper.indexOf('(async()=>{',first);
const {database,memory,wait}=new Function('setImmediate','setTimeout',helper.slice(first,last)+';return {database,memory,wait};')(setImmediate,setTimeout);
(async()=>{
 const idb=database(),storage=memory(),key='mixed-math';
 const old=open(key,{storage,indexedDB:idb});await wait(()=>old.getStatus()==='ready');
 assert.equal(old.commit({first:'preserved'},null).ok,true);
 const current=open(key,{storage,indexedDB:idb,transactional:true,guardWebLock:true});
 await wait(()=>current.getStatus()==='read_only');
 assert.equal(storage.getItem(key),'{"first":"preserved"}');
 const pending=current.commit({first:'preserved',second:'new'},storage.getItem(key));assert(pending.pending);
 old.close();await wait(()=>!held);current.retry();await wait(()=>current.getStatus()==='ready'&&current.exportSnapshot().pending===null);
 assert.deepEqual(JSON.parse(storage.getItem(key)),{first:'preserved',second:'new'});
 current.close();await wait(()=>!held);
 // An old writer that changes the baseline after a new page opens must force
 // a conflict rather than allow the new page's stale snapshot to overwrite it.
 const old2=open('changed',{storage,indexedDB:idb});await wait(()=>old2.getStatus()==='ready');
 const new2=open('changed',{storage,indexedDB:idb,transactional:true,guardWebLock:true});await wait(()=>new2.getStatus()==='read_only');
 assert(old2.commit({first:'old-writer'},null).ok);old2.close();await wait(()=>!held);
 new2.retry();await wait(()=>new2.getStatus()==='conflict');assert.equal(storage.getItem('changed'),'{"first":"old-writer"}');new2.close();
 console.log(JSON.stringify({result:'PASS',scope:'synthetic legacy Web Lock plus serialized IndexedDB; not a real browser',activeLegacyWriterProtected:true,successfulRetry:true,changedBaselineConflicts:true}));
})().catch(e=>{console.error(e);process.exitCode=1});
