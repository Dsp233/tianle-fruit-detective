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

const {complete,prepare}=require(path.join(root,'source/test_joint_extended.js'));
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

for(const [id,label,unit] of [
  ['J-A03-02','一等份对应的原料质量','克'],
  ['J-A03-03','两块涂色部分中质量较大的那块原料','克'],
  ['J-A03-05','标记点的坐标对应的原料质量','克'],
  ['J-A03-07','第二次取走的原料质量','克'],
  ['J-D01-06','按满足条件的总时长换算出的标记带长度','厘米'],
]){
  clock.now+=86400000;
  for(const role of ['G','I1','I2','C','D']){
    if(role==='D')clock.now+=86400000;
    joint.click('joint',{code:id+'-'+role});
    assert.ok(joint.value('jointMaterialText(taskNow())').includes(label),id+' '+role);
    assert.equal(joint.value('jointExtendedUnit(taskNow())'),unit);
    assert.equal(complete(joint).a.independent,['I1','I2','D'].includes(role));
  }
}
console.log('M1 joint wording: five additional families match the ordered quantity in all roles');

const {prepareStage}=require(path.join(root,'source/test_solutions.js'));
const skillGroups=[
  ['A03','fraction',['01','02','03','04','05','06','07']],
  ['A04','percent',['01','02','03','04','05','06']],
  ['A05','integer',['01','02','03','04','05','06']],
];
for(const [region,view,skills] of skillGroups)for(const n of skills){
  const skill=region+'.'+n;
  const time={now:2000000000000};
  const stages=boot({},time);
  const open=(kind)=>stages.click('stage',{code:skill+'|'+kind});
  const submit=(task)=>{
    prepareStage(stages,task);
    stages.click('check');
    const attempt=stages.value('saved.attempts.at(-1)');
    assert.equal(attempt.gradingResult,'correct',task.id);
    return attempt;
  };
  stages.click(view,{code:skill});
  const operation=stages.value('taskNow()');
  assert.equal(operation.id,'O-'+region+'-'+n+'-1');
  prepareStage(stages,operation);
  stages.click('reason',{index:String((operation.reason.answer+1)%operation.reason.options.length)});
  stages.click('check');
  assert.equal(stages.value('saved.attempts.at(-1).explanationEvidence.correct'),false);
  stages.click('reason',{index:String(operation.reason.answer)});
  stages.click('check');
  assert.equal(stages.value('saved.attempts.at(-1).explanationEvidence.correct'),true);
  assert.equal(stages.value('saved.attempts.at(-1).independent'),false);
  assert.equal(stages.value(`stageAccess('${skill}','independent').allowed`),false);
  for(const [kind,index,independent] of [['transfer',1,false],['independent',2,true],['independent2',4,true]]){
    open(kind);
    const task=stages.value('taskNow()');
    assert.equal(task.id,'T-'+region+'-'+n+'-'+index);
    assert.equal(submit(task).independent,independent);
  }
  const qualified=time.now;
  for(const [kind,days,index,heading] of [
    ['delayed',1,3,'隔日回访新题'],['delayed7',7,7,'7天回访新题'],['delayed21',21,8,'21天回访新题'],
  ]){
    time.now=qualified+days*86400000-1;
    assert.equal(stages.value(`stageAccess('${skill}','${kind}').allowed`),false);
    time.now++;
    open(kind);
    const task=stages.value('taskNow()');
    assert.equal(task.id,'T-'+region+'-'+n+'-'+index);
    assert.ok(stages.root.innerHTML.includes('<h1>'+heading+'</h1>'),task.id);
    assert.ok(stages.root.innerHTML.includes('本机时间决定是否到期'),task.id);
    const attempt=submit(task);
    assert.equal(attempt.assessmentType,'delayed-review');
    assert.equal(attempt.independent,true);
  }
}
console.log('M1 E02: 19 fraction, percentage, and integer skills distinguish operation, explanation, transfer, independent work and 1/7/21-day review');
const {M,install}=require(path.join(root,'source/rc73_test_support.js'));
const identity=require(path.join(root,'source/competition_identity.js'));
const catalog=require(path.join(root,'source/source_catalog.js'));
const {designOracle}=require(path.join(root,'source/competition_design_oracles.js'));
const coins=M.COMPETITION_REVIEWED.find(f=>f.id==='twoCoins');
const current=M.competitionReviewedRecipe('twoCoins',19);
assert.equal(current.generatorRevision,7);
const selected=catalog.eligible(M.COMPETITION_REVIEWED,{
  topicIds:boot().value('SKILL_DATA.units.map(u=>u.id)'),sourceIds:['original'],
});
assert.ok(selected.some(f=>f.id==='twoCoins'&&f.generatorRevision===7));
for(let seed=1;seed<=225;seed++){
  const legacy=M.competitionCreate({...current,seed,generatorRevision:3});
  const next=M.competitionCreate({...current,seed});
  assert.equal(identity.key(next),identity.key(legacy));
  assert.equal(next.contentVersion,legacy.contentVersion);
  assert.deepEqual(next.options,legacy.options);
  assert.notEqual(next.competition.extension.signature,legacy.competition.extension.signature);
  const variant=next.competition.extension;
  assert.equal(Number(variant.answer),designOracle(next,coins).extension);
  assert.notEqual(variant.answer,next.competition.answer);
}
const oldCoin=M.competitionCreate({...current,generatorRevision:3});
const newCoin=M.competitionCreate(current);
assert.equal(oldCoin.competition.extension.answer,'7');
assert.equal(newCoin.competition.extension.answer,'2');
const narrowScope={topicIds:boot().value('SKILL_DATA.units.map(u=>u.id)'),
  sourceIds:['original'],excludedSkillIds:['A02.05']};
