import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {validate,ready,decideNext,registerApproval,claim,renew,checkpoint,checkpointSemanticReview,rebaselineSemanticReview,finish,block,unblock,recoverExpired,explain} from './queue-core.mjs';
const sha='b9dced62a21c79bec63732e516f9d2170f38e87a';
const task=(id,status='TODO',deps=[],manualGate=false,priority=10)=>({id,title:id,stage:'W1',dependsOn:deps,status,priority,manualGate,evidence:status==='PASS'?['verified receipt']:[],resultSha:status==='PASS'?sha:null,lease:null,progress:null,block:null,attempts:0});
const fixture=()=>({schemaVersion:1,branch:'rc79-reading-workpackage-20261101',revision:0,updatedAt:'2026-11-08T00:00:00Z',events:[],tasks:[task('R1','PASS',[],false,5),task('MATH','TODO',['R1'],false,10),task('CI','TODO',['R1'],false,20),task('G5','TODO',['MATH','CI'],true,30),task('G0A','TODO',[],false,40)]});
const d1='2026-11-08T00:01:00Z',d2='2026-11-08T00:02:00Z',d3='2026-11-08T00:03:00Z';
test('priority dependency manual gate',()=>{let q=fixture();assert.deepEqual(ready(q).map(t=>t.id),['MATH','CI','G0A']);assert.equal(explain(q).find(t=>t.id==='G5').waitingFor.length,2)});
test('claim checkpoint PASS requires evidence',()=>{let q=claim(fixture(),{owner:'w',leaseId:'a',at:d1});q=checkpoint(q,{id:'MATH',owner:'w',leaseId:'a',at:d2,note:'step 3'});assert.throws(()=>finish(q,{id:'MATH',owner:'w',leaseId:'a',at:d3,resultSha:sha}));q=finish(q,{id:'MATH',owner:'w',leaseId:'a',at:d3,resultSha:sha,evidence:['receipt']});assert.equal(q.revision,3);assert.equal(q.tasks[1].status,'PASS')});
test('expired lease and concurrent owner protection',()=>{let q=claim(fixture(),{id:'MATH',owner:'a',leaseId:'x',at:d1,ttlMinutes:5});assert.throws(()=>checkpoint(q,{id:'MATH',owner:'b',leaseId:'x',at:d2,note:'bad'}));assert.throws(()=>recoverExpired(q,{id:'MATH',at:d2,note:'not yet expired'}));q=recoverExpired(q,{id:'MATH',at:'2026-11-08T00:07:00Z',note:'old session verified terminated',stopEvidenceRef:'work/session/terminated/123'});assert.equal(q.tasks[1].status,'TODO');assert.equal(q.tasks[1].recoveryHistory.length,1)});
test('block task and continue next ready',()=>{let q=claim(fixture(),{id:'MATH',owner:'w',leaseId:'a',at:d1});q=block(q,{id:'MATH',owner:'w',leaseId:'a',at:d2,reason:'storage bug still unresolved'});assert.deepEqual(ready(q).map(t=>t.id),['CI','G0A']);q=unblock(q,{id:'MATH',at:d3,note:'restored test environment'});assert.equal(ready(q)[0].id,'MATH')});
test('manual gate requires actual authorization reference',()=>{let q=fixture();for(const id of ['MATH','CI']){let t=q.tasks.find(x=>x.id===id);t.status='PASS';t.resultSha=sha;t.evidence=['test']}validate(q);assert(!ready(q).some(t=>t.id==='G5'));assert.throws(()=>claim(q,{id:'G5',owner:'w',leaseId:'z',at:d1}));q.tasks.find(x=>x.id==='G5').workerRole='release-manager';q=registerApproval(q,{id:'G5',at:d1,approvalRef:'USER_test_G5_approval',evidenceRef:'owner/chat/test/G5',approvedBy:'test-user'});q=claim(q,{id:'G5',role:'release-manager',owner:'w',leaseId:'z',at:d1,approvalRef:'USER_test_G5_approval'});assert.equal(q.tasks[3].status,'ACTIVE')});
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
  const d=claim(live,{id:'M-DEVELOP',role:'developer',owner:'software-dev',leaseId:'dev-only-lease',at:'2026-11-09T02:00:00Z',approvalRef:"USER_20261108_M1_按既定依赖推进数学开发"});
  const devDone=finish(d,{id:'M-DEVELOP',owner:'software-dev',leaseId:'dev-only-lease',at:'2026-11-09T02:02:00Z',resultSha:sha,evidence:['candidate source 10753dae verified CI PASS']});
  assert.equal(devDone.tasks.find(t=>t.id==='M-DEVELOP').status,'PASS');
  assert.equal(devDone.tasks.find(t=>t.id==='M-R5-REVIEW').status,'TODO');
  assert.throws(()=>claim(devDone,{id:'M',owner:'deployer',leaseId:'deployer-lease',at:'2026-11-09T02:03:00Z',approvalRef:'specific release approval ref'}),/not runnable/);
  assert.throws(()=>claim(live,{id:'M-R5-REVIEW',role:'independent-reviewer',owner:'work-m1-semantic',leaseId:'wrong-owner',at:'2026-11-09T02:00:00Z',approvalRef:"USER_20261108_M1_按既定依赖推进数学开发"}),/cannot be claimed/);
  const independent=claim(live,{id:'M-R5-REVIEW',role:'independent-reviewer',owner:'work-independent-reviewer',leaseId:'review-only-lease',at:'2026-11-09T02:00:00Z',approvalRef:"USER_20261108_M1_按既定依赖推进数学开发"});
  assert.throws(()=>finish(independent,{id:'M-R5-REVIEW',owner:'work-independent-reviewer',leaseId:'review-only-lease',at:'2026-11-09T02:01:00Z',resultSha:sha,evidence:['only software ci']}),/pending or disputed/);
  const fake=structuredClone(live);
  fake.tasks.find(t=>t.id==='M-R5-REVIEW').status='PASS';
  fake.tasks.find(t=>t.id==='M-R5-REVIEW').resultSha=sha;
  fake.tasks.find(t=>t.id==='M-R5-REVIEW').evidence=['only CI'];
  assert.throws(()=>validate(fake),/84 source-bound|84-family|independent family signoffs/);
});


