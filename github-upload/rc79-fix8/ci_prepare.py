"""Rebuild the frozen FIX7 source and apply only hash-checked FIX8 files."""
import hashlib, json, shutil, subprocess, sys
from pathlib import Path
repo=Path.cwd(); candidate=Path(sys.argv[1]).resolve(); here=Path(__file__).resolve().parent
subprocess.run([sys.executable,str(here.parent/'rc79-fix7/ci_prepare.py'),str(candidate)],check=True)
manifest=json.loads((here/'overlay-manifest.json').read_text())
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
for name,row in manifest['files'].items():
 rel=Path(name);assert not rel.is_absolute() and '..' not in rel.parts and rel.parts[0]=='source'
 target=candidate/rel;source=here/'overlay'/rel
 if row['baselineSha256'] is None:assert not target.exists(),name
 else:assert sha(target)==row['baselineSha256'],name
 assert sha(source)==row['candidateSha256'],name
 target.parent.mkdir(parents=True,exist_ok=True);shutil.copyfile(source,target)
for name,row in manifest.get('patches',{}).items():
 rel=Path(name);assert not rel.is_absolute() and '..' not in rel.parts and rel.parts[0]=='source'
 target=candidate/rel;patch=here/row['patch']
 assert sha(target)==row['baselineSha256'] and sha(patch)==row['patchSha256'],name
 subprocess.run(['patch','--batch','--forward','-p0','-i',str(patch)],cwd=candidate,check=True)
 assert sha(target)==row['candidateSha256'],name
print(json.dumps({'revision':'RC79-FIX8','deltaFiles':len(manifest['files']),'patchedFiles':len(manifest.get('patches',{})),'basis':'verified FIX7'}))
