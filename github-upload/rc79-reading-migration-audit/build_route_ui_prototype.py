"""Add a constructed-route board to the isolated interaction UI."""
from pathlib import Path
here=Path(__file__).resolve().parent
s=(here/'reading_ui.cargo.prototype.js').read_text(encoding='utf-8')
def replace(old,new):
 global s
 assert s.count(old)==1,(old[:120],s.count(old))
 s=s.replace(old,new)
needle=" function quiz(c){const {material:m,question:q,session:s}=c"
board=''' function routeMap(q){const g=q.route.graph;if(!g)return '';const state={open:'开放',closed:'关闭',notYet:'尚未开放'},description=g.edges.map(e=>q.options[e.from]+'到'+q.options[e.to]+'，'+state[e.state]).join('；');return `<svg class="rd-route-map" viewBox="0 0 600 260" role="img" aria-label="${E('路线图：'+description)}"><defs><marker id="rd-route-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="#315a55"></path></marker></defs>${g.edges.map(e=>{const a=g.positions[e.from],b=g.positions[e.to],x=(a[0]+b[0])/2,y=(a[1]+b[1])/2,dx=b[0]-a[0],dy=b[1]-a[1],length=Math.hypot(dx,dy),x1=a[0]+dx/length*20,y1=a[1]+dy/length*20,x2=b[0]-dx/length*22,y2=b[1]-dy/length*22;return `<g><line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" class="${e.state==='open'?'rd-route-open':'rd-route-blocked'}" marker-end="url(#rd-route-arrow)"></line>${e.state==='open'?'':`<text x="${x}" y="${y-8}" text-anchor="middle" class="rd-route-note">${state[e.state]}</text>`}</g>`;}).join('')}${g.positions.map((p,i)=>`<g><circle cx="${p[0]}" cy="${p[1]}" r="19"></circle><text x="${p[0]}" y="${p[1]+6}" text-anchor="middle" class="rd-route-label">${E(q.options[i])}</text></g>`).join('')}</svg>`;}
 function routeBoard(c,pick){const q=c.question,chosen=Array.isArray(pick)?pick:[];return `<div class="rd-route-board" role="group" aria-label="规划路线">${routeMap(q)}<p aria-live="polite">${rt('我的路线')}：${chosen.length?chosen.map(i=>rt(q.options[i])).join(' → '):rt('还没有选择地点')}</p><div class="rd-nav rd-route-places">${q.options.map((place,i)=>button('rdRoutePick',place,`data-index="${i}" aria-label="${E('加入地点 '+place)}"`,'rd-option')).join('')}</div><div class="rd-nav">${button('rdRouteUndo','撤回上一个地点',chosen.length?'':'disabled')}${button('rdRouteClear','清空路线',chosen.length?'':'disabled')}</div></div>`;}
'''
replace(needle,board+needle)
replace("valid=q.type==='cargo'?", "valid=q.type==='route'?Array.isArray(pick)&&pick.length>=2:q.type==='cargo'?")
replace("${q.type==='cargo'?cargoBoard(c,order):", "${q.type==='route'?routeBoard(c,order):q.type==='cargo'?cargoBoard(c,order):")
replace("if(action==='rdCargoPick'){const c=e.current()", "if(['rdRoutePick','rdRouteUndo','rdRouteClear'].includes(action)){const c=e.current();if(ui.phase==='quiz'&&c?.question.type==='route'){const last=c.attempts.filter(a=>a.sessionId===c.session.id).at(-1),old=c.session.drafts[c.question.id]??last?.selected,draft=Array.isArray(old)?[...old]:[];if(action==='rdRoutePick'){const i=Number(d.index);if(Number.isInteger(i)&&i>=0&&i<c.question.options.length&&draft.length<c.question.route.maxStops)draft.push(i);}else if(action==='rdRouteUndo')draft.pop();else draft.length=0;e.select(draft);}render();return true;}\n  if(action==='rdCargoPick'){const c=e.current()")
replace("item.type==='cargo'?rt('符合题目中各项条件的安排'):", "item.type==='route'?rt('符合题目中各项条件的路线'):item.type==='cargo'?rt('符合题目中各项条件的安排'):")
(here/'reading_ui.route.prototype.js').write_text(s,encoding='utf-8')
print('Prepared isolated constructed-route UI; not deployed.')