test('an unrelated ACTIVE developer must not hide independently READY R5 review',()=>{
  const live=JSON.parse(readFileSync(new URL('./queue.json',import.meta.url),'utf8'));
  const active=claim(live,{id:'M-DEVELOP',role:'developer',owner:'software-dev',leaseId:'active-dev-lease',at:'2026-11-09T02:00:00Z',approvalRef:"USER_20261108_M1_按既定依赖推进数学开发"});
  const decision=decideNext(active,{role:'independent-reviewer',owner:'independent-reviewer',leaseId:'reviewer-own-lease',approvalRef:'USER_20261108_M1_按既定依赖推进数学开发',at:'2026-11-09T02:01:00Z'});
  assert.equal(decision.action,'CLAIM_READY');
  assert(decision.ready.includes('M-R5-REVIEW'));
  assert.equal(decision.activeElsewhere.find(t=>t.taskId==='M-DEVELOP')?.owner,'software-dev');
  const reviewerWithoutApproval=decideNext(active,{owner:'independent-reviewer',leaseId:'reviewer-own-lease',at:'2026-11-09T02:01:00Z'});
  assert.notEqual(reviewerWithoutApproval.action,'CLAIM_READY');
  const review=claim(active,{id:'M-R5-REVIEW',role:'independent-reviewer',owner:'independent-reviewer',leaseId:'active-review-lease',at:'2026-11-09T02:01:00Z',approvalRef:"USER_20261108_M1_按既定依赖推进数学开发"});
  assert.equal(review.tasks.find(t=>t.id==='M-DEVELOP').status,'ACTIVE');
  assert.equal(review.tasks.find(t=>t.id==='M-R5-REVIEW').status,'ACTIVE');
  validate(review);
});