assert.ok(catalog.taskAllowed(newCoin,narrowScope).length);
assert.equal(catalog.teachingScope(oldCoin,narrowScope).variation.allowed,true);
const denied=catalog.teachingScope(newCoin,narrowScope).variation;
assert.equal(denied.allowed,false);
assert.ok(denied.missingSkillIds.includes('A02.05'));

const coinApp=boot();
install(coinApp,newCoin);
coinApp.click('competitionHint');
coinApp.click('competitionIndependentVariation');
assert.match(coinApp.root.innerHTML,/只有面值1元和3元两种/);
coinApp.inputCompetition('extension','7');
coinApp.click('competitionExtensionCheck');
assert.equal(coinApp.value('draft.work.extensionResult.ok'),false);
coinApp.inputCompetition('extension','2');
coinApp.click('competitionExtensionCheck');
assert.equal(coinApp.value('draft.work.extensionResult.ok'),true);
assert.equal(coinApp.value('saved.competition.extensions.at(-1).independent'),false);
assert.equal(coinApp.value('saved.competition.attempts.length'),0);
assert.equal(coinApp.value('saved.competition.extensions.at(-1).relatedMethodExposure.recent'),true);
const restoredCoin=boot(coinApp.storage);
restoredCoin.click('topicResume');
assert.equal(restoredCoin.value('draft.work.extensionResult.ok'),true);
assert.equal(restoredCoin.value('saved.competition.extensions.at(-1).independent'),false);
console.log('M1 P-D coins: condition transfer, historical replay, ordinary supply, and exposure retained');
const {readFileSync}=require('node:fs');
const w1Html=readFileSync(path.join(root,'w1-baseline.html'),'utf8');
const frozenJoint=boot({},2000000000000,w1Html);
const legacyProjection='JointReuseReview.projection()';
const legacyReviewed=frozenJoint.value(legacyProjection);
assert.equal(legacyReviewed.length,95);
assert.ok(legacyReviewed.every(row=>row.status==='REVIEWED'));
assert.equal(legacyReviewed.filter(row=>row.matchLevel==='PARTIAL_DECISION').length,2);
assert.deepEqual(joint.value(legacyProjection),legacyReviewed);
const legacyReuse=require(path.join(root,'source/joint_reuse_review.js'));
assert.deepEqual(legacyReuse.projection(),legacyReviewed);
for(const name of ['demo_ui.js','joint_extended.js','staged_ui.js']){
  const changed={...legacyReuse.config.sourceHashes,[name]:'0'.repeat(64)};
  assert.equal(legacyReuse.create({...legacyReuse.config,sourceHashes:changed}).review('J-C04-04').status,'STALE');
}
console.log('M1 legacy reuse: 95 reviewed families and two local correspondences retained, unknown source bytes rejected');
const jointIdentities="Object.values(JOINT_TASKS).map(t=>[t.id,t.contentVersion,jointMathSignature(t)])";
assert.equal(frozenJoint.value(jointIdentities).length,800);
assert.deepEqual(joint.value(jointIdentities),frozenJoint.value(jointIdentities));
const counterFamilies=[
  ...['01','02','03','04','05','06','07'].map(n=>'J-A03-'+n),
  ...['01','02','03','04','05','06'].map(n=>'J-A04-'+n),
  ...['01','02','03','04','05','06'].map(n=>'J-A05-'+n),
  ...['01','02','03','04','05'].map(n=>'J-G01-'+n),
];
for(const familyId of counterFamilies){
  const counter=boot();
  const counterId=familyId+'-C';
  counter.click('joint',{code:familyId+'-G'});
  complete(counter);
  counter.click('joint',{code:counterId});
  const {expected}=prepare(counter);
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
for(const role of ['G','I1','I2','C','D']){
  const code='J-A04-06-'+role;
  const taskText=joint.value(`jointExtendedText(JOINT_TASKS['${code}'])`);
  assert.match(taskText,/估算采购所用的计划数量/);
  if(role==='I1')assert.match(taskText,/按所求区间的上界预留材料/);
  else {
    assert.match(taskText,/两个近似数的积计划用量/);
    assert.doesNotMatch(taskText,/上界/);
  }
}
for(const [family,quantities,units] of [
  ['J-A05-04',[144,36,36,64,36],['平方米','平方米','平方厘米','平方米','平方米']],
  ['J-A05-05',[12,6,2,8,6],['米','米','厘米','米','米']],
]){
  const time={now:2000000000000};
  const measurement=boot({},time);
  for(const [index,role] of ['G','I1','I2','C','D'].entries()){
    if(role==='D')time.now+=86400000;
    const id=family+'-'+role;
    measurement.click('joint',{code:id});
    const expectedUnit=units[index];
    assert.equal(measurement.value('jointExtendedUnit(taskNow())'),expectedUnit,id);
    assert.ok(measurement.value('jointMaterialText(taskNow())').includes(role==='I1'
      ? expectedUnit+'，只能买整包'
      : '每'+expectedUnit),id);
    const result=complete(measurement);
    assert.equal(result.q,quantities[index],id);
    assert.equal(result.a.jointFacts.extendedObserved.unit,expectedUnit,id);
  }
}
frozenJoint.click('joint',{code:'J-A05-04-G'});
complete(frozenJoint);
frozenJoint.click('joint',{code:'J-A05-04-I1'});
const oldArea=complete(frozenJoint).a;
assert.equal(oldArea.jointFacts.extendedObserved.unit,'平方厘米');
const oldAreaReload=boot(frozenJoint.storage,2000000000000,w1Html);
const newArea=boot(frozenJoint.storage);
const historicalArea='saved.attempts.find(x=>x.taskInstanceId==="J-A05-04-I1")';
assert.ok(newArea.value('jointEvidence("J-A05-04").independent.some(x=>x.taskInstanceId==="J-A05-04-I1")'));
assert.deepEqual(newArea.value(historicalArea),oldAreaReload.value(historicalArea));
console.log('M1 E04: 24 targeted counterexamples, distinct estimate rules, square/root units, and 800 preserved joint task identities');
const legacyCoin=boot({},2000000000000,w1Html);
install(legacyCoin,oldCoin);
legacyCoin.click('competitionIndependentVariation');
legacyCoin.inputCompetition('extension','7');
legacyCoin.click('competitionExtensionCheck');
const legacyRow=legacyCoin.value('saved.competition.extensions.at(-1)');
const restoredLegacy=boot(legacyCoin.storage);
restoredLegacy.click('topicResume');
assert.deepEqual(restoredLegacy.value('saved.competition.extensions.at(-1)'),legacyRow);
assert.equal(restoredLegacy.value('draft.work.extensionResult.ok'),true);
assert.match(restoredLegacy.root.innerHTML,/取走一枚1元和一枚2元/);

const contracts=require(path.join(root,'source/competition_content_contracts.js'));
for(const [familyId,required,answer] of [
  ['chartScale',/甲柱高 5 格，表示 15 人/,9],
  ['truncatedBars',/从 20 人起，每格 6 人。甲、乙两柱分别高出起点 3 格和 7 格/,24],
  ['cumulativeChart',/不超过3分的有 22 人，不超过4分的有 30 人/,8],
]){
  const chart=M.competitionCreate(M.competitionReviewedRecipe(familyId,246));
  const scope=contracts.resolve(chart,'variation');
  assert.match(scope.givenText,required);
  assert.ok(scope.narrationText.includes(scope.givenText));
  assert.equal(scope.initialDiagramAllowed,false);
  const app=boot();
  install(app,chart);
  app.click('competitionIndependentVariation');
  assert.ok(app.root.innerHTML.includes(scope.givenText));
  assert.ok(!app.root.innerHTML.includes('<svg'));
  app.inputCompetition('extension',String(answer));
  app.click('competitionExtensionCheck');
  assert.equal(app.value('draft.work.extensionResult.ok'),true);
  assert.equal(app.value('saved.competition.attempts.length'),0);
}
console.log('M1 chart goals: standalone variation gives the necessary scale or cumulative data before any hint');

const storeKey='tianle_amc8_question_design_v1';
const legacyRaw=legacyCoin.storage[storeKey];
const upgraded=boot({[storeKey]:legacyRaw});
assert.equal(upgraded.value('canPersist'),true);
assert.deepEqual(upgraded.value('saved.competition.extensions.at(-1)'),legacyRow);
assert.ok(Object.entries(upgraded.storage).some(([key,value])=>
  key.startsWith(storeKey+'_backup_before_rc70_')&&value===legacyRaw));
const revisedRaw=coinApp.storage[storeKey];
const fallback=boot({[storeKey]:revisedRaw},2000000000000,w1Html);
assert.equal(fallback.value('CONTENT_REVISION'),153);
assert.equal(fallback.value('canPersist'),false);
assert.match(fallback.value('storageMessage'),/来自更新的版本/);
assert.equal(fallback.value('persist().ok'),false);
assert.equal(fallback.storage[storeKey],revisedRaw);
assert.equal(restoredCoin.value('CONTENT_REVISION'),154);
console.log('M1 compatibility: exact W1 backup before upgrade; W1 fallback refuses to overwrite M1 records');
