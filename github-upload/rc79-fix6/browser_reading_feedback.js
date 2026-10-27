'use strict';
// Isolated synthetic profiles; this is not a teaching or physical-iPad review.
const fs=require('fs'),path=require('path'),http=require('http'),assert=require('assert/strict'),{chromium,webkit}=require('playwright');
const root=path.resolve(process.argv[2]||'.'),out=path.resolve(process.argv[3]||'/tmp/fix79-evidence');let server;
const action=(p,name,extra='')=>p.locator('[data-action="'+name+'"]'+extra).first();
async function serve(){server=http.createServer((req,res)=>{let p=path.resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://local').pathname));if(!p.startsWith(root+path.sep)&&p!==root){res.writeHead(403).end();return}try{if(fs.statSync(p).isDirectory())p=path.join(p,'index.html');const ext=path.extname(p);res.setHeader('Content-Type',({'.html':'text/html; charset=utf-8','.json':'application/json','.js':'text/javascript','.css':'text/css','.png':'image/png'})[ext]||'application/octet-stream');fs.createReadStream(p).pipe(res)}catch(_){res.writeHead(404).end()}});await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));return 'http://127.0.0.1:'+server.address().port+'/';}
(async()=>{const base=process.env.PUBLIC_BASE||await serve(),checks=[];
 for(const [name,engine] of [['chromium',chromium],['webkit',webkit]]){
  const browser=await engine.launch({headless:true});try{
   const context=await browser.newContext({locale:'zh-CN'}),p=await context.newPage(),errors=[];p.setDefaultTimeout(60000);p.on('pageerror',e=>errors.push(String(e)));
   await p.goto(base);await action(p,'reading').click();await action(p,'rdStart').waitFor({state:'visible'});
   await p.evaluate(()=>{ReadingUI.engine().setting('pinyin','none');ReadingUI.openMaterials(['R-D001-M'],{purpose:'practice'})});await action(p,'rdReadDone').click();
   await action(p,'rdPick','[data-index="0"]').click();await action(p,'rdSubmit').click();
   assert((await p.locator('.rd-feedback').innerText()).includes('问的是谁现在的什么数量'));
   const first=await p.evaluate(()=>ReadingUI.engine().current().attempts[0]);assert.equal(first.correct,false);assert.equal(first.first,true);
   await action(p,'rdPick','[data-index="1"]').click();await action(p,'rdSubmit').click();assert((await p.locator('.rd-feedback').innerText()).includes('它是在问数量，还是在问颜色'));
   await action(p,'rdPick','[data-index="2"]').click();await action(p,'rdSubmit').click();
   const attempts=await p.evaluate(()=>ReadingUI.engine().current().attempts),events=await p.evaluate(()=>ReadingUI.snapshot().events.filter(e=>e.kind==='feedback_hint'));
   assert.equal(attempts.length,3);assert.equal(attempts[0].id,first.id);assert.equal(attempts[2].correct,true);assert.equal(attempts[2].feedbackHintEver,true);assert.equal(attempts[2].independent,false);assert.equal(events.length,1);
   const ids=attempts.map(x=>x.id);await p.reload();await action(p,'reading').click();await action(p,'rdResume').waitFor({state:'visible'});await action(p,'rdResume').click();
   assert.deepEqual(await p.evaluate(()=>ReadingUI.engine().current().attempts.map(a=>a.id)),ids);assert.deepEqual(errors,[]);await context.close();
   checks.push({engine:name,result:'PASS',distinctWrongFeedback:true,firstAnswerPreserved:true,assistanceRecorded:true,reloadPreserved:true});console.log('PASS '+name+' reading feedback, assistance, and reload');
  }finally{await browser.close()}
 }
 fs.mkdirSync(out,{recursive:true});fs.writeFileSync(path.join(out,'reading-feedback-browser.json'),JSON.stringify({result:'PASS',checks,physicalIPad:'NOT_TESTED',independentTeachingReview:'NOT_RUN'},null,2)+'\n');
})().catch(e=>{console.error(e);process.exitCode=1}).finally(()=>{if(server)server.close()});
