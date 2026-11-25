"""C #145: reuse independently readable R1 resources without migrating historical attempts.
Only 27 selected existing questions, same text/answer/pronunciation, explicit current IDs and old exposure guard."""
import argparse,copy,json,sys,subprocess,re,collections
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
from g1_reading_packets import ENTRIES,config,pack,replace_config,unpack,sha,compact
BASE="6e5de89a8313d64b7aeef2efb1955501afe2829d"
SCRIPT="cb5dd0e6bdaf93908aecaebc30dbf9e5938a87015c153f6d3e7ab087dd021f3b"
# Data packet identified by the exact current script's formal configuration, not guessed.
# Pin data ID from the frozen formal config in apply().
DATA=None
SELECTION={8:('S2',[1]),29:('S2',[1]),36:('M',[2]),43:('S2',[1,2]),50:('S2',[1,2,3]),51:('S2',[1,2,3]),58:('M',[2]),64:('S2',[1,2,3]),65:('S2',[1,2,3]),66:('S2',[1]),71:('S2',[1,2,3]),72:('S2',[1,2,3]),73:('S2',[1,2])}
DEFICITS={2:(1,0),5:(1,0),6:(0,1),7:(2,0),8:(6,0),9:(0,1),10:(7,0),11:(8,0)}
def classify(raw,labels):
    data=json.loads(raw);old=copy.deepcopy(data)
    active=data['courseScope']['activeCourseId']
    bank={m['id']:m for m in data['materials']}
    lessons={l['day']:l for l in data['lessons']}
    assert len(lessons)==84
    assert all(not l['reserveIds'] for l in lessons.values())
    before=collections.defaultdict(collections.Counter)
    for m in bank.values():
        if m['courseId']==active and m['kind']=='story':
            before[m['week']].update(q['category'] for q in m['questions'])
    selected=[];add=collections.defaultdict(collections.Counter)
    for day,(kind,nums) in SELECTION.items():
        source=bank[f'R-D{day:03}-{kind}'];assert source['courseId']=='R1-LEGACY'
        assert source['kind']==('math' if kind=='M' else 'reserve')
        assert not any(m['courseId']==active and m['text']==source['text'] for m in bank.values())
        m=copy.deepcopy(source);m['id']=f'R2-D{day:03}-SUP';m['courseId']=active;m['kind']='reserve'
        m['exposureGroup']=f'R2-D{day:03}-SUP-PASSAGE'
        m['legacyMaterialId']=source['id'];m['metadataStatus']='reviewed';m['prerequisitesStatus']='reviewed'
        # Preserve actual prior knowledge requirements; no new inferred learner knowledge.
        m['questions']=[]
        for n in nums:
            q=copy.deepcopy(next(q for q in source['questions'] if q['id']==source['id']+f'-Q{n}'))
            assert q['type']=='choice' and q['category'] in ('math','reading','literacy') and q['metadataStatus']=='reviewed'
            assert (q['category']=='math')==(kind=='M')
            assert kind!='M' or q['ability'] in ('conditions','model')
            q['legacyQuestionId']=q['id'];q['id']=m['id']+f'-Q{n}'
            # This tag identifies an additive reuse, not a metadata projection.
            q['classification']={'status':'design_reviewed','policy':'r11-readiness-supplement-v1','basis':q['ability']}
            m['questions'].append(q);add[m['week']][q['category']]+=1
            selected.append({'id':q['id'],'sourceId':q['legacyQuestionId'],'materialId':m['id'],'week':m['week'],'day':day,'category':q['category'],'ability':q['ability'],'prompt':q['prompt'],'options':q['options'],'answer':q['answer'],'prerequisites':m['prerequisites']})
        data['materials'].append(m);lessons[day]['reserveIds'].append(m['id'])
    assert len(selected)==27 and len(SELECTION)==13
    for week,(r,m) in DEFICITS.items():
        assert add[week]['reading']+add[week]['literacy']==r and add[week]['math']==m
    counts=[{'week':w,'reading':before[w]['reading']+before[w]['literacy']+add[w]['reading']+add[w]['literacy'],'math':before[w]['math']+add[w]['math']} for w in range(1,13)]
    assert all(w['reading']>=10 and w['math']>=3 for w in counts)
    restored=copy.deepcopy(data);restored['materials']=restored['materials'][:len(old['materials'])]
    for l,o in zip(restored['lessons'],old['lessons']):l['reserveIds']=o['reserveIds']
    assert restored==old
    return compact(data),{'selected':selected,'capacity':counts,'exactOriginalData':True,'oldDiagnosticsUnchanged':True,'readingReused':25,'mathReused':2}
def replace(s,a,b):
    assert s.count(a)==1,('anchor',a[:140],s.count(a))
    return s.replace(a,b,1)
