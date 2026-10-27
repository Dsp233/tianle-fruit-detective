'use strict';
// Software-reviewed examples only. No claim of pedagogical or device review.
const assert=require('node:assert/strict'),{boot}=require('./test_support'),V=require('./version.json'),K=require('./skills.json');
const answers=require('../docs/rc79/fixtures/independent-mapping-answers.json'),registry=require('./task_scaffold_reviews.json').entries;
const key='tianle_amc8_question_design_v1',topics=K.units.map(u=>u.id),seen=[];
function setup(id){const seed={contentRevision:V.contentRevision,storageVersion:V.storageVersion,topicPractice:{selectedTopicIds:topics,sourceIds:['AMC8'],examIds:[id]},competition:{attempts:[],extensions:[]}};const a=boot({[key]:JSON.stringify(seed)});a.click('home');a.click('topicStart');return a}
function answer(a,value){const task=a.value('saved.rtm1.sessions.active');if(task.definition.answerContract.kind==='choice')a.click('rtmChoice',{value:String(value)});else a.inputRtm(Array.isArray(value)?value.join(','):String(value));a.click('rtmSubmit')}
for(const exam of ['AMC8-2010-01','AMC8-2013-03','AMC8-2017-01','AMC8-2023-01']){
 const a=setup(exam);let steps=0;
 while(a.value('saved.rtm1.sessions.active')&&!a.value('saved.rtm1.sessions.active.finished')&&steps++<10){
  const task=a.value('saved.rtm1.sessions.active'),row=registry[task.id],correct=task.kind==='exam'?answers.originals[task.examId]:answers.training[task.id];
  assert.notEqual(correct,undefined,'missing independent answer for '+task.id);
  if(row){
   answer(a,row.wrongInput);assert.equal(a.value('saved.rtm1.sessions.active.feedback.outcome'),'INCORRECT');
   assert.equal(a.value('saved.rtm1.sessions.active.targetedFeedback'),task.id==='RTM-2023-01-DECISION'?'先看乘法和加法，想一想应先算哪一步。':row.reviewedHints[0]);
   assert.equal(a.value('saved.rtm1.sessions.active.helpLevel'),1);
   const attempt=a.value('saved.rtm1.sessions.active.attemptId');
   assert.equal(a.value('TransferEvidenceStore.attempt(saved.rtm1,'+JSON.stringify(attempt)+').firstSubmission.supportSnapshot.methodHelpCount'),Math.max(task.helpLevel,task.priorMethodHelp?1:0));
   a.click('rtmRetry');answer(a,correct);assert.equal(a.value('saved.rtm1.sessions.active.feedback.outcome'),'VERIFIED');
   const evidence=a.value('TransferEvidenceStore.attempt(saved.rtm1,'+JSON.stringify(attempt)+')');
   assert.equal(evidence.firstSubmission.result.outcome,'INCORRECT');assert.equal(evidence.latestSubmission.supportSnapshot.methodHelpCount,1);
   assert.equal(evidence.events.filter(e=>e.type==='hint_revealed'&&e.reason==='targeted-feedback').length,1);seen.push(task.id);
  }else{answer(a,correct);assert.equal(a.value('saved.rtm1.sessions.active.feedback.outcome'),'VERIFIED')}
  a.click('rtmNext');if(a.value('saved.rtm1.sessions.connected.status')!=='active')break;
 }
 assert.deepEqual(a.value('saved.topicPractice.selectedTopicIds'),topics);
}
assert.deepEqual([...seen].sort(),Object.keys(registry).sort());
// A different wrong option receives conservative feedback; no invented diagnosis.
const b=setup('AMC8-2010-01');answer(b,'wrong2');assert.equal(b.value('saved.rtm1.sessions.active.feedback.outcome'),'INCORRECT');assert.equal(b.value('saved.rtm1.sessions.active.targetedFeedback'),'');assert.equal(b.value('saved.rtm1.sessions.active.helpLevel'),0);
// A holdout never receives the new practice feedback.
for(const id of ['AMC8-2010-01','AMC8-2023-01']){const h=setup(id);h.run("saved.rtm1.sessions.active.mode='exam_holdout';persist();render()");answer(h,'wrong1');assert.equal(h.value('saved.rtm1.sessions.active.targetedFeedback'),'');assert.equal(h.value('saved.rtm1.sessions.active.helpLevel'),0)}
const changed=setup('AMC8-2010-01');changed.run("window.__AMC8_TASK_SCAFFOLDS.entries['RTM-2010-01-DECISION'].reviewedHints[0]='未复核的提示'");answer(changed,'wrong1');assert.equal(changed.value('saved.rtm1.sessions.active.feedback'),null);
console.log(JSON.stringify({result:'PASS',scope:'reviewed targeted practice hints',cases:seen.length,taskIds:seen,unmatchedWrongNoDiagnosis:true,holdoutNoHint:true,tamperedHintBlocked:true,firstAnswersPreserved:true,retryMarkedAssisted:true,selectedKnowledgeUnchanged:true}));
