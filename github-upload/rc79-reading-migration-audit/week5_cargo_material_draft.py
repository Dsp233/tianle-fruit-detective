"""Map two actual preview tasks to new-ID prototypes; do not alter the preview."""
import hashlib
import itertools
import json
from pathlib import Path

here=Path(__file__).resolve().parent
source=json.loads((here/'fixtures/pilot-v11-story.json').read_text(encoding='utf-8'))
days=source['days'][28:35]
canonical=json.dumps(days,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()
assert hashlib.sha256(canonical).hexdigest()=='1c7ccd40761f5e6f3f058962d468b74868896a1585c30fa02e54035146a5af30'
evidence={33:['A 重 3 千克','B 和 C 各重 2 千克','每趟最多运 5 千克','A 必须在第一趟送到','第二趟的载重单独计算'],
          34:['A 重 3 千克','B 和 C 各重 2 千克','每趟最多运 5 千克','A 必须第一趟到','C 必须严格早于 B 到达','同一趟到达算同时']}
materials=[]
for day_number in (33,34):
 day=days[day_number-29];question=day['questions'][0]
 assert day['day']==day_number and question['id']==f'S{day_number}-1' and question['type']=='cargo'
 original=''.join(day['story']);assert all(x in original for x in evidence[day_number])
 story=list(day['story'])
 if day_number==33:
  assert 'A 和 B' in story[2] and 'A 和 C' in story[2]
  story[2]='团团拿起三件物品，想一次装上车。小禾说：“先看看限重，再决定每一趟怎么装。”'
 text=''.join(story);assert all(x in text for x in evidence[day_number])
 c=question['cargo'];assert c['weights']==[3,2,2] and c['capacity']==5 and c['firstRequired']==[0]
 plans=[v for v in itertools.product((1,2),repeat=3) if v[0]==1 and all(sum(w for w,t in zip(c['weights'],v) if t==trip)<=c['capacity'] for trip in (1,2)) and all(v[a]<v[b] for a,b in c['strictBefore'])]
 assert plans==([(1,1,2),(1,2,1),(1,2,2)] if day_number==33 else [(1,2,1)])
 materials.append({'id':f'R2-D{day_number:03d}-CARGO','courseId':'R2-PROTOTYPE','day':day_number,'week':5,'kind':'story',
  'title':day['title'],'text':text,'goal':'根据载重和先后规则制定运输安排',
  'tags':['载重','顺序'],'difficulty':3,'focusWords':['每趟','最多'],'prerequisites':['加减法','顺序','至少至多'],
  'panels':[{'text':part,'scene':'library','cast':['tianle','xiaohe','tuantuan'],'action':'read','prop':'book'} for part in story],
  'questions':[{'id':f'R2-S{day_number}-1','type':'cargo','category':'math','ability':'model','errorType':'relation',
   'targetWords':['每趟','最多'],'prompt':question['prompt'],'options':question['options'],'answer':'cargo',
   'cargo':c,'explanation':question['reason'],'evidence':evidence[day_number]}]})
result={'status':'DRAFT_NOT_FORMAL_COURSE','sourcePreviewIds':['S33-1','S34-1'],'materials':materials,
        'changes':['Day 33 removes two ready-made valid assignments from the passage; old preview remains unchanged'],
        'limits':['No independent teaching or language review','Illustrations are placeholders','Pinyin and actual spoken audio not reviewed','No production integration']}
(here/'week5-cargo-material-draft.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(json.dumps({'result':'PASS_DRAFT_STRUCTURE_ONLY','days':[33,34],'day33ValidPlans':3,'day34ValidPlans':1,'answerLeakRemovedFromDay33':True},ensure_ascii=False))
