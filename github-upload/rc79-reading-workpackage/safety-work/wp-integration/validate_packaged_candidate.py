#!/usr/bin/env python3
"""Verify packaged R2 data and code; this is not a release authorization."""
import base64,gzip,hashlib,json,re,sys
from pathlib import Path
root=Path(sys.argv[1]).resolve()
candidate=Path(sys.argv[2]).resolve()
html=(root/'index.html').read_text(encoding='utf-8')
match=re.search(r'<script id="learning-delivery" type="application/json">([\s\S]*?)</script>',html)
if not match:raise RuntimeError('Final entry is missing packaged delivery configuration')
config=json.loads(match.group(1))
def unpack(row):
 encoded=b''.join(base64.b64decode(json.loads((root/part).read_text(encoding='utf-8'))['gz'],validate=True) for part in row['parts'])
 raw=gzip.decompress(encoded)
 if len(raw)!=row['bytes'] or hashlib.sha256(raw).hexdigest()!=row['id']:raise RuntimeError('Packaged payload identity mismatch')
 return raw
reading=config['reading'];rows=[r for r in reading['data'] if r.get('key')=='__AMC8_READING_DATA']
if len(rows)!=1:raise RuntimeError('Missing or duplicate packaged reading bank')
packaged=json.loads(unpack(rows[0]));expected=json.loads(candidate.read_text(encoding='utf-8'))
old_pinyin=expected.pop('pinyinTexts');projected=packaged.pop('pinyinTexts')
if packaged!=expected:raise RuntimeError('Packaged course metadata, questions or retained history changed')
if any(k not in old_pinyin or old_pinyin[k]!=v for k,v in projected.items()):raise RuntimeError('Packaged pinyin exceptions changed')
report=json.loads((root/'muse/rc79/loading-r2/package-report.json').read_text(encoding='utf-8'))
proof=report.get('pinyinProjection',[])
if len(proof)!=1 or proof[0].get('pinyinExact') is not True or proof[0].get('checked')!=len(old_pinyin) or proof[0].get('originalPinyinHash')!=expected['pinyinHash']:raise RuntimeError('Exact pinyin projection is not proven')
code=b'\n'.join(unpack(row) for row in reading['scripts']).decode('utf-8')
for marker in ['startDailyOptional','分类待审，暂不评级','data-wp-type','pilot-board-']:
 if marker not in code:raise RuntimeError('Candidate reader code missing from packaged payload: '+marker)
new=[m for m in packaged['materials'] if m.get('courseId')==packaged['courseScope']['activeCourseId']]
questions=[q for m in new for q in m['questions']]
if len(new)!=168 or len(questions)!=336 or any(q.get('metadataStatus')!='unreviewed' for q in questions):raise RuntimeError('Unexpected course size or audit status')
print(json.dumps({'result':'PASS_PACKAGED_IDENTITY','courseHash':packaged['contentHash'],'materials':len(new),'tasks':len(questions),'pinyinTextsChecked':len(old_pinyin),'payloadsRoundTrip':True,'scope':'compiled transport identity, not pedagogical or device acceptance'},ensure_ascii=False))
