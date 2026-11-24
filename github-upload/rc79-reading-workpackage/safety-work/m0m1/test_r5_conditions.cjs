'use strict';
const assert=require('node:assert/strict'),path=require('node:path');
const root=path.resolve(process.argv[2],'source');
const {boot}=require(path.join(root,'test_support'));
const {complete,prepare}=require(path.join(root,'test_joint_extended'));
for(const family of ['J-G03-02','J-G03-03','J-G03-04','J-G05-01','J-S02-05']){
 const clock={now:2000000000000},b=boot({},clock);
 for(const role of ['G','I1','I2','C','D']){
  if(role==='D')clock.now+=86400000;
  const id=family+'-'+role;
  b.click('joint',{code:id});const t=b.value('taskNow()');assert.equal(t.id,id);
  const prompt=b.value('jointMaterialText(taskNow())');
  if(t.kind==='cut'){
   assert.match(prompt,/指定坐标/);
   assert.equal((b.root.innerHTML.match(/data-r5-required="cut"/g)||[]).length,t.remove.length);
   if(family==='J-G03-04'&&['G','D'].includes(role)){assert.equal(t.contentVersion,153);for(const [r,c] of t.remove)assert(!([0,t.rows-1].includes(r)&&[0,t.cols-1].includes(c)),id);}
  }
  if(t.kind==='move'){assert.match(prompt,/目标格/);assert.equal((b.root.innerHTML.match(/data-r5-required="move"/g)||[]).length,t.piece.length);}
  if(family==='J-G05-01'){assert.match(prompt,/原图指定边.+指定角/);}
  if(family==='J-S02-05'){assert.ok(prompt.includes('至少完成'+t.minOps+'次合法操作'));}
  const result=prepare(b);
  assert.equal(b.value('taskAdapter(taskNow()).grade(taskNow()).ok'),true,id);
  if(role==='C'){b.click('jointExtendedReason',{value:'appearance'});assert.equal(b.value('taskAdapter(taskNow()).grade(taskNow()).ok'),false,id);b.click('jointExtendedReason',{value:'conditions'});}
  if(family==='J-S02-05'&&role==='G'){
   b.run('draft.work.proof="parity"');assert.equal(b.value('taskAdapter(taskNow()).grade(taskNow()).ok'),true);
   b.run('draft.work.proof="path"');assert.equal(b.value('taskAdapter(taskNow()).grade(taskNow()).ok'),false);
   b.run('draft.work.proof="count"');assert.equal(b.value('taskAdapter(taskNow()).grade(taskNow()).ok'),true);
  }
  b.click('check');assert.equal(b.value('saved.attempts.at(-1).gradingResult'),'correct',id);
  console.log('PASS',id);
 }
}
console.log('R5 targeted 25 roles developer regression PASS');
