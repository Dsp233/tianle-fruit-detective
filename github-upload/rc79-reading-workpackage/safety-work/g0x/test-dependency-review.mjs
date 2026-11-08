import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {validate,ready,validateReleaseEnvelopeDisposition,validateSoftwareAcceptanceDisposition} from './queue-core.mjs';
const dir=path.dirname(fileURLToPath(import.meta.url));
const q=JSON.parse(fs.readFileSync(path.join(dir,'queue.json'),'utf8'));
test('W1-G5 depends on actual software and complete release transaction, not historical search task',()=>{
 validate(q);const g5=q.tasks.find(t=>t.id==='W1-G5');
 for(const id of ['W1-MATH-COMPAT','W1-SOFTWARE-ACCEPTANCE','W1-G5-RELEASE-ENVELOPE']) assert(g5.dependsOn.includes(id));
 for(const id of ['W1-R2-INDEPENDENT','W1-MATH-SAVE','G0-A']) assert(!g5.dependsOn.includes(id));
 assert.equal(q.tasks.find(t=>t.id==='W1-R2-INDEPENDENT').status,'DEFERRED_BY_OWNER');
 assert.equal(q.tasks.find(t=>t.id==='W1-MATH-SAVE').stage,'M');
});
test('Full G0-A is not a blanket blocker for M risk remediation',()=>{
 const b=q.tasks.find(t=>t.id==='G0-B');
 assert(b.dependsOn.includes('G0-A-RISK-SLICE'));assert(!b.dependsOn.includes('G0-A'));
});
test('Development and release gates are distinct, and W2 coding does not await M production release',()=>{
  const task=id=>q.tasks.find(t=>t.id===id);
  assert.equal(task('M-DEVELOP').manualGate,true);
  assert(!task('M-DEVELOP').dependsOn.includes('M'));
  assert(task('M').dependsOn.includes('M-DEVELOP'));
  assert(!task('W2-DEVELOP').dependsOn.includes('M'));
  assert(task('W2').dependsOn.includes('W2-DEVELOP'));
  assert(task('W2').dependsOn.includes('M'));
  assert(task('Q0-RELEASE').dependsOn.includes('Q0'));
  assert(task('Q0-RELEASE').manualGate);
  assert(task('P-F').dependsOn.includes('P-DEVELOP'));
  assert(task('P-F').dependsOn.includes('Q0-RELEASE'));
});
test('READY reflects live task completion; completed work is not required to remain READY',()=>{
 const ids=ready(q).map(x=>x.id);
 for(const id of ['W1-G5-RELEASE-ENVELOPE','W1-SOFTWARE-ACCEPTANCE','Q0-PREVIEW','M-PREP','W2-PREP','P-PREP']) {
   const t=q.tasks.find(t=>t.id===id);
   assert(t,id);
   const shouldBeReady=t.status==='TODO' && !t.manualGate &&
     t.dependsOn.every(d=>q.tasks.find(x=>x.id===d)?.status==='PASS');
   assert.equal(ids.includes(id),shouldBeReady,id);
 }
 assert(!ids.includes('W1-G5')); // gated by real publication authorization
});
test('Envelope gate rejects incomplete supporting CI and false public deployment',()=>{
 const x={sourceCommit:'a'.repeat(40),mainBaseline:'b'.repeat(40),
 allowlistSha256:'c'.repeat(64),manifestSha256:'d'.repeat(64),frozenZipSha256:'e'.repeat(64),
 stageReceiptRef:'receipt/staged',preflightRunRef:'actions/123',rollbackRef:'receipt/rollback',
 status:'STAGED_NOT_DEPLOYED',supportFiles:{}};
 assert.throws(()=>validateReleaseEnvelopeDisposition(x),/support/);
 for(const p of ['.github/workflows/rc79-fix15-public.yml',
 'github-upload/rc79-reading-workpackage/safety-work/w1-checkpoint/public_release.py',
 'github-upload/rc79-reading-workpackage/safety-work/w1-checkpoint/w1-g5-allowlist.json',
 'github-upload/rc79-reading-workpackage/safety-work/w1-checkpoint/g5_release_envelope.py'])x.supportFiles[p]='f'.repeat(64);
 assert.equal(validateReleaseEnvelopeDisposition(x),x);
 x.publicDeployed=true;assert.throws(()=>validateReleaseEnvelopeDisposition(x),/not a public/);
});
test('Software gate accepts deferred Muse history, but not missing essential engineering evidence',()=>{
 const x={releaseSourceCommit:'a'.repeat(40),scope:'W1_SOFTWARE_ONLY',chromiumRunRef:'actions/chromium',webkitRunRef:'actions/webkit',
 independentEvidenceRef:'evidence/software',releaseSourceRef:'source/runtime',deviceUATDeferredRef:'uat/deferred',openP0P1:[],
 coverage:['READING_INTERACTIONS','FIRST_ANSWER_DRAFT','MATHEMATICS_COMPAT','LEGACY_DIAGNOSTICS','NAVIGATION'].map(id=>({id,status:'PASS',evidenceRef:'evidence/'+id})),
 historicalMuse:{unmappedCount:34,auditRef:'audit/muse-historic',stage:'UAT',status:'DEFERRED_BY_OWNER'}};
 assert.equal(validateSoftwareAcceptanceDisposition(x),x);
 x.historicalMuse.status='GAP_RISK_ACCEPTED';assert.throws(()=>validateSoftwareAcceptanceDisposition(x),/final UAT/);
 x.historicalMuse.status='DEFERRED_BY_OWNER';
 x.coverage[0].status='NOT_RUN';assert.throws(()=>validateSoftwareAcceptanceDisposition(x),/coverage/);
 x.coverage[0].status='PASS';
 x.openP0P1.push('lost answer');assert.throws(()=>validateSoftwareAcceptanceDisposition(x),/P0.P1/);
});

