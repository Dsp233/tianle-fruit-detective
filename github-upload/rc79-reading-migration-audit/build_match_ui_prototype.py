"""Add a direct one-to-one matching board to the isolated scoped UI."""
from pathlib import Path
here=Path(__file__).resolve().parent
s=(here/'reading_ui.course_scope.prototype.js').read_text(encoding='utf-8')
def replace(old,new):
 global s
 assert s.count(old)==1,(old[:100],s.count(old))
 s=s.replace(old,new)
needle=" function quiz(c){const {material:m,question:q,session:s}=c"
board=''' function matchBoard(c,pick){const q=c.question,chosen=Array.isArray(pick)?pick:Array(q.matchLeft.length).fill(null);return `<div class="rd-match-board" role="group" aria-label="逐项配对">${q.matchLeft.map((left,li)=>`<div class="rd-match-row"><p>${rt(left)}</p><div class="rd-nav">${q.options.map((option,index)=>button('rdMatchPick',option,`data-left="${li}" data-index="${index}" aria-label="${E(left+'，选择'+option)}" aria-pressed="${chosen[li]===index}"`,chosen[li]===index?'rd-option rd-selected':'rd-option')).join('')}</div></div>`).join('')}</div>`;}
'''
replace(needle,board+needle)
replace("valid=q.type==='order'?Array.isArray(pick)&&pick.length===q.options.length:Number.isInteger(pick)",
        "valid=q.type==='match'?Array.isArray(pick)&&pick.length===q.matchLeft.length&&pick.every(Number.isInteger):q.type==='order'?Array.isArray(pick)&&pick.length===q.options.length:Number.isInteger(pick)")
start=s.index('<div class="rd-options">')
end=s.index("${q.type==='order'?`<p>",start)
old=s[start:end]
assert old.count('displayOrder.map')==1
new="${q.type==='match'?matchBoard(c,order):`"+old+"`}"
s=s[:start]+new+s[end:]
replace("if(action==='rdPick'){const c=e.current()", "if(action==='rdMatchPick'){const c=e.current(),li=Number(d.left),index=Number(d.index);if(ui.phase==='quiz'&&c?.question.type==='match'&&Number.isInteger(li)&&li>=0&&li<c.question.matchLeft.length&&Number.isInteger(index)&&index>=0&&index<c.question.options.length){const last=c.attempts.filter(a=>a.sessionId===c.session.id).at(-1),old=c.session.drafts[c.question.id]??last?.selected,draft=Array.isArray(old)?[...old]:Array(c.question.matchLeft.length).fill(null);if(draft[li]===index)draft[li]=null;else{const previous=draft.indexOf(index);if(previous>=0)draft[previous]=null;draft[li]=index;}e.select(draft);}render();return true;}\n  if(action==='rdPick'){const c=e.current()")
replace("Array.isArray(item.answer)?item.answer.map(i=>rt(item.options[i])).join(' → '):rt(item.options[item.answer])",
        "Array.isArray(item.answer)?item.type==='match'?item.answer.map((i,j)=>rt(item.matchLeft[j])+' → '+rt(item.options[i])).join('；'):item.answer.map(i=>rt(item.options[i])).join(' → '):rt(item.options[item.answer])")
(here/'reading_ui.match.prototype.js').write_text(s,encoding='utf-8')
print('Prepared isolated matching UI prototype; not deployed.')
