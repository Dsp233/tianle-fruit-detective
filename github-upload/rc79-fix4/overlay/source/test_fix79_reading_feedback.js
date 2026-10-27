'use strict';
// Targeted practice feedback must be recorded as support. Diagnostic mode is
// checked separately and must not receive the new practice hint.
const assert=require('node:assert/strict'),{boot}=require('./test_support');
const txt=html=>html.replace(/<rt[^>]*>[\s\S]*?<\/rt>/g,'').replace(/<[^>]+>/g,'');
const a=boot();a.click('reading');a.run("ReadingUI.engine().setting('pinyin','none')");
a.run("ReadingUI.openMaterials(['R-D001-S1'],{purpose:'practice'})");a.click('rdReadDone');
const q1=a.value('ReadingUI.engine().current().question');
assert.equal(q1.ability,'sequence');
for(const i of [...q1.answer].reverse())a.click('rdPick',{index:String(i)});
a.click('rdSubmit');
assert(txt(a.root.innerHTML).includes('先后顺序'));
assert.equal(a.value("ReadingUI.snapshot().events.filter(e=>e.kind==='feedback_hint').length"),1);
const first=a.value('ReadingUI.engine().current().attempts[0]');assert.equal(first.correct,false);assert.equal(first.first,true);
for(const i of q1.answer)a.click('rdPick',{index:String(i)});
a.click('rdSubmit');
const current=a.value('ReadingUI.engine().current().attempts');assert.equal(current.length,2);assert.equal(current[0].id,first.id);
assert.equal(current[1].correct,true);assert.equal(current[1].feedbackHintEver,true);assert.equal(current[1].independent,false);
a.click('rdNext');const q2=a.value('ReadingUI.engine().current().question');assert.equal(q2.ability,'inference');
a.click('rdPick',{index:String(q2.answer)});a.click('rdSubmit');
const second=a.value('ReadingUI.engine().current().attempts[0]');assert.equal(second.first,true);assert.equal(second.correct,true);assert.equal(second.feedbackHintEver,true);assert.equal(second.independent,false);
assert(!a.value('ReadingUI.report().levels[0].total')||a.value('ReadingUI.report().levels[0].total')===1);
const b=boot();b.click('reading');b.run("ReadingUI.openMaterials(['R-D001-M'],{purpose:'practice'})");b.click('rdReadDone');
for(const ability of ['facts','conditions','model']){
 const q=b.value('ReadingUI.engine().current().question');assert.equal(q.ability,ability);
 b.click('rdPick',{index:String((q.answer+1)%q.options.length)});b.click('rdSubmit');
 const html=txt(b.root.innerHTML);
 assert(html.includes(ability==='facts'?'问题里的对象':ability==='conditions'?'已知条件':'数量关系'));
 assert.equal(b.value("ReadingUI.snapshot().events.filter(e=>e.kind==='feedback_hint'&&e.questionId==="+JSON.stringify(q.id)+").length"),1);
 b.click('rdNext');
}
const d=boot();d.click('reading');d.click('rdPlan');d.click('rdOpenDiagnostic',{set:'W04'});d.click('rdKnowledgeConfirm');d.click('rdDiagnostic');
const q=d.value('ReadingUI.engine().current().question');
if(q.type==='order'){for(const i of [...q.answer].reverse())d.click('rdPick',{index:String(i)});}else d.click('rdPick',{index:String((q.answer+1)%q.options.length)});
d.click('rdSubmit');assert.equal(d.value("ReadingUI.snapshot().events.filter(e=>e.kind==='feedback_hint').length"),0);
console.log(JSON.stringify({result:'PASS',scope:'practice feedback and synthetic evidence checks',abilities:['sequence','facts','conditions','model'],originalFirstAnswerPreserved:true,hintsExcludedFromIndependentEvidence:true,diagnosticHint:'NOT_SHOWN'}));
