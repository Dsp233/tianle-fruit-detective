import json,re
from pathlib import Path
D=json.loads(Path('restored-workpackage/safety-work/wp-course-data/candidate_reading_data.json').read_text()); T=D['pinyinTexts']; active=D['courseScope']['activeCourseId']
def strings(o):
 if isinstance(o,str):yield o
 elif isinstance(o,list):
  for a in o:yield from strings(a)
 elif isinstance(o,dict):
  for a in o.values():yield from strings(a)
raw=Path('restored-workpackage/safety-work/baseline/source/reading_data.js').read_text();prefix='window.__AMC8_READING_DATA='
assert raw.count(prefix)==1 and raw.rstrip().endswith(';')
old=json.loads(raw.split(prefix,1)[1].strip()[:-1])
legacy=set()
for key in ('materials','diagnostics','weeks','lessons'):
 legacy.update(strings(old.get(key,{})))
for m in D['materials']:
 if m.get('courseId')!=active:legacy.update(strings(m))
for s in D['diagnostics']['sets']:
 if s.get('courseId')!=active:legacy.update(strings(s))
active_strings={}
for m in D['materials']:
 if m.get('courseId')==active:
  for s in strings(m):active_strings.setdefault(s,set()).add(m['id'])
proposals=[]
for line in Path('w1-review-36-60.md').read_text().splitlines():
 m=re.match(r'^\|(\d+)\|([^|]+)\|([^|]+)\|([^ ]+) ([^ ]+) → ([^|]+)\|(\d+)\|$',line)
 if m:
  day,fields,snippet,ch,old,new,pos=m.groups(); proposals.append((int(day),fields,snippet,ch,old,new,int(pos),'36–60'))
# Specify full contexts for manually checked first audit and the two extra findings.
extras=[(16,'R2-S16-3:explanation','确为','为','wèi','wéi'),(17,'R2-S17-2:option0','先短后长','长','zhǎng','cháng'),(17,'R2-S17-2:option1','先长后短','长','zhǎng','cháng'),(23,'原文','为空','为','wèi','wéi'),(51,'原文','放得下','得','dé','de'),(84,'原文','行得通','得','dé','de')]
for day,fields,snippet,ch,old,new in extras:
 for s,ids in active_strings.items():
  if not any(x.startswith('R2-D%03d-'%day) for x in ids) or snippet not in s or s not in T:continue
  for a in re.finditer(re.escape(snippet),s):
   pos=a.start()+snippet.index(ch)
   if T[s][pos]==old:proposals.append((day,fields,snippet,ch,old,new,pos,'manual'))
rows={}; unresolved=[]; conflicts=[]
for day,fields,snippet,ch,old,new,pos,source in proposals:
 matches=[]
 for s,ids in active_strings.items():
  if not any(x.startswith('R2-D%03d-'%day) for x in ids) or snippet not in s or s not in T or pos>=len(s) or s[pos]!=ch or T[s][pos]!=old:continue
  matches.append((s,ids))
 if '原文' in fields and len(matches)>1:
  longest=max(len(x[0]) for x in matches);matches=[x for x in matches if len(x[0])==longest]
 if len(matches)!=1:
  unresolved.append({'day':day,'fields':fields,'snippet':snippet,'position':pos,'reason':'candidate matches '+str(len(matches))});continue
 s,ids=matches[0]; k=(s,pos)
 row={'text':s,'position':pos,'character':ch,'old':old,'new':new,'days':[day],'materialIds':sorted(ids),'sources':[source],'fields':fields}
 if s in legacy:conflicts.append({**row,'reason':'exact string appears in legacy course or diagnosis; refuse global change'});continue
 if k in rows:
  if rows[k]['new']!=new:raise RuntimeError('Conflicting corrections')
  rows[k]['days']=sorted(set(rows[k]['days']+[day]));rows[k]['materialIds']=sorted(set(rows[k]['materialIds'])|ids)
 else:rows[k]=row
 # A passage is projected both as its full text and per panel. Preserve the
 # corresponding character mapping only for exact contained strings in that day.
 if '原文' in fields:
  for sub,subids in active_strings.items():
   if sub==s or not sub or sub not in s or sub not in T or not any(x.startswith('R2-D%03d-'%day) for x in subids):continue
   offsets=[m.start() for m in re.finditer(re.escape(sub),s)]
   indexes=[pos-offset for offset in offsets if 0<=pos-offset<len(sub) and sub[pos-offset]==ch and T[sub][pos-offset]==old]
   for subpos in indexes:
    subrow={**row,'text':sub,'position':subpos,'materialIds':sorted(subids),'fields':fields+' [exact projection]'}
    if sub in legacy:conflicts.append({**subrow,'reason':'exact string appears in legacy course or diagnosis; refuse global change'})
    elif (sub,subpos) not in rows:rows[(sub,subpos)]=subrow
# Merge the separately reviewed 61–84 exact findings; verify every source.
third=json.loads(Path('w1-pinyin-patch/review-61-84.json').read_text())
assert third['contentHash']==D['contentHash']
for item in third['corrections']:
 day=item['day'];full=item['text'];pos=item['position'];ch=item['character'];old=item['old'];new=item['new']
 if full not in active_strings or full not in T or pos>=len(full) or full[pos]!=ch or T[full][pos]!=old:raise RuntimeError('Unverified third audit item '+repr(item))
 row={'text':full,'position':pos,'character':ch,'old':old,'new':new,'days':[day],'materialIds':sorted(active_strings[full]),'sources':['61–84'],'fields':item['source']}
 if full in legacy:conflicts.append({**row,'reason':'exact string appears in legacy course or diagnosis; refuse global change'});continue
 key=(full,pos)
 if key in rows and rows[key]['new']!=new:raise RuntimeError('conflicting third audit item')
 rows[key]=row
 if item['source']=='正文':
  for sub,subids in active_strings.items():
   if sub==full or not sub or sub not in full or sub not in T or not any(x.startswith('R2-D%03d-'%day) for x in subids):continue
   for mt in re.finditer(re.escape(sub),full):
    subpos=pos-mt.start()
    if not (0<=subpos<len(sub) and sub[subpos]==ch and T[sub][subpos]==old):continue
    subrow={**row,'text':sub,'position':subpos,'materialIds':sorted(subids),'fields':'正文 [exact projection]'}
    if sub in legacy:conflicts.append({**subrow,'reason':'exact string appears in legacy course or diagnosis; refuse global change'})
    elif (sub,subpos) not in rows:rows[(sub,subpos)]=subrow
out={'contentHash':D['contentHash'],'status':'PROPOSAL_NOT_APPLIED','patches':list(rows.values()),'blockedLegacyShared':conflicts,'unresolved':unresolved,'limitations':['Not a complete review of all pronunciation or all UI fallback paths.','Disputed 当天 and 一/不 tone sandhi intentionally excluded.','The 61–84 list is a targeted audit of selected contextual words, not full linguistic review.','Patch exact text keys only; do not globally change legacy-shared keys.']}
Path('w1-pinyin-patch/proposal.json').write_text(json.dumps(out,ensure_ascii=False,indent=2)+'\n')
print('patches',len(rows),'blocked',len(conflicts),'unresolved',len(unresolved));print(json.dumps(unresolved,ensure_ascii=False)[:3000])
