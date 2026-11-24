'use strict';
const fs=require('fs'),path=require('path'),http=require('http'),assert=require('assert'),crypto=require('crypto');
const {chromium,webkit}=require('playwright');
const root=path.resolve(process.argv[2]),result=path.resolve(process.argv[3]);
const readingKey='tianle_amc8_question_design_v1_reading_r1',mathKey='tianle_amc8_question_design_v1';
const digest=b=>crypto.createHash('sha256').update(b).digest('hex');
const stages=['m','w2','p'];
const manifests=stages.map(s=>JSON.parse(fs.readFileSync(path.join(root,s+'-manifest.json'))));
for(let i=0;i<stages.length;i++)for(const [file,hash] of Object.entries(manifests[i].files))assert.equal(digest(fs.readFileSync(path.join(root,stages[i],file))),hash,file);
const cases=JSON.parse(fs.readFileSync(path.join(root,'p-cases.json')));
let active='m';
const mime={'.html':'text/html; charset=utf-8','.js':'application/javascript; charset=utf-8','.json':'application/json; charset=utf-8','.css':'text/css; charset=utf-8','.png':'image/png','.svg':'image/svg+xml','.webp':'image/webp','.jpg':'image/jpeg'};
const server=http.createServer((req,res)=>{
 const n=decodeURIComponent(new URL(req.url,'http://localhost').pathname).replace(/^\/+/,'')||'index.html';
 if(n.split('/').includes('..'))return res.writeHead(403).end();
 const f=path.join(root,active,n);
 if(!fs.existsSync(f)||!fs.statSync(f).isFile())return res.writeHead(404).end();
 res.setHeader('Content-Type',mime[path.extname(f)]||'application/octet-stream');res.setHeader('Cache-Control','no-store');fs.createReadStream(f).pipe(res);
});
const action=(p,n)=>p.locator('[data-action="'+n+'"]');
const record=p=>p.evaluate(k=>JSON.parse(localStorage.getItem(k)||'null'),readingKey);
const attempts=r=>r.events.filter(e=>e.type==='attempt');
const waitAttempt=(p,n)=>p.waitForFunction(({key,n})=>JSON.parse(localStorage.getItem(key)||'{}').events?.filter(e=>e.type==='attempt').length>=n,{key:readingKey,n});
let nav=0;
async function open(p,url,hash=''){await p.goto(url+'?stage='+active+'&navigation='+(++nav)+hash);await p.waitForFunction(()=>window.__AMC8_BOOT_READY===true);}
async function parent(p){await action(p,'rdParent').first().click();await action(p,'rdDxSet').first().waitFor();}
async function day(p,n){await action(p,'rdPlan').first().click();await p.locator('[data-action=rdStart][data-day="'+n+'"]').click();await action(p,'rdReadDone').click();await action(p,'rdPick').first().waitFor();}
const pick=(p,i)=>p.locator('.rd-options [data-action=rdPick][data-index="'+i+'"]');
async function math(p,url){
 await open(p,url,'#math');
 await p.locator('.topic-selection [data-action=topicSelect]').first().waitFor();
 assert.equal(await p.evaluate(()=>window.__AMC8_RELEASE.contentRevision),154);
 assert(await p.evaluate(()=>!!window.__AMC8_JOINT));
 assert(await action(p,'topicSelect').first().isDisabled());
 await action(p,'topicParentUnlock').click();
 let orig=p.locator('[data-action=sourceToggle][data-code=original]');
 if(await orig.count()&&await orig.getAttribute('aria-pressed')==='false')await orig.click();
 let amc=p.locator('[data-action=sourceToggle][data-code=AMC8]');
 if(await amc.count()&&await amc.getAttribute('aria-pressed')==='true')await amc.click();
 for(let code of ['A01','A02','C01','R01','D01','G01','L01']){
  if(await action(p,'topicStart').first().isEnabled())break;
  let opt=p.locator('[data-action=topicSelect][data-code="'+code+'"]');
  if(await opt.count()&&await opt.getAttribute('aria-pressed')==='false')await opt.click();
 }
 assert(await action(p,'topicStart').first().isEnabled());await action(p,'topicStart').first().click();
 await p.locator('.task-title').first().waitFor();
 assert((await p.locator('.task-title').first().innerText()).trim().length>4);
 return await p.evaluate(k=>localStorage.getItem(k),mathKey);
}
async function main(){
 fs.mkdirSync(result,{recursive:true});await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const url='http://127.0.0.1:'+server.address().port+'/';const results=[];
 for(const [name,type] of [['chromium',chromium],['webkit',webkit]].filter(([name])=>!process.env.AMC8_BROWSER||name===process.env.AMC8_BROWSER)){
  active='m';const browser=await type.launch({headless:true});const ctx=await browser.newContext({viewport:{width:390,height:844},acceptDownloads:true});
  const errs=[];async function newPage(){const q=await ctx.newPage();q.setDefaultTimeout(30000);q.on('pageerror',e=>{errs.push(String(e));console.error(name,'PAGEERROR',e.stack||String(e));});q.on('console',m=>{if(m.type()==='error'||m.type()==='warning')console.error(name,'CONSOLE',m.type(),m.text().slice(0,2000));});q.on('requestfailed',r=>console.error(name,'REQUESTFAILED',r.url(),r.failure()));q.on('response',r=>{if(r.status()>=400)console.error(name,'HTTP',r.status(),r.url());});q.on('dialog',d=>d.dismiss());await q.route('**/*',route=>{const target=new URL(route.request().url());const origin=new URL(url).origin;return ((target.protocol==='http:'||target.protocol==='https:'||target.protocol==='blob:')&&target.origin===origin)?route.continue():route.abort();});return q;}
  let p=await newPage();
  // Browser restart/upgrade simulation only on synthetic data. Do not disable the app guard.
  async function reopen(hash=''){const old=p;p=await newPage();await old.close();await open(p,url,hash);}
  try{
   // M: load accepted math via G1 lazy bootstrap and create synthetic actual draft.
   const mathRaw=await math(p,url);assert(mathRaw&&JSON.parse(mathRaw));
   await reopen('#reading-parent');await action(p,'rdDxSet').first().waitFor();assert.equal(await action(p,'rdDxSet').count(),13);
   await action(p,'rdHome').first().click();await day(p,1);
   let c=cases[0];assert.equal(await p.evaluate(()=>window.__AMC8_ReadingRuntime.engine().current().question.id),c.questionId);
   let wrong=c.options.findIndex((_,i)=>i!==c.answer);
   await pick(p,wrong).click();await action(p,'rdSubmit').click();await waitAttempt(p,1);
   let old=await record(p);assert(!attempts(old)[0].correct);let mathBefore=await p.evaluate(k=>localStorage.getItem(k),mathKey);
   // W2: upgrade same origin without removing any math or prior reading records.
   active='w2';await reopen('#reading-parent');await action(p,'rdDxSet').first().waitFor();
   assert.equal(await action(p,'rdDxSet').count(),26);
   let w=await record(p);assert.deepEqual(attempts(w),attempts(old));assert.notEqual(w.contentHash,old.contentHash);
   assert.equal(await p.evaluate(k=>localStorage.getItem(k),mathKey),mathBefore);
   let backups=await p.evaluate(k=>Object.keys(localStorage).filter(x=>x.startsWith(k+'_backup_before_content_')).map(x=>localStorage.getItem(x)),readingKey);
   assert(backups.some(x=>JSON.stringify(JSON.parse(x).events.filter(e=>e.type==='attempt'))===JSON.stringify(attempts(old))));
   // One new W2 diagnostic, check first-answer feedback remains blind.
   let ids=await action(p,'rdDxSet').evaluateAll(e=>e.map(x=>x.dataset.set));
   await action(p,'rdDxSet').nth(13).click();assert(await action(p,'rdDiagnostic').isDisabled());
   await action(p,'rdKnowledgeConfirm').click();await action(p,'rdDiagnostic').click();await action(p,'rdPick').first().waitFor();
   let q=await p.evaluate(()=>window.__AMC8_ReadingRuntime.engine().current().question);
   await pick(p,q.answer).click();await action(p,'rdSubmit').click();await waitAttempt(p,2);
   assert.equal(await action(p,'rdReveal').count(),0);assert.equal(await p.locator('.rd-feedback.rd-good,.rd-feedback.rd-try').count(),0);
   assert.equal(await p.locator('[data-p-reason]').count(),0);
   let w2=await record(p);assert.equal(attempts(w2).length,2);
   // P: preserve W2 answer and synthetic math record while loading the changed portal.
   active='p';await reopen('#reading-parent');await action(p,'rdDxSet').first().waitFor();assert.equal(await action(p,'rdDxSet').count(),26);
   assert.deepEqual(attempts(await record(p)),attempts(w2));assert.equal(await p.evaluate(k=>localStorage.getItem(k),mathKey),mathBefore);
   await action(p,'rdHome').first().click();await day(p,2);c=cases[1];
   assert.equal(await p.evaluate(()=>window.__AMC8_ReadingRuntime.engine().current().question.id),c.questionId);
   assert.equal(await p.locator('[data-p-reason]').count(),0);
   await pick(p,c.answer).click();await action(p,'rdSubmit').click();await waitAttempt(p,3);
   let card=p.locator('[data-p-reason]');await card.waitFor();assert.equal(await card.getAttribute('open'),null);
   await card.locator('summary').first().click();let self=card.locator('[data-p-self-check]');assert.equal(await self.getAttribute('open'),null);
   await self.locator('summary').click();assert((await self.innerText()).length>5);
   let final=await record(p);assert.deepEqual(attempts(final).slice(0,2),attempts(w2));
   await reopen('#reading-parent');
   assert.deepEqual(attempts(await record(p)),attempts(final));
   // Existing Q0 overlay: synthetic note and export; no real user records.
   await reopen();await p.locator('[data-home-hub] h1').waitFor();
   const overlay=p.locator('#amc8-review-layer');await overlay.locator('#toggle-review').click();
   await p.locator('[data-home-hub] h1').click();await overlay.locator('#confirm-region').click();
   await overlay.locator('#note-text').fill('Final integration synthetic note');await overlay.locator('#save-annotation').click();
   await overlay.locator('#open-list').click();const dl=p.waitForEvent('download');await overlay.locator('#download-md').click();
   const download=await dl;assert((await fs.promises.readFile(await download.path(),'utf8')).includes('Final integration synthetic note'));
   await overlay.locator('#close-list').click();await overlay.locator('#toggle-review').click();
   await math(p,url);
   assert.deepEqual(attempts(await record(p)),attempts(final));assert.deepEqual(errs,[]);
   results.push({browser:name,stages,mathRevision:154,diagnosticSets:ids.length,oldFirstAnswerPreserved:true,legacyBackup:true,w2BlindFeedback:true,pReasonAfterCorrect:true,mathAndReadingIsolation:true,q0Export:true});
   await p.screenshot({path:path.join(result,name+'-final.png')});fs.writeFileSync(path.join(result,'browser-results.json'),JSON.stringify(results,null,2));console.log('BROWSER_BOUNDARY_PASS',name,JSON.stringify(results.at(-1)));
  }catch(e){console.error(name,p.url(),(await p.locator('body').innerText()).slice(0,2500));console.error(name,'PAGEERRORS',JSON.stringify(errs));console.error(name,'RUNTIME_STATE',JSON.stringify(await p.evaluate(()=>({boot:window.__AMC8_BOOT_READY,revision:window.__AMC8_RELEASE?.contentRevision,joint:!!window.__AMC8_JOINT,keys:Object.keys(window).filter(x=>x.startsWith('__AMC8'))})).catch(e=>String(e))));await p.screenshot({path:path.join(result,name+'-failure.png'),fullPage:true}).catch(()=>{});throw e;}finally{await browser.close();}
 }
 fs.writeFileSync(path.join(result,'browser-results.json'),JSON.stringify(results,null,2));console.log('FINAL_INTEGRATION_SMOKE_PASS',JSON.stringify(results));
}
main().catch(e=>{console.error(e);process.exitCode=1}).finally(()=>server.close());
