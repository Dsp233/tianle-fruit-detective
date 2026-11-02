#!/usr/bin/env python3
"""Reproduce the scoped challenge-context review denominator; not a teacher pass."""
import collections
import hashlib
import json
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
DICTIONARY_SHA = '5f294c01e6c6c0a1c8e329c79335a3f8e0b27d06bf1de7a99244b765892d1e5b'
CONTENT_SHA = '71e53b7035d8a7a415473ffe204e95095ec9cb1b7004d75f9c41bb59dd418325'
PINYIN_SHA = '86115b541fbc9f22370fedf23fe432f0a049fbc50620a540e88a46c8e7704d15'
previous = set('长行为数分只量应没重得还当都发便空少处种正角觉调校看划场待转和连更结要背教传着难藏朝差称弹倒地落折间乐似将强系单解乘表模假华弄薄担参给好恶服与予省散熟亲')
batch_one = set('中了会作供共冲几区卡号否哪大屏属度片相累识谁过那面须')
batch_two = set('的一不能有是果同可次个趟厘方这最合件把格增已前样乙明查以也需别蓝接或其路上于比盒观察他灯么限运从知说吗子并')
batch_three = set('包什经位色红盖里核留至均通且足余打放丁支除完平绿部各若化写排边簿本但示杂反六任何降列例信据句超刻缺底半无而立清员找丙助高内允许份池达价积封容些它雨去播失北事由取')
batch_four = set('之才造阿宁透光团致鸟期体钥匙既七耳机坏听块窗论勤适依择八搬章名温印台见注仅抄提含掉唯身尚道阻移描节沿某九拼读票被登式挡意搭套括头呢滑广站家映们盾射监逐受往车填涨兑答柜虑非眼旁儿抵添幅圈斜倍侧禁尺寸涂约追挑承声伴白告')

if len(sys.argv) != 2:
    raise SystemExit('Pass the pinned python-pinyin character dictionary JSON')
raw = Path(sys.argv[1]).read_bytes().rstrip(b'\n')
if hashlib.sha256(raw).hexdigest() != DICTIONARY_SHA:
    raise SystemExit('Dictionary does not match the reviewed version')
dictionary = json.loads(raw)
data = json.loads((HERE / 'candidate_reading_data.json').read_text(encoding='utf-8'))
if (data['contentHash'], data['pinyinHash']) != (CONTENT_SHA, PINYIN_SHA):
    raise SystemExit('Review applies only to the pinned content and pronunciation table')

fields = collections.Counter()
counts = collections.Counter()
unreviewed = []
unique = set()
for material in data['materials']:
    if material.get('courseId') != data['courseScope']['activeCourseId'] or material['kind'] != 'optional':
        continue
    for q in material['questions']:
        values = [('prompt', q['prompt']), ('hint', q['hint']), ('explanation', q['explanation'])]
        values += [(f'options[{i}]', value) for i, value in enumerate(q['options'])]
        values += [(f'items[{i}]', value) for i, value in enumerate(q.get('items', []))]
        for field, value in values:
            if not isinstance(value, str):
                continue
            fields[field.split('[')[0]] += 1
            unique.add(value)
            pins = data['pinyinTexts'].get(value)
            if not isinstance(pins, list) or len(pins) != len(value):
                raise ValueError(f'Unaligned challenge field: {q["id"]} {field}')
            for i, char in enumerate(value):
                if len(dictionary.get(str(ord(char)), '').split(',')) < 2:
                    continue
                batch = next((name for name, chars in [('previous', previous), ('batch_one', batch_one),
                    ('batch_two', batch_two), ('batch_three', batch_three), ('batch_four', batch_four)] if char in chars), None)
                if batch:
                    counts[batch] += 1
                else:
                    unreviewed.append({'day': material['day'], 'question': q['id'], 'field': field,
                                       'position': i, 'character': char, 'reading': pins[i]})
result = {'status': 'ASSISTANT_CONTEXT_REVIEW_ONLY', 'contentHash': CONTENT_SHA, 'pinyinHash': PINYIN_SHA,
          'fields': dict(fields), 'fieldOccurrences': sum(fields.values()), 'distinctTexts': len(unique),
          'dictionaryMultiReadingPositionsByReviewBatch': dict(counts), 'unreviewedPositions': unreviewed,
          'limitations': ['not independent teaching review', 'not actual audio', 'dictionary is an aid, not a proof of language correctness']}
print(json.dumps(result, ensure_ascii=False))
