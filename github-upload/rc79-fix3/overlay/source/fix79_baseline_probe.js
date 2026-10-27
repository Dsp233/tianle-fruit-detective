'use strict';
const assert=require('node:assert/strict');
const {boot}=require('./test_support');
const skills=require('./skills.json');
const version=require('./version.json');
const answers=require('../docs/rc79/fixtures/independent-mapping-answers.json');
const all=skills.units.map(unit=>unit.id);
const store='tianle_amc8_question_design_v1';
const source=JSON.stringify({
  contentRevision:version.contentRevision, storageVersion:version.storageVersion,
  topicPractice:{selectedTopicIds:all,sourceIds:['AMC8'],examIds:['AMC8-2025-02']},
  competition:{attempts:[],extensions:[]}
});
const a=boot({[store]:source});
a.click('home');
const available=a.value('ExamMappingUI.connectedAvailability()');
assert(available>0,'2025-02 fixture must be eligible');
const f=a.value('window.__AMC8_CHILD_FORMS.problems["AMC8-2025-02"].givenFigures');
assert.equal(f.length,2);
// LOAD2 rewrites bundled image data to same-origin content-addressed URLs.
for(const fig of f) a.run('window.__AMC8_SOURCE_FIGURES['+JSON.stringify(fig.sha256)+']='+JSON.stringify('https://dsp233.github.io/tianle-fruit-detective/assets/loading-r1/'+fig.sha256+'.png'));
a.click('topicStart');
let guard=0;
while(a.value('saved.rtm1.sessions.active.kind')==='training'){
  assert(++guard<10);
  const task=a.value('saved.rtm1.sessions.active');
  const expected=answers.training[task.id];
  assert.notEqual(expected,undefined,'Independent reference missing '+task.id);
  if(task.definition.answerContract.kind==='choice')a.click('rtmChoice',{value:String(expected)});
  else a.inputRtm(Array.isArray(expected)?expected.join(','):String(expected));
  a.click('rtmSubmit');
  assert.equal(a.value('saved.rtm1.sessions.active.feedback.outcome'),'VERIFIED');
  a.click('rtmNext');
}
const current=a.value('saved.rtm1.sessions.active');
assert.equal(current.examId,'AMC8-2025-02');
const baseline={case:'2025-02 content-addressed same-origin figures',figureCount:current.definition.givenFigures.length,visibleFigureCount:(a.root.innerHTML.match(/data-rtm-given-figure/g)||[]).length,originUrlPresent:a.root.innerHTML.includes(f[0].sha256),baselineExpectedMissing:true,records:a.value('Object.values(saved.rtm1.eventsById).filter(x=>x.type==="response_submitted").length')};
assert.equal(baseline.figureCount,2);assert.equal(baseline.visibleFigureCount,0);
a.click('rtmBack');a.click('progress');
baseline.parentLegacyCount=a.value('saved.attempts.length');
baseline.actualConnectedSubmissions=a.value('Object.values(saved.rtm1.eventsById).filter(x=>x.type==="response_submitted").length');
baseline.parentTextShowsConnected=a.root.innerHTML.includes('真题及衔接练习');
a.click('reading');a.click('rdPlan');
baseline.week4MapHasDiagnostic=a.root.innerHTML.includes('data-action="rdOpenDiagnostic"');
a.click('rdParent');baseline.parentHasDiagnostic=a.root.innerHTML.includes('data-action="rdDiagnostic"');
console.log(JSON.stringify(baseline,null,2));
