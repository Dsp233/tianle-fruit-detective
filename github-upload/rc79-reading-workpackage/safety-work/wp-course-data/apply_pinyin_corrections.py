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
