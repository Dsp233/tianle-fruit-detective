"""Restore the frozen HOME1 build and apply a hash-checked FIX1 overlay."""
import hashlib
import json
import shutil
import subprocess
import sys
from pathlib import Path

repo=Path.cwd()
candidate=Path(sys.argv[1]).resolve()
overlay=repo/"github-upload/rc79-fix1"
manifest=json.loads((overlay/"overlay-manifest.json").read_text())
contract=json.loads((candidate/"release-contract.json").read_text())
assert contract["buildId"]==manifest["baselineContentBuild"]
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
for name,row in manifest["files"].items():
    rel=Path(name)
    assert not rel.is_absolute() and ".." not in rel.parts and rel.parts[0]=="source"
    target=candidate/rel
    if row["baselineSha256"] is None:
        assert not target.exists(),name
    else:
        assert sha(target)==row["baselineSha256"],name
        assert contract["sourceFiles"][name]==row["baselineSha256"],name
    source=overlay/"overlay"/rel
    assert sha(source)==row["candidateSha256"],name
    target.parent.mkdir(parents=True,exist_ok=True)
    shutil.copyfile(source,target)
print(json.dumps({"overlayFiles":len(manifest["files"]),"baseline":contract["buildId"]}))
