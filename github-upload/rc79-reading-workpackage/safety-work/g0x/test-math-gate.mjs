import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {validate,claim,finish,ready,validateMathCompatibilityDisposition} from './queue-core.mjs';
const src=path.dirname(fileURLToPath(import.meta.url));
const sha='b9dced62a21c79bec63732e516f9d2170f38e87a',at='2026-11-08T01:00:00Z';
const sampleTask=(id,status='TODO',dependsOn=[],manualGate=false,priority=10)=>({id,title:id,stage:'W1',status,dependsOn,manualGate,priority,evidence:status==='PASS'?['test evidence']:[],resultSha:status==='PASS'?sha:null,lease:null,block:null,attempts:0});
function fixture(){
 return {schemaVersion:1,branch:'rc79-reading-workpackage-20261101',revision:0,updatedAt:at,events:[],tasks:[
  sampleTask('W1-R1','PASS',[],false,0),
  sampleTask('W1-MATH-COMPAT','TODO',['W1-R1'],false,10),
  sampleTask('W1-G5','TODO',['W1-MATH-COMPAT'],true,30),
  {...sampleTask('W1-MATH-SAVE','BLOCKED',['W1-R1'],false,90),stage:'M',block:{reason:'Preexisting status pending verification'}}
 ]};
}
const disposition=(classification,type)=>({
 classification,severity:'P2',
 comparison:{
  fix15Evidence:'docs/fix15-comparison.md',frozenW1Evidence:'docs/frozen-w1-comparison.md',
  qaPreviewEvidence:'docs/overlay-comparison.md',sameScenario:true,isolatedProfiles:true
 },
 safety:{
  firstAnswerEvidence:'tests/first-answer.json',draftEvidence:'tests/draft.json',
  pendingEvidence:'tests/pending.json',dataLoss:false,silentOverwrite:false
 },
 decision:{type}
});
function complete(d){
 let q=fixture();
 q=claim(q,{id:'W1-MATH-COMPAT',owner:'work',leaseId:'lease-1',at});
 return finish(q,{id:'W1-MATH-COMPAT',owner:'work',leaseId:'lease-1',at:'2026-11-08T01:01:00Z',resultSha:sha,evidence:['recorded comparison review'],disposition:d});
}
test('live canonical queue uses compatibility, not math repair, as G5 prerequisite',()=>{
 const q=JSON.parse(fs.readFileSync(path.join(src,'queue.json'),'utf8'));validate(q);
 const g5=q.tasks.find(t=>t.id==='W1-G5');
 assert(g5.dependsOn.includes('W1-MATH-COMPAT'));
 assert(!g5.dependsOn.includes('W1-MATH-SAVE'));
 const maintenance=q.tasks.find(t=>t.id==='W1-MATH-SAVE');
 assert.equal(maintenance.stage,'M');
 assert.equal(maintenance.status,'BLOCKED');
});
test('no comparison or unknown baseline cannot PASS',()=>{
 assert.throws(()=>complete(undefined),/classification/);
 const d=disposition('PRE_EXISTING','ACCEPT_VERIFIED_LEGACY');
 delete d.comparison.fix15Evidence;
 d.decision.riskAcceptanceRef='owner: risk reviewed';
 assert.throws(()=>complete(d),/evidence/);
});
test('a verified pre-existing P2 UX issue can be dispositioned without repairing math',()=>{
 let d=disposition('PRE_EXISTING','ACCEPT_VERIFIED_LEGACY');
 assert.throws(()=>complete(d),/approval/);
 d.decision.riskAcceptanceRef='owner-reviewed risk decision evidence';
 const q=complete(d);validate(q);
 assert.equal(q.tasks.find(t=>t.id==='W1-MATH-COMPAT').status,'PASS');
 assert(!ready(q).some(x=>x.id==='W1-G5')); // still manual publication gate
});
test('preexisting high-risk or actual record loss never bypasses repair',()=>{
 for(const severity of ['P0','P1']){const d=disposition('PRE_EXISTING','ACCEPT_VERIFIED_LEGACY');d.severity=severity;d.decision.riskAcceptanceRef='owner decision evidence';assert.throws(()=>validateMathCompatibilityDisposition(d),/low-risk/)}
 const d=disposition('PRE_EXISTING','ACCEPT_VERIFIED_LEGACY');d.safety.dataLoss=true;d.decision.riskAcceptanceRef='owner decision evidence';
 assert.throws(()=>complete(d),/low-risk/);
});
test('new W1 regression requires validated new candidate and allowlist',()=>{
 const d=disposition('W1_REGRESSION','ACCEPT_VERIFIED_LEGACY');d.decision.riskAcceptanceRef='owner decision evidence';
 assert.throws(()=>complete(d),/regression/);
 d.decision={type:'FIX_AND_REFREEZE'};
 assert.throws(()=>complete(d),/new candidate/);
 d.decision={type:'FIX_AND_REFREEZE',remediationCommitSha:sha,refrozenArtifactSha256:'b'.repeat(64),
 chromiumEvidence:'tests/chromium-run',webkitEvidence:'tests/webkit-run',revisedAllowlistEvidence:'release/new-allowlist'};
 assert.equal(complete(d).tasks.find(t=>t.id==='W1-MATH-COMPAT').status,'PASS');
});
test('QA-only issue requires independently verified release isolation',()=>{
 const d=disposition('QA_ONLY','QA_ISOLATED');
 assert.throws(()=>complete(d),/isolated/);
 d.decision.qaExclusionEvidence='release/original-frozen-no-overlay';
 assert.equal(complete(d).tasks.find(t=>t.id==='W1-MATH-COMPAT').status,'PASS');
});
