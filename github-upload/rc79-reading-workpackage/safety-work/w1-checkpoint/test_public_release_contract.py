from hashlib import sha256
from pathlib import Path
import json
import sys
from tempfile import TemporaryDirectory
from zipfile import ZipFile
import public_release as release

with TemporaryDirectory() as td, ZipFile(sys.argv[1]) as frozen:
    root = Path(td)
    manifest = root / release.MANIFEST
    manifest.parent.mkdir(parents=True)
    manifest.write_text(json.dumps({'deliveryRevision': 'RC79-FIX15'}))
    assert release.load_contract(root) == ('RC79-FIX15', {})
    allowlist = root / release.ALLOWLIST
    allowlist.parent.mkdir(parents=True)
    original = Path(release.ALLOWLIST).read_bytes()
    allowlist.write_bytes(original)
    parsed = json.loads(original)
    receipt = {'deliveryRevision': 'RC79-W1', 'sourceCommit': parsed['source'],
               'w1ArtifactId': parsed['artifactId'],
               'w1AllowlistSha256': sha256(original).hexdigest()}
    manifest.write_text(json.dumps(receipt))
    for row in parsed['actions']:
        f = root / row['path']
        f.parent.mkdir(parents=True, exist_ok=True)
        f.write_bytes(frozen.read(row['path']))
    revision, rows = release.load_contract(root)
    assert revision == 'RC79-W1' and len(rows) == len(parsed['actions']) + 1
    (root / 'index.html').write_bytes(b'QA or stale payload')
    try:
        release.load_contract(root)
    except ValueError as error:
        assert 'Checkout differs' in str(error)
    else:
        raise AssertionError('Accepted stale or QA homepage')
    receipt['sourceCommit'] = '0' * 40
    manifest.write_text(json.dumps(receipt))
    try:
        release.load_contract(root)
    except ValueError as error:
        assert 'does not identify' in str(error)
    else:
        raise AssertionError('Accepted mismatched source')
print('PASS: FIX15 routing, frozen W1 contract, modified homepage rejection, wrong source rejection')
