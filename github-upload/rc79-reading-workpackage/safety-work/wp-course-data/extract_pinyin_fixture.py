#!/usr/bin/env python3
"""Reproduce the pinned pinyin fixture from the published v5 HTML."""
import hashlib,json,sys
from pathlib import Path
source=Path(sys.argv[1]).resolve();dest=Path(sys.argv[2]).resolve()
raw=source.read_bytes();blob=hashlib.sha1(b'blob '+str(len(raw)).encode()+b'\0'+raw).hexdigest()
if blob!='47557e039252fac0ef0f731bdba2a26d9982ff1f':raise RuntimeError('Published preview does not match pinned Git blob')
text=raw.decode('utf-8');marker='window.__PILOT_DATA__='
if text.count(marker)!=1:raise RuntimeError('Cannot identify preview data uniquely')
data=json.JSONDecoder().raw_decode(text.split(marker,1)[1])[0]
fixture={'sourceCommit':'98cfd12797013845c4771719778b9b5f62214308','sourcePath':'pilot-reading-v5/index.html',
 **{k:data[k] for k in ('contentHash','compiler','pinyinPolicy','pinyinMap','pinyinTexts','phrases')}}
payload=(json.dumps(fixture,ensure_ascii=False,separators=(',',':'))+'\n').encode('utf-8')
if hashlib.sha256(payload).hexdigest()!='5684c4d6e73f979bbb4097172dd53fb1443ef3bc087d858000905342f74eb13f':raise RuntimeError('Reconstructed pinyin fixture hash mismatch')
dest.parent.mkdir(parents=True,exist_ok=True);dest.write_bytes(payload)
print(json.dumps({'status':'PASS_EXACT_PINYIN_FIXTURE','bytes':len(payload),'sourceBlob':blob}))
