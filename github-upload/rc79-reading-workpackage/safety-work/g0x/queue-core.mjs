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
  const compare=d.comparison;
  if(!compare || compare.sameScenario !== true || compare.isolatedProfiles !== true ||
     !['fix15Evidence','frozenW1Evidence','qaPreviewEvidence'].every(k=>meaningfulRef(compare[k])))
    fail('FIX15, frozen W1 and QA-preview comparable evidence all required');
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
       !/^[a-f0-9]{64}$/.test(decision.refrozenArtifactSha256||'') ||
       !['chromiumEvidence','webkitEvidence','revisedAllowlistEvidence'].every(k=>meaningfulRef(decision[k])))
      fail('Remediation needs a new candidate artifact, two-browser evidence and rebuilt release allowlist');
  }
  return d;
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
    if(t.status==='BLOCKED' && !t.block?.reason) fail(`BLOCKED missing reason: ${t.id}`);
  }
  for(const t of q.tasks) for(const d of t.dependsOn) if(!ids.has(d)||d===t.id) fail(`Invalid dependency ${t.id} -> ${d}`);
  const walking=new Set(),done=new Set();
  function visit(id){if(walking.has(id)) fail('Dependency cycle');if(done.has(id))return;walking.add(id);for(const d of taskOf(q,id).dependsOn)visit(d);walking.delete(id);done.add(id)}
  for(const t of q.tasks)visit(t.id);
  return q;
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
  if(id==='W1-MATH-COMPAT') { validateMathCompatibilityDisposition(disposition); t.disposition=disposition; }
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
export function recoverExpired(q,{id,at,note}={}){
  const [n,t]=prepare(q,id,at);
  if(t.status!=='ACTIVE'||!t.lease)fail('Task not active');
  if(iso(t.lease.expiresAt)>iso(at))fail('Active lease not expired');
  if(!note||note.trim().length<8)fail('Explicit recovery reason required');
  t.recoveryHistory=[...(t.recoveryHistory||[]),{at,lease:t.lease,reason:note.trim()}];
  t.lease=null;t.status='TODO';t.recoveryNote=note.trim();
  return record(n,'RECOVER_EXPIRED',id,at,note.trim());
}
