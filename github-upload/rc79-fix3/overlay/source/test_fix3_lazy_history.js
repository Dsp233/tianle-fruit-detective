'use strict';
const assert=require('node:assert/strict'),{boot}=require('./test_support');
const wait=()=>new Promise(resolve=>setImmediate(resolve));
(async()=>{
 const a=boot();a.click('home');const journal=a.value('JSON.stringify(saved.rtm1||null)');
 a.run("window.__savedReviews=window.__AMC8_REUSE_REVIEWS;delete window.__AMC8_REUSE_REVIEWS;window.__AMC8_OPTIONAL_DATA={load:()=>Promise.reject(Error('synthetic download failure'))}");
 a.click('rtmOpen');assert(a.root.innerHTML.includes('data-reuse-loading'));await wait();assert(a.root.innerHTML.includes('data-action="rtmLoadReviews"'));assert(a.root.innerHTML.includes('原记录仍保留'));
 a.run('window.__AMC8_OPTIONAL_DATA.load=()=>{window.__AMC8_REUSE_REVIEWS=window.__savedReviews;return Promise.resolve(true)}');a.click('rtmLoadReviews');await wait();
 assert(!a.root.innerHTML.includes('data-reuse-loading'));const rows=a.value('JointReuseReview.projection()');assert.equal(rows.length,95);assert(rows.every(row=>row.status==='REVIEWED'));assert.equal(a.value('JSON.stringify(saved.rtm1||null)'),journal);
 console.log(JSON.stringify({result:'PASS',scope:'lazy reviewed history failure and retry',reviewedFamilies:95,recordsPreserved:true,syntheticOnly:true}));
})().catch(e=>{console.error(e);process.exitCode=1});