test('historical Muse external acceptance belongs to final UAT, not W1 gate',()=>{
  const history=q.tasks.find(t=>t.id==='W1-R2-INDEPENDENT');
  const software=q.tasks.find(t=>t.id==='W1-SOFTWARE-ACCEPTANCE');
  assert.equal(history.stage,'UAT');assert.equal(history.status,'DEFERRED_BY_OWNER');
  assert.equal(software.stage,'W1');
  assert(!q.tasks.find(t=>t.id==='W1-G5').dependsOn.includes(history.id));
  assert(!software.dependsOn.includes(history.id));
});

test('final UAT never gates any earlier stage, including future accidental indirect gates',()=>{
 const changed=structuredClone(q);
 changed.tasks.find(t=>t.id==='M-DEVELOP').dependsOn.push('W1-R2-INDEPENDENT');
 assert.throws(()=>validate(changed),/Final UAT cannot gate/);
 const changed2=structuredClone(q);
 changed2.tasks.find(t=>t.id==='P-DEVELOP').dependsOn.push('UAT');
 assert.throws(()=>validate(changed2),/Final UAT cannot gate/);
});
test('external acceptance is only final UAT; release/development manual gates remain separate',()=>{
 for(const t of q.tasks) {
   if(t.stage!=='UAT') assert(!t.dependsOn.some(d=>q.tasks.find(x=>x.id===d).stage==='UAT'),t.id);
 }
 for(const id of ['W1-G5','M','W2','P-F','Q0-RELEASE']) assert.equal(q.tasks.find(t=>t.id===id).manualGate,true);
 for(const id of ['M-DEVELOP','W2-DEVELOP','P-DEVELOP']) assert.equal(q.tasks.find(t=>t.id===id).manualGate,true);
});

test('optional QA overlay is never an indirect W1 software or G5 blocker',()=>{
 const sw=q.tasks.find(t=>t.id==='W1-SOFTWARE-ACCEPTANCE');
 assert(!sw.dependsOn.includes('W1-R2-QA-PREVIEW'));
 assert(sw.dependsOn.includes('W1-MATH-COMPAT'));
 assert(sw.dependsOn.includes('W1-R2-WEBKIT'));
});

