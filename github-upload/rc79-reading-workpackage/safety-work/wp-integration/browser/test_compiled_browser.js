'use strict';
/*
 * Real Chromium/WebKit against the entire raw compiled candidate. Student,
 * historical and mathematics records are synthetic. The answer oracle below
 * comes from the supplied bank; it is not independent mathematical review.
 * Usage: node test_compiled_browser.js CANDIDATE_ROOT OLD_DATA_JS OLD_ENGINE_JS OUT_DIR
 */
const fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const vm=require('node:vm'),assert=require('node:assert/strict');
const {chromium,webkit}=require('playwright');
if(process.argv.length!==6){console.error('Usage: node test_compiled_browser.js CANDIDATE_ROOT OLD_DATA_JS OLD_ENGINE_JS OUT_DIR');process.exit(2);}
const [root,oldDataPath,oldEnginePath,out]=process.argv.slice(2).map(p=>path.resolve(p));
const entry=path.join(root,'source/index.html'),manifest=JSON.parse(fs.readFileSync(path.join(root,'reading-workpackage-candidate.json'),'utf8'));
const key='tianle_amc8_question_design_v1_reading_r1',mathKey='tianle_amc8_question_design_v1';
const results=[];let server;
const solution=q=>{
 switch(q.type){
 case 'choice':case 'order':case 'match':case 'departure':case 'pair':case 'classification':case 'loop':case 'rule':case 'purchase':return q.answer;
 case 'route':return q.route.acceptedRoutes[0];case 'sequence':case 'anypair':return q.answer[0];
 case 'strip':return Number(q.answer.split(':')[1]);case 'mirror':return q.grid.target;
 case 'allocation':{const a=[...q.allocation.minimum];a[0]+=q.allocation.total-a.reduce((s,n)=>s+n,0);return a;}
 case 'cargo':case 'manifest':{const c=q[q.type],n=q.options.length;
  for(let mask=0;mask<2**n;mask++){const a=Array.from({length:n},(_,i)=>mask&(1<<i)?2:1);
   if(c.firstRequired.some(i=>a[i]!==1)||(c.strictBefore||[]).some(([i,j])=>a[i]>=a[j]))continue;
   if([1,2].every(t=>c.weights.reduce((s,w,i)=>s+(a[i]===t?w:0),0)<=c.capacity&&(!c.maxItems||a.filter(x=>x===t).length<=c.maxItems)))return a;
  }break;}
 case 'grid':{const g=q.grid,n=g.rows*g.cols;for(let mask=1;mask<2**n;mask++){
  const a=Array.from({length:n},(_,i)=>i).filter(i=>mask&(1<<i));if(a.length!==g.area||a.some(i=>g.blocked.includes(i)))continue;
  const rows=a.map(i=>Math.floor(i/g.cols)),cols=a.map(i=>i%g.cols),h=Math.max(...rows)-Math.min(...rows)+1,w=Math.max(...cols)-Math.min(...cols)+1;
  if(h*w===a.length&&2*(h+w)===g.perimeter)return a;
 }break;}
 }
 throw Error('No supplied-answer construction for '+q.id+' '+q.type);
};
function makeLegacySeed(){
 const ctx={window:{__AMC8_STORAGE_TEST:true},console,Math,Date};vm.createContext(ctx);
 vm.runInContext(fs.readFileSync(oldDataPath,'utf8'),ctx);const old=ctx.window.__AMC8_READING_DATA;
 vm.runInContext(fs.readFileSync(oldEnginePath,'utf8'),ctx);
 const map=new Map(),storage={getItem:k=>map.has(k)?map.get(k):null,setItem:(k,v)=>map.set(k,String(v)),removeItem:k=>map.delete(k)};
 const e=ctx.window.ReadingEngine.create(old,storage,key,()=>2000000000000);
 e.setting('pinyin','none');e.start([old.lessons[0].coreIds[0]],{day:1,purpose:'new'});
 const q=e.current().question,wrong=q.type==='order'?[...q.answer].reverse():(q.answer+1)%q.options.length;
 const a=e.submit(wrong);assert.equal(a.correct,false);assert.equal(a.first,true);
 assert(e.select(q.type==='order'?[q.answer[0]]:q.answer));
 return {raw:storage.getItem(key),oldId:q.id,oldHash:old.contentHash};
}
const seed=makeLegacySeed();
const targetTypes=['choice','order','match','route','departure','cargo','pair','sequence','loop','rule','purchase','anypair','classification','strip','grid','mirror','allocation','manifest'];
function action(p,name,attributes={}){let selector=`[data-action="${name}"]`;for(const [k,v] of Object.entries(attributes))selector+=`[data-${k}="${String(v)}"]`;return p.locator(selector).first();}
async function tap(p,name,attributes={}){await action(p,name,attributes).tap();}
async function ready(p){await p.waitForFunction(()=>typeof ReadingUI!=='undefined'&&ReadingUI.engine()?.status()?.status==='ready',null,{timeout:45000});}
async function startReading(p){await tap(p,'reading');await ready(p);}
async function solveWithControls(p,q){
 const v=solution(q);
 if(q.type==='choice')await tap(p,'rdPick',{index:v});
 else if(q.type==='order')for(const index of v)await tap(p,'rdPick',{index});
 else if(q.type==='match')for(let left=0;left<v.length;left++)await tap(p,'rdMatchPick',{left,index:v[left]});
 else if(q.type==='route')for(const index of v)await tap(p,'rdRoutePick',{index});
 else if(q.type==='departure'){
  await tap(p,'rdDepartureStep',{delta:1});
  await p.locator('[data-reading-field="departure"]').evaluate((el,value)=>{el.value=String(value);el.dispatchEvent(new Event('input',{bubbles:true}));},v);
 }else if(q.type==='cargo')for(let item=0;item<v.length;item++)await tap(p,'rdCargoPick',{item,trip:v[item]});
 else if(q.type==='pair'||q.type==='anypair')for(const index of v)await tap(p,'rdWpPair',{index});
 else if(q.type==='sequence')for(const value of v)await tap(p,'rdWpSeq',{value});
 else if(q.type==='loop')for(let i=0;i<Number(v.slice(5));i++)await tap(p,'rdWpLoop',{value:1});
 else if(q.type==='rule'){
  const [,color,logic,shape]=/^(blue|red)([&|])(square|circle)$/.exec(v);
  await tap(p,'rdWpRule',{part:'color',value:color});await tap(p,'rdWpRule',{part:'logic',value:logic});await tap(p,'rdWpRule',{part:'shape',value:shape});
 }else if(q.type==='purchase'){
  const counts=v.slice(6).split(',').map(Number);for(let index=0;index<counts.length;index++)for(let j=0;j<counts[index];j++)await tap(p,'rdWpPack',{index,value:1});
 }else if(q.type==='classification')for(let index=0;index<v.length;index++)await tap(p,'rdWpClass',{index,value:v[index]});
 else if(q.type==='strip')await tap(p,'rdWpStrip',{index:v});
 else if(q.type==='grid'||q.type==='mirror')for(const index of v)await tap(p,'rdWpCell',{index});
 else if(q.type==='allocation')for(let index=0;index<v.length;index++)for(let j=0;j<v[index];j++)await tap(p,'rdWpAmount',{index,value:1});
 else if(q.type==='manifest')for(let index=0;index<v.length;index++)await tap(p,'rdWpTrip',{index,value:v[index]});
 else throw Error('Unhandled DOM controls '+q.type);
 assert.equal(await action(p,'rdSubmit').isDisabled(),false,'complete answer should be submittable: '+q.id);
 await tap(p,'rdSubmit');
 const answer=await p.evaluate(()=>ReadingUI.engine().current().attempts.at(-1));
 assert(answer&&answer.questionId===q.id&&answer.correct===true,'supplied answer should be accepted: '+q.id);
 assert.equal(answer.prerequisitesConfirmed,false,'unreviewed prerequisites must remain unconfirmed: '+q.id);
 await ready(p);
 return answer;
}
async function compiledCourse(browser,name,base){
 const context=await browser.newContext({viewport:{width:768,height:1024},hasTouch:true}),p=await context.newPage();
 const errors=[];p.on('pageerror',e=>errors.push(String(e)));p.setDefaultTimeout(45000);
 try{
  // LOAD2 loads mathematics lazily; #math is also supported by the raw page.
  await p.goto(base+'source/index.html#math',{waitUntil:'load',timeout:120000});
  await p.waitForFunction(()=>typeof progressStore!=='undefined'&&progressStore.getStatus()==='ready',null,{timeout:60000});
  // Save a synthetic mathematics record through the actual application before
  // exercising reading. This avoids overwriting an active writer behind its back.
  await p.evaluate(()=>{saved.attempts.push({id:'synthetic-wrong-first',taskInstanceId:'R02-1',contentVersion:5,evidenceVersion:2,evidenceRuleVersion:4,independent:false,firstSubmissionCorrect:false,modelViewed:false,hintEvents:[],gradingResult:'incorrect'});const result=persist();if(!result.ok&&!result.pending)throw Error('Could not seed synthetic mathematics record');});
  await p.waitForFunction(k=>{const raw=localStorage.getItem(k);return raw&&raw.includes('synthetic-wrong-first')&&progressStore.getStatus()==='ready';},mathKey,{timeout:60000});
  const mathRaw=await p.evaluate(k=>localStorage.getItem(k),mathKey);assert(mathRaw.includes('synthetic-wrong-first'));
  await startReading(p);
  const pronunciation=await p.evaluate(()=>{const option='6:06 调整天线',dynamic='原记录：题目要求的两项维修已选择。';return {option:ReadingUI.pronounce(option),numbered:ReadingUI.pronounce('1 · '+option),dynamic:ReadingUI.pronounce(dynamic),dynamicIndex:dynamic.indexOf('要')};});
  assert.equal(pronunciation.option[5],'tiáo');assert.deepEqual(pronunciation.numbered,['','','','',...pronunciation.option]);assert.equal(pronunciation.dynamic[pronunciation.dynamicIndex],'yāo');
  const info=await p.evaluate(()=>{const d=ReadingUI.engine().data,types={};for(const m of d.materials.filter(m=>m.courseId===d.courseScope.activeCourseId&&m.kind==='story'))m.questions.forEach((q,i)=>{types[q.type]??={day:m.day,index:i,id:q.id};});return {hash:d.contentHash,types};});
  assert.equal(info.hash,manifest.courseContentHash);assert.deepEqual(Object.keys(info.types).sort(),[...targetTypes].sort());
  await tap(p,'rdStart',{day:1});assert(await p.locator('.rd-story-text ruby rt').first().textContent(),'generated pinyin is visible');
  await tap(p,'rdReadDone');let q=await p.evaluate(()=>ReadingUI.engine().current().question);assert.equal(q.type,'choice');
  const wrong=(q.answer+1)%q.options.length;await tap(p,'rdPick',{index:wrong});await ready(p);
  await p.waitForFunction(({key,id,wrong})=>{const raw=localStorage.getItem(key);return raw&&JSON.parse(raw).session?.drafts?.[id]===wrong;},{key,id:q.id,wrong},{timeout:45000});
  await p.reload({waitUntil:'load',timeout:120000});await startReading(p);await tap(p,'rdResume');
  assert.equal(await p.evaluate(id=>ReadingUI.engine().current().session.drafts[id],q.id),wrong,'refresh must restore the draft');
  await tap(p,'rdSubmit');await ready(p);let first=await p.evaluate(()=>ReadingUI.engine().current().attempts.at(-1));assert.equal(first.correct,false);assert.equal(first.first,true);
  await tap(p,'rdPick',{index:q.answer});await tap(p,'rdSubmit');await ready(p);
  let attempts=await p.evaluate(()=>ReadingUI.engine().current().attempts);assert.deepEqual(attempts.map(x=>x.correct),[false,true]);assert.equal(attempts[1].first,false);
  await tap(p,'rdNext');q=await p.evaluate(()=>ReadingUI.engine().current().question);assert.equal(q.type,'order');await solveWithControls(p,q);
  await tap(p,'rdNext');q=await p.evaluate(()=>ReadingUI.engine().current().question);await solveWithControls(p,q);await tap(p,'rdNext');
  assert.equal(await p.locator('[data-daily-optional]').count(),1);await tap(p,'rdDailyOptional',{day:1});
  assert.equal(await p.evaluate(()=>{const c=ReadingUI.engine().current();return c.session.priorExposure[c.material.id]}),true);
  await tap(p,'rdReadDone');q=await p.evaluate(()=>ReadingUI.engine().current().question);const extra=await solveWithControls(p,q);
  assert.equal(extra.priorExposure,true);assert.equal(extra.independent,false);await tap(p,'rdNext');
  assert.equal(await p.evaluate(()=>ReadingUI.report().completedDays),1,'optional task must not add a completed day');
  await tap(p,'rdParent');const parentText=await p.locator('.rd-app').innerText();
  assert.equal((parentText.match(/未评级/g)||[]).length,12);assert(parentText.includes('先修知识尚未审校'));assert(parentText.includes('尚未分类的首答'));
  assert(!parentText.includes('继续观察与补强'),'unreviewed weeks must not imply a deficiency');
  const completed=[];
  for(const type of targetTypes.filter(t=>!['choice','order'].includes(t))){
   const target=info.types[type];assert.equal(target.index,0,'browser test assumes first task of day: '+type);
   await p.evaluate(day=>ReadingUI.handle('rdStart',{day:String(day)}),target.day);
   await tap(p,'rdReadDone');q=await p.evaluate(()=>ReadingUI.engine().current().question);assert.equal(q.id,target.id);
   assert.equal(await p.locator('.rd-explanation').count(),0,'no explanation before answer: '+q.id);
   if(['pair','sequence','loop','rule','purchase','anypair','classification','strip','grid','mirror','allocation','manifest'].includes(type))assert.equal(await p.locator(`[data-wp-type="${type}"]`).count(),1);
   await solveWithControls(p,q);completed.push({type,id:q.id});
  }
  await p.evaluate(()=>ReadingUI.handle('rdStart',{day:'3'}));await tap(p,'rdReadDone');
  assert.equal(await action(p,'rdExplore').count(),1);await tap(p,'rdExplore');assert.equal(await p.locator('[data-exploration-board]').count(),1);
  await tap(p,'rdSpeakQuestion');q=await p.evaluate(()=>ReadingUI.engine().current().question);const assisted=await solveWithControls(p,q);
  assert.equal(assisted.explorationEver,true);assert.equal(assisted.independent,false);assert.equal(assisted.voiceEver,true);
  const events=await p.evaluate(()=>ReadingUI.engine().snapshot().events);assert(events.some(e=>e.type==='aid_requested'&&e.kind==='explore'));assert(events.some(e=>e.type==='aid_requested'&&e.kind==='question'));
  assert.equal(await p.evaluate(k=>localStorage.getItem(k),mathKey),mathRaw,'reading interaction must not change mathematics bytes');
  assert.deepEqual(errors,[],'uncaught page errors');
  results.push({engine:name,check:'compiled_course_controls',result:'PASS',targetTypes:targetTypes.length,types:completed,wrongFirstAndRetry:true,draftReload:true,optionalPriorExposure:true,unratedWeeks:true,explorationAndVoiceRequests:true,exactAndDynamicPinyin:true,mathBytesUnchanged:true,touch:'emulated',audio:'request only'});
  // Existing diagnostic protocol, reached through the parent UI in the same
  // packaged application. No separate history store or automatic new diagnosis.
  const beforeLegacy=await p.evaluate(()=>{const r=ReadingUI.report();return {first:r.first,conditions:r.conditions,days:r.completedDays};});
  await tap(p,'rdHome');await tap(p,'rdParent');
  assert.equal(await p.locator('[data-action="rdDxSet"]').count(),13);
  for(const set of ['W04','W08','W12']){
   await tap(p,'rdHome');await tap(p,'rdPlan');await tap(p,'rdOpenDiagnostic',{set});
   assert.equal(await p.locator('[data-legacy-diagnostic-notice]').count(),1);
   assert.equal(await action(p,'rdDxSet',{set}).getAttribute('aria-pressed'),'true');
  }
  for(const set of ['BASELINE','W04','W08','W12']){
   await tap(p,'rdDxSet',{set});assert.equal(await p.locator('[data-legacy-diagnostic-notice]').count(),1);
   assert.equal(await action(p,'rdDiagnostic').isDisabled(),true,'prerequisite confirmation required');
  }
  await tap(p,'rdDxSet',{set:'W04'});await tap(p,'rdKnowledgeConfirm');await tap(p,'rdDiagnostic');await ready(p);
  assert((await p.locator('[data-historical-session] rb').allTextContents()).join('').includes('旧课程诊断'));
  q=await p.evaluate(()=>ReadingUI.engine().current().question);assert.equal(q.type,'choice');
  const legacyWrong=(q.answer+1)%q.options.length;await tap(p,'rdPick',{index:legacyWrong});await ready(p);
  await p.reload({waitUntil:'load',timeout:120000});await startReading(p);await tap(p,'rdResume');await ready(p);
  assert.equal(await p.evaluate(id=>ReadingUI.engine().current().session.drafts[id],q.id),legacyWrong);
  await tap(p,'rdSubmit');await ready(p);
  const legacyResult=await p.evaluate(()=>{const e=ReadingUI.engine(),r=e.report();return {attempt:e.current().attempts.at(-1),current:{first:r.first,conditions:r.conditions,days:r.completedDays},history:r.historicalDiagnostics.find(s=>s.setId==='W04')};});
  assert.equal(legacyResult.attempt.correct,false);assert.equal(legacyResult.attempt.first,true);
  assert.deepEqual(legacyResult.current,beforeLegacy);assert.equal(legacyResult.history.versions[0].first.total,1);
  await tap(p,'rdHome');await tap(p,'rdParent');assert((await p.locator('[data-historical-diagnostics]').innerText()).includes('旧版第4周诊断'));
  assert.equal(await p.evaluate(k=>localStorage.getItem(k),mathKey),mathRaw);assert.deepEqual(errors,[]);
  results.push({engine:name,check:'historical_diagnostics',result:'PASS',setsReachable:13,parentSetSelectors:[0,4,8,12],mapEntries:[4,8,12],confirmedPrerequisites:true,draftReload:true,wrongFirstPreserved:true,newCourseReportUnchanged:true,mathBytesUnchanged:true});
  return mathRaw;
 }finally{await context.close();}
}
async function upgrade(browser,name,base,mathRaw,blockBackup){
 const context=await browser.newContext({viewport:{width:768,height:1024},hasTouch:true});
 if(blockBackup)await context.addInitScript(()=>{const original=Storage.prototype.setItem;Storage.prototype.setItem=function(k,v){if(String(k).includes('_backup_before_content_'))throw new DOMException('synthetic quota','QuotaExceededError');return original.call(this,k,v)}});
 const p=await context.newPage();p.setDefaultTimeout(45000);
 try{
  await p.goto(base+'seed');await p.evaluate(({key,mathKey,raw,mathRaw})=>{localStorage.setItem(key,raw);localStorage.setItem(mathKey,mathRaw);},{key,mathKey,raw:seed.raw,mathRaw});
  await p.goto(base+'source/index.html#math',{waitUntil:'load',timeout:120000});
  await p.waitForFunction(()=>typeof progressStore!=='undefined'&&progressStore.getStatus()==='ready',null,{timeout:60000});
  const before=await p.evaluate(k=>localStorage.getItem(k),mathKey);assert(before.includes('synthetic-wrong-first'));
  await tap(p,'reading');
  if(blockBackup){
   await p.waitForFunction(()=>['read_only','unsaved','conflict'].includes(ReadingUI.engine()?.status()?.status),null,{timeout:45000});
   assert.equal(await p.evaluate(k=>localStorage.getItem(k),key),seed.raw,'failed backup must leave exact previous record');
  }else{
   await p.waitForFunction(key=>{const e=ReadingUI.engine(),raw=localStorage.getItem(key);return e?.status()?.status==='ready'&&raw&&JSON.parse(raw).contentHash===e.data.contentHash;},key,{timeout:45000});
   const state=await p.evaluate(()=>{const e=ReadingUI.engine();return {backup:JSON.parse(e.backup()),report:e.report(),current:e.current(),attempts:e.attempts(e.current().question.id)};});
   assert.equal(state.backup.upgradeOriginal,seed.raw,'upgrade backup must contain exact old record');assert.equal(state.current.question.id,seed.oldId);
   assert.equal(state.attempts.length,1);assert.equal(state.attempts[0].correct,false);assert.equal(state.report.historical.first.total,1);assert.equal(state.report.first.total,0);
   assert(Object.hasOwn(state.current.session.drafts,seed.oldId),'old unfinished draft must be retained');
   await tap(p,'rdResume');assert.equal(await p.evaluate(()=>ReadingUI.engine().current().question.id),seed.oldId);
  }
  assert.equal(await p.evaluate(k=>localStorage.getItem(k),mathKey),before,'upgrade must leave mathematics bytes unchanged');
  results.push({engine:name,check:blockBackup?'upgrade_backup_quota':'upgrade_legacy',result:'PASS',oldRawRetained:true,mathBytesUnchanged:true,...(!blockBackup?{oldFirstRetained:true,oldDraftResumable:true}:{} )});
 }finally{await context.close();}
}
(async()=>{
 if(!fs.existsSync(entry))throw Error('Compiled candidate entry not found: '+entry);fs.mkdirSync(out,{recursive:true});
 server=http.createServer((req,res)=>{const u=new URL(req.url,'http://127.0.0.1');if(u.pathname==='/seed'){res.writeHead(200,{'content-type':'text/html; charset=utf-8'});res.end('<!doctype html><title>synthetic seed</title>');return;}
  const target=path.resolve(root,'.'+decodeURIComponent(u.pathname));if(!target.startsWith(root+path.sep)){res.writeHead(403).end();return;}
  try{const file=fs.statSync(target).isDirectory()?path.join(target,'index.html'):target;const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.json':'application/json','.css':'text/css','.png':'image/png','.svg':'image/svg+xml','.webp':'image/webp'};res.setHeader('content-type',mime[path.extname(file)]||'application/octet-stream');fs.createReadStream(file).pipe(res);}catch(_){res.writeHead(404).end();}});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port+'/';
 const requested=process.env.BROWSER?process.env.BROWSER.split(','):['chromium','webkit'];
 for(const name of requested){if(!['chromium','webkit'].includes(name))throw Error('Unsupported browser '+name);const browser=await ({chromium,webkit})[name].launch({headless:true});
  try{const math=await compiledCourse(browser,name,base);await upgrade(browser,name,base,math,false);await upgrade(browser,name,base,math,true);console.log('PASS '+name+' compiled candidate');}
  finally{await browser.close();}
 }
 const evidence={result:'PASS',scope:'raw compiled candidate, real browser engines, synthetic profiles, supplied-answer contracts',candidateContentHash:manifest.courseContentHash,checks:results,physicalIPad:'NOT_TESTED',realChild:'NOT_RUN',audioAudibility:'NOT_TESTED',independentAnswerOrTeachingReview:'NOT_RUN',productionDeployment:'NOT_RUN'};
 fs.writeFileSync(path.join(out,'compiled-browser.json'),JSON.stringify(evidence,null,2)+'\n');console.log(JSON.stringify(evidence));
})().catch(e=>{fs.mkdirSync(out,{recursive:true});fs.writeFileSync(path.join(out,'compiled-browser-error.json'),JSON.stringify({error:e.stack,completed:results},null,2)+'\n');console.error(e.stack||e);process.exitCode=1;}).finally(()=>server?.close());
