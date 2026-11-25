"""C #142: course semantic metadata only, preserve W1 content and W2 diagnostics."""
import argparse,copy,json,sys,subprocess,re,collections
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
from g1_reading_packets import ENTRIES,config,pack,replace_config,unpack,sha,compact
BASE="d0c9c3e265a7a76052487d374255fcda35f21117"
DATA="f14cd0860b2ba2472493ca108b391108abbe47f315b80eca498cccd28235dc5e"
SCRIPT="87c6d43c2c9a49f9306cf90a13ae52a6f20976866215a9e05c5704882022839c"
POLICY="r11-course-metadata-v1"
def classify(raw,labels):
    data=json.loads(raw);old=copy.deepcopy(data)
    assert labels["baseline"]==BASE
    active=data["courseScope"]["activeCourseId"]
    course=[m for m in data["materials"] if m["courseId"]==active]
    assert len(course)==168 and all(m["kind"] in ("story","optional") for m in course)
    byday={r["day"]:r for r in labels["days"]};assert set(byday)==set(range(1,85))
    seen={};week_counts=collections.defaultdict(collections.Counter)
    for m in course:
        day=m["day"];row=byday[day]
        assert m["metadataStatus"]=="unreviewed" and m["prerequisitesStatus"]=="unreviewed" and m["prerequisites"]==[]
        math=False
        for q in m["questions"]:
            match=re.fullmatch(r"R2-S(\d{2})-([123X])",q["id"]);assert match and int(match[1])==day
            idx="123X".index(match[2]);assert (idx==3)==(m["kind"]=="optional")
            assert q["id"] not in seen and q["sourceAbility"] and q["prompt"] and q["explanation"]
            assert q["metadataStatus"]=="unreviewed" and all(q[k] is None for k in ("category","ability","errorType","classification"))
            cat,ability,error=labels["taxonomy"][row["codes"][idx]]
            q.update(category=cat,ability=ability,errorType=error,classification={"status":"design_reviewed","policy":POLICY,"basis":q["sourceAbility"]},metadataStatus="reviewed")
            seen[q["id"]]={"sourceAbility":q["sourceAbility"],"prompt":q["prompt"],"category":cat,"ability":ability,"errorType":error}
            math|=cat=="math"
            if m["kind"]=="story":week_counts[m["week"]][cat]+=1
        assert not math or row["prerequisite"],(day,row)
        # Prerequisites are requirements, NOT evidence that the learner has them.
        m["metadataStatus"]="reviewed";m["prerequisitesStatus"]="reviewed"
        m["prerequisites"]=["普通课程："+row["prerequisite"]] if math else []
    assert len(seen)==336
    for w in data["weeks"]:
        counts=week_counts[w["week"]];assert sum(counts.values())==21
        w["standard"]="按已审校的题目标签观察普通课程首答；题目标签不是儿童错因诊断。"
        w["nextCriteria"]="按原周准入门槛评估；先修未确认、样本不足或本周课程题型覆盖不足时不授予准入，可以继续学习。"
    # Assert exact equality outside the narrowly authorized metadata fields.
    restored=copy.deepcopy(data)
    for m,o in zip(restored["materials"],old["materials"]):
        if m["courseId"]!=active:continue
        for k in ("metadataStatus","prerequisitesStatus","prerequisites"):m[k]=o[k]
        for q,oq in zip(m["questions"],o["questions"]):
            for k in ("category","ability","errorType","classification","metadataStatus"):q[k]=oq[k]
    for w,o in zip(restored["weeks"],old["weeks"]):
        for k in ("standard","nextCriteria"):w[k]=o[k]
    assert restored==old
    assert data["contentHash"]==old["contentHash"] and data["diagnostics"]==old["diagnostics"]
    # The semantic assessment content and diagnostic-version hash are unchanged;
    # the transport hash separately identifies the new metadata bytes.
    return compact(data),{"questions":seen,"weekCounts":dict(week_counts),"diagnosticsUnchanged":True,"nonMetadataIdentical":True,"semanticContentHash":data["contentHash"]}
