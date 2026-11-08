'use strict';
const assert=require('node:assert/strict');
const path=require('node:path');
const root=path.resolve(process.argv[2]);
const {boot}=require(path.join(root,'source/test_support.js'));
const b=boot();
for(const skill of ['A01.01','G03.01','G04.03']){
  b.click('demo',{code:skill});
  const initial=b.value('JSON.stringify(draft)');
  const attempts=b.value('JSON.stringify(saved.attempts)');
  const recorded=JSON.stringify(b.storage);
  const groups=b.value('demoGroups(taskNow()).length');
  assert.ok(groups>0);
  b.click('demoNext');
  const first=b.value('JSON.stringify(draft)');
  for(let step=1;step<groups;step++)b.click('demoNext');
  assert.equal(b.value('taskAdapter(taskNow()).grade(taskNow()).ok'),true);
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
