#!/usr/bin/env python3
"""W2 additive diagnostic build: recover the pinned current W1 runtime and existing W2 draft.
Only writes to a separate output directory; no production or learner storage access.
"""
import argparse, copy, hashlib, json, sys
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
from g1_reading_packets import config, unpack, sha

READING_SHA="009e644a86618ef645f1cc7bcfaaee8c7017f5b2d2d65d878f590fca6641d6ae"
SCRIPT_SHA="7c9ab43332d698ef3971bf52495fef4369f2ca87ef126d3239fb10e5f8796116"
def canon(x):
    return json.dumps(x,ensure_ascii=False,sort_keys=True,separators=(",",":"))
def write_json(path,value):
    path.write_text(json.dumps(value,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
def prepare(root,draft_dir,out):
    root=root.resolve()
    out=out.resolve()
    if out.is_relative_to(root) or root.is_relative_to(out):
        raise ValueError("W2 output must be isolated")
    out.mkdir(parents=True,exist_ok=True)
    conf=config((root/"index.html").read_text(encoding="utf-8"))
    data_row,=conf["reading"]["data"]
    js_row,=conf["reading"]["scripts"]
    if data_row["id"]!=READING_SHA or js_row["id"]!=SCRIPT_SHA:
        raise ValueError("W1 source packet identity changed")
    raw=unpack(data_row,lambda name:(root/name).read_bytes())
    runtime=unpack(js_row,lambda name:(root/name).read_bytes())
    course=json.loads(raw)
    assert course["courseScope"]["activeCourseId"]=="R2-84D-20261031"
    legacy=course["diagnostics"]["sets"]
    assert len(legacy)==13 and all(s["courseId"]=="R1-LEGACY" for s in legacy)
    assert [s["week"] for s in legacy]==list(range(13))
    # W2-PREP already proved the FIX15 equality; use the actual current legacy tree
    # as the immutable W2 comparison input, without pretending to re-run FIX15.
    old={"diagnostics":{"sets":copy.deepcopy(legacy)}}
    for s in old["diagnostics"]["sets"]:
        del s["courseId"]
        for f in s["forms"]:
            for m in f["materials"]: del m["courseId"]
    sys.path.insert(0,str(draft_dir.resolve()))
    import build_diagnostics as original
    draft=original.build(course,old)
    assert canon(course["diagnostics"]["sets"])==canon(legacy)
    assert len(draft["sets"])==13
    assert sum(len(m["questions"]) for s in draft["sets"] for f in s["forms"] for m in f["materials"])==208
    (out/"base-data.json").write_bytes(raw)
    (out/"runtime.js").write_bytes(runtime)
    write_json(out/"diagnostic_draft.json",draft)
    write_json(out/"inspection.json",{"baseReadingSha":sha(raw),"baseRuntimeSha":sha(runtime),
      "courseId":course["courseScope"]["activeCourseId"],"contentHash":course["contentHash"],
      "topLevelKeys":list(course),"diagnosticMetadata":{k:v for k,v in course["diagnostics"].items() if k!="sets"},
      "legacySetExample":legacy[0],"legacyBlueprints":[{"id":s["id"],"blueprint":s["blueprint"]} for s in legacy],
      "pinyinExample":{k:(list(v.items())[:3] if isinstance(v,dict) else str(v)[:400]) for k,v in course.items() if k in ("pinyinTexts","pinyinMap","phrases","pronunciationPolicy")},
      "legacyTreeSha256":hashlib.sha256(canon(legacy).encode()).hexdigest(),
      "draftQuestionCount":208,"enabledNewSets":0,"scope":"W2_PREP inherited; draft only, independent review pending"})
    print("Prepared pinned W1 input and 208 W2 draft questions; new sets remain disabled.")
if __name__=="__main__":
    p=argparse.ArgumentParser()
    p.add_argument("--root",type=Path,required=True);p.add_argument("--draft-dir",type=Path,required=True);p.add_argument("--out",type=Path,required=True)
    a=p.parse_args();prepare(a.root,a.draft_dir,a.out)
