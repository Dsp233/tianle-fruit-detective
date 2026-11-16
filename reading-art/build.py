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

def write(path, body, verify=False):
    target = ROOT / path
    if verify:
        if target.read_bytes() != body:
            raise ValueError(f'Release bytes differ from the verified build: {path}')
        return
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_bytes(body)

def pack(body, verify=False):
    compressed = gzip.compress(body, mtime=0)
    parts = []
    for start in range(0, len(compressed), 85000):
        item = json.dumps({'gz': base64.b64encode(compressed[start:start + 85000]).decode()},
                          separators=(',', ':')).encode()
        path = f'assets/reading-art/{sha(item)}.json'
        write(path, item, verify)
        parts.append(path)
    return {'id': sha(body), 'kind': 'js', 'bytes': len(body), 'gzipBytes': len(compressed), 'parts': parts}

def build(partial=False, verify=False):
    config = json.loads(CONFIG.search(baseline('index.html').decode())[2])
    data = json.loads(packet(config['reading']['data'][0]))
    scenes = json.loads((ROOT / 'reading-art/scenes.json').read_text())
    records = json.loads((ROOT / 'reading-art/assets.json').read_text())
    if [row['day'] for row in scenes] != list(range(1, 85)):
        raise ValueError('Scene inventory must cover days 1–84')
    if not partial and set(records) != {str(day) for day in range(1, 85)}:
        raise ValueError('Release requires every day')
    materials = {row['id']: row for row in data['materials']}
    mapping = {}
    used = set()
    bound = set()
    release_files = {}
    for scene in scenes:
        expected = [row['text'] for row in scene['panels']]
        if len(expected) != 3 or len(scene['materials']) != 2:
            raise ValueError('Every day has three panels shared by exactly two materials')
        for material in scene['materials']:
            item = materials[material]
            if material in bound or item['courseId'] != 'R2-84D-20261031' or item['day'] != scene['day']:
                raise ValueError(f'Incorrect or repeated material: {material}')
            bound.add(material)
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
        release_files[path] = Path(path).stem
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
    home_art = "window.ReadingComic.panel({scene:'library',cast:['tianle','xiaohe','tuantuan'],action:'read',prop:'book'},0)"
    if js.count(home_art) != 1:
        raise ValueError('Unexpected reading landing artwork')
    js = js.replace(home_art, f"storyArtByMaterial[m?.id] ? storyArt(m,m.panels[0],0) : {home_art}")
    scripts = [pack(js.encode(), verify)]
    for part in scripts[0]['parts']:
        release_files[part] = Path(part).stem
    for path in ENTRIES:
        html = baseline(path).decode()
        old = json.loads(CONFIG.search(html)[2])
        assert old['reading']['data'] == config['reading']['data']
        old['reading']['scripts'] = scripts
        html = CONFIG.sub(lambda match: match[1] + json.dumps(old, ensure_ascii=False,
                            separators=(',', ':')) + match[3], html)
        write(path, html.encode(), verify)
        release_files[path] = sha(html.encode())
    receipt = {'baseline':BASE, 'days':len(used), 'positions':3*len(mapping), 'partial':partial,
                      'readingDataSha256':config['reading']['data'][0]['id'], 'scripts':scripts[0]['id'],
            'files': release_files}
    if not partial:
        write('reading-art/release.json', (json.dumps(receipt, indent=2) + '\n').encode(), verify)
    return receipt

if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--partial-review', action='store_true',
                        help='Local review only. Missing days retain the baseline artwork.')
    parser.add_argument('--verify-release', action='store_true',
                        help='Require full cover and compare bytes without writing anything.')
    args = parser.parse_args()
    if args.partial_review and args.verify_release:
        parser.error('Release verification cannot accept partial assets.')
    print(json.dumps(build(partial=args.partial_review, verify=args.verify_release)))
