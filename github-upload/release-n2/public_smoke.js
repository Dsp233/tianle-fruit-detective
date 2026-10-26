'use strict';
const fs=require('fs'),path=require('path'),assert=require('assert/strict'),{chromium}=require('playwright');
const root=path.join(process.env.RUNNER_TEMP,'public-candidate'),out=path.join(process.env.RUNNER_TEMP,'public-verification'),base=process.env.PUBLIC_BASE;
const H=require(root+'/source/rc79_native_helpers');
async function run(){
 const browser=await chromium.launch({executablePath:process.env.AMC8_BROWSER_EXECUTABLE,headless:true});
 const observations={schema:1,scope:'PUBLIC_SITE_WITH_ISOLATED_SYNTHETIC_BROWSER_STORAGE',publicUrl:base+'/',productionMain:process.env.EXPECTED_MAIN,physicalDevice:'NOT_TESTED',audibleVoice:'NOT_TESTED',realChild:'NOT_TESTED'};
 try{
  const context=await browser.newContext({locale:'zh-CN',viewport:{width:1180,height:900}}),page=await context.newPage();
  await page.goto(base+'/',{waitUntil:'domcontentloaded'});await H.ready(page);
  const release=await page.evaluate(()=>window.__AMC8_RELEASE);
  assert.equal(release.candidateId,'RC79-A9-READING-R1.2-N2');assert.equal(release.features.chineseReadingR1,true);assert.equal(release.features.examMappingV1,true);
  await page.screenshot({path:path.join(out,'production-home.png'),fullPage:true});
  await H.click(page,'reading');assert.equal(await page.evaluate(()=>view),'reading');assert(await page.locator('ruby').count()>0);
  await page.screenshot({path:path.join(out,'production-reading.png'),fullPage:true});
  await H.click(page,'home');assert.equal(await page.evaluate(()=>view),'home');
  observations.productionNavigation={result:'PASS',candidateId:release.candidateId,mathToReadingAndBack:true,pinyinVisible:true};
  await context.close();
  const env={browser,base},qa=await H.context(env),q=await H.normal(env,qa);
  await H.connect(q,'AMC8-2003-01');const preparationTrail=await H.original(q);await H.rtmAnswer(q);
  await H.click(q,'home');const before=await q.evaluate(()=>JSON.stringify({competition:saved.competition,rtm:saved.rtm1}));
  await H.click(q,'reading');assert.equal(await q.evaluate(()=>view),'reading');await H.click(q,'home');
  assert.equal(await q.evaluate(()=>JSON.stringify({competition:saved.competition,rtm:saved.rtm1})),before);
  observations.publicQaJourney={result:'PASS',original:'AMC8-2003-01',preparationTrail,submittedThroughActualControls:true,mathEvidencePreservedAcrossReading:true};
  await q.screenshot({path:path.join(out,'public-qa-after-reading-roundtrip.png'),fullPage:true});await qa.close();
  observations.result='PASS';
 }catch(e){observations.result='FAIL';observations.error=e.stack;process.exitCode=1;}finally{await browser.close();fs.mkdirSync(out,{recursive:true});fs.writeFileSync(path.join(out,'public-native-smoke.json'),JSON.stringify(observations,null,2)+'\n');console.log(JSON.stringify(observations));}
}
run().catch(e=>{console.error(e);process.exitCode=1});
