"""Map the actual day-30 route to a new-ID prototype; preview is unchanged."""
import hashlib
import json
from pathlib import Path

here=Path(__file__).resolve().parent
source=json.loads((here/'fixtures/pilot-v11-story.json').read_text(encoding='utf-8'))
days=source['days'][28:35]
canonical=json.dumps(days,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()
assert hashlib.sha256(canonical).hexdigest()=='1c7ccd40761f5e6f3f058962d468b74868896a1585c30fa02e54035146a5af30'
day=days[1];question=day['questions'][0];assert day['day']==30 and question['id']=='S30-1' and question['answer']=='S>B>C>T'
evidence=['S 可到 A 或 B','A 可到 C','B 可到 C 或 D','C 和 D 都可到 T','A 到 C 的路关闭','B 到 D 的门要到 10:00 才开放']
text=''.join(day['story']);assert all(x in text for x in evidence)
nodes=['S','A','B','C','D','T'];edges=[(0,1,'open'),(0,2,'open'),(1,3,'closed'),(2,3,'open'),(2,4,'notYet'),(3,5,'open'),(4,5,'open')]
def walk(node,path):
 if node==5:return [path]
 return [route for a,b,state in edges if a==node and state=='open' and b not in path for route in walk(b,path+[b])]
assert walk(0,[0])==[[0,2,3,5]]
graph={'positions':[[50,130],[190,55],[190,205],[390,55],[390,205],[550,130]],'edges':[{'from':a,'to':b,'state':state} for a,b,state in edges]}
material={'id':'R2-D030-ROUTE','courseId':'R2-PROTOTYPE','day':30,'week':5,'kind':'story','title':day['title'],'text':text,
 'goal':'结合地图连接与开放条件规划路线','tags':['路线','开放'],'difficulty':3,'focusWords':['关闭','开放'],'prerequisites':['简单逻辑','顺序'],
 'panels':[{'text':part,'scene':'library','cast':['tianle','xiaohe','tuantuan'],'action':'read','prop':'book'} for part in day['story']],
 'questions':[{'id':'R2-S30-1','type':'route','category':'math','ability':'model','errorType':'relation','targetWords':['关闭','开放'],
 'prompt':question['prompt'],'options':nodes,'answer':'route','route':{'maxStops':8,'acceptedRoutes':[[0,2,3,5]],'graph':graph},'explanation':question['reason'],'evidence':evidence}]}
result={'status':'DRAFT_NOT_FORMAL_COURSE','sourcePreviewId':'S30-1','material':material,'limits':['Map encodes given connections and closures, not a computed route','No independent teaching or language review','Illustrations are placeholders','Pinyin and actual spoken audio not reviewed','No production integration']}
(here/'week5-route-material-draft.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(json.dumps({'result':'PASS_DRAFT_STRUCTURE_ONLY','sourcePreviewId':'S30-1','openPaths':1,'graphEdges':len(edges)},ensure_ascii=False))
