"""Read-only check that the deployed receipt and reports match verified bytes."""
import concurrent.futures
import hashlib
import json
import time
import urllib.request
from pathlib import Path

here=Path(__file__).resolve().parent
expected=json.loads((here/'fix15-public-expected.json').read_text(encoding='utf-8'))
assert expected['base']=='https://dsp233.github.io/tianle-fruit-detective/muse/rc79/fix15/'
assert len(expected['files'])==15 and all('/' not in name and '..' not in name for name in expected['files'])

def get(name):
 request=urllib.request.Request(expected['base']+name,headers={'Cache-Control':'no-cache','Accept-Encoding':'identity','User-Agent':'RC79-FIX15-Public-Receipt-Check'})
 with urllib.request.urlopen(request,timeout=25) as response: raw=response.read()
 if hashlib.sha256(raw).hexdigest()!=expected['files'][name]:raise ValueError('Published bytes do not yet match '+name)
 obj=json.loads(raw)
 if name=='public-receipt.json':
  assert obj['result']=='PASS_WITH_REMAINING_WORK' and obj['releasedCommit']==expected['releaseCommit'] and obj['publicRunId']==expected['publicRunId'] and obj['exactEntryCount']==13
 return name

last_error=None
for attempt in range(1,16):
 try:
  with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool: checked=list(pool.map(get,expected['files']))
  result={'result':'PASS','releaseCommit':expected['releaseCommit'],'publicRunId':expected['publicRunId'],'filesChecked':len(checked),'scope':'public receipt and reports; no real learner data'}
  dest=Path('/tmp/fix15-receipt-check');dest.mkdir(parents=True,exist_ok=True);(dest/'receipt-availability.json').write_text(json.dumps(result,indent=2)+'\n');print(json.dumps(result));break
 except Exception as error:
  last_error=error;print('Receipt availability attempt',attempt,'did not yet match:',str(error),flush=True)
  if attempt<15:time.sleep(8)
else:raise SystemExit('Public receipt did not match expected bytes: '+str(last_error))
