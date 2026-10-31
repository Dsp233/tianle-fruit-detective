"""Add an uncalculated time slider to the isolated interaction UI."""
from pathlib import Path
here=Path(__file__).resolve().parent
s=(here/'reading_ui.route.prototype.js').read_text(encoding='utf-8')
def replace(old,new):
 global s
 assert s.count(old)==1,(old[:120],s.count(old))
 s=s.replace(old,new)
needle=" function quiz(c){const {material:m,question:q,session:s}=c"
board=''' function timeLabel(value){return Math.floor(value/60)+':'+String(value%60).padStart(2,'0');}
 function departureBoard(c,pick,last){const q=c.question,t=q.departure,chosen=Number.isInteger(pick),previous=Number.isInteger(last?.selected),value=chosen?pick:previous?last.selected:t.initial;return `<div class="rd-departure-board" role="group" aria-label="选择出发时间"><p>${rt('拖动时间轴，或用按钮调整。')}</p><p><output id="rd-departure-value" aria-live="polite">${chosen?E(timeLabel(value)):previous?rt('上次选择')+' '+E(timeLabel(value)):rt('先调整时间，指针现在在')+' '+E(timeLabel(value))}</output></p><input type="range" min="${t.min}" max="${t.max}" step="${t.step}" value="${value}" data-reading-field="departure" aria-label="选择出发时间" aria-valuetext="${E(timeLabel(value))}"><div class="rd-departure-endpoints" aria-hidden="true"><span>${E(timeLabel(t.min))}</span><span>${E(timeLabel(t.max))}</span></div><div class="rd-nav">${button('rdDepartureStep','提前 '+t.step+' 分钟','data-delta="-1"')}${button('rdDepartureStep','推后 '+t.step+' 分钟','data-delta="1"')}</div></div>`;}
'''
replace(needle,board+needle)
replace("valid=q.type==='route'?", "valid=q.type==='departure'?Number.isInteger(pick):q.type==='route'?")
replace("${q.type==='route'?routeBoard(c,order):", "${q.type==='departure'?departureBoard(c,pick,last):q.type==='route'?routeBoard(c,order):")
replace("if(['rdRoutePick','rdRouteUndo','rdRouteClear'].includes(action)){", "if(action==='rdDepartureStep'){const c=e.current(),delta=Number(d.delta);if(ui.phase==='quiz'&&c?.question.type==='departure'&&(delta===-1||delta===1)){const t=c.question.departure,last=c.attempts.filter(a=>a.sessionId===c.session.id).at(-1),old=c.session.drafts[c.question.id]??last?.selected??t.initial;e.select(Math.max(t.min,Math.min(t.max,old+delta*t.step)));}render();return true;}\n  if(['rdRoutePick','rdRouteUndo','rdRouteClear'].includes(action)){")
replace("item.type==='route'?rt('符合题目中各项条件的路线'):", "item.type==='departure'?E(timeLabel(item.answer)):item.type==='route'?rt('符合题目中各项条件的路线'):")
replace("function input(target){if(target?.dataset?.readingField==='rangeStart'", "function input(target){if(target?.dataset?.readingField==='departure'){const e=ensure(),c=e.current(),value=Number(target.value);if(ui.phase==='quiz'&&c?.question.type==='departure'&&e.select(value)){const label=document.getElementById('rd-departure-value');if(label)label.textContent=timeLabel(value);target.setAttribute('aria-valuetext',timeLabel(value));const submit=document.querySelector('[data-action=\\\"rdSubmit\\\"]');if(submit)submit.disabled=false;}return true;}if(target?.dataset?.readingField==='rangeStart'")
(here/'reading_ui.departure.prototype.js').write_text(s,encoding='utf-8')
print('Prepared isolated departure-time UI; not deployed.')
