import hashlib,importlib.util,json,os,pathlib,subprocess,sys
tmp=pathlib.Path(os.environ['RUNNER_TEMP']);candidate=tmp/'candidate';original=tmp/'original/rc70-run';out=tmp/'home-followup';out.mkdir(exist_ok=True);repo=pathlib.Path.cwd();os.chdir(candidate)
read=lambda p:json.loads(p.read_text());sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
contract=read(candidate/'release-contract.json');assert contract['buildId']=='e90c5c76e5e0e69b4b62f3327d879fef4284cb8ebb74691bdbe05cb8560be4a4'
sys.path.insert(0,str(candidate/'source'));s=importlib.util.spec_from_file_location('home_followup_runner',candidate/'source/run_rc70_gates.py');runner=importlib.util.module_from_spec(s);s.loader.exec_module(runner);expected=runner.make_plan(candidate/'release-contract.json');plan=read(original/'plan.json')
assert all(plan[k]==expected[k] for k in ['buildId','tasks','testDefinitionHash'])
failed={'core/test_connected_learning','core/test_knowledge'};rows=[];verified=0
for task in [t for t in expected['tasks'] if t['kind']=='cpu']:
 attempts=sorted((original/'cases'/task['caseId']).glob('attempt-*/result.json'),key=lambda p:int(p.parent.name.split('-')[-1]));assert attempts
 result=read(attempts[-1]);assert result['buildId']==contract['buildId'] and result['testDefinitionHash']==expected['testDefinitionHash']
 assert result['status']==('FAIL' if task['caseId'] in failed else 'PASS'),task['caseId']
 for a in result['artifacts']:
  rel=pathlib.PurePosixPath(a['path']);assert not rel.is_absolute() and '..' not in rel.parts;assert sha(original/a['path'])==a['sha256'];verified+=1
 rows.append({'caseId':task['caseId'],'originalResult':result['status']})
assert len(rows)==69
def run(*args):subprocess.run(list(args),check=True)
for name in ['test_connected_learning','test_knowledge']:
 run('node',str(repo/'github-upload/home-r1/math_fixture_v2.js'),str(candidate),name)
 proof=read(out/(name+'-fixture.json'));assert proof['result']=='PASS' and proof['explicitMathEntrances']>0 and proof['originalAssertionsUnchanged'];assert proof['originalTestSourceSha256']==contract['sourceFiles']['source/'+name+'.js']
run('node','source/test_home_portal.js')
for command in [[sys.executable,'source/build_reading.py','--check','--report','docs/reading/content_validation.json'],[sys.executable,'source/reading_compiler_test.py'],[sys.executable,'source/reading_context_test.py','--out','docs/reading/context_test_results.json'],['node','source/reading_upgrade_test.js','--out','docs/reading/upgrade_test_results.json'],['node','source/reading_engine_test.js'],['node','source/reading_media_test.js'],['node','source/reading_recovery_test.js'],[sys.executable,'source/reading_release_gate_test.py'],['node','source/reading_integration_test.js']]:run(*command)
native=read(tmp/'native/native-result.json');assert native['result']=='PASS' and native['release']==contract['release']['candidateId']
for name,digest in contract['files'].items():assert sha(candidate/name)==digest,'Application bytes changed during tests'
from artifact_inventory import source_inventory
assert source_inventory(candidate)==contract['sourceFiles'],'Frozen source changed during tests'
proof={'schema':1,'result':'PASS','buildId':contract['buildId'],'testDefinitionHash':expected['testDefinitionHash'],'originalCpuRunId':40294526884,'originalPassedGates':67,'updatedMathEntryFixtures':2,'uniqueMathGatesPassed':69,'originalArtifactHashesVerified':verified,'fixtureRevision':2,'originalAssertionsUnchanged':True,'originalFailedRecordsRetained':True,'frozenApplicationBytesChanged':False,'focusedContracts':read(candidate/'tmp/home-r1/portal-contract.json'),'readingAutomatedRegression':'PASS','nativeRunId':40295386843,'nativeBrowser':'PASS','fullLearningAcceptance':False}
assert proof['focusedContracts']['result']=='PASS';(out/'complete-regression.json').write_text(json.dumps(proof,indent=2)+'\n');print(json.dumps(proof))
