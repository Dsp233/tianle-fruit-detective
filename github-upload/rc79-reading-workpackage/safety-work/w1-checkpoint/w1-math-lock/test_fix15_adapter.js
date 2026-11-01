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
assert(source.includes("transactional:true,guardWebLock:true"));
assert(source.includes("progressStore.exportSnapshot().pending!==null||progressStore.getStatus()!=='ready'"));
console.log(JSON.stringify({result:'PASS',scope:'FIX15 adapter isolated tests',exactCommittedRecordsOnly:true,malformedAndChangedPreserved:true,saveWarningPresent:true}));
