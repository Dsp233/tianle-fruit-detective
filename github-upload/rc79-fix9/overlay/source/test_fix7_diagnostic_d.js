'use strict';
// Synthetic behavior checks with the delivered reading data; not a teaching or child trial.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const ctx={window:{},console,Date,Math};vm.createContext(ctx);
for(const name of ['reading_data.js','reading_engine.js'])vm.runInContext(fs.readFileSync(path.join(__dirname,name),'utf8'),ctx,{filename:name});
const Engine=ctx.window.ReadingEngine,data=ctx.window.__AMC8_READING_DATA,key='synthetic_reading_fix7';
function storage(initial={}){const values={...initial};return {values,getItem:k=>Object.hasOwn(values,k)?values[k]:null,setItem:(k,v)=>{values[k]=String(v)}}}
function setup(seed={}){const store=storage(seed);const e=Engine.create(data,store,key,()=>2000000000000);return {e,store};}
function start(target){
 const x=setup();
 for(const condition of ['A','B','C','D']){const result=x.e.startDiagnostic('BASELINE',true);assert.equal(result.condition,condition);if(condition===target)return x;}
 throw Error('condition not found');
}
function submit(e){return e.submit(e.current().question.answer)}
function voice(e){const c=e.current(),requestId='synthetic-'+c.session.id+'-'+c.material.id;e.requestAid('story',{requestedText:c.material.text,requestId,originKind:'story'});e.speechStatus({status:'started',kind:'story',originKind:'story',startedBy:'onstart',requestId,sessionId:c.session.id,materialId:c.material.id,questionId:c.question.id});}
function parent(e){e.requestAid('parent',{attestation:'家长只读原文，不解释答案'});}
{
 const {e}=start('D');voice(e);const row=submit(e);
 assert.equal(row.diagnosticValidity.eligible,false,'system voice alone is not a parent reading');
 assert.equal(e.report().conditions.D.total,0);
}
{
 const {e}=start('D');parent(e);const row=submit(e);
 assert.equal(row.parentEver,true);assert.equal(row.voiceEver,false);
 assert.equal(row.diagnosticValidity.eligible,true,'documented parent-only reading remains valid');
 assert.equal(e.report().conditions.D.total,1);
}
{
 const {e}=start('D');parent(e);voice(e);const row=submit(e);
 assert.equal(row.diagnosticValidity.eligible,false,'mixed system voice and parent reading is not a clean D condition');
 assert.equal(e.report().conditions.D.total,0);
}
{
 const {e}=start('D');parent(e);e.setting('pinyin','all');e.setting('pinyin','none');
 assert.equal(submit(e).diagnosticValidity.eligible,false,'hiding previously shown pinyin does not undo exposure');
}
{
 const {e}=start('C');voice(e);assert.equal(submit(e).diagnosticValidity.eligible,true,'system voice remains valid for C');
 assert.equal(e.report().conditions.C.total,1);
}
{
 const {e,store}=start('D');voice(e);const first=submit(e);
 const legacy=JSON.parse(store.values[key]);
 const old=legacy.events.find(x=>x.id===first.id);
 old.diagnosticValidity={eligible:true,reason:'未见材料、先修确认和指定辅助条件完整；仍需多次对照'};
 const original=JSON.stringify(legacy),restored=setup({[key]:original});
 const report=restored.e.report();
 assert.equal(report.conditions.D.total,0,'legacy voice-only D is excluded from current comparison');
 assert(report.diagnosticExcluded.some(x=>x.questionId===first.questionId&&x.condition==='D'));
 assert.equal(report.first.total,1,'original answer remains in first-answer totals');
 assert.equal(restored.e.snapshot().events.find(x=>x.id===first.id).diagnosticValidity.eligible,true,'stored historical evidence is not rewritten');
 assert.equal(restored.store.values[key],original,'reading report does not write or modify the record');
 old.diagnosticValidity={eligible:false,reason:'先前已经见过材料'};
 const excluded=setup({[key]:JSON.stringify(legacy)}).e.report().diagnosticExcluded;
 assert.equal(excluded.find(x=>x.questionId===first.questionId).reason,'先前已经见过材料','existing exclusion reasons remain intact');
}
console.log(JSON.stringify({result:'PASS',scope:'synthetic D-condition boundary and legacy report compatibility using delivered reading data',parentOnly:true,systemOnlyRejected:true,mixedRejected:true,pinyinRejected:true,cOriginalStoryStartValid:true,originalEventsUnchanged:true,independentTeachingReview:'NOT_RUN',physicalIPad:'NOT_RUN'}));
