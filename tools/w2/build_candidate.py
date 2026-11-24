#!/usr/bin/env python3
"""Incremental W2 overlay, preserving existing loader and engine."""
import argparse, copy, json, re, sys
from pathlib import Path
from collections import Counter
from pypinyin import pinyin, Style
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
from g1_reading_packets import config,replace_config,compact,pack,sha,ENTRIES
from content_review import review

def patch(text,old,new):
    if text.count(old)!=1: raise ValueError("Runtime anchor drift: "+old[:120])
    return text.replace(old,new,1)

def runtime_patch(text):
    old="const diagnosticReviewed=set=>!set.forms.some(f=>f.materials.some(m=>m.questions.some(q=>q.metadataStatus==='unreviewed')));"
    new="""const diagnosticReviewed=set=>!set.forms.some(f=>f.materials.some(m=>m.questions.some(q=>q.metadataStatus==='unreviewed')))&&(!courseScope||set.courseId!==courseScope.activeCourseId||set.metadataStatus==='reviewed'&&set.availability==='enabled_reviewed_candidate'&&set.forms.length===4&&set.forms.every(f=>f.materials.length===2&&f.materials.every(m=>m.metadataStatus==='reviewed'&&m.prerequisitesStatus==='reviewed'&&m.questions.length===2&&m.questions.every(q=>q.metadataStatus==='reviewed'))));"""
    text=patch(text,old,new)
    text=patch(text,"if(dx.condition==='B'&&(aid.voiceEver||aid.parentEver))","if(dx.condition==='B'&&(aid.voiceEver||aid.parentEver||courseScope&&activeMaterial(c.material)&&!aid.pinyinEver))")
    text=patch(text,"function weekReadiness(){const first=firstRows().filter(a=>a.metadataStatus", "function weekReadiness(){const first=firstRows().filter(a=>!a.diagnostic&&a.metadataStatus")
    text=patch(text,"set=sets.find(x=>x.week===0)||sets[0]||null;ui.dxSet", "const live=activeSets(e.data);set=live.find(x=>x.week===0)||live[0]||sets.find(x=>x.week===0)||sets[0]||null;ui.dxSet")
    text=patch(text,"新版诊断尚未启用。</p>':'", "当前课程诊断另行统计。</p>':'")
    text=patch(text,"const diagnosisReady=!s.diagnostic||m.questions.every(item=>engine.attempts(item.id).some(a=>a.sessionId===s.id));","const diagnosisReady=!s.diagnostic||m.questions.every(item=>engine.attempts(item.id).some(a=>a.sessionId===s.id));const blindNew=s.diagnostic&&engine.data.courseScope&&m.courseId===engine.data.courseScope.activeCourseId&&!diagnosisReady;")
    text=patch(text,"rd-feedback ${last.correct?'rd-good':'rd-try'}","rd-feedback ${blindNew?'':last.correct?'rd-good':'rd-try'}")
    text=patch(text,"rt(c.session.diagnostic?(last.correct?","rt(blindNew?'已经记录本题的回答。':c.session.diagnostic?(last.correct?")
    text=patch(text,"${!last.correct&&!c.revealed?button('rdRetry'","${!blindNew&&!last.correct&&!c.revealed?button('rdRetry'")
    return text

def all_materials(data):
    return data["materials"]+[m for s in data["diagnostics"]["sets"] for f in s["forms"] for m in f["materials"]]

def annotate(base,new,sets):
    old=base["pinyinTexts"]; table=new["pinyinTexts"]; chars=new["pinyinMap"]
    strings=set()
    for s in sets:
        for f in s["forms"]:
            for m in f["materials"]:
                strings.update([m["text"],m["title"],m["goal"],*m["tags"],*m["prerequisites"]])
                strings.update(p["text"] for p in m["panels"])
                for q in m["questions"]:
                    strings.update([q["prompt"],q["explanation"],*q["options"],*q["evidence"]])
    han=lambda c: bool(re.match(r"[\u3400-\u9fff]",c))
    # Phrase-context pinyin; non-Han placeholders align with Array.from(text).
    def annotate_text(t):
        values=[v[0] for v in pinyin(t,style=Style.TONE,heteronym=False,errors=lambda s:[""]*len(s))]
        assert len(values)==len(t),(t,values)
        assert all(v or not han(c) for c,v in zip(t,values)),t
        return values
    # Human-language review of the dictionary's polyphonic errors in this
    # concrete corpus: length vs growth, measure words, mathematical relations,
    # sentence particles, photographic objects and rotation.
    def reviewed_syllable(t,i,v):
        c=t[i];prev=t[i-1] if i else "";nxt=t[i+1:i+2]
        pair=t[i:i+2]
        if c=="长": return "zhǎng" if nxt in ("出","大") else "cháng"
        if c=="只": return "zhī" if prev and (prev.isdigit() or prev in "一二两三四五六七八九十百几多每船") else "zhǐ"
        if c=="为": return "wèi" if prev=="因" else "wéi"
        if c=="的": return "de"
        if c=="中": return "zhōng"
        if c=="相": return "xiàng" if nxt in ("框","册") else "xiāng"
        if c=="转": return "zhuàn" if nxt in ("动","速") else "zhuǎn"
        if c=="落": return "luò"
        if c=="量": return "liáng" if prev=="测" or nxt in ("出","得") else "liàng"
        if c=="得":
            if t[max(0,i-2):i]=="滑行": return "de"
            return "dé"
        if c=="干" and nxt=="结": return "gān"
        if c=="片" and prev=="照": return "piàn"
        if c=="差": return "chà" if nxt in "一二三四五六七八九十" and nxt else "chā"
        if c=="一" and prev=="十": return "yī"
        return v
    corrections=[]
    added=[]
    for t in sorted(strings):
        if t not in table:
            table[t]=annotate_text(t);added.append(t)
            for i,v in enumerate(table[t]):
                replacement=reviewed_syllable(t,i,v)
                if replacement!=v:
                    corrections.append({"text":t,"index":i,"from":v,"to":replacement})
                    table[t][i]=replacement
        for c,v in zip(t,table[t]):
            if han(c) and c not in chars: chars[c]=v
        assert len(table[t])==len(t) and all(v or not han(c) for c,v in zip(t,table[t])),t
    assert all(table[k]==v for k,v in old.items())
    assert all(chars[k]==v for k,v in base["pinyinMap"].items())
    poly={c for t in added for c in t if han(c) and len(pinyin(c,style=Style.TONE,heteronym=True)[0])>1}
    contexts=[{"text":t,"positions":[{"index":i,"character":c,"pinyin":table[t][i]} for i,c in enumerate(t) if c in poly]} for t in added if any(c in poly for c in t)]
    return {"newExactStrings":len(added),"allDiagnosticStrings":len(strings),"newCharacters":len(chars)-len(base["pinyinMap"]),"contextCandidates":contexts,"corrections":corrections,"note":"Context dictionary plus reviewed corpus-specific polyphone corrections; real speech and child comprehension remain UAT. Preserve all W1 exact entries."}

