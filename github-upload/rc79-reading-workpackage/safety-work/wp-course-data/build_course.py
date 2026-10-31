#!/usr/bin/env python3
"""Build a *candidate* R2 course; never modifies the released site or live data.

The source and baseline are pinned byte-for-byte. The new course uses new IDs;
old materials, old questions, and old diagnostic questions are preserved. No
unreviewed question is assigned a pedagogical/error classification.
"""
import argparse, collections, copy, hashlib, json, re
from pathlib import Path

ROOT=Path(__file__).resolve().parents[2]
HERE=Path(__file__).resolve().parent
STORY=ROOT/'safety-work/wp-integration/v11-source/story.json'
BASE=ROOT/'safety-work/baseline/source/reading_data.js'
PINYIN=HERE/'fixtures/pilot-v11-release-pinyin.json'
REV='98cfd12797013845c4771719778b9b5f62214308'
PILOT_BLOB='7e86fd67f5253b8fec3a15448147118beb636369'
BASE_SHA='0c8ad843af039308d749ce44f75ad74577b5fce96ffd009e18f770b13c849358'
PINYIN_SHA='5684c4d6e73f979bbb4097172dd53fb1443ef3bc087d858000905342f74eb13f'
OLD='R1-LEGACY'; NEW='R2-84D-20261031'
HAN=re.compile(r'[\u3400-\u9fff]')

def sha(b): return hashlib.sha256(b).hexdigest()
def canonical(obj):return json.dumps(obj,ensure_ascii=False,sort_keys=True,separators=(',',':'))
def load_baseline():
 raw=BASE.read_bytes()
 if sha(raw)!=BASE_SHA:raise ValueError('Published baseline byte hash changed; verify before continuing.')
 code=raw.decode('utf-8'); prefix='window.__AMC8_READING_DATA='
 assert code.count(prefix)==1 and code.rstrip().endswith(';')
 return json.loads(code.split(prefix,1)[1].strip()[:-1])

def load_story():
 raw=STORY.read_bytes(); blob=hashlib.sha1(b'blob '+str(len(raw)).encode()+b'\0'+raw).hexdigest()
 if blob!=PILOT_BLOB:raise ValueError('Pinned GitHub pilot story differs; verify before continuing.')
 return json.loads(raw)

def rewrite_day(d):
 d=copy.deepcopy(d); n=d['day']; changes=[]
 if n==33:
  old='团团把 A 和 B 放在第一趟，小禾又试了 A 和 C：“看看是否还有另一种同样符合条件的安排。”'
  new='团团拿起三件物品，想一次装上车。小禾说：“先看看限重，再决定每一趟怎么装。”'
  assert d['story'][2]==old; d['story'][2]=new;changes.append('S33-1 passage no longer supplies two correct solutions')
 if n==54:
  assert d['title']=='两种都能用的方案';d['title']='选择底板和标签'
  old='工作人员说：“底板选蓝色或红色都可以，但标签一定要有。”小禾选蓝底板，团团想用红底板。'
  new='工作人员说：“底板选蓝色或红色都可以，但标签一定要有。”小禾想选蓝底板，团团想选红底板。'
  assert d['story'][1]==old;d['story'][1]=new
  old='天乐准备把两种方案都摆出来，看看是不是都满足要求。颜色不同，并不一定说明其中一个错了。'
  new='天乐说：“颜色不同的想法，都要按同一组要求检查。”'
  assert d['story'][2]==old;d['story'][2]=new;changes.append('S54-1 passage no longer pre-validates both options')
  old='小禾和团团用了不同颜色的底板，怎样判断两人是否都完成了任务？'
  new='小禾和团团打算用不同颜色的底板，怎样判断两人的方案是否都能完成任务？'
  assert d['questions'][2]['prompt']==old;d['questions'][2]['prompt']=new
  changes.append('S54 title no longer reveals the number of solutions; question 3 describes planned choices')
 if n==74:
  old='小禾提出每组 4 枚，团团提出第一组 3 枚、第二组 3 枚、第三组 6 枚。两人都想说明自己的方案符合约定。'
  new='小禾想试试各组分得一样多，团团想试试不完全一样的分法。两人都准备核对自己的方案。'
  assert d['story'][1]==old;d['story'][1]=new;changes.append('S74-1 passage no longer supplies two correct allocations')
 if n==32:
  old='如果后来确认 9:08 交回、9:12 取回的新增记录准确，且其余交接不变，9:10 由谁保管？'
  new='如果后来确认小禾在 9:08 把包裹交回阿宁、阿宁在 9:12 又交给小禾，且其余交接不变，9:10 由谁保管？'
  assert d['extra']['prompt']==old;d['extra']['prompt']=new;changes.append('S32-X explicitly identifies the two parties in both new exchanges')
 return d,changes

