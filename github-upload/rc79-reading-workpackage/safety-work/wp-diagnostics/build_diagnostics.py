#!/usr/bin/env python3
"""Create isolated draft diagnostic material. Never modifies a live bank.

Question labels, prerequisites and blueprint alignment remain unreviewed; the
output deliberately cannot be treated as an enabled or equated assessment.
"""
import argparse
import ast
import copy
import hashlib
import json
import operator
from pathlib import Path

from math_cases import MATH_CASES
from reading_cases import CASES

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[1]
COURSE = ROOT / 'safety-work/wp-course-data/candidate_reading_data.json'
BASE = ROOT / 'safety-work/baseline/source/reading_data.js'
BASE_SHA = '0c8ad843af039308d749ce44f75ad74577b5fce96ffd009e18f770b13c849358'
BASE_CONTENT = 'caf6da5a174e84c77412909b259c9eea972f6e72a15a0a91649d940d6eb7fcdf'
REV = '98cfd12797013845c4771719778b9b5f62214308'


def canonical(x):
    return json.dumps(x, ensure_ascii=False, sort_keys=True, separators=(',', ':'))


def digest(x):
    return hashlib.sha256(x).hexdigest()


def load_old(path):
    raw = path.read_bytes()
    if digest(raw) != BASE_SHA:
        raise ValueError('FIX15 reading baseline does not match the pinned SHA-256')
    prefix = 'window.__AMC8_READING_DATA='
    text = raw.decode('utf-8')
    if text.count(prefix) != 1 or not text.rstrip().endswith(';'):
        raise ValueError('FIX15 reading baseline format differs')
    data = json.loads(text.split(prefix, 1)[1].strip()[:-1])
    if data['contentHash'] != BASE_CONTENT:
        raise ValueError('Unexpected baseline content version')
    return data


def check_old_preserved(course, old):
    old_sets = old['diagnostics']['sets']
    legacy = [s for s in course['diagnostics']['sets'] if s.get('courseId') == 'R1-LEGACY']
    if len(legacy) != 13 or len(old_sets) != 13:
        raise ValueError('Expected all 13 legacy diagnostic sets')
    stripped = copy.deepcopy(legacy)
    for s in stripped:
        if s.pop('courseId') != 'R1-LEGACY':
            raise ValueError('Unexpected legacy course ID')
        for f in s['forms']:
            for m in f['materials']:
                if m.pop('courseId') != 'R1-LEGACY':
                    raise ValueError('Unexpected legacy material ID')
    if stripped != old_sets:
        raise ValueError('Legacy diagnostic content changed; stop')
    return digest(canonical(legacy).encode('utf-8'))


def choices(correct, wrong1, wrong2, answer_position):
    if len({correct, wrong1, wrong2}) != 3 or not all(isinstance(x, str) and x for x in (correct, wrong1, wrong2)):
        raise ValueError('Options must be three distinct, non-empty strings')
    values = [wrong1, wrong2]
    values.insert(answer_position, correct)
    return values


def question(qid, prompt, correct, wrong1, wrong2, explanation, position, slot):
    return {
        'id': qid, 'type': 'choice', 'prompt': prompt,
        'options': choices(correct, wrong1, wrong2, position), 'answer': position,
        'explanation': explanation, 'evidence': [], 'targetWords': [],
        'category': None, 'ability': None, 'errorType': None,
        'classification': None, 'metadataStatus': 'unreviewed',
        'proposedDesignSlot': slot,
    }


def material(mid, course_id, week, title, text, kind, questions, proposed_prereqs, model=None):
    result = {
        'id': mid, 'courseId': course_id, 'day': 7 * week, 'week': week,
        'kind': kind, 'title': title, 'text': text,
        'goal': '诊断材料草案，须先通过独立审校。', 'tags': [],
        'difficulty': None, 'focusWords': [], 'prerequisites': [],
        'prerequisitesStatus': 'unreviewed',
        'proposedPrerequisites': list(proposed_prereqs),
        'metadataStatus': 'unreviewed',
        'panels': [{'text': text, 'scene': 'library', 'action': 'read', 'prop': 'book',
                    'cast': ['tianle', 'xiaohe', 'tuantuan']}],
        'questions': questions,
    }
    if model is not None:
        result['model'] = model
    return result


