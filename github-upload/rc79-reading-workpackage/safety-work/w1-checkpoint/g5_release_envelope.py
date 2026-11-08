#!/usr/bin/env python3
"""Prepare (never deploy) one auditable W1 release transaction from pinned inputs.

A release is not merely the 439 static runtime files. It also includes the
main-branch verifier workflow, verifier script, frozen allowlist and identity
manifest. --stage creates a new isolated tree for a separately authorized G5
commit. It does not push, merge, publish or mark the release PASS.
"""
import argparse
import hashlib
import json
import re
import shutil
import subprocess
from pathlib import Path, PurePosixPath

ALLOWLIST = 'github-upload/rc79-reading-workpackage/safety-work/w1-checkpoint/w1-g5-allowlist.json'
WORKFLOW = '.github/workflows/rc79-fix15-public.yml'
VERIFY = 'github-upload/rc79-reading-workpackage/safety-work/w1-checkpoint/public_release.py'
STAGER = 'github-upload/rc79-reading-workpackage/safety-work/w1-checkpoint/g5_release_envelope.py'
MANIFEST = 'muse/rc79/manifest.json'
SUPPORT = (WORKFLOW, VERIFY, ALLOWLIST, STAGER)
REQUIRED = {'index.html', 'source/index.html', 'amc8/index.html', 'academy/index.html'}
ALLOWED_QA = {'qa/index.html', 'qa/normal/index.html', 'qa/history/index.html'}
HEX64 = re.compile(r'^[0-9a-f]{64}$')


def checksum(data):
    return hashlib.sha256(data).hexdigest()


def load(path):
    return json.loads(path.read_text(encoding='utf-8'))


def target(root, name):
    p = PurePosixPath(name)
    if not name or p.is_absolute() or '..' in p.parts or p.as_posix() != name:
        raise ValueError('unsafe release path: ' + name)
    return root.joinpath(*p.parts)


def verify_contract(candidate, baseline, expected_main_sha):
    a = target(candidate, ALLOWLIST)
    raw = a.read_bytes()
    allow = json.loads(raw)
    if allow.get('mainBaseline') != expected_main_sha:
        raise ValueError('main SHA mismatch; rebase and regenerate allowlist instead of releasing')
    if allow.get('status') != 'PROPOSED_ALLOWLIST_NOT_DEPLOYED' or allow.get('deletes') != [] or allow.get('keepOtherMainPaths') is not True:
        raise ValueError('unsupported/unsafe allowlist status or deletion contract')
    if not re.fullmatch(r'[0-9a-f]{40}', allow.get('source', '')) or not isinstance(allow.get('artifactId'), int):
        raise ValueError('unbound frozen candidate')
    old_manifest = load(target(baseline, MANIFEST))
    if old_manifest.get('deliveryRevision') != 'RC79-FIX15':
        raise ValueError('baseline is not FIX15; refuse optimistic re-release')
    if baseline.joinpath('.git').exists():
        actual = subprocess.check_output(['git', '-C', str(baseline), 'rev-parse', 'HEAD'], text=True).strip()
        if actual != expected_main_sha:
            raise ValueError('actual baseline checkout is not the pinned main commit')
    rows = allow.get('actions')
    if not isinstance(rows, list) or not rows:
        raise ValueError('missing promotion actions')
    names = set()
    for row in rows:
        name = row.get('path')
        if not isinstance(name, str):
            raise ValueError('invalid action path')
        target(baseline, name)
        if name in names or not (name in REQUIRED | ALLOWED_QA or name.startswith('assets/') or name in {
            'muse/rc79/loading-r1/package-report.json',
            'muse/rc79/loading-r2/package-report.json',
        }):
            raise ValueError('duplicate/unapproved runtime file: ' + name)
        names.add(name)
        kind = row.get('action')
        if kind not in ('retain', 'replace', 'add') or not HEX64.fullmatch(row.get('newSha256') or ''):
            raise ValueError('invalid runtime action: ' + name)
        old = target(baseline, name)
        if kind == 'add':
            if old.exists() or row.get('oldSha256') is not None:
                raise ValueError('add conflicts with baseline: ' + name)
        else:
            if not old.is_file() or checksum(old.read_bytes()) != row.get('oldSha256'):
                raise ValueError('baseline changed: ' + name)
            if kind == 'retain' and row['oldSha256'] != row['newSha256']:
                raise ValueError('retain bytes differ: ' + name)
    if not REQUIRED <= names:
        raise ValueError('required runtime entry missing')
    for s in SUPPORT:
        if not target(candidate, s).is_file():
            raise ValueError('missing release support file: ' + s)
    flow = target(candidate, WORKFLOW).read_text(encoding='utf-8')
    verifier = target(candidate, VERIFY).read_text(encoding='utf-8')
    if 'public_release.py --detect' not in flow or "steps.release.outputs.revision == 'RC79-W1'" not in flow:
        raise ValueError('workflow does not actually support W1')
    if 'w1AllowlistSha256' not in verifier or 'verify_live(rows, args.receipt)' not in verifier:
        raise ValueError('public verifier not bound to W1 manifest and live runtime')
    return allow, raw, old_manifest


