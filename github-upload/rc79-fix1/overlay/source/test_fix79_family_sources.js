'use strict';
// One isolated learner goes through the three actual mathematics entry paths.
const assert=require('node:assert/strict'),fs=require('fs'),{boot}=require('./test_support');
const V=require('./version.json'),K=require('./skills.json');
const key='tianle_amc8_qa_normal_rc'+V.siteVersion.match(/rc\.(\d+)/)[1]+'_v1';
const html=fs.readFileSync('qa/normal/index.html','utf8');
const b=boot({[key]:JSON.stringify({contentRevision:V.contentRevision,storageVersion:V.storageVersion,
 topicPractice:{selectedTopicIds:['A01','A02'],sourceIds:['original'],examIds:[]},
 competition:{attempts:[],extensions:[]}})},2000000000000,html);

// A real old-route submission, then a real original competition submission.
b.click('sample',{code:'A01'});const oldTask=b.value('taskNow()');b.click('choice',{index:'1'});b.click('check');
assert.equal(b.value('saved.attempts.length'),1);
b.click('home');b.click('topicStart');assert.equal(b.value('view'),'competition');
const competition=b.value('taskNow()');assert(Array.isArray(competition.options));
b.click('competitionPick',{index:String((competition.answer+1)%5)});b.click('check');
assert.equal(b.value('saved.competition.attempts.length'),1);
const firstChoice=competition.options[(competition.answer+1)%5];
b.click('competitionPick',{index:String(competition.answer)});b.click('check');
assert.equal(b.value('saved.competition.attempts.length'),2);

// A real connected first error and a retry. Earlier answers remain separate.
b.click('home');b.run('saved.topicPractice.sourceIds=["AMC8"];saved.topicPractice.examIds=["AMC8-2023-01"];saved.topicPractice.selectedTopicIds=["A01","A02"];persist();render()');
b.click('topicStart');assert.equal(b.value('view'),'examMapping');
const wrong=b.value('saved.rtm1.sessions.active.definition.options.find(x=>x.id==="wrong1").text');
b.click('rtmChoice',{value:'wrong1'});b.click('rtmSubmit');b.click('rtmRetry');b.click('rtmChoice',{value:'valid'});b.click('rtmSubmit');
const before=b.value('JSON.stringify({legacy:saved.attempts,competition:saved.competition.attempts,connected:saved.rtm1})');
b.click('progress');
const panel=b.root.innerHTML;
assert(panel.includes('旧路线提交 1 次；竞赛练习提交 2 次'));
assert(panel.includes('真题及衔接练习：已提交 2 次，涉及 1 次题目尝试'));
assert(panel.includes('data-legacy-math-records')&&panel.includes(oldTask.prompt));
assert(panel.includes('data-competition-math-records')&&panel.includes(competition.prompt));
assert(panel.includes('首次提交：'+firstChoice+'（未答对）'));
assert(panel.includes('之后提交 1 次，最近答对'));
assert(panel.includes('本次首次提交：'+wrong+'（未答对）'));
assert.equal(b.value('JSON.stringify({legacy:saved.attempts,competition:saved.competition.attempts,connected:saved.rtm1})'),before);
const backup=b.value('progressSnapshot()');assert.equal(backup.record.attempts.length,1);
assert.equal(backup.record.competition.attempts.length,2);assert.equal(Object.keys(backup.record.rtm1.eventsById).length,b.value('Object.keys(saved.rtm1.eventsById).length'));
console.log(JSON.stringify({result:'PASS',scope:'three actual math sources in one isolated profile',legacySubmissions:1,competitionSubmissions:2,connectedSubmissions:2,firstAnswersAndRetriesSeparate:true,recordsAndBackupPreserved:true}));
