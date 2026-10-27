'use strict';
const assert=require('node:assert/strict'),{boot}=require('./test_support');
function setup(){
 const b=boot();b.click('home');
 b.run('saved.topicPractice.selectedTopicIds=["A01","A02"];saved.topicPractice.sourceIds=["original"];saved.topicPractice.examIds=[];persist();render()');
 b.click('topicStart');assert.equal(b.value('view'),'competition');return b;
}
function solve(b,{hint=false,wrong=false}={}){
 const t=b.value('taskNow()');
 if(hint)b.click('competitionHint');
 if(wrong){b.click('competitionPick',{index:String((t.answer+1)%5)});b.click('check')}
 b.click('competitionPick',{index:String(t.answer)});b.click('check');
 assert.equal(b.value('topicCurrent().passed'),true);
}
function three(options={}){
 const b=setup();
 for(let i=0;i<3;i++){solve(b,i===1?options:{});if(i<2)b.click('next')}
 return b;
}
const b=three(),offer=b.value('topicChallengeOffer()');
assert(offer&&offer.available);assert(b.root.innerHTML.includes('data-action="topicChallenge"'));
const previous=b.value('JSON.stringify(saved.competition.attempts)'),selected=b.value('saved.topicPractice.selectedTopicIds');
const last=b.value('taskNow().competition.signature'),oldLevel=offer.level;
b.click('topicChallenge');
const task=b.value('taskNow()');
assert.notEqual(task.competition.signature,last);assert(task.competition.level>oldLevel);
assert.deepEqual(b.value('saved.topicPractice.selectedTopicIds'),selected);
assert.equal(b.value('SourceCatalog.taskAllowed(taskNow(),topicSessionSettings()).length>0'),true);
assert.equal(b.value('JSON.stringify(saved.competition.attempts)'),previous);
assert.equal(b.value('CompetitionIdentity.exposure(saved.competition,taskNow()).attempted'),false);
assert.equal(b.value('topicSession().items.length'),4);

const assisted=three({hint:true});assert.equal(assisted.value('topicChallengeOffer()'),null);
assert(!assisted.root.innerHTML.includes('data-action="topicChallenge"'));
const retry=three({wrong:true});assert.equal(retry.value('topicChallengeOffer()'),null);
assert(!retry.root.innerHTML.includes('data-action="topicChallenge"'));

const noSupply=three();const attempts=noSupply.value('JSON.stringify(saved.competition.attempts)'),session=noSupply.value('JSON.stringify(topicSession().items)');
noSupply.run('for(const f of COMPETITION_REVIEWED)if(f.level>2)f.level=2;render()');
assert.equal(noSupply.value('topicChallengeOffer().available'),false);
assert(!noSupply.root.innerHTML.includes('data-action="topicChallenge"'));
assert(noSupply.root.innerHTML.includes('暂无更高阶段'));
assert.equal(noSupply.value('JSON.stringify(saved.competition.attempts)'),attempts);
assert.equal(noSupply.value('JSON.stringify(topicSession().items)'),session);
console.log(JSON.stringify({result:'PASS',scope:'optional reviewed original-math challenge',threeUnassistedFirstAnswers:true,scopeRechecked:true,oldAnswersPreserved:true,hintAndRetryDoNotTrigger:true,noSupplyDoesNotAdvance:true,connectedPractice:'NOT_COVERED'}));
