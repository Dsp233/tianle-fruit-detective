'use strict';
// Real browser storage and locking against synthetic data. Never loads user records.
const {chromium,webkit}=require('playwright'),http=require('node:http'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const oldSource=fs.readFileSync(process.env.OLD_STORE,'utf8');
const newSource=fs.readFileSync(path.join(__dirname,'overlay/source/progress_store.js'),'utf8');
const key='w1-synthetic-math';
const server=http.createServer((req,res)=>{res.writeHead(200,{'Content-Type':'text/html','Cache-Control':'no-store'});res.end('<!doctype html><title>synthetic lock verification</title>')});
async function waitState(p,states){await p.waitForFunction(s=>s.includes(window.store.getStatus()),states,{timeout:20000});return p.evaluate(()=>window.store.getStatus());}
async function start(p,source,mode,disabled){
 await p.goto(`http://127.0.0.1:${server.address().port}/`);
 if(disabled)await p.evaluate(()=>Object.defineProperty(navigator,'locks',{value:undefined,configurable:true}));
 await p.addScriptTag({content:source});
 await p.evaluate(({key,mode})=>{window.store=window.__AMC8_ProgressStore.open(key,mode==='new'?{transactional:true,guardWebLock:true}:{});},{key,mode});
}
async function run(engine,name){
 const browser=await engine.launch({headless:true});
 try{
  for(const noWebLocks of [false,true]){
   const context=await browser.newContext(),old=await context.newPage(),candidate=await context.newPage();
   await start(old,oldSource,'old',noWebLocks);assert.equal(await waitState(old,['ready','read_only']),'ready');
   assert.equal(await old.evaluate(()=>window.store.commit({first:'old'},null).ok),true);
   await start(candidate,newSource,'new',noWebLocks);assert.equal(await waitState(candidate,['ready','read_only']),'read_only');
   assert.equal(await candidate.evaluate(k=>localStorage.getItem(k),key),'{"first":"old"}');
   await old.evaluate(()=>window.store.close());await old.close();
   await candidate.evaluate(()=>window.store.retry());assert.equal(await waitState(candidate,['ready','conflict']),'ready');
   await candidate.evaluate(()=>window.store.commit({first:'old',second:'new'},window.store.exportSnapshot().stored));
   await candidate.waitForFunction(k=>window.store.getStatus()==='ready'&&JSON.parse(localStorage.getItem(k)).second==='new',key,{timeout:20000});
   // An abrupt page shutdown must not leave a new permanent ownership claim.
   await candidate.close({runBeforeUnload:false});
   const reopened=await context.newPage();await start(reopened,newSource,'new',noWebLocks);
   assert.equal(await waitState(reopened,['ready','read_only','conflict']),'ready');
   assert.equal(await reopened.evaluate(k=>JSON.parse(localStorage.getItem(k)).first,key),'old');
   await reopened.close();await context.close();
   console.log(JSON.stringify({browser:name,noWebLocks,legacyLiveWriterProtected:true,releasedWriterRetry:true,abruptCloseReopen:true,priorRecordPreserved:true}));
   const conflictContext=await browser.newContext(),a=await conflictContext.newPage(),b=await conflictContext.newPage();
   await start(a,oldSource,'old',noWebLocks);assert.equal(await waitState(a,['ready','read_only']),'ready');
   await start(b,newSource,'new',noWebLocks);assert.equal(await waitState(b,['ready','read_only']),'read_only');
   assert.equal(await a.evaluate(()=>window.store.commit({first:'newer-old-page'},null).ok),true);
   await a.evaluate(()=>window.store.close());await a.close();await b.evaluate(()=>window.store.retry());
   assert.equal(await waitState(b,['ready','conflict']),'conflict');
   assert.equal(await b.evaluate(k=>localStorage.getItem(k),key),'{"first":"newer-old-page"}');
   await conflictContext.close();
   console.log(JSON.stringify({browser:name,noWebLocks,changedBaselineConflict:true,noOverwrite:true}));

   // Throw the same exception a full browser store can report, while keeping
   // real IndexedDB and Web Locks. This is injected, not real quota exhaustion.
   const quotaContext=await browser.newContext(),quotaPage=await quotaContext.newPage();
   await start(quotaPage,newSource,'new',noWebLocks);assert.equal(await waitState(quotaPage,['ready','read_only']),'ready');
   await quotaPage.evaluate(()=>window.store.commit({first:'retained'},null));
   await quotaPage.waitForFunction(k=>window.store.getStatus()==='ready'&&!!localStorage.getItem(k),key,{timeout:20000});
   await quotaPage.evaluate(k=>{const original=Storage.prototype.setItem;window.restoreSetItem=()=>{Storage.prototype.setItem=original};Storage.prototype.setItem=function(name,value){if(name===k)throw new DOMException('synthetic quota','QuotaExceededError');return original.call(this,name,value)}},key);
   await quotaPage.evaluate(()=>window.store.commit({first:'retained',second:'pending'},window.store.exportSnapshot().stored));
   assert.equal(await waitState(quotaPage,['unsaved','read_only']),'unsaved');
   const failed=await quotaPage.evaluate(k=>({disk:localStorage.getItem(k),snapshot:window.store.exportSnapshot()}),key);
   assert.deepEqual(JSON.parse(failed.disk),{first:'retained'});assert.deepEqual(JSON.parse(failed.snapshot.pending),{first:'retained',second:'pending'});
   await quotaPage.evaluate(()=>{window.restoreSetItem();window.store.retry()});
   await quotaPage.waitForFunction(k=>window.store.getStatus()==='ready'&&JSON.parse(localStorage.getItem(k)).second==='pending',key,{timeout:20000});
   await quotaContext.close();
   console.log(JSON.stringify({browser:name,noWebLocks,injectedQuotaPreservesCommittedAndPending:true,retryPersistsPending:true}));

   // Issue a close immediately after a commit reports pending. The browser may
   // finish the transaction before it closes; either intact old or complete
   // new record is acceptable, never a damaged or replaced first answer.
   const exitContext=await browser.newContext(),exiting=await exitContext.newPage();
   await start(exiting,newSource,'new',noWebLocks);assert.equal(await waitState(exiting,['ready','read_only']),'ready');
   await exiting.evaluate(()=>window.store.commit({first:'retained'},null));
   await exiting.waitForFunction(k=>window.store.getStatus()==='ready'&&!!localStorage.getItem(k),key,{timeout:20000});
   const queued=await exiting.evaluate(()=>window.store.commit({first:'retained',second:'pending-exit'},window.store.exportSnapshot().stored));assert.equal(queued.pending,true);
   await exiting.close({runBeforeUnload:false});const afterExit=await exitContext.newPage();await start(afterExit,newSource,'new',noWebLocks);
   assert.equal(await waitState(afterExit,['ready','read_only','conflict']),'ready');
   const after=JSON.parse(await afterExit.evaluate(k=>localStorage.getItem(k),key));assert.equal(after.first,'retained');assert([undefined,'pending-exit'].includes(after.second));
   await exitContext.close();
   console.log(JSON.stringify({browser:name,noWebLocks,closeIssuedAfterPendingReturn:true,priorFirstAnswerRetained:true,transactionMayHaveCompleted:after.second==='pending-exit'}));
  }
 }finally{await browser.close()}
}
server.listen(0,'127.0.0.1',async()=>{try{for(const [name,engine] of [['chromium',chromium],['webkit',webkit]])await run(engine,name)}catch(e){console.error(e);process.exitCode=1}finally{server.close()}});
