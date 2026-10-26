'use strict';
// Dedicated candidate checks, using isolated synthetic browser storage.
const fs=require('fs'),path=require('path'),http=require('http'),assert=require('assert/strict');
const {chromium,webkit}=require('playwright');
const root=path.resolve(process.argv[2]||'.'),out=path.resolve(process.argv[3]||'tmp/fix79-browser');
const answers=JSON.parse(fs.readFileSync(process.argv[4],'utf8'));
fs.mkdirSync(out,{recursive:true});
let server;
async function listen(){
 server=http.createServer((req,res)=>{
  let p=path.resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://local').pathname));
  if(!p.startsWith(root+path.sep)&&p!==root){res.writeHead(403).end();return}
  try{if(fs.statSync(p).isDirectory())p=path.join(p,'index.html');const ext=path.extname(p);
   res.setHeader('Content-Type',({'.html':'text/html; charset=utf-8','.json':'application/json','.js':'text/javascript','.css':'text/css','.png':'image/png','.webp':'image/webp'})[ext]||'application/octet-stream');
   fs.createReadStream(p).pipe(res);
  }catch(_){res.writeHead(404).end()}
 });
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 return 'http://127.0.0.1:'+server.address().port+'/';
}
const action=(p,name,extra='')=>p.locator('[data-action="'+name+'"]'+extra).first();
async function math(page,examId,topics=null){
 await page.goto(base);await action(page,'home').click();await action(page,'topicSelect').waitFor({state:'visible'});
 await page.waitForFunction(()=>progressStore.getStatus()==='ready');
 await page.evaluate(({examId,topics})=>{
  saved.topicPractice.selectedTopicIds=topics||SKILL_DATA.units.map(x=>x.id);
  saved.topicPractice.sourceIds=['AMC8'];saved.topicPractice.examIds=examId?[examId]:[];
  persist();render();
 },{examId,topics});
 await action(page,'topicStart').click();
 await page.waitForFunction(()=>view==='examMapping');
}
async function prepare(page){
 for(let guard=0;guard<10;guard++){
  const task=await page.evaluate(()=>saved.rtm1.sessions.active);
  if(task.kind==='exam')return task;
  const expected=answers.training[task.id];assert.notEqual(expected,undefined,'independent fixture '+task.id);
  if(task.definition.answerContract.kind==='choice')await action(page,'rtmChoice','[data-value="'+String(expected)+'"]').click();
  else await page.locator('[data-rtm-input="answer"]').fill(Array.isArray(expected)?expected.join(','):String(expected));
  await action(page,'rtmSubmit').click();
  await page.waitForFunction(()=>saved.rtm1.sessions.active.feedback?.outcome==='VERIFIED');
  const id=task.attemptId;await action(page,'rtmNext').click();
  await page.waitForFunction(id=>saved.rtm1.sessions.active?.attemptId!==id,id);
 }
 throw Error('Preparation did not reach the original');
}
const report={revision:'RC79-FIX1',scope:'targeted candidate paths using isolated synthetic storage',physicalIPad:'NOT_TESTED',independentLearningAcceptance:'NOT_RUN',checks:[]};
function pass(name,extra={}){report.checks.push({name,result:'PASS',...extra});console.log('PASS '+name)}
let base;
async function main(){
 base=await listen();
 for(const [name,engine] of [['chromium',chromium],['webkit',webkit]]){
  const browser=await engine.launch({headless:true});
  try{
   let context=await browser.newContext({locale:'zh-CN',viewport:{width:820,height:1180}});
   let p=await context.newPage();p.setDefaultTimeout(60000);
   const errors=[];p.on('pageerror',e=>errors.push(String(e)));
   await math(p,'AMC8-2025-02');
   const figures=await p.evaluate(()=>__AMC8_CHILD_FORMS.problems['AMC8-2025-02'].givenFigures.map(f=>f.sha256));
   for(const hash of figures)await p.route('**/assets/loading-r1/'+hash+'.png',route=>route.abort());
   const exam=await prepare(p);assert.equal(exam.examId,'AMC8-2025-02');
   const imgs=p.locator('[data-rtm-statement-image]');assert.equal(await imgs.count(),2);
   await p.waitForFunction(()=>Array.from(document.querySelectorAll('[data-rtm-statement-image]')).every(x=>x.complete&&x.naturalWidth===0));
   const before=await p.evaluate(()=>Object.values(saved.rtm1.eventsById).filter(e=>e.type==='response_submitted').length);
   await p.locator('[data-rtm-input="answer"]').fill('10423');await action(p,'rtmSubmit').click();
   assert.equal(await p.evaluate(()=>Object.values(saved.rtm1.eventsById).filter(e=>e.type==='response_submitted').length),before);
   assert((await p.locator('[data-rtm-feedback]').innerText()).includes('图片'));
   for(const hash of figures)await p.unroute('**/assets/loading-r1/'+hash+'.png');
   for(let i=0;i<2;i++)await imgs.nth(i).locator('xpath=following-sibling::button[1]').click();
   await p.waitForFunction(()=>Array.from(document.querySelectorAll('[data-rtm-statement-image]')).every(x=>x.complete&&x.naturalWidth>0));
   await action(p,'rtmSubmit').click();await p.waitForFunction(()=>saved.rtm1.sessions.active.feedback?.outcome==='VERIFIED');
   const journal=await p.evaluate(()=>JSON.stringify(saved.rtm1));
   await action(p,'rtmBack').click();await p.locator('.topic-parent > summary').click();await action(p,'progress').click();
   assert((await p.locator('[data-math-activity]').innerText()).includes('真题及衔接练习：已提交'));
   await action(p,'rtmHistory').click();await p.locator('[data-rtm-history]').waitFor({state:'visible'});
   assert.equal(await p.evaluate(()=>JSON.stringify(saved.rtm1)),journal);
   assert.deepEqual(errors,[]);
   pass(name+'-image-failure-retry-and-math-records',{figureCount:2});
   await context.close();

   context=await browser.newContext({locale:'zh-CN',viewport:{width:820,height:1180}});
   p=await context.newPage();p.setDefaultTimeout(60000);await math(p,'AMC8-2025-01');await prepare(p);
   await p.waitForFunction(()=>Array.from(document.querySelectorAll('[data-rtm-statement-image]')).every(x=>x.complete&&x.naturalWidth>0));
   await p.locator('[data-rtm-input="answer"]').fill('５０％');await action(p,'rtmSubmit').click();
   await p.waitForFunction(()=>saved.rtm1.sessions.active.feedback?.outcome==='VERIFIED');
   const last=await p.evaluate(()=>Object.values(saved.rtm1.eventsById).filter(e=>e.type==='response_submitted').at(-1));
   assert.equal(last.input,'５０％');assert.equal(last.normalizedInput,'50');
   pass(name+'-percentage-normalization-preserves-raw-input');await context.close();

   context=await browser.newContext({locale:'zh-CN'});p=await context.newPage();p.setDefaultTimeout(60000);
   const focus=['A01','A02','A03','A04','R01','G01','G02','G03'];await math(p,null,focus);
   const target=await p.evaluate(()=>({topics:ConnectedLearning.routeTopics(saved.rtm1.sessions.connected.target.routeId),selected:saved.topicPractice.selectedTopicIds}));
   assert(target.topics.some(id=>focus.includes(id)&&!['A01','A02'].includes(id)));assert.deepEqual(target.selected,focus);
   pass(name+'-selected-focus-remains-within-declared-knowledge',{routeTopics:target.topics});await context.close();

   for(const id of ['W04','W08','W12']){
    context=await browser.newContext({locale:'zh-CN'});p=await context.newPage();p.setDefaultTimeout(60000);
    await p.goto(base);await action(p,'reading').click();await action(p,'rdPlan').waitFor({state:'visible'});
    await action(p,'rdPlan').click();await action(p,'rdOpenDiagnostic','[data-set="'+id+'"]').click();
    const known=await p.evaluate(()=>ReadingUI.snapshot().settings.knownMath);
    await action(p,'rdKnowledgeConfirm').click();await action(p,'rdDiagnostic').click();
    assert.equal(await p.evaluate(()=>ReadingUI.engine().current().session.diagnostic.setId),id);
    assert.deepEqual(await p.evaluate(()=>ReadingUI.snapshot().settings.knownMath),known);
    pass(name+'-map-diagnostic-'+id);await context.close();
   }
   context=await browser.newContext({locale:'zh-CN'});p=await context.newPage();p.setDefaultTimeout(60000);
   await p.goto(base);await action(p,'reading').click();await action(p,'rdParent').waitFor({state:'visible'});
   await action(p,'rdParent').click();await action(p,'progress').click();
   await p.locator('[data-math-activity]').waitFor({state:'visible'});
   pass(name+'-reading-first-opens-math-records');await context.close();
  }finally{await browser.close()}
 }
 report.result='PASS';
}
main().catch(e=>{report.result='FAIL';report.error=e.stack;console.error(e);process.exitCode=1}).finally(()=>{
 fs.writeFileSync(path.join(out,'fix79-browser-result.json'),JSON.stringify(report,null,2)+'\n');if(server)server.close();
});
