'use strict';
// Genuine HTTP/Playwright only. Never download a browser or replace screenshots
// with VM/HTML output. Run on a host with an installed supported browser.
const fs=require('fs'),path=require('path'),assert=require('assert');
const {scopes}=require('./rc67_test_scopes');
const {COMPETITION_REVIEWED:families,competitionCreate:create,competitionReviewedRecipe:recipe}=require('./competition_reviewed');
const {designOracle}=require('./competition_design_oracles');
const directory=path.resolve(process.env.AMC8_BROWSER_EVIDENCE||'docs/evidence/2026-10-08-rc67-full/browser');fs.mkdirSync(directory,{recursive:true});
const url=process.env.AMC8_LOCAL_URL||'http://127.0.0.1:8768';assert.equal(new URL(url).hostname,'127.0.0.1','Only an isolated local HTTP server is allowed');
const report={result:'running',url,startedAt:new Date().toISOString(),engine:null,normalAppearances:0,scopeRounds:[],layoutCases:[],coreCases:[],screenshots:[],failures:[],consoleErrors:[],resourceErrors:[],activeCase:null,audio:'Scripts, visibility gates and cancellation only; no human listening',device:'Browser viewport simulation; no iPad/Safari device claim',humanReviewRequired:false,publicDeployment:false};
const write=()=>{report.updatedAt=new Date().toISOString();fs.writeFileSync(path.join(directory,'browser-results.json'),JSON.stringify(report,null,2)+'\n');};
const num=s=>String(s).split('/').map(Number).reduce((a,b)=>a/b);
(async()=>{
 let browser,activePage;
 try{
  const playwright=require('playwright');browser=await playwright.chromium.launch({headless:true,...(process.env.AMC8_BROWSER_EXECUTABLE?{executablePath:process.env.AMC8_BROWSER_EXECUTABLE}:{})});report.engine='Chromium '+browser.version();
 }catch(error){report.result='blocked';report.blocker=String(error.message);write();console.log('BROWSER BLOCKED: '+report.blocker.split('\n')[0]);process.exitCode=2;return;}
 function captureErrors(page){page.on('pageerror',e=>report.consoleErrors.push(String(e)));page.on('console',m=>{if(m.type()==='error')report.consoleErrors.push(m.text())});page.on('response',r=>{if(r.status()>=400)report.resourceErrors.push({url:r.url(),status:r.status()})});}
 const button=(page,action,index)=>page.locator('[data-action="'+action+'"]'+(index===undefined?'':'[data-index="'+index+'"]')).first();
 async function launch(context){const page=await context.newPage();activePage=page;captureErrors(page);const response=await page.goto(url);assert.equal(response.status(),200);await page.waitForSelector('[data-action="topicSelect"]');assert.equal(await page.evaluate(()=>STORE),'tianle_amc8_rc67_local_v1','Browser tests must use isolated local bundle');assert.equal(await page.evaluate(()=>localStorage.getItem('tianle_amc8_question_design_v1')),null);assert.equal(await page.evaluate(()=>window.__AMC8_RELEASE.siteVersion),require('./version.json').siteVersion);return page;}
 async function select(page,ids){if(await button(page,'topicExit').count())await button(page,'topicExit').click();if(await button(page,'topicClear').count())await button(page,'topicClear').click();for(const code of ids)await page.locator('[data-action="topicSelect"][data-code="'+code+'"]').click();await button(page,'topicStart').click();}
 async function solve(page,correct=true){const answer=await page.evaluate(()=>taskNow().answer);await button(page,'competitionPick',correct?answer:(answer+1)%5).click();await button(page,'check').click();assert.equal(await page.evaluate(()=>feedback.ok),correct);}
 async function layout(page,label){
  report.activeCase={...report.activeCase,label};
  const boxes=await page.evaluate(()=>{
   const visible=e=>{const s=getComputedStyle(e),b=e.getBoundingClientRect();return s.display!=='none'&&s.visibility!=='hidden'&&b.width>0&&b.height>0&&!e.closest('details:not([open])')};
   const errors=[],figures=[];
   if(document.documentElement.scrollWidth>innerWidth+1)errors.push('Page horizontal overflow');
   for(const e of document.querySelectorAll('.competition-question figure,.competition-question svg,.competition-material-table')){
    if(!visible(e))continue;const b=e.getBoundingClientRect();figures.push({tag:e.tagName,kind:e.getAttribute('data-scene')||e.className.baseVal||e.className,x:b.x,y:b.y,width:b.width,height:b.height});
    if(b.left<-.5||b.right>innerWidth+.5)errors.push('Figure outside viewport: '+e.tagName);
   }
   for(const e of document.querySelectorAll('.task-title,.feedback,.competition-options button,.competition-scene figcaption')){
    if(!visible(e))continue;const b=e.getBoundingClientRect(),s=getComputedStyle(e);if(b.left<0||b.right>innerWidth+1)errors.push('Text clipped at page edge: '+e.textContent.slice(0,45));if(parseFloat(s.fontSize)<12)errors.push('Critical text font too small');
   }
   for(const e of document.querySelectorAll('.competition-actions .primary,.topic-choice,.topic-start .primary')){if(!visible(e))continue;const b=e.getBoundingClientRect();if(b.width<43||b.height<43)errors.push('Primary touch target below 44px');}
   for(const svg of document.querySelectorAll('.competition-question svg')){
    if(!visible(svg))continue;const v=svg.viewBox.baseVal;
    for(const text of svg.querySelectorAll('text')){const b=text.getBBox();if(b.width&&((b.x<v.x-1)||(b.x+b.width>v.x+v.width+1)||(b.y<v.y-1)||(b.y+b.height>v.y+v.height+1)))errors.push('SVG label outside viewBox: '+text.textContent);}
   }
   return {width:innerWidth,errors,figures};
  });
  assert.deepStrictEqual(boxes.errors,[],label+' '+JSON.stringify(boxes.errors));assert(boxes.figures.length,label+' missing visible relation figure');return boxes;
 }
 async function screenshot(page,name){const file=name+'.png';await page.screenshot({path:path.join(directory,file),fullPage:true});report.screenshots.push(file);}
 try{
  for(let n=0;n<scopes.length;n++){
   report.activeCase={kind:'normal',scopeIndex:n+1,scope:scopes[n].ids};
   const scope=scopes[n],context=await browser.newContext({viewport:{width:1024,height:820}}),page=await launch(context);await select(page,scope.ids);const rows=[];
   for(let i=0;i<10;i++){
    const task=await page.evaluate(()=>taskNow()),c=task.competition,f=families.find(x=>x.id===c.recipe.familyId),e=designOracle(task,f);assert(c.topicIds.every(x=>scope.ids.includes(x)));assert(Math.abs(num(c.answer)-e.answer)<1e-8);assert(Math.abs(num(c.extension.answer)-e.extension)<1e-8);
    const initial=await layout(page,scope.ids+' initial');
    if(i===0){await solve(page,false);await button(page,'competitionHint').click();await button(page,'competitionHintMore').click();await button(page,'competitionReadHint').click();await button(page,'competitionStopSpeech').click();await page.locator('.competition-notes summary').click();await page.locator('[data-competition-input="notes"]').fill('自动浏览器刷新草稿');await page.reload();await button(page,'topicResume').click();assert.equal(await page.evaluate(()=>taskNow().id),task.id);assert.equal(await page.evaluate(()=>feedback.ok),false);assert.equal(await page.locator('[data-competition-input="notes"]').inputValue(),'自动浏览器刷新草稿');}
    await solve(page);await layout(page,scope.ids+' solution');
    if(i===0){await page.locator('.competition-extension summary').click();await page.locator('[data-competition-input="extension"]').fill('999999999');await button(page,'competitionExtensionCheck').click();assert.equal(await page.evaluate(()=>draft.work.extensionResult.ok),false);await page.locator('[data-competition-input="extension"]').fill(c.extension.answer);await button(page,'competitionExtensionCheck').click();assert.equal(await page.evaluate(()=>draft.work.extensionResult.ok),true);await screenshot(page,'scope-'+String(n+1).padStart(2,'0'));}
    rows.push({recipe:c.recipe,initial});report.normalAppearances++;await button(page,'next').click();
    if(i===4){const id=await page.evaluate(()=>taskNow().id),count=await page.evaluate(()=>saved.competition.attempts.length);await button(page,'topicPrevious').click();assert.equal(await page.evaluate(()=>taskNow().id),task.id);await button(page,'next').click();assert.equal(await page.evaluate(()=>taskNow().id),id);assert.equal(await page.evaluate(()=>saved.competition.attempts.length),count);}
   }
   assert.equal(await page.evaluate(()=>view),'topicSummary');assert.equal(await page.evaluate(()=>localStorage.getItem('tianle_amc8_question_design_v1')),null);report.scopeRounds.push({kind:scope.kind,scope:scope.ids,questions:rows});await context.close();write();console.log('Normal scopes '+report.scopeRounds.length+'/'+scopes.length+'; questions '+report.normalAppearances+'/590');
  }
  assert.equal(report.normalAppearances,590);
  // Actual rendered family layouts at all three required widths; fixture
  // coverage is recorded separately from normal-entry coverage above.
  for(const width of [320,768,1024]){
   const context=await browser.newContext({viewport:{width,height:900}}),page=await launch(context);
   for(const f of families){
    report.activeCase={kind:'family-layout',width,familyId:f.id};
    const task=create(recipe(f.id,1));await page.evaluate(t=>{saved.topicPractice.session={mode:'competition-v2',id:'browser-fixture-'+t.id,topicIds:t.competition.topicIds,planSeed:1,total:10,cursor:0,items:[{view:'competition',code:t.id,taskId:t.id,contentVersion:t.contentVersion,recipe:t.competition.recipe,openedAt:Date.now(),passed:false}]};topicOpenCurrent();},task);
    const cases=[{stage:'initial',geometry:await layout(page,f.id+' initial')}];await screenshot(page,width+'-'+f.id+'-initial');
    await button(page,'competitionHint').click();await button(page,'competitionHintMore').click();cases.push({stage:'hint',geometry:await layout(page,f.id+' hint')});await solve(page);
    for(let route=0;route<task.competition.methods.length;route++){
     await button(page,'competitionMethod',route).click();assert.equal(await page.evaluate(()=>draft.work.method),route);for(let step=0;step<task.competition.methods[route].steps.length;step++){await button(page,'competitionStep',step).click();assert.equal(await page.evaluate(()=>draft.work.step),step);cases.push({stage:'solution',route,step,geometry:await layout(page,f.id+' method '+route+' step '+step)});}
    }
    await page.locator('.competition-extension summary').click();cases.push({stage:'variation',geometry:await layout(page,f.id+' variation')});await screenshot(page,width+'-'+f.id+'-variation');await page.locator('[data-competition-input="extension"]').fill(task.competition.extension.answer);await button(page,'competitionExtensionCheck').click();cases.push({stage:'variation-solution',geometry:await layout(page,f.id+' variation solution')});
    assert.equal(await page.evaluate(()=>draft.work.extensionResult.ok),true);report.layoutCases.push({width,familyId:f.id,recipe:task.competition.recipe,cases});write();if(report.layoutCases.length%10===0)console.log('Family-width cases '+report.layoutCases.length+'/420');
   }await context.close();write();
  }
  for(const width of [375,1180]){
   const context=await browser.newContext({viewport:{width,height:900}}),page=await launch(context);
   for(const ids of [['A03'],['R02'],['R01','D02'],['G01'],['G03'],['S01']]){report.activeCase={kind:'core-flow',width,scope:ids};await select(page,ids);await layout(page,'core '+width+' initial');await solve(page,false);await button(page,'competitionHint').click();await button(page,'competitionHintMore').click();await layout(page,'core '+width+' hint');await solve(page);await page.locator('.competition-extension summary').click();await layout(page,'core '+width+' variation');await screenshot(page,width+'-core-'+ids.join('-'));await button(page,'next').click();report.coreCases.push({width,scope:ids,result:'passed'});write();}
   await context.close();
  }
  assert.deepStrictEqual(report.consoleErrors,[]);assert.deepStrictEqual(report.resourceErrors,[]);assert.equal(report.layoutCases.length,420);assert.equal(report.coreCases.length,12);report.result='passed';report.activeCase=null;
 }catch(error){report.result='failed';report.failures.push({case:report.activeCase,message:error.message,stack:error.stack});if(activePage&&!activePage.isClosed()){try{await screenshot(activePage,'failure');fs.writeFileSync(path.join(directory,'failure.html'),await activePage.content());}catch(captureError){report.failures.push({message:'Failure capture: '+captureError.message});}}process.exitCode=1;}
 finally{report.finishedAt=new Date().toISOString();await browser.close();write();}
 console.log('RC67 real browser: '+report.result+'; '+report.normalAppearances+' normal appearances; '+report.layoutCases.length+' family-width cases');
 console.log('RC67 browser diagnostics: '+JSON.stringify({engine:report.engine,normalAppearances:report.normalAppearances,scopes:report.scopeRounds.length,layoutCases:report.layoutCases.length,coreCases:report.coreCases.length,screenshots:report.screenshots.length,failures:report.failures,consoleErrors:report.consoleErrors,resourceErrors:report.resourceErrors,activeCase:report.activeCase}));
})();
