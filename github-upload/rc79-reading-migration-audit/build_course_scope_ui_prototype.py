"""Build an isolated UI prototype from the unchanged production reading UI."""
import hashlib
import sys
from pathlib import Path

here = Path(__file__).resolve().parent
source = Path(sys.argv[1]) if len(sys.argv) > 1 else here.parent / 'fix15-build/source/reading_ui.js'
target = here / 'reading_ui.course_scope.prototype.js'
assert hashlib.sha256(source.read_bytes()).hexdigest() == 'b22a6df0548a0dff946f45c12fd1947b7903e5d1ba88266faeec7c53a1d7f42d', 'Unexpected baseline UI'
s = source.read_text(encoding='utf-8')

def replace(old, new):
    global s
    assert s.count(old) == 1, (old[:120], s.count(old))
    s = s.replace(old, new)

needle = " let engine=null,speech=null,heartbeat=null,phrases=null,paintState=null,orderDrag=null;"
replace(needle, needle + '''
 // Scope is opt-in: legacy releases retain their existing set IDs and layout.
 function activeSets(data){const sets=data.diagnostics?.sets||[],scope=data.courseScope;return scope?sets.filter(x=>x.courseId===scope.activeCourseId):sets;}
 function selectedSet(e){const sets=activeSets(e.data);let set=sets.find(x=>x.id===ui.dxSet);if(!set){set=sets.find(x=>x.week===0)||sets[0]||null;ui.dxSet=set?.id||'';ui.knowledgeConfirmed=false;}return set;}
 function weekDiagnostic(data,week){const id='W'+String(week).padStart(2,'0'),sets=activeSets(data),matches=data.courseScope?sets.filter(x=>x.week===week):sets.filter(x=>x.id===id);if(matches.length!==1)return '<p>本阶段诊断尚未配置或需要核对。</p>';return button('rdOpenDiagnostic',week===12?'请家长安排终测':'请家长安排阶段诊断',`data-set="${E(matches[0].id)}"`);}
 function historicalMaterial(e,m){return !!e.data.courseScope&&!!m&&m.courseId!==e.data.courseScope.activeCourseId;}
 function findMaterial(data,id){return data.materials.find(m=>m.id===id)||(data.diagnostics?.sets||[]).flatMap(s=>s.forms.flatMap(f=>f.materials)).find(m=>m.id===id);}
''')
replace("${[4,8,12].includes(w.week)?button('rdOpenDiagnostic',w.week===12?'请家长安排终测':'请家长安排阶段诊断','data-set=\"W'+String(w.week).padStart(2,'0')+'\"'):\"\"}",
        "${[4,8,12].includes(w.week)?weekDiagnostic(e.data,w.week):''}")
replace("known=[...new Set(e.data.materials.flatMap(m=>m.prerequisites||[]))],set=e.data.diagnostics?.sets.find(x=>x.id===ui.dxSet)",
        "known=[...new Set(e.data.materials.filter(m=>!e.data.courseScope||m.courseId===e.data.courseScope.activeCourseId).flatMap(m=>m.prerequisites||[]))],set=selectedSet(e)")
replace("${(e.data.diagnostics?.sets||[]).map(x=>`<button class=\"rd-button\" data-action=\"rdDxSet\" data-set=\"${x.id}\"",
        "${activeSets(e.data).map(x=>`<button class=\"rd-button\" data-action=\"rdDxSet\" data-set=\"${E(x.id)}\"")
replace("<p>本组先修：${E((set?.blueprint.mathKnowledge||[]).join('、'))}</p><button class=\"rd-button\" data-action=\"rdKnowledgeConfirm\" aria-pressed=\"${ui.knowledgeConfirmed}\">",
        "<p>${set?'本组先修：'+E((set.blueprint?.mathKnowledge||[]).join('、')):'当前课程还没有可用诊断。'}</p><button class=\"rd-button\" data-action=\"rdKnowledgeConfirm\" ${set?'':'disabled'} aria-pressed=\"${ui.knowledgeConfirmed}\">")
replace("data-action=\"rdDiagnostic\" ${ui.knowledgeConfirmed?'':'disabled'}", "data-action=\"rdDiagnostic\" ${set&&ui.knowledgeConfirmed?'':'disabled'}")
replace("<section class=\"rd-parent-card\"><h2>家长设置</h2>",
        "${r.historical?`<section class=\"rd-parent-card\" data-course-history><h2>历史课程单独保留</h2><p>历史或待核实的完成天数：${r.historical.completedDays}；可关联旧材料的历史首答：${percent(r.historical.first)}。</p><p>上面的完成天数、首答和下面的诊断只统计当前课程。历史草稿和原始作答继续保留。</p></section>`:''}<section class=\"rd-parent-card\"><h2>家长设置</h2>")
replace("header('家长阅读看板','首答、求助、重试与最后结果分别保存。')", "header('家长阅读看板',e.data.courseScope?'当前课程的首答、求助、重试与最后结果分别保存。':'首答、求助、重试与最后结果分别保存。')")
replace("if(action==='rdOpenDiagnostic'){const set=e.data.diagnostics?.sets.find(x=>x.id===d.set);", "if(action==='rdOpenDiagnostic'){const set=activeSets(e.data).find(x=>x.id===d.set);")
replace("if(action==='rdDxSet'&&ui.parent){ui.dxSet=d.set;ui.knowledgeConfirmed=false;render();return true;}",
        "if(action==='rdDxSet'&&ui.parent){if(activeSets(e.data).some(x=>x.id===d.set)){ui.dxSet=d.set;ui.knowledgeConfirmed=false;}render();return true;}")
replace("if(action==='rdKnowledgeConfirm'&&ui.parent){ui.knowledgeConfirmed=!ui.knowledgeConfirmed;render();return true;}",
        "if(action==='rdKnowledgeConfirm'&&ui.parent){if(selectedSet(e))ui.knowledgeConfirmed=!ui.knowledgeConfirmed;render();return true;}")
replace("if(action==='rdDiagnostic'&&ui.parent){const result=e.startDiagnostic(ui.dxSet,ui.knowledgeConfirmed);",
        "if(action==='rdDiagnostic'&&ui.parent){const set=selectedSet(e),result=set?e.startDiagnostic(set.id,ui.knowledgeConfirmed):{ok:false,reason:'当前课程还没有可用诊断。'};")
replace("${reviewNotice}${s.restoredFromBackup?", "${historicalMaterial(engine,m)?`<p class=\"rd-condition\" data-historical-session>${rt('这是历史课程草稿，继续后记录仍归入历史课程。')}</p>`:''}${reviewNotice}${s.restoredFromBackup?")
replace("pending.map(s=>button('rdResume',s.title,`data-session=\"${E(s.id)}\"`))", "pending.map(s=>button('rdResume',(historicalMaterial(engine,findMaterial(engine.data,s.materialId))?'历史课程 · ':'')+s.title,`data-session=\"${E(s.id)}\"`))")
replace("e.current()?button('rdResume','继续上次的阅读'):''", "e.current()?button('rdResume',historicalMaterial(e,e.current().material)?'继续历史课程':'继续上次的阅读'):''")
target.write_text(s, encoding='utf-8')
print('Prepared isolated scoped UI prototype; not deployed.')
