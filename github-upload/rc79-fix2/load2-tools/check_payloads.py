"""Syntax and exact decompression checks, not complete application acceptance."""
import base64
from concurrent.futures import ThreadPoolExecutor
import gzip
import hashlib
import json
from pathlib import Path
import re
import subprocess
import tempfile

root = Path('.')
report = json.loads((root / 'muse/rc79/loading-r2/package-report.json').read_text())
scripts, parts, payloads = {}, set(), {}
for page in report['pages']:
    text = (root / page['path']).read_text()
    for attrs, source in re.findall(r'<script\b([^>]*)>([\s\S]*?)</script>', text):
        if 'application/json' not in attrs and source.strip():
            scripts[hashlib.sha256(source.encode()).hexdigest()] = source.encode()
    match = re.search(r'<script id="learning-delivery" type="application/json">(.*?)</script>', text)
    if page['mode'] == 'bounded-compressed-inline-bootstrap':
        assert match, 'Missing bootstrap: ' + page['path']
    if page['mode'] == 'inline-small-maintenance':
        assert 'window.__AMC8_MAINTENANCE_READY=true;' in text
        assert not re.search(r'<script[^>]+src=', text)
        original = re.search(r'<script>([\s\S]*?)\nwindow.__AMC8_MAINTENANCE_READY=true;</script>', text)[1]
        assert hashlib.sha256(original.encode()).hexdigest() == page['originalScriptSha256']
    if not match:
        continue
    config = json.loads(match[1])
    groups = [config] if config.get('legacy') else [config['math'], config['reading']]
    for group in groups:
        for row in group['data'] + group['scripts']:
            payloads[row['id']] = row
for digest, row in payloads.items():
    raw_parts = []
    for part in row['parts']:
        raw = (root / part).read_bytes()
        assert len(raw) < 131072
        parts.add(part)
        raw_parts.append(base64.b64decode(json.loads(raw)['gz'], validate=True))
    raw = gzip.decompress(b''.join(raw_parts))
    assert hashlib.sha256(raw).hexdigest() == digest
    if row['kind'] == 'js':
        scripts[digest] = raw
with tempfile.TemporaryDirectory() as temp:
    files = []
    for digest, raw in scripts.items():
        target = Path(temp) / (digest + '.js')
        target.write_bytes(raw)
        files.append(target)
    def check(path):
        subprocess.run(['node', '--check', str(path)], check=True, capture_output=True)
    with ThreadPoolExecutor(max_workers=4) as pool:
        list(pool.map(check, files))
print(json.dumps({'scriptSyntaxPass': len(scripts), 'exactPayloads': len(payloads), 'boundedParts': len(parts)}))