test('two M1 TODO tasks are role-routed; both roles claim independently',()=>{
 const q=JSON.parse(readFileSync(new URL('./queue.json',import.meta.url),'utf8'));
 const at='2026-11-09T02:00:00Z',approval="USER_20261108_M1_按既定依赖推进数学开发";
 assert.equal(decideNext(q,{owner:'new-work',approvalRef:approval,at}).action,'ROLE_REQUIRED');
 const dev=decideNext(q,{role:'developer',owner:'new-dev',approvalRef:approval,at});
 const r5=decideNext(q,{role:'independent-reviewer',owner:'new-review',approvalRef:approval,at});
 assert.equal(dev.taskId,'M-DEVELOP');assert.deepEqual(dev.ready,['M-DEVELOP']);
 assert.equal(r5.taskId,'M-R5-REVIEW');assert.deepEqual(r5.ready,['M-R5-REVIEW']);
 for(const [id,role] of [['M-DEVELOP','independent-reviewer'],['M-R5-REVIEW','developer'],['M-DEVELOP',null]])
  assert.throws(()=>claim(q,{id,role,owner:'new-owner',leaseId:'wrong-'+id+role,approvalRef:approval,at}),/role mismatch/);
 const reviewer=claim(q,{role:'independent-reviewer',owner:'new-review',leaseId:'review-one',approvalRef:approval,at});
 assert.equal(reviewer.tasks.find(t=>t.id==='M-R5-REVIEW').status,'ACTIVE');
 assert.equal(reviewer.tasks.find(t=>t.id==='M-DEVELOP').status,'TODO');
 assert.equal(reviewer.tasks.find(t=>t.id==='M-R5-REVIEW').lease.role,'independent-reviewer');
 const both=claim(reviewer,{role:'developer',owner:'new-dev',leaseId:'dev-one',approvalRef:approval,at});
 assert.equal(both.tasks.find(t=>t.id==='M-DEVELOP').status,'ACTIVE');
 assert.equal(both.tasks.find(t=>t.id==='M-R5-REVIEW').status,'ACTIVE');validate(both);
});
test('existing M1 claim approval must match recorded task authorization exactly',()=>{
 const q=JSON.parse(readFileSync(new URL('./queue.json',import.meta.url),'utf8'));
 const at='2026-11-09T02:00:00Z',wrong='USER_20261108_M1_fake_extra',recorded="USER_20261108_M1_按既定依赖推进数学开发";
 for(const [id,role] of [['M-DEVELOP','developer'],['M-R5-REVIEW','independent-reviewer']]){
  assert.throws(()=>claim(q,{id,role,owner:'new-worker',leaseId:'bad-'+id,approvalRef:wrong,at}),/Recorded approval reference mismatch/);
  assert.throws(()=>claim(q,{id,role,owner:'new-worker',leaseId:'missing-'+id,at}),/Recorded approval reference mismatch/);
  assert.notEqual(decideNext(q,{owner:'new-worker',role,approvalRef:wrong,at}).action,'CLAIM_READY');
  assert.equal(decideNext(q,{owner:'new-worker',role,approvalRef:recorded,at}).taskId,id);
 }
});

