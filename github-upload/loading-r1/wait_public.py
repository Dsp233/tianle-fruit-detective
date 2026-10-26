"""Wait for Pages to serve this delivery's exact entry bytes, not an older cache."""
import hashlib
from pathlib import Path
import time
import urllib.request

base = 'https://dsp233.github.io/tianle-fruit-detective/'
expected = hashlib.sha256(Path('index.html').read_bytes()).hexdigest()
for attempt in range(30):
    try:
        data = urllib.request.urlopen(base + '?delivery=RC79-LOAD1-' + str(attempt), timeout=30).read()
        if hashlib.sha256(data).hexdigest() == expected:
            print('Exact production entry bytes are live:', expected)
            break
    except Exception as error:
        print(type(error).__name__)
    time.sleep(15)
else:
    raise SystemExit('Pages did not serve expected loading delivery within 8 minutes')
