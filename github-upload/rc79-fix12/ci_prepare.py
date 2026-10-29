import hashlib,json,shutil,subprocess,sys
from pathlib import Path
candidate=Path(sys.argv[1]).resolve();here=Path(__file__).resolve().parent
subprocess.run([sys.executable,str(here.parent/'rc79-fix11/ci_prepare.py'),str(candidate)],check=True)
subprocess.run([sys.executable,str(here.parent/'rc79-fix11/build_preserve.py'),str(candidate/'source')],check=True)
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
assert sha(candidate/'source/index.html')=='c13a1987cd5b4a3f642b67e5588ea6b3170b0a6c53fc80ea079f591590597a79','Previous production source build mismatch'
m=json.loads((here/'overlay-manifest.json').read_text())
for name,row in m['files'].items():
 rel=Path(name);assert not rel.is_absolute() and '..' not in rel.parts and rel.parts[0]=='source';target=candidate/rel;source=here/'overlay'/rel
 if row['baselineSha256'] is None:assert not target.exists(),name
 else:assert sha(target)==row['baselineSha256'],name
 assert sha(source)==row['candidateSha256'],name;target.parent.mkdir(parents=True,exist_ok=True);shutil.copyfile(source,target)
for name,row in m['patches'].items():
 rel=Path(name);target=candidate/rel;patch=here/row['patch'];assert not rel.is_absolute() and '..' not in rel.parts and rel.parts[0]=='source'
 assert sha(target)==row['baselineSha256'] and sha(patch)==row['patchSha256'],name
 subprocess.run(['patch','--batch','--forward','-p0','-i',str(patch)],cwd=candidate,check=True);assert sha(target)==row['candidateSha256'],name
print(json.dumps({'revision':'RC79-FIX12','basis':'exact tested FIX11','files':len(m['files']),'patches':len(m['patches'])}))
