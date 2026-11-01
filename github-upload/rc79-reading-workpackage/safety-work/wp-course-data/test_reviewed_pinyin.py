"""Focused evidence for explicitly reviewed pronunciation positions only."""
import json,sys,copy,tempfile
from pathlib import Path
HERE=Path(__file__).resolve().parent
sys.path.insert(0,str(HERE))
from apply_pinyin_corrections import apply

data=json.loads((HERE/'candidate_reading_data.json').read_text())
code=(HERE.parent/'baseline/source/reading_data.js').read_text()
old=json.loads(code.split('window.__AMC8_READING_DATA=',1)[1].strip()[:-1])
proposal=json.loads((HERE/'pinyin_corrections.json').read_text())
pins=data['pinyinTexts']; checked=0
for row in proposal['patches']:
 text,pos=row['text'],row['position']
 if text in pins:
  assert pins[text][pos]==row['new'],(row['days'],row['fields'],text[pos])
  checked+=1
 else:
  assert row['days']==[65] and row['fields']=='正文'
assert checked==112
for m in data['materials']:
 if m.get('courseId')!=data['courseScope']['activeCourseId']:continue
 assert pins[m['text']]==sum((pins[p['text']] for p in m['panels']),[])
 if m['day']==65:
  for part,character,expected in [('2 行','行','háng'),('外边多长','长','cháng')]:
   pos=m['text'].index(part)+part.index(character);assert pins[m['text']][pos]==expected
for text,value in old['pinyinTexts'].items():assert pins[text]==value
for text in ['小禾和团团各有 6 张边长 1 厘米的正方形纸片。小禾拼成 2 行、每行 3 张的长方形；团团把 6 张排成一条直线。纸片边对边，不重叠。','两行每行三格，或三行每行两格，都覆盖六格，外边一圈是 10 厘米。位置可以不同。']:
 import re
 for match in re.finditer('每行',text):assert pins[text][match.start()+1]=='háng'
with tempfile.TemporaryDirectory() as tmp:
 p=Path(tmp)/'changed.json';p.write_text((HERE/'pinyin_corrections.json').read_text()+' ')
 try:apply(copy.deepcopy(data),old,[],p)
 except ValueError:pass
 else:raise AssertionError('Modified review proposal must fail closed')
print(json.dumps({'result':'PASS_TARGETED_PINYIN_ONLY','exactPositions':112,'editedPassagePositions':2,'legacyExactUnchanged':True,'projectionConsistency':True,'modifiedProposalRejected':True,'fullPronunciationReview':'NOT_RUN'}))
