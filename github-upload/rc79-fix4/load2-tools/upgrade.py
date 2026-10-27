"""Upgrade existing LOAD1 pages to bounded LOAD2 transport without changing learning rules."""
import argparse
import base64
import gzip
import hashlib
import json
from pathlib import Path
import re
import subprocess
import tempfile

HERE = Path(__file__).resolve().parent
SCRIPT = re.compile(r'<script\b([^>]*)>([\s\S]*?)</script>', re.I)
CONFIG = re.compile(r'<script id="learning-delivery" type="application/json">([\s\S]*?)</script>')
EARLY = """<script>window.__AMC8_BOOT_READY=false;document.addEventListener('click',function(e){if(window.__AMC8_BOOT_READY)return;var b=e.target.closest&&e.target.closest('[data-action]');if(!b)return;var a=b.getAttribute('data-action');if(a==='reading'||a==='rdParent'||a==='home'){window.__AMC8_PENDING_ACTION=a;var s=document.getElementById('learning-load-status');if(s){s.hidden=false;s.textContent='正在打开学习频道，请稍等…';}}});</script>"""


def compact(value):
    return json.dumps(value, ensure_ascii=False, separators=(',', ':'))


class Upgrade:
    def __init__(self, root):
        self.root = root
        self.assets = root / 'assets/loading-r2'
        self.assets.mkdir(parents=True, exist_ok=True)
        self.cache = {}
        self.pages = []
        self.identities = []
        self.proofs = []
        self.projected_reading = None
        self.part_sizes = {}

    def asset(self, raw, ext):
        if isinstance(raw, str):
            raw = raw.encode('utf-8')
        digest = hashlib.sha256(raw).hexdigest()
        target = self.assets / (digest + '.' + ext)
        target.write_bytes(raw)
        return target.relative_to(self.root).as_posix()

    def payload(self, source, kind, key=None):
        raw = source.encode('utf-8') if isinstance(source, str) else source
        digest = hashlib.sha256(raw).hexdigest()
        cache_key = (kind, digest)
        if cache_key not in self.cache:
            compressed = gzip.compress(raw, compresslevel=9, mtime=0)
            assert gzip.decompress(compressed) == raw
            parts = []
            for offset in range(0, len(compressed), 90000):
                part = compact({'gz': base64.b64encode(compressed[offset:offset+90000]).decode('ascii')}).encode()
                assert len(part) < 131072
                path = self.asset(part, 'json')
                self.part_sizes[path] = len(part)
                parts.append(path)
            result = {'id': digest, 'kind': kind, 'parts': parts, 'bytes': len(raw), 'gzipBytes': len(compressed)}
            self.cache[cache_key] = result
            self.identities.append({'kind': kind, 'sha256': digest, 'bytes': len(raw), 'roundTripExact': True})
        row = dict(self.cache[cache_key])
        if key:
            row['key'] = key
        return row

    def reading_projection(self, config):
        if self.projected_reading is None:
            data_path = self.root / config['reading']['data'][0]['json']
            code_path = self.root / config['reading']['scripts'][0]
            with tempfile.TemporaryDirectory() as temp:
                output, proof = Path(temp) / 'reading.json', Path(temp) / 'proof.json'
                subprocess.run(['node', str(HERE / 'compact_reading.js'), str(data_path), str(code_path), str(output), str(proof)], check=True, capture_output=True, text=True)
                self.projected_reading = output.read_bytes()
                self.proofs.append(json.loads(proof.read_text()))
        return self.projected_reading

    def rows(self, config, channel):
        old = config[channel] if channel else config
        data, optional = [], []
        for row in old.get('data', []):
            raw = self.reading_projection(config) if row['key'] == '__AMC8_READING_DATA' and channel == 'reading' else (self.root / row['json']).read_bytes()
            target = optional if channel == 'math' and row['key'] == '__AMC8_REUSE_REVIEWS' else data
            target.append(self.payload(raw, 'json', row['key']))
        scripts = [self.payload((self.root / path).read_bytes(), 'js') for path in old.get('scripts', [])]
        return {'data': data, 'scripts': scripts, **({'optionalData': optional} if optional else {})}

    def run(self):
        old_report = json.loads((self.root / 'muse/rc79/loading-r1/package-report.json').read_text())
        for entry in old_report['pages']:
            path = self.root / entry['path']
            text = path.read_text()
            original_size = len(text.encode())
            match = CONFIG.search(text)
            portal = ''
            if match:
                old = json.loads(match[1])
                if old.get('legacy'):
                    config = {'revision': 'RC79-LOAD2', 'base': old['base'], 'legacy': True, **self.rows(old, None)}
                else:
                    config = {key: old[key] for key in ['base', 'store', 'autoMath', 'hasAfter']}
                    config.update(revision='RC79-LOAD2', math=self.rows(old, 'math'), reading=self.rows(old, 'reading'))
                    for script in SCRIPT.finditer(text):
                        src = re.search(r'\bsrc="([^"]+)"', script[1])
                        if src:
                            code = (path.parent / src[1]).resolve().read_text()
                            if 'const LearningPortal=' in code:
                                portal = code
                    assert portal, entry['path']
                text = CONFIG.sub('', text)
                # Existing inline release data stays; remove the two external bootstrap scripts.
                text = SCRIPT.sub(lambda m: '' if re.search(r'\bsrc=', m[1]) else m[0], text)
            else:
                sources = []
                for script in SCRIPT.finditer(text):
                    if 'application/json' in script[1]:
                        continue
                    src = re.search(r'\bsrc="([^"]+)"', script[1])
                    sources.append((path.parent / src[1]).resolve().read_bytes() if src else script[2].encode())
                if not any(s.strip() for s in sources):
                    self.pages.append({'path': entry['path'], 'beforeBytes': original_size, 'afterBytes': original_size, 'mode': 'static-page'})
                    continue
                # HTML5 allows omitted head/body tags. Small read-only maintenance
                # tools need no transport loader at all; inline their exact original
                # code rather than inserting into a nonexistent closing body tag.
                if '</body>' not in text.lower() and sum(len(s) for s in sources) < 16384:
                    code = b'\n'.join(sources).decode('utf-8')
                    assert '</script' not in code.lower()
                    text = SCRIPT.sub(lambda m: m[0] if 'application/json' in m[1] else '', text)
                    boot = '<script>' + code + '\nwindow.__AMC8_MAINTENANCE_READY=true;</script>'
                    text = text.replace('</html>', boot + '</html>') if '</html>' in text else text + boot
                    path.write_text(text)
                    self.pages.append({'path':entry['path'], 'beforeBytes':original_size, 'afterBytes':len(text.encode()), 'mode':'inline-small-maintenance', 'originalScriptSha256':hashlib.sha256(code.encode()).hexdigest()})
                    continue
                import os
                base = os.path.relpath(self.root, path.parent).replace(os.sep, '/') + '/'
                config = {'revision': 'RC79-LOAD2', 'base': base, 'legacy': True, 'data': [], 'scripts': [self.payload(source, 'js') for source in sources if source.strip()]}
                text = SCRIPT.sub(lambda m: m[0] if 'application/json' in m[1] else '', text)
            if 'id="learning-load-status"' not in text:
                status = '<div id="learning-load-status" role="status" aria-live="polite" hidden></div>'
                if re.search(r'<body\b', text):
                    text = re.sub(r'<body([^>]*)>', r'<body\1>' + status, text, count=1)
                else:
                    text += status
            text = text.replace('"deliveryRevision":"RC79-LOAD1"', '"deliveryRevision":"RC79-LOAD2"')
            text = text.replace('</head>', EARLY + '\n</head>')
            # Install the early event queue before stylesheets can delay later inline scripts.
            text = text.replace(EARLY, '')
            if '<head>' in text:
                text = text.replace('<head>', '<head>\n' + EARLY, 1)
            elif re.search(r'<!doctype[^>]*>', text, re.I):
                text = re.sub(r'(<!doctype[^>]*>)', lambda m: m[1] + EARLY, text, count=1, flags=re.I)
            else:
                text = EARLY + text
            decoder = (HERE / 'pako_inflate.min.js').read_text()
            loader = (HERE / 'loader.js').read_text()
            assert '</script' not in decoder.lower() and '</script' not in loader.lower()
            boot = '<script id="learning-delivery" type="application/json">' + compact(config).replace('<', '\\u003c') + '</script>\n'
            if portal:
                boot += '<script>' + portal + '</script>\n'
            boot += '<script>' + decoder + '\n' + loader + '</script>\n'
            text = text.replace('</body>', boot + '</body>') if '</body>' in text else text + boot
            assert 'id="learning-delivery"' in text, 'Missing bootstrap integration: ' + entry['path']
            path.write_text(text)
            channels = {}
            for channel in ['reading', 'math'] if not config.get('legacy') else []:
                rows = config[channel]['data'] + config[channel]['scripts']
                paths = set(p for row in rows for p in row['parts'])
                extra = config[channel].get('optionalData', [])
                extra_paths = set(p for row in extra for p in row['parts'])
                channels[channel] = {'networkBytes': sum(self.part_sizes[p] for p in paths), 'requests': len(paths), 'decodedDataBytes': sum(r['bytes'] for r in config[channel]['data']), 'decodedCodeBytes': sum(r['bytes'] for r in config[channel]['scripts']), 'optionalDataBytes': sum(r['bytes'] for r in extra), 'optionalNetworkBytes': sum(self.part_sizes[p] for p in extra_paths)}
            self.pages.append({'path': entry['path'], 'beforeBytes': original_size, 'afterBytes': len(text.encode()), 'mode': 'bounded-compressed-inline-bootstrap', 'channels': channels})
        notice = self.root / 'third-party-notices/pako-1.0.11.txt'
        notice.parent.mkdir(parents=True, exist_ok=True)
        notice.write_text((HERE / 'PAKO-LICENSE.txt').read_text())
        report = {'revision': 'RC79-LOAD2', 'baseline': 'ecd6c6a87047378f41629c9b3afdf90f657a3b0c', 'pages': self.pages, 'payloads': self.identities, 'transportPartCount': len(self.part_sizes), 'maxTransportPartBytes': max(self.part_sizes.values()), 'pinyinProjection': self.proofs, 'rawLargeJsonFallback': False, 'requiresNativeDecompression': False, 'storageSchemaChanged': False, 'gradingChanged': False, 'completeVersionVerification': 'NOT_RUN_USER_REQUESTED'}
        target = self.root / 'muse/rc79/loading-r2/package-report.json'
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n')
        print(compact({'pages': len(self.pages), 'maxPart': report['maxTransportPartBytes'], 'main': next(x for x in self.pages if x['path'] == 'index.html'), 'pinyinProjection': self.proofs}))


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('root', type=Path)
    Upgrade(parser.parse_args().root.resolve()).run()