def convert_question(q):
 raw=copy.deepcopy(q);out={
  'id':'R2-'+q['id'],'sourcePreviewId':q['id'],'sourceQuestion':raw,
  'type':q['type'],'prompt':q['prompt'],'options':copy.deepcopy(q['options']),
  'answer':copy.deepcopy(q['answer']),'explanation':q['reason'],'hint':q['hint'],
  'sourceAbility':q['ability'],'relatedTo':('R2-'+q['relatedTo']) if q['relatedTo'] else None,
  'metadataStatus':'unreviewed','classification':None,'category':None,'ability':None,
  'errorType':None,'targetWords':[],'evidence':[]}
 for field in ('cargo','items','grid','allocation','manifest'):
  if field in q:out[field]=copy.deepcopy(q[field])
 if q['id']=='S29-1':out['matchLeft']=['A','B','C']
 if q['id']=='S30-1':
  out['options']=['S','A','B','C','D','T'];out['answer']='route'
  out['route']={'maxStops':8,'acceptedRoutes':[[0,2,3,5]],'graph':{
   'positions':[[50,130],[190,55],[190,205],[390,55],[390,205],[550,130]],
   'edges':[{'from':a,'to':b,'state':state} for a,b,state in [(0,1,'open'),(0,2,'open'),(1,3,'closed'),(2,3,'open'),(2,4,'notYet'),(3,5,'open'),(4,5,'open')]]}}
 if q['id']=='S31-1':
  out['options']=['出发时间'];out['departure']={'min':540,'max':600,'step':1,'initial':570}
 return out

def plain_annotation(s, pinyin_map, phrases):
 # Newly edited short text uses the same documented fallback strategy as the
 # reader UI, with longest-phrase matching. It is NOT linguistic review.
 ordered=sorted(phrases.items(),key=lambda x:len(x[0]),reverse=True);chars=list(s)
 out=[pinyin_map.get(c,'') if HAN.fullmatch(c) else '' for c in chars]
 i=0
 while i<len(chars):
  match=next(((w,v) for w,v in ordered if s.startswith(w,i)),None)
  if match:
   w,v=match;v=v if isinstance(v,list) else v.split(' ')
   if len(w)==len(v):out[i:i+len(w)]=v;i+=len(w);continue
  i+=1
 for i,c in enumerate(chars):
  if c=='一':out[i]='yī'
  if c=='不':out[i]='bù'
 # In “分得一样多”, 得 is the structural particle, not dé (obtain).
 for match in re.finditer('分得',s):out[match.start()+1]='de'
 return out

