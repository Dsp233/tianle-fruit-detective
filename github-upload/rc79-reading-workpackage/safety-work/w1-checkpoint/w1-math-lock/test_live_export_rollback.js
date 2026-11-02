'use strict';
// Synthetic end-to-end check: real candidate export, archived text, isolated
// FIX15 restore. It does not simulate device loss or claim automatic draft UI.
const {chromium,webkit}=require('playwright'),fs=require('node:fs'),path=require('node:path'),http=require('node:http'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.resolve(process.argv[2]),oldData=fs.readFileSync(process.env.FIX15_DATA,'utf8'),oldEngine=fs.readFileSync(process.env.FIX15_ENGINE,'utf8');
const helper=fs.readFileSync(path.join(__dirname,'../w1-rollback/fix15_fresh_restore.js'),'utf8');
const KEY='tianle_amc8_question_design_v1_reading_r1',MATH='tianle_amc8_question_design_v1';
const server=http.createServer((req,res)=>{const name=new URL(req.url,'http://localhost').pathname;if(name==='/blank'){res.writeHead(200,{'Content-Type':'text/html'}).end('<!doctype html><title>synthetic</title>');return}const p=path.resolve(root,'.'+decodeURIComponent(name));if(!p.startsWith(root+path.sep)){res.writeHead(403).end();return}fs.readFile(p,(e,b)=>{if(e){res.writeHead(404).end();return}res.writeHead(200,{'Content-Type':p.endsWith('.html')?'text/html; charset=utf-8':'application/octet-stream','Cache-Control':'no-store'}).end(b)})});
function oldSeed(){
 const ctx={window:{__AMC8_STORAGE_TEST:true},console,Math,Date};vm.createContext(ctx);vm.runInContext(oldData,ctx);vm.runInContext(oldEngine,ctx);
 const values=new Map(),store={getItem:k=>values.has(k)?values.get(k):null,setItem:(k,v)=>values.set(k,String(v)),removeItem:k=>values.delete(k)};
 const e=ctx.window.ReadingEngine.create(ctx.window.__AMC8_READING_DATA,store,KEY,()=>2000000000000);assert(e.startDay(1));
 const q=e.current().question,wrong=q.type==='order'?[...q.answer].reverse():(q.answer+1)%q.options.length;
 const first=e.submit(wrong);assert(first.first&&!first.correct);assert(e.select(q.type==='order'?[q.answer[0]]:q.answer));return {raw:values.get(KEY),questionId:q.id};
}
async function scripts(page){await page.addScriptTag({content:oldData});await page.addScriptTag({content:oldEngine});await page.addScriptTag({content:helper});}
async function run(type,name){
 const browser=await type.launch({headless:true}),source=await browser.newContext(),target=await browser.newContext(),seed=oldSeed();
 try{
  const base=`http://127.0.0.1:${server.address().port}`,page=await source.newPage();await page.goto(base+'/blank');await page.evaluate(({KEY,raw})=>localStorage.setItem(KEY,raw),{KEY,raw:seed.raw});
  await page.goto(base+'/source/index.html#math',{waitUntil:'load',timeout:120000});await page.waitForFunction(()=>progressStore.getStatus()==='ready',null,{timeout:60000});
  await page.locator('[data-action="reading"]').first().click();
  await page.waitForFunction(KEY=>{const e=ReadingUI.engine(),raw=localStorage.getItem(KEY);return e?.status().status==='ready'&&raw&&JSON.parse(raw).contentHash===e.data.contentHash;},KEY,{timeout:60000});
  await page.evaluate(()=>open('fruit'));await page.waitForFunction(()=>progressStore.getStatus()==='ready'&&progressStore.exportSnapshot().pending===null&&ReadingUI.engine().status().status==='ready',null,{timeout:60000});
  const text=await page.evaluate(()=>{draft.selected=[0];saved.attempts.push({id:'pending-from-real-export',pendingSave:true,jointFacts:{synthetic:true},answer:{number:'42'}});return JSON.stringify(progressSnapshot(),null,2)});
  const exported=JSON.parse(text);assert.deepEqual(exported.currentTaskDraft.draft.selected,[0]);assert(exported.pendingJointAttemptIds.includes('pending-from-real-export'));assert.equal(exported.readingProtection.upgradeOriginal,seed.raw);
  const preparePage=await source.newPage();await preparePage.goto(base+'/blank');await scripts(preparePage);
  const prepared=await preparePage.evaluate(async exportText=>Fix15FreshRestore.prepare({exportText,sourceStorage:localStorage,oldData:window.__AMC8_READING_DATA,oldEngine:ReadingEngine}),text);assert(prepared.ok,prepared.code);
  const restorePage=await target.newPage();await restorePage.goto(base+'/blank');await scripts(restorePage);
  const result=await restorePage.evaluate(async archive=>Fix15FreshRestore.restoreFresh({archive,storage:localStorage,locks:navigator.locks,confirmedFreshProfile:true,oldData:window.__AMC8_READING_DATA,oldEngine:ReadingEngine}),prepared.archive);assert(result.ok,result.code);
  const recovered=await restorePage.evaluate(({KEY,MATH,id})=>{const archive=JSON.parse(localStorage.getItem(Fix15FreshRestore.STAGE)),e=ReadingEngine.create(window.__AMC8_READING_DATA,localStorage,KEY,()=>2000000000000);return {reading:localStorage.getItem(KEY),math:localStorage.getItem(MATH),exportText:archive.exportText,first:e.attempts(id)[0],draft:e.snapshot().session.drafts};},{KEY,MATH,id:seed.questionId});
  assert.equal(recovered.reading,seed.raw);assert.equal(recovered.math,exported.currentStoredRecord);assert.equal(recovered.exportText,text);assert.equal(recovered.first.correct,false);assert(recovered.draft[seed.questionId]!==undefined);
  const retained=JSON.parse(recovered.exportText);assert.deepEqual(retained.currentTaskDraft.draft.selected,[0]);assert(retained.record.attempts.some(x=>x.id==='pending-from-real-export'&&x.answer.number==='42'));
  console.log(JSON.stringify({browser:name,result:'PASS_SYNTHETIC_ONLY',realApplicationExport:true,oldReadingAndWrongFirstRestored:true,mathRawExact:true,unsubmittedTaskAndPendingJointArchived:true,automaticDraftRefill:false,realDevice:false}));
 }finally{await source.close();await target.close();await browser.close()}
}
server.listen(0,'127.0.0.1',async()=>{try{for(const [name,type] of [['chromium',chromium],['webkit',webkit]])await run(type,name)}catch(e){console.error(e);process.exitCode=1}finally{server.close()}});
