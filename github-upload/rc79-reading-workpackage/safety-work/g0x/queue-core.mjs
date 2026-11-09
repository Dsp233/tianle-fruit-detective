// AMC8 G0-X task-state engine. Pure functions; no network, execution or git writes.
export const VALID_STATES = new Set(['TODO','ACTIVE','PASS','BLOCKED','DEFERRED_BY_OWNER']);
export const STATUSES = Object.freeze({TODO:'TODO',ACTIVE:'ACTIVE',PASS:'PASS',BLOCKED:'BLOCKED',DEFERRED_BY_OWNER:'DEFERRED_BY_OWNER'});
const fail = message => { throw new Error(message); };
const taskOf = (q,id) => q.tasks.find(t => t.id === id) || fail(`Unknown task: ${id}`);
const iso = value => { const t=Date.parse(value); if(!Number.isFinite(t)) fail(`Invalid ISO timestamp: ${value}`); return t; };
const copy = v => structuredClone(v);
const record = (q, type, id, at, description) => {
  q.revision++;
  q.updatedAt=at;
  q.events.push({revision:q.revision,type,taskId:id,at,description});
  if(q.events.length>200) q.events=q.events.slice(-200);
  return q;
};

const meaningfulRef = s => typeof s === 'string' && s.trim().length >= 8;
export function validateMathCompatibilityDisposition(d) {
  if(!d || !['PRE_EXISTING','W1_REGRESSION','QA_ONLY'].includes(d.classification)) fail('W1-MATH-COMPAT requires proven baseline classification');
  if(!/^[a-f0-9]{40}$/.test(d.releaseSourceCommit||'')) fail('W1-MATH-COMPAT must bind exact frozen release source commit');
  const compare=d.comparison;
  if(!compare || compare.sameScenario !== true || compare.isolatedProfiles !== true ||
     !['fix15Evidence','frozenW1Evidence'].every(k=>meaningfulRef(compare[k])))
    fail('FIX15 and frozen W1 comparable baseline evidence are always required');
  const qaNecessary = d.classification==='QA_ONLY' || compare.qaInterferenceSuspected===true;
  if(qaNecessary && !meaningfulRef(compare.qaPreviewEvidence))
    fail('QA-only or suspected review-overlay interference requires QA browser evidence');
  if(!qaNecessary && !meaningfulRef(compare.qaPreviewEvidence) &&
     !(compare.qaPreviewRelevance==='NOT_APPLICABLE' && meaningfulRef(compare.qaIsolationEvidence)))
    fail('QA evidence is optional only when its non-applicability is proven by frozen release isolation');
  const safety=d.safety;
  if(!safety || !['firstAnswerEvidence','draftEvidence','pendingEvidence'].every(k=>meaningfulRef(safety[k])) ||
     typeof safety.dataLoss!=='boolean' || typeof safety.silentOverwrite!=='boolean')
    fail('Document first-answer, draft and pending safety with actual evidence');
  if(!['P0','P1','P2','P3'].includes(d.severity)) fail('Invalid severity');
  const decision=d.decision;
  if(!decision || !['ACCEPT_VERIFIED_LEGACY','FIX_AND_REFREEZE','QA_ISOLATED'].includes(decision.type)) fail('Missing release risk disposition');
  const unsafe=safety.dataLoss || safety.silentOverwrite || ['P0','P1'].includes(d.severity);
  if(d.classification==='W1_REGRESSION' && decision.type!=='FIX_AND_REFREEZE')
    fail('W1 regression requires remediation and new validated candidate');
  if(decision.type==='ACCEPT_VERIFIED_LEGACY') {
    if(d.classification!=='PRE_EXISTING' || unsafe || !meaningfulRef(decision.riskAcceptanceRef))
      fail('Only verified low-risk pre-existing issues may be accepted with documented owner approval');
  } else if(decision.type==='QA_ISOLATED') {
    if(d.classification!=='QA_ONLY' || unsafe || !meaningfulRef(decision.qaExclusionEvidence))
      fail('QA-only problem must be isolated from frozen release; no unresolved high-risk data fault');
  } else {
    if(!/^[a-f0-9]{40}$/.test(decision.remediationCommitSha||'') ||
       !/^[a-f0-9]{40}$/.test(decision.refrozenSourceCommit||'') ||
       !/^[a-f0-9]{64}$/.test(decision.refrozenArtifactSha256||'') ||
       !['chromiumEvidence','webkitEvidence','revisedAllowlistEvidence'].every(k=>meaningfulRef(decision[k])))
      fail('Remediation needs a new candidate artifact, two-browser evidence and rebuilt release allowlist');
  }
  return d;
}


