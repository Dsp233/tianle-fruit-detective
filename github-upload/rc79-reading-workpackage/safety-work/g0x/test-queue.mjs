import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {validate,ready,decideNext,claim,renew,checkpoint,checkpointSemanticReview,rebaselineSemanticReview,finish,block,unblock,recoverExpired,explain} from './queue-core.mjs';
const sha='b9dced62a21c79bec63732e516f9d2170f38e87a';
const task=(id,status='TODO',deps=[],manualGate=false,priority=10)=>({id,title:id,stage:'W1',dependsOn:deps,status,priority,manualGate,evidence:status==='PASS'?['verified receipt']:[],resultSha:status==='PASS'?sha:null,lease:null,progress:null,block:null,attempts:0});
const fixture=()=>({schemaVersion:1,branch:'rc79-reading-workpackage-20261101',revision:0,updatedAt:'2026-11-08T00:00:00Z',events:[],tasks:[task('R1','PASS',[],false,5),task('MATH','TODO',['R1'],false,10),task('CI','TODO',['R1'],false,20),task('G5','TODO',['MATH','CI'],true,30),task('G0A','TODO',[],false,40)]});
const d1='2026-11-08T00:01:00Z',d2='2026-11-08T00:02:00Z',d3='2026-11-08T00:03:00Z';
test('priority dependency manual gate',()=>{let q=fixture();assert.deepEqual(ready(q).map(t=>t.id),['MATH','CI','G0A']);assert.equal(explain(q).find(t=>t.id==='G5').waitingFor.length,2)});
test('claim checkpoint PASS requires evidence',()=>{let q=claim(fixture(),{owner:'w',leaseId:'a',at:d1});q=checkpoint(q,{id:'MATH',owner:'w',leaseId:'a',at:d2,note:'step 3'});assert.throws(()=>finish(q,{id:'MATH',owner:'w',leaseId:'a',at:d3,resultSha:sha}));q=finish(q,{id:'MATH',owner:'w',leaseId:'a',at:d3,resultSha:sha,evidence:['receipt']});assert.equal(q.revision,3);assert.equal(q.tasks[1].status,'PASS')});
test('expired lease and concurrent owner protection',()=>{let q=claim(fixture(),{id:'MATH',owner:'a',leaseId:'x',at:d1,ttlMinutes:5});assert.throws(()=>checkpoint(q,{id:'MATH',owner:'b',leaseId:'x',at:d2,note:'bad'}));assert.throws(()=>recoverExpired(q,{id:'MATH',at:d2,note:'not yet expired'}));q=recoverExpired(q,{id:'MATH',at:'2026-11-08T00:07:00Z',note:'old session verified terminated',stopEvidenceRef:'work/session/terminated/123'});assert.equal(q.tasks[1].status,'TODO');assert.equal(q.tasks[1].recoveryHistory.length,1)});
test('block task and continue next ready',()=>{let q=claim(fixture(),{id:'MATH',owner:'w',leaseId:'a',at:d1});q=block(q,{id:'MATH',owner:'w',leaseId:'a',at:d2,reason:'storage bug still unresolved'});assert.deepEqual(ready(q).map(t=>t.id),['CI','G0A']);q=unblock(q,{id:'MATH',at:d3,note:'restored test environment'});assert.equal(ready(q)[0].id,'MATH')});
test('manual gate requires actual authorization reference',()=>{let q=fixture();for(const id of ['MATH','CI']){let t=q.tasks.find(x=>x.id===id);t.status='PASS';t.resultSha=sha;t.evidence=['test']}validate(q);assert(!ready(q).some(t=>t.id==='G5'));assert.throws(()=>claim(q,{id:'G5',owner:'w',leaseId:'z',at:d1}));q=claim(q,{id:'G5',owner:'w',leaseId:'z',at:d1,approvalRef:'explicit user approval reference'});assert.equal(q.tasks[3].status,'ACTIVE')});
test('reject cycles invalid deps false PASS and missing lease',()=>{for(const mutate of [q=>q.tasks[1].dependsOn=['G5'],q=>q.tasks[1].dependsOn=['NOPE'],q=>{q.tasks[1].status='PASS';q.tasks[1].resultSha=null},q=>q.tasks[1].status='ACTIVE']){let q=fixture();mutate(q);assert.throws(()=>validate(q))}});
test('renew lease no expired renewal',()=>{let q=claim(fixture(),{id:'MATH',owner:'w',leaseId:'t',at:d1,ttlMinutes:5});q=renew(q,{id:'MATH',owner:'w',leaseId:'t',at:d2,ttlMinutes:10});assert.equal(q.tasks[1].lease.expiresAt,'2026-11-08T00:12:00.000Z');assert.throws(()=>renew(q,{id:'MATH',owner:'w',leaseId:'t',at:'2026-11-08T00:13:00Z'}))});

