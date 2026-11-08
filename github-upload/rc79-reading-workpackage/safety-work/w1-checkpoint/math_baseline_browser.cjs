'use strict';
// Original FIX15 versus byte-pinned W1 G5 staging; never touches public site/user data.
// Exercised against actual loaded math application in isolated synthetic browser profiles.
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const assert = require('node:assert/strict');
const { chromium, webkit } = require('playwright');

if (process.argv.length !== 5) {
  console.error('Usage: node math_baseline_browser.cjs MAIN_TREE STAGED_W1_TREE OUT_DIR');
  process.exit(2);
}
const [mainRoot, w1Root, outDir] = process.argv.slice(2).map(p=>path.resolve(p));
fs.mkdirSync(outDir, {recursive:true});
const records=[];
function serve(root) {
  const server=http.createServer((req,res)=>{
    const u=new URL(req.url,'http://localhost');
    let rel;
    try { rel=decodeURIComponent(u.pathname); } catch {res.writeHead(400).end();return;}
    const file=path.resolve(root, '.'+rel);
    if(file!==root && !file.startsWith(root+path.sep)){res.writeHead(403).end();return}
    fs.stat(file,(error,stat)=>{
      if(error){res.writeHead(404).end();return}
      const target=stat.isDirectory()?path.join(file,'index.html'):file;
      const ext=path.extname(target);
      res.setHeader('Content-Type', ({'.js':'text/javascript','.json':'application/json','.html':'text/html; charset=utf-8','.css':'text/css','.png':'image/png','.svg':'image/svg+xml'})[ext]||'application/octet-stream');
      fs.createReadStream(target).on('error',()=>res.end()).pipe(res);
    });
  });
  return new Promise(resolve=>server.listen(0,'127.0.0.1',()=>resolve({server,url:'http://127.0.0.1:'+server.address().port+'/'})));
}
async function inspect(engine,name,site,version){
  const browser=await engine.launch();
  const context=await browser.newContext({viewport:{width:820,height:1180},hasTouch:true});
  try {
    // No Web Lock API: exercises existing IDB fallback on BOTH releases.
    // The forced PENDING below then probes the RTM1 caller contract exactly.
    await context.addInitScript(()=>Object.defineProperty(navigator,'locks',{value:undefined,configurable:true}));
    const page=await context.newPage();
    page.setDefaultTimeout(60000);
    const errors=[];
    page.on('pageerror',err=>errors.push(String(err)));
    await page.goto(site.url+'#math',{waitUntil:'load',timeout:120000});
    await page.waitForFunction(()=>typeof progressStore!=='undefined'&&progressStore.getStatus()==='ready'&&typeof ExamMappingUI!=='undefined',{timeout:60000});
    const prepared=await page.evaluate(()=>{
      parentMathEdit=true;
      const skill=SKILL_DATA.skills[0].id;
      sourceSelectionAction('sourceSkillToggle',{code:skill});
      saved.topicPractice.excludedSkillIds=[];
      saved.topicPractice.selectedTopicIds=SKILL_DATA.units.map(u=>u.id);
      saved.topicPractice.sourceIds=['AMC8'];
      saved.topicPractice.examIds=['AMC8-2009-17'];
      const r=persist();
      return {status:progressStore.getStatus(),immediateOk:r?.ok===true,immediatePending:r?.pending===true,storeKey:STORE,hasMathEntry:typeof ExamMappingUI.beginConnected==='function'};
    });
    await page.waitForFunction(()=>progressStore.getStatus()==='ready'&&progressStore.exportSnapshot().pending===null,{timeout:60000});
    assert(prepared.hasMathEntry,'real RTM1 entry is missing in '+version);
    const probe=await page.evaluate(()=>{
      const original=persist;
      let intercepted=0, proposed=null;
      const before=JSON.stringify(saved.rtm1??null);
      try{
        persist=function(){
          intercepted++;
          proposed=JSON.stringify(saved.rtm1??null);
          return {ok:false,reason:'PENDING',pending:true};
        };
        // Same real UI caller used by FIX15's prior test_storage_browser.js.
        ExamMappingUI.beginConnected();
      }finally{persist=original}
      const after=JSON.stringify(saved.rtm1??null);
      return {before,proposed,after,intercepted,uiRolledBack:before===after,proposedDiffers:proposed!==before,
        storeStatus:progressStore.getStatus(),errorCount:0};
    });
    assert(probe.intercepted>0,'pending path not actually invoked on '+version);
    assert(probe.proposedDiffers,'probe did not attempt new RTM1 write: '+version);
    assert(probe.uiRolledBack,'unexpected RTM1 memory transition: '+version);
    const durable=await page.evaluate(key=>localStorage.getItem(key),prepared.storeKey);
    assert(durable,'math baseline missing durable synthetic record '+version);
    assert.deepEqual(errors,[],version+' has page errors');
    // Never record synthetic learner data itself, only state facts and origin.
    const record={browser:name,version,origin:site.url,storeStatus:probe.storeStatus,
      pendingIntercepted:probe.intercepted>0,uiRollbackOnPending:probe.uiRolledBack,
      proposedRecordDifferent:probe.proposedDiffers,
      pendingThenDurableDivergencePossible:probe.uiRolledBack&&probe.proposedDiffers,
      storageBaselinePresent:!!durable,baselineSetupPending:prepared.immediatePending,
      caveat:'Synthetic PENDING return exercises real RTM1 caller; not proof of natural IDB timing or absence of data loss.'};
    records.push(record);
    return record;
  }finally{await context.close();await browser.close()}
}
(async()=>{
 const main=await serve(mainRoot),w1=await serve(w1Root);
 try{
  for(const [name,engine]of [['chromium',chromium],['webkit',webkit]]){
    const baseline=await inspect(engine,name,main,'FIX15');
    const candidate=await inspect(engine,name,w1,'W1_ORIGINAL_FROZEN_G5_STAGED');
    assert.equal(baseline.pendingThenDurableDivergencePossible,candidate.pendingThenDurableDivergencePossible,
      'Pending caller contract differs between baseline and W1');
  }
  const report={
    status:'BASELINE_COMPARISON_OBSERVED_NOT_RELEASE_ACCEPTANCE',
    baselineMain:'23755d3aa9bf9e479468bb24263f81ea8228430e',
    w1FrozenSource:'c8575da9d28c40b5bf79412928a0be8c397e7094',
    scenario:'real page RTM1 beginConnected with isolated synthetic learner data and forced pending persistence return',
    engines:['chromium','webkit'],records,
    evidenceLimitations:['Simulated pending contract, not real transaction completion or failure.',
      'Cannot rule out W1-only real timing or data-corruption risks.',
      'No independent product-owner risk acceptance; W1-MATH-COMPAT remains TODO until separate evidence.']
  };
  fs.writeFileSync(path.join(outDir,'math-baseline-differential.json'),JSON.stringify(report,null,2)+'\n');
  console.log(JSON.stringify({status:report.status,results:records.map(r=>({browser:r.browser,version:r.version,pending:r.pendingThenDurableDivergencePossible}))}));
})().catch(e=>{
 const report={status:'BLOCKED_OR_FAILED',error:String(e.stack||e),records};
 fs.writeFileSync(path.join(outDir,'math-baseline-error.json'),JSON.stringify(report,null,2)+'\n');
 console.error(e);process.exitCode=1;
}).finally(()=>Promise.allSettled([main?.server&&new Promise(r=>main.server.close(r)),w1?.server&&new Promise(r=>w1.server.close(r))]));
