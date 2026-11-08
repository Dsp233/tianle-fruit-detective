import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';
const dir=path.dirname(fileURLToPath(import.meta.url)),cli=path.join(dir,'queue-cli.mjs');
const sha='b9dced62a21c79bec63732e516f9d2170f38e87a';
const seed=()=>({schemaVersion:1,branch:'rc79-reading-workpackage-20261101',revision:0,updatedAt:'2026-11-08T00:00:00Z',events:[],tasks:[
  {id:'BASELINE',title:'test baseline',stage:'W1',status:'PASS',priority:0,dependsOn:[],manualGate:false,evidence:['test fixture'],resultSha:sha,lease:null,block:null},
  {id:'REPRO',title:'test reproduction',stage:'W1',status:'TODO',priority:10,dependsOn:['BASELINE'],manualGate:false,evidence:[],resultSha:null,lease:null,block:null},
  {id:'NEXT',title:'next independent task',stage:'G0',status:'TODO',priority:20,dependsOn:[],manualGate:false,evidence:[],resultSha:null,lease:null,block:null}
]});
const cmd=(file,...args)=>{const r=spawnSync(process.execPath,[cli,...args,'--file',file],{encoding:'utf8'});return {code:r.status,data:r.status===0?JSON.parse(r.stdout):null,error:r.stderr}};
test('CLI state uses fixed fixture instead of mutable production queue',()=>{
 const dirTmp=fs.mkdtempSync(path.join(os.tmpdir(),'amc8-g0x-'));
 try{
  const file=path.join(dirTmp,'queue.json');fs.writeFileSync(file,JSON.stringify(seed(),null,2));
  let r=cmd(file,'next');assert.equal(r.code,0,r.error);assert.equal(r.data.next.id,'REPRO');
  r=cmd(file,'claim','--task','REPRO','--owner','w','--expected-revision','0','--at','2026-11-08T00:01:00Z');
  assert.equal(r.code,0,r.error);
  const lease=r.data.state.tasks.find(t=>t.id==='REPRO').lease.id;
  assert.equal(cmd(file,'claim','--task','REPRO','--owner','w2','--expected-revision','0').code,1);
  r=cmd(file,'block','--task','REPRO','--owner','w','--lease-id',lease,'--at','2026-11-08T00:02:00Z','--reason','fixture intentionally blocked');assert.equal(r.code,0,r.error);
  r=cmd(file,'next');assert.equal(r.data.next.id,'NEXT');assert.equal(r.data.revision,2);
  assert.equal(fs.existsSync(file+'.lock'),false);
 }finally{fs.rmSync(dirTmp,{recursive:true,force:true})}
});