test('all unfinished manual tasks reject unrecorded or incorrectly scoped approvals',()=>{
 const q=JSON.parse(readFileSync(new URL('./queue.json',import.meta.url),'utf8')),at='2026-11-09T02:30:00Z';
 const roles={'M-DEVELOP':'developer','M-R5-REVIEW':'independent-reviewer','W2-DEVELOP':'developer','P-DEVELOP':'developer','M':'release-manager','W2':'release-manager','P-F':'release-manager','UAT':'uat-reviewer','Q0-RELEASE':'release-manager','G1-CI-LEAST-PRIVILEGE':'quality-engineer','G1-SOURCE-BUILD':'quality-engineer','G1-MODULE-BOUNDARIES':'quality-engineer','G1-QUALITY-FOUNDATION':'quality-engineer','G1-QUALITY-GATE':'quality-engineer'};
 const todo=q.tasks.filter(t=>t.manualGate&&t.status==='TODO');
 assert.equal(todo.length,Object.keys(roles).length);
 for(const t of todo){
  assert(roles[t.id],t.id+' needs explicit role');
  if(t.dependsOn.every(id=>q.tasks.find(x=>x.id===id).status==='PASS')&&!t.approvalRef)
   assert.throws(()=>claim(q,{id:t.id,owner:'probe',role:roles[t.id],leaseId:'test-'+t.id,at,approvalRef:'USER_forged_ref_1234'}),/Recorded approval reference mismatch/);
 }
});
test('new authorization is separately registered and cannot authorize another task',()=>{
 const q=JSON.parse(readFileSync(new URL('./queue.json',import.meta.url),'utf8')),at='2026-11-09T02:30:00Z';
 const args={id:'W2-DEVELOP',at,approvalRef:'USER_W2_verifiable_approval',evidenceRef:'owner/chat/W2/approval',approvedBy:'user-owner'};
 assert.throws(()=>claim(q,{id:args.id,owner:'worker',role:'developer',leaseId:'lease',at,approvalRef:args.approvalRef}),/Recorded approval/);
 assert.throws(()=>registerApproval(q,{...args,evidenceRef:'x'}),/authorization needs/);
 const grant=registerApproval(q,args);
 assert.equal(grant.tasks.find(t=>t.id===args.id).authorization.taskId,args.id);
 assert.throws(()=>registerApproval(grant,args),/unapproved TODO/);
 assert.throws(()=>claim(grant,{id:'P-DEVELOP',owner:'worker',role:'developer',leaseId:'x',at,approvalRef:args.approvalRef}),/Recorded approval/);
 assert.throws(()=>claim(grant,{id:args.id,owner:'worker',role:'quality-engineer',leaseId:'x',at,approvalRef:args.approvalRef}),/role mismatch/);
 assert.equal(claim(grant,{id:args.id,owner:'worker',role:'developer',leaseId:'x',at,approvalRef:args.approvalRef}).tasks.find(t=>t.id===args.id).status,'ACTIVE');
});

test('M1 developer/reviewer owner isolation survives finish, recovery and roles switched',()=>{
 const initial=JSON.parse(readFileSync(new URL('./queue.json',import.meta.url),'utf8'));
 const approval='USER_20261108_M1_按既定依赖推进数学开发';
 const at='2026-11-09T02:00:00Z';
 const dev=claim(initial,{id:'M-DEVELOP',role:'developer',owner:'new-worker',leaseId:'new-dev',at,approvalRef:approval});
 assert.equal(dev.workerHistory.length,1);
 assert.throws(()=>claim(dev,{id:'M-R5-REVIEW',role:'independent-reviewer',owner:'new-worker',leaseId:'review-collision',at,approvalRef:approval}),/cannot independently review their own/);
 const ended=finish(dev,{id:'M-DEVELOP',owner:'new-worker',leaseId:'new-dev',at:'2026-11-09T02:02:00Z',resultSha:sha,evidence:['test/browser-verified']});
 assert.throws(()=>claim(ended,{id:'M-R5-REVIEW',role:'independent-reviewer',owner:'new-worker',leaseId:'review-after-finish',at:'2026-11-09T02:03:00Z',approvalRef:approval}),/cannot independently review their own/);
 const reviewFirst=claim(initial,{id:'M-R5-REVIEW',role:'independent-reviewer',owner:'new-review',leaseId:'review-first',at,approvalRef:approval});
 assert.throws(()=>claim(reviewFirst,{id:'M-DEVELOP',role:'developer',owner:'new-review',leaseId:'dev-after-review',at,approvalRef:approval}),/cannot independently review their own/);
 const bad=structuredClone(reviewFirst);
 bad.workerHistory.push({owner:'new-review',taskId:'M-DEVELOP',at});
 assert.throws(()=>validate(bad),/cannot share a recorded owner/);
});

