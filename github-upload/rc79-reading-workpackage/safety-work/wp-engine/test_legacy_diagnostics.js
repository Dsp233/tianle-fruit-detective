'use strict';
// Focused compatibility checks using synthetic records and supplied answer keys.
// They do not establish teaching quality, diagnostic equivalence or old-software
// compatibility with new records. Software rollback requires its exact backup.
const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('node:assert/strict');
const ctx={window:{__AMC8_STORAGE_TEST:true},console,Math,Date};vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(__dirname,'../baseline/source/reading_data.js'),'utf8'),ctx);
const oldData=ctx.window.__AMC8_READING_DATA;
vm.runInContext(fs.readFileSync(path.join(__dirname,'reading_engine.js'),'utf8'),ctx);
const data=JSON.parse(fs.readFileSync(path.join(__dirname,'../wp-course-data/candidate_reading_data.json'),'utf8'));
const clone=x=>JSON.parse(JSON.stringify(x)),key='legacy-diagnostics-synthetic';
function storage(){const db=new Map();return {getItem:k=>db.has(k)?db.get(k):null,setItem:(k,v)=>db.set(k,String(v)),removeItem:k=>db.delete(k)};}
function open(store,d=data){return ctx.window.ReadingEngine.create(d,store,key,()=>2000000000000);}
const sets=data.diagnostics.sets.filter(s=>data.courseScope.legacyCourseIds.includes(s.courseId));
function currentCounts(r){return JSON.stringify({first:r.first,conditions:r.conditions,completedDays:r.completedDays,readiness:r.readiness,errors:r.errors});}
function historical(r,id){return r.historicalDiagnostics.find(s=>s.setId===id);}
assert.equal(sets.length,13);

// All retained sets keep the original prerequisite and condition protocol.
for(const set of sets){
 const e=open(storage()),before=currentCounts(e.report()),events=e.snapshot().events.length;
 assert.equal(e.startDiagnostic(set.id,false).ok,false);
 assert.equal(e.snapshot().events.length,events);
 const result=e.startDiagnostic(set.id,true);assert.equal(result.ok,true,set.id);
 assert.equal(e.current().material.courseId,set.courseId);
 assert.equal(e.current().session.purpose,'diagnostic');
 const first=e.submit(e.current().question.answer);assert.equal(first.first,true);
 assert.equal(currentCounts(e.report()),before,'legacy work must not change active course statistics');
 const version=historical(e.report(),set.id).versions[0];
 assert.equal(version.contentHash,data.contentHash);assert.equal(version.currentContentVersion,true);
 assert.equal(version.first.total,1);assert.equal(version.conditions[result.condition].first.total,1);
 if(['C','D'].includes(result.condition))assert.equal(version.conditions[result.condition].conditionCompleteFirst.total,0,'unfulfilled audio/parent condition must remain incomplete');
}

// Preserve old wrong first answers, plans and exact upgrade backup; preserve a
// newly started historical diagnostic draft across a normal same-version load.
{
 const store=storage();let e=open(store,oldData);assert(e.startDiagnostic('BASELINE',true).ok);
 const q=e.current().question,wrong=(q.answer+1)%q.options.length,first=e.submit(wrong);
 assert.equal(first.correct,false);assert.equal(e.submit(q.answer).first,false);
 const before=e.snapshot().events.map(clone),original=store.getItem(key);
 e=open(store);const upgrade=e.snapshot().events.find(x=>x.type==='content_upgrade');
 assert.equal(store.getItem(upgrade.backupKey),original);
 assert.equal(e.attempts(q.id)[0].correct,false);
 for(const event of before)assert.equal(JSON.stringify(e.snapshot().events.find(x=>x.id===event.id)),JSON.stringify(event));
 const started=e.startDiagnostic('BASELINE',true);assert.equal(started.ok,true);
 assert.notEqual(started.formId,first.diagnostic.formId);
 const c=e.current(),draft=clone(c.question.answer);assert.equal(e.select(draft),true);
 e=open(store);assert.equal(e.status().status,'ready');assert.equal(e.resume(),true);
 assert.equal(JSON.stringify(e.current().session.drafts[c.question.id]),JSON.stringify(draft));
 const next=e.submit();assert.equal(next.first,true);assert.equal(next.diagnosticValidity.eligible,true);
 let versions=historical(e.report(),'BASELINE').versions;
 assert.equal(versions.length,2);
 assert.equal(versions.find(v=>v.contentHash===oldData.contentHash).first.correct,0);
 assert.equal(versions.find(v=>v.contentHash===data.contentHash).first.correct,1);
 const historyBefore=JSON.stringify(e.report().historicalDiagnostics);
 e.startDay(1);while(e.current()){assert(e.submit(e.current().question.answer));e.next();}
 assert.equal(e.report().completedDays,1);assert.equal(e.report().first.total,3);
 assert.equal(JSON.stringify(e.report().historicalDiagnostics),historyBefore);
 for(const condition of ['A','B','C','D'])assert.equal(e.report().conditions[condition].total,0);
 assert.equal(e.attempts(q.id).length,2);assert.equal(e.attempts(q.id)[0].first,true);
 assert.equal(e.startDiagnostic('BASELINE',true).ok,true);
 assert.equal(e.startDiagnostic('BASELINE',true).ok,true);
 assert.equal(e.startDiagnostic('BASELINE',true).ok,false,'allocated forms cannot be reused');
}

