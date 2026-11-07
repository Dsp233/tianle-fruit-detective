'use strict';
// Synthetic data only. Run against the frozen FIX15 static tree. A missing
// real Web Locks API is recorded as blocked; never fake that release gate.
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const {chromium,webkit}=require('playwright');
const root=path.resolve(process.argv[2]),data=fs.readFileSync(process.env.FIX15_DATA,'utf8'),engine=fs.readFileSync(process.env.FIX15_ENGINE,'utf8'),restore=fs.readFileSync(path.join(__dirname,'fix15_fresh_restore.js'),'utf8');
const server=http.createServer((req,res)=>{const pathname=new URL(req.url,'http://localhost').pathname;if(pathname==='/blank'){res.writeHead(200,{'Content-Type':'text/html'}).end('<!doctype html><title>isolated test</title>');return}const p=path.resolve(root,'.'+decodeURIComponent(pathname));if(!p.startsWith(root+path.sep)){res.writeHead(403).end();return}fs.readFile(p,(err,b)=>{if(err){res.writeHead(404).end();return}res.writeHead(200,{'Content-Type':p.endsWith('.html')?'text/html; charset=utf-8':'application/octet-stream','Cache-Control':'no-store'}).end(b)})});
async function setup(p){await p.goto(`http://127.0.0.1:${server.address().port}/blank`);await p.addScriptTag({content:data});await p.addScriptTag({content:engine});await p.addScriptTag({content:restore});}
async function run(browserType,name){const browser=await browserType.launch({headless:true}),sourceContext=await browser.newContext(),targetContext=await browser.newContext();try{
 const s=await sourceContext.newPage(),t=await targetContext.newPage();await setup(s);await setup(t);
 if(!await t.evaluate(()=>!!navigator.locks?.request))throw Error(name+': BLOCKED: Web Locks unavailable; rollback verification did not run');
 const fixture=await s.evaluate(async()=>{
  const api=Fix15FreshRestore,old=ReadingEngine.create(window.__AMC8_READING_DATA,localStorage,'synthetic',()=>2000000000000);old.startDay(1);
  const q=old.current().question,wrong=q.type==='order'?[...q.answer].reverse():(q.answer+1)%q.options.length;old.submit(wrong);old.select(q.answer);
  const oldRaw=localStorage.getItem('synthetic'),current=JSON.parse(oldRaw);current.contentHash=api.NEW_HASH;
  const bytes=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(oldRaw)),digest=Array.from(new Uint8Array(bytes),x=>x.toString(16).padStart(2,'0')).join('');
  current.events.push({id:'upgrade',type:'content_upgrade',fromContentHash:api.OLD_HASH,toContentHash:api.NEW_HASH,backupKey:api.KEY+'_backup_before_content_'+digest});
  const mathRaw=JSON.stringify({storageVersion:2,contentRevision:153,attempts:[{id:'old-math',firstSubmissionCorrect:false}]});
  localStorage.setItem(api.KEY,JSON.stringify(current));localStorage.setItem(api.MATH,mathRaw);
  localStorage.setItem(api.ACADEMY,'{"synthetic":"academy"}');localStorage.setItem(api.MATH+'_backup_before_v2','  {"synthetic":"older"}\n');
  const exportText=JSON.stringify({format:'tianle-record-backup-v1',currentStoredRecord:mathRaw,storageReadError:null,readingProtection:{upgradeOriginalReadable:true,upgradeOriginal:oldRaw},academyRecord:'{"synthetic":"academy"}',backups:{[api.MATH+'_backup_before_v2']:'  {"synthetic":"older"}\n'},currentTaskDraft:{synthetic:'unsubmitted'},record:{attempts:[{id:'pending-joint',pendingSave:true,jointFacts:{synthetic:true},answer:{number:'42'}}]},pendingJointAttemptIds:['pending-joint']});
  const prepared=await api.prepare({exportText,sourceStorage:localStorage,oldData:window.__AMC8_READING_DATA,oldEngine:ReadingEngine});if(!prepared.ok)throw Error(prepared.code);
  return {archive:prepared.archive,exportText,oldRaw,mathRaw,questionId:q.id};
 });
 const ui=`http://127.0.0.1:${server.address().port}/recovery/restore.html`;
 await s.goto(ui);await s.locator('#export').setInputFiles({name:'unified.json',mimeType:'application/json',buffer:Buffer.from(fixture.exportText)});
 await s.locator('#sourceConfirm').check();const downloadPromise=s.waitForEvent('download');await s.locator('#prepare').click();const downloaded=await downloadPromise;
 assert.equal(fs.readFileSync(await downloaded.path(),'utf8'),fixture.archive);
 await t.goto(ui);assert.equal(await t.locator('#openFixedVersion').isVisible(),false);
 await t.locator('#archive').setInputFiles({name:'invalid.json',mimeType:'application/json',buffer:Buffer.from('{}')});await t.locator('#targetConfirm').check();await t.locator('#restore').click();await t.waitForFunction(()=>document.getElementById('restoreStatus').textContent.includes('无法安全完成'),null,{timeout:30000});assert.equal(await t.locator('#openFixedVersion').isVisible(),false);assert.equal(await t.evaluate(()=>localStorage.length),0);
 await t.locator('#archive').setInputFiles({name:'archive.json',mimeType:'application/json',buffer:Buffer.from(fixture.archive)});
 await t.locator('#inspect').click();await t.waitForFunction(()=>document.getElementById('draftStatus').textContent.includes('unsubmitted'),null,{timeout:30000});assert((await t.locator('#draftStatus').textContent()).includes('pending-joint'));assert((await t.locator('#draftStatus').textContent()).includes('"42"'));assert.equal(await t.evaluate(()=>localStorage.length),0);
 const exportDownload=t.waitForEvent('download');await t.locator('#downloadExport').click();assert.equal(fs.readFileSync(await (await exportDownload).path(),'utf8'),fixture.exportText);assert.equal(await t.evaluate(()=>localStorage.length),0);
 // A second same-origin page holds the actual math Web Lock. Restoration must
 // fail before writing anything, then succeed only after that lock is released.
 const peer=await targetContext.newPage();await peer.goto(`http://127.0.0.1:${server.address().port}/blank`);
 await peer.evaluate(()=>{window.__held=false;window.__done=navigator.locks.request('amc8-writer:tianle_amc8_question_design_v1',{mode:'exclusive'},()=>{window.__held=true;return new Promise(resolve=>window.__release=resolve)});});
 await peer.waitForFunction(()=>window.__held,null,{timeout:30000});
 await t.locator('#restore').click();await t.waitForFunction(()=>document.getElementById('restoreStatus').textContent.includes('其他页面正在使用记录'),null,{timeout:30000});
 assert.equal(await t.locator('#openFixedVersion').isVisible(),false);assert.equal(await t.evaluate(()=>localStorage.length),0);
 await peer.evaluate(async()=>{window.__release();await window.__done});await peer.close();
 await t.locator('#targetConfirm').check();await t.locator('#restore').click();await t.waitForFunction(()=>document.getElementById('restoreStatus').textContent.includes('记录已写入'),null,{timeout:30000});
 assert.equal(await t.locator('#openFixedVersion').isVisible(),true);
 assert.equal(await t.evaluate(()=>localStorage.getItem(Fix15FreshRestore.KEY)),fixture.oldRaw);assert.equal(await t.evaluate(()=>localStorage.getItem(Fix15FreshRestore.MATH)),fixture.mathRaw);
 assert.equal(await t.evaluate(()=>localStorage.getItem(Fix15FreshRestore.ACADEMY)),'{"synthetic":"academy"}');
 assert.equal(await t.evaluate(()=>localStorage.getItem(Fix15FreshRestore.MATH+'_backup_before_v2')),'  {"synthetic":"older"}\n');
 const reread=await t.evaluate(id=>{const e=ReadingEngine.create(window.__AMC8_READING_DATA,localStorage,Fix15FreshRestore.KEY);return {status:e.status().status,first:e.attempts(id)[0],archive:JSON.parse(localStorage.getItem(Fix15FreshRestore.STAGE))}},fixture.questionId);
 assert.equal(reread.status,'ready');assert.equal(reread.first.correct,false);assert(JSON.parse(reread.archive.exportText).currentTaskDraft.synthetic==='unsubmitted');
 // Load the real fixed software, not the helper's engine, in the restored profile.
 await t.goto(`http://127.0.0.1:${server.address().port}/source/index.html#math`,{waitUntil:'load',timeout:120000});
 await t.waitForFunction(()=>typeof progressStore!=='undefined'&&progressStore.getStatus()==='ready',null,{timeout:60000});
 assert(await t.evaluate(()=>saved.attempts.some(a=>a.id==='old-math'&&a.firstSubmissionCorrect===false)));
 assert.equal(await t.evaluate(()=>localStorage.getItem('tianle_academy_v5_prototype')),'{"synthetic":"academy"}');
 console.log(JSON.stringify({browser:name,result:'PASS_SYNTHETIC_ONLY',recoveryPageAndDownload:true,archivedUnifiedExportRetrievable:true,pendingJointAttemptVisible:true,mathLockContentionBlocked:true,exactOldReading:true,newRecordArchived:true,wrongFirstRetained:true,oldApplicationReadsMath:true,academyRawRetained:true,unsubmittedDraftArchivedOnly:true}));
}finally{await sourceContext.close();await targetContext.close();await browser.close()}}
server.listen(0,'127.0.0.1',async()=>{try{for(const [name,b] of [['chromium',chromium],['webkit',webkit]])await run(b,name)}catch(e){console.error(e);process.exitCode=1}finally{server.close()}});