def replace(s,a,b):
    assert s.count(a)==1,("missing or ambiguous anchor",a[:160],s.count(a))
    return s.replace(a,b,1)
def runtime(raw):
    s=raw.decode()
    anchor="  function allFirstRows(){"
    # Only recognize a proven metadata-only predecessor for current-course
    # questions. Keep immutable raw attempts, aid, date and first/retry facts.
    helpers="""  const courseMetadata=q=>q?.classification?.policy==='r11-course-metadata-v1'&&q.metadataStatus==='reviewed';
  function matchesQuestion(e,d){if(!d||e.materialId!==d.m.id||e.materialHash!==hash(d.m.text))return false;
   if(e.questionHash===hash(JSON.stringify(d.q)))return true;
   if(!courseMetadata(d.q)||e.metadataStatus!=='unreviewed'||e.category!==null||e.ability!==null||e.errorType!==null)return false;
   const previous={...d.q,ability:null,category:null,classification:null,errorType:null,metadataStatus:'unreviewed'};
   return e.questionHash===hash(JSON.stringify(previous))&&validAnswer(d.q,e.selected);
  }
  function reportItem(e,d){if(e.metadataStatus!=='unreviewed'||!courseMetadata(d.q)||!matchesQuestion(e,d))return e;
   // A projection of the item label, not a changed historical attempt or a
   // newly confirmed prerequisite/assistance fact.
   return {...e,category:d.q.category,ability:d.q.ability,errorType:d.q.errorType,metadataStatus:'reviewed',metadataProjection:'r11-course-metadata-v1'};
  }
"""
    old="  function allFirstRows(){const seen=new Set();return clone(rows('attempt').filter(e=>{const d=qs.get(e.questionId);if(!d||e.questionHash!==hash(JSON.stringify(d.q))||e.materialHash!==hash(d.m.text)||seen.has(e.questionId))return false;seen.add(e.questionId);return true;}));}"
    new=helpers+"  function allFirstRows(){const seen=new Set();return clone(rows('attempt').filter(e=>{const d=qs.get(e.questionId);if(!matchesQuestion(e,d)||seen.has(e.questionId))return false;seen.add(e.questionId);return true;}).map(e=>reportItem(e,qs.get(e.questionId))));}"
    s=replace(s,old,new)
    s=replace(s,"rows('attempt',q.id).filter(e=>e.materialHash===hash(m.text)&&e.questionHash===hash(JSON.stringify(q)))","rows('attempt',q.id).filter(e=>matchesQuestion(e,{m,q}))")
    s=replace(s,"all.filter(e=>qs.has(e.questionId)&&e.questionHash===hash(JSON.stringify(qs.get(e.questionId).q))&&e.materialHash===hash(qs.get(e.questionId).m.text))","all.filter(e=>matchesQuestion(e,qs.get(e.questionId)))")
    s=replace(s,"rows('attempt').filter(e=>!qs.has(e.questionId)||e.questionHash!==hash(JSON.stringify(qs.get(e.questionId).q))||e.materialHash!==hash(qs.get(e.questionId).m.text))","rows('attempt').filter(e=>!matchesQuestion(e,qs.get(e.questionId)))")
    # Preserve access to ordinary lessons before parent confirmation, while
    # known(m) still checks explicit knownMath for the math sample.
    s=replace(s,"const practiceAllowed=m=>!!m&&(m.prerequisitesStatus==='unreviewed'||known(m));","const practiceAllowed=m=>!!m&&(m.prerequisitesStatus==='unreviewed'||known(m)||activeMaterial(m)&&['story','optional'].includes(m.kind)&&m.questions.every(courseMetadata));")
    # Classification is now complete but some weeks have too few eligible
    # question types even in theory. Do not make those weeks impossible gates.
    s=replace(s,"const evaluable=!(courseScope&&unreviewedCount&&(readingPossible<10||extractionPossible<3));","const evaluable=!(courseScope&&(readingPossible<10||extractionPossible<3));")
    s=replace(s,"reason:'本周题目分类尚未完成审校，暂不做周准入评定；可以继续学习。'","reason:unreviewedCount?'本周题目分类尚未完成审校，暂不做周准入评定；可以继续学习。':'本周已审校课程题型覆盖不足，无法满足原周准入样本门槛；不评级，可以继续学习。'")
    s=replace(s,"confidence:'分类待审，暂不评级'","confidence:unreviewedCount?'分类待审，暂不评级':'课程样本覆盖不足，暂不评级'")
    # For current W1 there are no reserve lessons. Use an unseen current core
    # with the same item tag rather than silently fall back to an unrelated one.
    s=replace(s,"matched=errorType&&available.find(m=>m.kind==='reserve'&&m.questions.some(q=>q.metadataStatus!=='unreviewed'&&q.errorType===errorType)),candidate=matched||available.find(m=>m.kind==='reserve')||available[0];","matchesTag=m=>m.questions.some(q=>q.metadataStatus!=='unreviewed'&&q.errorType===errorType),matched=errorType&&(available.find(m=>m.kind==='reserve'&&matchesTag(m))||available.find(m=>m.kind==='story'&&m.questions.every(courseMetadata)&&matchesTag(m))),candidate=matched||available.find(m=>m.kind==='reserve')||available[0];")
    s=replace(s,"const result=start(ids,{day,scopeDay:isDueReview?day:null,purpose:rec?.materialId?'readiness-review':isDueReview?'review':l.kind||'practice'});","const separateCourseReview=!!rec?.materialId&&bank.get(rec.materialId)?.questions.every(courseMetadata)&&!l.coreIds.includes(rec.materialId);const result=start(ids,{day:separateCourseReview?null:day,scopeDay:isDueReview?day:null,purpose:rec?.materialId?'readiness-review':isDueReview?'review':l.kind||'practice'});")
    return s.encode()
