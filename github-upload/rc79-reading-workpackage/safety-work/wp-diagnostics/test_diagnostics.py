#!/usr/bin/env python3
"""Structural and arithmetic checks only, not educational equivalence."""
import collections
import copy
import hashlib
import json
import subprocess
import sys
import tempfile
from pathlib import Path

HERE=Path(__file__).resolve().parent
sys.path.insert(0,str(HERE))
import build_diagnostics as b
from math_cases import MATH_CASES
from reading_cases import CASES

course=json.loads(b.COURSE.read_text(encoding='utf-8'))
old=b.load_old(b.BASE)
before=b.canonical(course['diagnostics']['sets'])
with tempfile.TemporaryDirectory() as temp:
    output=Path(temp)
    command=[sys.executable,str(HERE/'build_diagnostics.py'),'--out-dir',str(output)]
    subprocess.run(command,check=True,stdout=subprocess.DEVNULL)
    first=(output/'diagnostic_draft.json').read_bytes()
    subprocess.run(command,check=True,stdout=subprocess.DEVNULL)
    assert first==(output/'diagnostic_draft.json').read_bytes()
    draft=json.loads(first)

assert b.canonical(course['diagnostics']['sets'])==before
assert draft['status']=='DRAFT_DISABLED_UNREVIEWED_NOT_EQUATED'
assert draft['baseCourseContentHash']==course['contentHash']
assert draft['legacyDiagnosticSetsSha256']==b.check_old_preserved(course,old)
assert draft['unusedReadingReserve']['sourceGroupIndex']==13
assert draft['unusedReadingReserve']['cases']==[list(row) for row in CASES[13]]
assert len(draft['sets'])==13 and [s['week'] for s in draft['sets']]==list(range(13))
legacy_ids={s['id'] for s in course['diagnostics']['sets']}
old_materials=course['materials']+[m for s in course['diagnostics']['sets'] for f in s['forms'] for m in f['materials']]
old_material_ids={m['id'] for m in old_materials}
old_qids={q['id'] for m in old_materials for q in m['questions']}
existing_texts={m['text'] for m in old_materials}
new_sets=set(); material_ids=set(); question_ids=set(); texts=set(); positions=collections.Counter(); nmath=0
for i,(s,reference) in enumerate(zip(draft['sets'],old['diagnostics']['sets'])):
    assert s['id']=='R2-DRAFT-'+reference['id'] and s['id'] not in legacy_ids
    assert s['id'] not in new_sets;new_sets.add(s['id'])
    assert s['metadataStatus']=='unreviewed' and s['availability']=='disabled_pending_review'
    assert s['blueprint']['metadataStatus']=='unreviewed'
    assert s['blueprint']['equatingStatus']=='DRAFT_NOT_REVIEWED_NOT_EQUATED'
    assert s['blueprint']['referenceLegacyBlueprint']==reference['blueprint']
    assert not s['blueprint']['skills'] and not s['blueprint']['mathKnowledge']
    assert len(s['forms'])==4 and len({f['id'] for f in s['forms']})==4
    # The production engine assigns the four conditions by rotation, not in
    # draft metadata. This checks the rotation, not clinical equivalence.
    assert sorted(['ABCD'[(j+s['week']%4)%4] for j in range(4)])==list('ABCD')
    for j,f in enumerate(s['forms']):
        assert f['id']==f'R2-F{j+1}' and 'condition' not in f and len(f['materials'])==2
        for m in f['materials']:
            assert m['courseId']==draft['courseId'] and m['id'] not in old_material_ids|material_ids
            material_ids.add(m['id'])
            assert m['metadataStatus']=='unreviewed' and m['prerequisitesStatus']=='unreviewed'
            assert m['prerequisites']==[] and len(m['questions'])==2
            assert m['text'] not in existing_texts and m['text'] not in texts
            texts.add(m['text'])
            for q in m['questions']:
                assert q['id'] not in old_qids|question_ids;question_ids.add(q['id'])
                assert q['metadataStatus']=='unreviewed' and q['classification'] is None
                assert q['category'] is q['ability'] is q['errorType'] is None
                assert 0<=q['answer']<3 and len(q['options'])==len(set(q['options']))==3
                assert q['prompt'] and q['explanation'] and q['type']=='choice'
                positions[q['answer']]+=1
        m=f['materials'][1]; model=m['model']; q=m['questions'][1]; row=MATH_CASES[i][j]
        assert model['status']=='unreviewed' and b.arithmetic(model['expression'])==model['result']
        assert q['options'][q['answer']]==str(model['result'])+model['unit']
        # Recalculate independently from the scenario's numeric inputs.
        if i in (0,1,3,10): expected=row[-2]+row[-1]
        elif i in (2,7): expected=row[-3]-row[-2] if i==7 else row[-2]-row[-1]
        elif i==4: expected=row[-2]*row[-1]
        elif i==5: expected=row[-2]//row[-1]; assert row[-2]%row[-1]==0
        elif i==6: expected=row[-3]-row[-2]+row[-1]
        elif i==8: expected=(row[-2]+row[-1]-1)//row[-1]; assert row[-2]%row[-1]!=0
        elif i==9: expected=row[-2]//row[-1]; assert row[-2]%row[-1]!=0
        elif i==11: expected=row[-2]+(row[-2]-row[-1])
        elif i==12: expected=row[-4]*row[-3]-row[-2]
        else: raise AssertionError(i)
        assert model['result']==expected; nmath+=1
assert len(material_ids)==104 and len(question_ids)==208 and nmath==52
assert max(positions.values())-min(positions.values())<=1
print(json.dumps({'result':'PASS_DRAFT_STRUCTURE_AND_ARITHMETIC_ONLY','sets':13,'forms':52,'materials':104,
                  'questions':208,'arithmeticModelsChecked':nmath,'legacySetsPreserved':13,
                  'exactTextCollisionsWithExistingBank':0,'answerPositions':dict(positions),
                  'humanEquivalencePinyinAudioDeviceChildReview':'NOT_RUN'},ensure_ascii=False))
