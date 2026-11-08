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
 assert.equal(q.tasks.find(t=>t.id==='W1-R2-INDEPENDENT').status,'BLOCKED');
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
test('Software gate requires independent essential browser coverage and owner disposition of unknown Muse cases',()=>{
 const x={releaseSourceCommit:'a'.repeat(40),scope:'W1_SOFTWARE_ONLY',chromiumRunRef:'actions/chromium',webkitRunRef:'actions/webkit',
 independentEvidenceRef:'evidence/software',releaseSourceRef:'source/runtime',
 deviceUATDeferredRef:'uat/deferred',openP0P1:[],
 coverage:['READING_INTERACTIONS','FIRST_ANSWER_DRAFT','MATHEMATICS_COMPAT','LEGACY_DIAGNOSTICS','NAVIGATION'].map(id=>({id,status:'PASS',evidenceRef:'evidence/'+id})),
 historicalMuse:{unmappedCount:34,auditRef:'audit/muse-historic',status:'BLOCKED'}};
 assert.throws(()=>validateSoftwareAcceptanceDisposition(x),/owner/);
 x.historicalMuse.status='GAP_RISK_ACCEPTED';
 x.historicalMuse.actualOwnerDecisionRef='approval/actual-owner';
 x.historicalMuse.riskLedgerRef='risk/34-historical';
 assert.equal(validateSoftwareAcceptanceDisposition(x),x);
 x.openP0P1.push('lost answer');assert.throws(()=>validateSoftwareAcceptanceDisposition(x),/P0\/P1/);
});
