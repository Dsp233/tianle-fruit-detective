#!/usr/bin/env python3
"""Candidate structural/fidelity checks. Not an independent educational review."""
import collections, copy, hashlib, itertools, json, subprocess, sys
from pathlib import Path
HERE=Path(__file__).resolve().parent;ROOT=HERE.parents[1]
sys.path.insert(0,str(HERE))
import build_course as b

# The test exercises the reproducible build and also verifies it is idempotent.
subprocess.run([sys.executable,str(HERE/'build_course.py')],check=True,stdout=subprocess.DEVNULL)
first=(HERE/'candidate_reading_data.json').read_bytes()
subprocess.run([sys.executable,str(HERE/'build_course.py')],check=True,stdout=subprocess.DEVNULL)
assert first==(HERE/'candidate_reading_data.json').read_bytes()
data=json.loads(first);base=b.load_baseline();source=b.load_story();materials={m['id']:m for m in data['materials']}
assert data['courseScope']['activeCourseId']==b.NEW
assert data['compatibility']['fromContentHash']==base['contentHash']
assert data['compatibility']['changedMaterialIds']==[]
for field in ('pinyinTexts','pinyinMap','phrases'):
 for key,value in base[field].items():assert data[field][key]==value
# Old materials and all old assessment questions are byte-equivalent in JSON data.
for old in base['materials']:
 now=copy.deepcopy(materials[old['id']]);assert now.pop('courseId')==b.OLD;assert now==old
for old,now0 in zip(base['diagnostics']['sets'],data['diagnostics']['sets']):
 now=copy.deepcopy(now0);assert now.pop('courseId')==b.OLD
 for f in now['forms']:
  for m in f['materials']:assert m.pop('courseId')==b.OLD
 assert now==old
assert len(data['lessons'])==84 and len(data['weeks'])==12
allq=[];counts=collections.Counter()
for old_day,lesson in zip(source['days'],data['lessons']):
 day=old_day['day'];assert lesson['day']==day and lesson['coreIds']==[f'R2-D{day:03d}-CORE']
 assert lesson['reserveIds']==[] and lesson['optionalIds']==[f'R2-D{day:03d}-EXTRA']
 core=materials[lesson['coreIds'][0]];extra=materials[lesson['optionalIds'][0]]
 assert core['kind']=='story' and extra['kind']=='optional'
 assert core['text']==extra['text']==''.join(p['text'] for p in core['panels'])
 assert core['exposureGroup']==extra['exposureGroup']
 assert core['source']['originalStory']==extra['source']['originalStory']==old_day['story']
 assert core['source']['originalTitle']==extra['source']['originalTitle']==old_day['title']
 assert len(core['questions'])==3 and len(extra['questions'])==1
 for q,original in zip(core['questions']+extra['questions'],old_day['questions']+[old_day['extra']]):
  assert q['id']=='R2-'+original['id'] and q['sourcePreviewId']==original['id'] and q['sourceQuestion']==original
  assert q['type']==original['type'] and q['explanation']==original['reason'] and q['hint']==original['hint']
  assert q['metadataStatus']=='unreviewed' and q['classification'] is None
  assert q['category'] is q['ability'] is q['errorType'] is None
  assert core['prerequisitesStatus']=='unreviewed' and q['targetWords']==[]
  if original['id'] not in {'S29-1','S30-1','S31-1'}:assert q['options']==original['options'] and q['answer']==original['answer']
  if original['id']=='S14-3':assert q['prompt']=='如果这次实际看到 3 颗，比团团猜的 6 颗少，哪句记录更准确？'
  elif original['id'] not in {'S32-X','S54-3'}:assert q['prompt']==original['prompt']
  counts[q['type']]+=1;allq.append(q)
 for m in (core,extra):
  for txt in [m['title'],m['text'],*[p['text'] for p in m['panels']],*[s for q in m['questions'] for s in [q['prompt'],q['explanation'],q['hint'],*q['options'],*q.get('items',[])]]]:
   pins=data['pinyinTexts'][txt];assert len(txt)==len(pins)
   assert all(p for c,p in zip(txt,pins) if b.HAN.fullmatch(c)),f'Missing pinyin: {txt}'
