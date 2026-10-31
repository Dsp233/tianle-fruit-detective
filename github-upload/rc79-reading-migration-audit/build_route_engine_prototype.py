"""Add constructed routes to the isolated allocation/matching engine."""
from pathlib import Path
here=Path(__file__).resolve().parent
s=(here/'reading_engine.cargo.prototype.js').read_text(encoding='utf-8')
def replace(old,new):
 global s
 assert s.count(old)==1,(old[:120],s.count(old))
 s=s.replace(old,new)
needle="  function validCargoDraft(q,value,complete=false){"
helpers='''  function validRouteDraft(q,value,complete=false){
   return Array.isArray(value)&&value.length<=(q.route.maxStops||12)&&(!complete||value.length>=2)&&value.every(x=>Number.isInteger(x)&&x>=0&&x<q.options.length);
  }
  function validRouteQuestion(q){
   const r=q.route;
   if(!(Array.isArray(q.options)&&q.options.length>=2&&q.options.length<=30&&q.options.every(x=>typeof x==='string'&&x.length>0)&&new Set(q.options).size===q.options.length&&r&&Number.isInteger(r.maxStops)&&r.maxStops>=2&&r.maxStops<=30&&q.answer==='route'&&Array.isArray(r.acceptedRoutes)&&r.acceptedRoutes.length>0&&r.acceptedRoutes.length<=100&&r.acceptedRoutes.every(v=>validRouteDraft(q,v,true))&&new Set(r.acceptedRoutes.map(v=>JSON.stringify(v))).size===r.acceptedRoutes.length))return false;
   const g=r.graph;if(g===undefined)return true;
   if(!g||!Array.isArray(g.positions)||g.positions.length!==q.options.length||new Set(g.positions.map(p=>JSON.stringify(p))).size!==g.positions.length||g.positions.some(p=>!Array.isArray(p)||p.length!==2||!Number.isFinite(p[0])||!Number.isFinite(p[1])||p[0]<20||p[0]>580||p[1]<20||p[1]>240)||!Array.isArray(g.edges)||g.edges.length>100||g.edges.some(e=>!e||!Number.isInteger(e.from)||!Number.isInteger(e.to)||e.from<0||e.to<0||e.from>=q.options.length||e.to>=q.options.length||e.from===e.to||!['open','closed','notYet'].includes(e.state))||new Set(g.edges.map(e=>e.from+':'+e.to)).size!==g.edges.length)return false;
   return r.acceptedRoutes.every(v=>v.slice(1).every((to,i)=>g.edges.some(e=>e.from===v[i]&&e.to===to&&e.state==='open')));
  }
  function routeCorrect(q,value){return validRouteDraft(q,value,true)&&q.route.acceptedRoutes.some(route=>JSON.stringify(route)===JSON.stringify(value));}
  for(const {q} of qs.values())if(q.type==='route'&&!validRouteQuestion(q))throw Error('路线题配置无效');
'''
replace(needle,helpers+needle)
replace("if(q.type==='cargo'){if(!validCargoDraft(q,value))return false;}","if(q.type==='route'){if(!validRouteDraft(q,value))return false;}else if(q.type==='cargo'){if(!validCargoDraft(q,value))return false;}")
replace("function validAnswer(q,value){if(q.type==='cargo')", "function validAnswer(q,value){if(q.type==='route')return validRouteDraft(q,value,true);if(q.type==='cargo')")
replace("let ok;if(c.question.type==='cargo')", "let ok;if(c.question.type==='route')ok=validRouteDraft(c.question,value);else if(c.question.type==='cargo')")
replace("correct=q.type==='cargo'?cargoCorrect(q,value):JSON.stringify(value)===JSON.stringify(q.answer),validity=", "correct=q.type==='route'?routeCorrect(q,value):q.type==='cargo'?cargoCorrect(q,value):JSON.stringify(value)===JSON.stringify(q.answer),validity=")
(here/'reading_engine.route.prototype.js').write_text(s,encoding='utf-8')
print('Prepared isolated constructed-route engine; not deployed.')
