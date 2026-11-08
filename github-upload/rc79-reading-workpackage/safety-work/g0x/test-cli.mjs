import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';
const dir=path.dirname(fileURLToPath(import.meta.url)),cli=path.join(dir,'queue-cli.mjs');
const cmd=(file,...args)=>{const r=spawnSync(process.execPath,[cli,...args,'--file',file],{encoding:'utf8'});return {code:r.status,data:r.status===0?JSON.parse(r.stdout):null,error:r.stderr}};
test('CLI state persists, rejects stale revision, and advances past blocked task',()=>{
 const dirTmp=fs.mkdtempSync(path.join(os.tmpdir(),'amc8-g0x-'));
 try{
  const file=path.join(dirTmp,'queue.json');fs.copyFileSync(path.join(dir,'queue.json'),file);
  let r=cmd(file,'next');assert.equal(r.data.next.id,'W1-MATH-SAVE');
  r=cmd(file,'claim','--task','W1-MATH-SAVE','--owner','w','--expected-revision','0','--at','2026-11-08T00:01:00Z');assert.equal(r.code,0,r.error);
  const lease=r.data.state.tasks.find(t=>t.id==='W1-MATH-SAVE').lease.id;
  assert.equal(cmd(file,'claim','--task','W1-MATH-SAVE','--owner','w2','--expected-revision','0').code,1);
  r=cmd(file,'block','--task','W1-MATH-SAVE','--owner','w','--lease-id',lease,'--at','2026-11-08T00:02:00Z','--reason','unresolved math-save warning');assert.equal(r.code,0,r.error);
  r=cmd(file,'next');assert.equal(r.data.next.id,'W1-R3-PAGES-CI');assert.equal(r.data.revision,2);
 }finally{fs.rmSync(dirTmp,{recursive:true,force:true})}
});