const validEvidenceRef = x => typeof x==='string' && x.trim().length>=8;
const validSha = x => typeof x==='string' && /^[a-f0-9]{64}$/.test(x);
export function validateReleaseEnvelopeDisposition(d) {
  if(!d || !/^[a-f0-9]{40}$/.test(d.sourceCommit||'') ||
     !/^[a-f0-9]{40}$/.test(d.mainBaseline||'') ||
     !validSha(d.allowlistSha256) || !validSha(d.manifestSha256) ||
     !validSha(d.frozenZipSha256) ||
     !['stageReceiptRef','preflightRunRef','rollbackRef'].every(k=>validEvidenceRef(d[k])))
    fail('G5 release envelope needs actual source, baseline, hashes, staging receipt, preflight and rollback refs');
  const must=[
    '.github/workflows/rc79-fix15-public.yml',
    'github-upload/rc79-reading-workpackage/safety-work/w1-checkpoint/public_release.py',
    'github-upload/rc79-reading-workpackage/safety-work/w1-checkpoint/w1-g5-allowlist.json',
    'github-upload/rc79-reading-workpackage/safety-work/w1-checkpoint/g5_release_envelope.py'
  ];
  if(!d.supportFiles || must.some(k=>!validSha(d.supportFiles[k])))
    fail('G5 release envelope must include main-workflow and every supporting validator with SHA256');
  if(d.status!=='STAGED_NOT_DEPLOYED' || d.publicDeployed===true)
    fail('G5 envelope preflight is not a public deployment or G5 PASS');
  return d;
}
export function validateSoftwareAcceptanceDisposition(d) {
  if(!d || !/^[a-f0-9]{40}$/.test(d.releaseSourceCommit||'')) fail('Software acceptance must bind exact release source commit');
  if(!d || d.scope!=='W1_SOFTWARE_ONLY' || 
     !['chromiumRunRef','webkitRunRef','independentEvidenceRef','releaseSourceRef','deviceUATDeferredRef'].every(k=>validEvidenceRef(d[k])))
    fail('W1 software acceptance requires independent and browser evidence linked to release source');
  const required=['READING_INTERACTIONS','FIRST_ANSWER_DRAFT','MATHEMATICS_COMPAT','LEGACY_DIAGNOSTICS','NAVIGATION'];
  if(!Array.isArray(d.coverage)||required.some(k=>!d.coverage.some(x=>x.id===k && x.status==='PASS' && validEvidenceRef(x.evidenceRef))))
    fail('W1 essential software test coverage is incomplete');
  if(!Array.isArray(d.openP0P1)||d.openP0P1.length>0)
    fail('W1 software release gate cannot accept unresolved P0/P1');
  if(!d.historicalMuse || !Number.isInteger(d.historicalMuse.unmappedCount) || d.historicalMuse.unmappedCount<0 ||
     !validEvidenceRef(d.historicalMuse.auditRef))
    fail('Historical Muse 26+8 missing evidence must be documented separately');
  if(d.historicalMuse.stage!=='UAT' || d.historicalMuse.status!=='DEFERRED_BY_OWNER')
    fail('Historical Muse gaps are deferred to final UAT; never fake PASS');
  return d;
}


export function validateG5SourceClosure(q) {
  const m=taskOf(q,'W1-MATH-COMPAT'),s=taskOf(q,'W1-SOFTWARE-ACCEPTANCE'),e=taskOf(q,'W1-G5-RELEASE-ENVELOPE');
  if([m,s,e].some(t=>t.status!=='PASS')) fail('G5 cannot release without three independent PASS gates');
  validateMathCompatibilityDisposition(m.disposition);
  validateSoftwareAcceptanceDisposition(s.disposition);
  validateReleaseEnvelopeDisposition(e.disposition);
  const sha=e.disposition.sourceCommit;
  if(m.disposition.releaseSourceCommit!==sha || s.disposition.releaseSourceCommit!==sha)
    fail('G5 evidence source mismatch: math/software release SHA differs from staged frozen artifact');
  if(m.disposition.decision.type==='FIX_AND_REFREEZE' &&
      m.disposition.decision.refrozenSourceCommit!==sha)
    fail('G5 remediation must be rebound to newly frozen source and package');
  return sha;
}

