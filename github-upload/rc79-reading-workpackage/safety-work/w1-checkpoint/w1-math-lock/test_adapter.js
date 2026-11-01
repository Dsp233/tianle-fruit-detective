'use strict';
// Exercise the actual modified persist function with a controlled store whose
// serialized baseline changes before the UI status callback arrives.
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync(__dirname+'/app.js','utf8');
const start=source.indexOf('function persist(){'),end=source.indexOf('\nfunction progressSnapshot()',start);
assert(start>=0&&end>start);let baseline='old',expected=[],result={ok:false,reason:'PENDING',pending:true};
const ctx={saved:{profileRevision:0},topicCaptureDraft(){},jointPendingRecords(){return []},canPersist:true,storedRaw:'old',storageMessage:'',syncStorageStatus(){},JSON,
 progressStore:{exportSnapshot(){return {stored:baseline,pending:'synthetic'}},commit(snapshot,raw){expected.push(raw);return result}}};
vm.createContext(ctx);vm.runInContext(source.slice(start,end),ctx);
assert.equal(ctx.persist().reason,'PENDING');assert.equal(expected[0],'old');
// A completed local write may precede the deferred status callback. Another
// action should target the store's current baseline, not the UI's stale copy.
baseline='new';assert.equal(ctx.storedRaw,'old');assert.equal(ctx.persist().reason,'PENDING');assert.equal(expected[1],'new');
result={ok:false,reason:'CONFLICT'};ctx.persist();assert.equal(ctx.canPersist,false);assert.match(ctx.storageMessage,/冲突|更新/);
assert(source.includes('const progressAdapter={transactional:true,guardWebLock:true,test:'));
assert(source.includes("progressStore.exportSnapshot().pending!==null||progressStore.getStatus()!=='ready'"));
console.log(JSON.stringify({result:'PASS',scope:'isolated persist adapter with controlled mock; not browser or full application acceptance',successivePendingBaseline:true,conflictStopsSave:true,unsafeCloseWarns:true}));
