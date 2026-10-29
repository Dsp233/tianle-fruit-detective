'use strict';
// Isolated fixtures only: verify that the parent view projects records without
// rewriting their first answers, support history, or archived sessions.
const assert=require('node:assert/strict'),fs=require('fs'),{boot}=require('./test_support'),V=require('./version.json');
const key='tianle_amc8_qa_normal_rc'+V.siteVersion.match(/rc\.(\d+)/)[1]+'_v1';
const profile={contentRevision:V.contentRevision,storageVersion:V.storageVersion,topicPractice:{selectedTopicIds:['A01','A02'],sourceIds:['AMC8'],examIds:['AMC8-2023-01']},competition:{attempts:[],extensions:[]}};
const b=boot({[key]:JSON.stringify(profile)},2000000000000,fs.readFileSync('qa/normal/index.html','utf8'));
const section=(html,marker)=>html.split(marker)[1]?.split('</section>')[0]||'';
b.click('home');b.click('topicStart');
b.click('rtmChoice',{value:'wrong1'});b.click('rtmSubmit');
const attempt=b.value('saved.rtm1.sessions.active.attemptId');
const first=b.value('JSON.stringify(TransferEvidenceStore.attempt(saved.rtm1,saved.rtm1.sessions.active.attemptId).firstSubmission)');
const before=b.value('JSON.stringify(saved.rtm1)');
b.click('progress');
assert(section(b.root.innerHTML,'data-math-support-queue').includes(attempt));
assert(section(b.root.innerHTML,'data-math-support-queue').includes('组未完成'));
assert(!section(b.root.innerHTML,'data-math-independent-errors').includes(attempt));
b.click('rtmReview',{id:attempt});
assert(b.root.innerHTML.includes('只读回看'));
assert.equal(b.value('JSON.stringify(saved.rtm1)'),before);
b.click('rtmReturn');b.click('rtmRetry');b.click('rtmChoice',{value:'valid'});b.click('rtmSubmit');
assert.equal(b.value('JSON.stringify(TransferEvidenceStore.attempt(saved.rtm1,saved.rtm1.sessions.active.attemptId).firstSubmission)'),first);

