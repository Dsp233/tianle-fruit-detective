#!/usr/bin/env python3
"""Preview-only same-entry review overlay. Never write to main or production."""
from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED
from hashlib import sha256
import json, sys
source=Path(sys.argv[1])
out=Path(sys.argv[2]);out.parent.mkdir(parents=True,exist_ok=True)
root=Path(__file__).parent
notes=[]
with ZipFile(source) as z, ZipFile(out,'w',compression=ZIP_DEFLATED,compresslevel=6) as dest:
    public=[p for p in z.namelist() if p=='index.html' or p in ('academy/index.html','amc8/index.html') or p.startswith(('assets/','muse/rc79/'))]
    assert len(public)>=430, len(public)
    seen=set()
    for path in public:
        if path in seen or path.endswith('/'):continue
        seen.add(path)
        old=z.read(path)
        data=old
        if path=='index.html':
            text=old.decode('utf-8')
            assert text.count('</body>')==1
            assert 'review-overlay.js' not in text and 'review.html' not in text
            text=text.replace('</body>', '''<!-- Preview-only QA layer. The W1 learning application is otherwise unmodified. -->
<script src="./review-overlay.js" defer></script>
</body>''')
            data=text.encode('utf-8')
        notes.append(dict(path=path,sha256=sha256(data).hexdigest(),originalSha256=sha256(old).hexdigest()))
        dest.writestr(path,data)
    for path in ['review-overlay.js','review-overlay.css']:
        data=(root/path).read_bytes()
        notes.append(dict(path=path,sha256=sha256(data).hexdigest(),originalSha256=None))
        dest.writestr(path,data)
    receipt={'schema':1,'status':'PREVIEW_QA_NOT_PRODUCTION','productSourceCommit':'c8575da9d28c40b5bf79412928a0be8c397e7094','sourceArtifactId':13595790278,'notes':"Same public path / with native overlay. No review.html link or iframe. Frozen product files preserved except index.html append-only QA script reference. G4-E with actual iPad still required.",'files':notes}
    dest.writestr('review-preview-identity.json',json.dumps(receipt,ensure_ascii=False,indent=2).encode('utf-8'))
print(json.dumps({'file':str(out),'fileCount':len(notes),'originalIndexSha256':next(x['originalSha256'] for x in notes if x['path']=='index.html'),'overlayIndexSha256':next(x['sha256'] for x in notes if x['path']=='index.html'),'sizeBytes':out.stat().st_size},ensure_ascii=False))
