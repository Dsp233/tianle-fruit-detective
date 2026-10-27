'use strict';
// Real connected sessions, with a synthetic isolated learner profile.
const assert=require('node:assert/strict'),fs=require('fs'),{boot}=require('./test_support');
const K=require('./skills.json'),V=require('./version.json'),S=require('./transfer_evidence_store');
const html=fs.readFileSync('qa/normal/index.html','utf8');
const key='tianle_amc8_qa_normal_rc'+V.siteVersion.match(/rc\.(\d+)/)[1]+'_v1';
function setup(ids=['AMC8-2000-01']){
 return boot({[key]:JSON.stringify({contentRevision:V.contentRevision,storageVersion:V.storageVersion,
  topicPractice:{sourceIds:['AMC8'],examIds:ids,selectedTopicIds:K.units.map(u=>u.id)},
  competition:{attempts:[],extensions:[]},rtm1:S.fresh()})},2000000000000,html);
}
function count(html,needle){return html.split(needle).length-1}
const one=setup();one.click('topicStart');one.inputRtm('wrong_reference');one.click('rtmSubmit');one.click('rtmNext');
const descriptor=one.value('saved.rtm1.sessions.connected.deferredTargets[0]');
assert(one.root.innerHTML.includes('可继续的保留任务 1 项；暂停 0 项'));
assert.equal(count(one.root.innerHTML,'data-action="rtmConnectedRetry"'),1);
const before=one.value('JSON.stringify(saved.rtm1)');
one.run('saved.topicPractice.sourceIds=[];render()');
assert(one.root.innerHTML.includes('可继续的保留任务 0 项；暂停 1 项'));
assert.equal(count(one.root.innerHTML,'data-action="rtmConnectedRetry"'),0);
assert(one.root.innerHTML.includes('data-retained-paused'));
assert.equal(one.value('JSON.stringify(saved.rtm1)'),before);
one.click('rtmReview',{id:descriptor.sourceAttemptId});
assert(one.root.innerHTML.includes('这里只读回看'));
assert.equal(one.value('JSON.stringify(saved.rtm1)'),before);
one.click('rtmReturn');one.run('saved.topicPractice.sourceIds=["AMC8"];render()');
assert(one.root.innerHTML.includes('可继续的保留任务 1 项；暂停 0 项'));
one.click('rtmConnectedRetry',{id:descriptor.deferredId});
assert.equal(one.value('saved.rtm1.sessions.connected.retryOf'),descriptor.deferredId);
assert.equal(one.value('TransferEvidenceStore.instance(saved.rtm1,saved.rtm1.sessions.active.mathKey).firstSubmission.input'),'wrong_reference');

const empty=setup();empty.click('topicStart');empty.click('rtmNext');
empty.run('saved.rtm1.sessions.connected.deferredTargets=[];render()');
assert(empty.root.innerHTML.includes('可继续的保留任务 0 项；暂停 0 项'));
assert.equal(count(empty.root.innerHTML,'data-action="rtmConnectedRetry"'),0);

const multiple=setup(['AMC8-2000-01','AMC8-2001-03']);multiple.click('topicStart');
multiple.click('rtmNext');multiple.click('rtmNext');
assert.equal(multiple.value('saved.rtm1.sessions.connected.deferredTargets.length'),2);
assert(multiple.root.innerHTML.includes('可继续的保留任务 2 项；暂停 0 项'));
assert.equal(count(multiple.root.innerHTML,'data-action="rtmConnectedRetry"'),2);
multiple.run('saved.rtm1.sessions.connected.deferredTargets[0].mappingBuildId="old";render()');
assert(multiple.root.innerHTML.includes('可继续的保留任务 1 项；暂停 1 项'));
assert.equal(count(multiple.root.innerHTML,'data-action="rtmConnectedRetry"'),1);
assert(multiple.root.innerHTML.includes('题目内容或呈现已更新'));
console.log(JSON.stringify({result:'PASS',scope:'retained task counts, retry eligibility and read-only records',cases:['zero','one','two','scope-paused','content-changed','resume'],recordsPreserved:true}));
