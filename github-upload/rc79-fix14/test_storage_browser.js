'use strict';
// All profiles, answers and records are synthetic; no learner data is used.
const fs=require('fs'),path=require('path'),http=require('http'),assert=require('node:assert/strict');
const {chromium,webkit}=require('playwright');
const root=path.resolve(process.argv[2]||'.'),out=path.resolve(process.argv[3]||'/tmp/fix14-evidence');
const source=fs.readFileSync(path.join(root,'github-upload/rc79-fix14/overlay/source/progress_store.js'),'utf8');
const rows=[];let server;
const act=(p,name)=>p.locator('[data-action="'+name+'"]').first();
async function openStore(context,base,key,quota=false){
 const p=await context.newPage();await p.goto(base+'blank');await p.addScriptTag({content:source});
 await p.evaluate(({key,quota})=>{
  Object.defineProperty(navigator,'locks',{value:undefined,configurable:true});
  const storage=quota?{getItem:k=>localStorage.getItem(k),setItem(k,v){if(window.failQuota&&k===key)throw Error('quota');localStorage.setItem(k,v)}}:localStorage;
  window.store=ProgressStore.open(key,{storage,transactional:true});
 },{key,quota});
 await p.waitForFunction(()=>['ready','read_only','conflict'].includes(store.getStatus()),null,{timeout:20000});return p;
}
async function settled(p){await p.waitForFunction(()=>['ready','read_only','conflict','unsaved'].includes(store.getStatus())&&!(store.getStatus()==='ready'&&store.exportSnapshot().pending!==null),null,{timeout:20000});return p.evaluate(()=>({status:store.getStatus(),...store.exportSnapshot()}));}
async function seedLegacy(p,key){await p.evaluate(async key=>{await new Promise((resolve,reject)=>{const req=indexedDB.open('amc8-writer-locks-v1',1);req.onupgradeneeded=()=>req.result.createObjectStore('locks');req.onerror=()=>reject(req.error);req.onsuccess=()=>{const db=req.result,tx=db.transaction('locks','readwrite');tx.objectStore('locks').put({owner:'old-session'},key);tx.oncomplete=()=>{db.close();resolve()};tx.onerror=()=>reject(tx.error)}});localStorage.setItem(key,'legacy-original')},key);}
(async()=>{
 fs.mkdirSync(out,{recursive:true});server=http.createServer((req,res)=>{const u=new URL(req.url,'http://local');if(u.pathname==='/blank'){res.setHeader('content-type','text/html');res.end('<!doctype html><title>synthetic records</title>');return;}let f=path.resolve(root,'.'+decodeURIComponent(u.pathname));if(!f.startsWith(root+path.sep)&&f!==root){res.writeHead(403).end();return;}try{if(fs.statSync(f).isDirectory())f=path.join(f,'index.html');res.setHeader('content-type',({'.html':'text/html; charset=utf-8','.js':'text/javascript','.json':'application/json','.css':'text/css','.png':'image/png'})[path.extname(f)]||'application/octet-stream');fs.createReadStream(f).pipe(res)}catch(_){res.writeHead(404).end()}});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const synthetic='http://127.0.0.1:'+server.address().port+'/',base=process.env.PUBLIC_BASE||synthetic;
 for(const [name,engine]of [['chromium',chromium],['webkit',webkit]]){
  const browser=await engine.launch();try{
   let context=await browser.newContext();try{
    const a=await openStore(context,synthetic,'collision'),b=await openStore(context,synthetic,'collision');
    assert.equal((await settled(a)).status,'ready');assert.equal((await settled(b)).status,'ready');
    await Promise.all([a.evaluate(()=>store.commit({answer:'A'},null)),b.evaluate(()=>store.commit({answer:'B'},null))]);
    const states=await Promise.all([settled(a),settled(b)]);assert.deepEqual(states.map(x=>x.status).sort(),['conflict','ready']);
    const winner=states.find(x=>x.status==='ready'),loser=states.find(x=>x.status==='conflict');
    const disk=await a.evaluate(()=>localStorage.getItem('collision'));assert.equal(disk,winner.stored);assert.notEqual(JSON.parse(loser.pending).answer,JSON.parse(disk).answer);
    rows.push({engine:name,id:'simultaneous_reading_transactions',result:'PASS',oneWins:true,otherDraftPreserved:true});
   }finally{await context.close()}
   context=await browser.newContext();try{
    const a=await openStore(context,synthetic,'abnormal-exit');await a.evaluate(()=>store.commit({first:'saved'},null));await settled(a);
    await a.close(); // Deliberately do not call store.close().
    const b=await openStore(context,synthetic,'abnormal-exit'),before=await b.evaluate(()=>store.exportSnapshot().stored);assert.deepEqual(JSON.parse(before),{first:'saved'});
    await b.evaluate(raw=>store.commit({first:'saved',second:'new'},raw),before);assert.equal((await settled(b)).status,'ready');
    assert.deepEqual(JSON.parse(await b.evaluate(()=>localStorage.getItem('abnormal-exit'))),{first:'saved',second:'new'});
    rows.push({engine:name,id:'new_reading_transaction_page_disappears',result:'PASS',recordRetained:true,normalCloseNotRequired:true});
   }finally{await context.close()}
   context=await browser.newContext();try{
    const seed=await context.newPage();await seed.goto(synthetic+'blank');await seedLegacy(seed,'legacy');
    const a=await openStore(context,synthetic,'legacy');assert.equal((await settled(a)).status,'read_only');
    await a.evaluate(()=>store.commit({draft:'preserved'},'legacy-original'));assert.equal(await a.evaluate(()=>localStorage.getItem('legacy')),'legacy-original');
    await a.evaluate(()=>{localStorage.setItem('legacy_writer_released','old-session');store.retry()});
    assert.equal((await settled(a)).status,'ready');assert.deepEqual(JSON.parse(await a.evaluate(()=>localStorage.getItem('legacy'))),{draft:'preserved'});
    rows.push({engine:name,id:'legacy_claim_requires_release',result:'PASS',unknownOwnerProtected:true,draftRetained:true});
   }finally{await context.close()}
   context=await browser.newContext();try{
    const a=await openStore(context,synthetic,'quota',true);await a.evaluate(()=>{window.failQuota=true;store.commit({draft:'retained'},null)});const fail=await settled(a);assert.equal(fail.status,'unsaved');assert.deepEqual(JSON.parse(fail.pending),{draft:'retained'});assert.equal(await a.evaluate(()=>localStorage.getItem('quota')),null);
    await a.evaluate(()=>{window.failQuota=false;store.retry()});assert.equal((await settled(a)).status,'ready');assert.deepEqual(JSON.parse(await a.evaluate(()=>localStorage.getItem('quota'))),{draft:'retained'});
    rows.push({engine:name,id:'reading_transaction_quota_retry',result:'PASS',draftRetained:true});
   }finally{await context.close()}
   context=await browser.newContext();try{
    const p=await context.newPage();await p.goto(synthetic+'blank');await p.addScriptTag({content:source});await p.evaluate(()=>{const fake={open(){window.delayed={};return window.delayed}};window.store=ProgressStore.open('timeout',{indexedDB:fake,transactional:true});store.commit({draft:'still here'},null)});
    await p.waitForFunction(()=>store.getStatus()==='read_only',null,{timeout:20000});await p.evaluate(()=>{window.delayed.result={close(){window.closedLate=true},transaction(){window.lateTransaction=true;throw Error('must not write')}};window.delayed.onsuccess()});
    assert.equal(await p.evaluate(()=>window.closedLate),true);assert.notEqual(await p.evaluate(()=>window.lateTransaction),true);assert.equal(await p.evaluate(()=>localStorage.getItem('timeout')),null);assert.deepEqual(JSON.parse((await settled(p)).pending),{draft:'still here'});
    rows.push({engine:name,id:'late_indexeddb_completion',result:'PASS',lateCallbackCannotWrite:true,draftRetained:true});
   }finally{await context.close()}
   context=await browser.newContext();try{
    await context.addInitScript(()=>Object.defineProperty(navigator,'locks',{value:undefined,configurable:true}));
    const p=await context.newPage();await p.goto(base+'#math',{waitUntil:'load',timeout:60000});await p.waitForFunction(()=>progressStore.getStatus()==='ready',null,{timeout:30000});
    const check=await p.evaluate(()=>{
     parentMathEdit=true;const skill=SKILL_DATA.skills[0].id;sourceSelectionAction('sourceSkillToggle',{code:skill});
     const selection=JSON.parse(localStorage.getItem(STORE)).topicPractice.excludedSkillIds.includes(skill);
     saved.topicPractice.excludedSkillIds=[];saved.topicPractice.selectedTopicIds=SKILL_DATA.units.map(u=>u.id);saved.topicPractice.sourceIds=['AMC8'];saved.topicPractice.examIds=['AMC8-2009-17'];
     const sync=persist().ok,started=ExamMappingUI.beginConnected(),memory=saved.rtm1?.sessions?.active?.attemptId,disk=JSON.parse(localStorage.getItem(STORE)).rtm1?.sessions?.active?.attemptId;
     saved.periodicPractice.startedAt=Date.now()-16*86400000;saved.periodicPractice.lastObservedAt=Date.now();saved.periodicPractice.biweeklyCompletedAt=null;
     PeriodicPracticeUI.finishBiweekly({kind:'biweekly',cycleId:'synthetic-cycle'},1);const review=JSON.parse(localStorage.getItem(STORE)).periodicPractice.reviews.some(x=>x.cycleId==='synthetic-cycle');
     return {selection,sync,started,memory,disk,review};
    });
    assert.equal(check.selection,true);assert.equal(check.sync,true);assert.equal(check.started,true);assert.ok(check.memory);assert.equal(check.disk,check.memory);assert.equal(check.review,true);
    rows.push({engine:name,id:'actual_math_fallback_remains_synchronous',result:'PASS',selectionSaved:true,examSessionSaved:true,periodicReviewSaved:true});
   }finally{await context.close()}
   context=await browser.newContext({acceptDownloads:true,hasTouch:true,viewport:{width:820,height:1180}});try{
    const a=await context.newPage(),b=await context.newPage();for(const p of [a,b]){p.setDefaultTimeout(30000);await p.goto(base,{waitUntil:'load',timeout:60000});await act(p,'reading').click();await p.waitForFunction(()=>ReadingUI.engine()?.status().status==='ready',null,{timeout:30000})}
    const submit=wrong=>{const e=ReadingUI.engine(),c=e.startDay(1);if(!c)throw Error('cannot start day');e.markReadDone();const q=e.current().question,v=Array.isArray(q.answer)?(wrong?[...q.answer].reverse():q.answer):(q.answer+(wrong?1:0))%q.options.length;e.select(v);const row=e.submit(v);if(!row)throw Error('no answer');return {answer:v,question:q.id};};
    const picks=await Promise.all([a.evaluate(submit,false),b.evaluate(submit,true)]);assert.notDeepEqual(picks[0].answer,picks[1].answer);
    await Promise.all([a.waitForFunction(()=>['ready','conflict'].includes(ReadingUI.engine().status().status),null,{timeout:30000}),b.waitForFunction(()=>['ready','conflict'].includes(ReadingUI.engine().status().status),null,{timeout:30000})]);
    const statuses=await Promise.all([a.evaluate(()=>ReadingUI.engine().status().status),b.evaluate(()=>ReadingUI.engine().status().status)]);assert.deepEqual(statuses.slice().sort(),['conflict','ready']);
    const win=statuses[0]==='ready'?a:b,lose=statuses[0]==='conflict'?a:b,wi=statuses[0]==='ready'?0:1,li=1-wi;
    const original=await win.evaluate(()=>localStorage.getItem(ReadingUI.engine().key)),disk=JSON.parse(original),attempts=disk.events.filter(x=>x.type==='attempt');assert.equal(attempts.length,1);assert.deepEqual(attempts[0].selected,picks[wi].answer);assert.equal(attempts[0].first,true);
    const normalBackup=JSON.parse(await win.evaluate(()=>ReadingUI.engine().backup()));assert.equal(normalBackup.currentStoredRecord,null);assert.equal(normalBackup.baselineStoredRecord,null);
    await act(lose,'rdExport').waitFor();const downloadPromise=lose.waitForEvent('download');await act(lose,'rdExport').click();const download=await downloadPromise,backup=JSON.parse(fs.readFileSync(await download.path(),'utf8'));
    assert.equal(backup.saveStatus,'conflict');assert.deepEqual(JSON.parse(backup.currentStoredRecord).events.find(x=>x.type==='attempt').selected,picks[wi].answer);assert.deepEqual(backup.reading.events.find(x=>x.type==='attempt').selected,picks[li].answer);assert.equal(backup.reading.events.find(x=>x.type==='attempt').first,true);
    await win.reload({waitUntil:'load'});await act(win,'reading').click();await win.waitForFunction(()=>ReadingUI.engine()?.status().status==='ready',null,{timeout:30000});assert.deepEqual(await win.evaluate(()=>ReadingUI.engine().snapshot().events.find(x=>x.type==='attempt').selected),picks[wi].answer);
    rows.push({engine:name,id:'actual_reading_simultaneous_pages',result:'PASS',firstAnswerPreserved:true,storedRecordNotOverwritten:true,bothDraftAndStoredExported:true,reloadPreserved:true});
   }finally{await context.close()}
  }finally{await browser.close()}
 }
 const result={result:'PASS_WITH_REMAINING_WORK',scope:'Synthetic data in Chromium and WebKit; reading transaction component, actual reading page and unchanged mathematics fallback',checks:rows,remaining:['Mathematics fallback lifetime claims remain after abnormal exit and require a safe recovery procedure','Real device and child acceptance not performed','A page closed before an asynchronous save completes may lose its unsaved draft']};fs.writeFileSync(path.join(out,'fix14-storage-browser.json'),JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result));
})().catch(e=>{fs.mkdirSync(out,{recursive:true});fs.writeFileSync(path.join(out,'fix14-storage-error.json'),JSON.stringify({error:e.stack,checks:rows},null,2));console.error(e);process.exitCode=1}).finally(()=>server?.close());