def math_spec(index, row):
    """Return a scenario and machine-checkable model; drafts need human review."""
    title = row[0]
    if index == 0:
        _, place, item, unit, a, b = row
        text = f'{place}原来有{a}{unit}{item}，后来又增加{b}{unit}。两批都留在{place}。{place}现在有多少{unit}{item}？'
        q1, correct = '计算现在的总数，应怎样处理后来增加的数量？', '把后来增加的数量与原来的合起来'
        wrong = ('从原来的数量中减去后来增加的数量', '只统计后来增加的数量')
        expr, answer, prompt = f'{a}+{b}', a+b, f'{place}现在有多少{unit}{item}？'
        why = f'把原有的{a}{unit}和增加的{b}{unit}相加。'
    elif index == 1:
        _, who1, who2, item, unit, place, a, b = row
        text = f'{who1}准备了{a}{unit}{item}，{who2}又准备了{b}{unit}。两人准备的{item}全部放进{place}。{place}里共有多少{unit}{item}？'
        q1, correct = '求放进去的总数，应计算哪两份？', '两人准备的数量都计算在内'
        wrong = ('只计算第一人准备的数量', '只计算第二人准备的数量')
        expr, answer, prompt = f'{a}+{b}', a+b, f'{place}里共有多少{unit}{item}？'
        why = f'两人的{item}都放进去了，合并{a}{unit}和{b}{unit}。'
    elif index == 2:
        _, place, item, unit, a, b = row
        text = f'{place}里有{a}{unit}{item}，其中{b}{unit}已经送出，其余都留在{place}。{place}里还剩多少{unit}{item}？'
        q1, correct = '求剩余数量，已送出的部分应怎样处理？', '从原来的总数中去掉'
        wrong = ('再加入原来的总数', '只把已送出的部分当作剩余')
        expr, answer, prompt = f'{a}-{b}', a-b, f'{place}里还剩多少{unit}{item}？'
        why = f'从原来的{a}{unit}中减去送出的{b}{unit}。'
    elif index == 3:
        _, first, second, a, b = row
        unit = '厘米'
        text = f'{first}长{a}厘米，{second}比{first}长{b}厘米。{second}长多少厘米？'
        q1, correct = f'求{second}的长度时，比较的基准是什么？', f'{first}的长度'
        wrong = ('只把长出的部分当成全长', '两段长度的总和')
        expr, answer, prompt = f'{a}+{b}', a+b, f'{second}长多少厘米？'
        why = f'在{first}的{a}厘米上增加{b}厘米。'
    elif index == 4:
        _, place, group_unit, group, item, unit, a, b = row
        text = f'{place}有{a}{group_unit}，每{group}放{b}{unit}{item}。各{group}都按这个数量放置。{place}一共有多少{unit}{item}？'
        q1, correct = '哪项说明这些组可以用相同的数量计算？', f'每{group}都放{b}{unit}'
        wrong = (f'{place}有{a}{group_unit}', f'只知道{place}的名字')
        expr, answer, prompt = f'{a}*{b}', a*b, f'{place}一共有多少{unit}{item}？'
        why = f'把每{group}的{b}{unit}按{a}{group_unit}合起来。'
    elif index == 5:
        _, item, unit, group, group_unit, single, a, b = row
        verb = '放进' if group in ('信封','盒子') else '分给'
        text = f'现有{a}{unit}{item}，平均{verb}{b}{group_unit}{group}，全部分完，每{single}分到的数量相同。每{single}分到多少{unit}{item}？'
        q1, correct = '平均分配并且全部分完，表示什么？', '各份一样多，全部数量都分配出去'
        wrong = ('每份可以任意不同，也可以剩下', '只需要计算其中一份以外的数量')
        expr, answer, prompt = f'{a}//{b}', a//b, f'每{single}得到多少{unit}{item}？'
        why = f'将{a}{unit}{item}平均分成{b}份。'
    elif index == 6:
        _, place, item, unit, a, b, c = row
        text = f'{place}原有{a}{unit}{item}，先取出{b}{unit}，随后又放进{c}{unit}。期间没有其他变化。{place}里最后有多少{unit}{item}？'
        q1, correct = '数量先后发生了什么变化？', '先减少，再增加'
        wrong = ('先增加，再减少', '两次都减少')
        expr, answer, prompt = f'{a}-{b}+{c}', a-b+c, f'{place}里最后有多少{unit}{item}？'
        why = f'先从{a}{unit}中减去{b}{unit}，再加上放入的{c}{unit}。'
    elif index == 7:
        _, place, item, unit, other, other_unit, a, b, extra = row
        text = f'{place}里有{a}{unit}{item}，其中{b}{unit}损坏，暂时不能使用。旁边还有{extra}{other_unit}{other}，它们不是{item}。{place}里可用的{item}有多少{unit}？'
        q1, correct = '为什么旁边物品的数量不参加这道计数？', f'它们是{other}，不是要数的{item}'
        wrong = ('因为出现在后面的数字一律不用', '因为所有数字都应该相加')
        expr, answer, prompt = f'{a}-{b}', a-b, f'{place}里可用的{item}有多少{unit}？'
        why = f'从{a}{unit}{item}中去掉损坏的{b}{unit}，不把{other}算进去。'
    elif index == 8:
        _, item, unit, container, container_unit, a, b = row
        text = f'要将{a}{unit}{item}全部放进{container}。每{container_unit}{container}最多放{b}{unit}，最后一{container_unit}可以不装满。至少需要多少{container_unit}{container}？'
        q1, correct = f'装满一些{container}后，如果还有剩余物品，应怎样处理？', f'剩余物品也要有{container}来装'
        wrong = ('把剩余物品留在外面', '让每个容器超过题目规定的上限')
        expr, answer, prompt = f'({a}+{b}-1)//{b}', (a+b-1)//b, f'至少需要多少{container_unit}{container}？'
        unit = container_unit
        why = f'每{container_unit}最多放{b}{row[2]}，剩余不足一满份的物品也需要一{container_unit}。'
    elif index == 9:
        _, package, item, unit, a, b = row
        text = f'每份完整的{package}需要{b}{unit}{item}。现有{a}{unit}{item}，余下不足一份的可以留用。最多能做多少份完整的{package}？'
        q1, correct = '不足一整份的剩余材料应怎样计算？', '可以留下，但不算成完整的一份'
        wrong = ('自动算成完整的一份', '改变每份所需的数量')
        expr, answer, prompt = f'{a}//{b}', a//b, f'最多能做多少份完整的{package}？'
        unit = '份'
        why = f'每份需要{b}{row[3]}，余下不足一份的不计入完整份数。'
    elif index == 10:
        _, place, item, unit, a, b = row
        text = f'{place}原有一些{item}，取走{b}{unit}后还剩{a}{unit}。期间没有新增或其他取出。{place}原来有多少{unit}{item}？'
        q1, correct = '还原原来的数量，需要怎样处理取走的部分？', '把取走的部分加回剩余数量'
        wrong = ('从剩余数量里再减一次', '只把取走的部分当成原来数量')
        expr, answer, prompt = f'{a}+{b}', a+b, f'{place}原来有多少{unit}{item}？'
        why = f'原来数量由取走的{b}{unit}和剩下的{a}{unit}合成。'
    elif index == 11:
        _, first, second, item, unit, a, b = row
        text = f'{first}有{a}{unit}{item}，{second}比{first}少{b}{unit}。两部分的{item}没有重复计算。合起来有多少{unit}{item}？'
        q1, correct = f'先求{second}的数量，应该怎样使用“少{b}{unit}”？', f'从{first}的数量中减去{b}{unit}'
        wrong = (f'在{first}的数量上增加{b}{unit}', f'直接把{b}{unit}当成{second}的数量')
        expr, answer, prompt = f'{a}+({a}-{b})', a+(a-b), f'合起来有多少{unit}{item}？'
        why = f'先求{second}的数量，再与{first}的{a}{unit}相加。'
    elif index == 12:
        _, item, unit, group, group_unit, other, other_unit, a, b, c, extra = row
        text = f'准备了{a}{group_unit}{group}，每{group_unit}{group}装{b}{unit}{item}。从这些{item}中一共取出{c}{unit}，其余保留。旁边另有{extra}{other_unit}{other}，它们不是{item}。还剩多少{unit}{item}？'
        q1, correct = f'“一共取出{c}{unit}”应怎样使用？', '从全部合计的数量中减去一次'
        wrong = ('每一组都各减去一次', '把取出的数量再加入总数')
        expr, answer, prompt = f'{a}*{b}-{c}', a*b-c, f'还剩多少{unit}{item}？'
        why = f'先求{a}组各{b}{unit}的总数，再从总数中减去{c}{unit}；不计算{other}。'
    else:
        raise ValueError('Unexpected diagnostic set index')
    q1_explanation = f'检查题目给出的数量关系：{correct}。'
    return {'title':title,'text':text,'q1':q1,'q1correct':correct,'q1wrong':wrong,
            'expression':expr,'answer':answer,'unit':unit,'q2':prompt,'explanation':why,
            'q1explanation':q1_explanation}


