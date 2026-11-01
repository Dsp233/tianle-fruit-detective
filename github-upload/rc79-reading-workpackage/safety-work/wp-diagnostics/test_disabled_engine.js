'use strict';
// Synthetic records only: the unreviewed draft must not become a diagnosis.
const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('node:assert/strict');
const dir=__dirname,root=path.resolve(dir,'../..');
const code=fs.readFileSync(process.env.CANDIDATE_ENGINE||path.join(root,'safety-work/wp-engine/reading_engine.js'),'utf8');
const oldJs=fs.readFileSync(path.join(root,'safety-work/baseline/source/reading_data.js'),'utf8');
const course=JSON.parse(fs.readFileSync(path.join(root,'safety-work/wp-course-data/candidate_reading_data.json'),'utf8'));
const draft=JSON.parse(fs.readFileSync(path.join(dir,'diagnostic_draft.json'),'utf8'));
const ctx={window:{__AMC8_STORAGE_TEST:true},console,Math,Date};vm.createContext(ctx);
vm.runInContext(oldJs,ctx);const old=ctx.window.__AMC8_READING_DATA;vm.runInContext(code,ctx);
const mem=new Map(),storage={getItem:k=>mem.has(k)?mem.get(k):null,setItem:(k,v)=>mem.set(k,String(v)),removeItem:k=>mem.delete(k)},key='diagnostic-draft-safety';
const create=d=>ctx.window.ReadingEngine.create(d,storage,key,()=>2000000000000);
let engine=create(old);assert(engine.startDiagnostic('BASELINE',true).ok);
const oldId=engine.current().question.id,oldFirst=engine.submit(engine.current().question.answer);
assert(oldFirst.first&&oldFirst.correct);const original=storage.getItem(key);
const fixture=JSON.parse(JSON.stringify(course));
fixture.contentHash='synthetic-diagnostic-draft-fixture';fixture.diagnostics.sets.push(...draft.sets);
engine=create(fixture);assert.equal(engine.status().status,'ready');
const event=engine.snapshot().events.find(x=>x.type==='content_upgrade');assert(event);
assert.equal(storage.getItem(event.backupKey),original,'exact old record must be backed up');
assert.equal(engine.attempts(oldId).length,1,'historical answer must be preserved');
assert.equal(engine.report().historical.first.total,1);assert.equal(engine.report().first.total,0);
const before=engine.snapshot().events.filter(x=>x.type==='diagnostic_plan').length;
for(const set of draft.sets){const result=engine.startDiagnostic(set.id,true);assert.equal(result.ok,false);assert.match(result.reason,/尚未审校/);}
assert.equal(engine.snapshot().events.filter(x=>x.type==='diagnostic_plan').length,before,'blocked drafts must not create condition assignments');
for(const condition of ['A','B','C','D'])assert.equal(engine.report().conditions[condition].total,0,'old/new conditions must not mix');
assert.equal(engine.startDiagnostic('BASELINE',true).ok,true,'retained historical diagnosis uses its original protocol');
assert.equal(engine.report().first.total,0,'historical diagnosis does not become current-course evidence');
console.log(JSON.stringify({result:'PASS_SYNTHETIC_DRAFT_GATE',draftSetsBlocked:13,oldRawBackedUp:true,oldFirstPreserved:true,conditionMixingBlocked:true,legacyLaunch:'available as historical diagnosis only',realUserData:'NOT_USED'}));
