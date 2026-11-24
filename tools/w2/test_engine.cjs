'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path');
const prep=process.argv[2],cand=process.argv[3];
const base=JSON.parse(fs.readFileSync(path.join(prep,'base-data.json'))),data=JSON.parse(fs.readFileSync(path.join(cand,'candidate-data.json'))),ledger=JSON.parse(fs.readFileSync(path.join(cand,'review-ledger.json')));
const oldJS=fs.readFileSync(path.join(prep,'runtime.js'),'utf8'),newJS=fs.readFileSync(path.join(cand,'candidate-runtime.js'),'utf8');
const expected=new Map(ledger.flatMap(f=>f.questions.map(q=>[q.id,q.answer])));
function storage(){const m=new Map();return {m,getItem:k=>m.has(k)?m.get(k):null,setItem:(k,v)=>m.set(k,String(v)),removeItem:k=>m.delete(k),key:i=>[...m.keys()][i],get length(){return m.size}}}
function engine(src,d,s,key='reading-test'){
 const a=src.indexOf('window.ReadingEngine=(()=>{'),b=src.indexOf('/* Original, controllable vector scenes',a);
 assert(a>=0&&b>a);const ctx=vm.createContext({window:{__AMC8_STORAGE_TEST:true},console,Date,Math});vm.runInContext(src.slice(a,b),ctx);
 // Use same-realm data so the engine's plain-object validator is meaningful.
 ctx.input=JSON.stringify(d);ctx.storage=s;ctx.key=key;
 return vm.runInContext('window.ReadingEngine.create(JSON.parse(input),storage,key,()=>1700000000000)',ctx);
}
function eq(x,y){assert.equal(JSON.stringify(x),JSON.stringify(y))}
function answer(e,wanted){const c=e.current(),idx=c.question.options.indexOf(wanted);assert(idx>=0,c.question.id);assert(e.select(idx));const a=e.submit();assert(a&&a.correct,c.question.id);return a}
function assist(e,condition,kind='story'){
 const c=e.current();if(condition==='D')e.requestAid('parent',{attestation:'synthetic parent reading'});
 if(condition==='C'){const id='synthetic-'+c.material.id;const text=kind==='story'?c.material.text:c.question.prompt;e.requestAid(kind,{requestId:id,requestedText:text,originKind:kind});e.speechStatus({state:'started',kind,originKind:kind,startedBy:'onstart',requestId:id,sessionId:c.session.id,materialId:c.material.id,questionId:c.question.id,spokenText:text});}
}
let checked=0,forms=0;
const s=storage(),e=engine(newJS,data,s);
for(const set of data.diagnostics.sets.slice(13)){
 const before=e.snapshot().events.length;assert.equal(e.startDiagnostic(set.id,false).ok,false);assert.equal(e.snapshot().events.length,before);
 for(let i=0;i<4;i++){
  const plan=e.startDiagnostic(set.id,true);assert(plan.ok,set.id);assert.equal(plan.condition,'ABCD'[(i+set.week%4)%4]);assert.equal(plan.formId,set.forms[i].id);
  for(let j=0;j<4;j++){const c=e.current();if(j%2===0)assist(e,plan.condition);assert.equal(e.reveal(),false); // before all responses to passage
   const a=answer(e,expected.get(c.question.id));assert(a.diagnosticValidity.eligible,JSON.stringify(a));checked++;assert.equal(e.next(),j===3?'complete':true);
  }
  forms++;
 }
 assert.equal(e.startDiagnostic(set.id,true).ok,false);
}
assert.equal(checked,208);assert.equal(forms,52);
const report=e.report();console.log('report shape',JSON.stringify({keys:Object.keys(report),diagnostic:Object.keys(report.diagnostics||{}),conditions:report.diagnosticConditions||report.conditionComparison||null}).slice(0,2000));
assert.equal(e.firstRows().filter(a=>a.diagnostic).length,208);
assert.equal(e.snapshot().events.filter(x=>x.type==='diagnostic_plan').length,52);
for(const condition of 'ABCD')eq(report.conditions[condition],{correct:52,total:52});assert.equal(report.diagnosticExcluded.length,0);assert.equal(Object.keys(report.matchedSets).length,13);assert.equal(report.completedDays,0);assert.equal(report.storyReadDays,0);
const first=data.diagnostics.sets[13],s2=storage(),a=engine(newJS,data,s2);
assert(a.startDiagnostic(first.id,true).ok);let c=a.current(),id=c.question.id,correct=c.question.options.indexOf(expected.get(id)),wrong=(correct+1)%3;
assert(a.select(wrong));const saved=a.snapshot();const reload=engine(newJS,data,s2);assert.equal(reload.current().session.drafts[id],wrong);
assert(reload.resume());const w=reload.submit();assert.equal(w.correct,false);assert.equal(w.first,true);const r=reload.submit(correct);assert.equal(r.correct,true);assert.equal(r.first,false);assert.equal(reload.firstRows().find(x=>x.questionId===id).correct,false);
assert.equal(reload.firstRows().find(x=>x.questionId===id).diagnosticValidity.eligible,true);
let disabled=JSON.parse(JSON.stringify(data));disabled.diagnostics.sets[13].availability='disabled_pending_review';let dis=engine(newJS,disabled,storage());assert.equal(dis.startDiagnostic(first.id,true).ok,false);
disabled=JSON.parse(JSON.stringify(data));disabled.diagnostics.sets[13].forms[0].materials[0].prerequisitesStatus='unreviewed';assert.equal(engine(newJS,disabled,storage()).startDiagnostic(first.id,true).ok,false);
// Exposed first material causes selection of a later form; no reused material.
let exp=engine(newJS,data,storage());exp.start([first.forms[0].materials[0].id]);let pl=exp.startDiagnostic(first.id,true);assert(pl.ok);assert.equal(pl.formId,first.forms[1].id);
// Contamination and missing assistance must not enter valid comparison.
for(const [week,mode] of [[0,'A'],[1,'B'],[2,'C'],[3,'D']]){
 let z=engine(newJS,data,storage()),set=data.diagnostics.sets[13+week];assert.equal(z.startDiagnostic(set.id,true).condition,mode);
 if(mode==='A')z.requestAid('pinyin',{mode:'all'});
 if(mode==='B')z.requestAid('parent');
 if(mode==='C')assist(z,'C','question');
 let rr=answer(z,expected.get(z.current().question.id));assert.equal(rr.diagnosticValidity.eligible,false,mode);
}
// W1->W2 migration with an actual legacy diagnosis and a training draft.
let migration=storage(),old=engine(oldJS,base,migration);
assert(old.startDiagnostic(base.diagnostics.sets[0].id,true).ok);let legacy=old.current();const legacyId=legacy.question.id;
assert(old.submit(legacy.question.answer).correct);old.next();old.select(0);
const beforeEvents=old.snapshot().events.filter(x=>x.type==='attempt');const beforeRaw=migration.getItem('reading-test');
migration.setItem('tianle_amc8_question_design_v1','{"sentinel":"math-untouched"}');
const upgraded=engine(newJS,data,migration);eq(upgraded.snapshot().events.filter(x=>x.type==='attempt'),beforeEvents);assert.equal(upgraded.firstRows().length,0);
assert.equal(upgraded.attempts(legacyId).length,1);assert([...migration.m.values()].includes(beforeRaw),'exact raw backup must survive');
assert.equal(migration.getItem('tianle_amc8_question_design_v1'),'{"sentinel":"math-untouched"}');
assert(upgraded.startDiagnostic(first.id,true).ok);assert(answer(upgraded,expected.get(upgraded.current().question.id)).correct);assert.equal(upgraded.firstRows().length,1);assert.equal(upgraded.attempts(legacyId).length,1);
const snapshot=upgraded.snapshot();const reopened=engine(newJS,data,migration);eq(reopened.snapshot().events.filter(x=>x.type==='attempt'),snapshot.events.filter(x=>x.type==='attempt'));
console.log(JSON.stringify({passed:true,newQuestions:checked,forms,conditions:'A/B/C/D all 52 forms; invalid conditions excluded',draftRefresh:true,firstAnswerImmutable:true,unseenGuard:true,legacyHistory:true,rawBackup:true,mathKeyUnchanged:true}));
