"""Restore only delivery input HTML from the immutable LOAD1 baseline; keep all learning data."""
import json
from pathlib import Path
import subprocess

baseline = 'ecd6c6a87047378f41629c9b3afdf90f657a3b0c'
report = json.loads(Path('muse/rc79/loading-r1/package-report.json').read_text())
for row in report['pages']:
    raw = subprocess.check_output(['git','show',baseline+':'+row['path']])
    Path(row['path']).write_bytes(raw)
print('Restored', len(report['pages']), 'immutable LOAD1 HTML inputs for rebuilding the corrected delivery')
