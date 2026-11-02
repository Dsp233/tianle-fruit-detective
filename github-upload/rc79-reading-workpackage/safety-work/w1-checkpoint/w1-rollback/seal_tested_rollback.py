#!/usr/bin/env python3
"""Preserve the FIX15 archive and recovery overlay actually tested in CI."""
import hashlib, json, os, pathlib, shutil, sys, zipfile

site, original_zip, destination = (pathlib.Path(x).resolve() for x in sys.argv[1:4])
release = 'b1e64e98237e5ccf6b1091be7c26e51b69364127'
expected_overlay = {'restore.html', 'restore_ui.js', 'fix15_fresh_restore.js', 'fix15-reading-data.js', 'fix15-reading-engine.js'}

def digest(stream):
    h = hashlib.sha256()
    for chunk in iter(lambda: stream.read(1024 * 1024), b''):
        h.update(chunk)
    return h.hexdigest()

with zipfile.ZipFile(original_zip) as archive:
    names = [i.filename for i in archive.infolist() if not i.is_dir()]
    if len(names) != len(set(names)) or 'index.html' not in names:
        raise SystemExit('Invalid FIX15 archive entries')
    for name in names:
        target = (site / name).resolve()
        if not target.is_relative_to(site) or not target.is_file():
            raise SystemExit('Missing or unsafe tested FIX15 file: ' + name)
        with archive.open(name) as a, target.open('rb') as b:
            if digest(a) != digest(b):
                raise SystemExit('Tested FIX15 bytes differ from archive: ' + name)
    actual = {str(p.relative_to(site)) for p in site.rglob('*') if p.is_file() and 'recovery' != p.relative_to(site).parts[0]}
    if actual != set(names):
        raise SystemExit('Unexpected non-recovery files in tested FIX15 tree')
overlay = site / 'recovery'
if not overlay.is_dir() or {p.name for p in overlay.iterdir() if p.is_file()} != expected_overlay or any(p.is_dir() for p in overlay.iterdir()):
    raise SystemExit('Unexpected recovery overlay')
destination.mkdir(parents=True, exist_ok=False)
shutil.copyfile(original_zip, destination / 'FIX15.zip')
shutil.copytree(overlay, destination / 'recovery')
files = {}
for file in sorted(p for p in destination.rglob('*') if p.is_file()):
    with file.open('rb') as f:
        files[str(file.relative_to(destination))] = digest(f)
receipt = {'status': 'TESTED_SYNTHETIC_RECOVERY_NOT_DEPLOYED', 'fix15ReleaseCommit': release,
           'testSourceCommit': os.environ.get('GITHUB_SHA', 'LOCAL_UNCOMMITTED'),
           'workflowRunId': os.environ.get('GITHUB_RUN_ID'), 'files': files,
           'limitations': ['Drafts remain archived for inspection; no automatic refill.',
                           'Fresh isolated profile and closed other pages are required.',
                           'Physical device and audible speech were not tested.']}
(destination / 'receipt.json').write_text(json.dumps(receipt, ensure_ascii=False, sort_keys=True, indent=2) + '\n', encoding='utf-8')
print(json.dumps({'result': receipt['status'], 'fix15ZipSha256': files['FIX15.zip'], 'overlayFiles': len(expected_overlay)}))
