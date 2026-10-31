"""Add a bounded minute selection to the isolated route/allocation engine."""
from pathlib import Path
here=Path(__file__).resolve().parent
s=(here/'reading_engine.route.prototype.js').read_text(encoding='utf-8')
def replace(old,new):
 global s
 assert s.count(old)==1,(old[:120],s.count(old))
 s=s.replace(old,new)
needle="  function validRouteDraft(q,value,complete=false){"
helpers='''  function validDepartureAnswer(q,value){const t=q.departure;return Number.isInteger(value)&&value>=t.min&&value<=t.max&&(value-t.min)%t.step===0;}
  function validDepartureQuestion(q){const t=q.departure;return Array.isArray(q.options)&&q.options.length>0&&q.options.every(x=>typeof x==='string'&&x.length>0)&&t&&Number.isInteger(t.min)&&Number.isInteger(t.max)&&Number.isInteger(t.step)&&Number.isInteger(t.initial)&&t.min>=0&&t.max<=1439&&t.min<t.max&&t.step>0&&t.step<=60&&(t.max-t.min)%t.step===0&&validDepartureAnswer(q,t.initial)&&validDepartureAnswer(q,q.answer);}
  for(const {q} of qs.values())if(q.type==='departure'&&!validDepartureQuestion(q))throw Error('出发时间题配置无效');
'''
replace(needle,helpers+needle)
replace("function validAnswer(q,value){if(q.type==='route')", "function validAnswer(q,value){if(q.type==='departure')return validDepartureAnswer(q,value);if(q.type==='route')")
(here/'reading_engine.departure.prototype.js').write_text(s,encoding='utf-8')
print('Prepared isolated departure-time engine; not deployed.')
