'use strict';
// One synthetic profile uses normal daily and optional entry points for 84 days.
const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('node:assert/strict');
const {solution}=require('./test_engine_candidate.js');const here=__dirname,root=path.resolve(here,'../..');
const code=fs.readFileSync(process.env.CANDIDATE_ENGINE||path.join(root,'safety-work/wp-engine/reading_engine.js'),'utf8');
const data=JSON.parse(fs.readFileSync(path.join(here,'candidate_reading_data.json'),'utf8'));
const ctx={window:{__AMC8_STORAGE_TEST:true},console,Math,Date};vm.createContext(ctx);vm.runInContext(code,ctx);
const db=new Map(),storage={getItem:k=>db.has(k)?db.get(k):null,setItem:(k,v)=>db.set(k,String(v)),removeItem:k=>db.delete(k)};
let now=2000000000000,e=ctx.window.ReadingEngine.create(data,storage,'sequential',()=>now);e.setting('pinyin','none');
let tasks=0;
for(let day=1;day<=84;day++){
 now+=86400000;assert.equal(e.nextDay(),day,'calendar progression '+day);
 assert.ok(e.startDay(day),'start day '+day);assert.equal(e.current().material.id,`R2-D${String(day).padStart(3,'0')}-CORE`);
 for(let i=0;i<3;i++){
  const q=e.current().question,correct=solution(q);
  if(day===1&&i===0){const wrong=(correct+1)%q.options.length;assert.equal(e.submit(wrong).correct,false);const retry=e.submit(correct);assert.equal(retry.correct,true);assert.equal(retry.first,false);assert.equal(e.attempts(q.id)[0].correct,false);}
  else{const attempt=e.submit(correct);assert.equal(attempt.correct,true);assert.equal(attempt.first,true);}
  assert.equal(e.next(),i===2?'complete':true);tasks++;
 }
 const offer=e.dailyOptional(day);assert.ok(offer);assert.equal(offer.priorExposure,true);
 assert.ok(e.startDailyOptional(day));const q=e.current().question,attempt=e.submit(solution(q));assert.equal(attempt.correct,true);assert.equal(attempt.priorExposure,true);assert.equal(attempt.independent,false);assert.equal(e.next(),'complete');tasks++;
 if(day%7===0){
  e=ctx.window.ReadingEngine.create(data,storage,'sequential',()=>now);assert.equal(e.status().status,'ready','weekly reload '+day);
  const r=e.report();assert.equal(r.completedDays,day);assert.equal(r.first.total,day*4);assert.equal(r.supportEvidence.unreviewedFirst.total,day*4);
  assert.ok(r.supportEvidence.byCategory.every(x=>x.first.total===0));assert.equal(Object.keys(r.errors).length,0);assert.ok(r.readiness.every(x=>x.evaluable===false&&x.samples===0));
 }
}
assert.equal(tasks,336);assert.equal(e.report().completedDays,84);assert.equal(e.challenge().eligible,false);
console.log(JSON.stringify({result:'PASS_SYNTHETIC_SEQUENTIAL_COURSE',days:84,tasks,weeklyReloads:12,firstWrongThenRetryPreserved:true,optionalPriorExposure:true,unreviewedNotClassified:true,unreviewedReadiness:'not evaluable',educationalOrIndependentAnswerReview:'NOT_RUN'}));
