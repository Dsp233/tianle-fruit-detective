'use strict';
const assert=require('node:assert/strict'),{boot}=require('./test_support'),V=require('./version.json'),A=require('../docs/rc79/fixtures/independent-mapping-answers.json');
const key='tianle_amc8_question_design_v1',topics=['A01','A02','A03','A04','R01','G01','G02','G03','C01','D01'];
const seed={contentRevision:V.contentRevision,storageVersion:V.storageVersion,topicPractice:{selectedTopicIds:topics,sourceIds:['AMC8'],examIds:[]},competition:{attempts:[],extensions:[]}};
const a=boot({[key]:JSON.stringify(seed)});a.click('home');
const plans=a.value("ConnectedLearning.focusPlans(SelectionDiagnostics.plans(SourceCatalog.profile({...saved.topicPractice,topicIds:saved.topicPractice.selectedTopicIds})),SourceCatalog.profile({...saved.topicPractice,topicIds:saved.topicPractice.selectedTopicIds})).map(p=>({examId:p.examId,topics:p.focusTopics,cluster:p.structureClusterId,pending:p.pendingTaskIds.length}))");
assert(plans.length>0);assert(plans.every(p=>p.topics.some(t=>topics.includes(t))));
a.click('topicStart');const entries=[];
for(let i=0;i<10;i++){
 const task=a.value('saved.rtm1.sessions.active'),group=a.value('saved.rtm1.sessions.connected');
 if(!task||task.finished||group.status!=='active')break;
 const routeTopics=a.value('ConnectedLearning.routeTopics(saved.rtm1.sessions.connected.target.routeId)');assert(routeTopics.every(t=>topics.includes(t)));if(task.kind==='training')assert(a.root.innerHTML.includes('作准备 · 对应'));entries.push({id:task.id,exam:task.examId,stage:task.connectedStage,topics:routeTopics});
 const answer=task.kind==='exam'?A.originals[task.examId]:A.training[task.id];if(answer===undefined){console.log(JSON.stringify({missing:task.id,entries}));process.exit(1)}
 if(task.definition.answerContract.kind==='choice')a.click('rtmChoice',{value:String(answer)});else a.inputRtm(Array.isArray(answer)?answer.join(','):String(answer));
 a.click('rtmSubmit');if(a.value('saved.rtm1.sessions.active.feedback.outcome')!=='VERIFIED'){console.log(JSON.stringify({failed:task.id,answer,entries}));process.exit(1)}
 a.click('rtmNext');
}
assert.equal(entries.length,10);assert.equal(a.value('saved.rtm1.sessions.connected.status'),'completed');assert.deepEqual(a.value('saved.topicPractice.selectedTopicIds'),topics);assert(a.root.innerHTML.includes('data-connected-coverage'));assert(new Set(entries.map(x=>x.topics.join(','))).size>=3);for(const id of topics.filter(t=>!['A01','A02'].includes(t)))assert(entries.some(row=>row.topics.includes(id)),id);
console.log(JSON.stringify({result:'PASS',scope:'synthetic selected-topic schedule and group coverage',topics,plans:plans.length,coveredByAvailablePlans:[...new Set(plans.flatMap(x=>x.topics))],entries,status:a.value('saved.rtm1.sessions.connected.status'),covered:a.value('saved.rtm1.sessions.connected.coveredFocusTopics||[]')}));
