#!/usr/bin/env python3
"""Apply the isolated math candidate to the already-tested W1 package."""
import hashlib, importlib, json, pathlib, runpy, shutil, subprocess, sys

root=pathlib.Path(sys.argv[1]).resolve()
source=root/'source'
here=pathlib.Path(__file__).resolve().parent
def sha(p): return hashlib.sha256(p.read_bytes()).hexdigest()
inventory=json.loads((root/'tested-package-inventory.json').read_text())
if inventory.get('sourceCommit')!='b0879a40187bee2a8bbee21822afbb8f6eccc406':
 raise SystemExit('Unexpected W1 package origin')
# Check all inventoried bytes before touching the candidate.
for name,expected in inventory['files'].items():
 p=root/name
 if not p.is_file() or sha(p)!=expected: raise SystemExit('Candidate package differs: '+name)
store=source/'progress_store.js'
if sha(store)!='b2f20b213ed3b6f1a70ba5659af69802bc38d7d3612c8a7574c51a0b36414b7e':
 raise SystemExit('Unexpected FIX15 storage input')
app=source/'app.js'
subprocess.run([sys.executable,str(here/'adapt_fix15.py'),str(app),str(app.with_suffix('.w1.js'))],check=True)
app.with_suffix('.w1.js').replace(app)
shutil.copyfile(here/'overlay/source/progress_store.js',store)
# Preserve the candidate reading data instead of invoking the old compiler.
reading=sha(source/'reading_data.js')
sys.path.insert(0,str(source));importlib.import_module('build_reading').build=lambda **kwargs:None
sys.argv=[str(source/'build.py')];runpy.run_path(str(source/'build.py'),run_name='__main__')
if sha(source/'reading_data.js')!=reading:raise SystemExit('Reading data changed')
subprocess.run([sys.executable,'source/build_qa.py'],cwd=root,check=True)
print(json.dumps({'status':'ISOLATED_NOT_RELEASED','appSha256':sha(app),'storeSha256':sha(store),'readingSha256':reading,'sourceIndexSha256':sha(source/'index.html')}))
