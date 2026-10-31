"""Add a direct two-trip allocation board to the isolated matching UI."""
from pathlib import Path
here=Path(__file__).resolve().parent
s=(here/'reading_ui.match.prototype.js').read_text(encoding='utf-8')
def replace(old,new):
 global s
 assert s.count(old)==1,(old[:120],s.count(old))
 s=s.replace(old,new)
needle=" function quiz(c){const {material:m,question:q,session:s}=c"
board=''' function cargoBoard(c,pick){const q=c.question,chosen=Array.isArray(pick)?pick:Array(q.options.length).fill(null);return `<div class="rd-cargo-board" role="group" aria-label="安排两趟运输">${q.options.map((item,i)=>`<div class="rd-cargo-row"><p>${rt(item)} ${button('rdSpeakOption','听',`data-index="${i}" aria-label="${E('朗读'+item)}"`,'rd-option-speak')}</p><div class="rd-nav">${[1,2].map(trip=>button('rdCargoPick',trip===1?'第一趟':'第二趟',`data-item="${i}" data-trip="${trip}" aria-label="${E(item+'，'+(trip===1?'第一趟':'第二趟'))}" aria-pressed="${chosen[i]===trip}"`,chosen[i]===trip?'rd-option rd-selected':'rd-option')).join('')}</div></div>`).join('')}</div>`;}
'''
replace(needle,board+needle)
replace("valid=q.type==='match'?", "valid=q.type==='cargo'?Array.isArray(pick)&&pick.length===q.options.length&&pick.every(x=>x===1||x===2):q.type==='match'?")
replace("${q.type==='match'?matchBoard(c,order):`", "${q.type==='cargo'?cargoBoard(c,order):q.type==='match'?matchBoard(c,order):`")
replace("if(action==='rdMatchPick'){const c=e.current()", "if(action==='rdCargoPick'){const c=e.current(),i=Number(d.item),trip=Number(d.trip);if(ui.phase==='quiz'&&c?.question.type==='cargo'&&Number.isInteger(i)&&i>=0&&i<c.question.options.length&&(trip===1||trip===2)){const last=c.attempts.filter(a=>a.sessionId===c.session.id).at(-1),old=c.session.drafts[c.question.id]??last?.selected,draft=Array.isArray(old)?[...old]:Array(c.question.options.length).fill(null);draft[i]=draft[i]===trip?null:trip;e.select(draft);}render();return true;}\n  if(action==='rdMatchPick'){const c=e.current()")
replace("const selected=Array.isArray(last.selected)?last.selected.map(i=>q.options[i]).filter(Boolean).join('、'):q.options[last.selected];",
        "const selected=q.type==='cargo'?'':Array.isArray(last.selected)?last.selected.map(i=>q.options[i]).filter(Boolean).join('、'):q.options[last.selected];")
replace("Array.isArray(item.answer)?item.type==='match'?", "item.type==='cargo'?rt('符合题目中各项条件的安排'):Array.isArray(item.answer)?item.type==='match'?")
(here/'reading_ui.cargo.prototype.js').write_text(s,encoding='utf-8')
print('Prepared isolated two-trip allocation UI; not deployed.')