test('ACTIVE is resumed by matching lease rather than NO_READY_TASK',()=>{
  let q=claim(fixture(),{id:'MATH',owner:'work-one',leaseId:'lease-A',at:d1,ttlMinutes:90});
  q.tasks.find(t=>t.id==='CI').status='BLOCKED';q.tasks.find(t=>t.id==='CI').block={reason:'test dependency offline'};
  q.tasks.find(t=>t.id==='G0A').status='BLOCKED';q.tasks.find(t=>t.id==='G0A').block={reason:'test environment offline'};
  assert.equal(decideNext(q,{owner:'work-one',leaseId:'lease-A',at:d2}).action,'CONTINUE_ACTIVE');
  assert.equal(decideNext(q,{owner:'other',leaseId:'other-lease',at:d2}).action,'ACTIVE_HELD_BY_OTHER');
  assert.equal(decideNext(q,{at:'2026-11-08T02:00:00Z'}).action,'EXPIRED_NEEDS_LIVENESS_CONFIRMATION');
  assert.throws(()=>recoverExpired(q,{id:'MATH',at:'2026-11-08T02:00:00Z',note:'lease elapsed but no worker proof'}),/evidence/);
});
test('R5 structured review refuses CI-only PASS and resumes exact unsigned family',()=>{
  const f=fixture();const t=f.tasks.find(x=>x.id==='MATH');t.semanticReview={
    schemaVersion:1,scope:'R5_INDEPENDENT_SEMANTIC',baselineRef:'docs/review.csv',
    requirementRef:'docs/trace.md',candidateSourceSha:sha,
    familyIds:['J-A03-01','J-A03-02'],dimensions:['QUESTION_SUFFICIENCY','INDEPENDENT_SOLUTION','PRIMARY_TARGET','SUPPORT_NECESSITY','TRANSFER_SUBSTANCE','COUNTEREXAMPLE','SIX_DIMENSION_APPLICABILITY'],
    reviews:{},completedCount:0,issueCount:0,nextFamilyId:'J-A03-01',lastReviewAt:null
  };
  let q=claim(f,{id:'MATH',owner:'review-worker',leaseId:'review-lease',at:d1});
  const s=q.tasks.find(t=>t.id==='MATH').semanticReview;
  assert.equal(decideNext(q,{owner:'review-worker',leaseId:'review-lease',at:d2}).review.nextFamilyId,'J-A03-01');
  assert.throws(()=>checkpointSemanticReview(q,{id:'MATH',owner:'review-worker',leaseId:'review-lease',at:d2,
    review:{familyId:'J-A03-01',sourceSha:sha,reviewerRef:'external-audit',checks:{INDEPENDENT_SOLUTION:{status:'PASS',note:'no evidence',evidenceRef:'ci-pass'}}}}),/evidence|independent/);
  const checks=Object.fromEntries(s.dimensions.map(d=>[d,{status:'PASS',note:'Verified actual math/semantic conclusion',evidenceRef:'review/cases/J-A03-01/'+d}]));
  const submit=(state,reviewerRef,partial)=>checkpointSemanticReview(state,{
    id:'MATH',owner:'review-worker',leaseId:'review-lease',at:d2,
    review:{familyId:'J-A03-01',sourceSha:sha,reviewerRef,checks:partial}
  });
  const firstReviewer='reviewer/independent-1',secondReviewer='reviewer/independent-2';
  assert.throws(()=>submit(q,firstReviewer,{
    QUESTION_SUFFICIENCY:{...checks.QUESTION_SUFFICIENCY,status:'NOT_APPLICABLE'}
  }),/applicable disposition/);
  assert.throws(()=>submit(q,firstReviewer,{
    TRANSFER_SUBSTANCE:{...checks.TRANSFER_SUBSTANCE,reviewerRef:secondReviewer}
  }),/submitting reviewer/);
  const partial=submit(q,firstReviewer,{PRIMARY_TARGET:checks.PRIMARY_TARGET});
  const mixed=submit(partial,secondReviewer,{COUNTEREXAMPLE:checks.COUNTEREXAMPLE});
  const retained=mixed.tasks.find(t=>t.id==='MATH').semanticReview.reviews['J-A03-01'].checks;
  assert.equal(retained.PRIMARY_TARGET.reviewerRef,firstReviewer);
  assert.equal(retained.COUNTEREXAMPLE.reviewerRef,secondReviewer);
  assert.equal(mixed.tasks.find(t=>t.id==='MATH').semanticReview.completedCount,0);

  q=checkpointSemanticReview(q,{id:'MATH',owner:'review-worker',leaseId:'review-lease',at:d2,
    review:{familyId:'J-A03-01',sourceSha:sha,reviewerRef:'reviewer/independent-1',checks}});
  assert.equal(q.tasks.find(t=>t.id==='MATH').semanticReview.completedCount,1);
  assert.equal(q.tasks.find(t=>t.id==='MATH').semanticReview.nextFamilyId,'J-A03-02');
  assert.throws(()=>checkpointSemanticReview(q,{id:'MATH',owner:'review-worker',leaseId:'review-lease',at:d3,
    review:{familyId:'J-A03-02',sourceSha:'f'.repeat(40),reviewerRef:'reviewer/test',checks}}),/exact candidate SHA/);
  q=rebaselineSemanticReview(q,{id:'MATH',owner:'review-worker',leaseId:'review-lease',at:d3,newSourceSha:'f'.repeat(40),evidenceRef:'review/candidate-change/123'});
  assert.equal(q.tasks.find(t=>t.id==='MATH').semanticReview.completedCount,0);
  assert.equal(q.tasks.find(t=>t.id==='MATH').semanticReview.archived.length,1);
});


