"""Apply only the FIX14 delta to the hash-verified FIX13 build."""
import hashlib,json,shutil,subprocess,sys
from pathlib import Path
candidate=Path(sys.argv[1]).resolve();here=Path(__file__).resolve().parent
subprocess.run([sys.executable,str(here.parent/'rc79-fix13/ci_prepare.py'),str(candidate)],check=True)
subprocess.run([sys.executable,str(here.parent/'rc79-fix13/build_preserve.py'),str(candidate/'source')],check=True)
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
assert sha(candidate/'source/index.html')=='91c85ae4cfcf07987bb3ba5c32ea286090f4154b656bcdc20723174b382547ff','Previous FIX13 source differs from the verified release'
manifest=json.loads((here/'overlay-manifest.json').read_text())
for name,row in manifest['files'].items():
 rel=Path(name);assert not rel.is_absolute() and '..' not in rel.parts and rel.parts[0]=='source'
 target=candidate/rel;source=here/'overlay'/rel
 assert sha(target)==row['baselineSha256'] and sha(source)==row['candidateSha256'],name
 shutil.copyfile(source,target)
for name,row in manifest['patches'].items():
 rel=Path(name);assert not rel.is_absolute() and '..' not in rel.parts and rel.parts[0]=='source'
 target=candidate/rel;patch=here/row['patch']
 assert sha(target)==row['baselineSha256'] and sha(patch)==row['patchSha256'],name
 subprocess.run(['patch','--batch','--forward','-p0','-i',str(patch)],cwd=candidate,check=True)
 assert sha(target)==row['candidateSha256'],name
print(json.dumps({'revision':'RC79-FIX14','basis':'exact FIX13','files':len(manifest['files']),'patches':len(manifest['patches'])}))
