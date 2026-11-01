'use strict';
// Real reading engine and UI in a synthetic DOM/storage harness. This does not
// substitute for native-browser, sound, device, or learner acceptance.
const fs=require('fs'),vm=require('vm'),assert=require('node:assert/strict'),path=require('path');
const root=path.resolve(__dirname,'..'),uiCode=fs.readFileSync(path.join(__dirname,'reading_ui.js'),'utf8'),engineCode=fs.readFileSync(path.join(root,'wp-engine/reading_engine.js'),'utf8');
const pilot=JSON.parse(fs.readFileSync(path.join(root,'wp-integration/v11-source/story.json'),'utf8'));
const rows=[];
const cases=[
 {type:'pair',answer:[0,1],wrong:[['rdWpPair',{index:'0'}],['rdWpPair',{index:'2'}]],right:[['rdWpPair',{index:'0'}],['rdWpPair',{index:'1'}]]},
 {type:'anypair',answer:[[0,1],[1,2]],wrong:[['rdWpPair',{index:'0'}],['rdWpPair',{index:'2'}]],right:[['rdWpPair',{index:'0'}],['rdWpPair',{index:'1'}]]},
 {type:'sequence',answer:['ABAB','ABBA','BAAB','BABA'],wrong:Array(4).fill(['rdWpSeq',{value:'A'}]),right:[...['A','B','A','B'].map(value=>['rdWpSeq',{value}])]},
 {type:'loop',answer:'loop:3',wrong:[['rdWpLoop',{value:'1'}]],right:Array(3).fill(['rdWpLoop',{value:'1'}])},
 {type:'rule',answer:'blue&square',wrong:[['rdWpAcceptRule',{}]],right:[['rdWpRule',{part:'logic',value:'&'}]]},
 {type:'purchase',answer:'packs:1,1,0',wrong:[['rdWpPack',{index:'0',value:'1'}]],right:[['rdWpPack',{index:'0',value:'1'}],['rdWpPack',{index:'1',value:'1'}]]},
 {type:'classification',items:['甲','乙','丙'],answer:[0,1,2],wrong:[0,1,2].map(index=>['rdWpClass',{index:String(index),value:'0'}]),right:[0,1,2].map(index=>['rdWpClass',{index:String(index),value:String(index)}])},
 {type:'strip',answer:'overlap:1',wrong:[['rdWpStrip',{index:'2'}]],right:[['rdWpStrip',{index:'1'}]]},
 {type:'grid',answer:'grid',grid:{rows:2,cols:3,rectangle:true,area:2,perimeter:6,blocked:[]},wrong:[['rdWpCell',{index:'0'}],['rdWpCell',{index:'2'}]],right:[['rdWpCell',{index:'0'}],['rdWpCell',{index:'1'}]]},
 {type:'mirror',answer:'mirror',grid:{rows:2,cols:4,fixed:[0,4],editable:[2,3,6,7],target:[3,7]},wrong:[['rdWpCell',{index:'2'}]],right:[['rdWpCell',{index:'3'}],['rdWpCell',{index:'7'}]]},
 {type:'allocation',answer:'allocation',allocation:{total:3,minimum:[1,1,0]},wrong:[['rdWpAmount',{index:'0',value:'1'}]],right:[['rdWpAmount',{index:'0',value:'1'}],['rdWpAmount',{index:'1',value:'1'}],['rdWpAmount',{index:'1',value:'1'}]]},
 {type:'manifest',answer:'manifest',manifest:{weights:[3,2,2],capacity:5,maxItems:2,firstRequired:[0]},wrong:[['rdWpTrip',{index:'0',value:'2'}],['rdWpTrip',{index:'1',value:'1'}],['rdWpTrip',{index:'2',value:'1'}]],right:[['rdWpTrip',{index:'0',value:'1'}],['rdWpTrip',{index:'1',value:'1'}],['rdWpTrip',{index:'2',value:'2'}]]}
];
function storage(){const values=new Map();return {getItem:k=>values.has(k)?values.get(k):null,setItem:(k,v)=>values.set(k,String(v)),removeItem:k=>values.delete(k)}}
function data(q,text='一段合成测试文字。',day=1){const m={id:'R2-M',courseId:'NEW',day,week:Math.ceil(day/7),kind:'story',title:'测试',text,goal:'测试',tags:[],difficulty:1,focusWords:[],prerequisites:[],panels:[{text}],questions:[q]};return {schema:1,contentHash:'workpackage-ui-test',courseScope:{schema:1,activeCourseId:'NEW'},materials:[m],lessons:[{day,week:m.week,weekDay:(day-1)%7+1,kind:'new',coreIds:[m.id],reserveIds:[],targetMinutes:15}],weeks:[{week:m.week,theme:'测试',goals:[]}],diagnostics:{sets:[]}}}
function boot(d,s){let html='';const doc={hidden:false,addEventListener(){},getElementById(){return null},querySelector(){return null},querySelectorAll(){return []}};const ctx={console,Math,Date,JSON,Set,Map,Array,Object,String,Number,Boolean,RegExp,Error,document:doc,localStorage:s,STORE:'test-ui',view:'home',saved:{attempts:[],topicPractice:{selectedTopicIds:[]}},taskNow:()=>null};ctx.window=ctx;ctx.__AMC8_STORAGE_TEST=true;ctx.__AMC8_READING_DATA=d;ctx.addEventListener=()=>{};ctx.scrollTo=()=>{};ctx.ReadingComic={panel:()=>'<div>模拟图</div>'};ctx.ReadingSpeech={create:opts=>({stop(){},pause(){},resume(){},repeat(){},capabilities(){return {}},speak(text,meta){opts.onAid(meta.kind,{...meta,requestedText:text})}})};ctx.render=()=>{html=ctx.ReadingUI.render()};vm.createContext(ctx);vm.runInContext(engineCode,ctx);vm.runInContext(uiCode,ctx);ctx.ReadingUI.engine();return {ctx,get html(){return html},act(a,d={}){ctx.ReadingUI.handle(a,d)},current(){return ctx.ReadingUI.engine().current()},snapshot(){return ctx.ReadingUI.snapshot()}}}
function canon(x){return JSON.parse(JSON.stringify(x))}
for(const spec of cases){
 const {type,wrong,right,...cfg}=spec,q={id:'R2-TEST-'+type,type,category:'math',ability:'model',errorType:'relation',targetWords:[],prompt:'请作答',options:['甲','乙','丙'],explanation:'合成讲解',evidence:[],...cfg},d=data(q),s=storage();
 let a=boot(d,s);a.ctx.ReadingUI.openMaterials(['R2-M'],{purpose:'synthetic-ui'});a.act('rdReadDone');assert(a.html.includes(`data-wp-type="${type}"`),type+' board missing');assert(!a.html.includes('class="rd-explanation"'));
 for(const [act,detail]of wrong)a.act(act,detail);const savedDraft=canon(a.current().session.drafts[q.id]);assert.notEqual(savedDraft,undefined,type+' draft missing');
 a=boot(d,s);a.act('rdResume');assert.deepEqual(canon(a.current().session.drafts[q.id]),savedDraft,type+' reload lost draft');a.act('rdSubmit');let attempts=canon(a.current().attempts);assert.equal(attempts.length,1,type);assert.equal(attempts[0].correct,false,type+' wrong answer accepted');assert.equal(attempts[0].first,true);
 if(type!=='strip')a.act('rdWpReset');for(const [act,detail]of right)a.act(act,detail);a.act('rdSubmit');attempts=canon(a.current().attempts);assert.equal(attempts.length,2,type);assert.equal(attempts[1].correct,true,type+' correct answer rejected');assert.equal(attempts[1].first,false);assert.equal(canon(a.ctx.ReadingUI.engine().firstRows())[0].correct,false);
 a.act('rdReveal');assert(a.html.includes('class="rd-explanation"'));assert(!a.html.includes('undefined'),type+' explanation printed undefined');rows.push({type,draftReload:true,firstWrongPreserved:true,retryCorrect:true});
}
{
 const source=pilot.days[9],src=source.questions[0],q={...src,id:'R2-'+src.id,sourcePreviewId:src.id,category:'math',ability:'model',errorType:'relation',targetWords:[],explanation:src.reason,evidence:[]},text=source.story.join(''),d=data(q,text,source.day),s=storage(),a=boot(d,s);a.ctx.ReadingUI.openMaterials(['R2-M'],{purpose:'synthetic-ui'});a.act('rdReadDone');assert(a.html.includes('data-action="rdExplore"'));assert(!a.html.includes('data-exploration-board'));assert(!a.snapshot().events.some(e=>e.type==='aid_requested'&&e.kind==='explore'));
 a.act('rdExplore');assert(a.html.includes('data-exploration-board'));assert(a.snapshot().events.some(e=>e.type==='aid_requested'&&e.kind==='explore'));a.act('rdExploreAction',{subAction:'v3Bag',index:'0'});assert(a.html.includes('data-exploration-board'));assert.equal(a.current().session.drafts[q.id],undefined,'Exploration was submitted as a primary answer');
 a.act('rdPick',{index:String(q.answer)});a.act('rdSubmit');const attempt=a.current().attempts.at(-1);assert.equal(attempt.explorationEver,true);assert.equal(attempt.independent,false,'Exploration cannot become independent evidence');
 const changed=data(q,text+'已更改',source.day),b=boot(changed,storage());b.ctx.ReadingUI.openMaterials(['R2-M'],{purpose:'synthetic-ui'});b.act('rdReadDone');assert(!b.html.includes('data-action="rdExplore"'),'Changed original text must disable old board');rows.push({type:'exploration',explicitOpen:true,aidRecorded:true,notAnswer:true,changedTextDisabled:true});
 const altered={...q,answer:(q.answer+1)%q.options.length},c=boot(data(altered,text,source.day),storage());c.ctx.ReadingUI.openMaterials(['R2-M'],{purpose:'synthetic-ui'});c.act('rdReadDone');assert(!c.html.includes('data-action="rdExplore"'),'Changed answer must disable old board');
}
{
 let tested=0,interacted=0;
 for(const source of pilot.days.slice(2,56)){
  const src=[...source.questions,source.extra].find(q=>['choice','order'].includes(q.type));assert(src);
  const q={...src,id:'R2-'+src.id,sourcePreviewId:src.id,category:'math',ability:'model',errorType:'relation',targetWords:[],explanation:src.reason,evidence:[]};
  const passage=source.day===20?JSON.parse(fs.readFileSync(path.join(root,'wp-course-data/candidate_reading_data.json'),'utf8')).materials.find(m=>m.id==='R2-D020-CORE').text:source.story.join('');
  const a=boot(data(q,passage,source.day),storage());a.ctx.ReadingUI.openMaterials(['R2-M'],{purpose:'synthetic-ui'});a.act('rdReadDone');assert(a.html.includes('data-action="rdExplore"'),src.id+' missing board gate');
  a.act('rdExplore');assert(a.html.includes('data-exploration-board'),src.id+' missing board');const match=a.html.match(/<button\b[^>]*data-action="rdExploreAction"[^>]*>/);
  if(match){const attrs=Object.fromEntries(Array.from(match[0].matchAll(/data-([\w-]+)="([^"]*)"/g),x=>[x[1].replace(/-([a-z])/g,(_,c)=>c.toUpperCase()),x[2]]));a.act('rdExploreAction',attrs);assert.equal(a.current().session.drafts[q.id],undefined,src.id+' exploration wrote answer draft');interacted++;}
  assert(a.snapshot().events.some(e=>e.type==='aid_requested'&&e.kind==='explore'),src.id+' missing explore record');tested++;
 }
 rows.push({type:'preview-boards',days:tested,interactiveBoards:interacted,eachGatedAndAidRecorded:true});
}

// Exercise the supplied answer contracts through the actual UI handlers. This
// checks integration, not whether the published answer keys are mathematically
// or educationally correct.
{
 const bank=JSON.parse(fs.readFileSync(path.join(root,'wp-course-data/candidate_reading_data.json'),'utf8'));
 const {solution}=require(path.join(root,'wp-course-data/test_engine_candidate.js'));
 const a=boot(bank,storage());a.ctx.ReadingUI.engine().setting('pinyin','none');let taskCount=0,optionalCount=0;
 function answer(q){const value=solution(q),act=(name,d={})=>a.act(name,d);
  if(q.type==='choice')act('rdPick',{index:String(value)});
  else if(q.type==='order')value.forEach(index=>act('rdPick',{index:String(index)}));
  else if(q.type==='match')value.forEach((index,left)=>act('rdMatchPick',{left:String(left),index:String(index)}));
  else if(q.type==='cargo')value.forEach((trip,item)=>act('rdCargoPick',{item:String(item),trip:String(trip)}));
  else if(q.type==='route')value.forEach(index=>act('rdRoutePick',{index:String(index)}));
  else if(q.type==='departure'){a.ctx.ReadingUI.input({dataset:{readingField:'departure'},value:String(value),setAttribute(){}});a.ctx.render();}
  else if(q.type==='pair'||q.type==='anypair')value.forEach(index=>act('rdWpPair',{index:String(index)}));
  else if(q.type==='sequence')Array.from(value).forEach(x=>act('rdWpSeq',{value:x}));
  else if(q.type==='loop')for(let i=0;i<Number(value.slice(5));i++)act('rdWpLoop',{value:'1'});
  else if(q.type==='rule'){const [,color,logic,shape]=/^(blue|red)([&|])(square|circle)$/.exec(value);act('rdWpRule',{part:'color',value:color});act('rdWpRule',{part:'logic',value:logic});act('rdWpRule',{part:'shape',value:shape});}
  else if(q.type==='purchase')value.slice(6).split(',').forEach((count,index)=>{for(let i=0;i<Number(count);i++)act('rdWpPack',{index:String(index),value:'1'})});
  else if(q.type==='classification')value.forEach((v,index)=>act('rdWpClass',{index:String(index),value:String(v)}));
  else if(q.type==='strip')act('rdWpStrip',{index:String(value)});
  else if(q.type==='grid'||q.type==='mirror')value.forEach(index=>act('rdWpCell',{index:String(index)}));
  else if(q.type==='allocation')value.forEach((v,index)=>{for(let i=0;i<v;i++)act('rdWpAmount',{index:String(index),value:'1'})});
  else if(q.type==='manifest')value.forEach((v,index)=>act('rdWpTrip',{index:String(index),value:String(v)}));
  else throw Error('Unsupported type '+q.type);
  assert.notEqual(a.current().session.drafts[q.id],undefined,'Missing actual UI draft '+q.id);act('rdSubmit');const result=a.current().attempts.at(-1);assert(result&&result.correct,q.id+' failed supplied-answer submission');taskCount++;
 }
 for(const lesson of bank.lessons){
  a.ctx.ReadingUI.openMaterials(lesson.coreIds,{day:lesson.day,purpose:'new'});a.act('rdReadDone');
  for(let n=0;n<3;n++){const q=a.current().question;assert(!a.html.includes('class="rd-explanation"'),q.id+' explanation leaked');answer(q);a.act('rdNext');}
  assert(a.html.includes('data-daily-optional'),'Daily optional entry missing for day '+lesson.day);a.act('rdDailyOptional',{day:String(lesson.day)});assert.equal(a.current().session.purpose,'optional-challenge');assert.equal(a.current().session.priorExposure[a.current().material.id],true);a.act('rdReadDone');answer(a.current().question);const extra=a.current().attempts.at(-1);assert.equal(extra.priorExposure,true);assert.equal(extra.independent,false);a.act('rdNext');optionalCount++;
 }
 assert.equal(taskCount,336);assert.equal(optionalCount,84);assert.equal(a.ctx.ReadingUI.report().completedDays,84);
 const attempts=a.snapshot().events.filter(e=>e.type==='attempt'&&e.courseId===bank.courseScope.activeCourseId);assert(attempts.length>=336);assert(attempts.every(e=>e.prerequisitesConfirmed===false),'Unreviewed prerequisites became confirmed');
 a.act('rdParent');assert.equal((a.html.match(/未评级/g)||[]).length,12,'Unreviewed weeks were not displayed as unrated');assert(!a.html.includes('继续观察与补强'),'Unreviewed weeks must not imply ability deficiency');assert(a.html.includes('先修知识尚未审校'), 'Unreviewed prerequisites not disclosed');assert(a.html.includes('尚未分类的首答'), 'Unclassified first responses not disclosed');
 rows.push({type:'real-course-supplied-answer-smoke',days:84,tasks:taskCount,optionalEntries:optionalCount,sharedPassageMarkedSeen:true,unreviewedWeeksUnrated:true,unreviewedPrerequisitesNotConfirmed:true});
}
{
 const bank=JSON.parse(fs.readFileSync(path.join(root,'wp-course-data/candidate_reading_data.json'),'utf8')),a=boot(bank,storage());
 a.act('rdParent');assert.equal((a.html.match(/data-action="rdDxSet"/g)||[]).length,13);
 for(const set of ['BASELINE','W04','W08','W12']){a.act('rdDxSet',{set});assert(a.html.includes('data-legacy-diagnostic-notice'));a.act('rdDiagnostic');assert.equal(a.current(),null,'diagnosis must require parent confirmation');}
 a.act('rdKnowledgeConfirm');a.act('rdDiagnostic');assert.equal(a.current().session.diagnostic.setId,'W12');assert(a.html.includes('data-historical-session'));
 const q=a.current().question;a.act('rdPick',{index:String(q.answer)});a.act('rdSubmit');a.act('rdParent');
 assert(a.html.includes('data-historical-diagnostics'));assert(a.html.includes('旧版第12周诊断'));assert.equal(a.ctx.ReadingUI.report().first.total,0);
 rows.push({type:'historical-diagnostic-ui',sets:13,stageSelectors:[0,4,8,12],confirmationRequired:true,historySeparate:true});
}
{
 const bank=JSON.parse(fs.readFileSync(path.join(root,'wp-course-data/candidate_reading_data.json'),'utf8'));
 const material=day=>bank.materials.find(m=>m.courseId===bank.courseScope.activeCourseId&&m.day===day&&m.kind==='story');
 function check(day,index,mutate=()=>{}){const m=JSON.parse(JSON.stringify(material(day))),q=m.questions[index];mutate(q,m);const a=boot(data(q,m.text,day),storage());a.ctx.ReadingUI.openMaterials(['R2-M'],{purpose:'synthetic-ui'});a.act('rdReadDone');return a;}
 for(const i of [0,1])assert(check(14,i).html.includes('data-action="rdExplore"'));
 assert(!check(14,2).html.includes('data-action="rdExplore"'),'D14-3 unrelated board must stay disabled');
 for(const i of [0,1,2]){const a=check(20,i);assert(a.html.includes('data-action="rdExplore"'));a.act('rdExplore');assert(a.html.includes('data-exploration-board'));assert(a.snapshot().events.some(e=>e.type==='aid_requested'&&e.kind==='explore'));}
 assert(!check(20,0,(q,m)=>m.text=pilot.days[19].story.join('')).html.includes('data-action="rdExplore"'));
 assert(!check(20,0,q=>q.answer=(q.answer+1)%q.options.length).html.includes('data-action="rdExplore"'));
 assert(!check(20,0,q=>q.options.reverse()).html.includes('data-action="rdExplore"'));
 rows.push({type:'edited-exploration-gates',day14UnrelatedBoardDisabled:true,day20StrictGates:true,aidRecorded:true});
}
console.log(JSON.stringify({result:'PASS',environment:'Node VM, synthetic DOM/storage/speech; no native browser, sound, independent solving or learner validation',checks:rows}));