def number_distractors(answer):
    candidates = (answer+1, max(0, answer-1), answer+2, 0, 1, 2)
    out = []
    for value in candidates:
        if value != answer and value not in out:
            out.append(value)
        if len(out) == 2:
            return out
    raise ValueError('Could not construct distinct distractors')


def arithmetic(expression):
    ops = {ast.Add: operator.add, ast.Sub: operator.sub, ast.Mult: operator.mul, ast.FloorDiv: operator.floordiv}
    def evaluate(node):
        if isinstance(node, ast.Constant) and type(node.value) is int and 0 <= node.value <= 1000:
            return node.value
        if isinstance(node, ast.BinOp) and type(node.op) in ops:
            return ops[type(node.op)](evaluate(node.left), evaluate(node.right))
        raise ValueError('Unexpected arithmetic expression')
    return evaluate(ast.parse(expression, mode='eval').body)


def build(course, old):
    legacy_hash = check_old_preserved(course, old)
    if len(CASES) != 14 or any(len(group) != 4 for group in CASES):
        raise ValueError('Expected 13 reading groups and one preserved reserve group')
    if len(MATH_CASES) != 13 or any(len(group) != 4 for group in MATH_CASES):
        raise ValueError('Expected exactly 13 groups of four math drafts')
    active = course['courseScope']['activeCourseId']
    sets = []
    for i, old_set in enumerate(old['diagnostics']['sets']):
        set_id = 'R2-DRAFT-' + old_set['id']
        week = old_set['week']
        forms = []
        for j, (reading, math) in enumerate(zip(CASES[i], MATH_CASES[i])):
            if len(reading) != 11 or not all(isinstance(x, str) and x for x in reading):
                raise ValueError('Malformed reading draft')
            rtitle, text, p1, a1, w11, w12, p2, a2, w21, w22, explanation = reading
            fid = f'R2-F{j+1}'
            mid = f'{set_id}-{fid}'
            positions = [(i*4+j+k)%3 for k in range(4)]
            read_questions = [
                question(mid+'-S-Q1',p1,a1,w11,w12,f'根据原文核对，正确选项是“{a1}”。',positions[0],'proposed-reading-fact'),
                question(mid+'-S-Q2',p2,a2,w21,w22,explanation,positions[1],'proposed-reading-inference'),
            ]
            draft = math_spec(i, math)
            if arithmetic(draft['expression']) != draft['answer']:
                raise ValueError('Math draft model is inconsistent')
            d1, d2 = number_distractors(draft['answer'])
            u = draft['unit']
            math_questions = [
                question(mid+'-M-Q1',draft['q1'],draft['q1correct'],*draft['q1wrong'],draft['q1explanation'],positions[2],'proposed-condition-identification'),
                question(mid+'-M-Q2',draft['q2'],f"{draft['answer']}{u}",f'{d1}{u}',f'{d2}{u}',
                         draft['explanation']+f" 计算结果是{draft['answer']}{u}。",positions[3],'proposed-mathematical-model'),
            ]
            forms.append({'id':fid,'materials':[
                material(mid+'-S',active,week,rtitle,text,'story',read_questions,[]),
                material(mid+'-M',active,week,draft['title'],draft['text'],'math',math_questions,
                         old_set['blueprint']['mathKnowledge'],
                         {'expression':draft['expression'],'result':draft['answer'],'unit':u,'status':'unreviewed'}),
            ]})
        sets.append({'id':set_id,'courseId':active,'week':week,'kind':old_set['kind'],
                     'metadataStatus':'unreviewed','availability':'disabled_pending_review',
                     'blueprint':{'skills':[],'mathKnowledge':[],'operations':None,
                                  'conditionCount':None,'distractorInformationCount':None,
                                  'metadataStatus':'unreviewed',
                                  'equatingStatus':'DRAFT_NOT_REVIEWED_NOT_EQUATED',
                                  'referenceLegacySet':old_set['id'],
                                  'referenceLegacyBlueprint':copy.deepcopy(old_set['blueprint'])},
                     'forms':forms})
    return {
        'schema':1,'status':'DRAFT_DISABLED_UNREVIEWED_NOT_EQUATED',
        'sourceCommit':REV,'baseCourseContentHash':course['contentHash'],
        'legacyDiagnosticSetsSha256':legacy_hash,'courseId':active,
        'sets':sets,
        'unusedReadingReserve':{'sourceGroupIndex':13,'cases':CASES[13], 'status':'unreviewed_not_assigned'},
        'limits':['Not yet approved for independent assessment or comparison.',
                  'Design slots and proposed prerequisites are hypotheses pending review.',
                  'No empirical form equivalence, independent teaching review, child or physical-device validation.',
                  'No exact pinyin or audio generated for these draft passages.',
                  'Existing engine must reject all unreviewed sets until separately reviewed.'],
    }


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--course',type=Path,default=COURSE)
    parser.add_argument('--baseline',type=Path,default=BASE)
    parser.add_argument('--out-dir',type=Path,default=HERE)
    args=parser.parse_args()
    course=json.loads(args.course.read_text(encoding='utf-8'))
    old=load_old(args.baseline)
    candidate=build(course,old)
    args.out_dir.mkdir(parents=True,exist_ok=True)
    output=args.out_dir/'diagnostic_draft.json'
    output.write_text(canonical(candidate)+'\n',encoding='utf-8')
    print(json.dumps({'status':candidate['status'],'sets':len(candidate['sets']),
                      'forms':sum(len(s['forms']) for s in candidate['sets']),
                      'questions':sum(len(m['questions']) for s in candidate['sets'] for f in s['forms'] for m in f['materials']),
                      'sha256':digest(output.read_bytes()),'legacySetsSha256':candidate['legacyDiagnosticSetsSha256']},ensure_ascii=False))


if __name__=='__main__':
    main()
