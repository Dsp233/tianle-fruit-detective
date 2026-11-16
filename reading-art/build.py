"""Build a review candidate from exact deployed bytes, without rewriting lesson data."""
import argparse
import base64
import gzip
import hashlib
import json
import re
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
BASE = '2c997d120b93622929ff241a2adbad8e35de7e84'
ENTRIES = ('index.html', 'amc8/index.html', 'source/index.html')
CONFIG = re.compile(r'(<script id="learning-delivery" type="application/json">)(.*?)(</script>)')

def baseline(path):
    return subprocess.check_output(['git', 'show', f'{BASE}:{path}'], cwd=ROOT)

def sha(body):
    return hashlib.sha256(body).hexdigest()

def packet(row):
    body = gzip.decompress(b''.join(base64.b64decode(json.loads(baseline(path))['gz'])
                                    for path in row['parts']))
    if sha(body) != row['id']:
        raise ValueError('Baseline packet hash mismatch')
    return body

def write(path, body):
    target = ROOT / path
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_bytes(body)

def pack(body):
    compressed = gzip.compress(body, mtime=0)
    parts = []
    for start in range(0, len(compressed), 85000):
        item = json.dumps({'gz': base64.b64encode(compressed[start:start + 85000]).decode()},
                          separators=(',', ':')).encode()
        path = f'assets/reading-art/{sha(item)}.json'
        write(path, item)
        parts.append(path)
    return {'id': sha(body), 'kind': 'js', 'bytes': len(body), 'gzipBytes': len(compressed), 'parts': parts}

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--partial-review', action='store_true',
                        help='Local review only. Missing days retain the baseline artwork.')
    args = parser.parse_args()
    config = json.loads(CONFIG.search(baseline('index.html').decode())[2])
    data = json.loads(packet(config['reading']['data'][0]))
    scenes = json.loads((ROOT / 'reading-art/scenes.json').read_text())
    records = json.loads((ROOT / 'reading-art/assets.json').read_text())
    if [row['day'] for row in scenes] != list(range(1, 85)):
        raise ValueError('Scene inventory must cover days 1–84')
    if not args.partial_review and set(records) != {str(day) for day in range(1, 85)}:
        raise ValueError('Release requires every day')
    materials = {row['id']: row for row in data['materials']}
    mapping = {}
    used = set()
    for scene in scenes:
        expected = [row['text'] for row in scene['panels']]
        for material in scene['materials']:
            if [row['text'] for row in materials[material]['panels']] != expected:
                raise ValueError(f'Illustration text drift for {material}')
        day = str(scene['day'])
        if day not in records:
            continue
        record = records[day]
        path = record['path']
        if (not re.fullmatch(r'assets/reading-art/[0-9a-f]{64}\.webp', path)
                or sha((ROOT / path).read_bytes()) != Path(path).stem or path in used):
            raise ValueError(f'Invalid or repeated asset on day {day}')
        used.add(path)
        if record['sceneSha256'] != sha('\n'.join(expected).encode()):
            raise ValueError(f'Art is bound to a different passage on day {day}')
        if record['status'] != 'ready':
            raise ValueError(f'Art requires correction on day {day}')
        cuts = record.get('cuts', [0, record['height'] // 3, 2 * record['height'] // 3, record['height']])
        if len(cuts) != 4 or cuts[0] != 0 or cuts[-1] != record['height'] or cuts != sorted(set(cuts)):
            raise ValueError(f'Invalid panel boundaries for day {day}')
        record['cuts'] = cuts
        for material in scene['materials']:
            mapping[material] = {key: record[key] for key in ('path', 'width', 'height', 'cuts')}

    js = packet(config['reading']['scripts'][0]).decode()
    needle = ' function comic(m,s)'
    body = (ROOT / 'reading-art/render.js').read_text().replace('__ASSIGNMENTS__', json.dumps(mapping))
    if js.count(needle) != 1 or js.count('window.ReadingComic.panel(p,i)') != 1:
        raise ValueError('Unexpected baseline renderer')
    js = js.replace(needle, body + '\n' + needle)
    js = js.replace('window.ReadingComic.panel(p,i)', 'storyArt(m,p,i)')
    scripts = [pack(js.encode())]
    for path in ENTRIES:
        html = baseline(path).decode()
        old = json.loads(CONFIG.search(html)[2])
        assert old['reading']['data'] == config['reading']['data']
        old['reading']['scripts'] = scripts
        html = CONFIG.sub(lambda match: match[1] + json.dumps(old, ensure_ascii=False,
                            separators=(',', ':')) + match[3], html)
        write(path, html.encode())
    print(json.dumps({'days':len(used), 'positions':3*len(mapping), 'partial':args.partial_review,
                      'readingDataSha256':config['reading']['data'][0]['id'], 'scripts':scripts[0]['id']}))

if __name__ == '__main__':
    main()