export function validate(q) {
  if(!q || q.schemaVersion!==1 || !Number.isSafeInteger(q.revision) || q.revision<0 || !Array.isArray(q.tasks) || !Array.isArray(q.events)) fail('Invalid queue header');
  if(typeof q.branch!=='string' || !q.branch) fail('Missing branch');
  const ids=new Set();
  for(const t of q.tasks) {
    if(typeof t.id!=='string'||!/^[-A-Z0-9]+$/.test(t.id)||ids.has(t.id)) fail(`Duplicate/invalid ID: ${t.id}`);
    ids.add(t.id);
    if(!VALID_STATES.has(t.status)||!Number.isInteger(t.priority)||!Array.isArray(t.dependsOn)||!Array.isArray(t.evidence)) fail(`Invalid task fields: ${t.id}`);
    if(typeof t.title!=='string'||!t.title||typeof t.stage!=='string'||!t.stage) fail(`Invalid metadata: ${t.id}`);
    if(typeof t.manualGate!=='boolean') fail(`Missing manualGate: ${t.id}`);
    if(t.status==='ACTIVE' && (!t.lease?.owner||!t.lease?.id||!t.lease?.expiresAt)) fail(`ACTIVE missing lease: ${t.id}`);
    if(t.status!=='ACTIVE' && t.lease) fail(`Unexpected lease: ${t.id}`);
    if(t.status==='PASS' && (!t.evidence.length||!t.resultSha)) fail(`PASS missing result evidence: ${t.id}`);
    if(t.id==='W1-MATH-COMPAT' && t.status==='PASS') validateMathCompatibilityDisposition(t.disposition);
    if(t.id==='W1-G5-RELEASE-ENVELOPE' && t.status==='PASS') validateReleaseEnvelopeDisposition(t.disposition);
    if(t.id==='W1-SOFTWARE-ACCEPTANCE' && t.status==='PASS') validateSoftwareAcceptanceDisposition(t.disposition);
    if(t.status==='BLOCKED' && !t.block?.reason) fail(`BLOCKED missing reason: ${t.id}`);
    if(t.semanticReview){
      validateSemanticReview(t.semanticReview);
      if(t.id==='M-DEVELOP' && t.semanticReview.familyIds.length!==84)fail('M1 review requires all 84 R5 families');
    }
    if(t.id==='M-DEVELOP' && t.status==='PASS' && (!t.semanticReview || t.semanticReview.completedCount!==t.semanticReview.familyIds.length || t.semanticReview.issueCount!==0))fail('M1 cannot PASS without full source-bound R5 independent signoff');
  }
  for(const t of q.tasks) for(const d of t.dependsOn) {
    if(!ids.has(d)||d===t.id) fail(`Invalid dependency ${t.id} -> ${d}`);
    // No external/final UAT task may directly or transitively gate an earlier stage.
    if(t.stage!=='UAT' && taskOf(q,d).stage==='UAT')
      fail(`Final UAT cannot gate engineering or staged release: ${t.id} -> ${d}`);
  }
  const walking=new Set(),done=new Set();
  function visit(id){if(walking.has(id)) fail('Dependency cycle');if(done.has(id))return;walking.add(id);for(const d of taskOf(q,id).dependsOn)visit(d);walking.delete(id);done.add(id)}
  for(const t of q.tasks)visit(t.id);
  // Any future reclassification of an upstream dependency as UAT is caught by
  // the direct edge check above, including long transitive dependency chains.
  if(q.tasks.some(t=>t.id==='W1-G5' && t.status==='PASS')) validateG5SourceClosure(q);
  return q;
}

