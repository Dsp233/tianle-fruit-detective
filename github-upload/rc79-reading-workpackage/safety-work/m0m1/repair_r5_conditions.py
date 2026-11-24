"""R5 condition fixes, applied after the frozen M1 patch."""
import hashlib
import json
from pathlib import Path

def replace(s,old,new):
    assert s.count(old)==1, (old[:160],s.count(old))
    return s.replace(old,new,1)

def repair(root):
    root=Path(root)
    names=['joint_extended.js','joint_ui.js','composite_ui.js','invariant_ui.js']
    expected={'joint_ui.js':'8025670a0b24c5032241853ea051b9cbfe15de49c83d44d79a84347272db9b51','composite_ui.js':'df5ce8b112b1ddf843526140198ba0e251a61b8afa89935ce254c5b4f4d258b8','invariant_ui.js':'8b8b2d7029a6a6145f11384d41bf11c47a5ceea5a54d47dfc68df17200b8e469','joint_extended.js':'b02c916015e4d3fb70f75f23d54b18049c1d0048c5e650236236640dd75fa56e'}
    assert {n:hashlib.sha256((root/n).read_bytes()).hexdigest() for n in names}==expected
    def edit(name,pairs):
        path=root/name
        s=path.read_text()
        for a,b in pairs:s=replace(s,a.replace('@{','$'+'{'),b.replace('@{','$'+'{'))
        path.write_text(s)
    edit('joint_extended.js',[
        (" const s=t.skillId,p=t.joint.params;\n if(s==='A03.03'", """ const s=t.skillId,p=t.joint.params;
 if(['J-G03-02','J-G03-04'].includes(t.joint.familyId)&&t.kind==='cut')return '剪去标有“剪”的原格，指定坐标：'+t.remove.map(([r,c])=>'('+(c+1)+','+(r+1)+')').join('、')+'（先列后行，左上为(1,1)）。每个单位格边长1厘米。';
 if(t.joint.familyId==='J-G03-03'&&t.kind==='move')return '将橙块移到虚线标出的目标格：'+compositePuzzles(t).map(p=>p.piece.map(([r,c])=>'('+(c+p.destination[1]+1)+','+(r+p.destination[0]+1)+')').join('、')).join('；')+'（先列后行）。每个单位格边长1厘米。';
 if(s==='A03.03'"""),
        ("if(s==='G05.01'){const labels=similarLabels(t,'target');return ", "if(s==='G05.01'){const labels=similarLabels(t,'target'),source=similarLabels(t,'source');return '原图指定边'+source[t.edgeIndex]+source[(t.edgeIndex+1)%source.length]+'，指定角'+source[t.angleIndex]+'。'+"),
        ("if(s==='S02.05')return '目标可达时", "if(s==='S02.05')return '至少完成'+t.minOps+'次合法操作，填全实际状态计数表。目标可达时"),
    ])
    edit('composite_ui.js',[
        ("target=new Set((p.target||[]).map(v=>v.join(',')));return", "target=new Set((p.target||[]).map(v=>v.join(','))),required=new Set((task.joint?.familyId==='J-G03-03'&&p.destination?p.piece.map(([r,c])=>[r+p.destination[0],c+p.destination[1]]):['J-G03-02','J-G03-04'].includes(task.joint?.familyId)&&task.kind==='cut'?task.remove:[]).map(v=>v.join(',')));return"),
        ("tokens=[...fixed,...piece].map(v=>v.id).join(' ');return", """tokens=[...fixed,...piece].map(v=>v.id).join(' '),marked=required.has(key),markAttrs=marked?' data-r5-required="'+(task.kind==='cut'?'cut':'move')+'" style="outline:2px dashed #a14f10;outline-offset:-3px"':'',markLabel=marked?(task.kind==='cut'?'，指定剪去格':'，橙块目标格'):'';return"""),
        ("""<span class="composite-cell @{style}" data-material-ids="@{tokens}" aria-label="(@{c+1},@{r+1}) @{label}">@{fixed.length&&piece.length?'重叠':fixed.length||piece.length?'■':''}</span>""", """<span class="composite-cell @{style}"@{markAttrs} data-material-ids="@{tokens}" aria-label="(@{c+1},@{r+1}) @{label}@{markLabel}">@{fixed.length&&piece.length?'重叠':fixed.length||piece.length?'■':marked?'目标':''}</span>"""),
        ("""<button class="composite-cell @{style}" data-action="@{task.kind==='cut'?'compositeCut':'compositePreview'}" """.rstrip(),"""<button class="composite-cell @{style}"@{markAttrs} data-action="@{task.kind==='cut'?'compositeCut':'compositePreview'}" """.rstrip()),
        ('aria-label="(@{c+1},@{r+1}) @{label}" aria-pressed=','aria-label="(@{c+1},@{r+1}) @{label}@{markLabel}" aria-pressed='),
        ("(removed?'空':'■')","(removed?'空':marked?'剪':'■')"),
    ])
    edit('joint_ui.js',[
        (" const base=spec.baseKind==='demo'?DEMO_TASKS[f.primarySkillId]:STAGED_TASKS[f.primarySkillId]?.[spec.baseKind];if(!base)throw Error('Missing joint source '+spec.id);"," const rawBase=spec.baseKind==='demo'?DEMO_TASKS[f.primarySkillId]:STAGED_TASKS[f.primarySkillId]?.[spec.baseKind];if(!rawBase)throw Error('Missing joint source '+spec.id);\n const corrected=f.id==='J-G03-04'&&['G','D'].includes(spec.kind),base=corrected?{...rawBase,remove:spec.kind==='G'?[[1,0]]:[[0,1],[0,2]]}:rawBase;"),
        ("contentVersion:spec.contentVersion??f.contentVersion??JOINT_CONTENT.contentVersion,phase:", "contentVersion:corrected?153:(spec.contentVersion??f.contentVersion??JOINT_CONTENT.contentVersion),phase:"),
        (" if(jointExtended(task))task.joint.bridgeFingerprint=", " if(corrected)task.joint.correctedPriorContentVersion=spec.contentVersion??f.contentVersion??JOINT_CONTENT.contentVersion;\n if(jointExtended(task))task.joint.bridgeFingerprint="),
        ("if(prior.size){h.legacyExposure=true;", "if(task.joint.correctedPriorContentVersion){const v=task.joint.correctedPriorContentVersion,key=v+':'+task.id;if(saved.taskHistory[key]||saved.pendingFormal[key]||[...saved.attempts,...Object.values(saved.jointProgress).flatMap(s=>s.records||[])].some(a=>a.taskInstanceId===task.id&&a.contentVersion===v))prior.add(key);}if(prior.size){h.legacyExposure=true;"),
    ])
    edit('invariant_ui.js',[
        ("ok=ok&&probesOk&&w.proof===proof&&(proof==='count'?initialRed!==goalRed:initialRed%2!==goalRed%2)", "ok=ok&&probesOk&&(t.joint?.familyId==='J-S02-05'?((w.proof==='count'&&invariantQuantities(t.rule).includes('red')&&initialRed!==goalRed)||(w.proof==='parity'&&invariantQuantities(t.rule).includes('redParity')&&initialRed%2!==goalRed%2)):(w.proof===proof&&(proof==='count'?initialRed!==goalRed:initialRed%2!==goalRed%2)))"),
        ("reason:'覆盖所有候选并逐条件核查；", "reason:(t.joint?.familyId==='J-S02-05'?'至少完成'+t.minOps+'次合法操作；':'')+'覆盖所有候选并逐条件核查；"),
    ])
    p=root/'joint_reuse_review.js'
    s=p.read_text()
    s=replace(s,'const baselineUiHashes={','const baselineUiHashes={\n'+''.join("  '"+n+"':'"+expected[n]+"',\n" for n in names if n!='joint_extended.js'))
    p.write_text(s)
    p=root/'version.json'
    v=json.loads(p.read_text())
    for n in names:v['jointReuseCompatibleUiHashes'][n]=hashlib.sha256((root/n).read_bytes()).hexdigest()
    p.write_text(json.dumps(v,ensure_ascii=False,indent=2)+'\n')
