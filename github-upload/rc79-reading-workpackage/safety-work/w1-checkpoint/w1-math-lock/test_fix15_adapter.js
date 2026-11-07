'use strict';
// Exercises the transformation against the generated FIX15 app, not a copy of
// the implementation. APP_PATH is the output of adapt_fix15.py.
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync(process.env.APP_PATH,'utf8');
const start=source.indexOf('function confirmPersistedJoint(raw){');
const end=source.indexOf('\nconst progressAdapter=',start);
assert(start>=0&&end>start);
const old={id:'old',jointFacts:{n:1},pendingSave:true};
const changed={id:'changed',jointFacts:{n:2},pendingSave:true};
const group={id:'g',jointFacts:{n:3},pendingSave:true};
const missing={id:'missing',jointFacts:{n:4},pendingSave:true};
const saved={attempts:[old,changed,missing],jointProgress:{one:{records:[group]}}};
const ctx={saved,JSON,Object};vm.createContext(ctx);vm.runInContext(source.slice(start,end),ctx);
ctx.confirmPersistedJoint('{broken');assert.equal(old.pendingSave,true);
ctx.confirmPersistedJoint(JSON.stringify({attempts:[{id:'old',jointFacts:{n:1}},{id:'changed',jointFacts:{n:1}}],jointProgress:{one:{records:[{id:'g',jointFacts:{n:3}}]}}}));
assert.equal(old.pendingSave,undefined);assert.equal(group.pendingSave,undefined);
assert.equal(changed.pendingSave,true);assert.equal(missing.pendingSave,true);
// Exercise the helper from the transformed FIX15 app with a ready store: an
// input-only draft must warn even though no asynchronous save is pending.
const helperStart=source.indexOf('function hasUnsubmittedMathDraft(){');
const helperEnd=source.indexOf('\nif(window.addEventListener)',helperStart);
assert(helperStart>=0&&helperEnd>helperStart);
let active=true;
const draftContext={taskNow:()=>active,feedback:null,draft:{selected:[],number:'',startedAt:1},freshDraft:()=>({selected:[],number:'',startedAt:2}),view:'fruit',saved:{jointProgress:{}},progressStore:{exportSnapshot:()=>({stored:'{}',pending:null}),getStatus:()=>'ready'},window:{confirm:()=>false},syncStorageStatus(){},storageMessage:'',JSON};
vm.createContext(draftContext);vm.runInContext(source.slice(helperStart,helperEnd),draftContext);
assert.equal(draftContext.hasUnsubmittedMathDraft(),false);
draftContext.draft.number='42';assert.equal(draftContext.hasUnsubmittedMathDraft(),true);
assert.equal(draftContext.confirmMathNavigation('previous'),false);assert.match(draftContext.storageMessage,/导出/);
assert.equal(draftContext.confirmMathNavigation('progressExport'),true);
draftContext.window.confirm=()=>true;assert.equal(draftContext.confirmMathNavigation('previous'),true);
active=false;assert.equal(draftContext.hasUnsubmittedMathDraft(),false);active=true;
draftContext.draft.number='';draftContext.view='joint';draftContext.saved.jointProgress={synthetic:{responses:{a:'42'}}};
assert.equal(draftContext.hasUnsubmittedMathDraft(),true);
draftContext.feedback={ok:true};assert.equal(draftContext.hasUnsubmittedMathDraft(),false);
assert(source.includes("transactional:true,guardWebLock:true"));
assert(source.includes("progressStore.exportSnapshot().pending!==null||progressStore.getStatus()!=='ready'"));

// Protect plain (non-joint) attempts as well as joint attempts when a write
// remains pending. Test the generated FIX15 adapter, not a replacement model.
{
 const from=source.indexOf('function jointPendingRecords(record=saved){');
 const until=source.indexOf('\nfunction progressSnapshot()',from);
 assert(from>=0&&until>from,'generated source must expose pending and persist helpers');
 const ordinary={id:'plain',pendingSave:true,answer:{choice:1}};
 const jointAttempt={id:'joint',jointFacts:{n:1},pendingSave:true};
 const persisted={id:'joint',jointFacts:{n:1},pendingSave:true};
 let next={ok:false,reason:'PENDING',pending:true},written=null;
 const model={
  saved:{profileRevision:0,attempts:[ordinary,jointAttempt],jointProgress:{one:{records:[persisted]}}},
  topicCaptureDraft(){},canPersist:true,storedRaw:'old',storageMessage:'',syncStorageStatus(){},JSON,Object,
  progressStore:{exportSnapshot:()=>({stored:'old',pending:'queued'}),commit(snapshot){written=JSON.parse(JSON.stringify(snapshot));return next}}
 };
 vm.createContext(model);vm.runInContext(source.slice(from,until),model);
 assert.equal(model.jointPendingRecords().length,3,'all pending attempts must be included');
 assert.equal(model.persist().pending,true);
 assert.equal(ordinary.pendingSave,true,'pending ordinary attempt must remain unconfirmed');
 assert.equal(jointAttempt.pendingSave,true);
 assert.equal(written.attempts[0].pendingSave,undefined,'stored data must not retain pending marker');
 assert.equal(written.attempts[1].pendingSave,undefined);
 assert.equal(written.jointProgress.one.records[0].pendingSave,undefined);
 next={ok:true,raw:'committed'};
 assert.equal(model.persist().ok,true);
 assert.equal(ordinary.pendingSave,undefined,'only a successful commit clears ordinary pending');
 assert.equal(jointAttempt.pendingSave,undefined);
 assert.equal(persisted.pendingSave,undefined);
 assert(source.includes('attempt.pendingSave=true;for(const state of Object.values(saved.jointProgress))'),
        'submit must set pendingSave before initiating storage');
 assert(source.includes('pendingMathAttemptIds:[...new Set(jointPendingRecords().map(a=>a.id))]'),
        'export must distinguish all pending math attempt IDs');
}
console.log(JSON.stringify({result:'PASS',scope:'FIX15 adapter isolated tests',exactCommittedRecordsOnly:true,malformedAndChangedPreserved:true,saveWarningPresent:true,unsubmittedTaskAndJointDraftWarn:true,navigationRequiresExplicitDiscard:true}));
