import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const s=fs.readFileSync(process.argv[2],'utf8');
const source=s.slice(s.indexOf(' let pendingWrite=null;'),s.indexOf(' function appendEvent'));
const previous={answer:null}, next={answer:'24'};
let count=0;
const c=vm.createContext({saved:{rtm1:previous},previous,next,view:'examMapping',message:'',canPersist:true,
 restored:()=>({readOnly:false}),progressStore:{getStatus:()=> 'ready'},
 persist:()=>({ok:false,pending:true}),render(){},onSave(){count++}});
vm.runInContext(source,c);
assert.equal(vm.runInContext('commit(next,onSave)',c),true);
assert.match(c.message,/正在保存/);
assert.equal(count,0);
assert.equal(vm.runInContext('pendingWrite.previous',c),previous);
assert.equal(vm.runInContext('commit({answer:"16"},onSave)',c),false);
vm.runInContext("storageUpdate({status:'unsaved',raw:JSON.stringify({rtm1:previous})})",c);
assert.match(c.message,/尚未确认/);
assert.equal(c.saved.rtm1,next);
assert.equal(count,0);
vm.runInContext("storageUpdate({status:'ready',raw:JSON.stringify({rtm1:previous})})",c);
assert.equal(count,0);
vm.runInContext("storageUpdate({status:'ready',raw:JSON.stringify({rtm1:next})})",c);
assert.equal(count,1);
assert.equal(vm.runInContext('pendingWrite',c),null);
vm.runInContext("storageUpdate({status:'ready',raw:JSON.stringify({rtm1:next})})",c);
assert.equal(count,1);
console.log('PASS pending admission, exportable pending on failure, mismatched ack ignored, and exactly-once verified acknowledgement');