def apply(site,out,labels):
    overlay=out/"overlay";overlay.mkdir(parents=True,exist_ok=False)
    files={};packet_changes={};report=None
    def put(path,body):
        if path.startswith("assets/") and (site/path).exists():assert (site/path).read_bytes()==body
        for dest in (site/path,overlay/path):
            dest.parent.mkdir(parents=True,exist_ok=True);dest.write_bytes(body)
        files[path]=sha(body)
    for name in ENTRIES:
        html=(site/name).read_text();cfg=config(html);before=copy.deepcopy(cfg)
        for group in ("data","scripts"):
            for i,row in enumerate(cfg["reading"][group]):
                old=row["id"]
                if old not in (DATA,SCRIPT):continue
                raw=unpack(row,lambda n:(site/n).read_bytes())
                if old==DATA:
                    revised,r=classify(raw,labels)
                    if report is not None:assert report==r
                    report=r
                else:
                    revised=runtime(raw)
                    subprocess.run(["node","--check","-"],input=revised,check=True)
                new=pack(revised,"final-integration",put,kind=row["kind"],key=row.get("key"))
                assert unpack(new,lambda n:(site/n).read_bytes())==revised
                if old in packet_changes:assert packet_changes[old]==new
                packet_changes[old]=new;cfg["reading"][group][i]=new
        expect=copy.deepcopy(before)
        for group in ("data","scripts"):expect["reading"][group]=[packet_changes.get(x["id"],x) for x in before["reading"][group]]
        assert cfg==expect and len(packet_changes)==2
        put(name,replace_config(html,cfg).encode())
    receipt={"base":BASE,"scope":"C #142 metadata and readiness/remediation only","packetChanges":packet_changes,"files":files,"allOtherConfigurationUnchanged":True,"report":{k:v for k,v in report.items() if k!="questions"}}
    (out/"candidate-manifest.json").write_text(json.dumps(receipt,ensure_ascii=False,indent=2)+"\n")
    (out/"course-classification.json").write_text(json.dumps(report,ensure_ascii=False,indent=2)+"\n")
    print("C_CANDIDATE "+json.dumps(receipt,ensure_ascii=False),flush=True)
if __name__=="__main__":
    p=argparse.ArgumentParser()
    p.add_argument("--site",type=Path,required=True);p.add_argument("--out",type=Path,required=True);a=p.parse_args()
    apply(a.site,a.out,json.loads(Path(__file__).with_name("r11_c_142_course_labels.json").read_text()))
