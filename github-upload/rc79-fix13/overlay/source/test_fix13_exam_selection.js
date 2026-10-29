'use strict';
// Synthetic profiles, actual selection actions and VM-based task navigation.
// The blocked image is a controlled mock, not a physical-device test.
const assert=require('node:assert/strict'),fs=require('fs'),{boot}=require('./test_support'),V=require('./version.json'),K=require('./skills.json');
const store='tianle_amc8_qa_normal_rc79_v1',html=fs.readFileSync('qa/normal/index.html','utf8');
function setup(id){
 const p={contentRevision:V.contentRevision,storageVersion:V.storageVersion,topicPractice:{selectedTopicIds:K.units.map(x=>x.id),sourceIds:['AMC8'],examIds:[id]},competition:{attempts:[],extensions:[]}};
 const b=boot({[store]:JSON.stringify(p)},2000000000000,html);b.click('home');b.click('topicStart');assert.equal(b.value('saved.rtm1.sessions.active.originProblemGroupId'),id);return b;
}
function correct(b){const t=b.value('saved.rtm1.sessions.active'),v=t.definition.answerContract.expected;if(t.definition.answerContract.kind==='choice')b.click('rtmChoice',{value:String(v)});else b.inputRtm(String(v));b.click('rtmSubmit');assert.equal(b.value('saved.rtm1.sessions.active.feedback.outcome'),'VERIFIED');}
function toOriginal(b,id){for(let n=0;n<10;n++){const a=b.value('saved.rtm1.sessions.active');if(a.kind==='exam'){assert.equal(a.id,id);return}correct(b);b.click('rtmNext')}throw Error('original not reached '+id)}
function select(b,id,action){b.run('sourceExamCandidate='+JSON.stringify(id));b.click(action);}

// 2009-03: image unavailable, retained original cannot be answered or lost.
const a=setup('AMC8-2009-03');toOriginal(a,'AMC8-2009-03');
assert.equal(a.value('saved.rtm1.sessions.active.definition.givenFigures.length'),1);
const old=a.value('saved.rtm1.sessions.active.attemptId'),group=a.value('saved.rtm1.sessions.connected.groupId');
a.run('document.querySelectorAll=()=>[{complete:false,naturalWidth:0}]');
a.inputRtm('6');const beforeCount=a.value('TransferEvidenceStore.events(saved.rtm1).filter(e=>e.type==="response_submitted"&&e.attemptId==='+JSON.stringify(old)+').length');
a.click('rtmSubmit');assert.equal(a.value('TransferEvidenceStore.events(saved.rtm1).filter(e=>e.type==="response_submitted"&&e.attemptId==='+JSON.stringify(old)+').length'),beforeCount);
a.click('rtmBack');assert(a.root.innerHTML.includes('AMC8-2009-03'));assert(a.root.innerHTML.includes('按当前选择开始新组'));
a.click('topicParentUnlock');select(a,'AMC8-2023-01','sourceExamAdd');
assert.deepEqual(a.value('saved.topicPractice.examIds'),['AMC8-2009-03','AMC8-2023-01']);
assert(a.root.innerHTML.includes('AMC8-2009-03、AMC8-2023-01'));
a.click('rtmConnectedResume');assert.equal(a.value('saved.rtm1.sessions.active.attemptId'),old);assert.equal(a.value('saved.rtm1.sessions.connected.groupId'),group);
a.click('rtmBack');a.click('topicParentUnlock');
select(a,'AMC8-2023-01','sourceExamReplace');assert.deepEqual(a.value('saved.topicPractice.examIds'),['AMC8-2023-01']);
assert.equal(a.value('saved.rtm1.sessions.connected.groupId'),group);
assert.equal(a.value('saved.rtm1.sessions.active.attemptId'),old);
a.click('topicStart');assert.equal(a.value('saved.rtm1.sessions.active.originProblemGroupId'),'AMC8-2023-01');
assert.notEqual(a.value('saved.rtm1.sessions.connected.groupId'),group);
assert(a.value('saved.rtm1.sessions.archived.some(x=>x.attemptId==='+JSON.stringify(old)+')'));
assert.equal(a.value('saved.rtm1.sessions.archived.find(x=>x.attemptId==='+JSON.stringify(old)+').input'),'6');
assert.equal(a.value('TransferEvidenceStore.events(saved.rtm1).filter(e=>e.type==="response_submitted"&&e.attemptId==='+JSON.stringify(old)+').length'),beforeCount);

// 2009-17: wrong first answer remains intact after a new group starts.
const b=setup('AMC8-2009-17');b.click('rtmChoice',{value:'wrong1'});b.click('rtmSubmit');
assert.equal(b.value('saved.rtm1.sessions.active.feedback.outcome'),'INCORRECT');
const firstId=b.value('saved.rtm1.sessions.active.attemptId');
const first=b.value('JSON.stringify(TransferEvidenceStore.attempt(saved.rtm1,'+JSON.stringify(firstId)+').firstSubmission)');
b.click('rtmBack');b.click('topicParentUnlock');select(b,'AMC8-2023-01','sourceExamReplace');b.click('topicStart');
assert.equal(b.value('saved.rtm1.sessions.active.originProblemGroupId'),'AMC8-2023-01');
assert.equal(b.value('JSON.stringify(TransferEvidenceStore.attempt(saved.rtm1,'+JSON.stringify(firstId)+').firstSubmission)'),first);
assert(b.value('saved.rtm1.sessions.archived.some(x=>x.attemptId==='+JSON.stringify(firstId)+')'));

// Changes attempted with a read-only record never alter the selected set.
const c=setup('AMC8-2009-17');c.click('rtmBack');c.click('topicParentUnlock');c.run('canPersist=false;sourceExamCandidate="AMC8-2023-01"');
const scope=c.value('JSON.stringify(saved.topicPractice.examIds)'),journal=c.value('JSON.stringify(saved.rtm1)');
c.click('sourceExamReplace');assert.equal(c.value('JSON.stringify(saved.topicPractice.examIds)'),scope);
assert.equal(c.value('JSON.stringify(saved.rtm1)'),journal);
assert(c.root.innerHTML.includes('当前记录暂不能写入，选题未更改'));
console.log(JSON.stringify({result:'PASS',scope:'isolated VM profiles and controlled unavailable-image mock',appendAndReplaceExplicit:true,blockedImageAttemptRetained:true,wrongFirstRetained:true,newGroupUsesCurrentScope:true,readOnlySelectionUnchanged:true,physicalImageDevice:'NOT_TESTED'}));
