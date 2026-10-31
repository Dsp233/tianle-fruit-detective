'use strict';
// Candidate-course contracts only; all student records are synthetic.
const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('node:assert/strict');
const data=JSON.parse(fs.readFileSync(path.join(__dirname,'../wp-course-data/candidate_reading_data.json'),'utf8'));
const ctx={window:{__AMC8_STORAGE_TEST:true},console,Math,Date};vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(__dirname,'reading_engine.js'),'utf8'),ctx);
function storage(){const db=new Map();return {getItem:k=>db.has(k)?db.get(k):null,setItem:(k,v)=>db.set(k,String(v)),removeItem:k=>db.delete(k)}}
const key='formal-contract-test',clock=()=>2000000000000;
const open=(store,d=data)=>ctx.window.ReadingEngine.create(d,store,key,clock);
function answer(q){if(q.type==='choice'||q.type==='order')return q.answer;throw Error('Unexpected first-week task: '+q.type);}
function finishCurrent(e){while(e.current()){const q=e.current().question;assert(e.submit(answer(q)));e.next();}}
{
 const store=storage();let e=open(store);e.setting('pinyin','none');e.startDay(1);
 let q=e.current().question;const wrong=(q.answer+1)%q.options.length,first=e.submit(wrong);
 assert.equal(first.correct,false);assert.equal(first.metadataStatus,'unreviewed');assert.equal(first.prerequisitesConfirmed,false);
 assert.equal(e.known(e.current().material),false);assert.equal(e.submit(q.answer).first,false);
 e=open(store);assert.equal(e.status().status,'ready');assert.equal(e.resume(),true);
 assert.equal(e.firstRows()[0].correct,false);assert.equal(e.firstRows()[0].metadataStatus,'unreviewed');
 let r=e.report();assert.equal(r.supportEvidence.unreviewedFirst.total,1);assert.equal(r.supportEvidence.wrongFirst.length,0);
 assert.equal(Object.keys(r.errors).length,0);assert.equal(r.readiness[0].evaluable,false);assert.equal(r.readiness[0].samples,0);
 assert.equal(e.next(),true);finishCurrent(e);assert.equal(e.report().completedDays,1);
 const offer=e.dailyOptional(1);assert.equal(offer.priorExposure,true);assert(e.startDailyOptional(1));
 assert.equal(e.current().session.purpose,'optional-challenge');q=e.current().question;const extra=e.submit(answer(q));
 assert.equal(extra.priorExposure,true);assert.equal(extra.independent,false);assert.equal(e.next(),'complete');
 assert.equal(e.report().completedDays,1);assert.equal(e.report().readiness[0].samples,0);
 e.startDay(2);e.requestAid('explore',{activity:'synthetic-board'});const explored=e.submit(answer(e.current().question));
 assert.equal(explored.explorationEver,true);assert.equal(explored.feedbackHintEver,true);assert.equal(explored.independent,false);
}
{
 const store=storage(),e=open(store);e.setting('pinyin','none');
 assert.equal(e.dailyOptional(2).priorExposure,false);assert(e.startDailyOptional(2));
 const row=e.submit(answer(e.current().question));assert.equal(row.priorExposure,false);e.next();
 assert.equal(e.report().completedDays,0);assert.equal(e.report().readiness[0].samples,0);
 e.startDay(2);assert.equal(e.current().session.priorExposure[e.current().material.id],true);
}
{
 const store=storage(),e=open(store);e.setting('pinyin','none');
 for(let day=1;day<=7;day++){assert(e.startDay(day));finishCurrent(e);}
 assert.equal(e.report().completedDays,7);assert.equal(e.report().readiness[0].evaluable,false);
 assert.equal(e.nextDay(),8,'unreviewed classification must not create an impossible progression gate');
 assert.equal(e.challenge().eligible,false);assert(!e.recommend().materialId?.endsWith('-EXTRA'));
}
{
 const store=storage(),e=open(store);e.startDay(1);e.submit(answer(e.current().question));const raw=store.getItem(key);
 const bad=JSON.parse(JSON.stringify(data));bad.materials.find(m=>m.courseId===bad.courseScope.activeCourseId).questions[0].category='reading';
 assert.throws(()=>open(store,bad));assert.equal(store.getItem(key),raw);
}
console.log(JSON.stringify({result:'PASS',scope:'synthetic unreviewed classification, prerequisite and daily optional contracts',wrongFirstPreserved:true,unreviewedExcluded:true,unratedDoesNotBlock:true,explorationIsHelp:true,optionalExposureAndCompletion:true,invalidMetadataFailsClosed:true}));
