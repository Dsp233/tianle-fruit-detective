#!/usr/bin/env python3
"""Join existing RC73 native-Chromium exact identity and independent grade evidence. No new submissions."""
import json, hashlib, subprocess
from pathlib import Path
from collections import Counter
ROOT=Path(__file__).resolve().parents[2]
BASE="72f2f229246af362f9024db217479357890c8cd3"
assert (ROOT/'index.html').read_bytes()==subprocess.check_output(['git','show',BASE+':index.html'],cwd=ROOT)
OUT=ROOT/'r11-probe-output';OUT.mkdir(exist_ok=True)
P=Path('/tmp/rc73-main')
hashes=['1595decef7bb6d69d3534134ab88b225dafa1fc8ec9e65bd68afce89d1a7a9f1','a3dc86efe77a2a10441324bea3bc8e6768aaac04441378c6e24c673f5e39d82b','c09f69e2e2796f5d7535b2af5d573e5afbfba3339f029ec4096c7fa5b19343db','63d998ed82a8121724f7a539bcad52ef24e37470fc297c3cc7428f3b3316cb2b','6b7294a1b5781b141dd6fcf5e207fa101deac93c40bc11c99043adcd4a86d90e']
proj={}
for i,d in enumerate(hashes):
 raw=(P/f'rc73-projection-shard-{i}.json').read_bytes();assert hashlib.sha256(raw).hexdigest()==d
 for x in json.loads(raw):
  assert x['caseId'] not in proj;proj[x['caseId']]=x
assert len(proj)==765
seen={}
for run,folder in [(45421606926,'grade1'),(45422113177,'grade2'),(45422743251,'grade3')]:
 for p in sorted(Path('/tmp/'+folder).glob('rc73-main-grade-[0-4].json')):
  for x in json.loads(p.read_text()):
   if x['status']!='VERIFIED':continue
   e=proj[x['caseId']]
   assert x['requested']==e['requested'] and x['taskId']==e['loaded']['taskId']
   assert x['promptSha256']==hashlib.sha256(e['main']['text'].encode()).hexdigest()
   a=x['actual'];assert a['answerState']=='correct' and a['feedback']['ok'] and a['passed'] and a['submissionKey'] and not a['help']['solutionSeen'] and not a['help']['revealedHintIds']
   seen[x['caseId']]={'caseId':x['caseId'],'requested':x['requested'],'taskId':x['taskId'],'status':'RC73_VERIFIED','run':run,'promptSha256':x['promptSha256'],'submissionKey':a['submissionKey']}
prior=[]
for run,filename in [(45394203843,Path('/tmp/prior1/competition-grade.json')),(45394559778,ROOT/'tools/r11-product/d-competition-grade-remaining-receipt.json')]:
 for x in json.loads(filename.read_text())['rows']:
  a=x.get('actual',{});item=a.get('item') or {};m=item.get('draft',{}).get('work',{}).get('scopes',{}).get('main',{})
  if x['status']=='VISIBLE_SUBMITTED' and item.get('passed') and m.get('answerState')=='correct' and m.get('feedback',{}).get('ok') and m.get('lastSubmissionKey') and not m.get('help',{}).get('solutionSeen') and not m.get('help',{}).get('revealedHintIds'):
   prior.append((run,x,m))
rows=[]
for cid,e in sorted(proj.items()):
 if cid in seen:rows.append(seen[cid]);continue
 row={'caseId':cid,'requested':e['requested'],'taskId':e.get('loaded',{}).get('taskId'),'status':'UNMATCHED'}
 if e['expectedTrack']=='POLICY_BLOCKED':
  row['status']='POLICY_PROMPT_OBSERVED_ONLY'
 else:
  for run,x,m in prior:
   if x['requested']==e['requested'] and x['id']==row['taskId'] and sorted(x['observed']['text'].splitlines())==sorted(e['main']['text'].splitlines()):
    row.update(status='REUSED_EXACT_RECIPE_GRADE',run=run,submissionKey=m['lastSubmissionKey'],promptSha256=hashlib.sha256(e['main']['text'].encode()).hexdigest());break
 rows.append(row)
receipt={'base':BASE,'scope':'Native Chromium main correct grading only; no new submissions; no new independent derivation credit; no other RC73 environment or variation signoff','counts':dict(Counter(x['status'] for x in rows)),'unmatched':[x for x in rows if x['status']=='UNMATCHED'],'rows':rows}
(OUT/'rc73-main-evidence-join.json').write_text(json.dumps(receipt,ensure_ascii=False,indent=2))
print('RC73_JOIN '+json.dumps({k:v for k,v in receipt.items() if k!='rows'},ensure_ascii=False),flush=True)
