"""Consume already-recorded RC73 original and true-hint observations; no browser rerun."""
import os,json,re,hashlib,collections,xml.etree.ElementTree as ET
from pathlib import Path
OUT=Path('r11-probe-output');OUT.mkdir(exist_ok=True)
shard=int(os.environ['D_SHARD'])
old=next(Path('/tmp/d-original').rglob(f'd-rc73-stage-chromium-{shard}.json'))
new=next(Path('/tmp/d-next').rglob(f'd-variation-true-hint-delta-chromium-{shard}.json'))
a=json.loads(old.read_text());b=json.loads(new.read_text());bd={r['caseId']:r for r in b['rows']}
assert set(bd)=={r['caseId'] for r in a['rows']}
def figure(s):
 try:
  root=ET.fromstring(s)
  return {'label':root.get('aria-label'),'texts':[''.join(x.itertext()).strip() for x in root.iter() if x.tag.split('}')[-1] in ('text','title','desc')],'counts':dict(collections.Counter(x.tag.split('}')[-1] for x in root.iter())),'hash':hashlib.sha256(s.encode()).hexdigest()}
 except Exception as e:return {'parseError':repr(e),'head':s[:150]}
def phase(o):
 v=o['state']['view']
 return {'name':o['name'],'scope':o['scope'],'text':v['text'],'figures':[figure(x) for x in v['figures']],'controls':v['controls'],'help':o['state']['help'],'shot':o['shot'],'sha256':o['sha256']}
out=[]
for r in a['rows']:
 n=bd[r['caseId']]
 stages=[phase(x) for x in r['phases']]
 rec={'id':r['caseId'],'recipe':r['recipe'],'task':r['taskId'],'stages':stages,'actualNextHints':n.get('actualAdditionalHints'),'preClick':n.get('preClick'),'mainUnchanged':n.get('mainUnchanged'),'noCorrectSubmission':n.get('noCorrectSubmission')}
 out.append(rec)
 f=r['recipe']['familyId']
 # Print complete relevant content of one representative per configuration; preserve full raw figures/controls in output.
 def trimmed(t):
  lines=[s.strip() for s in t.splitlines() if s.strip()]
  return '\n'.join(lines[-70:])[:2500]
 print('D_SEMANTIC '+json.dumps({'id':rec['id'],'recipe':rec['recipe'],'initial':trimmed(stages[0]['text']),'figures':stages[0]['figures'],'mainHint':trimmed(next(x['text'] for x in stages if x['name']=='main-hint-1')),'mainSolution':trimmed(next(x['text'] for x in stages if x['name']=='main-solution')),'variant':trimmed(next(x['text'] for x in stages if x['name']=='variation-before')),'variantFigures':next(x['figures'] for x in stages if x['name']=='variation-before'),'variantTrueHint':(n.get('preClick') or {}).get('dom',{}).get('text','')[-2500:],'mainUnchanged':n.get('mainUnchanged'),'noCorrectSubmission':n.get('noCorrectSubmission')},ensure_ascii=False),flush=True)
(OUT/f'd-rc73-semantic-{shard}.json').write_text(json.dumps(out,ensure_ascii=False,indent=2))
print('D_SEMANTIC_SUMMARY '+json.dumps({'shard':shard,'rows':len(out),'unique':len({x['id'] for x in out}),'sourceRun':45646170985,'trueHintRun':45918409638,'sourceHash':hashlib.sha256(old.read_bytes()).hexdigest(),'nextHash':hashlib.sha256(new.read_bytes()).hexdigest()}),flush=True)