test('the persisted M1 review must retain the baseline family IDs and all seven dimensions',()=>{
  const q=JSON.parse(readFileSync(new URL('./queue.json',import.meta.url),'utf8'));
  const state=q.tasks.find(t=>t.id==='M-R5-REVIEW').semanticReview;
  const baseline=readFileSync(new URL('../../../../docs/engineering/governance/M1_JOINT_BASELINE.csv',import.meta.url),'utf8');
  assert.deepEqual([...state.familyIds].sort(),
    baseline.trim().split(/\r?\n/).slice(1).map(row=>row.split(',')[0]).sort());
  const truncated=structuredClone(q);
  truncated.tasks.find(t=>t.id==='M-R5-REVIEW').semanticReview.familyIds.pop();
  assert.throws(()=>validate(truncated),/all 84|mismatched identity/);
  const skipped=structuredClone(q);
  skipped.tasks.find(t=>t.id==='M-R5-REVIEW').semanticReview.dimensions.pop();
  assert.throws(()=>validate(skipped),/Invalid structured R5/);
});


test('separated R5 independent task does not block development, but cannot be signed without 84 reviews',()=>{
  const live=JSON.parse(readFileSync(new URL('./queue.json',import.meta.url),'utf8'));
  const dev=live.tasks.find(t=>t.id==='M-DEVELOP'),r5=live.tasks.find(t=>t.id==='M-R5-REVIEW'),release=live.tasks.find(t=>t.id==='M');
  assert.equal(dev.status,'TODO');assert.equal(dev.block,null);assert.equal(dev.semanticReview,undefined);
  assert.equal(dev.candidateSourceSha,r5.semanticReview.candidateSourceSha);
  assert.equal(r5.status,'TODO');assert.equal(r5.semanticReview.completedCount,0);
  assert(release.dependsOn.includes('M-DEVELOP'));assert(release.dependsOn.includes('M-R5-REVIEW'));
  assert(!dev.dependsOn.includes('M-R5-REVIEW'));
  validate(live);
  const d=claim(live,{id:'M-DEVELOP',owner:'software-dev',leaseId:'dev-only-lease',at:'2026-11-09T02:00:00Z',approvalRef:'USER_20261108_M1_approved'});
  const devDone=finish(d,{id:'M-DEVELOP',owner:'software-dev',leaseId:'dev-only-lease',at:'2026-11-09T02:02:00Z',resultSha:sha,evidence:['candidate source 10753dae verified CI PASS']});
  assert.equal(devDone.tasks.find(t=>t.id==='M-DEVELOP').status,'PASS');
  assert.equal(devDone.tasks.find(t=>t.id==='M-R5-REVIEW').status,'TODO');
  assert.throws(()=>claim(devDone,{id:'M',owner:'deployer',leaseId:'deployer-lease',at:'2026-11-09T02:03:00Z',approvalRef:'specific release approval ref'}),/not runnable/);
  assert.throws(()=>claim(live,{id:'M-R5-REVIEW',owner:'work-m1-semantic',leaseId:'wrong-owner',at:'2026-11-09T02:00:00Z',approvalRef:'USER_20261108_M1_approved'}),/cannot be claimed/);
  const independent=claim(live,{id:'M-R5-REVIEW',owner:'work-independent-reviewer',leaseId:'review-only-lease',at:'2026-11-09T02:00:00Z',approvalRef:'USER_20261108_M1_approved'});
  assert.throws(()=>finish(independent,{id:'M-R5-REVIEW',owner:'work-independent-reviewer',leaseId:'review-only-lease',at:'2026-11-09T02:01:00Z',resultSha:sha,evidence:['only software ci']}),/pending or disputed/);
  const fake=structuredClone(live);
  fake.tasks.find(t=>t.id==='M-R5-REVIEW').status='PASS';
  fake.tasks.find(t=>t.id==='M-R5-REVIEW').resultSha=sha;
  fake.tasks.find(t=>t.id==='M-R5-REVIEW').evidence=['only CI'];
  assert.throws(()=>validate(fake),/84 source-bound|84-family|independent family signoffs/);
});
