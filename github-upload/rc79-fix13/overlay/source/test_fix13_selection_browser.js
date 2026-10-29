'use strict';
// Isolated QA profiles, browser-emulated touch, and one deliberately blocked
// original figure. No learner record is read or sent.
const fs=require('fs'),path=require('path'),http=require('http'),assert=require('node:assert/strict'),{chromium,webkit}=require('playwright');
const root=path.resolve(process.argv[2]||'.'),out=path.resolve(process.argv[3]||'/tmp/fix13-evidence'),rows=[];let server;
const act=(p,name)=>p.locator('[data-action="'+name+'"]').first();
async function answerCorrect(p){const t=await p.evaluate(()=>saved.rtm1.sessions.active),v=String(t.definition.answerContract.expected);if(t.definition.answerContract.kind==='choice')await p.locator('[data-action="rtmChoice"][data-value="'+v+'"]').tap();else await p.locator('[data-rtm-input="answer"]').fill(v);await act(p,'rtmSubmit').tap();assert.equal(await p.evaluate(()=>saved.rtm1.sessions.active.feedback.outcome),'VERIFIED');}
async function configure(p,id,base){
 await p.goto(base+'qa/normal/',{waitUntil:'load',timeout:60000});await act(p,'home').tap();await p.locator('[data-action="topicSelect"]').first().waitFor();
 await p.evaluate(id=>{const k='tianle_amc8_qa_normal_rc79_v1';localStorage.setItem(k,JSON.stringify({contentRevision:153,storageVersion:2,topicPractice:{selectedTopicIds:SKILL_DATA.units.map(u=>u.id),sourceIds:['AMC8'],examIds:[id]},competition:{attempts:[],extensions:[]}}))},id);
 await p.reload({waitUntil:'load'});await act(p,'home').tap();await p.locator('[data-action="topicSelect"]').first().waitFor();await p.waitForFunction(()=>progressStore.getStatus()==='ready'&&canPersist);await act(p,'topicStart').tap();
}
async function picker(p,id,action){await p.locator('.source-selection details summary').tap();const before=await p.evaluate(()=>JSON.stringify(saved.topicPractice.examIds));await p.locator('[data-source-exam-picker]').selectOption(id);assert.equal(await p.evaluate(()=>JSON.stringify(saved.topicPractice.examIds)),before);await act(p,action).tap();}
(async()=>{
 fs.mkdirSync(out,{recursive:true});let base=process.env.PUBLIC_BASE;
 if(!base){server=http.createServer((req,res)=>{let f=path.resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://local').pathname));if(!f.startsWith(root+path.sep)&&f!==root){res.writeHead(403).end();return}try{if(fs.statSync(f).isDirectory())f=path.join(f,'index.html');res.setHeader('Content-Type',({'.html':'text/html; charset=utf-8','.js':'text/javascript','.json':'application/json','.css':'text/css','.png':'image/png'})[path.extname(f)]||'application/octet-stream');fs.createReadStream(f).pipe(res)}catch(_){res.writeHead(404).end()}});await new Promise(r=>server.listen(0,'127.0.0.1',r));base='http://127.0.0.1:'+server.address().port+'/';}
 for(const [name,engine] of [['chromium',chromium],['webkit',webkit]]){
  const browser=await engine.launch();
  try{
   for(const code of ['2009-03','2009-17']){
    const context=await browser.newContext({hasTouch:true,viewport:{width:820,height:1180}}),p=await context.newPage(),errors=[];
    p.on('pageerror',e=>errors.push(String(e)));p.setDefaultTimeout(30000);
    if(code==='2009-03')await p.route('**/assets/loading-r1/4f6041cb2dad76d3190ed0cb11a77ebd4564d4c777a2bf845f5eb0755807688f.png',r=>r.abort());
    await configure(p,'AMC8-'+code,base);
    if(code==='2009-03'){
     for(let n=0;n<10;n++){const t=await p.evaluate(()=>saved.rtm1.sessions.active);if(t.kind==='exam')break;await answerCorrect(p);await act(p,'rtmNext').tap();}
     assert.equal(await p.evaluate(()=>saved.rtm1.sessions.active.id),'AMC8-2009-03');
     await p.locator('[data-rtm-statement-image]').first().waitFor();
     await p.waitForFunction(()=>{const i=document.querySelector('[data-rtm-statement-image]');return i&&i.complete&&i.naturalWidth===0});
     await p.locator('[data-rtm-input="answer"]').fill('6');await act(p,'rtmSubmit').tap();
     assert((await p.locator('[data-rtm-feedback]').innerText()).includes('图片还没有加载完成'));
     assert.equal(await p.evaluate(()=>TransferEvidenceStore.attempt(saved.rtm1,saved.rtm1.sessions.active.attemptId).firstSubmission),null);
    }else{
     await p.locator('[data-action="rtmChoice"][data-value="wrong1"]').tap();await act(p,'rtmSubmit').tap();
     assert.equal(await p.evaluate(()=>saved.rtm1.sessions.active.feedback.outcome),'INCORRECT');
    }
    const old=await p.evaluate(()=>saved.rtm1.sessions.active.attemptId),group=await p.evaluate(()=>saved.rtm1.sessions.connected.groupId);
    const before=await p.evaluate(id=>JSON.stringify(TransferEvidenceStore.attempt(saved.rtm1,id).firstSubmission),old);
    await act(p,'rtmBack').tap();await act(p,'topicParentUnlock').tap();
    if(code==='2009-03'){
     await picker(p,'AMC8-2023-01','sourceExamAdd');
     assert.deepEqual(await p.evaluate(()=>saved.topicPractice.examIds),['AMC8-2009-03','AMC8-2023-01']);
     assert((await p.locator('[data-selected-exam-summary]').innerText()).includes('AMC8-2009-03、AMC8-2023-01'));
     await act(p,'rtmConnectedResume').tap();assert.equal(await p.evaluate(()=>saved.rtm1.sessions.active.attemptId),old);
     assert.equal(await p.evaluate(()=>saved.rtm1.sessions.connected.groupId),group);
     await act(p,'rtmBack').tap();await act(p,'topicParentUnlock').tap();
    }
    await picker(p,'AMC8-2023-01','sourceExamReplace');
    assert.deepEqual(await p.evaluate(()=>saved.topicPractice.examIds),['AMC8-2023-01']);
    assert.equal(await p.evaluate(()=>saved.rtm1.sessions.active.attemptId),old);
    assert.equal(await p.evaluate(()=>saved.rtm1.sessions.connected.groupId),group);
    await act(p,'topicStart').tap();assert.equal(await p.evaluate(()=>saved.rtm1.sessions.active.originProblemGroupId),'AMC8-2023-01');
    assert.notEqual(await p.evaluate(()=>saved.rtm1.sessions.connected.groupId),group);
    assert(await p.evaluate(id=>saved.rtm1.sessions.archived.some(x=>x.attemptId===id),old));
    if(code==='2009-03')assert.equal(await p.evaluate(id=>saved.rtm1.sessions.archived.find(x=>x.attemptId===id).input,old),'6');
    assert.equal(await p.evaluate(id=>JSON.stringify(TransferEvidenceStore.attempt(saved.rtm1,id).firstSubmission),old),before);
    assert.deepEqual(errors,[]);rows.push({engine:name,scenario:code,result:'PASS',oldAttemptRetained:true,currentSelectionUsed:true,figureNetworkBlocked:code==='2009-03'});
    await context.close();
   }
  }finally{await browser.close()}
 }
 const result={result:'PASS',scope:'isolated browser QA profiles, emulated touch and intentionally blocked figure URL; not actual learner or device',checks:rows,physicalIPad:'NOT_TESTED',realChild:'NOT_RUN'};
 fs.writeFileSync(path.join(out,'selection-browser.json'),JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result));
})().catch(e=>{fs.mkdirSync(out,{recursive:true});fs.writeFileSync(path.join(out,'selection-error.json'),JSON.stringify({error:e.stack,checks:rows},null,2));console.error(e);process.exitCode=1}).finally(()=>server?.close());
