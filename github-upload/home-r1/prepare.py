import hashlib,importlib.util,json,pathlib,shutil,subprocess,sys
base,patch,frozen,package=map(lambda p:pathlib.Path(p).resolve(),sys.argv[1:5])
read=lambda p:json.loads(p.read_text())
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
def module(n,p):
 s=importlib.util.spec_from_file_location(n,p);m=importlib.util.module_from_spec(s);s.loader.exec_module(m);return m
contract=read(base/'release-contract.json');assert contract['buildId']=='847890a5ef2f4d81edf5ad7e9fd2c53794dda834559f27f5513c956ecada61ec'
sys.path.insert(0,str(base/'source'));runner=module('home_gate_runner',base/'source/run_rc70_gates.py');runner.make_plan(base/'release-contract.json')
manifest=read(patch/'overlay-manifest.json');assert manifest['baseBuildId']==contract['buildId']
for n,h in manifest['files'].items():
 p=patch/'overlay'/n;assert n.startswith('source/') and '..' not in pathlib.PurePosixPath(n).parts and sha(p)==h
 shutil.copyfile(p,base/n)
def run(*a):subprocess.run(list(a),cwd=base,check=True)
run(sys.executable,'source/build.py');run('node',str(patch/'refresh_context.js'),str(base))
for n in ['build.py','build_qa.py','build_maintenance.py']:run(sys.executable,'source/'+n)
run(sys.executable,'source/audit_task_scaffolds.py','--write')
for k in ['storageVersion','contentRevision','evidenceRuleVersion','features','readingContentVersion','readingEngineRevision']:assert read(base/'source/version.json')[k]==contract['release'][k]
(base/'.gitignore').write_text('__pycache__/\n*.pyc\ntmp/\n')
for cmd in [['git','init','--quiet'],['git','config','user.name','RC79 Homepage Verification'],['git','config','user.email','rc79-verification@localhost'],['git','add','source','docs','.github','.gitignore'],['git','commit','--quiet','-m','Freeze H1 homepage and navigation-only selection diagnostics']]:run(*cmd)
new=module('home_freezer',base/'source/freeze_rc70.py').freeze(frozen)
allowed=set(manifest['files'])|{'source/joint_native_snapshot.json','source/joint_reuse_reviews.json','source/exam_runtime_index.json','source/source_registry.json','source/source_supply.json'}
changed={n for n in set(contract['sourceFiles'])|set(new['sourceFiles']) if contract['sourceFiles'].get(n)!=new['sourceFiles'].get(n)}
assert changed<=allowed,(changed-allowed)
assert new['release']['candidateId']=='RC79-A9-READING-R1.2-HOME1'
package.mkdir(parents=True,exist_ok=True);receipt=module('home_packager',frozen/'source/package_rc70_candidate.py').package(frozen,package/'RC79_HOME1_candidate.zip')
summary={'candidateId':new['release']['candidateId'],'buildId':new['buildId'],'baseBuildId':contract['buildId'],'sourceChanges':sorted(changed),'archive':receipt,'fullLearningAcceptance':False,'humanAndPhysicalReview':'NOT_RUN_OR_UNVERIFIED'}
(package/'freeze-receipt.json').write_text(json.dumps(summary,ensure_ascii=False,indent=2)+'\n');print(json.dumps(summary))
