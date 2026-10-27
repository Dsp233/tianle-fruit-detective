'use strict';
const assert=require('node:assert/strict'),{boot}=require('./test_support');
const a=boot(),readable=x=>x.replace(/<rt[^>]*>[\s\S]*?<\/rt>/g,'').replace(/<[^>]+>/g,'');
function current(){return a.value('ReadingUI.engine().current()')}
a.click('reading');
for(const id of ['W04','W08','W12']){
 a.click('rdPlan');assert(a.root.innerHTML.includes('data-set="'+id+'"'));
 a.click('rdOpenDiagnostic',{set:id});
 assert.equal(current(),null,'Opening an entry alone must not start a diagnostic');
 a.click('rdKnowledgeConfirm');a.click('rdDiagnostic');
 assert.equal(current().session.diagnostic.setId,id);
 let count=0;
 while(current()){
  const q=current().question;
  if(q.type==='order'){for(const index of q.answer)a.click('rdPick',{index:String(index)})}
  else a.click('rdPick',{index:String(q.answer)});
  a.click('rdSubmit');assert.equal(current().attempts.at(-1).correct,true);
  a.click('rdNext');assert(++count<=8);
 }
 assert.equal(count,4);
 a.click('rdHome');
}
assert.equal(a.value('ReadingUI.snapshot().events.filter(e=>e.type==="diagnostic_plan").length'),3);
for(const day of [35,42,49,56,63,70,77,84]){
 a.click('rdStart',{day:String(day)});
 const c=current(),text=readable(a.root.innerHTML);
 assert.equal(c.session.purpose,'light');assert.equal(c.session.materialIds.length,1);
 assert(text.includes('漫画第'));assert(text.includes('1/'+c.material.panels.length));
 a.click('rdHome');
}
console.log(JSON.stringify({result:'PASS',scope:'synthetic UI route checks',milestones:['W04','W08','W12'],submittedItems:12,lightDays:[35,42,49,56,63,70,77,84],contentIndependentReview:'NOT_RUN'}));
