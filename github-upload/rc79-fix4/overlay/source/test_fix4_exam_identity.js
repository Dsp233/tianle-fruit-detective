'use strict';
// Synthetic records: verify source labels without changing attempts or grading.
const assert=require('node:assert/strict'),{boot}=require('./test_support'),V=require('./version.json');
const key='tianle_amc8_question_design_v1';
const profile={contentRevision:V.contentRevision,storageVersion:V.storageVersion,topicPractice:{selectedTopicIds:['A01','A02'],sourceIds:['AMC8'],examIds:['AMC8-2023-01']},competition:{attempts:[],extensions:[]}};
const a=boot({[key]:JSON.stringify(profile)});a.click('home');a.click('topicStart');
const current=a.value('saved.rtm1.sessions.active');
assert.equal(current.id,'RTM-2023-01-DECISION');
assert(a.root.innerHTML.includes('AMC8 2023 第 1 题'));
assert(a.root.innerHTML.includes('准备练习'));
a.click('rtmChoice',{value:'wrong1'});a.click('rtmSubmit');
const attempt=a.value('saved.rtm1.sessions.active.attemptId'),saved=a.value('JSON.stringify(saved.rtm1)'),topics=a.value('JSON.stringify(saved.topicPractice.selectedTopicIds)');
a.click('rtmBack');a.click('progress');
assert(a.root.innerHTML.includes('AMC8 2023 第 1 题'));
a.click('rtmReview',{id:attempt});
assert(a.root.innerHTML.includes('data-rtm-source'));
assert(a.root.innerHTML.includes('AMC8 2023 第 1 题'));
assert(a.root.innerHTML.includes('准备练习'));
assert(!a.root.innerHTML.includes('AMC8真题 ·'));
assert.equal(a.value('JSON.stringify(saved.rtm1)'),saved);
a.click('rtmReturn');assert.equal(a.value('saved.rtm1.sessions.active.attemptId'),attempt);
assert.equal(a.value('JSON.stringify(saved.topicPractice.selectedTopicIds)'),topics);

// Nine real mapped identities, including an originally missing-figure sample.
const examples=a.value(`Object.values(ExamMapping.data.problems).filter(p=>p.sourceId==='AMC8'&&p.status.verificationStatus==='PASS').map(p=>p.examId).sort().slice(0,8).concat(['AMC8-2025-02'])`);
assert.equal(examples.length,9);
for(const id of examples){
 const label=a.value(`ExamMappingUI.sourceLabel({kind:'exam',id:${JSON.stringify(id)},examId:${JSON.stringify(id)},mappingBuildId:ExamMapping.data.mappingBuildId})`);
 const [,year,no]=/^AMC8-(\d{4})-(\d{2})$/.exec(id);
 assert(label.includes('AMC8 '+year+' 第 '+Number(no)+' 题'));
 assert(label.includes(id));assert(label.startsWith('AMC8真题'));
}
assert.equal(a.value(`ExamMappingUI.sourceLabel({kind:'exam',id:'AMC8-2099-01',examId:'AMC8-2099-01',mappingBuildId:ExamMapping.data.mappingBuildId})`),'真题来源待核验');
assert.equal(a.value(`ExamMappingUI.sourceLabel({...saved.rtm1.sessions.active,mappingBuildId:'unknown-old-build'})`),'练习来源待核验');
assert.equal(a.value(`ExamMappingUI.sourceLabel({...saved.rtm1.sessions.active,originProblemGroupId:'AMC8-2025-02'})`),'练习来源待核验');
assert(a.value(`ExamMappingUI.sourceLabel({...saved.rtm1.sessions.active,relatedPracticeOf:'old-attempt'})`).includes('相关练习'));
for(const id of V.compatibleMappingBuildIds){
 a.run('saved.rtm1.sessions.active.mappingBuildId='+JSON.stringify(id)+';saved.rtm1.sessions.connected.mappingBuildId='+JSON.stringify(id)+';persist();render()');
 const before=a.value('JSON.stringify(saved.rtm1)');
 assert(a.root.innerHTML.includes('data-rtm-task'));
 assert(a.root.innerHTML.includes('AMC8 2023 第 1 题'));
 a.click('rtmBack');a.click('rtmConnectedResume');
 assert(a.root.innerHTML.includes('data-rtm-task'));
 assert.equal(a.value('JSON.stringify(saved.rtm1)'),before);
 assert.equal(a.value('TransferEvidenceStore.attempt(saved.rtm1,saved.rtm1.sessions.active.attemptId).firstSubmission.result.outcome'),'INCORRECT');
}
const legacy=boot({[key]:JSON.stringify(profile)});legacy.click('home');legacy.click('topicStart');legacy.click('rtmChoice',{value:'wrong1'});legacy.click('rtmSubmit');
legacy.run('saved.rtm1.sessions.active.definition=null;persist()');
const legacyId=legacy.value('saved.rtm1.sessions.active.attemptId'),legacyBefore=legacy.value('JSON.stringify(saved.rtm1)');
legacy.click('rtmHistory');assert(legacy.root.innerHTML.includes('题面暂不可用，可导出原记录'));
legacy.click('rtmReview',{id:legacyId});assert(legacy.root.innerHTML.includes('题面暂时无法显示'));
assert(legacy.root.innerHTML.includes('导出完整记录'));assert.equal(legacy.value('JSON.stringify(saved.rtm1)'),legacyBefore);
console.log(JSON.stringify({result:'PASS',scope:'verified exam identity display and malformed legacy history',mappedExamples:9,unverifiedNotGuessed:true,practiceNotOriginal:true,historyReadOnly:true,firstAnswerAndSelectionPreserved:true,priorCompatibleBuilds:V.compatibleMappingBuildIds.length,malformedLegacySafelyDisplayed:true}));