def main(root,prepared,out):
    out=out.resolve();root=root.resolve()
    assert not out.is_relative_to(root) and not root.is_relative_to(out)
    out.mkdir(parents=True,exist_ok=True)
    base=json.loads((prepared/"base-data.json").read_bytes())
    draft=json.loads((prepared/"diagnostic_draft.json").read_bytes())
    sets,ledger=review(draft,base)
    new=copy.deepcopy(base)
    new["diagnostics"]["sets"].extend(sets)
    new["version"]="W2-DIAGNOSTICS-20261124"
    new["compatibility"]={"fromContentHash":base["contentHash"],"changedMaterialIds":[],"policy":"additive W2 diagnostics; retain original raw backup and archive prior diagnostic sessions"}
    py=annotate(base,new,sets)
    new["contentHash"]=sha(compact({k:new[k] for k in ("materials","lessons","diagnostics","courseScope")}))
    new["pinyinHash"]=sha(compact(new["pinyinTexts"]))
    assert compact(new["diagnostics"]["sets"][:13])==compact(base["diagnostics"]["sets"])
    for k in ("materials","lessons","weeks","courseScope","phrases","contextReviewedPositions"):
        assert compact(base[k])==compact(new[k]),k
    oldm=all_materials(base); nm=all_materials(new)[len(oldm):]
    assert len(nm)==104 and len({m["id"] for m in all_materials(new)})==len(all_materials(new))
    assert len({q["id"] for m in all_materials(new) for q in m["questions"]})==sum(len(m["questions"]) for m in all_materials(new))
    assert not {m["text"] for m in oldm}&{m["text"] for m in nm}
    assert len({m["text"] for m in nm})==104
    answers={q["id"]:q["answer"] for f in ledger for q in f["questions"]}
    assert len(answers)==208
    counts=Counter()
    for m in nm:
        assert "".join(p["text"] for p in m["panels"])==m["text"]
        for q in m["questions"]:
            assert q["options"][q["answer"]]==answers[q["id"]] and len(set(q["options"]))==3
            counts[q["answer"]]+=1
    assert max(counts.values())-min(counts.values())<=2,counts
    js=runtime_patch((prepared/"runtime.js").read_text())
    overlay=out/"overlay"
    files={}
    def write(name,b):
        p=overlay/name;p.parent.mkdir(parents=True,exist_ok=True);p.write_bytes(b);files[name]=sha(b)
    dp=pack(compact(new),"w2-diagnostics",write,kind="json",key="__AMC8_READING_DATA")
    rp=pack(js.encode(),"w2-diagnostics",write,kind="js")
    for name in ENTRIES:
        html=(root/name).read_text();cf=config(html);before=copy.deepcopy(cf)
        cf["reading"]["data"]=[dp];cf["reading"]["scripts"]=[rp]
        assert {k:v for k,v in cf.items() if k!="reading"}=={k:v for k,v in before.items() if k!="reading"}
        write(name,replace_config(html,cf).encode())
    (out/"candidate-data.json").write_bytes(compact(new))
    (out/"candidate-runtime.js").write_text(js)
    (out/"review-ledger.json").write_bytes(compact(ledger))
    (out/"pinyin-review.json").write_bytes(compact(py))
    (out/"original-draft.json").write_bytes((prepared/"diagnostic_draft.json").read_bytes())
    manifest={"baseMain":"595ff83b862228ee676e357d0cf0c78a8e129764","baseContentHash":base["contentHash"],"candidateContentHash":new["contentHash"],"legacySets":13,"newSets":13,"newForms":52,"newMaterials":104,"newQuestions":208,"answerPositions":dict(counts),"files":files,"dataPacket":dp["id"],"runtimePacket":rp["id"],"pinyin":{k:v for k,v in py.items() if k not in ("contextCandidates","corrections")},"empiricalEquating":"NOT_PERFORMED","release":"ISOLATED_ONLY"}
    (out/"manifest.json").write_bytes(compact(manifest))
    print(json.dumps(manifest,ensure_ascii=False))
if __name__=="__main__":
    p=argparse.ArgumentParser()
    for name in ("root","prepared","out"):p.add_argument("--"+name,type=Path,required=True)
    a=p.parse_args();main(a.root,a.prepared,a.out)
