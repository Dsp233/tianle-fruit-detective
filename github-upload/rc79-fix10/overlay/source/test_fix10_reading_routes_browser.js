'use strict';
const fs=require('fs'),path=require('path'),http=require('http'),assert=require('assert/strict'),{chromium,webkit}=require('playwright');
const root=path.resolve(process.argv[2]||'.'),out=path.resolve(process.argv[3]||'/tmp/fix10-evidence');let server;const checks=[];
const action=(p,name,extra='')=>p.locator('[data-action="'+name+'"]'+extra).first();
async function answerCurrent(p){
 const q=await p.evaluate(()=>ReadingUI.engine().current().question);
 for(const i of (q.type==='order'?q.answer:[q.answer]))await action(p,'rdPick','[data-index="'+i+'"]').tap();
 await action(p,'rdSubmit').tap();assert.equal(await p.evaluate(()=>ReadingUI.engine().current().attempts.at(-1).correct),true);
 await action(p,'rdNext').tap();
}
(async()=>{
 fs.mkdirSync(out,{recursive:true});let base=process.env.PUBLIC_BASE;
 if(!base){server=http.createServer((req,res)=>{let f=path.resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://local').pathname));if(!f.startsWith(root+path.sep)&&f!==root){res.writeHead(403).end();return;}try{if(fs.statSync(f).isDirectory())f=path.join(f,'index.html');res.setHeader('Content-Type',({'.html':'text/html; charset=utf-8','.js':'text/javascript','.json':'application/json','.css':'text/css','.png':'image/png'})[path.extname(f)]||'application/octet-stream');fs.createReadStream(f).pipe(res);}catch(_){res.writeHead(404).end();}});await new Promise(r=>server.listen(0,'127.0.0.1',r));base='http://127.0.0.1:'+server.address().port+'/';}
 for(const [name,engine] of [['chromium',chromium],['webkit',webkit]]){
  const browser=await engine.launch();try{
   const context=await browser.newContext({hasTouch:true,viewport:{width:820,height:1180}}),p=await context.newPage(),errors=[];p.setDefaultTimeout(30000);p.on('pageerror',e=>errors.push(String(e)));
   await p.addInitScript(()=>{window.__routeTestNow=2000000000000;const RealDate=Date;window.Date=class extends RealDate{constructor(...args){super(...(args.length?args:[window.__routeTestNow]));}static now(){return window.__routeTestNow;}};});
   await p.goto(base,{waitUntil:'load',timeout:60000});await action(p,'reading').tap();await p.evaluate(()=>ReadingUI.openMaterials(['R-D001-S1'],{purpose:'practice'}));await action(p,'rdReadDone').tap();
   for(let i=0;i<3;i++)await answerCurrent(p);
   const original=await p.evaluate(()=>ReadingUI.snapshot().events.filter(e=>e.type==='attempt'));
   assert(original.every(e=>e.first&&e.correct&&e.pinyinEver&&!e.independent));
   assert.equal(await p.evaluate(()=>ReadingUI.engine().challenge().eligible),true);
   await p.evaluate(()=>window.__routeTestNow+=2*86400000);
   await action(p,'rdHome').tap();await action(p,'rdPlan').tap();await action(p,'rdStart','[data-day="83"]').tap();
   assert.equal(await p.evaluate(()=>ReadingUI.engine().current().material.id),'R-D001-S1');
   assert.equal(await p.evaluate(()=>ReadingUI.engine().current().session.purpose),'review');
   assert.equal(await p.locator('[data-reading-review]').count(),1);
   const reviewId=await p.evaluate(()=>ReadingUI.engine().current().session.id);
   await action(p,'rdReadDone').tap();const q=await p.evaluate(()=>ReadingUI.engine().current().question);
   await action(p,'rdPick','[data-index="'+q.answer[0]+'"]').tap();
   const draft=await p.evaluate(()=>ReadingUI.engine().current().session.drafts);
   await action(p,'rdFreshDay').tap();assert.equal(await p.evaluate(()=>ReadingUI.engine().current().material.id),'R-D083-S1');
   assert.equal(await p.evaluate(()=>ReadingUI.engine().current().session.purpose),'unseen-choice');
   assert.equal(await p.evaluate(()=>ReadingUI.engine().current().session.day),null);
   await action(p,'rdHome').tap();await p.locator('.rd-unfinished summary').click();await action(p,'rdResume','[data-session="'+reviewId+'"]').tap();
   assert.deepEqual(await p.evaluate(()=>ReadingUI.engine().current().session.drafts),draft);
   await p.reload();await action(p,'reading').tap();await action(p,'rdResume').tap();
   assert.equal(await p.evaluate(()=>ReadingUI.engine().current().session.id),reviewId);
   assert.deepEqual(await p.evaluate(()=>ReadingUI.engine().current().session.drafts),draft);
   assert.deepEqual(await p.evaluate(()=>ReadingUI.snapshot().events.filter(e=>e.type==='attempt')),original);
   assert.deepEqual(errors,[]);checks.push({engine:name,result:'PASS',touchEmulation:true,assistedFirstUnchanged:true,reviewClearlyLabelled:true,unseenChoice:true,reviewDraftAndFirstAnswersPreserved:true});await context.close();
  }finally{await browser.close();}
 }
 const result={result:'PASS',scope:'browser engines, touch emulation and synthetic records; not a physical iPad or learner',checks,physicalIPad:'NOT_TESTED',realChild:'NOT_RUN'};
 fs.writeFileSync(path.join(out,'reading-routes-browser.json'),JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result));
})().catch(e=>{fs.mkdirSync(out,{recursive:true});fs.writeFileSync(path.join(out,'reading-routes-error.json'),JSON.stringify({error:e.stack,checks},null,2));console.error(e);process.exitCode=1;}).finally(()=>server?.close());
