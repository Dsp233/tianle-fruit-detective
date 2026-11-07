#!/usr/bin/env python3
"""Create an isolated candidate from the exact FIX15 app; never modify production."""
import hashlib, pathlib, sys

src, dst = map(pathlib.Path, sys.argv[1:3])
text = src.read_text(encoding='utf-8')
expected = 'c1d72fe395197a75b779d0fd197f653c233de19a26e45fda1f54ebf3e665dbd5'
if hashlib.sha256(src.read_bytes()).hexdigest() != expected:
    raise SystemExit('FIX15 app hash mismatch; refusing to patch')

def replace_once(old, new):
    global text
    if text.count(old) != 1:
        raise SystemExit(f'FIX15 patch anchor matched {text.count(old)} times: {old!r}')
    text = text.replace(old, new, 1)

replace_once("const progressAdapter={test:window.__AMC8_STORAGE_TEST===true,onStatus:state=>{storedRaw=state.raw;",
'''// Only clear a pending marker after the exact corresponding record has been
// confirmed in committed storage. A changed in-memory record remains pending.
function confirmPersistedJoint(raw){
 try{
  const disk=JSON.parse(raw);
  const same=(a,b)=>{if(!a||!b||!a.id||a.id!==b.id)return false;const clean=x=>{const y=JSON.parse(JSON.stringify(x));delete y.pendingSave;return JSON.stringify(y)};return clean(a)===clean(b)};
  for(const a of saved.attempts||[])if(a.pendingSave&&(disk.attempts||[]).some(b=>same(a,b)))delete a.pendingSave;
  for(const [key,group] of Object.entries(saved.jointProgress||{}))for(const a of group.records||[])if(a.pendingSave&&(disk.jointProgress?.[key]?.records||[]).some(b=>same(a,b)))delete a.pendingSave;
 }catch(_){/* A malformed or unmatched snapshot never clears a pending marker. */}
}
const progressAdapter={transactional:true,guardWebLock:true,test:window.__AMC8_STORAGE_TEST===true,onStatus:state=>{storedRaw=state.raw;if(state.status==='ready'&&state.raw!==null)confirmPersistedJoint(state.raw);''')
replace_once("else if(state.status==='unsaved')storageMessage=", "else if(state.status==='acquiring')storageMessage='正在准备或保存记录，请稍候。';else if(state.status==='unsaved')storageMessage=")
replace_once('progressStore.commit(snapshot,storedRaw)', 'progressStore.commit(snapshot,progressStore.exportSnapshot().stored)')
replace_once("const action=btn.dataset.action;if(action==='storageRetry')", "const action=btn.dataset.action;if(!confirmMathNavigation(action))return;if(action==='storageRetry')")
replace_once("if(window.addEventListener){window.addEventListener('beforeunload',()=>progressStore.close())", """// The current task draft can be changed without starting a storage write.
// Warn before leaving even when the store itself reports ready. This is only
// an opportunity to export; a browser or device kill cannot be intercepted.
function hasUnsubmittedMathDraft(){
 try{
  if(!taskNow()||feedback?.ok)return false;
  const comparable=x=>{const y={...x};delete y.startedAt;return JSON.stringify(y)};
  if(comparable(draft)!==comparable(freshDraft()))return true;
  if(view==='joint'){
   const raw=progressStore.exportSnapshot().stored;
   const committed=raw===null?{}:JSON.parse(raw);
   if(JSON.stringify(saved.jointProgress||{})!==JSON.stringify(committed.jointProgress||{}))return true;
  }
  return false;
 }catch(_){return true;}
}
// Guard the actual click before a previous/jump handler changes its cursor.
// Cancel keeps the task in memory and exposes the existing export control.
function confirmMathNavigation(action){
 const navigation=['hubHome','home','reading','knowledge','fruit','catalog','progress','sample','course','skillMap','joint','network','networkGraphNode','networkSkill','learn','demo','micro','workshop','fraction','percent','integer','ratio','rate','journey','scale','equation','constraint','pattern','coordinate','grouping','factor','common','cycle','measure','angle','composite','circle','similar','right','solid','combin','chart','stats','chance','motion','invariant','sets','stage','transfer','jump','review','previous','frontier','nextSolved','next','topicExit','topicPrevious','topicSkip'];
 if(!navigation.includes(action))return true;
 try{
  if(!taskNow())return true;
  if(progressStore.exportSnapshot().pending===null&&progressStore.getStatus()==='ready'){
   if(!hasUnsubmittedMathDraft())return true;
   if(typeof window.confirm==='function'&&window.confirm('本题有未提交或尚未确认保存的内容。离开可能丢失草稿。请先取消并导出记录；确定仍要离开吗？'))return true;
  }
 }catch(_){/* Fail closed and keep the current task. */}
 storageMessage='本题草稿或保存尚未确认。可先导出记录与草稿，再决定是否离开。';syncStorageStatus();return false;
}
if(window.addEventListener){window.addEventListener('beforeunload',event=>{if(progressStore.exportSnapshot().pending!==null||progressStore.getStatus()!=='ready'||hasUnsubmittedMathDraft()){event.preventDefault?.();event.returnValue='';return}progressStore.close()})""")
# Mark every submitted attempt pending before the asynchronous store commit;
# do not claim a normal math first answer as persisted while the write is queued.
# The snapshot strips pendingSave before storing; exact readback clears the
# in-memory marker only after the corresponding bytes have been committed.
replace_once("].filter(a=>a.jointFacts&&a.pendingSave===true)}", "].filter(a=>a.pendingSave===true)}")
replace_once(
    "const outcome=persist();if(task.joint&&!outcome.ok){attempt.pendingSave=true;for(const state of Object.values(saved.jointProgress))for(const record of state.records||[])if(record.id===attempt.id)record.pendingSave=true;}",
    "attempt.pendingSave=true;for(const state of Object.values(saved.jointProgress))for(const record of state.records||[])if(record.id===attempt.id)record.pendingSave=true;persist();"
)
replace_once(
    "pendingJointAttemptIds:[...new Set(jointPendingRecords().map(a=>a.id))],",
    "pendingJointAttemptIds:[...new Set(jointPendingRecords().filter(a=>a.jointFacts).map(a=>a.id))],pendingMathAttemptIds:[...new Set(jointPendingRecords().map(a=>a.id))],"
)


