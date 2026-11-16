"""Build a W1 reading candidate from exact deployed bytes."""
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
LANGUAGE_EDITS = {
    12: (
        '路线只能沿图上写出的连接走，不走回头路。',
        '每段路都只能按上面说的方向走，不能反着走。',
        'měi duàn lù dōu zhǐ néng àn shàng miàn shuō de fāng xiàng zǒu _ bù néng fǎn zhe zǒu _',
    ),
    18: ('。我们可以继续检查音箱和连接处。', '。', '_'),
}
QUESTION_EDITS = {
    'R2-S20-1': {
        'prompt': (
            '这两次测试的记录直接说明了什么？',
            'zhè liǎng cì cè shì de jì lù zhí jiē shuō míng le shén me _',
        ),
    },
    'R2-S20-2': {
        'prompt': (
            '天乐为什么要在同一地点、用同一台设备和同一段录音，交替试开窗和关窗？',
            'tiān lè wèi shén me yào zài tóng yī dì diǎn _ yòng tóng yī tái shè bèi hé tóng yī duàn lù yīn _ jiāo tì shì kāi chuāng hé guān chuāng _',
        ),
        'options': [
            ('这样更容易看出，结果的变化是不是跟开关窗有关。', 'zhè yàng gèng róng yì kàn chū _ jié guǒ de biàn huà shì bù shì gēn kāi guān chuāng yǒu guān _'),
            ('这样能保证关窗时每次都多听清一个字。', 'zhè yàng néng bǎo zhèng guān chuāng shí měi cì dōu duō tīng qīng yī gè zì _'),
            ('这样就不用再记下周围有什么声音了。', 'zhè yàng jiù bù yòng zài jì xià zhōu wéi yǒu shén me shēng yīn le _'),
        ],
    },
}

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

def compact(value):
    return json.dumps(value, ensure_ascii=False, separators=(',', ':')).encode()


def pack(body, verify=False, kind='js'):
    compressed = gzip.compress(body, mtime=0)
    parts = []
    for start in range(0, len(compressed), 85000):
        item = json.dumps({'gz': base64.b64encode(compressed[start:start + 85000]).decode()},
                          separators=(',', ':')).encode()
        asset_dir = 'reading-art' if kind == 'js' else 'reading-quality'
        path = f'assets/{asset_dir}/{sha(item)}.json'
        write(path, item, verify)
        parts.append(path)
    row = {'id': sha(body), 'kind': kind, 'bytes': len(body),
           'gzipBytes': len(compressed), 'parts': parts}
    if kind == 'json':
        row['key'] = '__AMC8_READING_DATA'
    return row


def edit_language(data, runtime):
    """Edit only designated passage sentences and keep existing pronunciation offsets."""
    changed = []
    pinyin = data['pinyinTexts']
    def pronunciation(text, syllables):
        pins = [syllable if syllable != '_' else '' for syllable in syllables.split()]
        assert len(pins) == len(text), text
        return pins

    for material in data['materials']:
        if material['courseId'] != 'R2-84D-20261031':
            continue
        passage_edit = LANGUAGE_EDITS.get(material['day'])
        task_edits = [q for q in material['questions'] if q['id'] in QUESTION_EDITS]
        if passage_edit:
            before, after, syllables = passage_edit
            pins = pronunciation(after, syllables)
            text = material['text']
            assert text.count(before) == 1
            index = text.index(before)
            panels = [panel for panel in material['panels'] if before in panel['text']]
            assert len(panels) == 1
            panels[0]['text'] = panels[0]['text'].replace(before, after)
            revised = text.replace(before, after)
            assert revised == ''.join(panel['text'] for panel in material['panels'])
            if text in pinyin:
                source = pinyin[text]
                assert len(source) == len(text)
                pinyin[revised] = source[:index] + pins + source[index + len(before):]
            elif re.search(r'[\u3400-\u9fff]', after):
                data['phrases'][after] = pins
            material['text'] = revised
            runtime = runtime.replace(compact(text).decode(), compact(revised).decode())

        for question in task_edits:
            edits = QUESTION_EDITS[question['id']]
            for field, value in edits.items():
                previous = question[field]
                if field == 'options':
                    assert len(value) == len(previous)
                    updated = []
                    for text, pins in value:
                        pinyin[text] = pronunciation(text, pins)
                        updated.append(text)
                else:
                    updated, pins = value
                    pinyin[updated] = pronunciation(updated, pins)
                question[field] = updated
                runtime = runtime.replace(compact(previous).decode(), compact(updated).decode())
        if passage_edit or task_edits:
            changed.append(material['id'])

    assert changed
    data['compatibility'] = {
        **data['compatibility'],
        'fromContentHash': data['contentHash'],
        'changedMaterialIds': changed,
    }
    content_keys = ('materials', 'lessons', 'diagnostics', 'courseScope')
    data['contentHash'] = sha(compact({key: data[key] for key in content_keys}))
    data['pinyinHash'] = sha(compact(pinyin))
    return runtime

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
    if not partial and LANGUAGE_EDITS:
        js = edit_language(data, js)
        reading_data = [pack(compact(data), verify, kind='json')]
    else:
        reading_data = config['reading']['data']
    scripts = [pack(js.encode(), verify)]
    reading_files = reading_data[0]['parts'] if reading_data != config['reading']['data'] else []
    for part in scripts[0]['parts'] + reading_files:
        release_files[part] = Path(part).stem
    for path in ENTRIES:
        html = baseline(path).decode()
        old = json.loads(CONFIG.search(html)[2])
        assert old['reading']['data'] == config['reading']['data']
        old['reading']['data'] = reading_data
        old['reading']['scripts'] = scripts
        html = CONFIG.sub(lambda match: match[1] + json.dumps(old, ensure_ascii=False,
                            separators=(',', ':')) + match[3], html)
        write(path, html.encode(), verify)
        release_files[path] = sha(html.encode())
    receipt = {'baseline':BASE, 'days':len(used), 'positions':3*len(mapping), 'partial':partial,
                      'readingDataSha256':reading_data[0]['id'], 'scripts':scripts[0]['id'],
            'files': release_files}
    if not partial and LANGUAGE_EDITS:
        receipt['contentHash'] = data['contentHash']
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
