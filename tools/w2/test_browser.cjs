'use strict';
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const {chromium,webkit}=require('playwright');
const [root,cand]=process.argv.slice(2).map(x=>path.resolve(x));
const data=JSON.parse(fs.readFileSync(path.join(cand,'candidate-data.json'))),ledger=JSON.parse(fs.readFileSync(path.join(cand,'review-ledger.json')));
const key='tianle_amc8_question_design_v1_reading_r1',mathKey='tianle_amc8_question_design_v1';
const mime={'.html':'text/html; charset=utf-8','.js':'application/javascript; charset=utf-8','.json':'application/json; charset=utf-8','.css':'text/css; charset=utf-8','.png':'image/png','.svg':'image/svg+xml','.webp':'image/webp','.jpg':'image/jpeg'};
const server=http.createServer((req,res)=>{
 const u=new URL(req.url,'http://127.0.0.1'),name=decodeURIComponent(u.pathname).replace(/^\/+/,'')||'index.html';
 if(name.split('/').includes('..')){res.writeHead(403).end();return}
 const overlay=path.join(cand,'overlay',name),file=u.searchParams.has('baseline')?path.join(root,name):fs.existsSync(overlay)?overlay:path.join(root,name);
 if(!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404).end();return}
 res.setHeader('Content-Type',mime[path.extname(file)]||'application/octet-stream');res.setHeader('Cache-Control','no-store');fs.createReadStream(file).pipe(res);
});
const read=(p)=>p.evaluate(k=>JSON.parse(localStorage.getItem(k)||'null'),key);
const waitState=(p,fn,arg)=>p.waitForFunction(({key,src,arg})=>{const d=JSON.parse(localStorage.getItem(key)||'null');return d&&Function('d','arg','return ('+src+')(d,arg)')(d,arg)},{key,src:fn.toString(),arg},{timeout:15000});
function action(p,name,filter=''){return p.locator('[data-action="'+name+'"]'+filter)}
async function ready(p){await action(p,'rdDxSet').first().waitFor({timeout:30000});await p.waitForFunction(()=>!document.querySelector('.rd-storage-alert'),null,{timeout:15000});}
async function parent(p){await action(p,'rdParent').first().click();await ready(p)}
async function start(p,id){await action(p,'rdDxSet','[data-set="'+id+'"]').click();assert(await action(p,'rdDiagnostic').isDisabled());await action(p,'rdKnowledgeConfirm').click();await action(p,'rdDiagnostic').click();await action(p,'rdPick').first().waitFor();await waitState(p,(d,id)=>d.session?.diagnostic?.setId===id,id);return (await read(p)).session;}
async function pick(p,expected){
 const btns=action(p,'rdPick');let match=null;
 for(let i=0;i<await btns.count();i++){const loc=btns.nth(i);let t=await loc.evaluate(e=>{const c=e.cloneNode(true);c.querySelectorAll('rt,.rd-pinyin,[aria-hidden="true"]').forEach(x=>x.remove());return c.textContent.replace(/\s+/g,'')});if(t===expected.replace(/\s+/g,''))match=loc;}
 if(!match){const details=await btns.allTextContents();throw Error('Expected rendered option '+expected+'; got '+JSON.stringify(details))}
 await match.click();return Number(await match.getAttribute('data-index'));
}
async function submit(p,id,expectedCorrect){await action(p,'rdSubmit').click();await waitState(p,(d,id)=>d.events.some(e=>e.type==='attempt'&&e.questionId===id),id);let rows=(await read(p)).events.filter(e=>e.type==='attempt'&&e.questionId===id);assert.equal(rows.at(-1).correct,expectedCorrect,id);return rows.at(-1)}
async function main(){
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const url='http://127.0.0.1:'+server.address().port+'/';
 const results=[];
 for(const [name,type] of [['chromium',chromium],['webkit',webkit]]){
  const browser=await type.launch({headless:true});
  try{
   const context=await browser.newContext({viewport:{width:1024,height:768}});const p=await context.newPage();p.setDefaultTimeout(15000);
   const errors=[];p.on('pageerror',e=>errors.push(String(e)));
   // Real old site and real old diagnosis write through the original storage adapter.
   await p.goto(url+'?baseline=1#reading-parent');await ready(p);
   assert.equal(await action(p,'rdDxSet').count(),13);
   let ss=await start(p,'BASELINE');const qold=data.diagnostics.sets[0].forms[0].materials[0].questions[0];
   await pick(p,qold.options[qold.answer]);const oldAnswer=await submit(p,qold.id,true);
   await action(p,'rdNext').click();await action(p,'rdPick').first().click();
   await waitState(p,d=>Object.keys(d.session?.drafts||{}).length>=2);
   const before=await read(p);const beforeRaw=await p.evaluate(k=>localStorage.getItem(k),key);
   await p.evaluate(k=>localStorage.setItem(k,'{"w2TestSentinel":true}'),mathKey);
   await p.goto(url+'#reading-parent');await ready(p);assert.equal(await action(p,'rdDxSet').count(),26);
   assert.equal(await action(p,'rdDxSet','[data-set="'+data.diagnostics.sets[13].id+'"]').getAttribute('aria-pressed'),'true');
   await waitState(p,(d,h)=>d.contentHash===h,data.contentHash);
   const migrated=await read(p);assert.deepEqual(migrated.events.filter(e=>e.type==='attempt'),before.events.filter(e=>e.type==='attempt'));
   const backup=await p.evaluate(k=>Object.keys(localStorage).filter(x=>x.startsWith(k+'_backup_before_content_')).map(x=>localStorage.getItem(x)),key);assert(backup.includes(beforeRaw));
   assert.equal(await p.evaluate(k=>localStorage.getItem(k),mathKey),'{"w2TestSentinel":true}');
   // Exercise one form per aid condition via actual UI, with independent answer text.
   for(let week=0;week<4;week++){
    const set=data.diagnostics.sets[13+week],form=set.forms[0],rec=ledger.find(x=>x.formId===form.id);
    if(week>0)await parent(p);
    ss=await start(p,set.id);assert.equal(ss.diagnostic.condition,'ABCD'[week]);
    for(let j=0;j<4;j++){
     if(j%2===0&&week===3){await action(p,'rdParentRead').click();await waitState(p,d=>d.events.some(e=>e.type==='aid_requested'&&e.kind==='parent'&&e.materialId===d.session.materialIds[d.session.materialIndex]));}
     // No installed voice is asserted. Condition C is deliberately not fulfilled;
     // actual local speech provenance was tested in engine regression.
     const item=rec.questions[j],index=await pick(p,item.answer);
     if(week===0&&j===0){
      // Explicit refresh, resume, and verify original draft choice before submit.
      await waitState(p,(d,x)=>d.session?.drafts[x.id]===x.index,{id:item.id,index});
      await p.reload();await p.waitForFunction(()=>window.__AMC8_BOOT_READY===true);
      let resume=action(p,'rdResume').first();if(await resume.count()===0){await action(p,'rdHome').first().click();}
      await resume.click();await action(p,'rdPick').first().waitFor();assert.equal(await action(p,'rdPick','[data-index="'+index+'"]').getAttribute('aria-pressed'),'true');
     }
     const row=await submit(p,item.id,true);assert.equal(row.diagnosticValidity.eligible,week!==2);
     if(j%2===0){assert.equal(await action(p,'rdReveal').count(),0);assert.equal(await p.locator('.rd-feedback.rd-good,.rd-feedback.rd-try').count(),0);}
     await action(p,'rdNext').click();
    }
   }
   await parent(p);
   const final=await read(p);assert.equal(final.events.filter(e=>e.type==='attempt').length,17);assert.equal(final.events.filter(e=>e.type==='attempt'&&e.questionId===qold.id).length,1);
   assert.equal(final.events.filter(e=>e.type==='attempt'&&e.diagnosticValidity?.eligible&&e.questionId!==qold.id).length,12);
   assert.equal(await p.evaluate(k=>localStorage.getItem(k),mathKey),'{"w2TestSentinel":true}');
   await p.screenshot({path:path.join(cand,name+'-parent.png'),fullPage:true});
   assert.deepEqual(errors,[]);
   results.push({browser:name,oldSets:13,newSets:13,realAnswers:16,eligible:12,excludedNoAudio:4,realRefresh:true,legacyBackup:true,mathIsolation:true,blindFirstFeedback:true});
  }finally{await browser.close()}
 }
 fs.writeFileSync(path.join(cand,'browser-results.json'),JSON.stringify(results,null,2));console.log(JSON.stringify(results));
}
main().catch(e=>{console.error(e);process.exitCode=1}).finally(()=>server.close());
