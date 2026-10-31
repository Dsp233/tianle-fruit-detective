"""Keep exposure and passage-level aids when a passage has new question IDs."""
from pathlib import Path
here=Path(__file__).resolve().parent
s=(here/'reading_engine.departure.prototype.js').read_text(encoding='utf-8')
def replace(old,new):
 global s
 assert s.count(old)==1,(old[:120],s.count(old))
 s=s.replace(old,new)
needle="   if(new Set(diagnostics.map(d=>d.id)).size!==diagnostics.length||diagnostics.some(d=>typeof d.courseId!=='string'||!d.courseId||!Array.isArray(d.forms)||d.forms.some(f=>!Array.isArray(f.materials)||f.materials.some(m=>m.courseId!==d.courseId))))throw Error('诊断材料版本不一致');"
replace(needle,needle+'''
   const passageGroups=new Map();
   for(const m of materials)if(m.exposureGroup!==undefined){
    if(typeof m.exposureGroup!=='string'||!m.exposureGroup||m.exposureGroup.length>200||typeof m.text!=='string')throw Error('共享原文标识无效');
    const id=JSON.stringify([m.courseId,m.exposureGroup]),previous=passageGroups.get(id);
    if(previous!==undefined&&previous!==m.text)throw Error('同一共享原文标识对应不同正文');
    passageGroups.set(id,m.text);
   }
''')
replace("  function exposure(materialId){return state.events.some(e=>e.materialId===materialId&&['material_open','attempt','answer_revealed','legacy_exposure'].includes(e.type));}",
'''  // Course progress remains separate, but the same exact passage is not
  // unseen merely because a question or course acquired a new identifier.
  function samePassage(a,b){if(a===b)return true;const one=bank.get(a),other=bank.get(b);return !!(courseScope&&one&&other&&typeof one.text==='string'&&one.text.length>0&&one.text===other.text);}
  function exposure(materialId){return state.events.some(e=>samePassage(materialId,e.materialId)&&['material_open','attempt','answer_revealed','legacy_exposure'].includes(e.type));}''')
replace("  function aidState(materialId,sessionId=null){const relevant=state.events.filter(e=>e.materialId===materialId&&(!sessionId||e.sessionId===sessionId));let level=0,pinyin=false,voice=false,parent=false,revealed=false,hint=false;",
'''  function sharedPassageAid(e){
   if(e.type==='material_open')return true;
   if(e.type==='aid_requested')return ['pinyin','parent','story','sentence','word','character'].includes(e.kind)||e.kind==='repeat'&&['story','sentence','word','character'].includes(e.originKind);
   return e.type==='speech_status'&&['story','sentence','word','character'].includes(e.originKind||e.kind);
  }
  function aidState(materialId,sessionId=null){const relevant=state.events.filter(e=>e.materialId===materialId&&(!sessionId||e.sessionId===sessionId)||!sessionId&&e.materialId!==materialId&&samePassage(materialId,e.materialId)&&sharedPassageAid(e));let level=0,pinyin=false,voice=false,parent=false,revealed=false,hint=false;''')
(here/'reading_engine.shared_passage.prototype.js').write_text(s,encoding='utf-8')
print('Prepared isolated shared-passage exposure prototype; not deployed.')
