"""Verify the deployed W1 runtime selected by a Git-tracked release manifest."""
import argparse
from concurrent.futures import ThreadPoolExecutor
import hashlib
import json
import os
from pathlib import Path, PurePosixPath
import re
import time
from urllib.parse import quote
from urllib.request import Request, urlopen

MANIFEST = 'muse/rc79/manifest.json'
ALLOWLIST = ('github-upload/rc79-reading-workpackage/safety-work/'
             'w1-checkpoint/w1-g5-allowlist.json')
BASE = 'https://dsp233.github.io/tianle-fruit-detective/'
REQUIRED = {'index.html', 'amc8/index.html', 'source/index.html', 'academy/index.html'}


def sha256(body):
    return hashlib.sha256(body).hexdigest()


def load_contract(root):
    manifest_bytes = (root / MANIFEST).read_bytes()
    manifest = json.loads(manifest_bytes)
    revision = manifest['deliveryRevision']
    if revision == 'RC79-FIX15':
        return revision, {}
    if revision != 'RC79-W1':
        raise ValueError(f'Unsupported delivery revision: {revision}')
    allowlist_bytes = (root / ALLOWLIST).read_bytes()
    allowlist = json.loads(allowlist_bytes)
    if (manifest.get('w1AllowlistSha256') != sha256(allowlist_bytes)
            or manifest.get('sourceCommit') != allowlist['source']
            or manifest.get('w1ArtifactId') != allowlist['artifactId']):
        raise ValueError('W1 manifest does not identify the selected candidate')
    rows = {}
    for row in allowlist['actions']:
        name = row['path']
        path = PurePosixPath(name)
        expected = row['newSha256']
        if (path.is_absolute() or path.as_posix() != name or '..' in path.parts
                or name in rows or name == MANIFEST
                or not re.fullmatch('[0-9a-f]{64}', expected)
                or row['action'] not in ('retain', 'add', 'replace')):
            raise ValueError(f'Invalid W1 release path: {name}')
        if not (name in REQUIRED or name.startswith('assets/')
                or name in {'qa/index.html', 'qa/normal/index.html', 'qa/history/index.html',
                            'muse/rc79/loading-r1/package-report.json',
                            'muse/rc79/loading-r2/package-report.json'}):
            raise ValueError(f'Unexpected W1 release path: {name}')
        if sha256((root / name).read_bytes()) != expected:
            raise ValueError(f'Checkout differs from the W1 candidate: {name}')
        rows[name] = expected
    if not REQUIRED <= rows.keys() or allowlist.get('deletes') != []:
        raise ValueError('W1 release paths or deletion policy are incomplete')
    rows[MANIFEST] = sha256(manifest_bytes)
    return revision, rows


def verify_live(rows, receipt):
    commit = os.environ['GITHUB_SHA']

    def matches(item):
        name, expected = item
        url = BASE + quote(name, safe='/') + '?release=' + commit
        try:
            request = Request(url, headers={'Cache-Control': 'no-cache'})
            with urlopen(request, timeout=12) as response:
                return response.geturl() == url and sha256(response.read()) == expected
        except OSError:
            return False

    with ThreadPoolExecutor(max_workers=12) as pool:
        # Wait on the actual release manifest before checking the full set.
        for _ in range(40):
            if matches((MANIFEST, rows[MANIFEST])):
                failures = [name for name, ok in zip(rows, pool.map(matches, rows.items())) if not ok]
                if not failures:
                    receipt.parent.mkdir(parents=True, exist_ok=True)
                    receipt.write_text(json.dumps({
                        'status': 'PUBLIC_W1_BYTES_VERIFIED', 'testedCommit': commit,
                        'runId': os.environ['GITHUB_RUN_ID'], 'sha256': rows,
                    }, indent=2) + '\n')
                    return
                print('Mismatched paths:', ', '.join(failures), flush=True)
            time.sleep(10)
    raise RuntimeError('The W1 release manifest or runtime files did not match the public deployment')


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--detect', action='store_true')
    parser.add_argument('--receipt', type=Path)
    args = parser.parse_args()
    revision, rows = load_contract(Path.cwd())
    if args.detect:
        with open(os.environ['GITHUB_OUTPUT'], 'a') as output:
            print(f'revision={revision}', file=output)
    elif revision == 'RC79-W1' and args.receipt:
        verify_live(rows, args.receipt)
    else:
        parser.error('W1 public verification requires the RC79-W1 revision and --receipt')


if __name__ == '__main__':
    main()
