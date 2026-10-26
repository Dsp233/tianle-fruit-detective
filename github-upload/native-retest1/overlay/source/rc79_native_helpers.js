'use strict';
const assert=require('assert/strict'),fs=require('fs'),path=require('path'),K=require('./skills.json'),V=require('./version.json'),A=require('../docs/rc79/fixtures/independent-mapping-answers.json');
const version=V.siteVersion.match(/rc\.(\d+)/)[1],all=K.units.map(u=>u.id);
async function ready(page){await page.waitForFunction(()=>progressStore.getStatus()==='ready')}
async function reveal(locator){for(let i=0;i<8;i++){const ancestors=locator.locator('xpath=ancestor::details[not(@open)]');if(!await ancestors.count())return;await ancestors.first().locator(':scope > summary').click()}throw Error('Closed details still block the actual control')}
async function click(page,action,attrs={}){let selector='[data-action='+JSON.stringify(action)+']';for(const [k,v] of Object.entries(attrs))selector+='[data-'+k+'='+JSON.stringify(String(v))+']';const loc=page.locator(selector).first();await reveal(loc);await loc.click()}
async function context(env,profile={selectedTopics:all,sourceIds:['AMC8']}){const context=await env.browser.newContext({locale:'zh-CN',viewport:{width:1180,height:900}});await context.addInitScript(({version,revision,profile})=>{
 const key='tianle_amc8_qa_normal_rc'+version+'_v1';if(localStorage.getItem(key)===null)localStorage.setItem(key,JSON.stringify(profile.fixtureRecord||{contentRevision:revision,storageVersion:2,topicPractice:{selectedTopicIds:profile.selectedTopics,excludedSkillIds:profile.excludedSkillIds||[],sourceIds:profile.sourceIds,examIds:profile.examIds||[],nextSeed:1},competition:{attempts:[],extensions:[]}}));
 window.__rc79Speech=[];window.__rc79Stops=0;Object.defineProperty(window,'speechSynthesis',{configurable:true,value:{speak:u=>window.__rc79Speech.push(u.text),cancel:()=>window.__rc79Stops++,pause(){},resume(){},paused:false}});window.SpeechSynthesisUtterance=class{constructor(text){this.text=text}};
 },{version,revision:V.contentRevision,profile});return context}
