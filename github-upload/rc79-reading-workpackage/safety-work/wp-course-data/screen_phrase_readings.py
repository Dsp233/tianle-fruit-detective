#!/usr/bin/env python3
"""List possible phrase-level pinyin conflicts for human contextual review.

Substring matching crosses word boundaries and has regional/neutral-tone
false positives; none of its findings is an automatic correction or pass.
"""
import argparse, collections, hashlib, json
from pathlib import Path

HERE = Path(__file__).resolve().parent
PHRASE_SHA_WITHOUT_FINAL_NEWLINES = 'a45ff140a6b631ca9c82127b280a2f414e0aba6bb2824a0e9d1e77fff359c665'
parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('phrase_dictionary', type=Path)
args = parser.parse_args()
raw = args.phrase_dictionary.read_bytes()
if hashlib.sha256(raw.rstrip(b'\n')).hexdigest() != PHRASE_SHA_WITHOUT_FINAL_NEWLINES:
    raise SystemExit('Phrase dictionary differs from the reviewed pinned input')
phrases = json.loads(raw)
data = json.loads((HERE / 'candidate_reading_data.json').read_text(encoding='utf-8'))
course = data['courseScope']['activeCourseId']
texts = collections.defaultdict(set)
for material in data['materials']:
    if material.get('courseId') != course:
        continue
    for value in [material['title'], *(panel['text'] for panel in material['panels'])]:
        texts[value].add(material['day'])
    for question in material['questions']:
        for value in [question['prompt'], question['hint'], question['explanation'], *question['options'], *question.get('items', [])]:
            texts[value].add(material['day'])
issues = []
for value, days in texts.items():
    pins = data['pinyinTexts'].get(value)
    if not isinstance(pins, list) or len(pins) != len(value):
        issues.append({'kind': 'unaligned', 'days': sorted(days), 'text': value})
        continue
    for start in range(len(value)):
        for length in range(2, min(8, len(value) - start) + 1):
            word = value[start:start + length]
            expected = phrases.get(word)
            if not isinstance(expected, list) or len(expected) != length:
                continue
            for offset, char in enumerate(word):
                # The reader intentionally shows the underlying tones for 一
                # and 不, whereas the phrase table also encodes tone sandhi.
                if char in '一不':
                    continue
                allowed = expected[offset] if isinstance(expected[offset], list) else [expected[offset]]
                actual = pins[start + offset]
                if actual and actual not in allowed:
                    issues.append({'kind': 'phrase_candidate_conflict', 'days': sorted(days), 'text': value,
                                   'phrase': word, 'position': start + offset, 'character': char,
                                   'reading': actual, 'dictionary': allowed})
print(json.dumps({'result': 'SCREEN_ONLY_NOT_CONTEXT_REVIEW', 'course': course, 'contentHash': data['contentHash'],
                  'pinyinHash': data['pinyinHash'], 'uniqueTexts': len(texts), 'issues': issues}, ensure_ascii=False))
