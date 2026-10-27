'use strict';
// Synthetic profile: the parent queue is a read-only projection, not regrading.
const assert=require('node:assert/strict'),{boot}=require('./test_support'),V=require('./version.json');
const key='tianle_amc8_question_design_v1';
const profile={contentRevision:V.contentRevision,storageVersion:V.storageVersion,topicPractice:{selectedTopicIds:['A01','A02'],sourceIds:['AMC8'],examIds:['AMC8-2023-01']},competition:{attempts:[],extensions:[]}};
const a=boot({[key]:JSON.stringify(profile)});a.click('home');a.click('topicStart');
assert.equal(a.value('saved.rtm1.sessions.active.id'),'RTM-2023-01-DECISION');
a.click('rtmChoice',{value:'wrong1'});a.click('rtmSubmit');assert.equal(a.value('saved.rtm1.sessions.active.feedback.outcome'),'INCORRECT');
const attempt=a.value('saved.rtm1.sessions.active.attemptId'),before=a.value('JSON.stringify(saved.rtm1)'),selected=a.value('JSON.stringify(saved.topicPractice.selectedTopicIds)');
a.click('rtmBack');a.click('progress');assert(a.root.innerHTML.includes('data-math-support-queue'));assert(a.root.innerHTML.includes('data-id="'+attempt+'"'));
a.click('rtmReview',{id:attempt});assert.equal(a.value('view'),'examMapping');assert(a.root.innerHTML.includes('data-rtm-history'));assert(a.root.innerHTML.includes('只读回看'));assert(a.root.innerHTML.includes('data-action="rtmReturn"'));assert.equal(a.value('JSON.stringify(saved.rtm1)'),before);
a.click('rtmReturn');assert(a.root.innerHTML.includes('data-rtm-task'));assert.equal(a.value('saved.rtm1.sessions.active.attemptId'),attempt);a.click('rtmRetry');a.click('rtmChoice',{value:'valid'});a.click('rtmSubmit');
assert.equal(a.value('saved.rtm1.sessions.active.feedback.outcome'),'VERIFIED');assert.equal(a.value('TransferEvidenceStore.attempt(saved.rtm1,saved.rtm1.sessions.active.attemptId).firstSubmission.result.outcome'),'INCORRECT');
const after=a.value('JSON.stringify(saved.rtm1)');a.click('rtmBack');a.click('progress');assert(a.root.innerHTML.includes('当前没有需要回看的未答对尝试'));assert.equal(a.value('JSON.stringify(saved.rtm1)'),after);assert.equal(a.value('JSON.stringify(saved.topicPractice.selectedTopicIds)'),selected);
// A short support probe is not itself an independent wrong-question item.
const K=require('./skills.json');const b=boot({[key]:JSON.stringify({contentRevision:V.contentRevision,storageVersion:V.storageVersion,topicPractice:{selectedTopicIds:K.units.map(x=>x.id),sourceIds:['AMC8'],examIds:['AMC8-2000-01']},competition:{attempts:[],extensions:[]}})});
function wrong(learner){const t=learner.value('saved.rtm1.sessions.active');if(t.definition.answerContract.kind==='choice'){const x=t.definition.options.find(o=>String(o.id)!==String(t.definition.answerContract.expected));learner.click('rtmChoice',{value:String(x.id)});}else learner.inputRtm('wrong_reference');learner.click('rtmSubmit');assert.equal(learner.value('saved.rtm1.sessions.active.feedback.outcome'),'INCORRECT');}
b.click('home');b.click('topicStart');wrong(b);const parent=b.value('saved.rtm1.sessions.active.attemptId');assert(b.root.innerHTML.includes('data-action="rtmDiagnostic"'));b.click('rtmDiagnostic');const probe=b.value('saved.rtm1.sessions.active.attemptId');wrong(b);const journal=b.value('JSON.stringify(saved.rtm1)');b.click('rtmBack');b.click('progress');assert(b.root.innerHTML.includes('data-id="'+parent+'"'));assert(!b.root.innerHTML.includes('data-id="'+probe+'"'));assert.equal(b.value('JSON.stringify(saved.rtm1)'),journal);
console.log(JSON.stringify({result:'PASS',scope:'synthetic parent review queue',unresolvedAppears:true,readOnlyReview:true,firstWrongRetained:true,solvedNotQueued:true,remediationNotIndependent:true,selectionUnchanged:true}));
