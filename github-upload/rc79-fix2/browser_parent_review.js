'use strict';
// Real UI interactions with isolated synthetic profiles, not real learner data.
const fs=require('fs'),path=require('path'),http=require('http'),assert=require('assert/strict'),{chromium,webkit}=require('playwright');
const root=path.resolve(process.argv[2]||'.'),out=path.resolve(process.argv[3]||'/tmp/fix2-evidence');let server;
const action=(p,name,extra='')=>p.locator('[data-action="'+name+'"]'+extra).first();
async function serve(){server=http.createServer((req,res)=>{let p=path.resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://local').pathname));if(!p.startsWith(root+path.sep)&&p!==root){res.writeHead(403).end();return}try{if(fs.statSync(p).isDirectory())p=path.join(p,'index.html');const ext=path.extname(p);res.setHeader('Content-Type',({'.html':'text/html; charset=utf-8','.json':'application/json','.js':'text/javascript','.css':'text/css','.png':'image/png'})[ext]||'application/octet-stream');fs.createReadStream(p).pipe(res)}catch(_){res.writeHead(404).end()}});await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));return 'http://127.0.0.1:'+server.address().port+'/';}
async function goProgress(p){await action(p,'rtmBack').click();await p.locator('.topic-parent > summary').click();await action(p,'progress').click();await p.locator('[data-math-support-queue]').waitFor({state:'visible'});}
(async()=>{const base=await serve(),checks=[];
 for(const [name,engine] of [['chromium',chromium],['webkit',webkit]]){
  const browser=await engine.launch({headless:true});try{const context=await browser.newContext({locale:'zh-CN'}),p=await context.newPage(),errors=[];p.setDefaultTimeout(60000);p.on('pageerror',e=>errors.push(String(e)));
   await p.goto(base);await action(p,'home').click();await action(p,'topicSelect').waitFor({state:'visible'});await p.waitForFunction(()=>progressStore.getStatus()==='ready');
   await p.evaluate(()=>{saved.topicPractice.selectedTopicIds=['A01','A02'];saved.topicPractice.sourceIds=['AMC8'];saved.topicPractice.examIds=['AMC8-2023-01'];persist();render()});
   await action(p,'topicStart').click();await p.locator('[data-rtm-task]').waitFor({state:'visible'});assert.equal(await p.evaluate(()=>saved.rtm1.sessions.active.id),'RTM-2023-01-DECISION');
   await action(p,'rtmChoice','[data-value="wrong1"]').click();await action(p,'rtmSubmit').click();await p.waitForFunction(()=>saved.rtm1.sessions.active.feedback?.outcome==='INCORRECT');
   const attempt=await p.evaluate(()=>saved.rtm1.sessions.active.attemptId),before=await p.evaluate(()=>JSON.stringify(saved.rtm1));
   await goProgress(p);const review=p.locator('[data-math-support-queue] [data-action="rtmReview"]');assert.equal(await review.count(),1);assert.equal(await review.getAttribute('data-id'),attempt);await review.click();
   await p.locator('[data-rtm-history]').waitFor({state:'visible'});assert((await p.locator('[data-rtm-history]').innerText()).includes('只读回看'));assert.equal(await p.evaluate(()=>JSON.stringify(saved.rtm1)),before);
   await action(p,'rtmReturn').click();await p.locator('[data-rtm-task]').waitFor({state:'visible'});await action(p,'rtmRetry').click();await action(p,'rtmChoice','[data-value="valid"]').click();await action(p,'rtmSubmit').click();
   await p.waitForFunction(()=>saved.rtm1.sessions.active.feedback?.outcome==='VERIFIED');assert.equal(await p.evaluate(()=>TransferEvidenceStore.attempt(saved.rtm1,saved.rtm1.sessions.active.attemptId).firstSubmission.result.outcome),'INCORRECT');
   const after=await p.evaluate(()=>JSON.stringify(saved.rtm1));await goProgress(p);assert.equal(await p.locator('[data-math-support-queue] [data-action="rtmReview"]').count(),0);assert.equal(await p.evaluate(()=>JSON.stringify(saved.rtm1)),after);assert.deepEqual(await p.evaluate(()=>saved.topicPractice.selectedTopicIds),['A01','A02']);assert.deepEqual(errors,[]);
   checks.push({engine:name,result:'PASS',unresolvedQueue:true,readOnlyReview:true,firstWrongRetained:true,solvedNotQueued:true});console.log('PASS '+name+' parent review queue and records');await context.close();
  }finally{await browser.close()}
 }
 fs.mkdirSync(out,{recursive:true});fs.writeFileSync(path.join(out,'parent-review-browser.json'),JSON.stringify({result:'PASS',checks,physicalIPad:'NOT_TESTED'},null,2)+'\n');
})().catch(e=>{console.error(e);process.exitCode=1}).finally(()=>{if(server)server.close()});