def runtime(raw):
    s=raw.decode()
    # Cross-course reuse explicitly consults legacy exposure, including imported old events.
    s=replace(s,"function exposure(materialId){return state.events.some(e=>samePassage(materialId,e.materialId)&&['material_open','attempt','answer_revealed','legacy_exposure'].includes(e.type));}","function exposure(materialId){const legacyId=bank.get(materialId)?.legacyMaterialId;return state.events.some(e=>(samePassage(materialId,e.materialId)||!!legacyId&&samePassage(legacyId,e.materialId))&&['material_open','attempt','answer_revealed','legacy_exposure'].includes(e.type));}")
    # Current fresh-choice route can explicitly select an independent reserve, not the day's core.
    s=replace(s,"function freshDayCandidate(day){if(!inDayRange(day))return null;const lesson=data.lessons.find(x=>x.day===day);if(!lesson)return null;return [...lesson.coreIds,...lesson.reserveIds].map(id=>bank.get(id)).find(m=>m&&m.day===day&&practiceAllowed(m)&&!exposure(m.id))||null;}","function freshDayCandidate(day,reserveOnly=false){if(!inDayRange(day))return null;const lesson=data.lessons.find(x=>x.day===day);if(!lesson)return null;return (reserveOnly?lesson.reserveIds:[...lesson.coreIds,...lesson.reserveIds]).map(id=>bank.get(id)).find(m=>m&&m.day===day&&practiceAllowed(m)&&!exposure(m.id))||null;}")
    s=replace(s,"function startFreshDayChoice(day){const m=freshDayCandidate(day);","function startFreshDayChoice(day,reserveOnly=false){const m=freshDayCandidate(day,reserveOnly);")
    s=replace(s,"e.startFreshDayChoice(Number(d.day))","e.startFreshDayChoice(Number(d.day),d.reserve==='true')")
    # Reserve button belongs to existing calendar, not an automatic core completion.
    a="l.day<range.start||l.day>range.end?'disabled':''}\`,'rd-button rd-optional-day'):''}</div>"
    b="l.day<range.start||l.day>range.end?'disabled':''}\`,'rd-button rd-optional-day'):''}\${l.reserveIds?.length?button('rdFreshDay','独立补练',\`data-day=\"\${l.day}\" data-reserve=\"true\" aria-label=\"第\${l.day}天独立补练\" \${l.day<range.start||l.day>range.end?'disabled':''}\`,'rd-button rd-optional-day'):''}</div>"
    s=replace(s,a,b)
    # Prefer held-week material matching the actual deficient category rather than unrelated earlier reserves.
    a="matched=errorType&&(available.find(m=>m.kind==='reserve'&&matchesTag(m))||available.find(m=>m.kind==='story'&&m.questions.every(courseMetadata)&&matchesTag(m))),candidate=matched||available.find(m=>m.kind==='reserve')||available[0];"
    b="matched=errorType&&(available.find(m=>m.kind==='reserve'&&matchesTag(m))||available.find(m=>m.kind==='story'&&m.questions.every(courseMetadata)&&matchesTag(m))),held=nav.held,needMath=held&&held.extraction.total<3,needReading=held&&held.reading.total<10,heldSupply=held&&available.find(m=>m.week===held.week&&m.legacyMaterialId&&m.questions.some(q=>needMath&&q.category==='math'||needReading&&q.category!=='math')),candidate=signal&&matched?matched:heldSupply||matched||available.find(m=>m.kind==='reserve')||available[0];"
    # ratio report's total field verified in #142 tests.
    s=replace(s,a,b)
    # Only report a matched tag if it belongs to the chosen material; don't attribute a different match.
    s=replace(s,"errorType:matched?errorType:null,mathSignalId:matched?signal?.id||null:null,fromMathTaskId:matched?signal?.mathTaskId||null:null","errorType:candidate&&matchesTag(candidate)?errorType:null,mathSignalId:candidate===matched?signal?.id||null:null,fromMathTaskId:candidate===matched?signal?.mathTaskId||null:null")
    # Recommendation does not complete a calendar day when it is a supplement.
    s=replace(s,"bank.get(rec.materialId)?.questions.every(courseMetadata)&&!l.coreIds.includes(rec.materialId)","(bank.get(rec.materialId)?.legacyMaterialId||bank.get(rec.materialId)?.questions.every(courseMetadata))&&!l.coreIds.includes(rec.materialId)")
    return s.encode()
def apply(site,out,labels):
    global DATA
    DATA=config((site/'index.html').read_text())['reading']['data'][0]['id']
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
    receipt={"base":BASE,"scope":"C #145 exact minimal independent readiness supplement","packetChanges":packet_changes,"files":files,"allOtherConfigurationUnchanged":True,"report":{k:v for k,v in report.items()}}
    (out/"candidate-manifest.json").write_text(json.dumps(receipt,ensure_ascii=False,indent=2)+"\n")
    (out/"course-supply.json").write_text(json.dumps(report,ensure_ascii=False,indent=2)+"\n")
    print("C_CANDIDATE "+json.dumps(receipt,ensure_ascii=False),flush=True)
if __name__=="__main__":
    p=argparse.ArgumentParser()
    p.add_argument("--site",type=Path,required=True);p.add_argument("--out",type=Path,required=True);a=p.parse_args()
    apply(a.site,a.out,None)
