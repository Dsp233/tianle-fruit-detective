'use strict';
// Independently check the supplemental given diagram and the existing
// original image through real application event handlers in a synthetic VM.
const assert=require('node:assert/strict'),{boot}=require('./test_support');
const K=require('./skills.json'),V=require('./version.json'),A=require('../docs/rc79/fixtures/independent-mapping-answers.json');
const store='tianle_amc8_question_design_v1';
const seed={contentRevision:V.contentRevision,storageVersion:V.storageVersion,
 topicPractice:{selectedTopicIds:K.units.map(x=>x.id),sourceIds:['AMC8'],examIds:['AMC8-2000-24']},
 competition:{attempts:[],extensions:[]}};
// F=(170,160), A=(99.52,134.35), D=(240.48,185.65), G=(170,90), B=(170,45).
const fa=[99.52-170,134.35-160],fd=[240.48-170,185.65-160],fg=[0,-70],fb=[0,-115];
const dot=(a,b)=>a[0]*b[0]+a[1]*b[1],norm=a=>Math.hypot(...a);
assert(Math.abs(fa[0]*fd[1]-fa[1]*fd[0])<.01&&dot(fa,fd)<0);
assert.equal(fg[0]*fb[1]-fg[1]*fb[0],0);assert(dot(fg,fb)>0);
assert(Math.abs(Math.acos(dot(fa,fg)/(norm(fa)*norm(fg)))*180/Math.PI-70)<.05);
const a=boot({[store]:JSON.stringify(seed)});a.click('home');a.click('topicStart');
const seen=new Set();let n=0;
while(a.value('saved.rtm1.sessions.active.kind')==='training'){
 assert(++n<10);const t=a.value('saved.rtm1.sessions.active'),html=a.root.innerHTML;
 if(['RTM-2000-24-DECISION','RTM-2000-24-CONTRAST'].includes(t.id)){
  seen.add(t.id);assert(html.includes('data-rtm-given-diagram'));
  assert(!html.includes('data-rtm-help-figure'));
  const event=a.value('Object.values(saved.rtm1.eventsById).find(e=>e.type==="problem_presented"&&e.attemptId==='+JSON.stringify(t.attemptId)+')');
  assert(event.givenDiagramPolicy&&event.taskEvidenceKey.includes('presentedGivenVisual'));
 }
 const value=A.training[t.id];assert.notEqual(value,undefined);
 if(t.definition.answerContract.kind==='choice')a.click('rtmChoice',{value:String(value)});
 else a.inputRtm(Array.isArray(value)?value.join(','):String(value));
 a.click('rtmSubmit');assert.equal(a.value('saved.rtm1.sessions.active.feedback.outcome'),'VERIFIED');a.click('rtmNext');
}
assert.deepEqual([...seen].sort(),['RTM-2000-24-CONTRAST','RTM-2000-24-DECISION']);
assert.equal(a.value('saved.rtm1.sessions.active.examId'),'AMC8-2000-24');
assert(a.root.innerHTML.includes('data-rtm-given-figure'));
console.log(JSON.stringify({result:'PASS',scope:'geometry and synthetic UI event checks',angleAFG:70,oppositeRays:true,sameRays:true,trainingFigures:2,originalImage:true,independentHumanReview:'NOT_RUN'}));
