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
        raise SystemExit('FIX15 patch anchor missing or ambiguous')
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
if(window.addEventListener){window.addEventListener('beforeunload',event=>{if(progressStore.exportSnapshot().pending!==null||progressStore.getStatus()!=='ready'||hasUnsubmittedMathDraft()){event.preventDefault?.();event.returnValue='';return}progressStore.close()})""")
dst.write_text(text,encoding='utf-8')
print(hashlib.sha256(dst.read_bytes()).hexdigest())
