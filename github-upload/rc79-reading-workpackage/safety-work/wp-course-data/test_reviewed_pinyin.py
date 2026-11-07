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
for text,value in old.get('contextReviewedPositions',{}).items():assert data['contextReviewedPositions'][text]==value
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
for text,phrase,offset,expected in [('后来又找到三张西厅蓝箱的照片，能抵消九点整东门那只蓝箱的反例吗？','那只',1,'zhī'),('只量最左端到最右端。','只量',1,'liáng'),('看桌面范围，不数覆盖层数。','不数',1,'shǔ'),('如果量出一条边长 1 厘米，面积会是多少？','果量',1,'liáng')]:
 assert text not in old['pinyinTexts'] and pins[text][text.index(phrase)+offset]==expected
for text,phrase,offset,expected in [('先读清楚新规则数什么。','规则数',2,'shǔ'),('把两个时间平均后当事实。','当事实',0,'dàng')]:
 assert text not in old['pinyinTexts'] and pins[text][text.index(phrase)+offset]==expected
for text,phrase in [('如果又查到：绿盒从 4 点封好后，直到小禾打开前都没打开过，那么 4 点封盒时观察簿在里面吗？','打开过'),('不可以，任何放弃过的方案都不能再用。','放弃过'),('随后新来一位小朋友，还没领过卡，应该怎样更新？','领过'),('按当前一人一卡规则，新成员新增一张发放；不取决于上午是否来过或库存余量。','来过')]:
 assert text not in old['pinyinTexts'] and pins[text][text.index(phrase)+len(phrase)-1]=='guo'
for m in data['materials']:
 if m['id'] not in ('R2-D042-CORE','R2-D042-EXTRA'):continue
 for text in [m['text'],*(p['text'] for p in m['panels'] if '试过' in p['text'])]:
  assert text not in old['pinyinTexts'] and pins[text][text.index('试过')+1]=='guo'
text='件数为两包，C 也在第一趟，但重量 2＋3＝5 超过上限。';assert pins[text][text.index('超过')+1]=='guò'
for text in ['如果甲单的日期改成明天，它还能直接说明今天蓝箱去哪儿了吗？','规则中有没有指定它必须放在哪儿？','第二行第二列的镜像应该在哪儿？']:
 pos=text.index('哪儿');assert text not in old['pinyinTexts'] and pins[text][pos:pos+2]==['nǎ','r']
 assert {pos,pos+1}.issubset(data['contextReviewedPositions'][text])
for text,phrase,offset,expected in [('分别计算起点与终点的差。','点的差',2,'chā'),('现条件需要三十五分钟，早于十一点不可达；应明确缺口并协商改变条件，不能虚报或擅自省略要求。','省略要求',0,'shěng')]:
 assert text not in old['pinyinTexts'] and pins[text][text.index(phrase)+offset]==expected
for text,phrase,offset,expected in [('已确认的当前库存不支持它。','确认的',2,'de'),('这两幅图说明了什么？','说明了',2,'le'),('比较行号和离中线的距离。','行号',1,'hào'),('题目允许不同位置和朝向，应按题目的条件逐项检查，而不是要求大家都摆在同一个位置。','题目的条件',2,'de'),('现在发卡的单位是什么？','发卡',1,'kǎ'),('下午从按进入次数改为按不同的人发卡。','人发卡',2,'kǎ')]:
 assert text not in old['pinyinTexts'] and pins[text][text.index(phrase)+offset]==expected
for material in data['materials']:
 if material.get('courseId')!=data['courseScope']['activeCourseId'] or material.get('day')!=17:continue
 for text in [material['text'],*(panel['text'] for panel in material['panels'])]:
  if '录像只保存了解码结果' in text:assert text not in old['pinyinTexts'] and pins[text][text.index('保存了解码')+2]=='le'
for part in ['有人提出买 2 包四张装，理由是每包的单张价格低。这符合本次要求吗？','天乐说：“颜色不同的想法，都要按同一组要求检查。”','三个小组共用 12 枚材料筹码。今天的约定是：每组至少 3 枚，把 12 枚全部分完，不要求三组一样多。','小禾拿起筹码，准备先读懂三组各自的要求。团团说：“大家拿到的不一定一样多。”','今天没有要求平均，也没有规定多出的筹码必须给谁。大家准备把不同合格方案一起留下，并说清各自的理由。']:
 assert part not in old['pinyinTexts'] and pins[part][part.index('要求')]=='yāo'
 for material in data['materials']:
  if material.get('courseId')==data['courseScope']['activeCourseId'] and part in material['text']:
   text=material['text'];assert text not in old['pinyinTexts'] and pins[text][text.index(part)+part.index('要求')]=='yāo'
text='不一定，还要逐格检查对应位置。';assert text not in old['pinyinTexts'] and pins[text][text.index('对应')+1]=='yìng'
for text,phrase,expected in [('选择两条纸条重叠的长度；自己算拼接后的总长。','长度','cháng'),('分别调整各组数量；自己核对总数与每组要求。','调整','tiáo'),('拖动时间轴，或用按钮调整。','调整','tiáo'),('先调整时间，指针现在在','调整','tiáo'),('按顺序点卡片，或拖动左侧把手调整整排。','调整','tiáo')]:
 assert text not in old['pinyinTexts'] and pins[text][text.index(phrase)]==expected
for text,phrase,expected in [('点选要查看的时段；空白先保留为未知。','为未知','wéi'),('两条都重来','重来','chóng')]:
 assert text not in old['pinyinTexts'] and pins[text][text.index(phrase)]==expected
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
