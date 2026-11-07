"""Apply reviewed exact-text corrections; reject changed or historical inputs."""
import hashlib,json
from pathlib import Path

PROPOSAL_SHA='beaa495fde4b6b54d4e4f3bd1bf230562b2ea3906dabd77e6c700c2f3c0d8da3'
REVIEW_BASELINE='d62a26aa90e5cd89a36b48db812cad91cf3bfb7bddadb2b36a71f4a59c9b2726'

def apply(data,old,materials,proposal_path=None):
 raw=Path(proposal_path or Path(__file__).with_name('pinyin_corrections.json')).read_bytes()
 if hashlib.sha256(raw).hexdigest()!=PROPOSAL_SHA:raise ValueError('Pronunciation review proposal changed')
 proposal=json.loads(raw)
 if proposal.get('contentHash')!=REVIEW_BASELINE or proposal.get('blockedLegacyShared') or proposal.get('unresolved'):raise ValueError('Pronunciation review proposal is incomplete')
 pins=data['pinyinTexts']; original=old['pinyinTexts']; rows=proposal['patches'];seen=set(); remapped=[]
 by_day={m['day']:m for m in materials if m['kind']=='story'}
 # Edited day 65 has two reviewed full-passage positions. Require each to
 # map uniquely into an unchanged panel and a separately reviewed panel row.
 for row in rows:
  text,pos,ch,before,after=(row[k] for k in ('text','position','character','old','new'))
  if not isinstance(pos,int) or not 0<=pos<len(text) or text[pos]!=ch or (text,pos) in seen:raise ValueError('Invalid or duplicate correction')
  seen.add((text,pos))
  if text in original:raise ValueError('Correction would change historical exact pronunciation')
  if text in pins:
   if len(pins[text])!=len(text) or pins[text][pos]!=before:raise ValueError('Reviewed pronunciation no longer matches')
   continue
  if row.get('days')!=[65]:raise ValueError('Missing reviewed exact text')
  m=by_day[65];old_panels=m['source']['originalStory'];new_panels=[p['text'] for p in m['panels']]
  if text!=''.join(old_panels) or len(old_panels)!=len(new_panels):raise ValueError('Unexpected edited passage')
  offset=0;found=[]
  for i,part in enumerate(old_panels):
   if offset<=pos<offset+len(part):found.append((i,pos-offset))
   offset+=len(part)
  if len(found)!=1:raise ValueError('Ambiguous edited passage position')
  i,local=found[0];panel=old_panels[i]
  if panel!=new_panels[i] or panel not in pins or pins[panel][local]!=before:raise ValueError('Edited reviewed panel cannot be safely remapped')
  matching=[x for x in rows if x['text']==panel and x['position']==local and x['character']==ch and x['old']==before and x['new']==after]
  if len(matching)!=1:raise ValueError('Missing matching reviewed panel correction')
  remapped.append((m['text'],sum(len(x) for x in new_panels[:i])+local,ch,after))
 if len(rows)!=114 or len(remapped)!=2:raise ValueError('Unexpected review coverage')
 for row in rows:
  text=row['text'];pos=row['position']
  if text in pins:pins[text][pos]=row['new']
 # Independently confirmed omissions from the review proposal: both "每行"
 # occurrences mean a row of squares, not walking. Exact text guards prevent
 # this context-specific correction from affecting historical material.
 exact_rows=[
  '小禾和团团各有 6 张边长 1 厘米的正方形纸片。小禾拼成 2 行、每行 3 张的长方形；团团把 6 张排成一条直线。纸片边对边，不重叠。',
  '两行每行三格，或三行每行两格，都覆盖六格，外边一圈是 10 厘米。位置可以不同。',
 ]
 import re
 for text in exact_rows:
  if text in original or text not in pins:raise ValueError('Reviewed row context is not safely available')
  positions=[match.start()+1 for match in re.finditer('每行',text)]
  if len(positions)!=(1 if text==exact_rows[0] else 2):raise ValueError('Unexpected row-context count')
  for pos in positions:
   if pins[text][pos]!='xíng':raise ValueError('Expected row pronunciation differs')
   pins[text][pos]='háng'
 # 值得 and these two complements use neutral de. Limit corrections to
 # currently referenced new-course text, with old values and totals pinned.
 def strings(value):
  if isinstance(value,str):yield value
  elif isinstance(value,list):
   for v in value:yield from strings(v)
  elif isinstance(value,dict):
   for k,v in value.items():
    if k not in ('source','sourceQuestion'):yield from strings(v)
 active=set(s for m in materials for s in strings(m));count=0
 for text in active:
  if text not in pins:continue
  for phrase in ('值得','做得对不对','给得不一样'):
   for match in re.finditer(phrase,text):
    pos=match.start()+1
    if text in original or pins[text][pos]!='dé':raise ValueError('Unreviewed or historical 得 context')
    pins[text][pos]='de';count+=1
 if count!=11:raise ValueError('Reviewed 得 projection count changed: '+str(count))
 count=0
 for text in active:
  if text not in pins or '还没收到' not in text:continue
  pos=text.index('还没收到')+1
  if text in original or pins[text][pos]!='mò':raise ValueError('Day 13 没 context changed')
  pins[text][pos]='méi';count+=1
 if count!=2:raise ValueError('Reviewed 没 projection count changed: '+str(count))
 count=0
 for text in active:
  if text not in pins or '永远都会多听清' not in text:continue
  pos=text.index('永远都会多听清')+2
  if text in original or pins[text][pos]!='dū':raise ValueError('Day 20 都 context changed')
  pins[text][pos]='dōu';count+=1
 if count!=2:raise ValueError('Reviewed 都 projection count changed: '+str(count))
 for text in ('先算已知部分，再考虑第三小时可能为零。','数量不足一组，不等于数量为零。'):
  pos=text.index('为零')
  if text not in active or text in original or text not in pins or pins[text][pos]!='wèi':raise ValueError('Reviewed 为零 context changed')
  pins[text][pos]='wéi'
 for text,fragment,offset,before,after in [
  ('没打开的七只纸鸟','七只',1,'zhǐ','zhī'),
  ('晚出现不等于已经确认；仍应核对来源、对象及是否确为新安排。','确为',1,'wèi','wéi'),
 ]:
  pos=text.index(fragment)+offset
  if text not in active or text in original or text not in pins or pins[text][pos]!=before:raise ValueError('Reviewed day 59/62 context changed')
  pins[text][pos]=after
 reviewed=0
 for text in active:
  if text not in pins:continue
  for phrase,offset,before,after in [('就数两次',1,'shù','shǔ'),('数它离中线',0,'shù','shǔ'),('再量出一条边',1,'liàng','liáng'),('量一条边的长度',0,'liàng','liáng')]:
   for match in re.finditer(phrase,text):
    pos=match.start()+offset
    if text in original or pins[text][pos]!=before:raise ValueError('Reviewed day 67–69 context changed')
    pins[text][pos]=after;reviewed+=1
 if reviewed!=5:raise ValueError('Reviewed day 67–69 projection count changed: '+str(reviewed))
 reviewed=0
 for text in active:
  if text not in pins:continue
  for phrase,offset,before,after in [('数出六张卡',0,'shù','shǔ'),('只数一次',1,'shù','shǔ'),('规则数的是人',2,'shù','shǔ'),('发卡的单位',0,'fà','fā'),('人发卡',1,'fà','fā')]:
   for match in re.finditer(phrase,text):
    pos=match.start()+offset
    if text in original or pins[text][pos]!=before:raise ValueError('Reviewed day 71–76 context changed')
    pins[text][pos]=after;reviewed+=1
 if reviewed!=6:raise ValueError('Reviewed day 71–76 projection count changed: '+str(reviewed))
 for text,phrase,offset,before,after in [
  ('长度用直尺测，起止时刻查计时记录，是否领取查对应领取单；每项都要核对当前对象。','对应',1,'yīng','yìng'),
  ('检查需要面对已经贴好的展牌，交付又以检查合格为前提，所以是制作、检查、交付。','为前提',0,'wèi','wéi'),
  ('件数为两包，C 也在第一趟，但重量 2＋3＝5 超过上限。','数为两包',1,'wèi','wéi'),
  ('新清单中 B 为三千克、C 为四千克，合计七千克；不能沿用昨日重量。','为三千克',0,'wèi','wéi'),
  ('新清单中 B 为三千克、C 为四千克，合计七千克；不能沿用昨日重量。','为四千克',0,'wèi','wéi'),
 ]:
  pos=text.index(phrase)+offset
  if text not in active or text in original or text not in pins or pins[text][pos]!=before:raise ValueError('Reviewed day 79–83 context changed')
  pins[text][pos]=after
 # Optional challenge questions: exact strings, unchanged historical text.
 for text,phrase,offset,before,after in [
  ('后来又找到三张西厅蓝箱的照片，能抵消九点整东门那只蓝箱的反例吗？','那只',1,'zhǐ','zhī'),
  ('只量最左端到最右端。','只量',1,'liàng','liáng'),
  ('看桌面范围，不数覆盖层数。','不数',1,'shù','shǔ'),
  ('如果量出一条边长 1 厘米，面积会是多少？','果量',1,'liàng','liáng'),
  ('先读清楚新规则数什么。','规则数',2,'shù','shǔ'),
  ('把两个时间平均后当事实。','当事实',0,'dāng','dàng'),
  ('分别计算起点与终点的差。','点的差',2,'chà','chā'),
  ('现条件需要三十五分钟，早于十一点不可达；应明确缺口并协商改变条件，不能虚报或擅自省略要求。','省略要求',0,'xǐng','shěng'),
 ]:
  pos=text.index(phrase)+offset
  if text not in active or text in original or text not in pins or pins[text][pos]!=before:raise ValueError('Reviewed challenge context changed')
  pins[text][pos]=after
 # Experiential 过 is the neutral-tone aspect particle, unlike 超过 or 经过.
 # Restrict these changes to reviewed active-course challenge strings so the
 # existing legacy pronunciation table stays byte-for-byte unchanged.
 for text,fragment in [
  ('绿盒从来没有装过观察簿。','装过'),
  ('展览结束后，天乐想邀请邻居一起看夜空。他、小禾和团团在地图上圈出操场、屋顶和小山坡。大家约定晚上 8 点开始观察，8 点 20 分结束。从集合点出发，走到操场要 20 分钟，屋顶要 10 分钟，小山坡要 15 分钟。操场和小山坡视野开阔；操场的灯晚上 8 点半才亮，屋顶有一半天空被遮住。大家计划不早于 7 点 40 分出发，步行不超过 15 分钟，还希望视野开阔。下过雨后，去山坡之前要请大人确认路面不滑。团团拿起笔：“先按条件找，再确认安全。”','下过'),
  ('大家计划不早于 7 点 40 分出发，步行不超过 15 分钟，还希望视野开阔。下过雨后，去山坡之前要请大人确认路面不滑。团团拿起笔：“先按条件找，再确认安全。”','下过'),
  ('大人刚检查过，雨后的坡道不滑。','检查过'),
  ('直接取消整个观星夜，因为下过雨。','下过'),
  ('区分本次比较的线索和没有测试过的范围。','测试过'),
  ('广播站找回了能核实的原始记录：6:04 的通话提过东门；6:09，活动负责人发来一条更改通知，地点改为北门。两条记录都保留了时间。6:12 的片段仍只听清“七点……见”，没有说清日期。负责人暂时没有回复确认集合时间，编辑不能把猜测写成已经确认的安排。节目即将开始。小禾要写一句简短播报：既让听众知道地点有过更新，也把尚未确认的时间和下一步核查说清楚。','提过'),
  ('广播站找回了能核实的原始记录：6:04 的通话提过东门；6:09，活动负责人发来一条更改通知，地点改为北门。两条记录都保留了时间。6:12 的片段仍只听清“七点……见”，没有说清日期。负责人暂时没有回复确认集合时间，编辑不能把猜测写成已经确认的安排。节目即将开始。小禾要写一句简短播报：既让听众知道地点有过更新，也把尚未确认的时间和下一步核查说清楚。','有过'),
  ('广播站找回了能核实的原始记录：6:04 的通话提过东门；6:09，活动负责人发来一条更改通知，地点改为北门。两条记录都保留了时间。','提过'),
  ('节目即将开始。小禾要写一句简短播报：既让听众知道地点有过更新，也把尚未确认的时间和下一步核查说清楚。','有过'),
  ('实验室正在整理三次测量的影子长度：甲是 8 厘米，乙的格子空着，丙是 10 厘米。乙到底没有测量，还是测过却丢了记录？表格上没有说明。团团看到两个数字，就把乙填为 9 厘米：“这样刚好排得整齐。”小禾说：“整齐不是证据。先保留空格，并找原始记录。”工作人员找来了当天的原始记录本，还要核对测量时间和实验卡，才能知道哪条记录属于乙。','测过'),
  ('实验室正在整理三次测量的影子长度：甲是 8 厘米，乙的格子空着，丙是 10 厘米。乙到底没有测量，还是测过却丢了记录？表格上没有说明。','测过'),
  ('展牌的交接卡规定：先把纸条贴好，再检查尺寸和固定情况，检查合格后才能交给搬运员。三步都要完成。团团想先把空白交接卡签上“已检查”，这样看起来进度更快。小禾说：“签字应当记录已经做过的事。”天乐把三步做成能移动的卡片，准备按实际顺序排列，完成一项再记一项。','做过'),
  ('团团想先把空白交接卡签上“已检查”，这样看起来进度更快。小禾说：“签字应当记录已经做过的事。”','做过'),
  ('现在是十点十分。原计划十点半开始制作检查，用 15 分钟，再走 10 分钟近路，十一点之前送到北厅。工作人员刚确认近路关闭，20 分钟的远路仍可用。制作检查可以提前开始，其他要求不变，不能省略检查。天乐保留原计划，并写下新消息。他要改的是受路线影响的时间安排，不是把原来的计划假装从未写过。','写过'),
  ('天乐保留原计划，并写下新消息。他要改的是受路线影响的时间安排，不是把原来的计划假装从未写过。','写过'),
  ('近路从来没有开过，所以删掉旧计划。','开过'),
  ('观察馆要给下一批小朋友留一本游戏手册。天乐挑了一个自己最喜欢的任务，想让没玩过的人也能照着试。小禾问：“你能画一张图，讲讲为什么这个办法行得通吗？”团团只写下一个答案，读起来很快，可大家不知道他解决的是哪道题。天乐把题目要求和自己的办法放在一起，又留出一块空白：“你有别的办法吗？可以画给我看。”大家准备交换手册，各自试一次。','玩过'),
  ('观察馆要给下一批小朋友留一本游戏手册。天乐挑了一个自己最喜欢的任务，想让没玩过的人也能照着试。','玩过'),
  ('哪种介绍最能让没玩过的人跟着试？','玩过'),
  ('纸桥工坊旁边开了一个小集市。每进入一次体验区，就收一张入场票；同一个人可以离开后再进来。上午收到了 10 张票。门口记录显示：6 位小朋友各进了一次，另外 2 位各进了两次，没有其他人进入。团团准备写“十位小朋友来过”。天乐把来过的人与进入的次数分开画，发现这两个数未必相同。','小朋友来过'),
  ('纸桥工坊旁边开了一个小集市。每进入一次体验区，就收一张入场票；同一个人可以离开后再进来。上午收到了 10 张票。门口记录显示：6 位小朋友各进了一次，另外 2 位各进了两次，没有其他人进入。团团准备写“十位小朋友来过”。天乐把来过的人与进入的次数分开画，发现这两个数未必相同。','把来过'),
  ('团团准备写“十位小朋友来过”。天乐把来过的人与进入的次数分开画，发现这两个数未必相同。','小朋友来过'),
  ('团团准备写“十位小朋友来过”。天乐把来过的人与进入的次数分开画，发现这两个数未必相同。','把来过'),
  ('按记录，上午共有多少位不同的小朋友来过？','小朋友来过'),
  ('小禾和团团都提到东门，能算两个人各自看见过吗？','看见过'),
  ('因为通知过一次就永远不能改。','通知过'),
  ('删掉，假装从未说过西厅。','说过'),
  ('观察馆要写一张介绍影子实验的卡片。实验使用同一张纸片，纸片和屏幕的位置不变，只设置两种灯距。甲设置测得 6 厘米，乙设置测得 9 厘米，各测了一次。这两条记录来自刚才的实验。换一张纸片再测，或者明天再做，结果还会一样吗？这些情况还没有试过。团团想把“乙的影子总比甲长 3 厘米”写成标题。小禾拿出三种标签：“本次记录”“猜测”“下一步”，准备把卡片整理清楚。','试过'),
  ('这两条记录来自刚才的实验。换一张纸片再测，或者明天再做，结果还会一样吗？这些情况还没有试过。','试过'),
  ('如果又查到：绿盒从 4 点封好后，直到小禾打开前都没打开过，那么 4 点封盒时观察簿在里面吗？','打开过'),
  ('不可以，任何放弃过的方案都不能再用。','放弃过'),
  ('随后新来一位小朋友，还没领过卡，应该怎样更新？','领过'),
  ('按当前一人一卡规则，新成员新增一张发放；不取决于上午是否来过或库存余量。','来过'),
 ]:
  if text.count(fragment)!=1:raise ValueError('Ambiguous reviewed experiential 过 context')
  pos=text.index(fragment)+len(fragment)-1
  if text not in active or text in original or text not in pins or pins[text][pos]!='guò':raise ValueError('Reviewed experiential 过 context changed')
  pins[text][pos]='guo'
 # 哪儿 is one erhua syllable nǎr, not nǎ + ér. Keep the required
 # character-aligned ruby array as nǎ + r, and ask the existing speech
 # controller to read the surrounding sentence for either clicked character.
 for text in (
  '如果甲单的日期改成明天，它还能直接说明今天蓝箱去哪儿了吗？',
  '规则中有没有指定它必须放在哪儿？',
  '第二行第二列的镜像应该在哪儿？',
 ):
  if text.count('哪儿')!=1:raise ValueError('Ambiguous reviewed 哪儿 context')
  pos=text.index('哪儿')+1
  if text not in active or text in original or text not in pins or pins[text][pos-1:pos+1]!=['nǎ','ér']:raise ValueError('Reviewed 哪儿 context changed')
  pins[text][pos]='r'
  reviewed_positions=data.setdefault('contextReviewedPositions',{})
  reviewed_positions[text]=sorted(set(reviewed_positions.get(text,[]))|{pos-1,pos})
 # Additional contextual readings found by reviewing non-primary dictionary
 # readings in core content. Keep both day 17 panel and passage in sync.
 reviewed=0
 for text in active:
  if text not in pins or '录像只保存了解码结果' not in text:continue
  pos=text.index('保存了解码')+2
  if text in original or pins[text][pos]!='liǎo':raise ValueError('Reviewed 保存了 context changed')
  pins[text][pos]='le';reviewed+=1
 if reviewed!=2:raise ValueError('Reviewed 保存了 projection count changed: '+str(reviewed))
 for text,phrase,offset,before,after in [
  ('已确认的当前库存不支持它。','确认的',2,'dí','de'),
  ('这两幅图说明了什么？','说明了',2,'liǎo','le'),
  ('比较行号和离中线的距离。','行号',1,'háo','hào'),
  ('题目允许不同位置和朝向，应按题目的条件逐项检查，而不是要求大家都摆在同一个位置。','题目的条件',2,'dì','de'),
  ('现在发卡的单位是什么？','发卡',1,'qiǎ','kǎ'),
  ('下午从按进入次数改为按不同的人发卡。','人发卡',2,'qiǎ','kǎ'),
 ]:
  pos=text.index(phrase)+offset
  if text not in active or text in original or text not in pins or pins[text][pos]!=before:raise ValueError('Reviewed core context changed')
  pins[text][pos]=after
 # Reviewed “要求” occurrences, including the full-passage projections of
 # four edited panels. Match entire approved strings and their old readings.
 for part,expected_count in [
  ('有人提出买 2 包四张装，理由是每包的单张价格低。这符合本次要求吗？',1),
  ('天乐说：“颜色不同的想法，都要按同一组要求检查。”',2),
  ('三个小组共用 12 枚材料筹码。今天的约定是：每组至少 3 枚，把 12 枚全部分完，不要求三组一样多。',2),
  ('小禾拿起筹码，准备先读懂三组各自的要求。团团说：“大家拿到的不一定一样多。”',2),
  ('今天没有要求平均，也没有规定多出的筹码必须给谁。大家准备把不同合格方案一起留下，并说清各自的理由。',2),
 ]:
  count=0
  for text in active:
   if text not in pins or part not in text:continue
   if text.count(part)!=1:raise ValueError('Ambiguous reviewed 要求 projection')
   pos=text.index(part)+part.index('要求')
   if text in original or pins[text][pos]!='yào':raise ValueError('Reviewed 要求 context changed')
   pins[text][pos]='yāo';count+=1
  if count!=expected_count:raise ValueError('Reviewed 要求 projection count changed: '+str(count))
 text='不一定，还要逐格检查对应位置。';pos=text.index('对应')+1
 if text not in active or text in original or text not in pins or pins[text][pos]!='yīng':raise ValueError('Reviewed 对应 context changed')
 pins[text][pos]='yìng'
 # Check all shared core/optional passage projections after edits. The edited
 # full passage is rebuilt only from its exact corrected panels.
 changed={x[0] for x in remapped}
 for m in materials:
  text=m['text']; merged=sum((pins[p['text']] for p in m['panels']),[])
  if text in changed:pins[text]=merged
  elif pins[text]!=merged:raise ValueError('Corrected panel/passage projections disagree')
 for text,pos,ch,after in remapped:
  if text[pos]!=ch or pins[text][pos]!=after:raise ValueError('Edited passage correction was not projected')
 for text,value in original.items():
  if pins.get(text)!=value:raise ValueError('Historical pronunciation changed')
 return {'reviewedExactPositions':len(rows),'remappedFullPassagePositions':len(remapped),'status':'TARGETED_REVIEW_ONLY'}
