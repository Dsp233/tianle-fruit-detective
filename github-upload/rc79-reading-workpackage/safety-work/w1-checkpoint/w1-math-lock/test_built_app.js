'use strict';
// Targeted browser verification of the compiled candidate with synthetic records.
const {chromium,webkit}=require('playwright'),fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const root=path.resolve(process.argv[2]);const key='tianle_amc8_question_design_v1';
const server=http.createServer((req,res)=>{let p=path.resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname));if(!p.startsWith(root+path.sep)){res.writeHead(403).end();return;}fs.readFile(p,(err,data)=>{if(err){res.writeHead(404).end();return}res.writeHead(200,{'Content-Type':p.endsWith('.html')?'text/html; charset=utf-8':'application/octet-stream','Cache-Control':'no-store'});res.end(data)})});
async function run(engine,name){const browser=await engine.launch({headless:true}),context=await browser.newContext(),a=await context.newPage(),b=await context.newPage();
 try{
  const url=`http://127.0.0.1:${server.address().port}/source/index.html#math`;
  await a.goto(url,{waitUntil:'load',timeout:120000});await a.waitForFunction(()=>progressStore.getStatus()==='ready',null,{timeout:60000});
  await a.evaluate(()=>{saved.attempts.push({id:'synthetic-first',jointFacts:{step:1},firstSubmissionCorrect:false});persist()});
  await a.waitForFunction(k=>progressStore.getStatus()==='ready'&&localStorage.getItem(k)?.includes('synthetic-first'),key,{timeout:60000});
  await b.goto(url,{waitUntil:'load',timeout:120000});await b.waitForFunction(()=>progressStore.getStatus()==='read_only',null,{timeout:60000});
  await a.evaluate(()=>{saved.attempts.push({id:'synthetic-second',firstSubmissionCorrect:false});persist()});
  await a.waitForFunction(k=>progressStore.getStatus()==='ready'&&localStorage.getItem(k)?.includes('synthetic-second'),key,{timeout:60000});
  await a.close();await b.evaluate(()=>progressStore.retry());await b.waitForFunction(()=>progressStore.getStatus()==='conflict',null,{timeout:60000});
  const raw=await b.evaluate(k=>localStorage.getItem(k),key);assert(raw.includes('synthetic-first')&&raw.includes('synthetic-second'));
  assert.equal(await b.evaluate(()=>canPersist),false);
  const exported=await b.evaluate(()=>progressSnapshot());assert.equal(exported.format,'tianle-record-backup-v1');
  await b.close();let c=await context.newPage();await c.goto(url,{waitUntil:'load',timeout:120000});await c.waitForFunction(()=>progressStore.getStatus()==='ready',null,{timeout:60000});
  const reopened=JSON.parse(await c.evaluate(k=>localStorage.getItem(k),key));
  for(const id of ['synthetic-first','synthetic-second']){const rec=reopened.attempts.find(x=>x.id===id);assert(rec);assert.equal(rec.firstSubmissionCorrect,false);}
  // The actual FIX15 page can hold an unsubmitted task answer with an idle
  // store; a synthetic cancelable beforeunload must still be prevented.
  await c.evaluate(()=>open('fruit'));await c.waitForFunction(()=>progressStore.getStatus()==='ready',null,{timeout:60000});
  const warning=await c.evaluate(()=>{draft.selected=[0];const event=new Event('beforeunload',{cancelable:true});window.dispatchEvent(event);return {prevented:event.defaultPrevented,exported:progressSnapshot().currentTaskDraft?.draft?.selected};});
  assert.equal(warning.prevented,true);assert.deepEqual(warning.exported,[0]);
  c.once('dialog',dialog=>dialog.dismiss());await c.locator('[data-action="home"]').first().click();
  assert.equal(await c.evaluate(()=>view),'fruit');assert.deepEqual(await c.evaluate(()=>draft.selected),[0]);
  assert.equal(await c.locator('[data-action="progressExport"]').count(),1);
  await c.evaluate(()=>{draft=freshDraft()});
  const card=()=>c.locator('[data-action="person"][data-index="0"]');
  await card().click();
  await c.waitForFunction(k=>progressStore.getStatus()==='ready'&&
    JSON.parse(localStorage.getItem(k)).workingMathDrafts?.[mathDraftKey(taskNow())]?.selected?.[0]===0,key);
  await c.close();c=await context.newPage();await c.goto(url,{waitUntil:'domcontentloaded',timeout:120000});
  await c.waitForFunction(()=>typeof progressStore!=='undefined'&&progressStore.getStatus()==='ready',null,{timeout:60000});
  await c.evaluate(()=>open('fruit'));
  assert.equal(await card().getAttribute('aria-pressed'),'true','saved input must restore to its actual control');
  await card().click();
  await c.waitForFunction(k=>progressStore.getStatus()==='ready'&&
    !JSON.parse(localStorage.getItem(k)).workingMathDrafts?.[mathDraftKey(taskNow())],key);
  await c.close();c=await context.newPage();await c.goto(url,{waitUntil:'domcontentloaded',timeout:120000});
  await c.waitForFunction(()=>typeof progressStore!=='undefined'&&progressStore.getStatus()==='ready',null,{timeout:60000});
  await c.evaluate(()=>open('fruit'));
  assert.equal(await card().getAttribute('aria-pressed'),'false','cleared input must remain cleared');
  await c.close();
  console.log(JSON.stringify({browser:name,compiledApplication:true,firstAndSecondPersisted:true,oldPageBlocked:true,changedBaselineConflict:true,exportAvailable:true,reopenPreservesFirstAnswers:true,unsubmittedDraftWarning:true,navigationCancelPreservesDraft:true,mathDraftTapReloadAndClear:true,normalizationPermitted:true}));
 }finally{await context.close();await browser.close()}}
server.listen(0,'127.0.0.1',async()=>{try{for(const [name,engine] of [['chromium',chromium],['webkit',webkit]])await run(engine,name)}catch(e){console.error(e);process.exitCode=1}finally{server.close()}});
