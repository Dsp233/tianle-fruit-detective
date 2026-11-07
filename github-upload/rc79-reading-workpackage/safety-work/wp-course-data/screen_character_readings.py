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
reviewed_neutral_guo = {
    '展牌的交接卡规定：先把纸条贴好，再检查尺寸和固定情况，检查合格后才能交给搬运员。三步都要完成。团团想先把空白交接卡签上“已检查”，这样看起来进度更快。小禾说：“签字应当记录已经做过的事。”天乐把三步做成能移动的卡片，准备按实际顺序排列，完成一项再记一项。': '做过',
    '团团想先把空白交接卡签上“已检查”，这样看起来进度更快。小禾说：“签字应当记录已经做过的事。”': '做过',
    '现在是十点十分。原计划十点半开始制作检查，用 15 分钟，再走 10 分钟近路，十一点之前送到北厅。工作人员刚确认近路关闭，20 分钟的远路仍可用。制作检查可以提前开始，其他要求不变，不能省略检查。天乐保留原计划，并写下新消息。他要改的是受路线影响的时间安排，不是把原来的计划假装从未写过。': '写过',
    '天乐保留原计划，并写下新消息。他要改的是受路线影响的时间安排，不是把原来的计划假装从未写过。': '写过',
    '近路从来没有开过，所以删掉旧计划。': '开过',
    '观察馆要给下一批小朋友留一本游戏手册。天乐挑了一个自己最喜欢的任务，想让没玩过的人也能照着试。小禾问：“你能画一张图，讲讲为什么这个办法行得通吗？”团团只写下一个答案，读起来很快，可大家不知道他解决的是哪道题。天乐把题目要求和自己的办法放在一起，又留出一块空白：“你有别的办法吗？可以画给我看。”大家准备交换手册，各自试一次。': '玩过',
    '观察馆要给下一批小朋友留一本游戏手册。天乐挑了一个自己最喜欢的任务，想让没玩过的人也能照着试。': '玩过',
    '哪种介绍最能让没玩过的人跟着试？': '玩过',
    '纸桥工坊旁边开了一个小集市。每进入一次体验区，就收一张入场票；同一个人可以离开后再进来。上午收到了 10 张票。门口记录显示：6 位小朋友各进了一次，另外 2 位各进了两次，没有其他人进入。团团准备写“十位小朋友来过”。天乐把来过的人与进入的次数分开画，发现这两个数未必相同。': ('小朋友来过','把来过'),
    '团团准备写“十位小朋友来过”。天乐把来过的人与进入的次数分开画，发现这两个数未必相同。': ('小朋友来过','把来过'),
    '按记录，上午共有多少位不同的小朋友来过？': '小朋友来过',
    '小禾和团团都提到东门，能算两个人各自看见过吗？': '看见过',
    '因为通知过一次就永远不能改。': '通知过',
    '删掉，假装从未说过西厅。': '说过',
    '观察馆要写一张介绍影子实验的卡片。实验使用同一张纸片，纸片和屏幕的位置不变，只设置两种灯距。甲设置测得 6 厘米，乙设置测得 9 厘米，各测了一次。这两条记录来自刚才的实验。换一张纸片再测，或者明天再做，结果还会一样吗？这些情况还没有试过。团团想把“乙的影子总比甲长 3 厘米”写成标题。小禾拿出三种标签：“本次记录”“猜测”“下一步”，准备把卡片整理清楚。': '试过',
    '这两条记录来自刚才的实验。换一张纸片再测，或者明天再做，结果还会一样吗？这些情况还没有试过。': '试过',
    '如果又查到：绿盒从 4 点封好后，直到小禾打开前都没打开过，那么 4 点封盒时观察簿在里面吗？': '打开过',
    '不可以，任何放弃过的方案都不能再用。': '放弃过',
    '随后新来一位小朋友，还没领过卡，应该怎样更新？': '领过',
    '按当前一人一卡规则，新成员新增一张发放；不取决于上午是否来过或库存余量。': '来过',
}
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
        # Reviewed erhua is aligned to two displayed characters: nǎ + r.
        # It is one syllable, so the suffix is intentionally not a dictionary
        # reading of the character 儿 in isolation.
        if char == '儿' and index > 0 and value[index-1:index+1] == '哪儿' and pins[index-1:index+1] == ['nǎ', 'r']:
            continue
        fragment = reviewed_neutral_guo.get(value)
        fragments = fragment if isinstance(fragment, tuple) else (fragment,)
        if char == '过' and pins[index] == 'guo' and any(f and value.count(f) == 1 and index == value.index(f) + len(f) - 1 for f in fragments):
            continue
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
