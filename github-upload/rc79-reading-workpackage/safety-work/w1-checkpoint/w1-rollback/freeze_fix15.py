#!/usr/bin/env python3
"""Recreate the exact deployed FIX15 static tree for isolated rollback testing.

This is a software artifact only; it does not install, restore or publish it.
"""
import hashlib,json,pathlib,subprocess,sys,zipfile
repo=pathlib.Path(__file__).resolve().parents[5]
commit='b1e64e98237e5ccf6b1091be7c26e51b69364127'
out=pathlib.Path(sys.argv[1]).resolve()
entries=['index.html','source','amc8','qa','academy','assets','muse']
subprocess.run(['git','archive','--format=zip','--output='+str(out),commit,*entries],cwd=repo,check=True)
receipt=json.loads((repo/'muse/rc79/fix15/public-receipt.json').read_text())
if receipt['releasedCommit']!=commit:raise SystemExit('FIX15 receipt release mismatch')
with zipfile.ZipFile(out) as z:
 for name,row in receipt['entryFiles'].items():
  try: data=z.read(name)
  except KeyError:raise SystemExit('Missing public entry: '+name)
  if len(data)!=row['bytes'] or hashlib.sha256(data).hexdigest()!=row['sha256']:raise SystemExit('Public entry mismatch: '+name)
 print(json.dumps({'result':'PASS_PUBLIC_ENTRY_HASHES_ONLY','commit':commit,'entryCount':len(receipt['entryFiles']),'archiveSha256':hashlib.sha256(out.read_bytes()).hexdigest(),'entriesInArchive':len(z.namelist()),'browserAndDataRecovery':'NOT_TESTED'}))
