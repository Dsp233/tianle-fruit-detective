'use strict';
const assert=require('node:assert/strict'),{boot}=require('./test_support');
const clock={now:2000000000000},b=boot({},clock);
function answerCurrent(){
 const q=b.value('ReadingUI.engine().current().question');
 if(q.type==='order')for(const i of q.answer)b.click('rdPick',{index:String(i)});
 else b.click('rdPick',{index:String(q.answer)});
 b.click('rdSubmit');assert.equal(b.value('ReadingUI.engine().current().attempts.at(-1).correct'),true);b.click('rdNext');
}
b.click('reading');b.run("ReadingUI.openMaterials(['R-D001-S1'],{purpose:'practice'})");b.click('rdReadDone');
for(let i=0;i<3;i++)answerCurrent();
const before=b.value("ReadingUI.snapshot().events.filter(e=>e.type==='attempt')");
assert(before.every(e=>e.first&&e.correct&&e.pinyinEver&&!e.independent));
assert.equal(b.value('ReadingUI.engine().challenge().eligible'),true);
assert(b.value('ReadingUI.engine().challenge().materialId'),'An eligible default-range learner should actually have an available new practice passage');
assert.deepEqual(b.value('ReadingUI.snapshot().settings.knownMath'),[]);
assert.deepEqual(b.value("ReadingUI.snapshot().events.filter(e=>e.type==='attempt')"),before);
clock.now+=2*86400000;
const completedBefore=b.value('ReadingUI.report().completedDays');
b.click('rdStart',{day:'83'});
assert.equal(b.value('ReadingUI.engine().current().material.id'),'R-D001-S1');
assert.equal(b.value('ReadingUI.engine().current().session.purpose'),'review');
assert.equal(b.value('ReadingUI.engine().current().session.day'),83);
assert.equal(b.value('ReadingUI.engine().current().session.scopeDay'),83);
assert(b.root.innerHTML.includes('data-reading-review'));
assert(b.root.innerHTML.includes('data-action="rdFreshDay"'));
const reviewId=b.value('ReadingUI.engine().current().session.id');
b.click('rdReadDone');const q=b.value('ReadingUI.engine().current().question');
b.click('rdPick',{index:String(q.answer[0])});
const reviewDraft=b.value('ReadingUI.engine().current().session.drafts');
b.click('rdFreshDay',{day:'83'});
assert.equal(b.value('ReadingUI.engine().current().material.id'),'R-D083-S1');
assert.equal(b.value('ReadingUI.engine().current().session.purpose'),'unseen-choice');
assert.equal(b.value('ReadingUI.engine().current().session.day'),null);
assert.equal(b.value('ReadingUI.engine().current().session.priorExposure["R-D083-S1"]'),false);
assert.equal(b.value('ReadingUI.report().completedDays'),completedBefore);
assert.deepEqual(b.value("ReadingUI.snapshot().events.filter(e=>e.type==='attempt')"),before);
b.click('rdResume',{session:reviewId});
assert.deepEqual(b.value('ReadingUI.engine().current().session.drafts'),reviewDraft);
assert(b.root.innerHTML.includes('data-reading-review'));
// An unfinished review and the newly opened material survive reload as
// separate sessions without changing the earlier first-answer events.
const c=boot(b.storage,clock);c.click('reading');c.click('rdResume',{session:reviewId});
assert.deepEqual(c.value('ReadingUI.engine().current().session.drafts'),reviewDraft);
assert.deepEqual(c.value("ReadingUI.snapshot().events.filter(e=>e.type==='attempt')"),before);
assert.equal(c.value('ReadingUI.report().completedDays'),completedBefore);
console.log(JSON.stringify({result:'PASS',scope:'synthetic practice routing and evidence preservation',assistedFirstAnswersRemainAssisted:true,reviewLabel:true,day83CanChooseUnseen:true,oldDraftRestored:true,unseenChoiceNotDayCompletion:true,physicalDevice:'NOT_TESTED'}));
