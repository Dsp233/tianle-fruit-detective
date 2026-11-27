"""Read existing actual profile evidence, no test rerun, and exact-ID evidence joins."""
import json,hashlib,collections,os
from pathlib import Path
D=Path('tools/r11-product');OUT=Path('r11-probe-output');OUT.mkdir(exist_ok=True)
src=json.loads((D/'d-r11-original-contract-source-20261127.json').read_text())
routes=json.loads((D/'d-r11-remaining-adjudicated-routes-20261127.json').read_text())
def compact_event(v):
 return {k:v.get(k) for k in ('eventId','type','attemptId','taskId','mathKey','input','normalizedInput','result','submissionOrdinal','recordOrdinal','supportSnapshot','priorExposure','connectedGroupId','connectedStage','originProblemGroupId','structureClusterId','evidenceScope')}
profiles=[]
for f in sorted(Path('/tmp/d-profile-results').rglob('d-shared-continuation-*.json')):
 x=json.loads(f.read_text())
 if not 'profile' in x:continue
 def checkshot(obj):
  if isinstance(obj,dict):
   if 'file' in obj and 'sha256' in obj:
    p=f.parent/obj['file'];assert p.exists() and hashlib.sha256(p.read_bytes()).hexdigest()==obj['sha256'],p
    return 1
   return sum(checkshot(v) for v in obj.values())
  if isinstance(obj,list):return sum(checkshot(v) for v in obj)
  return 0
 n=checkshot(x)
 y={'profile':x['profile'],'kind':x['kind'],'engine':x['engine'],'status':x['status'],'errors':x['errors'],'verifiedScreenshots':n,'sha256':hashlib.sha256(f.read_bytes()).hexdigest(),'priorEventsRetained':x.get('priorEventsRetained'),'afterParentEventsExact':x.get('afterParentEventsExact'),'alternativeEntry':x.get('alternativeEntry'),'afterReadingEventsExact':x.get('afterReadingEventsExact'),'priorReadingAttemptsRetained':x.get('priorReadingAttemptsRetained'),'mathEventsExact':x.get('mathEventsExact'),'parentSummary':x.get('parentSummary'),'history':x.get('history'),'recommendation':x.get('recommendation'),'viewportDelta':x.get('viewportDelta'),'steps':[]}
 for step in x.get('newSteps',[]):
  z={'id':step['id'],'before':{k:step['before'].get(k) for k in ('attemptId','id','submissionOrdinal','profileSnapshot','helpLevel')},'frozenPrompt':step.get('frozenPrompt'),'frozenAnswer':step.get('frozenAnswer'),'derivation':step.get('frozenDerivation'),'wrong':[{'value':q['value'],'outcome':q['actual'].get('feedback'),'ordinal':q['actual'].get('submissionOrdinal'),'attemptId':q['actual'].get('attemptId'),'shot':q['shot']} for q in step.get('wrong',[])],'hints':[{'level':q['actual'].get('helpLevel'),'attemptId':q['actual'].get('attemptId'),'shot':q['shot']} for q in step.get('help',[])],'submit':{k:(step.get('submit') or {}).get(k) for k in ('attemptId','submissionOrdinal','helpLevel','feedback','id')},'accessBefore':{k:(step.get('accessBefore') or {}).get(k) for k in ('attemptId','helpLevel','submissionOrdinal')},'accessAfter':{k:(step.get('accessAfter') or {}).get(k) for k in ('attemptId','helpLevel','submissionOrdinal')},'speechRequest':step.get('speechRequest'),'speechStop':step.get('speechStop')}
  y['steps'].append(z)
 y['newEvents']=[compact_event(v) for v in x.get('newEvents',[]) if isinstance(v,dict)]
 for v in x.get('newEvents',[]):
  if isinstance(v,dict) and v.get('type')=='response_submitted':
   try:q=json.loads(v.get('taskEvidenceKey','{}')); y.setdefault('presentedHints',[]).append({'taskId':v.get('taskId'),'attemptId':v.get('attemptId'),'hints':q.get('presentedHints'),'options':q.get('presentedOptions')})
   except:pass
 y['readingSteps']=[{k:v.get(k) for k in ('day','questionId','derivation','newAttempts','charLookup','speech','gap','shot','afterShot')} for v in x.get('readingSteps',[])]
 profiles.append(y)
assert len(profiles)==8,len(profiles)
(OUT/'d-shared-profile-raw-adjudication-input.json').write_text(json.dumps(profiles,ensure_ascii=False,indent=2))
for x in profiles:
 # emit compact real record; no inferred passes.
 print('D_PROFILE_RAW '+json.dumps({**{k:v for k,v in x.items() if k not in ('newEvents','parentSummary','history','recommendation','viewportDelta','readingSteps')},'newEvents':x['newEvents'],'parentSummaryText':(x.get('parentSummary') or {}).get('text','')[:4500],'historyText':(x.get('history') or {}).get('text','')[:2000],'recommendationText':(x.get('recommendation') or {}).get('text','')[:2500],'readingSteps':[{k:v.get(k) for k in ('day','questionId','derivation','newAttempts','charLookup','gap')} for v in x['readingSteps']],'widths':[{ 'width':v['width'],'viewport':v['dom']['viewport'],'scroll':v['dom']['scroll']} for v in x.get('viewportDelta') or []]},ensure_ascii=False),flush=True)
# Search actual retained row-level receipt references across all existing D files, without assuming same-name namespaces.
original={r[1]:r for r in src['contracts']}; remaining={r['contractId']:r for r in routes['rows']}
hits={id:[] for id in remaining}
def walk(x,path,f):
 if isinstance(x,dict):
  for key in ('contractId','caseId'):
   val=x.get(key)
   if isinstance(val,str) and val in hits and not f.name.startswith(('d-r11-original','d-r11-remaining','d-final-remaining')):
    hits[val].append({'file':f.name,'jsonPath':path,'key':key,'status':x.get('status'),'review':x.get('review') or x.get('evidence') or x.get('missing'),'index':x.get('index'),'run':x.get('run') or x.get('runs'),'artifact':x.get('artifact')})
  for k,v in x.items():walk(v,path+'/'+k,f)
 elif isinstance(x,list):
  for i,v in enumerate(x):walk(v,path+'/'+str(i),f)
files=sorted(D.glob('*.json'));read=0;bad=[]
for f in files:
 if f.name.startswith(('d-r11-original','d-r11-remaining','d-final-remaining')):continue
 try:walk(json.loads(f.read_text()),'',f);read+=1
 except Exception as e:bad.append({'file':f.name,'error':repr(e)})
allrows=[{'id':i,'originalIndex':remaining[i]['index'],'route':remaining[i]['route'],'candidateReferences':v} for i,v in hits.items()]
out={'scannedFiles':read,'parseErrors':bad,'remaining':len(hits),'withExactReference':sum(bool(v) for v in hits.values()),'previouslyUnmatchedWithNewReference':[i for i,v in hits.items() if v and not remaining[i]['candidates']],'rows':allrows,'note':'IDs alone are candidates, not semantic or namespace proof; compare original action and actual receipt before signing.'}
(OUT/'d-all-existing-exact-evidence-join.json').write_text(json.dumps(out,ensure_ascii=False,indent=2))
print('D_ALL_EVIDENCE_JOIN '+json.dumps({k:v for k,v in out.items() if k!='rows'},ensure_ascii=False),flush=True)
