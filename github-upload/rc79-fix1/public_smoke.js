'use strict';
// Public, isolated synthetic profiles. This is not a complete learning acceptance.
const fs=require('fs'),path=require('path'),http=require('http'),assert=require('assert/strict'),{chromium,webkit}=require('playwright');
const out=process.env.FIX79_EVIDENCE_DIR||'/tmp/fix79-public',results=[];
let server;
async function baseUrl(){
 if(!process.env.FIX79_LOCAL_ROOT)return 'https://dsp233.github.io/tianle-fruit-detective/';
 const root=path.resolve(process.env.FIX79_LOCAL_ROOT);
 server=http.createServer((req,res)=>{
  let file=path.resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://local').pathname));
  if(!file.startsWith(root+path.sep)&&file!==root){res.writeHead(403).end();return}
  try{if(fs.statSync(file).isDirectory())file=path.join(file,'index.html');
   const ext=path.extname(file);res.setHeader('Content-Type',({'.html':'text/html; charset=utf-8','.js':'text/javascript','.json':'application/json','.css':'text/css','.png':'image/png'})[ext]||'application/octet-stream');
   fs.createReadStream(file).pipe(res);
  }catch(_){res.writeHead(404).end()}
 });
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 return 'http://127.0.0.1:'+server.address().port+'/';
}
const action=(p,name,extra='')=>p.locator('[data-action="'+name+'"]'+extra).first();
(async()=>{
 const base=await baseUrl();
 for(const [name,engine] of [['chromium',chromium],['webkit',webkit]]){
  const browser=await engine.launch({headless:true});
  try{
   const context=await browser.newContext({locale:'zh-CN',viewport:{width:820,height:1180}});
   const p=await context.newPage(),errors=[];p.setDefaultTimeout(60000);
   p.on('pageerror',error=>errors.push(String(error)));
   await p.goto(base,{waitUntil:'networkidle'});
   assert.equal(await p.locator('[data-home-hub] .dojo-path').count(),2);
   await action(p,'reading').click();await action(p,'rdStart').waitFor({state:'visible'});
   await action(p,'rdStart').click();await action(p,'rdReadDone').click();
   const q=await p.evaluate(()=>ReadingUI.engine().current().question);
   if(q.type==='order')for(let i=0;i<q.options.length;i++)await action(p,'rdPick','[data-index="'+i+'"]').click();
   else await action(p,'rdPick','[data-index="0"]').click();
   await action(p,'rdSubmit').click();
   const readingBefore=await p.evaluate(()=>ReadingUI.snapshot().events.filter(e=>e.type==='attempt').map(e=>e.id));
   assert.equal(readingBefore.length,1);
   await action(p,'home').click();await action(p,'topicSelect').waitFor({state:'visible'});
   await p.waitForFunction(()=>progressStore.getStatus()==='ready');
   await action(p,'topicParentUnlock').click();
   await action(p,'topicSelect','[data-code="A01"]').click();await action(p,'topicSelect','[data-code="A02"]').click();
   await action(p,'topicStart').click();await p.waitForFunction(()=>view==='examMapping'||view==='competition');
   const kind=await p.evaluate(()=>view);
   if(kind==='examMapping'){
    const task=await p.evaluate(()=>saved.rtm1.sessions.active);
    await p.waitForFunction(()=>Array.from(document.querySelectorAll('[data-rtm-statement-image]')).every(img=>img.complete&&img.naturalWidth>0));
    if(task.definition.answerContract.kind==='choice')await action(p,'rtmChoice','[data-value="'+String(task.definition.answerContract.expected)+'"]').click();
    else await p.locator('[data-rtm-input="answer"]').fill(String(task.definition.answerContract.expected));
    await action(p,'rtmSubmit').click();
    await p.waitForFunction(()=>saved.rtm1.sessions.active.feedback?.outcome==='VERIFIED');
   }else{
    const task=await p.evaluate(()=>taskNow());
    await action(p,'competitionPick','[data-index="'+task.answer+'"]').click();await action(p,'check').click();
    await p.waitForFunction(()=>saved.competition.attempts.length>0);
   }
   const mathBefore=await p.evaluate(()=>JSON.stringify({rtm:saved.rtm1,competition:saved.competition.attempts}));
   await action(p,'reading').click();await action(p,'rdResume').waitFor({state:'visible'});await action(p,'rdResume').click();
   assert.deepEqual(await p.evaluate(()=>ReadingUI.snapshot().events.filter(e=>e.type==='attempt').map(e=>e.id)),readingBefore);
   await action(p,'rdHome').click();await action(p,'rdPlan').click();
   await action(p,'rdOpenDiagnostic','[data-set="W04"]').click();await p.locator('#rd-diagnostic').waitFor({state:'visible'});
   assert.equal(await p.evaluate(()=>JSON.stringify({rtm:saved.rtm1,competition:saved.competition.attempts})),mathBefore);
   assert.deepEqual(errors,[]);
   results.push({engine:name,result:'PASS',checks:['two entrances','actual reading submission','actual math submission','switch and records','week 4 parent entry']});
   console.log('PASS public '+name+' channels and records');
   await context.close();
  }finally{await browser.close()}
 }
 fs.mkdirSync(out,{recursive:true});
 fs.writeFileSync(out+'/public-interaction.json',JSON.stringify({result:'PASS',checks:results,physicalIPad:'NOT_TESTED',formalAcceptance:'NOT_RUN'},null,2)+'\n');
})().catch(error=>{console.error(error);process.exitCode=1}).finally(()=>{if(server)server.close()});
