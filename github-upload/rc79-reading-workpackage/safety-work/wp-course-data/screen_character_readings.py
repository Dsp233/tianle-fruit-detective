#!/usr/bin/env python3
"""Screen active-course character readings against a pinned external dictionary.

The report is a review aid, not a contextual pronunciation or language pass.
Supply pypinyin/pinyin_dict.json from the commit identified below; it is not a
runtime dependency and is deliberately not included in the release package.
"""
import argparse, collections, hashlib, json
from pathlib import Path

HERE = Path(__file__).resolve().parent
DICTIONARY_SHA_WITHOUT_FINAL_NEWLINES = '5f294c01e6c6c0a1c8e329c79335a3f8e0b27d06bf1de7a99244b765892d1e5b'

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('dictionary', type=Path)
parser.add_argument('--core-nonprimary', action='store_true', help='List non-primary candidate readings in core content, excluding the previously reviewed common set')
args = parser.parse_args()
raw = args.dictionary.read_bytes()
if hashlib.sha256(raw.rstrip(b'\n')).hexdigest() != DICTIONARY_SHA_WITHOUT_FINAL_NEWLINES:
    raise SystemExit('Character dictionary differs from the reviewed pinned input')
reference = json.loads(raw)
data = json.loads((HERE / 'candidate_reading_data.json').read_text(encoding='utf-8'))
course = data['courseScope']['activeCourseId']
texts = collections.defaultdict(set)
for material in data['materials']:
    if material.get('courseId') != course or (args.core_nonprimary and material.get('kind') != 'story'):
        continue
    day = material['day']
    for value in [material['title'], *(panel['text'] for panel in material['panels'])]:
        texts[value].add(day)
    for question in material['questions']:
        for value in [question['prompt'], question['hint'], question['explanation'], *question['options'], *question.get('items', [])]:
            texts[value].add(day)

issues = []
positions = 0
for value, days in texts.items():
    pins = data['pinyinTexts'].get(value)
    if not isinstance(pins, list) or len(pins) != len(value):
        issues.append({'kind': 'unaligned', 'days': sorted(days), 'text': value})
        continue
    for index, char in enumerate(value):
        if not '\u3400' <= char <= '\u9fff':
            continue
        positions += 1
        candidates = reference.get(str(ord(char)), '').split(',')
        if not pins[index] or pins[index] not in candidates:
            issues.append({'kind': 'character_dictionary_mismatch', 'days': sorted(days), 'text': value,
                           'position': index, 'character': char, 'reading': pins[index], 'dictionary': candidates})
        elif args.core_nonprimary and char not in '长行为数分只量应没重得还当都发便空少处种正角觉' and len(candidates) > 1 and pins[index] != candidates[0]:
            issues.append({'kind': 'nonprimary_reading_to_review', 'days': sorted(days), 'text': value,
                           'position': index, 'character': char, 'reading': pins[index], 'dictionary': candidates})
print(json.dumps({'result': 'SCREEN_ONLY_NOT_CONTEXT_REVIEW', 'course': course, 'contentHash': data['contentHash'],
                  'pinyinHash': data['pinyinHash'], 'scope': 'core_nonprimary' if args.core_nonprimary else 'active_course',
                  'uniqueTexts': len(texts), 'hanPositions': positions,
                  'issues': issues}, ensure_ascii=False))
