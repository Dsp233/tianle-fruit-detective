'use strict';
// Run with BROWSER=chromium or BROWSER=webkit after installing Playwright
// and the corresponding browser. Uses only synthetic local records.
const assert=require('node:assert/strict');
const http=require('node:http');
const path=require('node:path');
const playwright=require('playwright');
const root=__dirname;
const storePath=process.env.READING_STORE_PATH||path.join(root,'production_progress_store.js');
const browserName=process.env.BROWSER||'chromium';
if(!['chromium','webkit'].includes(browserName))throw Error('Unsupported browser');
const key='test_recovery_reading_r1',mathKey='test_recovery_math',hash='synthetic-only';
const record=(id)=>({schema:1,contentHash:hash,revision:1,settings:{pinyin:'all',rate:.85,remoteVoiceConsent:false,knownMath:[]},events:[{id,type:'note',at:1}],session:null,suspendedSessions:[],legacy:[]});
const raw=JSON.stringify(record('current')),other=JSON.stringify(record('candidate')),changed=JSON.stringify(record('concurrent'));
const candidate={raw:other,sources:['upgradeOriginal'],exactRaw:true};
const math='{"attempts":[{"first":true}]}';
const checks=[];
async function check(name,fn){await fn();checks.push(name);}
async function inject(page,url){await page.goto(url);await page.addScriptTag({path:storePath});await page.addScriptTag({path:path.join(root,'reading_recovery.js')});}
(async()=>{
 const server=http.createServer((req,res)=>{res.writeHead(200,{'Content-Type':'text/html; charset=utf-8'});res.end('<!doctype html><title>synthetic recovery test</title>');});
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const url='http://127.0.0.1:'+server.address().port+'/';
 let browser;
 try{
  browser=await playwright[browserName].launch({headless:true});
  const context=await browser.newContext(),page=await context.newPage(),otherPage=await context.newPage();
  await inject(page,url);await inject(otherPage,url);
  await page.evaluate(({key,mathKey,raw,math})=>{localStorage.clear();localStorage.setItem(key,raw);localStorage.setItem(mathKey,math);},{key,mathKey,raw,math});
  await check('real IndexedDB staged copy and exact baseline',async()=>{
   const r=await page.evaluate(async({key,hash,candidate,raw})=>{
    const before=ReadingRecovery.preflight({storage:localStorage,readingKey:key,candidate,currentContentHash:hash});
    const staged=await ReadingRecovery.stage({storage:localStorage,progressStore:ProgressStore,readingKey:key,expectedRaw:raw,candidate,currentContentHash:hash,timeoutMs:10000});
    const read=staged.ok?ReadingRecovery.readStage({storage:localStorage,progressStore:ProgressStore,readingKey:key,stageKey:staged.stageKey}):null;
    return {before,staged,read,stored:localStorage.getItem(key)};
   },{key,hash,candidate,raw});
   assert.equal(r.before.ok,true);assert.equal(r.before.restorationSupported,false);assert.equal(r.staged.ok,true);
   assert.equal(r.read.bundle.baselineRaw,raw);assert.equal(r.read.bundle.candidateRaw,other);assert.equal(r.stored,raw);
  });
  await check('second tab changes the baseline before stage',async()=>{
   await otherPage.evaluate(({key,changed})=>localStorage.setItem(key,changed),{key,changed});
   const r=await page.evaluate(({key,hash,candidate,raw})=>ReadingRecovery.stage({storage:localStorage,progressStore:ProgressStore,readingKey:key,expectedRaw:raw,candidate,currentContentHash:hash,timeoutMs:10000}),{key,hash,candidate,raw});
   assert.equal(r.code,'BASELINE_CHANGED');assert.equal(await page.evaluate(key=>localStorage.getItem(key),key),changed);
  });
  await check('change while opening the real transaction blocks staging',async()=>{
   const raceKey='race_test_reading_r1';
   const r=await page.evaluate(async({raceKey,raw,changed,candidate,hash})=>{
    localStorage.setItem(raceKey,raw);
    const pending=ReadingRecovery.stage({storage:localStorage,progressStore:ProgressStore,readingKey:raceKey,expectedRaw:raw,candidate,currentContentHash:hash,timeoutMs:10000});
    localStorage.setItem(raceKey,changed);
    return {result:await pending,stored:localStorage.getItem(raceKey)};
   },{raceKey,raw,changed,candidate,hash});
   assert.equal(r.result.ok,false);assert.equal(r.stored,changed);
  });
  await check('quota failure preserves raw record',async()=>{
   const quotaKey='quota_test_reading_r1';
   const r=await page.evaluate(async({quotaKey,raw,candidate,hash})=>{
    localStorage.setItem(quotaKey,raw);const original=Storage.prototype.setItem;
    Storage.prototype.setItem=function(k,v){if(String(k).includes('_recovery_stage_'))throw new DOMException('quota','QuotaExceededError');return original.call(this,k,v);};
    try{return {result:await ReadingRecovery.stage({storage:localStorage,progressStore:ProgressStore,readingKey:quotaKey,expectedRaw:raw,candidate,currentContentHash:hash,timeoutMs:10000}),stored:localStorage.getItem(quotaKey)};}
    finally{Storage.prototype.setItem=original;}
   },{quotaKey,raw,candidate,hash});
   assert.equal(r.result.ok,false);assert.equal(r.result.code,'STAGE_NOT_CONFIRMED');assert.equal(r.stored,raw);
  });
  await check('no lock and no restore leave the mathematical record intact',async()=>{
   const lockKey='unavailable_test_reading_r1';
   const r=await page.evaluate(async({lockKey,raw,candidate,hash,mathKey})=>{
    localStorage.setItem(lockKey,raw);let calls=0;const before=localStorage.getItem(mathKey);
    const staged=await ReadingRecovery.stage({storage:localStorage,progressStore:ProgressStore,readingKey:lockKey,expectedRaw:raw,candidate,currentContentHash:hash,indexedDB:null,timeoutMs:10000});
    const restore=await ReadingRecovery.mergeAndConfirm({storage:localStorage,readingKey:lockKey,engine:{importBackup(){calls++;}}});
    return {staged,restore,calls,stored:localStorage.getItem(lockKey),before,after:localStorage.getItem(mathKey)};
   },{lockKey,raw,candidate,hash,mathKey});
   assert.equal(r.staged.ok,false);assert.equal(r.restore.code,'RESTORE_NOT_IMPLEMENTED');assert.equal(r.calls,0);
   assert.equal(r.stored,raw);assert.equal(r.before,math);assert.equal(r.after,math);
  });
  await context.close();
  console.log(JSON.stringify({result:'PASS',browser:browserName,checks:checks.length,passed:checks,scope:'synthetic localStorage and real browser IndexedDB, no physical device or production deployment'}));
 }finally{await browser?.close();await new Promise(resolve=>server.close(resolve));}
})().catch(error=>{console.error(error.stack||error);process.exitCode=1;});
