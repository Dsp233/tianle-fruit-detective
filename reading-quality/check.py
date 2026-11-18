"""Independent invariants on the released artifacts and editorial delta."""
import base64,gzip,hashlib,json,os,re,subprocess,sys
from pathlib import Path
R=Path(__file__).resolve().parents[1];B='b39ece48917d834e611565432e6cbe7f59ec2edd'
def old(p):return subprocess.check_output(['git','show',B+':'+p],cwd=R)
def cfg(b):return json.loads(re.search(rb'<script id="learning-delivery" type="application/json">(.*?)</script>',b).group(1))
def unpack(row,read):
 b=gzip.decompress(b''.join(base64.b64decode(json.loads(read(p))['gz']) for p in row['parts']))
 assert hashlib.sha256(b).hexdigest()==row['id'];assert len(b)==row['bytes'];return b
def new(p):return (R/p).read_bytes()

def check_joint():
 base='f8e791e6cc5c62769b1c356723a4da67da05ce45'
 def original(p):
  return subprocess.check_output(['git','show',base+':'+p],cwd=R)
 before_config,after_config=cfg(original('index.html')),cfg(new('index.html'))
 for entry in ('index.html','amc8/index.html','source/index.html'):
  a,b=original(entry),new(entry)
  loader=rb'  async function readPacket\(packet\) \{.*?\n  \}\n(?=  async function loadData)'
  found=re.findall(loader,b,re.S)
  expected=new('reading-art/packet-integrity.js').replace(b'/*__CR4_SHA256_VENDOR__*/',new('reading-art/vendor/js-sha256.js'))
  assert len(found)==1 and found[0]==expected,entry
  assert len(re.findall(loader,a,re.S))==1,entry
  a=re.sub(loader,b'CR4_READ_PACKET\n',a,flags=re.S)
  b=re.sub(loader,b'CR4_READ_PACKET\n',b,flags=re.S)
  pattern=rb'<script id="learning-delivery" type="application/json">.*?</script>'
  assert re.sub(pattern,b'',a)==re.sub(pattern,b'',b),entry
  assert {k:v for k,v in cfg(a).items() if k!='reading'}=={k:v for k,v in cfg(b).items() if k!='reading'},entry
  assert cfg(b)['reading']==after_config['reading'],entry
 before=json.loads(unpack(before_config['reading']['data'][0],original))
 after=json.loads(unpack(after_config['reading']['data'][0],new))
 old_js=unpack(before_config['reading']['scripts'][0],original)
 new_js=unpack(after_config['reading']['scripts'][0],new)
 marker=b'window.__AMC8_ReadingRuntime='
 assert old_js.split(marker)[0]==new_js.split(marker)[0],'Storage, grading, and speech source drift'
 art=rb'const storyArtByMaterial = (.*?);'
 old_art=json.loads(re.search(art,old_js)[1])
 assert old_art==json.loads(re.search(art,new_js)[1])
 assert len(old_art)==168 and sum(len(x['cuts'])-1 for x in old_art.values())==504
 assert all(before[k]==after[k] for k in ('lessons','diagnostics','courseScope','pinyinMap','contextReviewedPositions'))
 for k in ('pinyinTexts','phrases'):
  assert all(after[k][s]==v for s,v in before[k].items()),k
 allow_display={'text','panels','title','prompt','options','explanation','hint'}
 affected=[]
 checked=0
 for a,b in zip(before['materials'],after['materials'],strict=True):
  if a['courseId']!='R2-84D-20261031':
   assert a==b
   continue
  assert a['id']==b['id']
  assert {k:v for k,v in a.items() if k not in allow_display|{'questions'}}=={k:v for k,v in b.items() if k not in allow_display|{'questions'}}
  assert all({k:v for k,v in p.items() if k!='text'}=={k:v for k,v in n.items() if k!='text'} for p,n in zip(a['panels'],b['panels'],strict=True))
  assert b['text']==''.join(p['text'] for p in b['panels'])
  for q,n in zip(a['questions'],b['questions'],strict=True):
   assert {k:v for k,v in q.items() if k not in allow_display}=={k:v for k,v in n.items() if k not in allow_display},q['id']
   assert len(q.get('options',[]))==len(n.get('options',[])),q['id']
   checked+=1
  if a['text']!=b['text'] or a['questions']!=b['questions']:
   affected.append(a['id'])
 assert checked==336
 assert after['compatibility']['fromContentHash']==before['contentHash']
 assert after['compatibility']['changedMaterialIds']==affected
 changed=subprocess.check_output(['git','diff','--name-only',base],cwd=R,text=True).splitlines()
 entries={'index.html','amc8/index.html','source/index.html'}
 allowed=entries|{'reading-art/build.py','reading-art/release.json','reading-art/browser.py','reading-quality/browser.py','reading-quality/check.py'}
 # These inputs have dedicated checks: art manifest via --verify-release,
 # and the linked stylesheet via the real joint browser suite.
 active_stylesheets=set()
 for entry in entries:
  active_stylesheets.update(p.decode() for p in re.findall(
   rb'href="(?:\.\./|\./)?(assets/reading-quality/[0-9a-f]{64}\.css)"',new(entry)))
 allowed.update(active_stylesheets)
 allowed.update({'reading-art/assets.json','reading-quality/reading.css','reading-quality/word-layout.js',
                 '.github/workflows/w1-illustration.yml','.github/workflows/w1-reading-quality.yml'})
 allowed.update({'reading-quality/build.py','reading-art/packet-integrity.js',
                 'reading-art/vendor/js-sha256.js','reading-art/vendor/js-sha256.LICENSE',
                 '.github/workflows/cr5-integration.yml'})
 allowed.update({'reading-art/render.js','review-overlay.js','review-overlay.css','q0-production-identity.json',
                 '.github/workflows/q0-formal-review-preflight.yml',
                 'github-upload/rc79-reading-workpackage/safety-work/w1-review-overlay/q0-formal-browser-smoke.py',
                 'github-upload/rc79-reading-workpackage/safety-work/w1-review-overlay/q0-public-browser-smoke.py'})
 # These historical builder files are also invoked by the canonical packer.
 # Their generated asset and entry bytes are independently checked against CR5.
 allowed.update({'github-upload/rc79-fix15/package.py',
                 'github-upload/rc79-fix15/stage_candidate.py',
                 'github-upload/rc79-fix15/test_cold_reading_backup.js',
                 'github-upload/rc79-fix6/load2-tools/upgrade.py'})
 legacy_loader='github-upload/rc79-fix15/loader.js'
 if legacy_loader in changed:
  digest=hashlib.sha256(original(legacy_loader)).hexdigest()
  assert not (R/legacy_loader).exists() and new('assets/loading-r1/'+digest+'.js')==original(legacy_loader)
  allowed.add(legacy_loader)
 fix15='github-upload/rc79-fix15/'
 for name in ('overlay/source/progress_store.js','test_loader_browser.js',
              'test_reading_routes_browser.js','test_transaction_store.js'):
  path=fix15+name
  if path not in changed:continue
  assert original(path)==new('github-upload/rc79-fix14/'+name),path
  if name.startswith('overlay/'):assert not (R/path).exists()
  else:assert new(path)==f"'use strict';\nrequire('../rc79-fix14/{name}');\n".encode()
  allowed.add(path)
 allowed.update(fix15+name for name in ('test_initial_snapshot_race.js','test_storage_browser.js'))
 # G1 restored sources and tooling are isolated build inputs. A path on
 # this list must be new relative to the existing reading release baseline.
 g1_inputs={
  '.github/workflows/g1-source-build-intake.yml',
  'canonical/w1/source/build.py', 'canonical/w1/source/build_maintenance.py',
  'canonical/w1/source/build_qa.py', 'canonical/w1/source/home_portal.css',
  'canonical/w1/source/home_portal.js', 'canonical/w1/source/index.template.html',
  'canonical/w1/source/maintenance_ui.js', 'canonical/w1/source/progress_store.js',
  'canonical/w1/source/storage_namespaces.js',
  'docs/engineering/governance/g1-source-build/CONTROLLED_INPUTS.md',
  'docs/engineering/governance/g1-source-build/REPORT.md',
  'docs/engineering/governance/g1-source-build/approved-runtime-diff.json',
  'docs/engineering/governance/g1-source-build/local-reconstruction-receipt.json',
  'github-upload/rc79-fix15/math-reading-bridge.js',
  'tools/g1_storage_runtime.py',
  'tools/build_site.py', 'tools/g1-runtime-lock.tsv', 'tools/g1-source-lock.json',
  'tools/g1-w1-reading-requirements.txt', 'tools/g1_compile_w1.py',
  'tools/g1_fixture_browser.py', 'tools/g1_rebuild_w1_reading.py',
  'tools/g1_verify_content.py', 'tools/test_g1_site_release.py',
  'tools/g1_offline_build.py', 'tools/test_g1_native_guard.py',
  'docs/engineering/governance/g1-source-build/external-copy-evidence.tsv',
  'tools/test_g1_verify_content.py', 'tools/g1_reading_packets.py',
 }
 for path in changed:
  assert path in allowed or path in g1_inputs or path.startswith(('reading-quality/joint-acceptance/','code-review/CR1/','code-review/CR2/','code-review/CR3/','code-review/CR4/','code-review/CR5/')) or re.fullmatch(r'assets/reading-(art|quality)/[a-f0-9]{64}\.json',path),path
 old_paths=set(subprocess.check_output(['git','ls-tree','-r','--name-only',base],cwd=R,text=True).splitlines())
 assert not (set(changed)&old_paths)-allowed, 'Original non-entry files outside the scoped sources changed'
 receipt={'base':base,'questions':checked,'artBindings':504,'storageGradingSpeech':'byte-identical',
          'draftsAffected':affected,'contentHash':after['contentHash'],'protectedPaths':len(old_paths-allowed)}
 out=Path(os.getenv('READING_EVIDENCE_DIR',R/'reading-quality/evidence'))
 out.mkdir(parents=True,exist_ok=True)
 (out/'joint-static.json').write_text(json.dumps(receipt,ensure_ascii=False,indent=2)+'\n')
 print(json.dumps(receipt,ensure_ascii=False))

if '--joint' in sys.argv:
 check_joint()
 sys.exit(0)

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
