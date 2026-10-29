'use strict';
// Runs only against an isolated QA namespace. Browser engines and touch are
// emulated; the completed ten-question group is a synthetic test fixture.
const fs=require('fs'),path=require('path'),http=require('http'),assert=require('node:assert/strict'),{chromium,webkit}=require('playwright');
const root=path.resolve(process.argv[2]||'.'),out=path.resolve(process.argv[3]||'/tmp/fix12-family-evidence');
const click=(p,name)=>p.locator('[data-action="'+name+'"]').first().tap();
const rows=[];let server;
(async()=>{
 fs.mkdirSync(out,{recursive:true});
 let base=process.env.PUBLIC_BASE;
 if(!base){
  server=http.createServer((req,res)=>{
   let f=path.resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://local').pathname));
   if(!f.startsWith(root+path.sep)&&f!==root){res.writeHead(403).end();return}
   try{if(fs.statSync(f).isDirectory())f=path.join(f,'index.html');
    res.setHeader('Content-Type',({'.html':'text/html; charset=utf-8','.js':'text/javascript','.json':'application/json','.css':'text/css'})[path.extname(f)]||'application/octet-stream');
    fs.createReadStream(f).pipe(res);
   }catch(_){res.writeHead(404).end()}
  });
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));base='http://127.0.0.1:'+server.address().port+'/';
 }
 for(const [name,engine] of [['chromium',chromium],['webkit',webkit]]){
  const browser=await engine.launch();
  try{
   const context=await browser.newContext({hasTouch:true,viewport:{width:820,height:1180}});
   await context.addInitScript(()=>{
    const key='tianle_amc8_qa_normal_rc79_v1';
    if(localStorage.getItem(key)===null)localStorage.setItem(key,JSON.stringify({
     contentRevision:153,storageVersion:2,
     topicPractice:{selectedTopicIds:['A01','A02'],sourceIds:['AMC8'],examIds:['AMC8-2023-01']},
     competition:{attempts:[],extensions:[]}
    }));
   });
   const p=await context.newPage(),errors=[];p.on('pageerror',e=>errors.push(String(e)));p.setDefaultTimeout(30000);
   await p.goto(base+'qa/normal/',{waitUntil:'load',timeout:60000});
   await click(p,'home');await p.locator('[data-action="topicSelect"]').first().waitFor();
   await p.waitForFunction(()=>progressStore.getStatus()==='ready'&&canPersist);
   await click(p,'topicStart');await p.locator('[data-rtm-task]').waitFor();
   await p.locator('[data-action="rtmChoice"][data-value="wrong1"]').tap();await click(p,'rtmSubmit');
   assert.equal(await p.evaluate(()=>saved.rtm1.sessions.active.feedback.outcome),'INCORRECT');
   const attempt=await p.evaluate(()=>saved.rtm1.sessions.active.attemptId);
   const first=await p.evaluate(()=>JSON.stringify(TransferEvidenceStore.attempt(saved.rtm1,saved.rtm1.sessions.active.attemptId).firstSubmission));
   await click(p,'rtmRetry');await p.locator('[data-action="rtmChoice"][data-value="valid"]').tap();await click(p,'rtmSubmit');
   assert.equal(await p.evaluate(()=>saved.rtm1.sessions.active.feedback.outcome),'VERIFIED');
   const didPersist=await p.evaluate(()=>{
    let s=TransferEvidenceStore.restore(saved.rtm1).state;
    const a=s.sessions.active,g=s.sessions.connected;
    const template=TransferEvidenceStore.events(s).find(e=>e.type==='response_submitted'&&e.attemptId===a.attemptId);
    const ids=[a.attemptId,...Array.from({length:9},(_,i)=>'synthetic-complete-'+i)];
    function add(id,seq){const e={...template,eventId:id+':fixture-finish',attemptId:id,sequence:seq,type:'attempt_finished',connectedGroupId:g.groupId,reason:'completed'};delete e.recordOrdinal;
     const next=TransferEvidenceStore.append(s,e);if(!next.ok)throw Error(next.reason);s=next.state}
    add(a.attemptId,a.nextSequence);for(const id of ids.slice(1))add(id,1);
    s.sessions.connected={...g,status:'completed',total:10,attemptIds:ids};
    s.sessions.active.finished=true;saved.rtm1=s;
    return !!persist()?.ok;
   });
   assert.equal(didPersist,true);
   const before=await p.evaluate(()=>JSON.stringify(saved.rtm1));
   assert.equal(await p.evaluate(id=>JSON.stringify(TransferEvidenceStore.attempt(saved.rtm1,id).firstSubmission),attempt),first);
   await click(p,'rtmBack');await p.locator('.topic-parent summary').tap();await click(p,'progress');
   const section=p.locator('[data-math-independent-errors]');
   assert.equal(await section.locator('[data-action="rtmReview"][data-id="'+attempt+'"]').count(),1);
   assert((await section.innerText()).includes('后续已改正'));
   assert.equal(await p.locator('[data-math-support-queue] [data-id="'+attempt+'"]').count(),0);
   assert.equal(await p.evaluate(()=>JSON.stringify(saved.rtm1)),before);
   await section.locator('[data-action="rtmReview"][data-id="'+attempt+'"]').tap();
   assert((await p.locator('body').innerText()).includes('只读回看'));
   assert.equal(await p.evaluate(()=>JSON.stringify(saved.rtm1)),before);
   assert.deepEqual(errors,[]);
   await p.screenshot({path:path.join(out,'family-review-'+name+'.png')});
   rows.push({engine:name,result:'PASS',syntheticGroupCompletion:true,correctedFirstErrorRetained:true,readOnlyReview:true,recordUnchanged:true,touchEmulation:true});
   await context.close();
  }finally{await browser.close()}
 }
 const result={result:'PASS',scope:'isolated browser profiles, synthetic group completion and emulated touch; not physical iPad or learner',checks:rows,physicalIPad:'NOT_TESTED',realChild:'NOT_RUN'};
 fs.writeFileSync(path.join(out,'family-browser.json'),JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result));
})().catch(e=>{fs.mkdirSync(out,{recursive:true});fs.writeFileSync(path.join(out,'family-browser-error.json'),JSON.stringify({error:e.stack,checks:rows},null,2));console.error(e);process.exitCode=1}).finally(()=>server?.close());