# G2-S4: checkpoint changed active mathematics input in the existing locked
# profile, replaying only the same task/version/signature on re-entry.
replace_once("function syncStorageStatus(){", """// Keep only active input, in the existing math profile. A draft is never
// a submitted attempt, and opening a different task does not erase it.
function mathDraftKey(task){
 const signature=task.joint?jointMathSignature(task):taskFingerprint(task);
 return JSON.stringify([view,task.id,taskVersion(task),signature]);
}
function checkpointMathDraft(){
 if(view==='reading'||feedback!==null||TASK_PLAYERS[view]?.readOnly||!canPersist)return;
 const task=taskNow();if(!task)return;
 const key=mathDraftKey(task),blank=freshDraft();
 const input={...draft};delete input.startedAt;delete blank.startedAt;
 const previous=saved.workingMathDrafts?.[key];
 if(JSON.stringify(input)===JSON.stringify(blank)){
  if(!previous)return;
  delete saved.workingMathDrafts[key];
 }else{
  if(previous&&JSON.stringify(previous)===JSON.stringify(draft))return;
  if(!saved.workingMathDrafts||typeof saved.workingMathDrafts!=='object'||Array.isArray(saved.workingMathDrafts))saved.workingMathDrafts={};
  saved.workingMathDrafts[key]=JSON.parse(JSON.stringify(draft));
 }
 persist();
}
function restoreCurrentMathDraft(){
 const task=taskNow();if(!task)return false;
 const checkpoint=saved.workingMathDrafts?.[mathDraftKey(task)];
 if(!checkpoint||typeof checkpoint!=='object'||Array.isArray(checkpoint))return false;
 const restored=freshDraft();
 for(const key of Object.keys(restored))if(Object.prototype.hasOwnProperty.call(checkpoint,key))restored[key]=JSON.parse(JSON.stringify(checkpoint[key]));
 draft=restored;return true;
}
function syncStorageStatus(){""")
replace_once("function render(){\n syncStorageStatus();", "function render(){\n checkpointMathDraft();\n syncStorageStatus();")
replace_once("rememberFormalOpen(taskNow());if(!topicOpening)render();", "restoreCurrentMathDraft();rememberFormalOpen(taskNow());if(!topicOpening)render();")
replace_once("attempt.pendingSave=true;for(const state of Object.values(saved.jointProgress))",
             "if(saved.workingMathDrafts)delete saved.workingMathDrafts[mathDraftKey(task)];attempt.pendingSave=true;for(const state of Object.values(saved.jointProgress))")
replace_once("draft.number=e.target.value;if(topicSessionMatches())persist()",
             "draft.number=e.target.value;checkpointMathDraft()")
replace_once("jointState().responses[field]=String(e.target.value).slice(0,40);feedback=null;if(topicSessionMatches())persist();return;",
             "jointState().responses[field]=String(e.target.value).slice(0,40);feedback=null;persist();return;")

dst.write_text(text,encoding='utf-8')
print(hashlib.sha256(dst.read_bytes()).hexdigest())