const REVIEW_DECISIONS = new Set(['PASS','NOT_APPLICABLE','NOT_OBSERVED','ISSUE']);
const R5_DIMENSIONS = [
  'QUESTION_SUFFICIENCY','INDEPENDENT_SOLUTION','PRIMARY_TARGET','SUPPORT_NECESSITY',
  'TRANSFER_SUBSTANCE','COUNTEREXAMPLE','SIX_DIMENSION_APPLICABILITY'
];
function validReviewCheck(dimension,check){
  return !!check && REVIEW_DECISIONS.has(check.status) &&
    (check.status!=='NOT_APPLICABLE' || dimension==='SIX_DIMENSION_APPLICABILITY') &&
    meaningfulRef(check.evidenceRef) && meaningfulRef(check.note) &&
    (check.reviewerRef===undefined || meaningfulRef(check.reviewerRef));
}

const REVIEW_FAMILY_ID = /^J-[A-Z][0-9]{2}-[0-9]{2}$/;
function reviewSummary(state) {
  const reviews=Object.values(state.reviews);
  const complete=reviews.filter(x=>x.status==='PASS').length;
  const issues=reviews.filter(x=>x.status==='ISSUE').length;
  const next=state.familyIds.find(id=>state.reviews[id]?.status!=='PASS')||null;
  return {complete,issues,next};
}
function validateSemanticReview(s) {
  if(!s || s.schemaVersion!==1 || s.scope!=='R5_INDEPENDENT_SEMANTIC' ||
     !meaningfulRef(s.baselineRef) || !meaningfulRef(s.requirementRef) ||
     !/^[a-f0-9]{40}$/.test(s.candidateSourceSha||'') ||
     !Array.isArray(s.familyIds) || !s.familyIds.length ||
     new Set(s.familyIds).size!==s.familyIds.length ||
     s.familyIds.some(id=>!REVIEW_FAMILY_ID.test(id)) ||
     !Array.isArray(s.dimensions) || s.dimensions.length!==R5_DIMENSIONS.length ||
     !R5_DIMENSIONS.every(d=>s.dimensions.includes(d)) ||
     typeof s.reviews!=='object' || !s.reviews ||
     Array.isArray(s.reviews))fail('Invalid structured R5 review ledger');
  for(const [id,r] of Object.entries(s.reviews)){
    if(!s.familyIds.includes(id)||r.familyId!==id||
       r.sourceSha!==s.candidateSourceSha ||
       !meaningfulRef(r.reviewerRef) || !r.checks || typeof r.checks!=='object')
      fail('R5 review receipt has mismatched identity/provenance: '+id);
    for(const [dimension,c] of Object.entries(r.checks)){
      if(!s.dimensions.includes(dimension)||!validReviewCheck(dimension,c))
        fail('R5 dimension missing independent evidence or invalid disposition: '+id+'/'+dimension);
    }
    const issue=Object.values(r.checks).some(c=>c.status==='ISSUE');
    const all=s.dimensions.every(d=>['PASS','NOT_APPLICABLE'].includes(r.checks[d]?.status));
    if(r.status!==(issue?'ISSUE':all?'PASS':'IN_REVIEW'))
       fail('R5 case status cannot falsely claim independent signoff: '+id);
  }
  const summary=reviewSummary(s);
  if(s.completedCount!==summary.complete || s.issueCount!==summary.issues ||
     s.nextFamilyId!==summary.next)fail('R5 cursor or count does not match verified cases');
  return s;
}

/**
 * Choose what to do next, without mutating queue or stealing a lease.
 * Active task must be resumed by its matching owner and lease ID.
 */
