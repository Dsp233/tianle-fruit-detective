"""Gate on every active entry hash; unchanged home bytes alone cannot prove maintenance deployment."""
import concurrent.futures
import hashlib
import json
from pathlib import Path
import time
import urllib.request

receipt=json.loads(Path('muse/rc79/loading-r2/candidate-receipt.json').read_text())
base=receipt['site']
def check(row):
    name,want=row
    try:
        data=urllib.request.urlopen(base+name+'?delivery=LOAD2-PUBLISH',timeout=20).read()
        return hashlib.sha256(data).hexdigest()==want['sha256']
    except Exception:
        return False
for attempt in range(30):
    with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
        results=list(pool.map(check,receipt['entries'].items()))
    if all(results):
        print('Exact production entry bytes are live:',len(results));break
    print('Waiting for Pages:',sum(results),'/',len(results))
    time.sleep(15)
else:
    raise SystemExit('Pages did not serve expected delivery entries within 8 minutes')
