#!/usr/bin/env python3
"""Recover exact G1 source bytes from the two already-authorized frozen inputs.
Never emit or upload the source tree. The original private Git bundle lock remains
unchanged. This is an alternative provisioning path to the existing build --inputs
contract; the original per-path and content-manifest locks remain authoritative.
"""
import argparse, hashlib, json, sys
from pathlib import Path, PurePosixPath
from zipfile import ZipFile
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
from g1_verify_content import verify_manifest, verify_files, verify_tree, manifest_sha256
from g1_rebuild_w1_reading import HOME1_INPUTS
from build_site import check_toolchain

LOCK=Path(__file__).resolve().parents[1]/"g1-source-lock.json"
ARCHIVES={"w1":"691e39be468335977f615b4d96497ff81d6b2f38dc7cee6ff0e6f0e44ec00e21",
          "home":"abf49d6cdecd31bcece2feda6fd40464eedd21ecef490158daa00c735edcb0f4"}
def sha(body): return hashlib.sha256(body).hexdigest()
def archive(path,expected):
    with path.open("rb") as f:
        assert hashlib.file_digest(f,"sha256").hexdigest()==expected,"Frozen archive SHA mismatch"
    z=ZipFile(path)
    names=z.namelist()
    assert len(names)==len(set(names)),"Duplicate ZIP member"
    for name in names:
        p=PurePosixPath(name)
        assert not p.is_absolute() and ".." not in p.parts and "\\" not in name
    return z
def put(root,name,body):
    p=root/name;p.parent.mkdir(parents=True,exist_ok=True);p.write_bytes(body)
def pick(z,name,digest):
    # The original archive may retain one leading top-level folder.
    names=[n for n in z.namelist() if n==name or n.endswith("/"+name)]
    matches=[z.read(n) for n in names if sha(z.read(n))==digest]
    if not matches:return None
    assert all(x==matches[0] for x in matches)
    return matches[0]
def recover(w1,home,wheel,out,receipt):
    lock=json.loads(LOCK.read_bytes())
    assert not out.exists()
    out.mkdir(parents=True)
    with archive(w1,ARCHIVES["w1"]) as w,archive(home,ARCHIVES["home"]) as h:
        index_names=[n for n in w.namelist() if n.endswith("source/exam_runtime_index.json")]
        assert len(index_names)==1,index_names
        index=json.loads(w.read(index_names[0]))
        content=verify_manifest({n:d for n,d in index["inputFiles"].items() if n.startswith("content/")})
        missing=[]
        for folder,expected,prefix,z in [
            ("compiler",lock["controlledCompilerFiles"],"",w),
            ("content",{n.removeprefix("content/"):d for n,d in content.items()},"source/content/",w),
            ("r1",HOME1_INPUTS,"source/",h)]:
            for name,digest in sorted(expected.items()):
                body=pick(z,prefix+name,digest)
                if body is None:missing.append((folder,name));continue
                put(out/folder,name,body)
        # Only counts, identities and hashes are reported; never source contents.
        result={"sourceArchiveSha256":ARCHIVES,"contentManifestSha256":manifest_sha256(content),
                "expected":{"content":len(content),"compiler":len(lock["controlledCompilerFiles"]),"r1":len(HOME1_INPUTS)},
                "missingByGroup":{k:sum(g==k for g,n in missing) for k in ("content","compiler","r1")},
                "originalBundleIdentity":lock["canonicalSource"]["bundleSha256"],
                "originalBundleRecovered":False}
        receipt.write_text(json.dumps(result,indent=2)+"\n")
        print(json.dumps(result))
        if missing:raise ValueError("Frozen archives do not cover all exact locked paths")
    put(out,"exam-content-lock.json",json.dumps(content,ensure_ascii=False,sort_keys=True,separators=(",",":")).encode())
    body=wheel.read_bytes();assert sha(body)==lock["toolchain"]["pypinyinSha256"]
    put(out,"wheels/"+lock["toolchain"]["pypinyinWheel"],body)
    verify_tree(out/"content",content)
    verify_files(out/"compiler",lock["controlledCompilerFiles"])
    verify_files(out/"r1",HOME1_INPUTS)
    result["allExactSourceFilesVerified"]=True;result["wheelVerified"]=True
    receipt.write_text(json.dumps(result,indent=2)+"\n")
    print(json.dumps(result))
if __name__=="__main__":
    p=argparse.ArgumentParser()
    for key in ("w1","home","wheel","out","receipt"):p.add_argument("--"+key,type=Path,required=True)
    a=p.parse_args();recover(a.w1,a.home,a.wheel,a.out,a.receipt)
