"""Apply FIX6 from its frozen contract, then the explicitly hashed FIX7 delta."""
import hashlib
import json
import shutil
import subprocess
import sys
from pathlib import Path

repo = Path.cwd()
candidate = Path(sys.argv[1]).resolve()
here = Path(__file__).resolve().parent
subprocess.run([sys.executable, str(here.parent / 'rc79-fix6/ci_prepare.py'), str(candidate)], check=True)
manifest = json.loads((here / 'overlay-manifest.json').read_text())
sha = lambda p: hashlib.sha256(p.read_bytes()).hexdigest()
for name, row in manifest['files'].items():
    rel = Path(name)
    assert not rel.is_absolute() and '..' not in rel.parts and rel.parts[0] == 'source'
    target, source = candidate / rel, here / 'overlay' / rel
    if row['baselineSha256'] is None:
        assert not target.exists(), name
    else:
        assert sha(target) == row['baselineSha256'], name
    assert sha(source) == row['candidateSha256'], name
    target.parent.mkdir(parents=True, exist_ok=True)
    shutil.copyfile(source, target)
print(json.dumps({'revision': 'RC79-FIX7', 'deltaFiles': len(manifest['files'])}))