export function decideNext(q,{owner=null,leaseId=null,at=new Date().toISOString()}={}){
  validate(q);const time=iso(at);
  const active=q.tasks.filter(t=>t.status==='ACTIVE').sort((a,b)=>a.priority-b.priority||a.id.localeCompare(b.id));
  const own=active.find(t=>t.lease?.owner===owner && t.lease?.id===leaseId && owner && leaseId);
  if(own) return {
    action:iso(own.lease.expiresAt)>time?'CONTINUE_ACTIVE':'EXPIRED_NEEDS_LIVENESS_CONFIRMATION',
    taskId:own.id,lease:own.lease,review:own.semanticReview?{
      nextFamilyId:own.semanticReview.nextFamilyId,
      completedCount:own.semanticReview.completedCount,
      totalCount:own.semanticReview.familyIds.length
    }:null,
    reason:iso(own.lease.expiresAt)>time?'Same worker may continue without reclaiming':'Do not renew/recover expired lease without verifying prior worker stopped'
  };
  if(active.length){
    const t=active[0],expired=iso(t.lease.expiresAt)<=time;
    return {action:expired?'EXPIRED_NEEDS_LIVENESS_CONFIRMATION':'ACTIVE_HELD_BY_OTHER',
      taskId:t.id,lease:t.lease,reason:expired?
      'Expired lease does not prove former Work has terminated; independent stop evidence required':
      'Do not claim or modify the same active task from another worker'};
  }
  const r=ready(q);
  if(r.length)return {action:'CLAIM_READY',taskId:r[0].id,ready:r.map(t=>t.id)};
  const gated=q.tasks.filter(t=>t.status==='TODO'&&t.manualGate&&t.dependsOn.every(d=>taskOf(q,d).status==='PASS'));
  if(gated.length)return {action:'APPROVAL_REQUIRED',taskIds:gated.map(t=>t.id)};
  const remaining=q.tasks.filter(t=>!['PASS','DEFERRED_BY_OWNER'].includes(t.status));
  return {action:remaining.length?'NO_READY_BUT_UNFINISHED':'ALL_ENGINEERING_TASKS_CLOSED',remaining:remaining.map(t=>({id:t.id,status:t.status}))};
}

export function checkpointSemanticReview(q,{id='M-DEVELOP',owner,leaseId,at,review}={}){
  const [n,t]=prepare(q,id,at);checkLease(t,owner,leaseId,at);
  const s=t.semanticReview;validateSemanticReview(s);
  if(!review || !s.familyIds.includes(review.familyId) ||
     review.sourceSha!==s.candidateSourceSha ||
     !meaningfulRef(review.reviewerRef) || !review.checks ||
     typeof review.checks!=='object' || Array.isArray(review.checks) ||
     !Object.keys(review.checks).length)
    fail('R5 checkpoint requires family ID, exact candidate SHA, independent reviewer and checks');
  const previous=s.reviews[review.familyId];
  const checks=Object.fromEntries(Object.entries(previous?.checks||{}).map(([dim,c])=>[
    dim,{...c,reviewerRef:c.reviewerRef??previous.reviewerRef}
  ]));
  for(const [dim,c] of Object.entries(review.checks)){
    if(!s.dimensions.includes(dim)||!validReviewCheck(dim,c)||
       (c.reviewerRef!==undefined && c.reviewerRef!==review.reviewerRef))
      fail('Each R5 dimension requires the submitting reviewer, independent evidence and an applicable disposition');
    checks[dim]={status:c.status,evidenceRef:c.evidenceRef,note:c.note,reviewerRef:review.reviewerRef};
  }
  const issue=Object.values(checks).some(x=>x.status==='ISSUE');
  const all=s.dimensions.every(dim=>['PASS','NOT_APPLICABLE'].includes(checks[dim]?.status));
  s.reviews[review.familyId]={familyId:review.familyId,sourceSha:review.sourceSha,reviewerRef:review.reviewerRef,
    checks,status:issue?'ISSUE':all?'PASS':'IN_REVIEW',updatedAt:at};
  const sum=reviewSummary(s);s.completedCount=sum.complete;s.issueCount=sum.issues;s.nextFamilyId=sum.next;s.lastReviewAt=at;
  return record(n,'REVIEW_CHECKPOINT',id,at,
    `family=${review.familyId}; state=${s.reviews[review.familyId].status}; signed=${sum.complete}/${s.familyIds.length}; next=${sum.next||'NONE'}`);
}