def stage(candidate, baseline, frozen, output, expected_main_sha, expected_zip_sha):
    allow, raw, manifest = verify_contract(candidate, baseline, expected_main_sha)
    if not HEX64.fullmatch(expected_zip_sha):
        raise ValueError('expected frozen ZIP SHA256 required')
    roots = [candidate.resolve(), baseline.resolve(), frozen.resolve()]
    output = output.resolve()
    if any(output == x or output.is_relative_to(x) or x.is_relative_to(output) for x in roots):
        raise ValueError('output must be separate from all source trees')
    if output.exists():
        raise ValueError('output already exists; refusing to overlay anything')
    # Require an external immutable ZIP SHA verified by the release executor.
    # This function receives extracted files; it does not claim to verify ZIP bytes.
    staged = 0
    shutil.copytree(baseline, output, ignore=shutil.ignore_patterns('.git'))
    try:
        for row in allow['actions']:
            name = row['path']
            dest = target(output, name)
            if row['action'] != 'retain':
                raw_file = target(frozen, name).read_bytes()
                if checksum(raw_file) != row['newSha256']:
                    raise ValueError('frozen artifact hash mismatch: ' + name)
                dest.parent.mkdir(parents=True, exist_ok=True)
                dest.write_bytes(raw_file)
                staged += 1
            if checksum(dest.read_bytes()) != row['newSha256']:
                raise ValueError('staged runtime hash mismatch: ' + name)
            if name.endswith('.html'):
                manifest.setdefault('entryFiles', {})[name] = {'bytes': dest.stat().st_size, 'sha256': row['newSha256']}
        for name in SUPPORT:
            source = target(candidate, name)
            dest = target(output, name)
            dest.parent.mkdir(parents=True, exist_ok=True)
            dest.write_bytes(source.read_bytes())
            if checksum(dest.read_bytes()) != checksum(source.read_bytes()):
                raise ValueError('support file mismatch: ' + name)
        manifest.update({
            'candidateId': 'RC79-W1-' + allow['source'][:12],
            'deliveryRevision': 'RC79-W1',
            'sourceCommit': allow['source'],
            'previousDeliveryCommit': expected_main_sha,
            'w1ArtifactId': allow['artifactId'],
            'w1AllowlistSha256': checksum(raw),
            'w1PackageSha256': expected_zip_sha,
            'releaseState': 'STAGED_NOT_DEPLOYED',
        })
        # Never carry a FIX15-only build identity into a W1 release claim.
        manifest.pop('rawApplicationBuildSha256', None)
        manifest.pop('contentBaselineBuildId', None)
        manifest['previousDataCompatibility'] = manifest.pop('dataCompatibility', {})
        manifest['dataCompatibility'] = {
            'baseline': 'RC79-FIX15', 'verification': 'requires G5 signed release evidence',
            'sourceCommit': allow['source'],
        }
        manifest['verification'] = {
            'state': 'STAGED_NOT_DEPLOYED',
            'publicReceipt': 'w1-public-byte-receipt.json',
            'physicalIPad': 'DEFERRED_TO_FINAL_UAT',
        }
        manifest_bytes = (json.dumps(manifest, ensure_ascii=False, indent=2) + '\n').encode('utf-8')
        target(output, MANIFEST).write_bytes(manifest_bytes)
        ledger = {
            'state': 'STAGED_NOT_DEPLOYED',
            'mainBaseline': expected_main_sha,
            'sourceCommit': allow['source'], 'artifactId': allow['artifactId'],
            'expectedFrozenZipSha256': expected_zip_sha,
            'allowlistSha256': checksum(raw),
            'manifestSha256': checksum(manifest_bytes),
            'runtimeActionCount': len(allow['actions']),
            'copiedRuntimeFiles': staged,
            'supportFiles': {p: checksum(target(output, p).read_bytes()) for p in SUPPORT},
            'requiredSeparateApproval': ['G5 release', 'production push', 'public smoke verification'],
        }
        (output / 'w1-g5-staging-receipt.json').write_text(json.dumps(ledger, indent=2) + '\n', encoding='utf-8')
        return ledger
    except BaseException:
        shutil.rmtree(output, ignore_errors=True)
        raise


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--candidate', type=Path, required=True)
    parser.add_argument('--baseline', type=Path, required=True)
    parser.add_argument('--main-sha', required=True)
    parser.add_argument('--frozen', type=Path)
    parser.add_argument('--output', type=Path)
    parser.add_argument('--expected-zip-sha256')
    a = parser.parse_args()
    if not re.fullmatch(r'[0-9a-f]{40}', a.main_sha):
        parser.error('--main-sha must be pinned 40-character commit SHA')
    if a.frozen or a.output or a.expected_zip_sha256:
        if not (a.frozen and a.output and a.expected_zip_sha256):
            parser.error('stage requires frozen directory, output and expected ZIP SHA')
        result = stage(a.candidate, a.baseline, a.frozen, a.output, a.main_sha, a.expected_zip_sha256)
    else:
        allow, raw, _ = verify_contract(a.candidate, a.baseline, a.main_sha)
        result = {
            'state': 'SUPPORT_CONTRACT_CHECKED_NOT_DEPLOYED',
            'sourceCommit': allow['source'], 'mainBaseline': allow['mainBaseline'],
            'artifactId': allow['artifactId'], 'runtimeActionCount': len(allow['actions']),
            'allowlistSha256': checksum(raw), 'supportFilesRequired': list(SUPPORT),
        }
    print(json.dumps(result, indent=2))


if __name__ == '__main__':
    main()
