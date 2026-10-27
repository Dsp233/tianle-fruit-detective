'use strict';
// Dedicated candidate checks, using isolated synthetic browser storage.
const fs=require('fs'),path=require('path'),http=require('http'),assert=require('assert/strict');
const {chromium,webkit}=require('playwright');
const root=path.resolve(process.argv[2]||'.'),out=path.resolve(process.argv[3]||'tmp/fix79-browser');
const answers=JSON.parse(fs.readFileSync(process.argv[4],'utf8'));
const legacyFixture=JSON.parse(fs.readFileSync(process.argv[5],'utf8'));
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
async function prepare(page,onTask=async()=>{}){
 for(let guard=0;guard<10;guard++){
  const task=await page.evaluate(()=>saved.rtm1.sessions.active);
  if(task.kind==='exam')return task;
  await onTask(task);
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
   let guideContext=await browser.newContext({locale:'zh-CN',viewport:{width:320,height:740}});
   let guidePage=await guideContext.newPage();guidePage.setDefaultTimeout(60000);await guidePage.goto(base);
   await guidePage.waitForFunction(()=>window.__AMC8_BOOT_READY===true);
   assert.equal(await guidePage.locator('#learning-guide').evaluate(el=>el.open),true);
   const overflow=await guidePage.evaluate(()=>document.documentElement.scrollWidth>innerWidth);
   assert.equal(overflow,false);assert.equal(await guidePage.evaluate(()=>localStorage.getItem('tianle_amc8_question_design_v1')),null);
   await guidePage.locator('[data-guide-dismiss]').click();assert.equal(await guidePage.locator('#learning-guide').evaluate(el=>el.open),false);
   await guidePage.waitForFunction(()=>localStorage.getItem('tianle_amc8_question_design_v1_intro_v1')==='seen');
   await guidePage.reload();await guidePage.waitForFunction(()=>window.__AMC8_BOOT_READY===true);
   assert.equal(await guidePage.locator('#learning-guide').evaluate(el=>el.open),false);
   pass(name+'-first-use-guide-skippable-and-narrow');await guideContext.close();

   guideContext=await browser.newContext({locale:'zh-CN'});
   await guideContext.addInitScript(()=>localStorage.setItem('tianle_amc8_question_design_v1','{"priorRecord":"preserve"}'));
   guidePage=await guideContext.newPage();guidePage.setDefaultTimeout(60000);await guidePage.goto(base);
   await guidePage.waitForFunction(()=>window.__AMC8_BOOT_READY===true);
   assert.equal(await guidePage.locator('#learning-guide').evaluate(el=>el.open),false);
   assert.equal(await guidePage.evaluate(()=>localStorage.getItem('tianle_amc8_question_design_v1')),'{"priorRecord":"preserve"}');
   pass(name+'-existing-profile-guide-does-not-reset');await guideContext.close();

   let legacyContext=await browser.newContext({locale:'zh-CN'});
   await legacyContext.addInitScript(({key,raw})=>localStorage.setItem(key,raw),legacyFixture);
   let legacyPage=await legacyContext.newPage();legacyPage.setDefaultTimeout(60000);await legacyPage.goto(base);await action(legacyPage,'home').click();
   await action(legacyPage,'rtmConnectedResume').waitFor({state:'visible'});await legacyPage.waitForFunction(()=>progressStore.getStatus()==='ready');await action(legacyPage,'rtmConnectedResume').click();
   await legacyPage.locator('[data-rtm-task]').waitFor({state:'visible'});
   assert.equal(await legacyPage.evaluate(()=>saved.rtm1.sessions.active.attemptId),legacyFixture.attemptId);assert.equal(await legacyPage.evaluate(()=>saved.rtm1.sessions.active.input),'valid');
   assert.equal(await legacyPage.evaluate(()=>JSON.stringify(saved.rtm1.eventsById)),legacyFixture.events);
   await action(legacyPage,'rtmSubmit').click();await legacyPage.waitForFunction(()=>saved.rtm1.sessions.active.feedback?.outcome==='VERIFIED');
   assert.equal(await legacyPage.evaluate(()=>TransferEvidenceStore.attempt(saved.rtm1,saved.rtm1.sessions.active.attemptId).firstSubmission.input),'wrong1');
   pass(name+'-frozen-home1-draft-and-first-answer-resume');await legacyContext.close();

   let settingsContext=await browser.newContext({locale:'zh-CN'}),settingsPage=await settingsContext.newPage();settingsPage.setDefaultTimeout(60000);
   await settingsPage.goto(base);await action(settingsPage,'home').click();await action(settingsPage,'topicSelect').waitFor({state:'visible'});
   assert.equal(await action(settingsPage,'topicSelect','[data-code="A01"]').isDisabled(),true);
   await action(settingsPage,'topicParentUnlock').click();await action(settingsPage,'topicSelect','[data-code="A01"]').click();await action(settingsPage,'topicSelect','[data-code="A02"]').click();
   assert.deepEqual(await settingsPage.evaluate(()=>saved.topicPractice.selectedTopicIds),['A01','A02']);
   await action(settingsPage,'reading').click();await action(settingsPage,'rdPlan').waitFor({state:'visible'});await action(settingsPage,'home').click();
   await action(settingsPage,'topicSelect').waitFor({state:'visible'});assert.equal(await action(settingsPage,'topicSelect','[data-code="A01"]').isDisabled(),true);
   assert.deepEqual(await settingsPage.evaluate(()=>saved.topicPractice.selectedTopicIds),['A01','A02']);
   pass(name+'-math-parent-confirmation-relocks-on-exit');await settingsContext.close();

   settingsContext=await browser.newContext({locale:'zh-CN'});settingsPage=await settingsContext.newPage();settingsPage.setDefaultTimeout(60000);
   await settingsPage.goto(base);await action(settingsPage,'reading').click();await action(settingsPage,'rdStart').waitFor({state:'visible'});
   assert.deepEqual(await settingsPage.evaluate(()=>ReadingUI.snapshot().settings.knownMath),[]);
   await action(settingsPage,'rdStart').click();await action(settingsPage,'rdReadDone').click();
   const pendingSession=await settingsPage.evaluate(()=>ReadingUI.engine().current().session.id);
   await action(settingsPage,'rdHome').click();await action(settingsPage,'rdParent').click();
   assert.equal(await action(settingsPage,'rdKnown').isDisabled(),true);await action(settingsPage,'rdSettingsUnlock').click();
   await settingsPage.locator('[data-reading-field="rangeStart"]').fill('8');await settingsPage.locator('[data-reading-field="rangeEnd"]').fill('14');await action(settingsPage,'rdSaveRange').click();
   assert.deepEqual(await settingsPage.evaluate(()=>ReadingUI.snapshot().settings.dayRange),{start:8,end:14});
   await action(settingsPage,'rdHome').click();await action(settingsPage,'rdPlan').click();
   assert.equal(await action(settingsPage,'rdStart','[data-day="1"]').isDisabled(),true);assert.equal(await action(settingsPage,'rdStart','[data-day="8"]').isEnabled(),true);
   await action(settingsPage,'rdHome').click();await action(settingsPage,'rdResume').click();
   assert.equal(await settingsPage.evaluate(()=>ReadingUI.engine().current().session.id),pendingSession);assert.equal(await settingsPage.evaluate(()=>ReadingUI.engine().current().session.paused),true);
   await action(settingsPage,'rdParent').click();await action(settingsPage,'rdSettingsUnlock').click();
   await settingsPage.locator('[data-reading-field="rangeStart"]').fill('1');await settingsPage.locator('[data-reading-field="rangeEnd"]').fill('84');await action(settingsPage,'rdSaveRange').click();
   await action(settingsPage,'rdHome').click();await action(settingsPage,'rdResume').click();
   assert.equal(await settingsPage.evaluate(()=>ReadingUI.engine().current().session.id),pendingSession);assert.equal(await settingsPage.evaluate(()=>ReadingUI.engine().current().session.paused),false);
   pass(name+'-reading-range-preserves-out-of-range-session');await settingsContext.close();

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
   await math(p,'AMC8-2000-24');const seen=[];
   await prepare(p,async task=>{
    if(['RTM-2000-24-DECISION','RTM-2000-24-CONTRAST'].includes(task.id)){
     seen.push(task.id);assert.equal(await p.locator('[data-rtm-given-diagram] svg').count(),1);
     assert.equal(await p.locator('[data-rtm-help-figure]').count(),0);
     for(const width of [320,768,1180]){await p.setViewportSize({width,height:900});const box=await p.locator('[data-rtm-given-diagram] svg').boundingBox();assert(box&&box.width>100&&box.x>=0&&box.x+box.width<=width+1)}
    }
   });
   assert.deepEqual(seen.sort(),['RTM-2000-24-CONTRAST','RTM-2000-24-DECISION']);
   await p.waitForFunction(()=>Array.from(document.querySelectorAll('[data-rtm-statement-image]')).length>0&&Array.from(document.querySelectorAll('[data-rtm-statement-image]')).every(x=>x.complete&&x.naturalWidth>0));
   pass(name+'-geometry-given-diagrams-before-help');await context.close();

   context=await browser.newContext({locale:'zh-CN'});p=await context.newPage();p.setDefaultTimeout(60000);
   const focus=['A01','A02','A03','A04','R01','G01','G02','G03'];await math(p,null,focus);
   const target=await p.evaluate(()=>({topics:ConnectedLearning.routeTopics(saved.rtm1.sessions.connected.target.routeId),selected:saved.topicPractice.selectedTopicIds}));
   assert(target.topics.some(id=>focus.includes(id)&&!['A01','A02'].includes(id)));assert.deepEqual(target.selected,focus);
   pass(name+'-selected-focus-remains-within-declared-knowledge',{routeTopics:target.topics});await context.close();

   context=await browser.newContext({locale:'zh-CN'});p=await context.newPage();p.setDefaultTimeout(60000);
   await math(p,'AMC8-2023-01',['A01','A02']);
   const wrongText=await p.evaluate(()=>saved.rtm1.sessions.active.definition.options.find(o=>o.id==='wrong1').text);
   await action(p,'rtmChoice','[data-value="wrong1"]').click();await action(p,'rtmSubmit').click();
   await p.waitForFunction(()=>saved.rtm1.sessions.active.feedback?.outcome==='INCORRECT');
   await action(p,'rtmRetry').click();await action(p,'rtmChoice','[data-value="valid"]').click();await action(p,'rtmSubmit').click();
   await p.waitForFunction(()=>saved.rtm1.sessions.active.feedback?.outcome==='VERIFIED');
   await action(p,'rtmBack').click();await p.locator('.topic-parent > summary').click();await action(p,'progress').click();
   const family=await p.locator('[data-math-activity]').innerText();assert(family.includes(wrongText));assert(!family.includes('本次首次提交：wrong1'));assert(family.includes('之后提交 1 次'));
   pass(name+'-family-view-translates-answer-and-keeps-retry');await context.close();

   context=await browser.newContext({locale:'zh-CN'});p=await context.newPage();p.setDefaultTimeout(60000);
   await p.goto(base);await action(p,'home').click();await action(p,'topicSelect').waitFor({state:'visible'});
   await p.locator('.topic-parent > summary').click();await action(p,'progress').click();
   await action(p,'course','[data-code="L03"]').click();
   const legacyTask=await p.evaluate(()=>taskNow());
   assert.equal(legacyTask.mode,'sequence');
   for(const token of legacyTask.answer)await action(p,'seqToken','[data-value="'+token+'"]').click();
   await action(p,'check').click();assert.equal(await p.evaluate(()=>saved.attempts.length),1);
   await action(p,'home').click();await p.evaluate(()=>{saved.topicPractice.selectedTopicIds=['A01','A02'];saved.topicPractice.sourceIds=['original'];saved.topicPractice.examIds=[];persist();render()});
   await action(p,'topicStart').click();await p.locator('.competition-question').waitFor({state:'visible'});
   const originalTask=await p.evaluate(()=>taskNow()),wrongIndex=(originalTask.answer+1)%5;
   await action(p,'competitionPick','[data-index="'+wrongIndex+'"]').click();await action(p,'check').click();
   await action(p,'competitionPick','[data-index="'+originalTask.answer+'"]').click();await action(p,'check').click();
   assert.equal(await p.evaluate(()=>saved.competition.attempts.length),2);
   await action(p,'home').click();await p.evaluate(()=>{saved.topicPractice.sourceIds=['AMC8'];saved.topicPractice.examIds=['AMC8-2023-01'];persist();render()});
   await action(p,'topicStart').click();await p.locator('[data-rtm-task]').waitFor({state:'visible'});
   const connectedWrong=await p.evaluate(()=>saved.rtm1.sessions.active.definition.options.find(o=>o.id==='wrong1').text);
   await action(p,'rtmChoice','[data-value="wrong1"]').click();await action(p,'rtmSubmit').click();
   await action(p,'rtmRetry').click();await action(p,'rtmChoice','[data-value="valid"]').click();await action(p,'rtmSubmit').click();
   const allRecords=await p.evaluate(()=>JSON.stringify({old:saved.attempts,competition:saved.competition.attempts,connected:saved.rtm1}));
   await action(p,'rtmBack').click();await p.locator('.topic-parent > summary').click();await action(p,'progress').click();
   const panelText=await p.locator('[data-math-activity]').textContent();
   assert(panelText.includes('旧路线提交 1 次；竞赛练习提交 2 次'));assert(panelText.includes(legacyTask.prompt));
   assert(panelText.includes(originalTask.prompt));assert(panelText.includes(originalTask.options[wrongIndex]));
   assert(panelText.includes('之后提交 1 次，最近答对'));assert(panelText.includes(connectedWrong));
   assert.equal(await p.evaluate(()=>JSON.stringify({old:saved.attempts,competition:saved.competition.attempts,connected:saved.rtm1})),allRecords);
   const backup=await p.evaluate(()=>progressSnapshot());assert.equal(backup.record.attempts.length,1);assert.equal(backup.record.competition.attempts.length,2);
   pass(name+'-family-three-sources-first-answer-retry-and-backup');await context.close();

   context=await browser.newContext({locale:'zh-CN'});p=await context.newPage();p.setDefaultTimeout(60000);await math(p,'AMC8-2023-01',['A01','A02']);
   const variantParent=await p.evaluate(()=>saved.rtm1.sessions.active.attemptId);await action(p,'rtmChoice','[data-value="valid"]').click();await action(p,'rtmSubmit').click();
   await action(p,'rtmVariant').waitFor({state:'visible'});await action(p,'rtmVariant').click();
   await p.waitForFunction(id=>saved.rtm1.sessions.active.attemptId!==id,variantParent);
   const variant=await p.evaluate(()=>({parent:saved.rtm1.sessions.active.relatedPracticeOf,help:saved.rtm1.sessions.active.priorMethodHelp,exposure:saved.rtm1.sessions.active.priorExposure}));
   assert.equal(variant.parent,variantParent);assert.equal(variant.help,false);assert.equal(variant.exposure,true);
   assert.equal(await p.evaluate(id=>Object.values(saved.rtm1.eventsById).some(e=>e.type==='problem_presented'&&e.relatedPracticeOf===id),variantParent),true);
   pass(name+'-reviewed-related-practice-links-parent');await context.close();

   context=await browser.newContext({locale:'zh-CN'});p=await context.newPage();p.setDefaultTimeout(60000);
   await math(p,'AMC8-2000-01');await action(p,'rtmNext').click();
   await p.locator('[data-connected-summary]').waitFor({state:'visible'});
   assert((await p.locator('[data-retained-count]').innerText()).includes('可继续的保留任务 1 项；暂停 0 项'));
   const retained=await p.evaluate(()=>({id:saved.rtm1.sessions.connected.deferredTargets[0].deferredId,attempt:saved.rtm1.sessions.connected.deferredTargets[0].sourceAttemptId,record:JSON.stringify(saved.rtm1)}));
   await p.evaluate(()=>{saved.topicPractice.sourceIds=[];persist();render()});
   assert((await p.locator('[data-retained-count]').innerText()).includes('可继续的保留任务 0 项；暂停 1 项'));
   assert.equal(await p.locator('[data-action="rtmConnectedRetry"]').count(),0);
   await action(p,'rtmReview').click();await p.locator('[data-rtm-history]').waitFor({state:'visible'});
   assert.equal(await p.evaluate(()=>JSON.stringify(saved.rtm1)),retained.record);
   await action(p,'rtmHistory').click();await action(p,'rtmReturn').click();
   await p.evaluate(()=>{saved.topicPractice.sourceIds=['AMC8'];persist();render()});
   await action(p,'rtmConnectedRetry').click();
   assert.equal(await p.evaluate(()=>saved.rtm1.sessions.connected.retryOf),retained.id);
   pass(name+'-retained-task-count-matches-current-scope');await context.close();

   context=await browser.newContext({locale:'zh-CN'});p=await context.newPage();p.setDefaultTimeout(60000);
   await p.goto(base);await action(p,'home').click();await action(p,'topicSelect').waitFor({state:'visible'});
   await p.evaluate(()=>{saved.topicPractice.selectedTopicIds=['A01','A02'];saved.topicPractice.sourceIds=['original'];saved.topicPractice.examIds=[];persist();render()});
   await action(p,'topicStart').click();await p.locator('.competition-question').waitFor({state:'visible'});
   for(let i=0;i<3;i++){
    const task=await p.evaluate(()=>taskNow());
    await action(p,'competitionPick','[data-index="'+task.answer+'"]').click();await action(p,'check').click();
    await p.waitForFunction(()=>topicCurrent()?.passed===true);
    if(i<2)await action(p,'next').click();
   }
   const beforeChallenge=await p.evaluate(()=>({level:taskNow().competition.level,signature:taskNow().competition.signature,attempts:JSON.stringify(saved.competition.attempts),selected:JSON.stringify(saved.topicPractice.selectedTopicIds)}));
   await action(p,'topicChallenge').waitFor({state:'visible'});await action(p,'topicChallenge').click();
   const afterChallenge=await p.evaluate(()=>({level:taskNow().competition.level,signature:taskNow().competition.signature,attempts:JSON.stringify(saved.competition.attempts),selected:JSON.stringify(saved.topicPractice.selectedTopicIds),allowed:SourceCatalog.taskAllowed(taskNow(),topicSessionSettings()).length}));
   assert(afterChallenge.level>beforeChallenge.level);assert.notEqual(afterChallenge.signature,beforeChallenge.signature);
   assert.equal(afterChallenge.attempts,beforeChallenge.attempts);assert.equal(afterChallenge.selected,beforeChallenge.selected);assert(afterChallenge.allowed>0);
   pass(name+'-optional-original-math-challenge-respects-scope');await context.close();

   context=await browser.newContext({locale:'zh-CN'});p=await context.newPage();p.setDefaultTimeout(60000);
   const ten=['A01','A02','A03','A04','R01','G01','G02','G03','C01','D01'];await math(p,null,ten);
   const topicTrace=[];
   for(let i=0;i<10;i++){
    const task=await p.evaluate(()=>saved.rtm1.sessions.active),routeTopics=await p.evaluate(()=>ConnectedLearning.routeTopics(saved.rtm1.sessions.connected.target.routeId));
    assert(routeTopics.every(id=>ten.includes(id)));topicTrace.push({id:task.id,routeTopics});
    if(task.kind==='training')assert((await p.locator('.rtm-task .page-head').innerText()).includes('作准备 · 对应'));
    const expected=task.kind==='exam'?answers.originals[task.examId]:answers.training[task.id];assert.notEqual(expected,undefined);
    await p.waitForFunction(()=>Array.from(document.querySelectorAll('[data-rtm-statement-image]')).every(img=>img.complete&&img.naturalWidth>0));
    if(task.definition.answerContract.kind==='choice')await action(p,'rtmChoice','[data-value="'+String(expected)+'"]').click();
    else await p.locator('[data-rtm-input="answer"]').fill(Array.isArray(expected)?expected.join(','):String(expected));
    await action(p,'rtmSubmit').click();await p.waitForFunction(()=>saved.rtm1.sessions.active.feedback?.outcome==='VERIFIED');
    await action(p,'rtmNext').click();
   }
   await p.locator('[data-connected-coverage]').waitFor({state:'visible'});
   assert.deepEqual(await p.evaluate(()=>saved.topicPractice.selectedTopicIds),ten);
   for(const id of ten.filter(x=>!['A01','A02'].includes(x)))assert(topicTrace.some(x=>x.routeTopics.includes(id)),id);
   pass(name+'-ten-topic-group-trace',{questions:topicTrace.length,focusTopics:8});await context.close();

   // Old Safari may lack Web Locks. Exercise the IndexedDB fallback with two
   // actual pages and the same origin, rather than granting two writers.
   context=await browser.newContext({locale:'zh-CN'});
   await context.addInitScript(()=>Object.defineProperty(Navigator.prototype,'locks',{configurable:true,get(){return undefined}}));
   const one=await context.newPage(),two=await context.newPage();one.setDefaultTimeout(60000);two.setDefaultTimeout(60000);
   await one.goto(base);await action(one,'home').click();await action(one,'topicSelect').waitFor({state:'visible'});await one.waitForFunction(()=>progressStore.getStatus()==='ready');
   await one.evaluate(()=>{saved.topicPractice.selectedTopicIds=['A01','A02'];persist()});
   const original=await one.evaluate(()=>localStorage.getItem(STORE));
   await two.goto(base);await action(two,'home').click();await action(two,'topicSelect').waitFor({state:'visible'});await two.waitForFunction(()=>progressStore.getStatus()==='read_only');
   assert.equal(await two.evaluate(()=>localStorage.getItem(STORE)),original);
   await one.close({runBeforeUnload:true});
   await two.waitForFunction(()=>!!localStorage.getItem(STORE+'_writer_released'));
   await action(two,'storageRetry').click();await two.waitForFunction(()=>progressStore.getStatus()==='ready');
   assert.equal(await two.evaluate(()=>localStorage.getItem(STORE)),original);
   assert.deepEqual(await two.evaluate(()=>saved.topicPractice.selectedTopicIds),['A01','A02']);
   pass(name+'-no-web-locks-two-tabs-and-safe-retry');await context.close();

   context=await browser.newContext({locale:'zh-CN'});
   await context.addInitScript(()=>Object.defineProperty(Navigator.prototype,'locks',{configurable:true,get(){return undefined}}));
   const owner=await context.newPage(),reader=await context.newPage();owner.setDefaultTimeout(60000);reader.setDefaultTimeout(60000);
   await owner.goto(base);await action(owner,'home').click();await action(owner,'topicSelect').waitFor({state:'visible'});await owner.waitForFunction(()=>progressStore.getStatus()==='ready');
   await reader.goto(base);await action(reader,'home').click();await action(reader,'topicSelect').waitFor({state:'visible'});await reader.waitForFunction(()=>progressStore.getStatus()==='read_only');
   await owner.evaluate(()=>{saved.topicPractice.selectedTopicIds=['A01'];persist()});
   const changed=await owner.evaluate(()=>localStorage.getItem(STORE));
   await reader.waitForFunction(()=>canPersist===false);await owner.close({runBeforeUnload:true});
   await action(reader,'storageRetry').click();assert.equal(await reader.evaluate(()=>localStorage.getItem(STORE)),changed);
   assert.equal(await reader.evaluate(()=>progressStore.getStatus()),'read_only');
   pass(name+'-no-web-locks-conflict-never-overwrites');await context.close();

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

   context=await browser.newContext({locale:'zh-CN'});p=await context.newPage();p.setDefaultTimeout(60000);
   await p.goto(base);await action(p,'reading').click();await action(p,'rdStart').waitFor({state:'visible'});
   await p.evaluate(()=>ReadingUI.engine().setting('pinyin','none'));await action(p,'rdStart').click();await action(p,'rdReadDone').click();
   const firstQuestion=await p.evaluate(()=>ReadingUI.engine().current().question);
   assert.equal(firstQuestion.ability,'sequence');
   for(const i of [...firstQuestion.answer].reverse())await action(p,'rdPick','[data-index="'+i+'"]').click();
   await action(p,'rdSubmit').click();const hintText=await p.locator('.rd-feedback').evaluate(el=>{const copy=el.cloneNode(true);copy.querySelectorAll('rt').forEach(rt=>rt.remove());return copy.textContent});assert(hintText.includes('先后顺序'));
   assert.equal(await p.evaluate(()=>ReadingUI.snapshot().events.filter(e=>e.kind==='feedback_hint').length),1);
   for(const i of firstQuestion.answer)await action(p,'rdPick','[data-index="'+i+'"]').click();
   await action(p,'rdSubmit').click();const submissions=await p.evaluate(()=>ReadingUI.engine().current().attempts);
   assert.equal(submissions.length,2);assert.equal(submissions[0].correct,false);assert.equal(submissions[1].correct,true);assert.equal(submissions[1].feedbackHintEver,true);
   await action(p,'rdNext').click();const secondQuestion=await p.evaluate(()=>ReadingUI.engine().current().question);
   await action(p,'rdPick','[data-index="'+secondQuestion.answer+'"]').click();await action(p,'rdSubmit').click();
   const nextFirst=await p.evaluate(()=>ReadingUI.engine().current().attempts[0]);assert.equal(nextFirst.first,true);assert.equal(nextFirst.independent,false);
   pass(name+'-reading-hint-preserves-first-and-independent-evidence');await context.close();

   context=await browser.newContext({locale:'zh-CN'});p=await context.newPage();p.setDefaultTimeout(60000);
   await p.goto(base);await action(p,'reading').click();await action(p,'rdStart').waitFor({state:'visible'});
   await p.evaluate(()=>{ReadingUI.engine().setting('pinyin','none');ReadingUI.engine().setting('dayRange',{start:35,end:35});window.__AMC8_READING_HOST.render()});
   await action(p,'rdStart').click();await action(p,'rdReadDone').click();
   for(let i=0;i<3;i++){
    const q=await p.evaluate(()=>ReadingUI.engine().current().question);
    if(q.type==='order')for(const index of q.answer)await action(p,'rdPick','[data-index="'+index+'"]').click();
    else await action(p,'rdPick','[data-index="'+q.answer+'"]').click();
    await action(p,'rdSubmit').click();await action(p,'rdNext').click();
   }
   const daysBefore=await p.evaluate(()=>ReadingUI.report().completedDays);
   assert.equal(await p.evaluate(()=>ReadingUI.engine().challenge().eligible),true);
   assert.equal(await p.locator('[data-action="rdChallenge"]').count(),0);
   await p.evaluate(()=>{ReadingUI.engine().setting('dayRange',{start:43,end:43});window.__AMC8_READING_HOST.render()});
   await action(p,'rdChallenge').waitFor({state:'visible'});await action(p,'rdChallenge').click();
   assert.equal(await p.evaluate(()=>ReadingUI.engine().current().session.purpose),'optional-challenge');
   assert.equal(await p.evaluate(()=>ReadingUI.engine().current().session.priorExposure['R-D043-S1']),false);
   await action(p,'rdReadDone').click();
   for(let i=0;i<3;i++){
    const q=await p.evaluate(()=>ReadingUI.engine().current().question);
    if(q.type==='order')for(const index of q.answer)await action(p,'rdPick','[data-index="'+index+'"]').click();
    else await action(p,'rdPick','[data-index="'+q.answer+'"]').click();
    await action(p,'rdSubmit').click();await action(p,'rdNext').click();
   }
   assert.equal(await p.evaluate(()=>ReadingUI.report().completedDays),daysBefore);
   assert.equal(await p.evaluate(()=>ReadingUI.snapshot().events.filter(e=>e.type==='session_complete').at(-1).day),null);
   pass(name+'-optional-reading-challenge-respects-range-and-course-count');await context.close();

   context=await browser.newContext({locale:'zh-CN'});p=await context.newPage();p.setDefaultTimeout(60000);
   await p.goto(base);await action(p,'home').click();await action(p,'topicSelect').waitFor({state:'visible'});
   await action(p,'topicParentUnlock').click();await action(p,'topicSelect','[data-code="A01"]').click();await action(p,'topicSelect','[data-code="A02"]').click();await action(p,'topicStart').click();
   await p.locator('[data-rtm-task]').waitFor({state:'visible'});const taskId=await p.evaluate(()=>saved.rtm1.sessions.active.attemptId);
   const choice=await action(p,'rtmChoice').getAttribute('data-value');await action(p,'rtmChoice').click();
   const originalEvents=await p.evaluate(()=>JSON.stringify(saved.rtm1.eventsById));
   await action(p,'reading').click();await action(p,'rdParent').waitFor({state:'visible'});await action(p,'rdParent').click();await p.locator('#rd-diagnostic').waitFor({state:'visible'});
   await p.goBack();
   try{await action(p,'rdPlan').waitFor({state:'visible',timeout:15000})}
   catch(error){console.error('history diagnostics',await p.evaluate(()=>({state:history.state,length:history.length,view:window.__AMC8_READING_HOST?.view,body:document.querySelector('#app')?.innerText?.slice(0,500)})));throw error}
   await p.goBack();await p.locator('[data-rtm-task]').waitFor({state:'visible'});
   assert.equal(await p.evaluate(()=>saved.rtm1.sessions.active.attemptId),taskId);assert.equal(await p.evaluate(()=>saved.rtm1.sessions.active.input),choice);assert.equal(await p.evaluate(()=>JSON.stringify(saved.rtm1.eventsById)),originalEvents);
   await p.goBack();await action(p,'topicSelect').waitFor({state:'visible'});await p.goBack();await p.locator('[data-home-hub]').waitFor({state:'visible'});
   await p.goForward();await action(p,'topicSelect').waitFor({state:'visible'});await p.goForward();await p.locator('[data-rtm-task]').waitFor({state:'visible'});
   await p.reload();await p.locator('[data-rtm-task]').waitFor({state:'visible'});assert.equal(await p.evaluate(()=>saved.rtm1.sessions.active.attemptId),taskId);assert.equal(await p.evaluate(()=>saved.rtm1.sessions.active.input),choice);assert.equal(await p.evaluate(()=>JSON.stringify(saved.rtm1.eventsById)),originalEvents);
   pass(name+'-history-back-forward-and-refresh-preserve-math-draft');await context.close();

   context=await browser.newContext({locale:'zh-CN'});p=await context.newPage();p.setDefaultTimeout(60000);
   await p.goto(base);await action(p,'reading').click();await action(p,'rdStart').waitFor({state:'visible'});await action(p,'rdStart').click();await action(p,'rdReadDone').click();
   const readingSession=await p.evaluate(()=>ReadingUI.engine().current().session.id),questionId=await p.evaluate(()=>ReadingUI.engine().current().question.id);
   await action(p,'rdPick','[data-index="0"]').click();const draft=await p.evaluate(id=>ReadingUI.engine().current().session.drafts[id],questionId);
   const evidenceBefore=await p.evaluate(()=>ReadingUI.snapshot().events.filter(e=>e.type==='attempt'||e.type==='material_open').map(e=>e.id));
   await action(p,'rdHome').click();await action(p,'rdParent').click();await p.locator('#rd-diagnostic').waitFor({state:'visible'});
   await p.goBack();await action(p,'rdPlan').waitFor({state:'visible'});await p.goBack();await action(p,'rdSubmit').waitFor({state:'visible'});
   assert.equal(await p.evaluate(()=>ReadingUI.engine().current().session.id),readingSession);assert.deepEqual(await p.evaluate(id=>ReadingUI.engine().current().session.drafts[id],questionId),draft);
   assert.deepEqual(await p.evaluate(()=>ReadingUI.snapshot().events.filter(e=>e.type==='attempt'||e.type==='material_open').map(e=>e.id)),evidenceBefore);
   pass(name+'-history-restores-reading-draft-without-new-exposure');await context.close();

   context=await browser.newContext({locale:'zh-CN'});p=await context.newPage();p.setDefaultTimeout(60000);
   await p.goto(base);await action(p,'home').click();await action(p,'topicSelect').waitFor({state:'visible'});await p.waitForFunction(()=>progressStore.getStatus()==='ready');
   await p.evaluate(()=>{saved.topicPractice.selectedTopicIds=['A01','A02'];saved.topicPractice.sourceIds=['original'];saved.topicPractice.examIds=[];persist();render()});await action(p,'topicStart').click();
   await p.locator('.competition-question').waitFor({state:'visible'});await action(p,'competitionPick').click();
   const competitionBefore=await p.evaluate(()=>({session:topicSession().id,cursor:topicSession().cursor,draft:JSON.stringify(topicCurrent().draft),views:JSON.stringify(saved.competition.views),attempts:JSON.stringify(saved.competition.attempts)}));
   await action(p,'reading').click();await action(p,'rdPlan').waitFor({state:'visible'});await p.goBack();await p.locator('.competition-question').waitFor({state:'visible'});
   const competitionAfter=await p.evaluate(()=>({session:topicSession().id,cursor:topicSession().cursor,draft:JSON.stringify(topicCurrent().draft),views:JSON.stringify(saved.competition.views),attempts:JSON.stringify(saved.competition.attempts)}));
   assert.deepEqual(competitionAfter,competitionBefore);pass(name+'-history-restores-competition-draft');await context.close();

   context=await browser.newContext({locale:'zh-CN'});p=await context.newPage();p.setDefaultTimeout(60000);
   await p.goto('data:text/html,<title>previous page</title>');await p.goto(base+'#math');await action(p,'topicSelect').waitFor({state:'visible'});await p.goBack();assert(p.url().startsWith('data:text/html,'));
   pass(name+'-direct-entry-back-leaves-site');await context.close();
  }finally{await browser.close()}
 }
 report.result='PASS';
}
main().catch(e=>{report.result='FAIL';report.error=e.stack;console.error(e);process.exitCode=1}).finally(()=>{
 fs.writeFileSync(path.join(out,'fix79-browser-result.json'),JSON.stringify(report,null,2)+'\n');if(server)server.close();
});
