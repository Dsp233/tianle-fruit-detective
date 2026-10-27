'use strict';
const assert=require('node:assert/strict'),{boot}=require('./test_support');
const plain=html=>html.replace(/<rt[^>]*>[\s\S]*?<\/rt>/g,'').replace(/<[^>]+>/g,'');
function choose(a,value){for(const i of Array.isArray(value)?value:[value])a.click('rdPick',{index:String(i)});a.click('rdSubmit')}
function setup(material,target,mutate=false){const a=boot();a.click('reading');a.run("ReadingUI.engine().setting('pinyin','none')");if(mutate)a.run("ReadingUI.engine().data.materials.find(m=>m.id==='R-D001-M').text+=' 合成变更'");a.run('ReadingUI.openMaterials(['+JSON.stringify(material)+'],{purpose:"practice"})');a.click('rdReadDone');while(a.value('ReadingUI.engine().current().question.id')!==target){const q=a.value('ReadingUI.engine().current().question');choose(a,q.answer);a.click('rdNext')}return a}
const cases=[
 ['R-D001-S1','R-D001-S1-Q1',[1,2,0],'“先”后面核对第一张卡'],
 ['R-D001-S1','R-D001-S1-Q1',[0,1,2],'“再”后面的动作，核对第二张卡'],
 ['R-D001-S1','R-D001-S1-Q2',0,'门外和屋里有什么不同'],
 ['R-D001-S1','R-D001-S1-Q2',2,'比较搬进屋和雨落下的先后顺序'],
 ['R-D001-M','R-D001-M-Q1',0,'问的是谁现在的什么数量'],
 ['R-D001-M','R-D001-M-Q1',1,'它是在问数量，还是在问颜色'],
 ['R-D001-M','R-D001-M-Q2',0,'袋子的个数是否也是贴纸的数量'],
 ['R-D001-M','R-D001-M-Q2',2,'另一个以“张”为单位的已知条件'],
 ['R-D001-M','R-D001-M-Q3',1,'贴纸增加还是减少'],
 ['R-D001-M','R-D001-M-Q3',2,'增加一次，还是有若干组相同数量'],
 ['R-D001-M','R-D001-M-Q4',0,'贴纸增加还是减少'],
 ['R-D001-M','R-D001-M-Q4',1,'核对有没有多算']
];
for(const [material,id,wrong,hint] of cases){
 const a=setup(material,id),q=a.value('ReadingUI.engine().current().question');choose(a,wrong);
 assert(plain(a.root.innerHTML).includes(hint),id+' '+JSON.stringify(wrong));
 const before=a.value('ReadingUI.engine().current().attempts[0]');assert.equal(before.correct,false);assert.equal(before.first,true);
 assert.equal(a.value('ReadingUI.snapshot().events.filter(e=>e.kind==="feedback_hint"&&e.questionId==='+JSON.stringify(id)+').length'),1);
 choose(a,q.answer);const attempts=a.value('ReadingUI.engine().current().attempts');assert.equal(attempts.length,2);assert.equal(attempts[0].id,before.id);assert.equal(attempts[1].correct,true);assert.equal(attempts[1].feedbackHintEver,true);assert.equal(attempts[1].independent,false);
}
const changed=setup('R-D001-M','R-D001-M-Q1',true);choose(changed,0);const changedText=plain(changed.root.innerHTML);assert(changedText.includes('先找到问题里的对象'));assert(!changedText.includes('问的是谁现在的什么数量'));
const d=boot();d.click('reading');d.click('rdPlan');d.click('rdOpenDiagnostic',{set:'W04'});d.click('rdKnowledgeConfirm');d.click('rdDiagnostic');const q=d.value('ReadingUI.engine().current().question');choose(d,q.type==='order'?[...q.answer].reverse():(q.answer+1)%q.options.length);assert.equal(d.value('ReadingUI.snapshot().events.filter(e=>e.kind==="feedback_hint").length'),0);
console.log(JSON.stringify({result:'PASS',scope:'six exact reading questions and conservative fallback',cases:cases.length,questionCount:6,optionSpecific:true,originalFirstAnswersPreserved:true,assistanceRecorded:true,editedPassageFallsBack:true,diagnosticHint:'NOT_SHOWN',independentTeachingReview:'NOT_RUN'}));
