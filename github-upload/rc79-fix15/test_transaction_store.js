'use strict';
const assert=require('node:assert/strict');
const {open}=require('./overlay/source/progress_store');

// A tiny asynchronous transaction scheduler. Browser coverage additionally
// uses the real IndexedDB and localStorage implementations.
function database(){
 const records=new Map(),queue=[];let active=false,initialized=false,failNextPut=false;
 const pump=()=>{if(active||!queue.length)return;active=true;const {tx,req}=queue.shift();setImmediate(()=>{
  if(tx.aborted){active=false;tx.onabort?.();pump();return;}
  req.result=records.get(tx.key);req.onsuccess?.();
  if(failNextPut&&tx.putValue){failNextPut=false;tx.aborted=true;}
  if(tx.aborted)tx.onabort?.();else{if(tx.putValue)records.set(tx.key,tx.putValue);tx.oncomplete?.();}
  active=false;pump();
 })};
 const db={objectStoreNames:{contains:()=>initialized},createObjectStore:()=>{initialized=true},close(){},transaction(){
  const tx={abort(){this.aborted=true},objectStore(){return {get(key){tx.key=key;const req={};queue.push({tx,req});pump();return req},put(v){tx.putValue=v}}}};return tx;
 }};
 return {records,failNextPut(){failNextPut=true},open(){const req={};setImmediate(()=>{req.result=db;if(!initialized)req.onupgradeneeded?.();req.onsuccess?.()});return req;}};
}
function memory(){const map=new Map();return {map,getItem:k=>map.has(k)?map.get(k):null,setItem(k,v){if(this.fail)throw Error('quota');map.set(k,String(v))}};}
async function wait(pred){for(let i=0;i<1000;i++){if(pred())return;await new Promise(r=>setTimeout(r,2));}throw Error('Timed out waiting for store');}
(async()=>{
 const idb=database(),storage=memory(),make=()=>open('case',{storage,indexedDB:idb,transactional:true});
 const a=make(),b=make();await wait(()=>a.getStatus()==='ready'&&b.getStatus()==='ready');
 a.commit({answer:'A'},null);b.commit({answer:'B'},null);
 await wait(()=>[a,b].some(x=>x.getStatus()==='conflict')&&[a,b].some(x=>x.getStatus()==='ready'));
 const winner=[a,b].find(x=>x.getStatus()==='ready'),loser=[a,b].find(x=>x.getStatus()==='conflict');
 assert.equal(JSON.parse(storage.getItem('case')).answer,JSON.parse(winner.exportSnapshot().stored).answer);
 assert.notEqual(JSON.parse(loser.exportSnapshot().pending).answer,JSON.parse(storage.getItem('case')).answer);
 // A new page can write even if the previous writer disappeared without close.
 const reopened=make();await wait(()=>reopened.getStatus()==='ready');const raw=storage.getItem('case');reopened.commit({answer:'C',previous:JSON.parse(raw).answer},raw);await wait(()=>JSON.parse(storage.getItem('case')).answer==='C');
 assert.equal(idb.records.get('case').protocol,2);
 // A pre-upgrade owner with no release marker is never silently taken over.
 idb.records.set('legacy',{owner:'live-or-crashed-owner'});storage.setItem('legacy','old');
 const legacy=open('legacy',{storage,indexedDB:idb,transactional:true});await wait(()=>legacy.getStatus()==='read_only');legacy.commit({draft:'kept'},'old');assert.equal(storage.getItem('legacy'),'old');
 storage.setItem('legacy_writer_released','live-or-crashed-owner');legacy.retry();await wait(()=>legacy.getStatus()==='ready'&&legacy.exportSnapshot().pending===null);assert.deepEqual(JSON.parse(storage.getItem('legacy')),{draft:'kept'});
 // A failed protocol migration cannot write localStorage first.
 idb.failNextPut();const stopped=open('migration',{storage,indexedDB:idb,transactional:true});stopped.commit({answer:1},null);await wait(()=>stopped.getStatus()==='read_only');assert.equal(storage.getItem('migration'),null);assert.deepEqual(JSON.parse(stopped.exportSnapshot().pending),{answer:1});
 stopped.retry();await wait(()=>stopped.getStatus()==='ready'&&stopped.exportSnapshot().pending===null);assert.deepEqual(JSON.parse(storage.getItem('migration')),{answer:1});
 // A write failure retains the draft for retry instead of clearing the record.
 const q=open('quota',{storage,indexedDB:idb,transactional:true});await wait(()=>q.getStatus()==='ready');storage.fail=true;q.commit({answer:'retained'},null);await wait(()=>q.getStatus()==='unsaved');assert.equal(storage.getItem('quota'),null);storage.fail=false;q.retry();await wait(()=>q.getStatus()==='ready'&&q.exportSnapshot().pending===null);assert.deepEqual(JSON.parse(storage.getItem('quota')),{answer:'retained'});
 const unavailable=open('no-idb',{storage,indexedDB:null,transactional:true});assert.equal(unavailable.getStatus(),'read_only');unavailable.commit({draft:1},null);assert.equal(storage.getItem('no-idb'),null);
 // Mathematics retains the previous synchronous fallback contract. A page
 // that has not released its old claim is not taken over by another writer.
 const math=open('math-fallback',{storage,indexedDB:idb});await wait(()=>math.getStatus()==='ready');assert.equal(math.commit({first:'original'},null).ok,true);
 const waiting=open('math-fallback',{storage,indexedDB:idb});await wait(()=>waiting.getStatus()==='read_only');assert.equal(storage.getItem('math-fallback'),'{"first":"original"}');math.close();waiting.retry();await wait(()=>waiting.getStatus()==='ready');
 const noisy=open('display-error',{storage,indexedDB:idb,transactional:true,onStatus(){throw Error('synthetic display error')}});await wait(()=>noisy.getStatus()==='ready');noisy.commit({saved:true},null);await wait(()=>noisy.exportSnapshot().pending===null&&storage.getItem('display-error')!==null);assert.deepEqual(JSON.parse(storage.getItem('display-error')),{saved:true});
 console.log(JSON.stringify({result:'PASS',concurrentCompareAndWrite:true,transactionalWriterReopen:true,unreleasedLegacyGuard:true,failedMigrationPreservesDraft:true,quotaRetry:true,unavailableReadOnly:true,mathFallbackRemainsSynchronous:true,indicatorErrorDoesNotAbortSave:true}));
})().catch(e=>{console.error(e);process.exitCode=1});
