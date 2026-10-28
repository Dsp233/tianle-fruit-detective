'use strict';
// Synthetic UI events against the built application; no physical audio or child trial.
const assert=require('node:assert/strict'),{boot}=require('./test_support');
const a=boot(),current=()=>a.value('ReadingUI.engine().current()');
function answer(){
 const q=current().question;
 if(q.type==='order'){for(const index of q.answer)a.click('rdPick',{index:String(index)});}
 else a.click('rdPick',{index:String(q.answer)});
 a.click('rdSubmit');return current().attempts.at(-1);
}
a.click('reading');
for(const condition of ['A','B','C','D']){
 a.click('rdHome');a.click('rdParent');
 assert(a.root.innerHTML.includes('家长代读组需要记录家长只读原文'));
 a.click('rdDxSet',{set:'BASELINE'});a.click('rdKnowledgeConfirm');a.click('rdDiagnostic');
 assert.equal(current().session.diagnostic.condition,condition);
}
a.click('rdSpeakAll');
a.run("ReadingUI.engine().speechStatus({status:'started',kind:'story'})");
const first=answer(),material=current().material.id;
assert.equal(first.voiceEver,true);assert.equal(first.parentEver,false);
assert.equal(first.diagnosticValidity.eligible,false);
assert.equal(a.value('ReadingUI.engine().report().conditions.D.total'),0);
let guard=0;
while(current()?.material.id===material){
 a.click('rdNext');
 if(current()?.material.id===material)answer();
 assert(++guard<8,'next material must be reachable');
}
assert(current(),'D diagnostic includes a second material');
a.click('rdParentRead');
const parentOnly=answer();
assert.equal(parentOnly.parentEver,true);assert.equal(parentOnly.voiceEver,false);
assert.equal(parentOnly.diagnosticValidity.eligible,true);
assert.equal(a.value('ReadingUI.engine().report().conditions.D.total'),1);
const before=a.value('ReadingUI.snapshot().events.filter(e=>e.type==="attempt")');
a.click('rdHome');a.click('rdParent');
assert(a.root.innerHTML.includes('家长代读未记录，或请求过系统朗读或显示过拼音'));
assert.deepEqual(a.value('ReadingUI.snapshot().events.filter(e=>e.type==="attempt")'),before);
console.log(JSON.stringify({result:'PASS',scope:'synthetic UI events on built HTML',diagnosticEntry:true,voiceOnlyExcluded:true,parentOnlyValid:true,parentReportPreservesAttempts:true,realBrowser:'NOT_RUN',physicalAudio:'NOT_RUN'}));