assert len(allq)==336 and len({q['id'] for q in allq})==336 and counts==collections.Counter({'choice':308,'order':7,'cargo':2,'classification':2,'grid':2,'allocation':2,'manifest':2,'match':1,'route':1,'departure':1,'pair':1,'sequence':1,'loop':1,'rule':1,'purchase':1,'anypair':1,'strip':1,'mirror':1})
q={x['sourcePreviewId']:x for x in allq}
assert q['S29-1']['matchLeft']==['A','B','C'] and q['S29-1']['answer']==[0,1,2]
assert q['S30-1']['options']==['S','A','B','C','D','T'] and q['S30-1']['route']['acceptedRoutes']==[[0,2,3,5]]
assert q['S31-1']['answer']==575 and q['S31-1']['departure']=={'min':540,'max':600,'step':1,'initial':570}
assert q['S41-1']['options']==['甲','乙'] and q['S41-1']['answer']==['ABAB','ABBA','BAAB','BABA']
assert q['S64-1']['options']==['不重叠','重叠 1 厘米','重叠 2 厘米'] and q['S64-1']['answer']=='overlap:1'
assert '小禾在 9:08 把包裹交回阿宁、阿宁在 9:12 又交给小禾' in q['S32-X']['prompt']
assert 'A 和 B 放在第一趟' not in materials['R2-D033-CORE']['text']
assert materials['R2-D054-CORE']['title']=='选择底板和标签' and '打算用' in q['S54-3']['prompt']
assert '每组 4 枚' not in materials['R2-D074-CORE']['text']
assert '长出来的那一厘米可以藏到接头里' not in materials['R2-D064-CORE']['text']
assert '剩下一枚' not in materials['R2-D077-CORE']['text']
assert '最后一枚给第三组' not in materials['R2-D077-CORE']['text']
assert 'fēn' in data['pinyinTexts']['小禾想试试各组分得一样多，团团想试试不完全一样的分法。两人都准备核对自己的方案。']
t='小禾想试试各组分得一样多，团团想试试不完全一样的分法。两人都准备核对自己的方案。';assert data['pinyinTexts'][t][t.index('得')]=='de'
for name,expected in [('S33-1',3),('S34-1',1)]:
 c=q[name]['cargo'];solutions=[v for v in itertools.product([1,2],repeat=3) if all(v[i]==1 for i in c['firstRequired']) and all(v[a]<v[z] for a,z in c['strictBefore']) and all(sum(w for w,t in zip(c['weights'],v) if t==trip)<=c['capacity'] for trip in (1,2))]
 assert len(solutions)==expected
for name,expected in [('S74-1',10),('S77-1',3)]:
 c=q[name]['allocation'];sol=[v for v in itertools.product(range(c['total']+1),repeat=len(c['minimum'])) if sum(v)==c['total'] and all(x>=y for x,y in zip(v,c['minimum']))];assert len(sol)==expected
for name in ('S82-1','S83-1'):
 c=q[name]['manifest'];sol=[v for v in itertools.product((1,2),repeat=len(c['weights'])) if all(v[i]==1 for i in c['firstRequired']) and all(sum(w for w,t in zip(c['weights'],v) if t==trip)<=c['capacity'] and v.count(trip)<=c['maxItems'] for trip in (1,2))];assert len(sol)==2
print(json.dumps({'status':'PASS_STRUCTURAL_FIDELITY_ONLY','days':84,'core':252,'extra':84,'oldMaterialsPreserved':252,'oldDiagnosticSetsPreserved':13,'sourceTasksPreserved':336,'multiSolutionCasesChecked':6,'independentTeachingAudioDeviceChildReview':'NOT_RUN'},ensure_ascii=False))
