"""Build an isolated, non-persistent, seven-day adult-supervised preview."""
import argparse, hashlib, json, re
from pathlib import Path
here=Path(__file__).resolve().parent
ap=argparse.ArgumentParser();ap.add_argument('--output',required=True);ap.add_argument('--fallback-data');args=ap.parse_args()
story=json.loads((here/'story.json').read_text());template=(here/'preview.template.html').read_text();media=(here/'reading_media.js').read_text();phrases=json.loads((here/'pinyin_overrides.json').read_text())
assert story['schema']=='rc79-reading-story-pilot-draft-v2' and len(story['days'])==7
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
assert len(questions)==28 and len({q['id'] for q in questions})==28
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
 raw=Path(args.fallback_data).read_text();old=json.loads(raw.split('=',1)[1].strip().removesuffix(';'));mapping=old['pinyinMap'];mapping.update({'乎':'hū','似':'sì','千':'qiān','叮':'dīng','嘱':'zhǔ','曾':'céng','簿':'bù','轨':'guǐ','陈':'chén','汇':'huì'})
 def annotate(t):return [mapping.get(c,'') if '\u3400'<=c<='\u9fff' else c for c in t]
 compiler='FALLBACK_LOCAL_TEST_ONLY'
else:
 from pypinyin import pinyin, Style, load_phrases_dict, __version__
 load_phrases_dict({word:[[p] for p in pin.split()] for word,pin in phrases.items()})
 def annotate(t):
  rows=pinyin(t,style=Style.TONE,heteronym=False,errors=lambda x:list(x),strict=True)
  if len(rows)!=len(t):raise ValueError('Unaligned pinyin: '+repr(t[:80]))
  return [('yī' if c=='一' else 'bù' if c=='不' else row[0]) for c,row in zip(t,rows)]
 compiler='pypinyin-'+__version__
pinmap={c:annotate(c)[0] for c in hanzi};missing=[c for c,p in pinmap.items() if not p or re.search(r'[\u3400-\u9fff]',p)]
if missing:raise ValueError('Missing pinyin for '+''.join(missing))
pintexts={t:annotate(t) for t in sorted(texts)}
for t,pins in pintexts.items():
 assert len(t)==len(pins),(t,len(t),len(pins))
 assert all(not ('\u3400'<=c<='\u9fff') or bool(p) and not re.search(r'[\u3400-\u9fff]',p) for c,p in zip(t,pins)),t
payload={'version':'story-preview-v2','status':'DRAFT_SUPERVISED_PREVIEW_NOT_FORMAL_COURSE','days':story['days'],'pinyinMap':pinmap,'pinyinTexts':pintexts,'phrases':phrases,'pinyinPolicy':'contextual auto-generated; independent human linguistic review pending','compiler':compiler}
js=json.dumps(payload,ensure_ascii=False,separators=(',',':')).replace('</','<\\/')
assert template.count('__PILOT_DATA_PAYLOAD__')==1 and template.count('__MEDIA_SOURCE__')==1
out=template.replace('__PILOT_DATA_PAYLOAD__',js).replace('__MEDIA_SOURCE__',media)
assert 'localStorage' not in template and 'fetch(' not in template
p=Path(args.output);p.parent.mkdir(parents=True,exist_ok=True);p.write_text(out)
result={'result':'PASS','scope':'structure and aligned pinyin coverage only; human review, real voice, child and physical iPad NOT_RUN','compiler':compiler,'days':len(story['days']),'core':sum(len(d['questions']) for d in story['days']),'optional':len(story['days']),'hanzi':len(hanzi),'annotatedTexts':len(pintexts),'htmlSha256':hashlib.sha256(out.encode()).hexdigest(),'htmlBytes':len(out.encode())}
p.with_suffix('.build.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n')
print(json.dumps(result,ensure_ascii=False))
