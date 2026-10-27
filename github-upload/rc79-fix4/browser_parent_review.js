'use strict';
// Real UI interactions with isolated synthetic profiles, not real learner data.
const fs=require('fs'),path=require('path'),http=require('http'),assert=require('assert/strict'),{chromium,webkit}=require('playwright');
const root=path.resolve(process.argv[2]||'.'),out=path.resolve(process.argv[3]||'/tmp/fix2-evidence');let server;
const action=(p,name,extra='')=>p.locator('[data-action="'+name+'"]'+extra).first();
async function serve(){server=http.createServer((req,res)=>{let p=path.resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://local').pathname));if(!p.startsWith(root+path.sep)&&p!==root){res.writeHead(403).end();return}try{if(fs.statSync(p).isDirectory())p=path.join(p,'index.html');const ext=path.extname(p);res.setHeader('Content-Type',({'.html':'text/html; charset=utf-8','.json':'application/json','.js':'text/javascript','.css':'text/css','.png':'image/png'})[ext]||'application/octet-stream');fs.createReadStream(p).pipe(res)}catch(_){res.writeHead(404).end()}});await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));return 'http://127.0.0.1:'+server.address().port+'/';}
async function goProgress(p){await action(p,'rtmBack').click();await p.locator('.topic-parent > summary').click();await action(p,'progress').click();await p.locator('[data-math-support-queue]').waitFor({state:'visible'});}
async function answerWrong(p){const task=await p.evaluate(()=>saved.rtm1.sessions.active),answer=task.definition.answerContract;
 if(answer.kind==='choice'){const wrong=task.definition.options.find(o=>String(o.id)!==String(answer.expected));assert(wrong,'Synthetic fixture needs a wrong option');await action(p,'rtmChoice','[data-value="'+String(wrong.id)+'"]').click();}else await p.locator('[data-rtm-input="answer"]').fill('999999');
 await action(p,'rtmSubmit').click();await p.waitForFunction(()=>saved.rtm1.sessions.active.feedback?.outcome==='INCORRECT');}
(async()=>{const base=process.env.PUBLIC_BASE||await serve(),checks=[];
 for(const [name,engine] of [['chromium',chromium],['webkit',webkit]]){
  const browser=await engine.launch({headless:true});try{const context=await browser.newContext({locale:'zh-CN'}),p=await context.newPage(),errors=[];p.setDefaultTimeout(60000);p.on('pageerror',e=>errors.push(String(e)));
   await p.goto(base);await action(p,'home').click();await action(p,'topicSelect').waitFor({state:'visible'});await p.waitForFunction(()=>progressStore.getStatus()==='ready');
   await p.evaluate(()=>{saved.topicPractice.selectedTopicIds=['A01','A02'];saved.topicPractice.sourceIds=['AMC8'];saved.topicPractice.examIds=['AMC8-2023-01'];persist();render()});
   await action(p,'topicStart').click();await p.locator('[data-rtm-task]').waitFor({state:'visible'});assert.equal(await p.evaluate(()=>saved.rtm1.sessions.active.id),'RTM-2023-01-DECISION');
   assert((await p.locator('[data-rtm-task]').innerText()).includes('AMC8 2023 第 1 题'));
   assert((await p.locator('[data-rtm-task]').innerText()).includes('准备练习'));
   await action(p,'rtmChoice','[data-value="wrong1"]').click();await action(p,'rtmSubmit').click();await p.waitForFunction(()=>saved.rtm1.sessions.active.feedback?.outcome==='INCORRECT');
   const attempt=await p.evaluate(()=>saved.rtm1.sessions.active.attemptId),before=await p.evaluate(()=>JSON.stringify(saved.rtm1));
   await goProgress(p);const review=p.locator('[data-math-support-queue] [data-action="rtmReview"]');assert.equal(await review.count(),1);assert.equal(await review.getAttribute('data-id'),attempt);assert((await review.innerText()).includes('AMC8 2023 第 1 题'));await review.click();
   await p.locator('[data-rtm-history]').waitFor({state:'visible'});assert((await p.locator('[data-rtm-history]').innerText()).includes('只读回看'));assert((await p.locator('[data-rtm-source]').innerText()).includes('准备练习'));assert((await p.locator('[data-rtm-source]').innerText()).includes('AMC8 2023 第 1 题'));assert.equal(await p.evaluate(()=>JSON.stringify(saved.rtm1)),before);
   await action(p,'rtmReturn').click();await p.locator('[data-rtm-task]').waitFor({state:'visible'});await action(p,'rtmRetry').click();await action(p,'rtmChoice','[data-value="valid"]').click();await action(p,'rtmSubmit').click();
   await p.waitForFunction(()=>saved.rtm1.sessions.active.feedback?.outcome==='VERIFIED');assert.equal(await p.evaluate(()=>TransferEvidenceStore.attempt(saved.rtm1,saved.rtm1.sessions.active.attemptId).firstSubmission.result.outcome),'INCORRECT');
   const after=await p.evaluate(()=>JSON.stringify(saved.rtm1));await goProgress(p);assert.equal(await p.locator('[data-math-support-queue] [data-action="rtmReview"]').count(),0);assert.equal(await p.evaluate(()=>JSON.stringify(saved.rtm1)),after);assert.deepEqual(await p.evaluate(()=>saved.topicPractice.selectedTopicIds),['A01','A02']);assert.deepEqual(errors,[]);
   await context.close();
   const context2=await browser.newContext({locale:'zh-CN'}),p2=await context2.newPage();p2.setDefaultTimeout(60000);p2.on('pageerror',e=>errors.push(String(e))); 
   await p2.goto(base);await action(p2,'home').click();await action(p2,'topicSelect').waitFor({state:'visible'});await p2.waitForFunction(()=>progressStore.getStatus()==='ready');
   await p2.evaluate(()=>{saved.topicPractice.selectedTopicIds=SKILL_DATA.units.map(u=>u.id);saved.topicPractice.sourceIds=['AMC8'];saved.topicPractice.examIds=['AMC8-2000-01'];persist();render()});
   await action(p2,'topicStart').click();await p2.locator('[data-rtm-task]').waitFor({state:'visible'});await answerWrong(p2);
   const parentId=await p2.evaluate(()=>saved.rtm1.sessions.active.attemptId);await action(p2,'rtmDiagnostic').click();await p2.waitForFunction(()=>!!saved.rtm1.sessions.active.diagnosticOf);
   await answerWrong(p2);const journal=await p2.evaluate(()=>JSON.stringify(saved.rtm1));
   await goProgress(p2);const ids=await p2.locator('[data-math-support-queue] [data-action="rtmReview"]').evaluateAll(rows=>rows.map(row=>row.dataset.id));assert.deepEqual(ids,[parentId]);assert.equal(await p2.evaluate(()=>JSON.stringify(saved.rtm1)),journal);assert.deepEqual(errors,[]);await context2.close();
   const context3=await browser.newContext({locale:'zh-CN'}),p3=await context3.newPage();p3.setDefaultTimeout(60000);p3.on('pageerror',e=>errors.push(String(e)));
   await p3.goto(base);await action(p3,'home').click();await action(p3,'topicSelect').waitFor({state:'visible'});await p3.waitForFunction(()=>progressStore.getStatus()==='ready');
   await p3.evaluate(()=>{saved.topicPractice.selectedTopicIds=['A01','A02'];saved.topicPractice.sourceIds=['AMC8'];saved.topicPractice.examIds=['AMC8-2023-01'];persist();render()});
   await p3.locator('.topic-parent > summary').click();await action(p3,'rtmOpen').click();await action(p3,'rtmStart','[data-mode="practice"]').click();
   await p3.locator('[data-rtm-task]').waitFor({state:'visible'});assert.equal(await p3.evaluate(()=>saved.rtm1.sessions.active.kind),'exam');assert((await p3.locator('[data-rtm-task]').innerText()).includes('AMC8 2023 第 1 题'));assert((await p3.locator('[data-rtm-task]').innerText()).includes('AMC8真题'));
   await answerWrong(p3);const original=await p3.evaluate(()=>saved.rtm1.sessions.active.attemptId),originalJournal=await p3.evaluate(()=>JSON.stringify(saved.rtm1));await goProgress(p3);await p3.locator('[data-math-support-queue] [data-action="rtmReview"][data-id="'+original+'"]').click();
   assert((await p3.locator('[data-rtm-source]').innerText()).includes('AMC8真题'));assert((await p3.locator('[data-rtm-source]').innerText()).includes('AMC8 2023 第 1 题'));assert.equal(await p3.evaluate(()=>JSON.stringify(saved.rtm1)),originalJournal);
   await p3.evaluate(()=>{saved.rtm1.sessions.active.definition=null;persist()});const malformed=await p3.evaluate(()=>JSON.stringify(saved.rtm1));await action(p3,'rtmHistory').click();
   assert((await p3.locator('[data-rtm-history]').innerText()).includes('题面暂不可用'));await action(p3,'rtmReview','[data-id="'+original+'"]').click();
   assert((await p3.locator('[data-rtm-history]').innerText()).includes('题面暂时无法显示'));assert.equal(await p3.evaluate(()=>JSON.stringify(saved.rtm1)),malformed);assert.deepEqual(errors,[]);await context3.close();
   checks.push({engine:name,result:'PASS',unresolvedQueue:true,readOnlyReview:true,firstWrongRetained:true,solvedNotQueued:true,remediationNotIndependent:true,examAndPreparationSourceVisible:true,malformedHistorySafelyDisplayed:true});console.log('PASS '+name+' parent review queue, provenance, and records');
  }finally{await browser.close()}
 }
 fs.mkdirSync(out,{recursive:true});fs.writeFileSync(path.join(out,'parent-review-browser.json'),JSON.stringify({result:'PASS',checks,physicalIPad:'NOT_TESTED'},null,2)+'\n');
})().catch(e=>{console.error(e);process.exitCode=1}).finally(()=>{if(server)server.close()});
