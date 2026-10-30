"""Add a one-to-one matching question to the isolated scoped engine prototype."""
from pathlib import Path
here=Path(__file__).resolve().parent
s=(here/'reading_engine.course_scope.prototype.js').read_text(encoding='utf-8')
def replace(old,new):
 global s
 assert s.count(old)==1,(old[:100],s.count(old))
 s=s.replace(old,new)
needle='  const bank=new Map(materials.map(m=>[m.id,m])),qs=new Map(materials.flatMap(m=>m.questions.map(q=>[q.id,{q,m}])));'
replace(needle,needle+'''
  // A new-ID matching item records each destination separately; partial drafts
  // are allowed, but duplicates and incomplete submissions never count.
  function validMatchDraft(q,value,complete=false){
   if(!Array.isArray(value)||value.length!==q.matchLeft.length)return false;
   const filled=value.filter(x=>x!==null);
   return (!complete||filled.length===value.length)&&new Set(filled).size===filled.length&&filled.every(x=>Number.isInteger(x)&&x>=0&&x<q.options.length);
  }
  for(const {q} of qs.values())if(q.type==='match'){
   if(!Array.isArray(q.matchLeft)||q.matchLeft.length<2||q.matchLeft.length>12||q.matchLeft.some(x=>typeof x!=='string'||!x)||!Array.isArray(q.options)||q.options.length!==q.matchLeft.length||q.options.some(x=>typeof x!=='string'||!x)||!validMatchDraft(q,q.answer,true))throw Error('对应题配置无效');
  }
''')
replace("if(q.type==='order'){if(!Array.isArray(value)||value.length>q.options.length||new Set(value).size!==value.length||value.some(i=>!Number.isInteger(i)||i<0||i>=q.options.length))return false;}else if(!validAnswer(q,value))return false;",
        "if(q.type==='match'){if(!validMatchDraft(q,value))return false;}else if(q.type==='order'){if(!Array.isArray(value)||value.length>q.options.length||new Set(value).size!==value.length||value.some(i=>!Number.isInteger(i)||i<0||i>=q.options.length))return false;}else if(!validAnswer(q,value))return false;")
replace("function validAnswer(q,value){if(q.type==='order')", "function validAnswer(q,value){if(q.type==='match')return validMatchDraft(q,value,true);if(q.type==='order')")
replace("let ok;if(c.question.type==='order')", "let ok;if(c.question.type==='match')ok=validMatchDraft(c.question,value);else if(c.question.type==='order')")
(here/'reading_engine.match.prototype.js').write_text(s,encoding='utf-8')
print('Prepared isolated matching-engine prototype; not deployed.')
