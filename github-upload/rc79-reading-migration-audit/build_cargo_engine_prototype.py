"""Add bounded two-trip allocation to the isolated matching engine prototype."""
from pathlib import Path
here=Path(__file__).resolve().parent
s=(here/'reading_engine.match.prototype.js').read_text(encoding='utf-8')
def replace(old,new):
 global s
 assert s.count(old)==1,(old[:100],s.count(old))
 s=s.replace(old,new)
needle="  for(const {q} of qs.values())if(q.type==='match'){"
helpers='''  function validCargoDraft(q,value,complete=false){
   return Array.isArray(value)&&value.length===q.options.length&&value.every(x=>x===1||x===2||!complete&&x===null);
  }
  function cargoCorrect(q,value){
   if(!validCargoDraft(q,value,true))return false;
   const spec=q.cargo;
   if(spec.requireBoth===true&&(!value.includes(1)||!value.includes(2)))return false;
   if(spec.firstRequired.some(i=>value[i]!==1)||spec.strictBefore.some(([a,b])=>value[a]>=value[b]))return false;
   return [1,2].every(trip=>spec.weights.reduce((sum,w,i)=>sum+(value[i]===trip?w:0),0)<=spec.capacity);
  }
  function validCargoQuestion(q){
   const n=q.options?.length,c=q.cargo;
   if(!Array.isArray(q.options)||!Number.isInteger(n)||n<1||n>12||q.options.some(x=>typeof x!=='string'||!x)||!c||!Array.isArray(c.weights)||c.weights.length!==n||c.weights.some(x=>!Number.isSafeInteger(x)||x<=0||x>100000)||!Number.isSafeInteger(c.capacity)||c.capacity<=0||c.capacity>1200000||!Array.isArray(c.firstRequired)||new Set(c.firstRequired).size!==c.firstRequired.length||c.firstRequired.some(i=>!Number.isInteger(i)||i<0||i>=n)||!Array.isArray(c.strictBefore)||c.strictBefore.some(p=>!Array.isArray(p)||p.length!==2||p.some(i=>!Number.isInteger(i)||i<0||i>=n)||p[0]===p[1])||!(c.requireBoth===undefined||typeof c.requireBoth==='boolean')||q.answer!=='cargo')return false;
   for(let mask=0;mask<2**n;mask++){const v=Array.from({length:n},(_,i)=>mask&(1<<i)?2:1);if(cargoCorrect(q,v))return true;}
   return false;
  }
  for(const {q} of qs.values())if(q.type==='cargo'&&!validCargoQuestion(q))throw Error('装载题配置无效或没有可行方案');
'''
replace(needle,helpers+needle)
replace("if(q.type==='match'){if(!validMatchDraft(q,value))return false;}","if(q.type==='cargo'){if(!validCargoDraft(q,value))return false;}else if(q.type==='match'){if(!validMatchDraft(q,value))return false;}")
replace("function validAnswer(q,value){if(q.type==='match')", "function validAnswer(q,value){if(q.type==='cargo')return validCargoDraft(q,value,true);if(q.type==='match')")
replace("let ok;if(c.question.type==='match')", "let ok;if(c.question.type==='cargo')ok=validCargoDraft(c.question,value);else if(c.question.type==='match')")
replace("correct=JSON.stringify(value)===JSON.stringify(q.answer),validity=", "correct=q.type==='cargo'?cargoCorrect(q,value):JSON.stringify(value)===JSON.stringify(q.answer),validity=")
(here/'reading_engine.cargo.prototype.js').write_text(s,encoding='utf-8')
print('Prepared isolated two-trip allocation engine; not deployed.')
