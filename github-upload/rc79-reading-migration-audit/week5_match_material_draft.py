"""Map one actual preview question to a new-ID formal prototype, not production."""
import hashlib
import itertools
import json
from pathlib import Path

here=Path(__file__).resolve().parent
source=json.loads((here/'fixtures/pilot-v11-story.json').read_text(encoding='utf-8'))
days=source['days'][28:35]
canonical=json.dumps(days,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()
assert hashlib.sha256(canonical).hexdigest()=='1c7ccd40761f5e6f3f058962d468b74868896a1585c30fa02e54035146a5af30'
day=days[0];question=day['questions'][0];assert day['day']==29 and question['id']=='S29-1' and question['type']=='match'
evidence=['每组恰好收到一封','A 应交给播报组','B 不是给后勤组','每封信和每个组都只对应一次']
story=''.join(day['story']);assert all(x in story for x in evidence)
assert question['options']==['播报组','造型组','后勤组'] and question['answer']==[0,1,2]
assert [a for a in itertools.permutations(range(3)) if a[0]==0 and a[1]!=2]==[(0,1,2)]
material={
 'id':'R2-D029-STORY-MATCH','courseId':'R2-PROTOTYPE','day':29,'week':5,'kind':'story',
 'title':day['title'],'text':story,'goal':'根据已核实的两条记录逐项推理',
 'tags':['对应','排除'],'difficulty':3,'focusWords':['恰好','分别'],'prerequisites':['简单逻辑'],
 'panels':[{'text':text,'scene':'library','cast':['tianle','xiaohe','tuantuan'],'action':'read','prop':'book'} for text in day['story']],
 'questions':[{'id':'R2-S29-1','type':'match','category':'math','ability':'model','errorType':'relation',
   'targetWords':['恰好','分别'],'prompt':question['prompt'],'matchLeft':['A','B','C'],
   'options':question['options'],'answer':question['answer'],'explanation':question['reason'],'evidence':evidence}]
}
result={'status':'DRAFT_NOT_FORMAL_COURSE','sourcePreviewId':'S29-1','material':material,
        'limits':['No independently reviewed teaching or language assessment','Illustrations are placeholders','Pinyin and actual spoken audio not reviewed','No production integration']}
(here/'week5-match-material-draft.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(json.dumps({'result':'PASS_DRAFT_STRUCTURE_ONLY','sourcePreviewId':'S29-1','newQuestionId':'R2-S29-1','independentAssignmentsChecked':6},ensure_ascii=False))
