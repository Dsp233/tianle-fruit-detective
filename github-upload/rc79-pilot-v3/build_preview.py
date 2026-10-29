"""Build an isolated, non-persistent, fourteen-day adult-supervised preview."""
import argparse, hashlib, json, re
from pathlib import Path
here=Path(__file__).resolve().parent
ap=argparse.ArgumentParser();ap.add_argument('--output',required=True);ap.add_argument('--fallback-data');args=ap.parse_args()
story=json.loads((here/'story.json').read_text());template=(here/'preview.template.html').read_text();media=(here/'reading_media.js').read_text();phrases=json.loads((here/'pinyin_overrides.json').read_text())
assert template.count('__V3_ACTIVITIES__')==1
template=template.replace('__V3_ACTIVITIES__',(here/'activities.js').read_text())
assert story['schema']=='rc79-reading-story-pilot-draft-v3' and len(story['days'])==14
# Split the authored paragraphs at natural punctuation for shorter touch-screen
# reading panels. The original story remains byte-for-byte reconstructable.
def panels(paragraph):
 result=[];buf='';inside_quote=False
 for ch in paragraph:
  buf+=ch
  if ch in '“‘':inside_quote=True
  if ch in '”’':inside_quote=False
  if len(buf)>=28 and not inside_quote and (ch in '。！？；，' or ch in '”’' and len(buf)>=2 and buf[-2] in '。！？'):
   result.append(buf);buf=''
 if buf:
  if result and len(buf)<12 and len(result[-1]+buf)<=60:result[-1]+=buf
  else:result.append(buf)
 assert ''.join(result)==paragraph
 return result
for d in story['days']:
 d['panels']=[part for paragraph in d['story'] for part in panels(paragraph)]
 assert ''.join(d['panels'])==''.join(d['story'])
questions=[q for d in story['days'] for q in d['questions']+[d['extra']]]
assert len(questions)==56 and len({q['id'] for q in questions})==56
for d in story['days']:
 assert len(d['story'])==3 and len(d['questions'])==3
 for q in d['questions']+[d['extra']]:
  assert len(q['options'])==3
  if q['type']=='order':assert sorted(q['answer'])==[0,1,2]
  else:assert isinstance(q['answer'],int) and 0<=q['answer']<3
texts=set()
def collect(value):
 if isinstance(value,str) and re.search(r'[\u3400-\u9fff]',value):texts.add(value)
 elif isinstance(value,list):
  for x in value:collect(x)
 elif isinstance(value,dict):
  for x in value.values():collect(x)
collect(story['days'])
# Also generate exact contextual pinyin for literal Chinese UI labels.
for match in re.finditer(r"(['\"])([^'\"\n]*[\u3400-\u9fff][^'\"\n]*)\1",template):texts.add(match.group(2))
hanzi=sorted(set(c for t in list(texts)+[template] for c in t if '\u3400'<=c<='\u9fff'))
if args.fallback_data:
 raw=Path(args.fallback_data).read_text();old=json.loads(raw.split('=',1)[1].strip().removesuffix(';'));mapping=old['pinyinMap'];mapping.update({'乎':'hū','似':'sì','千':'qiān','叮':'dīng','嘱':'zhǔ','曾':'céng','簿':'bù','轨':'guǐ','陈':'chén','汇':'huì','九':'jiǔ','五':'wǔ','八':'bā','六':'liù','十':'shí','建':'jiàn','议':'yì'})
 def annotate(t):return [mapping.get(c,'') if '\u3400'<=c<='\u9fff' else c for c in t]
 compiler='FALLBACK_LOCAL_TEST_ONLY'
else:
 from pypinyin import pinyin, Style, load_phrases_dict, __version__
 load_phrases_dict({word:[[p] for p in pin.split()] for word,pin in phrases.items()})
 # The library's word segmenter can choose a different boundary (for example,
 # 封面相似 as 封 + 面相 + 似), in which case a phrase dictionary entry is
 # silently ignored. Apply reviewed phrases to the original character spans,
 # preferring the longest entry when overlapping entries compete.
 phrase_spans=sorted(((word,pin.split()) for word,pin in phrases.items()),key=lambda item:(-len(item[0]),item[0]))
 if any(len(word)!=len(pins) for word,pins in phrase_spans):raise ValueError('Phrase pinyin must align one syllable per character')
 def annotate(t):
  rows=pinyin(t,style=Style.TONE,heteronym=False,errors=lambda x:list(x),strict=True)
  if len(rows)!=len(t):raise ValueError('Unaligned pinyin: '+repr(t[:80]))
  result=[('yī' if c=='一' else 'bù' if c=='不' else row[0]) for c,row in zip(t,rows)]
  claimed=[False]*len(t)
  for word,pins in phrase_spans:
   start=0
   while True:
    i=t.find(word,start)
    if i<0:break
    if not any(claimed[i:i+len(word)]):
     result[i:i+len(word)]=pins;claimed[i:i+len(word)]=[True]*len(word)
    start=i+1
  # Mathematical equality uses wéi (not the wèi in 因为/为了).
  for match in re.finditer(r'为(?=\s*\d)',t):result[match.start()]='wéi'
  return result
 compiler='pypinyin-'+__version__
