'use strict';
// Synthetic engineering smoke test; supplied answer keys are NOT independently solved.
const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('node:assert/strict');
const here=__dirname, root=path.resolve(here,'../..');
const enginePath=process.env.CANDIDATE_ENGINE||path.join(root,'safety-work/wp-engine/reading_engine.js');
const engineCode=fs.readFileSync(enginePath,'utf8'),data=JSON.parse(fs.readFileSync(path.join(here,'candidate_reading_data.json'),'utf8'));
const ctx={window:{__AMC8_STORAGE_TEST:true},Math,Date,console};vm.createContext(ctx);vm.runInContext(engineCode,ctx);
function store(){const db=new Map();return {getItem:k=>db.has(k)?db.get(k):null,setItem:(k,v)=>db.set(k,String(v)),removeItem:k=>db.delete(k)}}
function solution(q){
 switch(q.type){
 case 'choice':case 'order':case 'match':case 'departure':case 'pair':case 'classification':case 'loop':case 'rule':case 'purchase':return q.answer;
 case 'route':return q.route.acceptedRoutes[0];case 'sequence':case 'anypair':return q.answer[0];
 case 'strip':return Number(q.answer.split(':')[1]);case 'mirror':return q.grid.target;
 case 'allocation':{const a=[...q.allocation.minimum];a[0]+=q.allocation.total-a.reduce((s,n)=>s+n,0);return a;}
 case 'manifest':case 'cargo':{
  const spec=q[q.type],n=q.options.length;
  for(let mask=0;mask<2**n;mask++){
   const v=Array.from({length:n},(_,i)=>mask&(1<<i)?2:1);
   if(spec.firstRequired.some(i=>v[i]!==1)||(spec.strictBefore||[]).some(([a,b])=>v[a]>=v[b]))continue;
   if([1,2].every(t=>spec.weights.reduce((s,w,i)=>s+(v[i]===t?w:0),0)<=spec.capacity&&(!spec.maxItems||v.filter(x=>x===t).length<=spec.maxItems)))return v;
  }break;
 }
 case 'grid':{
  const g=q.grid,n=g.rows*g.cols;
  for(let mask=1;mask<2**n;mask++){
   const v=Array.from({length:n},(_,i)=>i).filter(i=>mask&(1<<i));if(v.length!==g.area||v.some(i=>g.blocked.includes(i)))continue;
   const rows=v.map(i=>Math.floor(i/g.cols)),cols=v.map(i=>i%g.cols),h=Math.max(...rows)-Math.min(...rows)+1,w=Math.max(...cols)-Math.min(...cols)+1;
   if(h*w===v.length&&2*(h+w)===g.perimeter)return v;
  }break;
 }
 }
 throw Error('No candidate solution for '+q.id+' type '+q.type);
}
module.exports={solution};
if(require.main===module){
let checked=0;
for(const lesson of data.lessons){
 const storage=store(),key='smoke',clock=()=>2000000000000;
 let e=ctx.window.ReadingEngine.create(data,storage,key,clock);
 assert.equal(e.status().status,'ready');e.setting('pinyin','none');
 e.start(lesson.coreIds,{day:lesson.day,purpose:'new'});
 for(let i=0;i<3;i++){
  const q=e.current().question,answer=solution(q);assert.equal(e.select(answer),true,'select '+q.id);
  const attempt=e.submit();assert.ok(attempt,'submit '+q.id);assert.equal(attempt.correct,true,'grade '+q.id);assert.equal(attempt.first,true);checked++;
  // Reload validates that the actual saved record can be read back safely.
  e=ctx.window.ReadingEngine.create(data,storage,key,clock);assert.equal(e.status().status,'ready','reload '+q.id);assert.equal(e.resume(),true,'resume '+q.id);
  assert.equal(e.next(),i===2?'complete':true,'next '+q.id);
 }
 assert.equal(e.exposure(lesson.optionalIds[0]),true,'same-passage exposure '+lesson.day);
 e.start(lesson.optionalIds,{day:null,scopeDay:lesson.day,purpose:'optional-challenge'});
 const q=e.current().question,answer=solution(q);assert.equal(e.select(answer),true);const attempt=e.submit();
 assert.ok(attempt);assert.equal(attempt.correct,true,'grade '+q.id);assert.equal(attempt.priorExposure,true,'extra exposure '+q.id);assert.equal(attempt.independent,false,'extra independent '+q.id);checked++;
 e=ctx.window.ReadingEngine.create(data,storage,key,clock);assert.equal(e.status().status,'ready','reload '+q.id);
 assert.equal(e.resume(),true);assert.equal(e.next(),'complete');
 const report=e.report();assert.equal(report.completedDays,1,'optional task must not complete extra day');
}
assert.equal(checked,336);console.log(JSON.stringify({result:'PASS_SUPPLIED_ANSWER_ENGINE_SMOKE',days:84,tasks:checked,reloads:checked,sharedPassageChecks:84,educationalOrIndependentAnswerReview:'NOT_RUN'}));
}
