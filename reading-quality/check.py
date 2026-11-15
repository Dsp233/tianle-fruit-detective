"""Independent invariants on the released artifacts and editorial delta."""
import base64,gzip,hashlib,json,re,subprocess
from pathlib import Path
R=Path(__file__).resolve().parents[1];B='b39ece48917d834e611565432e6cbe7f59ec2edd'
def old(p):return subprocess.check_output(['git','show',B+':'+p],cwd=R)
def cfg(b):return json.loads(re.search(rb'<script id="learning-delivery" type="application/json">(.*?)</script>',b).group(1))
def unpack(row,read):
 b=gzip.decompress(b''.join(base64.b64decode(json.loads(read(p))['gz']) for p in row['parts']))
 assert hashlib.sha256(b).hexdigest()==row['id'];assert len(b)==row['bytes'];return b
def new(p):return (R/p).read_bytes()
a=cfg(old('index.html'));b=cfg(new('index.html'))
assert {k:v for k,v in a.items() if k!='reading'}=={k:v for k,v in b.items() if k!='reading'}
x=json.loads(unpack(a['reading']['data'][0],old));y=json.loads(unpack(b['reading']['data'][0],new))
xjs=unpack(a['reading']['scripts'][0],old);yjs=unpack(b['reading']['scripts'][0],new)
assert xjs.split(b'window.__AMC8_ReadingRuntime=')[0]==yjs.split(b'window.__AMC8_ReadingRuntime=')[0], 'Storage, grading, voice and engine must be byte-identical'
# Drop only explicitly allowed display fields, comparing all executable constraints/answers.
DISPLAY={'text','panels','title','prompt','options','explanation','focusWords','hint','goal','feedback','summary','note'}
def rules(v):
 if isinstance(v,list):return [rules(z) for z in v]
 if isinstance(v,dict):return {k:rules(z) for k,z in v.items() if k not in DISPLAY}
 return v
assert len(x['materials'])==len(y['materials'])==420
for before,after in zip(x['materials'],y['materials']):
 assert rules(before)==rules(after),(before['id'],'non-display rule altered')
 assert len(before['questions'])==len(after['questions'])
 for q,n in zip(before['questions'],after['questions']):
  assert q['answer']==n['answer'] and q['type']==n['type'] and len(q.get('options',[]))==len(n.get('options',[])),q['id']
 if before.get('courseId')!='R2-84D-20261031':assert before==after
for k in ['lessons','diagnostics','courseScope','pinyinMap','phrases','contextReviewedPositions']:assert x[k]==y[k],k
changed=[m['id'] for m,n in zip(x['materials'],y['materials']) if m!=n]
assert y['compatibility']['fromContentHash']==x['contentHash'] and y['compatibility']['changedMaterialIds']==changed
for t,p in y['pinyinTexts'].items():
 assert len(t)==len(p),(t,'alignment')
 assert all(p[i] for i,c in enumerate(t) if '\u3400'<=c<='\u9fff'),t
for t,p in x['pinyinTexts'].items():assert y['pinyinTexts'][t]==p, 'Old pronunciation overwritten'
identity=json.loads(new('reading-quality-identity.json'));before={p:new(p) for p in identity['files']}
subprocess.run(['python','reading-quality/build.py'],cwd=R,check=True)
assert before=={p:new(p) for p in before},'Nonreproducible artifacts'
for p,h in identity['files'].items():assert hashlib.sha256(new(p)).hexdigest()==h
tracked=subprocess.check_output(['git','ls-tree','-r','--name-only',B],cwd=R,text=True).splitlines()
protected=[p for p in tracked if p.startswith(('assets/','muse/','academy/','pilot-reading-')) or p in ['review-overlay.js','review-overlay.css','q0-production-identity.json']]
for p in protected:assert old(p)==new(p),p
out=R/'reading-quality/evidence';out.mkdir(exist_ok=True)
result={'status':'PASS','base':B,'days':84,'editedDays':identity['daysEdited'],'changedMaterials':len(changed),'protectedFiles':len(protected),'engineStorageGradingVoice':'BYTE_IDENTICAL','answersAndConstraints':'UNCHANGED','reproducibility':'PASS','contentHash':y['contentHash']}
(out/'static-checks.json').write_text(json.dumps(result,indent=2)+'\n');print(json.dumps(result))
