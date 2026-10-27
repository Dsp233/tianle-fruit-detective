"""Wait for the precise FIX5 entry and manifest bytes on the public site."""
import concurrent.futures
import hashlib
import json
import os
from pathlib import Path
import time
import urllib.request

root=Path.cwd()
base="https://dsp233.github.io/tianle-fruit-detective/"
manifest=json.loads((root/"muse/rc79/manifest.json").read_text())
assert manifest["deliveryRevision"]=="RC79-FIX5"
rows=dict(manifest["entryFiles"])
for name in ["muse/rc79/index.html","muse/rc79/manifest.json"]:
    body=(root/name).read_bytes()
    rows[name]={"bytes":len(body),"sha256":hashlib.sha256(body).hexdigest()}

def fetch(row):
    name,want=row
    try:
        req=urllib.request.Request(base+name+"?v=fix5-public",headers={"Cache-Control":"no-cache"})
        with urllib.request.urlopen(req,timeout=25) as response:
            data=response.read()
        return name,len(data)==want["bytes"] and hashlib.sha256(data).hexdigest()==want["sha256"]
    except Exception:
        return name,False

for attempt in range(40):
    with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
        results=dict(pool.map(fetch,rows.items()))
    if all(results.values()):
        receipt={"site":base,"testedCommit":os.environ["GITHUB_SHA"],"runId":os.environ["GITHUB_RUN_ID"],
                 "entries":rows,"exactEntryCount":len(manifest["entryFiles"]),"result":"PASS"}
        Path("/tmp/fix79-public").mkdir(parents=True,exist_ok=True)
        Path("/tmp/fix79-public/byte-check.json").write_text(json.dumps(receipt,ensure_ascii=False,indent=2)+"\n")
        print("Public bytes match:",len(rows),"files")
        break
    print("Waiting for Pages:",sum(results.values()),"/",len(rows))
    time.sleep(12)
else:
    raise SystemExit("The public site did not serve every tested FIX5 entry in time.")