// Reading a retained original without answering is still exposure. Direct
// start may not manufacture a condition assignment or mix course material.
{
 const e=open(storage()),set=sets[0];
 for(const form of set.forms)e.start(form.materials.map(m=>m.id),{purpose:'review'});
 const count=e.snapshot().events.filter(x=>x.type==='diagnostic_plan').length;
 assert.equal(e.startDiagnostic(set.id,true).ok,false);
 assert.equal(e.snapshot().events.filter(x=>x.type==='diagnostic_plan').length,count);
 assert.throws(()=>e.start(set.forms[0].materials.map(m=>m.id),{purpose:'diagnostic',diagnostic:{setId:set.id,formId:set.forms[0].id,condition:'A',knowledgeConfirmed:true}}));
 assert.throws(()=>e.start([set.forms[0].materials[0].id,data.lessons[0].coreIds[0]]));
}

// A missing whitelist remains closed; malformed whitelist fails before writing.
{
 const d=clone(data);d.courseScope.legacyCourseIds=[];
 const e=open(storage(),d);assert.equal(e.startDiagnostic(sets[0].id,true).ok,false);
 const malformed=clone(data);malformed.courseScope.legacyCourseIds=[malformed.courseScope.activeCourseId];
 const store=storage();assert.throws(()=>open(store,malformed));assert.equal(store.getItem(key),null);
}

// Unreviewed active and legacy sets are rejected, including the low-level
// start() route even when a previously valid diagnostic plan exists.
for(const legacy of [false,true]){
 const d=clone(data),set=d.diagnostics.sets[0];
 if(!legacy){set.courseId=d.courseScope.activeCourseId;for(const f of set.forms)for(const m of f.materials)m.courseId=set.courseId;}
 const e=open(storage(),d);assert.equal(e.startDiagnostic(set.id,true).ok,true);
 const current=e.current(),eventCount=e.snapshot().events.length;
 for(const f of set.forms)for(const m of f.materials)for(const q of m.questions)Object.assign(q,{metadataStatus:'unreviewed',classification:null,category:null,ability:null,errorType:null});
 const blocked=e.startDiagnostic(set.id,true);assert.equal(blocked.ok,false);assert.match(blocked.reason,/尚未审校/);
 assert.throws(()=>e.start(current.session.materialIds,{purpose:'diagnostic',diagnostic:current.session.diagnostic}));
 assert.equal(e.snapshot().events.length,eventCount);
}

// Imports retain original events but never grant local independent condition
// evidence. Repeated import is idempotent; conflicting IDs fail without writes.
{
 const source=open(storage());assert(source.startDiagnostic('BASELINE',true).ok);
 const q=source.current().question,first=source.submit(q.answer);assert.equal(first.diagnosticValidity.eligible,true);
 const backup=source.backup(),targetStore=storage(),target=open(targetStore);
 assert.equal(target.importBackup(backup).ok,true);
 const count=target.snapshot().events.length;assert.equal(target.importBackup(backup).ok,true);assert.equal(target.snapshot().events.length,count);
 const version=historical(target.report(),'BASELINE').versions[0];
 assert.equal(version.first.total,1);assert.equal(version.conditions.A.importedFirst,1);assert.equal(version.conditions.A.conditionCompleteFirst.total,0);
 assert.equal(target.resume(),true);assert.equal(target.submit(q.answer).first,false);
 assert.equal(target.report().first.total,0);
 const before=targetStore.getItem(key),bad=JSON.parse(backup);bad.reading.events.find(x=>x.id===first.id).correct=false;
 assert.equal(target.importBackup(JSON.stringify(bad)).ok,false);assert.equal(targetStore.getItem(key),before);
 assert.notEqual(target.startDiagnostic('BASELINE',true).formId,first.diagnostic.formId);
}
console.log(JSON.stringify({result:'PASS_SYNTHETIC_LEGACY_DIAGNOSTICS',retainedSetsReachable:13,oldFirstAndExactBackupPreserved:true,conditionProtocolsRetained:true,versionReportsSeparated:true,draftReload:true,seenAndUnreviewedRejected:true,importsRemainUnverified:true,realUserData:'NOT_USED',oldSoftwareRollback:'Requires matching software and exact pre-upgrade backup; not tested here'}));