// Add synthetic archived cases and finish markers to the isolated profile.
// The ten-member group tests the boundary, not a real learner's completion.
b.run(`
{
 let s=TransferEvidenceStore.restore(saved.rtm1).state;
 const original=s.sessions.active, group=s.sessions.connected;
 const template=TransferEvidenceStore.events(s).find(e=>e.type==='response_submitted');
 const put=e=>{const result=TransferEvidenceStore.append(s,e);if(!result.ok)throw Error(result.reason);s=result.state};
 const finish=(id,g,seq)=>{const e={...template,eventId:id+':finish',attemptId:id,sequence:seq,type:'attempt_finished',connectedGroupId:g,reason:'completed'};delete e.recordOrdinal;put(e)};
 finish(original.attemptId,group.groupId,original.nextSequence);
 const specs=[
  ['correct','VERIFIED'],['assisted','INCORRECT'],['unknown','INCORRECT'],
  ['related','INCORRECT'],['exposed','INCORRECT'],['diagnostic','INCORRECT'],
  ['conflict','INCORRECT'],['ordinal2','INCORRECT'],['wrong','INCORRECT']
 ];
 s.sessions.archived??=[];
 group.attemptIds=[original.attemptId,...specs.map(([name])=>'fixture-'+name)];
 group.status='completed';group.total=10;
 s.sessions.connected=group;
 for(const [name,outcome] of specs){
  const id='fixture-'+name,k='fixture-math-'+name;
  const a={...original,attemptId:id,mathKey:k,connectedGroupId:group.groupId,definition:{...original.definition,prompt:'测试-'+name},relatedPracticeOf:name==='related'?{attemptId:original.attemptId}:null,diagnosticOf:name==='diagnostic'?{attemptId:original.attemptId}:null,finished:true};
  s.sessions.archived.push(a);
  const shown={...template,eventId:id+':shown',attemptId:id,sequence:1,type:'problem_presented',mathKey:k,priorExposure:name==='exposed',connectedGroupId:group.groupId};
  delete shown.recordOrdinal;put(shown);
  const response={...template,eventId:id+':response',attemptId:id,sequence:2,mathKey:k,priorExposure:name==='exposed',connectedGroupId:group.groupId,submissionOrdinal:name==='ordinal2'?2:1,result:{outcome},supportSnapshot:{methodHelpCount:name==='assisted'?1:0,answerRevealed:false}};
  if(name==='unknown')delete response.supportSnapshot;
  delete response.recordOrdinal;put(response);
  if(name==='conflict'){const dupe={...response,eventId:id+':conflict',sequence:3};put(dupe)}
  finish(id,group.groupId,4);
 }
 for(const [name,status] of [['incomplete','active'],['badgroup','completed']]){
  const id='fixture-'+name,gid='fixture-group-'+name,k='fixture-math-'+name;
  s.sessions.connectedArchive??=[];
  s.sessions.connectedArchive.push({groupId:gid,status,total:10,attemptIds:[id]});
  s.sessions.archived.push({...original,attemptId:id,mathKey:k,connectedGroupId:gid,definition:{...original.definition,prompt:'测试-'+name},relatedPracticeOf:null,diagnosticOf:null});
  const shown={...template,eventId:id+':shown',attemptId:id,sequence:1,type:'problem_presented',mathKey:k,priorExposure:false,connectedGroupId:gid};delete shown.recordOrdinal;put(shown);
  const response={...template,eventId:id+':response',attemptId:id,sequence:2,mathKey:k,priorExposure:false,connectedGroupId:gid,submissionOrdinal:1,result:{outcome:'INCORRECT'},supportSnapshot:{methodHelpCount:0,answerRevealed:false}};delete response.recordOrdinal;put(response);
  finish(id,gid,3);
 }
 saved.rtm1=s;persist();
}
`);
const archived=b.value('JSON.stringify(saved.rtm1)'),backupBefore=b.value('JSON.stringify(progressSnapshot().record.rtm1)');
b.click('progress');const page=b.root.innerHTML,independent=section(page,'data-math-independent-errors'),support=section(page,'data-math-support-queue');
assert(independent.includes(attempt)&&independent.includes('后续已改正'));
assert(independent.includes('fixture-wrong'));
for(const excluded of ['correct','assisted','unknown','related','exposed','diagnostic','conflict','ordinal2','incomplete','badgroup'])
 assert(!independent.includes('fixture-'+excluded),'unexpected independent error '+excluded);
assert(page.includes('无帮助未见首答正确 1 次'));
assert(support.includes('fixture-related')&&support.includes('相关练习'));
assert(support.includes('fixture-incomplete')&&support.includes('组未完成'));
assert(support.includes('fixture-badgroup')&&support.includes('组状态待核对'));
assert(!support.includes('fixture-diagnostic'));
assert(!support.includes(attempt));
assert.equal(b.value('JSON.stringify(saved.rtm1)'),archived);
assert.equal(b.value('JSON.stringify(progressSnapshot().record.rtm1)'),backupBefore);
assert.equal(b.value('JSON.stringify(TransferEvidenceStore.attempt(saved.rtm1,'+JSON.stringify(attempt)+').firstSubmission)'),first);
b.click('rtmReview',{id:attempt});
assert(b.root.innerHTML.includes('只读回看'));
assert.equal(b.value('JSON.stringify(saved.rtm1)'),archived);
console.log(JSON.stringify({result:'PASS',scope:'isolated journal projection with actual wrong-then-right submission and synthetic group statuses',firstErrorRetained:true,unresolvedSeparate:true,incompleteAndInvalidGroupExcluded:true,relatedAndHelpExcluded:true,unknownAndConflictingExcluded:true,readOnly:true,backupUnchanged:true,realLearner:'NOT_RUN'}));
