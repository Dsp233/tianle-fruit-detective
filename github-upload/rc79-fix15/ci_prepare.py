"""Apply the FIX15 delta only to the independently reconstructed FIX14 build."""
import hashlib,json,shutil,subprocess,sys
from pathlib import Path
candidate=Path(sys.argv[1]).resolve();here=Path(__file__).resolve().parent
subprocess.run([sys.executable,str(here.parent/'rc79-fix14/ci_prepare.py'),str(candidate)],check=True)
subprocess.run([sys.executable,str(here.parent/'rc79-fix13/build_preserve.py'),str(candidate/'source')],check=True)
subprocess.run([sys.executable,'source/build_qa.py'],cwd=candidate,check=True)
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
assert sha(candidate/'index.html')=='70e54a096d71f72b14cee1218ffa29367cf95f63a2e0ab1775a95ba10b93b4e8','Previous FIX14 application differs from tested build'
manifest=json.loads((here/'overlay-manifest.json').read_text())
for name,row in manifest['files'].items():
 rel=Path(name);assert not rel.is_absolute() and '..' not in rel.parts and rel.parts[0]=='source'
 target=candidate/rel;source=here/'overlay'/rel
 assert sha(target)==row['baselineSha256'] and sha(source)==row['candidateSha256'],name
 shutil.copyfile(source,target)
assert not manifest.get('patches')
print(json.dumps({'revision':'RC79-FIX15','basis':'exact FIX14','files':len(manifest['files'])}))
