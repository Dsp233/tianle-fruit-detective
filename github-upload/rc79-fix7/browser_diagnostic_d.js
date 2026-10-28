'use strict';
// Isolated synthetic records and a simulated speech-start callback, never real audio or child assessment.
const fs=require('fs'),path=require('path'),http=require('http'),assert=require('assert/strict'),{chromium,webkit}=require('playwright');
const root=path.resolve(process.argv[2]||'.'),out=path.resolve(process.argv[3]||'/tmp/fix79-evidence');let server;
const action=(p,name,extra='')=>p.locator('[data-action="'+name+'"]'+extra).first();
async function serve(){server=http.createServer((req,res)=>{let file=path.resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://local').pathname));if(!file.startsWith(root+path.sep)&&file!==root){res.writeHead(403).end();return;}try{if(fs.statSync(file).isDirectory())file=path.join(file,'index.html');res.setHeader('Content-Type',({'.html':'text/html; charset=utf-8','.json':'application/json','.js':'text/javascript','.css':'text/css','.png':'image/png'})[path.extname(file)]||'application/octet-stream');fs.createReadStream(file).pipe(res);}catch(_){res.writeHead(404).end();}});await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));return 'http://127.0.0.1:'+server.address().port+'/';}
async function answer(p){const q=await p.evaluate(()=>ReadingUI.engine().current().question);if(q.type==='order'){for(const i of q.answer)await action(p,'rdPick','[data-index="'+i+'"]').click();}else await action(p,'rdPick','[data-index="'+q.answer+'"]').click();await action(p,'rdSubmit').click();return p.evaluate(()=>ReadingUI.engine().current().attempts.at(-1));}
(async()=>{const base=process.env.PUBLIC_BASE||await serve(),checks=[];fs.mkdirSync(out,{recursive:true});
 for(const [name,engine] of [['chromium',chromium],['webkit',webkit]]){
  const browser=await engine.launch({headless:true});try{
   const context=await browser.newContext({locale:'zh-CN',viewport:{width:820,height:1180}}),p=await context.newPage(),errors=[];
   p.setDefaultTimeout(60000);p.on('pageerror',e=>errors.push(String(e)));
   await p.goto(base);await action(p,'reading').click();await action(p,'rdStart').waitFor({state:'visible'});
   for(const condition of ['A','B','C','D']){
    await action(p,'rdHome').click();await action(p,'rdParent').click();assert((await p.locator('#rd-diagnostic').textContent()).includes('家长代读组需要记录家长只读原文'));
    await action(p,'rdDxSet','[data-set="BASELINE"]').click();await action(p,'rdKnowledgeConfirm').click();await action(p,'rdDiagnostic').click();
    assert.equal(await p.evaluate(()=>ReadingUI.engine().current().session.diagnostic.condition),condition);
   }
   await action(p,'rdSpeakAll').click();
   await p.evaluate(()=>ReadingUI.engine().speechStatus({status:'started',kind:'story'}));
   const first=await answer(p),material=first.materialId;
   assert.equal(first.voiceEver,true);assert.equal(first.parentEver,false);assert.equal(first.diagnosticValidity.eligible,false);
   assert.equal(await p.evaluate(()=>ReadingUI.engine().report().conditions.D.total),0);
   let guard=0;
   while(await p.evaluate(id=>ReadingUI.engine().current()?.material.id===id,material)){
    await action(p,'rdNext').click();
    if(await p.evaluate(id=>ReadingUI.engine().current()?.material.id===id,material))await answer(p);
    assert(++guard<8);
   }
   await p.locator('.rd-aids details summary').click();await action(p,'rdParentRead').click();
   const parentOnly=await answer(p);assert.equal(parentOnly.parentEver,true);assert.equal(parentOnly.voiceEver,false);assert.equal(parentOnly.diagnosticValidity.eligible,true);
   assert.equal(await p.evaluate(()=>ReadingUI.engine().report().conditions.D.total),1);
   // Reproduce an old FIX6 eligibility flag without changing its original answer or aid evidence.
   const legacyAttempts=await p.evaluate(id=>{
    for(const key of Object.keys(localStorage)){let saved;try{saved=JSON.parse(localStorage.getItem(key));}catch(_){continue;}
     const row=saved?.schema===1&&Array.isArray(saved.events)&&saved.events.find(e=>e.id===id);
     if(row){row.diagnosticValidity={eligible:true,reason:'未见材料、先修确认和指定辅助条件完整；仍需多次对照'};localStorage.setItem(key,JSON.stringify(saved));return saved.events.filter(e=>e.type==='attempt');}
    }
    throw Error('synthetic reading record missing');
   },first.id);
   await p.reload();await action(p,'reading').click();await action(p,'rdParent').waitFor({state:'visible'});await action(p,'rdParent').click();
   assert.equal(await p.evaluate(()=>ReadingUI.engine().report().conditions.D.total),1);
   assert.deepEqual(await p.evaluate(()=>ReadingUI.snapshot().events.filter(e=>e.type==='attempt')),legacyAttempts);
   assert((await p.locator('#rd-diagnostic').textContent()).includes('家长代读未记录，或请求过系统朗读或显示过拼音'));
   assert.deepEqual(errors,[]);await p.locator('#rd-diagnostic').screenshot({path:path.join(out,'diagnostic-d-'+name+'.png')});
   await context.close();checks.push({engine:name,result:'PASS',diagnosticEntry:true,voiceOnlyExcluded:true,parentOnlyValid:true,legacyExcludedAfterReload:true,originalAttemptsPreserved:true});
   console.log('PASS '+name+' D diagnostic eligibility and historic records');
  }finally{await browser.close();}
 }
 fs.writeFileSync(path.join(out,'diagnostic-d-browser.json'),JSON.stringify({result:'PASS',checks,syntheticSpeechStart:true,physicalAudio:'NOT_TESTED',physicalIPad:'NOT_TESTED',independentTeachingReview:'NOT_RUN'},null,2)+'\n');
})().catch(e=>{console.error(e);process.exitCode=1;}).finally(()=>{if(server)server.close();});
