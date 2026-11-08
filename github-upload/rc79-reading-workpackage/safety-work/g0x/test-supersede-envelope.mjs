import test from 'node:test';
import assert from 'node:assert/strict';
import {supersedeEnvelope, validate} from './queue-core.mjs';

const at='2026-11-08T00:00:00Z';
const oldSource='a'.repeat(40);
const newSource='b'.repeat(40);
const hash='c'.repeat(64);
const supportFiles=Object.fromEntries([
  '.github/workflows/rc79-fix15-public.yml',
  ...['public_release.py','w1-g5-allowlist.json','g5_release_envelope.py']
    .map(name=>'github-upload/rc79-reading-workpackage/safety-work/w1-checkpoint/'+name)
].map(path=>[path,hash]));
const task=(id,status)=>({id,status,title:id,stage:'W1',priority:0,manualGate:false,dependsOn:[],evidence:[]});
function queue() {
  return {schemaVersion:1,branch:'candidate',revision:1,events:[],tasks:[
    {...task('W1-G5-RELEASE-ENVELOPE','PASS'),completedAt:at,resultSha:oldSource,evidence:['artifact receipt'],disposition:{
      sourceCommit:oldSource,mainBaseline:oldSource,allowlistSha256:hash,manifestSha256:hash,frozenZipSha256:hash,
      stageReceiptRef:'staging receipt',preflightRunRef:'preflight receipt',rollbackRef:'rollback receipt',
      supportFiles,status:'STAGED_NOT_DEPLOYED',publicDeployed:false
    }},task('W1-G5','TODO')
  ]};
}
test('superseding an envelope archives the original verified evidence',()=>{
  const q=queue();
  const n=supersedeEnvelope(q,{at,sourceCommit:newSource,note:'new validated artifact'});
  validate(n);
  const [old]=q.tasks,[next]=n.tasks;
  assert.equal(old.status,'PASS');
  assert.equal(next.status,'TODO');
  assert.equal(next.expectedSourceCommit,newSource);
  assert.deepEqual(next.supersededEnvelopes[0].disposition,old.disposition);
  assert.equal(n.events.at(-1).type,'SUPERSEDE_ENVELOPE');
});
test('the same source or a leased deployment cannot supersede staging',()=>{
  const q=queue();
  assert.throws(()=>supersedeEnvelope(q,{at,sourceCommit:oldSource,note:'same source'}));
  q.tasks[1].status='ACTIVE';
  q.tasks[1].lease={owner:'owner',id:'lease',expiresAt:'2026-11-09T00:00:00Z'};
  assert.throws(()=>supersedeEnvelope(q,{at,sourceCommit:newSource,note:'new validated artifact'}));
});
