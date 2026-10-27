'use strict';
// Create an actual record with the exact frozen HOME1 application, then open
// it using this candidate. No real learner data is accessed.
const assert=require('node:assert/strict'),fs=require('node:fs'),crypto=require('node:crypto'),{boot}=require('./test_support'),V=require('./version.json'),K=require('./skills.json');
const html=fs.readFileSync(process.env.FIX79_BASELINE_HTML||'tmp/fix79-baseline.html','utf8'),key='tianle_amc8_question_design_v1';
assert.equal(crypto.createHash('sha256').update(html).digest('hex'),'df38ff002e12f35e7cd90fe2718e94797305ff9b921135af5997217590404599');
const mk=(topics,exam)=>({[key]:JSON.stringify({contentRevision:V.contentRevision,storageVersion:V.storageVersion,topicPractice:{selectedTopicIds:topics,sourceIds:['AMC8'],examIds:[exam]},competition:{attempts:[],extensions:[]}})});
const prior=boot(mk(['A01','A02'],'AMC8-2023-01'),2000000000000,html);prior.click('home');prior.click('topicStart');
assert.equal(prior.value('saved.rtm1.sessions.active.id'),'RTM-2023-01-DECISION');prior.click('rtmChoice',{value:'wrong1'});prior.click('rtmSubmit');prior.click('rtmHint');prior.click('rtmChoice',{value:'valid'});
const originalId=prior.value('saved.rtm1.sessions.active.attemptId'),originalEvents=prior.value('JSON.stringify(saved.rtm1.eventsById)'),originalRaw=prior.storage[key];
fs.writeFileSync('tmp/fix79-legacy-fixture.json',JSON.stringify({synthetic:true,key,raw:originalRaw,attemptId:originalId,events:originalEvents}));
assert.equal(prior.value('saved.rtm1.sessions.active.mappingBuildId'),'a1d855c798c8458a6ea5d99c709e54e8341b87b23aa12b1c89211164e793ebb9');
const next=boot(prior.storage,2000000001000);next.click('home');next.click('rtmConnectedResume');assert(next.root.innerHTML.includes('data-rtm-task'));assert.equal(next.value('saved.rtm1.sessions.active.attemptId'),originalId);assert.equal(next.value('saved.rtm1.sessions.active.input'),'valid');assert.equal(next.value('JSON.stringify(saved.rtm1.eventsById)'),originalEvents);assert.equal(next.storage[key],originalRaw);
next.click('rtmSubmit');assert.equal(next.value('TransferEvidenceStore.attempt(saved.rtm1,saved.rtm1.sessions.active.attemptId).firstSubmission.input'),'wrong1');assert.equal(next.value('TransferEvidenceStore.attempt(saved.rtm1,saved.rtm1.sessions.active.attemptId).latestSubmission.result.outcome'),'VERIFIED');
const oldJoint=prior.value('JointReuseReview.projection()'),newJoint=next.value('JointReuseReview.projection()');assert.equal(oldJoint.length,95);assert.deepEqual(newJoint,oldJoint);assert(newJoint.every(row=>row.status==='REVIEWED'));
assert.equal(next.value('JointReuseReview.create({...JointReuseReview.config,sourceHashes:{...JointReuseReview.config.sourceHashes,"selection_diagnostics.js":"tampered"}}).review("J-C04-04").status'),'STALE');
const geo=boot(mk(K.units.map(u=>u.id),'AMC8-2000-24'),2000000000000,html);geo.click('home');geo.click('topicStart');assert.equal(geo.value('saved.rtm1.sessions.active.id'),'RTM-2000-24-DECISION');const geoId=geo.value('saved.rtm1.sessions.active.attemptId'),geoEvents=geo.value('JSON.stringify(saved.rtm1.eventsById)');
const safe=boot(geo.storage,2000000001000);safe.click('home');safe.click('rtmConnectedResume');assert(safe.root.innerHTML.includes('题目呈现或内容版本发生变化'));assert(!safe.root.innerHTML.includes('data-rtm-form'));assert.equal(safe.value('saved.rtm1.sessions.active.attemptId'),geoId);assert.equal(safe.value('JSON.stringify(saved.rtm1.eventsById)'),geoEvents);
console.log(JSON.stringify({result:'PASS',scope:'exact frozen HOME1 record to FIX1 candidate',unchangedTaskDraftResumed:true,firstWrongAndHintRetained:true,unchangedJointReviews:95,tamperedUiHashRejected:true,changedGeometryPresentationReadOnly:true,noRealLearnerData:true}));
