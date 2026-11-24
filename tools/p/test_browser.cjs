'use strict';
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const {chromium,webkit}=require('playwright');
const [root,out]=process.argv.slice(2).map(x=>path.resolve(x));
const manifest=JSON.parse(fs.readFileSync(path.join(out,'manifest.json')));
const crypto=require('node:crypto');const full=JSON.parse(fs.readFileSync(path.join(out,'site-manifest.json')));for(const [file,digest] of Object.entries(full)){assert.equal(crypto.createHash('sha256').update(fs.readFileSync(path.join(out,'site',file))).digest('hex'),digest,file)}
const key='tianle_amc8_question_design_v1_reading_r1';
const mime={'.html':'text/html; charset=utf-8','.js':'application/javascript; charset=utf-8','.json':'application/json; charset=utf-8','.css':'text/css; charset=utf-8','.png':'image/png','.svg':'image/svg+xml','.webp':'image/webp','.jpg':'image/jpeg'};
const server=http.createServer((req,res)=>{const u=new URL(req.url,'http://127.0.0.1'),name=decodeURIComponent(u.pathname).replace(/^\/+/,'')||'index.html';if(name.split('/').includes('..')){res.writeHead(403).end();return}const f=path.join(out,'site',name);if(!fs.existsSync(f)||!fs.statSync(f).isFile()){res.writeHead(404).end();return}res.setHeader('Content-Type',mime[path.extname(f)]||'application/octet-stream');res.setHeader('Cache-Control','no-store');fs.createReadStream(f).pipe(res);});
const action=(p,n)=>p.locator('[data-action="'+n+'"]');
const state=p=>p.evaluate(k=>JSON.parse(localStorage.getItem(k)),key);
const waitAttempt=(p,id,n)=>p.waitForFunction(({key,id,n})=>JSON.parse(localStorage.getItem(key)||'{}').events?.filter(e=>e.type==='attempt'&&e.questionId===id).length>=n,{key,id,n});
const visibleText=e=>e.evaluate(n=>{const c=n.cloneNode(true);c.querySelectorAll('rt,.rd-pinyin').forEach(x=>x.remove());return c.textContent});
async function main(){
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const url='http://127.0.0.1:'+server.address().port+'/';const results=[];
 for(const [name,type] of [['chromium',chromium],['webkit',webkit]]){
  const browser=await type.launch({headless:true});
  try{
   const ctx=await browser.newContext({viewport:{width:390,height:844},acceptDownloads:true});
   const p=await ctx.newPage();p.setDefaultTimeout(20000);const errs=[];p.on('pageerror',e=>errs.push(String(e)));
   await p.goto(url);await p.waitForFunction(()=>window.__AMC8_BOOT_READY===true);
   await p.locator('[data-home-hub] [data-action="reading"]').waitFor();
   await p.screenshot({path:path.join(out,name+'-home.png')});
   // Actual Q0 overlay, one synthetic review entry and export (no real note data).
   const overlay=p.locator('#amc8-review-layer');await overlay.locator('#toggle-review').click();
   await p.locator('[data-home-hub] h1').click();await overlay.locator('#confirm-region').click();await overlay.locator('#note-text').fill('P candidate synthetic feedback; not an owner note');await overlay.locator('#save-annotation').click();
   await overlay.locator('#open-list').click();
   const dl=p.waitForEvent('download');await overlay.locator('#download-md').click();const download=await dl;assert((await fs.promises.readFile(await download.path(),'utf8')).includes('P candidate synthetic feedback'));
   await overlay.locator('#close-list').click();await overlay.locator('#toggle-review').click();
   await p.locator('[data-home-hub] [data-action="reading"]').click();await action(p,'rdPlan').waitFor();
   await action(p,'rdParent').click();await action(p,'rdDxSet').first().waitFor();assert.equal(await action(p,'rdDxSet').count(),13);await action(p,'rdHome').first().click();
   const caseResults=[];
   for(const [idx,c] of manifest.cases.entries()){
    // Public reading map route, no synthetic course exposure.
    await action(p,'rdPlan').first().click();await p.locator('[data-action=rdStart][data-day="'+(idx+1)+'"]').click();await action(p,'rdReadDone').click();
    // First questions before the chosen ordinary choice task are completed through the actual UI only when necessary.
    let current=await p.evaluate(()=>window.__AMC8_ReadingRuntime.engine().current().question.id);
    assert.equal(current,c.questionId,'target must be first ordinary choice');
    const pick=i=>p.locator('.rd-options [data-action=rdPick][data-index="'+i+'"]');
    assert.equal(await p.locator('[data-p-reason]').count(),0);
    const wrong=c.options.findIndex((_,i)=>i!==c.answer);
    await pick(wrong).click();await action(p,'rdSubmit').click();await waitAttempt(p,c.questionId,1);
    const first=(await state(p)).events.find(e=>e.type==='attempt'&&e.questionId===c.questionId);assert(first.first&&!first.correct);
    assert.equal(await p.locator('[data-p-reason]').count(),0);
    await pick(c.answer).click();await action(p,'rdSubmit').click();await waitAttempt(p,c.questionId,2);
    const card=p.locator('[data-p-reason]');await card.waitFor();assert.equal(await card.getAttribute('open'),null);const check=card.locator('[data-p-self-check]');await card.locator('summary').first().click();assert.equal(await check.getAttribute('open'),null);assert((await visibleText(card)).includes(c.challenge));await check.locator('summary').click();assert((await visibleText(check)).includes(c.selfCheck));
    const after=(await state(p)).events.filter(e=>e.type==='attempt'&&e.questionId===c.questionId);assert.deepEqual(after[0],first);assert(after[1].correct&&!after[1].first);
    await card.screenshot({path:path.join(out,name+'-reason-'+(idx+1)+'.png')});
    await action(p,'rdHome').first().click();caseResults.push({material:c.material,question:c.questionId,firstPreserved:true,challengeAfterCorrect:true,selfCheck:true});
   }
   const before=(await state(p)).events.filter(e=>e.type==='attempt');
   await p.locator('button.brand[data-action=hubHome]').click();await p.locator('[data-home-hub] [data-action=home]').click();await p.waitForFunction(()=>!document.querySelector('[data-home-hub]')&&document.querySelector('.topic-selection [data-action=topicSelect]'),null,{timeout:30000});
   assert((await p.locator('.topic-intro').innerText()).includes('想换知识范围，请家长确认'));
   assert(await action(p,'topicSelect').first().isDisabled());await action(p,'topicParentUnlock').click();assert(!(await action(p,'topicSelect').first().isDisabled()));
   const original=p.locator('[data-action=sourceToggle][data-code=original]');if(await original.count()&&await original.getAttribute('aria-pressed')==='false')await original.click();
   const amc=p.locator('[data-action=sourceToggle][data-code=AMC8]');if(await amc.count()&&await amc.getAttribute('aria-pressed')==='true')await amc.click();
   for(const code of ['A01','A02','C01','R01','D01','G01','L01']){if(await action(p,'topicStart').first().isEnabled())break;const choice=p.locator('[data-action=topicSelect][data-code="'+code+'"]');if(await choice.count()&&await choice.getAttribute('aria-pressed')==='false')await choice.click();}
   assert(await action(p,'topicStart').first().isEnabled(),'synthetic declared scope must offer an actual problem');
   await action(p,'topicStart').first().click();await p.locator('.task-title').first().waitFor({timeout:30000});
   assert((await p.locator('.task-title').first().innerText()).trim().length>4);await p.screenshot({path:path.join(out,name+'-math.png')});
   // Opening a math exercise can create an unfinished draft. Respect the
   // existing navigation guard; export the synthetic record before accepting
   // the explicit confirmation. Never bypass the save/leave policy.
   // First attempt navigation with the confirmation dismissed, exposing the
   // documented export controls if the guard is active.
   let confirmSeen=false; const decline=async d=>{confirmSeen=true;await d.dismiss();};
   p.on('dialog',decline);await p.locator('button.brand[data-action=hubHome]').click();p.off('dialog',decline);
   if(await p.locator('[data-home-hub]').count()) {
    // No unfinished draft: return via the hub directly (the opened problem
    // and reading record preservation are still tested).
   } else {
   await action(p,'progressExport').first().waitFor();
   const draftExport=p.waitForEvent('download');
   await action(p,'progressExport').first().click(); 
   const draftFile=await draftExport;const backup=JSON.parse(await fs.promises.readFile(await draftFile.path(),'utf8'));assert(backup.record&&backup.currentTaskDraft);
   fs.writeFileSync(path.join(out,name+'-synthetic-math-export.json'),JSON.stringify(backup));
   p.on('dialog',async d=>{if(d.type()==='confirm'&&d.message().includes('本题有未提交或尚未确认保存的内容'))await d.accept();else await d.dismiss();});
   await p.locator('button.brand[data-action=hubHome]').click();
   if(!(await p.locator('[data-home-hub]').count())){await action(p,'storageRetry').first().click();await p.waitForTimeout(300);await p.locator('button.brand[data-action=hubHome]').click();}
   }
   await p.locator('[data-home-hub] [data-action=reading]').click();await action(p,'rdPlan').first().waitFor();
   const after=(await state(p)).events.filter(e=>e.type==='attempt');assert.deepEqual(after,before);await p.reload();await p.waitForFunction(()=>window.__AMC8_BOOT_READY===true);await p.waitForFunction(k=>JSON.parse(localStorage.getItem(k)||'null')?.events?.length>0,key);assert.deepEqual((await state(p)).events.filter(e=>e.type==='attempt'),before);
   assert.deepEqual(errs,[]);results.push({browser:name,scenarios:caseResults,oldDiagnostics:13,mathEntry:true,mathRealProblem:true,parentGate:true,readingHistory:true,q0SyntheticExport:true});await ctx.close();
  }catch(e){for(const p of browser.contexts().flatMap(c=>c.pages()))try{await p.screenshot({path:path.join(out,name+'-failure.png'),fullPage:true});console.error(name,p.url(),(await p.locator('body').innerText()).slice(0,2400));}catch{}throw e;}finally{await browser.close();}
 }
 fs.writeFileSync(path.join(out,'browser-results.json'),JSON.stringify(results,null,2));console.log(JSON.stringify(results));
}
main().catch(e=>{console.error(e);process.exitCode=1}).finally(()=>server.close());