test('M0 bounded governance precedes M1 without reopening G0 or gating W2',()=>{
 const task=id=>q.tasks.find(t=>t.id===id);
 assert.equal(task('G0-A').status,'PASS');assert.equal(task('G0-B').status,'PASS');
 assert.deepEqual(task('M0-BASELINE').dependsOn,['M-PREP','G0-B']);
 assert.equal(task('M0-BASELINE').manualGate,false);
 assert.deepEqual(task('M0-GOVERN').dependsOn,['M0-BASELINE']);
 assert.equal(task('M0-GOVERN').manualGate,true);
 assert(task('M-DEVELOP').dependsOn.includes('M0-GOVERN'));
 assert(!task('W2-DEVELOP').dependsOn.includes('M0-GOVERN'));
 assert(task('M').dependsOn.includes('M-DEVELOP'));
 assert.equal(task('M').manualGate,true);
 validate(q);
});


test('G1 long-term architecture governance is executable, bounded, and cannot be lost before F',()=>{
 const task=id=>q.tasks.find(t=>t.id===id);
 const ci=task('G1-CI-LEAST-PRIVILEGE'),build=task('G1-SOURCE-BUILD'),modules=task('G1-MODULE-BOUNDARIES');
 for(const t of [ci,build,modules]){
   assert(t && t.status==='TODO' && t.manualGate===true);
   assert(t.stage==='G1' && t.acceptanceCriteria.length>=3);
   assert(t.contractRef.endsWith('G1_LONG_TERM_ARCHITECTURE.md'));
   assert(task('P-F').dependsOn.includes(t.id));
 }
 assert.deepEqual(ci.dependsOn,['G0-B']);
 assert.deepEqual(build.dependsOn,['M-DEVELOP','G1-SOURCE-PREP']);
 assert.deepEqual(modules.dependsOn,['G1-SOURCE-BUILD']);
 assert(!task('M-DEVELOP').dependsOn.some(id=>id.startsWith('G1-')));
 assert(!task('M').dependsOn.some(id=>id.startsWith('G1-')));
 assert(!task('W2-DEVELOP').dependsOn.some(id=>id.startsWith('G1-')));
 assert(!task('Q0-RELEASE').dependsOn.some(id=>id.startsWith('G1-')));
 assert(!ready(q).some(t=>t.id.startsWith('G1-')));
 validate(q);
});


test('G1 source preparation and continuous gate are scheduled safely around active M1',()=>{
 const task=id=>q.tasks.find(t=>t.id===id);
 const prep=task('G1-SOURCE-PREP'),foundation=task('G1-QUALITY-FOUNDATION'),build=task('G1-SOURCE-BUILD'),boundaries=task('G1-MODULE-BOUNDARIES'),gate=task('G1-QUALITY-GATE');
 for(const t of [prep,foundation,gate]){
   assert(t && t.stage==='G1' && t.status==='TODO' && t.acceptanceCriteria.length>=3);
   assert(t.contractRef?.endsWith('G1_LONG_TERM_ARCHITECTURE.md'));
 }
 assert.deepEqual(prep.dependsOn,['G0-B','M0-BASELINE']);
 assert.equal(prep.manualGate,false);
 assert.deepEqual(foundation.dependsOn,['G0-B','M0-BASELINE']);
 assert.equal(foundation.manualGate,true);
 assert(build.dependsOn.includes('M-DEVELOP'));
 assert(build.dependsOn.includes('G1-SOURCE-PREP'));
 assert(!prep.dependsOn.includes('M-DEVELOP'));
 assert(boundaries.dependsOn.includes('G1-SOURCE-BUILD'));
 for(const id of ['G1-QUALITY-FOUNDATION','G1-CI-LEAST-PRIVILEGE','G1-MODULE-BOUNDARIES'])assert(gate.dependsOn.includes(id));
 assert.equal(gate.manualGate,true);
 assert(task('P-F').dependsOn.includes(gate.id));
 for(const id of ['M','M-DEVELOP','W2-DEVELOP','Q0-RELEASE'])assert(!task(id).dependsOn.some(x=>x.startsWith('G1-')));
 assert(ready(q).some(t=>t.id===prep.id));
 assert(!ready(q).some(t=>t.id===gate.id));
 validate(q);
});
