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
Q0_IDENTITY = 'q0-production-identity.json'
Q0_ASSETS = ('review-overlay.js', 'review-overlay.css')


def load_q0(root, manifest):
    """A Q0 release is a pinned, additive formal review layer, never a W1 refreeze."""
    path = root / Q0_IDENTITY
    if not path.is_file():
        return None
    identity = json.loads(path.read_bytes())
    if (identity.get('scope') != 'RC79-Q0_FORMAL_REVIEW'
            or identity.get('status') != 'Q0_RELEASE_CANDIDATE'
            or identity.get('baseMainCommit') != '7e1b5df76e63abcb45836200dbde4d06e88eaf35'
            or identity.get('learningSourceCommit') != manifest['sourceCommit']
            or identity.get('unchangedW1ReleaseFiles') != 439
            or identity.get('originalHomepageSha256') != manifest['entryFiles']['index.html']['sha256']
            or set(identity.get('formalReviewArtifactSha256', {}))
               != {'index.html', *Q0_ASSETS}):
        raise ValueError('Q0 formal production identity does not match the frozen W1 baseline')
    return identity



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
    q0 = load_q0(root, manifest)
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
        contents = (root / name).read_bytes()
        if name == 'index.html' and q0:
            hook = ('<script src="./review-overlay.js" defer data-review-scope="formal" '
                    f'data-review-build="{manifest["sourceCommit"]}"></script>\\n').encode('ascii')
            # Preserve every original W1 home-page byte, except the one Q0 hook.
            if contents.count(hook) != 1 or sha256(contents.replace(hook, b'')) != expected:
                raise ValueError('Q0 homepage changed W1 application bytes or its hook is invalid')
        elif sha256(contents) != expected:
            raise ValueError(f'Checkout differs from the W1 candidate: {name}')
        rows[name] = expected
    if not REQUIRED <= rows.keys() or allowlist.get('deletes') != []:
        raise ValueError('W1 release paths or deletion policy are incomplete')
    rows[MANIFEST] = sha256(manifest_bytes)
    if q0:
        for name, digest in q0['formalReviewArtifactSha256'].items():
            if sha256((root / name).read_bytes()) != digest:
                raise ValueError(f'Q0 tested review file mismatch: {name}')
            rows[name] = digest
        rows[Q0_IDENTITY] = sha256((root / Q0_IDENTITY).read_bytes())
        return 'RC79-Q0', rows
    return revision, rows


def verify_live(rows, receipt, revision):
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
                        'status': 'PUBLIC_Q0_BYTES_VERIFIED' if revision == 'RC79-Q0' else 'PUBLIC_W1_BYTES_VERIFIED', 'testedCommit': commit,
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
    elif revision in ('RC79-W1', 'RC79-Q0') and args.receipt:
        verify_live(rows, args.receipt, revision)
    else:
        parser.error('W1/Q0 public verification requires a supported revision and --receipt')


if __name__ == '__main__':
    main()