/** Reset prior signed findings on a changed candidate, preserving an audit archive. */
export function rebaselineSemanticReview(q,{id='M-DEVELOP',owner,leaseId,at,newSourceSha,evidenceRef}={}){
  const [n,t]=prepare(q,id,at);checkLease(t,owner,leaseId,at);
  const s=t.semanticReview;validateSemanticReview(s);
  if(!/^[a-f0-9]{40}$/.test(newSourceSha||'')||newSourceSha===s.candidateSourceSha||
      !meaningfulRef(evidenceRef))fail('R5 rebaseline requires a changed source SHA and evidence');
  s.archived=[...(s.archived||[]),{sourceSha:s.candidateSourceSha,reviews:s.reviews,evidenceRef,at}];
  s.candidateSourceSha=newSourceSha;s.reviews={};s.completedCount=0;s.issueCount=0;
  s.nextFamilyId=s.familyIds[0];s.lastReviewAt=null;
  return record(n,'REVIEW_REBASELINE',id,at,
    `Candidate changed; retained previous reviews as archived, all ${s.familyIds.length} family signoffs require source-specific recheck; evidence=${evidenceRef}`);
}

export function ready(q,{includeManual=false}={}) {
  validate(q);
  return q.tasks.filter(t=>t.status==='TODO' && (includeManual||!t.manualGate) && t.dependsOn.every(d=>taskOf(q,d).status==='PASS'))
    .sort((a,b)=>a.priority-b.priority || a.id.localeCompare(b.id));
}
export function explain(q){
  validate(q);
  return q.tasks.map(t=>({id:t.id,status:t.status,manualGate:t.manualGate,waitingFor:t.dependsOn.filter(d=>taskOf(q,d).status!=='PASS'),lease:t.lease||null,blocked:t.block||null,progress:t.progress||null}));
}
function prepare(q,id,now) { const n=copy(validate(q)); const t=taskOf(n,id); if(!now)fail('Timestamp required');iso(now); return [n,t]; }
function checkLease(t,owner,leaseId,now){
  if(t.status!=='ACTIVE'||!t.lease||t.lease.owner!==owner||t.lease.id!==leaseId) fail(`Lease ownership mismatch: ${t.id}`);
  if(iso(t.lease.expiresAt)<=iso(now)) fail(`Lease expired; recover explicitly: ${t.id}`);
}
export function claim(q,{id,owner,leaseId,at,ttlMinutes=60,approvalRef}={}){
  if(!owner||!leaseId||typeof owner!=='string'||typeof leaseId!=='string') fail('owner and fresh leaseId required');
  if(!Number.isInteger(ttlMinutes)||ttlMinutes<5||ttlMinutes>1440) fail('Lease TTL must be 5..1440 minutes');
  const selected=id||ready(q)[0]?.id;
  if(!selected)fail('NO_READY_TASK');
  const [n,t]=prepare(q,selected,at);
  if(t.status!=='TODO'||t.dependsOn.some(d=>taskOf(n,d).status!=='PASS')) fail('Task not runnable');
  if(n.tasks.some(x=>x.lease?.id===leaseId)) fail('Duplicate lease ID');
  if(t.manualGate && (!approvalRef || approvalRef.length<8)) fail(`Manual approval reference required for ${selected}`);
  if(selected==='W1-G5') validateG5SourceClosure(n);
  t.status='ACTIVE';t.attempts=(t.attempts||0)+1;t.lease={owner,id:leaseId,claimedAt:at,expiresAt:new Date(iso(at)+ttlMinutes*60000).toISOString()};
  t.approvalRef=t.manualGate?approvalRef:null;t.block=null;
  return record(n,'CLAIM',selected,at,`owner=${owner}; lease=${leaseId}`);
}
export function renew(q,{id,owner,leaseId,at,ttlMinutes=60}={}){
  const [n,t]=prepare(q,id,at);checkLease(t,owner,leaseId,at);
  if(!Number.isInteger(ttlMinutes)||ttlMinutes<5||ttlMinutes>1440)fail('Invalid TTL');
  t.lease.expiresAt=new Date(iso(at)+ttlMinutes*60000).toISOString();
  return record(n,'RENEW',id,at,'Lease extended');
}
export function checkpoint(q,{id,owner,leaseId,at,note}={}){
  const [n,t]=prepare(q,id,at);checkLease(t,owner,leaseId,at);if(!note||!note.trim())fail('Nonempty checkpoint required');
  t.progress=note.trim();return record(n,'CHECKPOINT',id,at,note.trim());
}
export function finish(q,{id,owner,leaseId,at,resultSha,evidence=[],disposition}={}){
  const [n,t]=prepare(q,id,at);checkLease(t,owner,leaseId,at);
  if(!/^[a-f0-9]{40}$/.test(resultSha||''))fail('40-char result commit SHA required');
  if(!Array.isArray(evidence)||!evidence.length||evidence.some(s=>typeof s!=='string'||!s.trim()))fail('Evidence required');
  if(id==='M-DEVELOP' && (!t.semanticReview || t.semanticReview.completedCount!==t.semanticReview.familyIds.length || t.semanticReview.issueCount!==0))fail('M1 cannot PASS with pending or disputed R5 family signoffs');
  if(id==='W1-MATH-COMPAT') { validateMathCompatibilityDisposition(disposition); t.disposition=disposition; }
  if(id==='W1-G5-RELEASE-ENVELOPE') {
    validateReleaseEnvelopeDisposition(disposition);
    if(t.expectedSourceCommit&&disposition.sourceCommit!==t.expectedSourceCommit)
      fail('Staged envelope does not match the replacement source');
    t.disposition=disposition;
  }
  if(id==='W1-SOFTWARE-ACCEPTANCE') { validateSoftwareAcceptanceDisposition(disposition); t.disposition=disposition; }
  t.status='PASS';t.resultSha=resultSha;t.evidence=[...new Set([...t.evidence,...evidence])];t.completedAt=at;t.lease=null;t.progress='Completed with verified evidence';
  return record(n,'PASS',id,at,evidence.join('; ').slice(0,500));
}
export function block(q,{id,owner,leaseId,at,reason,category='OTHER'}={}){
  const [n,t]=prepare(q,id,at);checkLease(t,owner,leaseId,at);
  if(!reason||reason.trim().length<8)fail('Specific blocking reason required');
  t.status='BLOCKED';t.block={reason:reason.trim(),category,at};t.lease=null;
  return record(n,'BLOCK',id,at,reason.trim().slice(0,500));
}
export function unblock(q,{id,at,note}={}){
  const [n,t]=prepare(q,id,at);if(t.status!=='BLOCKED')fail('Task not blocked');if(!note||note.trim().length<8)fail('Recovery explanation required');
  t.status='TODO';t.recoveryNote=note.trim();t.block=null;
  return record(n,'UNBLOCK',id,at,note.trim());
}
export function supersedeEnvelope(q,{at,sourceCommit,note}={}){
  const id='W1-G5-RELEASE-ENVELOPE';
  const [n,t]=prepare(q,id,at);
  if(t.status!=='PASS')fail('Only a verified staged envelope can be superseded');
  if(['ACTIVE','PASS'].includes(taskOf(n,'W1-G5').status))fail('Cannot change an active or completed release');
  if(!/^[a-f0-9]{40}$/.test(sourceCommit||'')||sourceCommit===t.disposition.sourceCommit||!meaningfulRef(note))
    fail('A new validated source and a supersession reason are required');
  t.supersededEnvelopes=[...(t.supersededEnvelopes||[]),{
    resultSha:t.resultSha,evidence:t.evidence,disposition:t.disposition,completedAt:t.completedAt,
  }];
  t.expectedSourceCommit=sourceCommit;
  t.status='TODO';
  t.disposition=null;
  t.resultSha=null;
  t.evidence=[];
  t.completedAt=null;
  t.progress=note;
  return record(n,'SUPERSEDE_ENVELOPE',id,at,note);
}
export function recoverExpired(q,{id,at,note,stopEvidenceRef}={}){
  const [n,t]=prepare(q,id,at);
  if(t.status!=='ACTIVE'||!t.lease)fail('Task not active');
  if(iso(t.lease.expiresAt)>iso(at))fail('Active lease not expired');
  if(!note||note.trim().length<8)fail('Explicit recovery reason required');
  if(!meaningfulRef(stopEvidenceRef))fail('Independent evidence that prior worker has stopped is required; expiry alone is insufficient');
  t.recoveryHistory=[...(t.recoveryHistory||[]),{at,lease:t.lease,reason:note.trim(),stopEvidenceRef}];
  t.lease=null;t.status='TODO';t.recoveryNote=note.trim();
  return record(n,'RECOVER_EXPIRED',id,at,note.trim());
}
