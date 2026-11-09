'use strict';
const assert=require('node:assert/strict');
const path=require('node:path');
const source=path.resolve(process.argv[2],'source');
const region=process.argv[3];
const {boot}=require(path.join(source,'test_support.js'));
const {complete,prepare}=require(path.join(source,'test_joint_extended.js'));
const expectedProbes={
  'J-A05-06':[27,9], 'J-G02-02':[180,360], 'J-G03-01':[6,12], 'J-G04-03':[0,12],
  'J-G05-02':[3,2], 'J-D01-01':[6,8], 'J-D01-03':[20,10], 'J-D01-05':[6,3],
  'J-D01-06':[4,2], 'J-D02-03':[7,1], 'J-D02-04':[3.5,2], 'J-D03-04':[3,1],
  'J-S01-03':[1,2],
};
const counter=boot();
const families=counter.value(`Array.from(JOINT_FAMILIES.values()).filter(f=>f.protocol==='FIVE_ROLE_APPLICATION_152'&&f.regionId===${JSON.stringify(region)}).map(f=>f.id)`);
assert.ok(families.length,region);
for(const familyId of families){
  const counterId=familyId+'-C';
  counter.click('joint',{code:familyId+'-G'});
  complete(counter);
  counter.click('joint',{code:counterId});
  const {expected}=prepare(counter);
  const probe=expectedProbes[familyId];
  if(probe){
    assert.match(counter.root.innerHTML,/对照小题（与订单分别作答）/);
    assert.match(counter.root.innerHTML,/data-joint-field="counterA"/);
    assert.match(counter.root.innerHTML,/data-joint-field="counterB"/);
    const [a,b]=probe;
    counter.click('jointExtendedReason',{value:'conditions'});
    counter.inputJoint('counterA',b);
    counter.inputJoint('counterB',b);
    counter.click('check');
    assert.equal(counter.value('saved.attempts.at(-1).gradingResult'),'incorrect',counterId);
    assert.match(counter.root.innerHTML,/分别核对对照小题的两个结果/);
    counter.inputJoint('counterA',a);
  }else{
    assert.doesNotMatch(counter.root.innerHTML,/data-joint-field="counterA"/);
  }
  const distractors=counter.value('jointExtendedFamily(taskNow()).counterDistractors');
  assert.equal(new Set(distractors).size,2);
  assert.ok(distractors.every(text=>counter.root.innerHTML.includes(text)),counterId);
  assert.doesNotMatch(counter.root.innerHTML,/只要图看起来相像，就按外观决定/);
  for(const wrongChoice of ['appearance','always']){
    counter.click('jointExtendedReason',{value:wrongChoice});
    counter.click('check');
    const attempt=counter.value('saved.attempts.at(-1)');
    assert.equal(attempt.gradingResult,'incorrect');
    assert.equal(attempt.jointFacts.nativeAnchorPassed,true);
    assert.equal(attempt.jointFacts.supportAnchorPassed,false);
    assert.match(counter.root.innerHTML,/选一项能用这个例子纠正原说法的解释/);
  }
  counter.click('jointExtendedReason',{value:expected.reason});
  counter.click('check');
  const corrected=counter.value('saved.attempts.at(-1)');
  assert.equal(corrected.gradingResult,'correct');
  assert.equal(corrected.formalEligible,false);
  assert.equal(corrected.independent,false);
  assert.equal(counter.value("jointEvidence(taskNow().joint.familyId).qualifiedAt"),0);
}
console.log('M1 E04 '+region+': '+families.length+' counterexamples verified');