test('M/W2/Q0/F releases require distinct version-bound registration and matching deployment proof',()=>{
 let q=JSON.parse(readFileSync(new URL('./queue.json',import.meta.url),'utf8'));
 const at='2026-11-09T02:40:00Z',ref='USER_20261109_Q0_specific_release';
 const fields={sourceSha:'a'.repeat(40),artifactSha256:'b'.repeat(64),manifestSha256:'c'.repeat(64),
   target:'GitHub-Pages/Q0-production',browserEvidenceRef:'browser/Q0/latest-chromium-webkit',rollbackRef:'rollback/Q0/frozen'};
 assert.throws(()=>registerApproval(q,{id:'Q0-RELEASE',at,approvalRef:ref,evidenceRef:'owner/chat/Q0-release',approvedBy:'user-owner'}),/Release approval requires/);
 assert.throws(()=>registerApproval(q,{id:'Q0-RELEASE',at,approvalRef:ref,evidenceRef:'owner/chat/Q0-release',approvedBy:'user-owner',releaseIntent:{...fields,artifactSha256:'bad'}}),/Release approval requires/);
 assert.throws(()=>registerApproval(q,{id:'M',at,approvalRef:'USER_M_release',evidenceRef:'owner/chat/M',approvedBy:'user-owner',releaseIntent:fields}),/dependencies PASS/);
 q=registerApproval(q,{id:'Q0-RELEASE',at,approvalRef:ref,evidenceRef:'owner/chat/Q0-release',approvedBy:'user-owner',releaseIntent:fields});
 assert.equal(q.tasks.find(t=>t.id==='Q0-RELEASE').authorization.releaseIntent.sourceSha,fields.sourceSha);
 q=claim(q,{id:'Q0-RELEASE',owner:'release-worker',role:'release-manager',leaseId:'rel-1',at:'2026-11-09T02:41:00Z',approvalRef:ref});
 assert.throws(()=>finish(q,{id:'Q0-RELEASE',owner:'release-worker',leaseId:'rel-1',at:'2026-11-09T02:42:00Z',resultSha:sha,evidence:['CI only']}),/Release PASS requires/);
 assert.throws(()=>finish(q,{id:'Q0-RELEASE',owner:'release-worker',leaseId:'rel-1',at:'2026-11-09T02:42:00Z',resultSha:sha,evidence:['CI only'],disposition:{...fields,sourceSha:'d'.repeat(40),deploymentReceiptRef:'deploy/Q0/run',publicVerificationRef:'pages/Q0/check',rollbackEvidenceRef:'rollback/Q0/result'}}),/Release PASS requires/);
 const proof={...fields,deploymentReceiptRef:'deploy/Q0/run',publicVerificationRef:'pages/Q0/check',rollbackEvidenceRef:'rollback/Q0/result'};
 const done=finish(q,{id:'Q0-RELEASE',owner:'release-worker',leaseId:'rel-1',at:'2026-11-09T02:42:00Z',resultSha:sha,evidence:['deploy/Q0/verified'],disposition:proof});
 assert.equal(done.tasks.find(t=>t.id==='Q0-RELEASE').status,'PASS');
});

test('next task selection never recommends self-review to a recorded developer or the reverse',()=>{
 const q=JSON.parse(readFileSync(new URL('./queue.json',import.meta.url),'utf8'));
 const approval='USER_20261108_M1_按既定依赖推进数学开发',at='2026-11-09T02:44:00Z';
 const dev=claim(q,{id:'M-DEVELOP',owner:'fresh-reuse',role:'developer',leaseId:'dev-lease-1',at,approvalRef:approval});
 const ownDecision=decideNext(dev,{role:'independent-reviewer',owner:'fresh-reuse',approvalRef:approval,at:'2026-11-09T02:44:30Z'});
 assert.notEqual(ownDecision.action,'CLAIM_READY');
 const otherDecision=decideNext(dev,{role:'independent-reviewer',owner:'genuine-independent',approvalRef:approval,at:'2026-11-09T02:44:30Z'});
 assert.equal(otherDecision.taskId,'M-R5-REVIEW');
 const review=claim(q,{id:'M-R5-REVIEW',owner:'review-first-owner',role:'independent-reviewer',leaseId:'review-lease-1',at,approvalRef:approval});
 const reverse=decideNext(review,{role:'developer',owner:'review-first-owner',approvalRef:approval,at:'2026-11-09T02:44:30Z'});
 assert.notEqual(reverse.action,'CLAIM_READY');
});
