'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.resolve(__dirname),helper=fs.readFileSync(path.join(root,'test_transaction_store.js'),'utf8');
// Reuse the simulated serialized transaction scheduler; no real learner data.
const makeDB=vm.runInNewContext(helper.slice(helper.indexOf('function database()'),helper.indexOf('function memory()'))+';database',{setImmediate});
const common={schema:1,contentHash:'fixture',createdAt:1,settings:{pinyin:'all',rate:.85,remoteVoiceConsent:false,knownMath:[],dayRange:{start:1,end:84}},session:null,suspendedSessions:[],legacy:[]};
const older=JSON.stringify({...common,revision:1,events:[]}),newer=JSON.stringify({...common,revision:2,events:[{id:'newer-page',type:'setting',at:2,name:'pinyin',value:'all'}]});
let reads=0,disk=newer,writes=0;
const storage={getItem(k){if(k!=='reading')return null;return ++reads===1?older:disk},setItem(k,v){if(k==='reading'){writes++;disk=v}}};
const ctx={window:{},console,Math,Date,Promise,setTimeout,clearTimeout,localStorage:storage,indexedDB:makeDB()};vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(root,'overlay/source/progress_store.js'),'utf8'),ctx);
vm.runInContext(fs.readFileSync(path.join(root,'overlay/source/reading_engine.js'),'utf8'),ctx);
const data={contentHash:'fixture',materials:[],diagnostics:{sets:[]}},engine=ctx.window.ReadingEngine.create(data,storage,'reading',()=>3,{requireSafe:true});
(async()=>{
 for(let n=0;n<500&&!['conflict','ready','read_only'].includes(engine.status().status);n++)await new Promise(r=>setTimeout(r,2));
 engine.setting('pinyin','none');await new Promise(r=>setTimeout(r,50));
 assert.equal(engine.status().status,'conflict');assert.equal(disk,newer);assert.equal(writes,0);
 const backup=JSON.parse(engine.backup());assert.equal(backup.currentStoredRecord,newer);assert.equal(backup.baselineStoredRecord,older);assert.equal(backup.reading.settings.pinyin,'none');
 console.log(JSON.stringify({result:'PASS',initialSnapshotMismatchDetected:true,newerRecordPreserved:true,localDraftExportable:true}));
})().catch(e=>{console.error(e);process.exitCode=1});
