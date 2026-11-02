#!/usr/bin/env python3
"""Verify that the receipt rejects a tested tree differing from its archive."""
import json, pathlib, subprocess, sys, tempfile, zipfile

here = pathlib.Path(__file__).resolve().parent
with tempfile.TemporaryDirectory() as tmp:
    base = pathlib.Path(tmp); site = base / 'site'; (site / 'source').mkdir(parents=True); (site / 'recovery').mkdir()
    (site / 'index.html').write_text('synthetic index'); (site / 'source/index.html').write_text('synthetic source')
    for name in ('restore.html', 'restore_ui.js', 'fix15_fresh_restore.js', 'fix15-reading-data.js', 'fix15-reading-engine.js'):
        (site / 'recovery' / name).write_text('synthetic ' + name)
    archive = base / 'fix15.zip'
    with zipfile.ZipFile(archive, 'w') as z:
        z.write(site / 'index.html', 'index.html'); z.write(site / 'source/index.html', 'source/index.html')
    command = [sys.executable, str(here / 'seal_tested_rollback.py'), str(site), str(archive)]
    subprocess.run([*command, str(base / 'good')], check=True, capture_output=True)
    receipt = json.loads((base / 'good/receipt.json').read_text()); assert len(receipt['files']) == 6
    (site / 'source/index.html').write_text('changed')
    result = subprocess.run([*command, str(base / 'bad')], capture_output=True, text=True)
    assert result.returncode != 0 and 'bytes differ' in result.stderr
print(json.dumps({'result': 'PASS_SYNTHETIC_ONLY', 'archiveAndOverlayRecorded': True, 'changedTreeRejected': True}))
