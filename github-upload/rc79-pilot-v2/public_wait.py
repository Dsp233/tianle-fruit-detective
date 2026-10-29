"""Wait until Pages serves precisely the tested isolated preview files."""
import hashlib,json,os,time,urllib.request
from pathlib import Path
base='https://dsp233.github.io/tianle-fruit-detective/'
names=['pilot-reading-v2/index.html','pilot-reading-v2/build.json','pilot-reading-v2/browser-check.json']
expected={p:hashlib.sha256(Path(p).read_bytes()).hexdigest() for p in names}
for attempt in range(45):
 found=[]
 for p in names:
  try:
   req=urllib.request.Request(base+p+'?preview='+os.environ['GITHUB_SHA'],headers={'Cache-Control':'no-cache'})
   with urllib.request.urlopen(req,timeout=15) as response:body=response.read()
   if hashlib.sha256(body).hexdigest()==expected[p]:found.append(p)
  except Exception:pass
 if len(found)==len(names):
  out=Path('/tmp/pilot-public');out.mkdir(parents=True,exist_ok=True)
  (out/'public-byte-check.json').write_text(json.dumps({'result':'PASS','scope':'isolated preview only','files':expected,'testedCommit':os.environ['GITHUB_SHA'],'runId':os.environ['GITHUB_RUN_ID']},indent=2)+'\n')
  print('PASS: public preview bytes match',len(found));break
 print('Waiting for public preview:',len(found),'/',len(names),flush=True);time.sleep(10)
else:raise SystemExit('Pages did not serve the expected preview files')
