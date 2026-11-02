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
text='温室值得去查，但还不能确定簿子已经送到。'
assert text not in old['pinyinTexts'] and pins[text][text.index('得')]=='de'
for text in ['别人拼出的图与天乐的位置不同，怎样判断他做得对不对？','给得不一样，所以一定违规。','“值得核查”和“已经确定错误”一样吗？']:
 assert text not in old['pinyinTexts'] and pins[text][text.index('得')]=='de'
for text in ('先算已知部分，再考虑第三小时可能为零。','数量不足一组，不等于数量为零。'):
 assert text not in old['pinyinTexts'] and pins[text][text.index('为零')]=='wéi'
for text,fragment,expected in [('没打开的七只纸鸟','七只','zhī'),('晚出现不等于已经确认；仍应核对来源、对象及是否确为新安排。','确为','wéi')]:
 assert text not in old['pinyinTexts'] and pins[text][text.index(fragment)+1]==expected
for text,fragment,offset,expected in [('先从最上面一格开始，数它离中线有几格。','数它离中线',0,'shǔ'),('再量出一条边长 2 厘米，另一条相邻边应多长？','再量出一条边',1,'liáng'),('量一条边的长度。','量一条边的长度',0,'liáng')]:
 assert text not in old['pinyinTexts'] and pins[text][text.index(fragment)+offset]==expected
for text,fragment,offset,expected in [('每个人只数一次。','只数一次',1,'shǔ'),('收票规则数的是人，还是进入次数？','规则数的是人',2,'shǔ'),('现在发卡的单位是什么？','发卡的单位',0,'fā'),('下午从按进入次数改为按不同的人发卡。','人发卡',1,'fā')]:
 assert text not in old['pinyinTexts'] and pins[text][text.index(fragment)+offset]==expected
for text,fragment,offset,expected in [('长度用直尺测，起止时刻查计时记录，是否领取查对应领取单；每项都要核对当前对象。','对应',1,'yìng'),('检查需要面对已经贴好的展牌，交付又以检查合格为前提，所以是制作、检查、交付。','为前提',0,'wéi'),('件数为两包，C 也在第一趟，但重量 2＋3＝5 超过上限。','数为两包',1,'wéi'),('新清单中 B 为三千克、C 为四千克，合计七千克；不能沿用昨日重量。','为三千克',0,'wéi'),('新清单中 B 为三千克、C 为四千克，合计七千克；不能沿用昨日重量。','为四千克',0,'wéi')]:
 assert text not in old['pinyinTexts'] and pins[text][text.index(fragment)+offset]==expected
for m in data['materials']:
 if m.get('courseId')!=data['courseScope']['activeCourseId'] or m.get('day')!=13:continue
 for text in [m['text'],*(x['text'] for x in m['panels'])]:
  if '还没收到' in text:assert pins[text][text.index('还没收到')+1]=='méi'
for m in data['materials']:
 if m.get('courseId')!=data['courseScope']['activeCourseId'] or m.get('day')!=20:continue
 for text in [m['text'],*(x['text'] for x in m['panels'])]:
  if '永远都会多听清' in text:assert pins[text][text.index('永远都会多听清')+2]=='dōu'
for text in ['小禾和团团各有 6 张边长 1 厘米的正方形纸片。小禾拼成 2 行、每行 3 张的长方形；团团把 6 张排成一条直线。纸片边对边，不重叠。','两行每行三格，或三行每行两格，都覆盖六格，外边一圈是 10 厘米。位置可以不同。']:
 import re
 for match in re.finditer('每行',text):assert pins[text][match.start()+1]=='háng'
with tempfile.TemporaryDirectory() as tmp:
 p=Path(tmp)/'changed.json';p.write_text((HERE/'pinyin_corrections.json').read_text()+' ')
 try:apply(copy.deepcopy(data),old,[],p)
 except ValueError:pass
 else:raise AssertionError('Modified review proposal must fail closed')
print(json.dumps({'result':'PASS_TARGETED_PINYIN_ONLY','exactPositions':112,'editedPassagePositions':2,'legacyExactUnchanged':True,'projectionConsistency':True,'modifiedProposalRejected':True,'fullPronunciationReview':'NOT_RUN'}))