async function normal(env,c){const p=await c.newPage();p.setDefaultTimeout(15000);await p.goto(env.base+'/qa/normal/',{waitUntil:'domcontentloaded'});await ready(p);return p}
async function configure(page,profile){
 if(await page.evaluate(()=>view!=='home'))await click(page,'home');
 await click(page,'topicClear');for(const code of profile.selectedTopics)await click(page,'topicSelect',{code});
 for(const id of ['AMC8','original']){const selected=await page.evaluate(id=>(saved.topicPractice.sourceIds||[]).includes(id),id);if(selected!==profile.sourceIds.includes(id))await click(page,'sourceToggle',{code:id})}
 const current=await page.evaluate(()=>saved.topicPractice.excludedSkillIds||[]),desired=profile.excludedSkillIds||[];
 for(const code of new Set([...current,...desired]))if(current.includes(code)!==desired.includes(code))await click(page,'sourceSkillToggle',{code});
 if(profile.examId){const picker=page.locator('[data-source-exam-picker]');await reveal(picker);await picker.selectOption(profile.examId)}
 return page.evaluate(()=>SourceCatalog.profile({...saved.topicPractice,topicIds:saved.topicPractice.selectedTopicIds}));
}
async function blockedStart(page){
 const button=page.locator('[data-action="topicStart"]').first();await reveal(button);
 assert.equal(await button.isDisabled(),true,'No eligible supply must disable the visible start control');
 assert.equal(await page.evaluate(()=>view),'home');assert.equal(await page.locator('[data-rtm-task]').count(),0);
}
async function openMicro(page,code){
 if(await page.evaluate(()=>view!=='home'))await click(page,'home');await click(page,'knowledge');
 await click(page,'network',{code:code.split('.')[0]});await click(page,'micro',{code});
 assert.equal(await page.evaluate(()=>view),'micro');
}
function recordSnapshot(value){
 const copy=JSON.parse(JSON.stringify(value));
 // Missing optional time and explicit null are equivalent only for an unseen solution.
 // Persisted records are also compared exactly at the reload boundary.
 for(const row of Object.values(copy.views||{}))if(row.solutionViewed===false&&!Object.prototype.hasOwnProperty.call(row,'solutionViewedAt'))row.solutionViewedAt=null;
 return copy;
}
async function qa(env,page,{familyId,seed,generatorRevision=3,configurationId,personaId,fresh=false}){if(!page.url().includes('/qa/index.html')){const query=new URLSearchParams({familyId,seed:String(seed),generatorRevision:String(generatorRevision),...(configurationId&&configurationId!=='default'?{configuration:configurationId}:{}),...(personaId?{personaId}:{})});await page.goto(env.base+'/qa/index.html?'+query,{waitUntil:'domcontentloaded'})}await ready(page);await page.locator('#qa-family').selectOption(familyId);if(configurationId&&configurationId!=='default')await page.locator('#qa-configuration').selectOption(configurationId);await page.locator('#qa-seed').fill(String(seed));await page.locator('#qa-revision').selectOption(String(generatorRevision));await page.locator('#qa-persona').selectOption(personaId||'');await page.locator(fresh?'#qa-fresh':'#qa-form button[type=submit]').click();await page.locator('[data-action="check"]').first().waitFor();return task(page)}
async function task(page){return page.evaluate(()=>{const t=taskNow(),c=t.competition;return {id:t.id,options:t.options,signature:c.signature,familyId:c.family,configurationId:c.configurationId||c.recipe.configurationId||'default',recipe:c.recipe,math:c.math,prompt:c.prompt,topicProfile:topicSessionSettings()}})}
async function choose(page,value){const t=await task(page),index=t.options.findIndex(x=>String(x)===String(value));assert(index>=0,'Visible independently derived option is missing: '+value);await click(page,'competitionPick',{index});await click(page,'check');return page.evaluate(()=>({ok:feedback.ok,text:feedback.text,status:feedback.status}))}
async function step(page,value,expected){await page.locator('[data-competition-input="reasoning"]').fill(String(value));await click(page,'reasoningCheck');assert.equal(await page.evaluate(()=>reasoningState().state.feedback.ok),expected)}
async function pb(env,page){await qa(env,page,{familyId:'transferBetweenBoxes',seed:160,personaId:'P-B'});assert.equal((await choose(page,2)).ok,false);await click(page,'reasoningOpen');await click(page,'reasoningRoute',{code:'family-quantities'});await step(page,'4-1=3份',false);assert.equal(await page.evaluate(()=>reasoningState().state.feedback.unverified),true);await step(page,'3',true);await step(page,'6',false);return task(page)}
async function external(page){await click(page,'reasoningHint');await click(page,'reasoningTransferMode',{code:'external'});await click(page,'reasoningTransferChange',{code:'A:increase'});await click(page,'reasoningTransferChange',{code:'B:same'});await click(page,'reasoningTransferCheck');await page.locator('[data-competition-input="transferProbeGap"]').fill('6');await page.locator('[data-competition-input="transferProbeAmount"]').fill('2');await click(page,'reasoningTransferCalculate');assert.equal(await page.evaluate(()=>reasoningState().state.transferProbe.calculationFeedback.ok),true)}
async function active(page){return page.evaluate(()=>saved.rtm1?.sessions?.active)}
async function rtmAnswer(page,wrong=false){
 const a=await active(page),value=(a.kind==='training'?A.training:A.originals)[a.id];assert(value!==undefined,'Independent mapping answer missing: '+a.id);
 const correctInput=Array.isArray(value)?value.join(','):String(value);let input=wrong?'999999999':correctInput;
 if(a.definition.answerContract.kind==='choice'){
  if(wrong){const visible=await page.locator('[data-action="rtmChoice"]').evaluateAll(nodes=>nodes.map(n=>n.getAttribute('data-value')));input=visible.find(v=>v!==correctInput);assert.notEqual(input,undefined,'A visible incorrect choice is required for the first-wrong fixture')}
  await click(page,'rtmChoice',{value:input});
 }else await page.locator('[data-rtm-input]').fill(input);
 await click(page,'rtmSubmit');assert.equal((await active(page)).feedback.outcome,wrong?'INCORRECT':'VERIFIED');return a.id;
}
async function connect(page,examId='AMC8-2003-01',excludedSkillIds=[]){await configure(page,{selectedTopics:all,sourceIds:['AMC8'],examId,excludedSkillIds});await click(page,'topicStart');await page.locator('[data-rtm-task]').waitFor()}
async function original(page){const trail=[];for(let i=0;(await active(page)).kind==='training';i++){assert(i<10);trail.push(await rtmAnswer(page));await click(page,'rtmNext')}return trail}
async function capture(page,out,name){fs.mkdirSync(out,{recursive:true});const screenshot=name+'.png',observation=name+'.json';await page.screenshot({path:path.join(out,screenshot),fullPage:true});const record=await page.evaluate(()=>({view,visibleText:document.querySelector('#app').innerText,competition:saved.competition,rtm:saved.rtm1,storageStatus:progressStore.getStatus(),requestedSpeech:window.__rc79Speech,speechStops:window.__rc79Stops}));fs.writeFileSync(path.join(out,observation),JSON.stringify(record,null,2)+'\n');return [observation,screenshot]}
module.exports={assert,fs,path,all,ready,reveal,click,context,normal,configure,blockedStart,openMicro,recordSnapshot,qa,task,choose,step,pb,external,active,rtmAnswer,connect,original,capture};