pinmap={c:annotate(c)[0] for c in hanzi};missing=[c for c,p in pinmap.items() if not p or re.search(r'[\u3400-\u9fff]',p)]
if missing:raise ValueError('Missing pinyin for '+''.join(missing))
pintexts={t:annotate(t) for t in sorted(texts)}
for t,pins in pintexts.items():
 assert len(t)==len(pins),(t,len(t),len(pins))
 assert all(not ('\u3400'<=c<='\u9fff') or bool(p) and not re.search(r'[\u3400-\u9fff]',p) for c,p in zip(t,pins)),t
context_checks=[
 ('清单写的是 47；两本封面相似，不足以说明它们是同一本。','相似',['xiāng','sì']),
 ('想起登记照片上两本相似的簿子。','相似',['xiāng','sì']),
 ('2＋2＋3＝7，刚好到第 7 格；3＋3＋3＝9，2＋2＋2＝6，都不等于 7。','等于',['děng','yú']),
 ('分别假设钥匙在每个盒子里，再数一数有几句真话。','数一数',['shǔ','yī','shǔ']),
 ('“最多两只”允许只运一只。','两只',['liǎng','zhī']),
 ('只测量最后的高度，把开始高度省略。','测量',['cè','liáng']),
 ('只要有云，看到的星星就一定比没云时少。','只要',['zhǐ','yào']),
 ('周末，天乐和小禾要办一场“看见夜空”的小展览。最重要的观察簿却不见了，空展柜里只剩一张收据。','一场',['yī','chǎng']),
 ('团团伸手想拿蓝盒。小禾说：“先比较后面两张纸条，它们可能同时为假吗？”','为假',['wéi','jiǎ']),
 ('总共恰有一句真，蓝绿之间已占去这一句，所以红盒所说“不在红盒”为假。','为假',['wéi','jiǎ']),
 ('这三次同样长的观察中，哪一次看到的数量最多？','同样长',['tóng','yàng','cháng']),
 ('可选步长中最大的是 3，两次最多 3＋3＝6。','步长',['bù','cháng']),
 ('小禾已经朝门口跑去。天乐叫住她：“先问清楚，便条能告诉我们多少。”','告诉',['gào','su']),
 ('第一趟必须有 B。A＋B 为 5 千克，符合限重；B＋C 为 7 千克，超重。','为',['wéi']),
 ('运输车每趟最多装两袋，总重不能超过 5 千克。饮水必须第一趟送到。工作人员到达后再打开记录本袋。','总重',['zǒng','zhòng']),
 ('大人刚检查过，雨后的坡道不滑。','检查',['jiǎn','chá'])]
if not args.fallback_data:
 for text,word,expected in context_checks:
  index=text.index(word);actual=pintexts[text][index:index+len(word)]
  if actual!=expected:raise ValueError('Contextual pinyin mismatch: '+repr((word,actual,expected,text)))
payload={'version':'story-preview-v3','status':'DRAFT_SUPERVISED_PREVIEW_NOT_FORMAL_COURSE','days':story['days'],'pinyinMap':pinmap,'pinyinTexts':pintexts,'phrases':phrases,'pinyinPolicy':'contextual auto-generated; independent human linguistic review pending','compiler':compiler}
js=json.dumps(payload,ensure_ascii=False,separators=(',',':')).replace('</','<\\/')
assert template.count('__PILOT_DATA_PAYLOAD__')==1 and template.count('__MEDIA_SOURCE__')==1
out=template.replace('__PILOT_DATA_PAYLOAD__',js).replace('__MEDIA_SOURCE__',media)
assert 'localStorage' not in template and 'fetch(' not in template
p=Path(args.output);p.parent.mkdir(parents=True,exist_ok=True);p.write_text(out)
result={'result':'PASS','scope':'structure and aligned pinyin coverage only; human review, real voice, child and physical iPad NOT_RUN','compiler':compiler,'targetedContextChecks':len(context_checks) if not args.fallback_data else 0,'days':len(story['days']),'core':sum(len(d['questions']) for d in story['days']),'optional':len(story['days']),'hanzi':len(hanzi),'annotatedTexts':len(pintexts),'htmlSha256':hashlib.sha256(out.encode()).hexdigest(),'htmlBytes':len(out.encode())}
p.with_suffix('.build.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n')
print(json.dumps(result,ensure_ascii=False))
