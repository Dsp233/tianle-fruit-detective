'use strict';
const fs=require('fs'),path=require('path'),assert=require('assert/strict'),{chromium}=require('playwright');
const root=path.resolve(process.env.HOME_CANDIDATE||'.'),out=path.resolve(process.env.HOME_EVIDENCE||'tmp/home-r1/native'),H=require(root+'/source/rc79_native_helpers');
fs.mkdirSync(out,{recursive:true});
async function run(){
 let env,local;const observations={schema:1,release:require(root+'/source/version.json').candidateId,scope:process.env.PUBLIC_BASE?'ACTUAL_PUBLIC_WEBSITE':'FROZEN_CANDIDATE_NATIVE_BROWSER',physicalDevice:'NOT_TESTED',audibleVoice:'NOT_TESTED',realChild:'NOT_TESTED'};
 try{
  if(process.env.PUBLIC_BASE){env={base:process.env.PUBLIC_BASE,browser:await chromium.launch({headless:true,executablePath:process.env.AMC8_BROWSER_EXECUTABLE})}}else{local=await require(root+'/source/native_browser_support').start(root,path.join(out,'preflight'));assert(local);env=local}
  const c=await env.browser.newContext({locale:'zh-CN',viewport:{width:1180,height:900}}),p=await c.newPage();p.setDefaultTimeout(20000);
  await p.goto(env.base+'/',{waitUntil:'domcontentloaded'});await H.ready(p);assert.equal(await p.locator('[data-home-hub] .dojo-path').count(),2);assert.equal(await p.locator('[data-action="topicSelect"]').count(),0);await p.locator('.dojo-art').evaluate(img=>img.decode());
  await p.screenshot({path:path.join(out,'home-desktop.png'),fullPage:true});
  await p.getByRole('button',{name:'进入阅读训练',exact:true}).click();assert.equal(await p.evaluate(()=>view),'reading');assert(await p.locator('ruby').count()>0);await p.screenshot({path:path.join(out,'reading-door.png'),fullPage:true});
  await H.click(p,'hubHome');await p.getByRole('button',{name:'进入数学侦探',exact:true}).click();
  for(const code of ['A01','R01','G01'])await H.click(p,'topicSelect',{code});
  assert.equal(await p.locator('[data-action="topicStart"]').first().isDisabled(),true);assert((await p.locator('[data-selection-reason]').innerText()).includes('四则与运算意义'));assert.deepEqual(await p.evaluate(()=>saved.topicPractice.selectedTopicIds),['A01','R01','G01']);
  await p.screenshot({path:path.join(out,'specific-selection-explanation.png'),fullPage:true});
  await H.click(p,'topicSelect',{code:'A02'});assert.equal(await p.locator('[data-action="topicStart"]').first().isDisabled(),false);await H.click(p,'topicStart');assert.equal(await p.evaluate(()=>view),'examMapping');
  const trail=await H.original(p),original=await H.rtmAnswer(p);await p.screenshot({path:path.join(out,'mixed-selection-actual-question.png'),fullPage:true});
  await H.click(p,'home');const before=await p.evaluate(()=>({competition:saved.competition,rtm:saved.rtm1}));await H.click(p,'reading');await H.click(p,'hubHome');await H.click(p,'home');assert.deepEqual(await p.evaluate(()=>({competition:saved.competition,rtm:saved.rtm1})),before);
  await p.reload({waitUntil:'domcontentloaded'});await H.ready(p);assert.equal(await p.locator('[data-home-hub]').count(),1);await H.click(p,'home');assert.deepEqual(await p.evaluate(()=>({competition:saved.competition,rtm:saved.rtm1})),before);await c.close();
  observations.learningJourney={result:'PASS',twoDoors:true,readingPinyin:true,mixedSelection:{blocked:['A01','R01','G01'],requiredDeclaration:'A02',valid:['A01','A02','R01','G01']},preparationTrail:trail,original,realControls:true,recordsPreservedAcrossNavigationAndReload:true};
  observations.viewports=[];
  for(const width of [320,768,1180]){const context=await env.browser.newContext({locale:'zh-CN',viewport:{width,height:1000}}),page=await context.newPage();await page.goto(env.base+'/',{waitUntil:'domcontentloaded'});await H.ready(page);await page.locator('.dojo-art').evaluate(img=>img.decode());const box=await page.evaluate(()=>({scroll:document.documentElement.scrollWidth,width:innerWidth}));assert(box.scroll<=box.width+1);assert.equal(await page.locator('.dojo-path').count(),2);await page.screenshot({path:path.join(out,'home-'+width+'.png'),fullPage:true});observations.viewports.push({width,horizontalOverflow:false,bothDoors:true});await context.close()}
  observations.result='PASS';
 }catch(e){observations.result='FAIL';observations.error=e.stack;process.exitCode=1;}finally{if(local)await local.close();else if(env)await env.browser.close();fs.writeFileSync(path.join(out,'native-result.json'),JSON.stringify(observations,null,2)+'\n');console.log(JSON.stringify(observations));}
}
run().catch(e=>{console.error(e);process.exitCode=1});