def main():
 global STORY,BASE,PINYIN,HERE
 parser=argparse.ArgumentParser(description=__doc__)
 parser.add_argument('--story',type=Path,default=STORY,help='Pinned pilot story.json')
 parser.add_argument('--baseline',type=Path,default=BASE,help='Pinned released reading_data.js')
 parser.add_argument('--pinyin',type=Path,default=PINYIN,help='Pinned pilot pinyin fixture')
 parser.add_argument('--out-dir',type=Path,default=HERE,help='Directory for generated candidate files')
 args=parser.parse_args();STORY=args.story;BASE=args.baseline;PINYIN=args.pinyin;HERE=args.out_dir
 HERE.mkdir(parents=True,exist_ok=True)
 src=load_story(); old=load_baseline(); result=copy.deepcopy(old)
 assert len(src['days'])==84 and [d['day'] for d in src['days']]==list(range(1,85))
 pinyin_raw=PINYIN.read_bytes()
 if sha(pinyin_raw)!=PINYIN_SHA:raise ValueError('Pinned pilot pinyin fixture differs; verify before continuing.')
 pilot=json.loads(pinyin_raw);assert pilot['sourceCommit']==REV
 for m in result['materials']:m['courseId']=OLD
 for s in result['diagnostics']['sets']:
  s['courseId']=OLD
  for f in s['forms']:
   for m in f['materials']:m['courseId']=OLD
 old_ids={m['id'] for m in result['materials']};old_q={q['id'] for m in result['materials'] for q in m['questions']}
 for s in result['diagnostics']['sets']:
  for f in s['forms']:
   for m in f['materials']:
    assert m['id'] not in old_ids;old_ids.add(m['id'])
    for q in m['questions']:assert q['id'] not in old_q;old_q.add(q['id'])
 result['courseScope']={'schema':1,'activeCourseId':NEW,'legacyCourseIds':[OLD]}
 result['compatibility']={'fromContentHash':old['contentHash'],'changedMaterialIds':[],
   'policy':'Old material text and questions are retained under their original IDs. Preserve events and back up raw record before any upgrade.'}
 result['version']='R2-84D-candidate-not-released';result['sourceCommit']=REV
 result['weeks']=[];result['lessons']=[];changes={}
 for week in range(1,13):result['weeks'].append({'week':week,'stage':(week-1)//4+1,
  'theme':f'第 {week} 周故事与推理','goals':['阅读故事、寻找线索、动手推理'],
  'knownMath':[],'estimatedMinutes':15,'entryCriteria':'按照自己的节奏开始。',
  'reviewTask':'回看做过的题；已见过的原文不作为未见证据。',
  'standard':'本课程题目标签尚待独立审校，暂不据此评估能力。',
  'nextCriteria':'根据学习体验和家长判断继续；不依据未审核分类作能力评级。','tags':[]})
 all_new=[]
 for original in src['days']:
  d,edits=rewrite_day(original);day=d['day'];week=(day-1)//7+1;changes[str(day)]=edits
  assert len(d['questions'])==3 and d['extra']['id']==f'S{day:02d}-X'
  for i,q in enumerate(d['questions'],1):assert q['id']==f'S{day:02d}-{i}'
  text=''.join(d['story']);panels=[{'text':p,'scene':'library','cast':['tianle','xiaohe','tuantuan'],'action':'read','prop':'book'} for p in d['story']]
  common={'courseId':NEW,'day':day,'week':week,'title':d['title'],'text':text,
   'goal':'阅读故事，寻找线索并尝试推理。','tags':[],'difficulty':None,'focusWords':[],
   'prerequisites':[],'prerequisitesStatus':'unreviewed','panels':panels,'exposureGroup':f'R2-D{day:03d}-PASSAGE',
   'source':{'commit':REV,'day':day,'originalTitle':original['title'],'originalStory':copy.deepcopy(original['story'])},
   'metadataStatus':'unreviewed'}
  core={**copy.deepcopy(common),'id':f'R2-D{day:03d}-CORE','kind':'story','questions':[convert_question(q) for q in d['questions']]}
  extra={**copy.deepcopy(common),'id':f'R2-D{day:03d}-EXTRA','kind':'optional','questions':[convert_question(d['extra'])]}
  # Keep the immutable source contract even for deliberately revised prompts.
  for q,original_q in zip(core['questions'],original['questions']):q['sourceQuestion']=copy.deepcopy(original_q)
  extra['questions'][0]['sourceQuestion']=copy.deepcopy(original['extra'])
  all_new.extend([core,extra]);result['lessons'].append({'day':day,'week':week,'weekDay':(day-1)%7+1,
   'kind':'new','coreIds':[core['id']],'reserveIds':[],'optionalIds':[extra['id']],'targetMinutes':15})
 result['materials'].extend(all_new)
 # Add pilot exact pinyin without replacing any existing historical entries.
 # Normalize non-Han entries because the production reader never renders them.
 pinyin_texts=result['pinyinTexts'];pilot_texts=pilot['pinyinTexts'];conflicts=[]
 for txt,pins in pilot_texts.items():
  if len(txt)!=len(pins):raise ValueError('Unaligned pilot pinyin: '+repr(txt[:25]))
  p=[x if HAN.fullmatch(c) else '' for c,x in zip(txt,pins)]
  if txt in pinyin_texts:
   previous=[x if HAN.fullmatch(c) else '' for c,x in zip(txt,pinyin_texts[txt])]
   if previous!=p:conflicts.append(txt)
  else:pinyin_texts[txt]=p
 if conflicts:raise ValueError('Conflicting exact pinyin requires review: '+repr(conflicts[:5]))
 # Preserve old map/phrase choices for old texts. Missing characters may be added.
 for k,v in pilot['pinyinMap'].items():result['pinyinMap'].setdefault(k,v)
 for k,v in pilot['phrases'].items():result['phrases'].setdefault(k,v)
 auto=[]
 # Exact annotations for displayed content; concatenation follows paragraph order.
 for m in all_new:
  t=m['title']
  if t not in pinyin_texts:
   pinyin_texts[t]=plain_annotation(t,result['pinyinMap'],result['phrases'])
   if HAN.search(t):auto.append(t)
  for panel in m['panels']:
   t=panel['text']
   if t not in pinyin_texts:pinyin_texts[t]=plain_annotation(t,result['pinyinMap'],result['phrases']);auto.append(t)
  if m['text'] not in pinyin_texts:pinyin_texts[m['text']]=sum((pinyin_texts[p['text']] for p in m['panels']),[])
  for q in m['questions']:
   for t in [q['prompt'],q['explanation'],q['hint'],*q['options'],*q.get('items',[])]:
    if t not in pinyin_texts:
     pinyin_texts[t]=plain_annotation(t,result['pinyinMap'],result['phrases'])
     if HAN.search(t):auto.append(t)
  assert len(pinyin_texts[m['text']])==len(m['text'])
 for text in auto:
  if any(HAN.fullmatch(c) and not p for c,p in zip(text,pinyin_texts[text])):raise ValueError('Missing pinyin in edited text: '+text)
 result['pronunciationPolicy']='Existing exact pilot annotations plus automatic annotation for edited text; independent linguistic and audio review pending.'
 result['pinyinHash']=sha(canonical(pinyin_texts).encode())
 content_basis={k:v for k,v in result.items() if k not in ('contentHash','pinyinHash','pinyinTexts','pinyinMap','phrases','contextReviewedPositions','pronunciationPolicy')}
 result['contentHash']=sha(canonical(content_basis).encode())
 ids=[m['id'] for m in result['materials']]+[m['id'] for s in result['diagnostics']['sets'] for f in s['forms'] for m in f['materials']]
 qs=[q['id'] for m in result['materials'] for q in m['questions']]+[q['id'] for s in result['diagnostics']['sets'] for f in s['forms'] for m in f['materials'] for q in m['questions']]
 assert len(ids)==len(set(ids)) and len(qs)==len(set(qs))
 assert len(all_new)==168 and sum(len(m['questions']) for m in all_new)==336
 stats=collections.Counter(q['type'] for m in all_new for q in m['questions'])
 out=HERE/'candidate_reading_data.json';out.write_text(canonical(result)+'\n',encoding='utf-8')
 js=HERE/'candidate_reading_data.js';js.write_text('/* R2 candidate; not approved or published. */\nwindow.__AMC8_READING_DATA='+canonical(result).replace('<','\\u003c')+';\n',encoding='utf-8')
 report={'status':'DRAFT_STRUCTURAL_CHECKS_ONLY_NOT_APPROVED','sourceCommit':REV,'sourceStoryGitBlob':PILOT_BLOB,
  'baselineFileSha256':BASE_SHA,'pinyinFixtureSha256':PINYIN_SHA,'baselineContentHash':old['contentHash'],'candidateContentHash':result['contentHash'],
  'candidatePinyinHash':result['pinyinHash'],'oldMaterials':len(old['materials']),
  'oldDiagnostics':len(old['diagnostics']['sets']),'days':84,'coreQuestions':252,'optionalQuestions':84,
  'questionTypes':dict(sorted(stats.items())),'edits':{k:v for k,v in changes.items() if v},
  'autoAnnotatedEditedTexts':sorted(set(auto)),
  'limitations':['Unreviewed classifications must be excluded from ability, error, readiness and diagnostic statistics.',
    'No release until the engine and interface support unclassified records, daily optional materials and retained legacy sessions.',
    'Pronunciation is automated; independent content, math, language, audio, device and child validation is pending.',
    'Illustrations are generic placeholders; interaction boards and weekly readiness need integration tests.']}
 (HERE/'candidate_report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
 print(json.dumps({k:report[k] for k in ['status','candidateContentHash','days','coreQuestions','optionalQuestions','questionTypes']},ensure_ascii=False))
 print('Auto-annotated Chinese texts:',len(set(auto)))
if __name__=='__main__':main()
