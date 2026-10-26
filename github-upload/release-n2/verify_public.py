"""Read back all published entry bytes from the actual GitHub Pages endpoint."""
from datetime import datetime, timezone
import hashlib
import json
import os
from pathlib import Path
import time
import urllib.error
import urllib.parse
import urllib.request
from verify_software import BUILD, PUBLIC_FILES, read

root = Path(os.environ['RUNNER_TEMP'])
contract = read(root / 'public-candidate/release-contract.json')
assert contract['buildId'] == BUILD
published = read(Path.cwd() / 'production/muse/rc79/release-contract.json')
assert published == contract
request = urllib.request.Request('https://api.github.com/repos/Dsp233/tianle-fruit-detective/pages',
    headers={'Authorization': 'Bearer ' + os.environ['GH_TOKEN'], 'Accept': 'application/vnd.github+json'})
with urllib.request.urlopen(request, timeout=30) as response:
    pages = json.load(response)
base = pages['html_url']
parts = urllib.parse.urlparse(base)
assert parts.scheme == 'https' and parts.hostname == 'dsp233.github.io'
assert parts.path.rstrip('/') == '/tianle-fruit-detective'
base = base.rstrip('/') + '/'
out = root / 'public-verification'
out.mkdir(exist_ok=True)
pending = set(PUBLIC_FILES)
rows = {}
for attempt in range(6):
    for name in sorted(pending):
        url = urllib.parse.urljoin(base, urllib.parse.quote(name, safe='/'))
        url += '?rc79_verify=' + os.environ['GITHUB_RUN_ID'] + '-' + str(attempt)
        request = urllib.request.Request(url, headers={'Cache-Control': 'no-cache', 'Accept-Encoding': 'identity'})
        try:
            with urllib.request.urlopen(request, timeout=45) as response:
                digest = hashlib.sha256()
                size = 0
                while True:
                    chunk = response.read(1024 * 1024)
                    if not chunk:
                        break
                    digest.update(chunk)
                    size += len(chunk)
                actual = digest.hexdigest()
                rows[name] = {'path': name, 'status': response.status,
                    'expectedSha256': contract['files'][name], 'actualSha256': actual,
                    'bytes': size, 'result': 'PASS' if actual == contract['files'][name] else 'STALE_OR_DIFFERENT'}
        except (urllib.error.URLError, TimeoutError) as error:
            rows[name] = {'path': name, 'result': 'FETCH_FAILED', 'error': str(error)}
    pending = {name for name in pending if rows[name]['result'] != 'PASS'}
    if not pending:
        break
    if attempt < 5:
        time.sleep(10)
result = {'schema': 1, 'result': 'PASS' if not pending else 'FAIL', 'buildId': BUILD,
    'productionMain': os.environ['EXPECTED_MAIN'], 'publicUrl': base,
    'observedAt': datetime.now(timezone.utc).isoformat(), 'entries': [rows[n] for n in sorted(PUBLIC_FILES)],
    'productionBytesMatchAcceptedCandidate': not pending,
    'humanAndPhysicalReview': 'NOT_RUN_OR_UNVERIFIED', 'learningEffect': 'NOT_MEASURED'}
(out / 'public-bytes.json').write_text(json.dumps(result, ensure_ascii=False, indent=2) + '\n')
with open(os.environ['GITHUB_ENV'], 'a') as env:
    env.write('PUBLIC_BASE=' + base.rstrip('/') + '\n')
print(json.dumps(result, ensure_ascii=False))
assert not pending, 'Public entries do not yet match the accepted candidate: ' + str(sorted(pending))
