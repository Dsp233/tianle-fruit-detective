'use strict';
const assert=require('node:assert/strict'),{boot}=require('./test_support'),V=require('./version.json'),K=require('./skills.json');
const A=require('../docs/rc79/fixtures/independent-mapping-answers.json');
const key='tianle_amc8_question_design_v1',topics=K.units.map(u=>u.id),seed={contentRevision:V.contentRevision,storageVersion:V.storageVersion,topicPractice:{selectedTopicIds:topics,sourceIds:['AMC8'],examIds:[]},competition:{attempts:[],extensions:[]}};
const a=boot({[key]:JSON.stringify(seed)});a.click('home');a.click('topicStart');
function wrong(){const t=a.value('saved.rtm1.sessions.active'),right=A.training[t.id]??A.originals[t.examId];
 if(t.definition.answerContract.kind==='choice'){const value=t.definition.options.find(o=>String(o.id)!==String(right)).id;a.click('rtmChoice',{value:String(value)});}else a.inputRtm('999999');
 a.click('rtmSubmit');assert.equal(a.value('saved.rtm1.sessions.active.feedback.outcome'),'INCORRECT');}
wrong();assert(!a.root.innerHTML.includes('data-connected-support'));a.click('rtmNext');wrong();assert(a.root.innerHTML.includes('data-connected-support'));
const id=a.value('saved.rtm1.sessions.active.attemptId'),raw=a.value('JSON.stringify(saved.rtm1)');a.click('rtmBack');a.click('rtmConnectedResume');
assert.equal(a.value('saved.rtm1.sessions.active.attemptId'),id);assert.equal(a.value('JSON.stringify(saved.rtm1)'),raw);assert(a.root.innerHTML.includes('data-connected-support'));
assert.deepEqual(a.value('saved.topicPractice.selectedTopicIds'),topics);
console.log(JSON.stringify({result:'PASS',scope:'two-first-error support suggestion',sameAttemptAfterResume:true,eventsPreserved:true,knowledgeUnchanged:true,automaticDifficultyChange:'NOT_CLAIMED'}));
