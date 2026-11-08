import test from 'node:test';
import assert from 'node:assert/strict';
import {validateG5SourceClosure} from './queue-core.mjs';
const frozen='c8575da9d28c40b5bf79412928a0be8c397e7094';
const envelope={status:'PASS',disposition:{
 sourceCommit:frozen,mainBaseline:'23755d3aa9bf9e479468bb24263f81ea8228430e',
 allowlistSha256:'a'.repeat(64),manifestSha256:'b'.repeat(64),frozenZipSha256:'c'.repeat(64),
 stageReceiptRef:'receipt/stage',preflightRunRef:'actions/4244',rollbackRef:'receipts/rollback',
 status:'STAGED_NOT_DEPLOYED',supportFiles:Object.fromEntries([
 '.github/workflows/rc79-fix15-public.yml',
 'github-upload/rc79-reading-workpackage/safety-work/w1-checkpoint/public_release.py',
 'github-upload/rc79-reading-workpackage/safety-work/w1-checkpoint/w1-g5-allowlist.json',
 'github-upload/rc79-reading-workpackage/safety-work/w1-checkpoint/g5_release_envelope.py'
 ].map(x=>[x,'d'.repeat(64)]))
}};
const software={status:'PASS',disposition:{
 releaseSourceCommit:frozen,scope:'W1_SOFTWARE_ONLY',chromiumRunRef:'actions/chromium',webkitRunRef:'actions/webkit',
 independentEvidenceRef:'report/real-browsers',releaseSourceRef:'release/original-frozen',
 deviceUATDeferredRef:'report/final-uat',openP0P1:[],
 coverage:['READING_INTERACTIONS','FIRST_ANSWER_DRAFT','MATHEMATICS_COMPAT','LEGACY_DIAGNOSTICS','NAVIGATION'].map(id=>({id,status:'PASS',evidenceRef:'runs/'+id})),
 historicalMuse:{unmappedCount:34,auditRef:'evidence/source-list',stage:'UAT',status:'DEFERRED_BY_OWNER'}
}};
const math={status:'PASS',disposition:{
 releaseSourceCommit:frozen,classification:'PRE_EXISTING',severity:'P2',
 comparison:{fix15Evidence:'fix15/math-test',frozenW1Evidence:'w1/math-test',sameScenario:true,isolatedProfiles:true,
 qaPreviewRelevance:'NOT_APPLICABLE',qaIsolationEvidence:'release/no-overlay'},
 safety:{firstAnswerEvidence:'runs/first-answer',draftEvidence:'runs/draft',pendingEvidence:'runs/pending',dataLoss:false,silentOverwrite:false},
 decision:{type:'ACCEPT_VERIFIED_LEGACY',riskAcceptanceRef:'owner/accepted-historical'}
}};
const state=()=>({tasks:[{id:'W1-MATH-COMPAT',...structuredClone(math)},
{id:'W1-SOFTWARE-ACCEPTANCE',...structuredClone(software)},{id:'W1-G5-RELEASE-ENVELOPE',...structuredClone(envelope)}]});
test('same frozen source release gate validates',()=>assert.equal(validateG5SourceClosure(state()),frozen));
test('a stale software browser run cannot be reused for a new frozen source',()=>{
 const q=state();q.tasks[1].disposition.releaseSourceCommit='f'.repeat(40);
 assert.throws(()=>validateG5SourceClosure(q),/source mismatch/);
});
test('a stale math compatibility decision cannot be reused for another frozen source',()=>{
 const q=state();q.tasks[0].disposition.releaseSourceCommit='e'.repeat(40);
 assert.throws(()=>validateG5SourceClosure(q),/source mismatch/);
});
test('math fix must bind the newest refrozen source',()=>{
 const q=state();const d=q.tasks[0].disposition;
 d.classification='W1_REGRESSION';
 d.decision={type:'FIX_AND_REFREEZE',remediationCommitSha:'a'.repeat(40),
  refrozenSourceCommit:'b'.repeat(40),refrozenArtifactSha256:'f'.repeat(64),
  chromiumEvidence:'actions/new-chromium',webkitEvidence:'actions/new-webkit',
  revisedAllowlistEvidence:'release/new-allowlist'};
 assert.throws(()=>validateG5SourceClosure(q),/rebound/);
});
