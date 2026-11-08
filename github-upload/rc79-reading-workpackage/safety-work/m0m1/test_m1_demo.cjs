'use strict';
const assert=require('node:assert/strict');
const path=require('node:path');
const root=path.resolve(process.argv[2]);
const {boot}=require(path.join(root,'source/test_support.js'));
const b=boot();
for(const skill of ['A01.01','A01.02','G03.01','G04.03']){
  b.click('demo',{code:skill});
  assert.equal(b.value('demoSkillId'),skill);
  const initial=b.value('JSON.stringify(draft)');
  const attempts=b.value('JSON.stringify(saved.attempts)');
  const recorded=JSON.stringify(b.storage);
  const groups=b.value('demoGroups(taskNow()).length');
  assert.ok(groups>0);
  b.click('demoNext');
  const first=b.value('JSON.stringify(draft)');
  for(let step=1;step<groups;step++)b.click('demoNext');
  assert.equal(b.value('taskAdapter(taskNow()).grade(taskNow()).ok'),true);
  assert.equal(b.value('hasUnsubmittedMathDraft()'),false);
  assert.equal(b.value("confirmMathNavigation('micro')"),true);
  for(let step=groups;step>1;step--)b.click('demoPrevious');
  assert.equal(b.value('JSON.stringify(draft)'),first);
  b.click('demoPrevious');
  b.click('demoPrevious');
  assert.equal(b.value('demoCursor'),0);
  assert.equal(b.value('JSON.stringify(draft)'),initial);
  assert.equal(b.value('JSON.stringify(saved.attempts)'),attempts);
  assert.equal(JSON.stringify(b.storage),recorded);
}
console.log('M1 DEMO: state replay, completion, zero boundary, and learning records PASS');

b.click('demo',{code:'A01.02'});
b.click('demoNext');
assert.match(b.value("demoPage()"),/框里有6个一，盘里还有6个一/);
b.click('demoNext');
assert.match(b.value("demoPage()"),/框里正好10个一，盘里还有2个一/);
b.click('demoNext');
assert.match(b.value("demoPage()"),/捆后：1个十和2个一。总数两次都是12/);
b.click('demoPrevious');
assert.match(b.value("demoPage()"),/框里正好10个一，盘里还有2个一/);
console.log('M1 A01.02: ten ones visibly become one ten, with two ones and total unchanged');
b.run("open('workshop','A01.02')");
b.run("taskAdapter(taskNow()).act('workPick',{id:'U1'},taskNow())");
assert.equal(b.value('hasUnsubmittedMathDraft()'),true);
assert.equal(b.value("confirmMathNavigation('home')"),false);
console.log('M1 guard: actual unsubmitted work remains protected');

const {complete}=require(path.join(root,'source/test_joint_extended.js'));
const clock={now:2000000000000};
const joint=boot({},clock);
const family='J-A03-01';
for(const [role,quantity,independent] of [
  ['G',16,false],['I1',8,true],['I2',10,true],['C',4,false],['D',12,true],
]){
  if(role==='D')clock.now+=86400000;
  joint.click('joint',{code:family+'-'+role});
  assert.match(joint.value('jointMaterialText(taskNow())'),/涂色部分对应的原料质量/);
  assert.doesNotMatch(joint.value('jointMaterialText(taskNow())'),/实际长度/);
  assert.match(joint.value('jointExtendedPrefix(taskNow())'),/克/);
  if(role==='C'){
    assert.match(joint.value('jointMaterialText(taskNow())'),/只数涂色的份数，就知道用了多少克原料/);
    assert.match(joint.value('jointExtendedFamily(taskNow()).counterExplanation'),/总质量除以总份数，再乘涂色的份数/);
  }
  const result=complete(joint);
  assert.equal(result.q,quantity);
  assert.equal(result.a.independent,independent);
}
console.log('M1 A03.01: five joint roles use mass in grams with unchanged grading and first-response eligibility');
