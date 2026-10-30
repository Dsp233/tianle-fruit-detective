'use strict';
// Exercise the real lazy-loader facade without starting the reading module.
const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('node:assert/strict');
const records=new Map(),key='math-store_reading_r1';let deny=false;
const storage={getItem(k){if(deny)throw Error('synthetic storage failure');return records.has(k)?records.get(k):null;}};
const config={base:'./',store:'math-store',legacy:false};
const context={console,URL,Date,JSON,localStorage:storage,location:{href:'https://example.test/',hash:''},document:{getElementById(id){return id==='learning-delivery'?{textContent:JSON.stringify(config)}:{};},addEventListener(){}}};
context.window=context;vm.createContext(context);vm.runInContext(fs.readFileSync(path.join(__dirname,'loader.js'),'utf8'),context);
const backup=()=>JSON.parse(context.ReadingUI.backup());
let b=backup();assert.equal(b.reading,null);assert.equal(b.currentStoredRecord,null);assert.equal(b.saveStatus,'not_loaded');
records.set(key,'{bad json');b=backup();assert.equal(b.reading,null);assert.equal(b.unreadableOriginal,'{bad json');assert.equal(b.currentStoredRecord,'{bad json');
const prior='{"old":"record exactly"}',backupKey=key+'_backup_before_content_test';const current=JSON.stringify({events:[{type:'content_upgrade',backupKey}],other:'preserved'});records.set(key,current);records.set(backupKey,prior);b=backup();assert.equal(b.currentStoredRecord,current);assert.equal(b.reading.other,'preserved');assert.equal(b.upgradeOriginal,prior);assert.equal(b.upgradeOriginalReadable,true);
records.delete(backupKey);b=backup();assert.equal(b.upgradeOriginal,null);assert.equal(b.upgradeOriginalReadable,false);
records.set(key,JSON.stringify({events:[{type:'content_upgrade',backupKey:'other-store_backup_before_content_test'}]}));b=backup();assert.equal(b.upgradeOriginalReadable,null);
deny=true;b=backup();assert.equal(b.currentStoredReadable,false);assert.equal(b.saveStatus,'read_only');deny=false;
context.__AMC8_ReadingRuntime={backup(){return 'runtime-delegated';}};assert.equal(context.ReadingUI.backup(),'runtime-delegated');
console.log(JSON.stringify({result:'PASS',emptyRecord:true,malformedRawRetained:true,upgradeOriginalRetained:true,missingOriginalReported:true,unrelatedKeyIgnored:true,storageFailureReported:true,loadedRuntimeDelegated:true}));
