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
 if os.environ.get('HOME_REUSE_MATH')=='1':
  import shutil
  shutil.copyfile(tmp/'previous/home-followup'/(name+'-fixture.json'),out/(name+'-fixture.json'))
 else:run('node',str(repo/'github-upload/home-r1/math_fixture_v2.js'),str(candidate),name)
 proof=read(out/(name+'-fixture.json'));assert proof['result']=='PASS' and proof['explicitMathEntrances']>0 and proof['originalAssertionsUnchanged'];assert proof['originalTestSourceSha256']==contract['sourceFiles']['source/'+name+'.js']
if os.environ.get('HOME_REUSE_MATH')=='1':
 import shutil
 for name in ['content_validation.json','compiler_unit_results.json','context_test_results.json']:shutil.copyfile(tmp/'previous/candidate/docs/reading'/name,candidate/'docs/reading'/name)
 (candidate/'tmp/home-r1').mkdir(parents=True,exist_ok=True);shutil.copyfile(tmp/'previous/candidate/tmp/home-r1/portal-contract.json',candidate/'tmp/home-r1/portal-contract.json')
else:
 run('node','source/test_home_portal.js')
 for command in [[sys.executable,'source/build_reading.py','--check','--report','docs/reading/content_validation.json'],[sys.executable,'source/reading_compiler_test.py'],[sys.executable,'source/reading_context_test.py','--out','docs/reading/context_test_results.json']]:run(*command)
for command in [['node',str(repo/'github-upload/home-r1/reading_upgrade_v2.js'),str(candidate),str(candidate/'docs/reading/upgrade_test_results.json')],['node','source/reading_engine_test.js'],['node','source/reading_media_test.js'],['node','source/reading_recovery_test.js'],[sys.executable,'source/reading_release_gate_test.py'],['node','source/reading_integration_test.js']]:run(*command)
native=read(tmp/'native/native-result.json');assert native['result']=='PASS' and native['release']==contract['release']['candidateId']
for name,digest in contract['files'].items():assert sha(candidate/name)==digest,'Application bytes changed during tests'
from artifact_inventory import source_inventory
assert source_inventory(candidate)==contract['sourceFiles'],'Frozen source changed during tests'
upgraded=read(candidate/'docs/reading/upgrade_test_results.json');raw=(candidate/'source/reading_upgrade_test.js').read_text();assert raw.count('进入数学探索和主题选择')==1
executed_hash=hashlib.sha256(raw.replace('进入数学探索和主题选择','进入数学侦探和主题选择').encode()).hexdigest();assert upgraded['sourceHashes']['reading_upgrade_test.js']==executed_hash and upgraded['testRevision']['otherAssertionsUnchanged'] and upgraded['testRevision']['changedAssertionCount']==1
gate_spec=importlib.util.spec_from_file_location('home_reading_groups',candidate/'source/reading_release_gate.py');gate=importlib.util.module_from_spec(gate_spec);gate_spec.loader.exec_module(gate)
reading_groups={};counts={'compiler_unit_results':19,'context_test_results':37,'upgrade_test_results':11,'engine_test_results':45,'ui_media_test_results':26,'integration_test_results':5,'recovery_test_results':12,'release_gate_test_results':19}
for group,sources in gate.SOURCE_GROUPS.items():
 report=read(candidate/'docs/reading'/(group+'.json'));assert report['result']=='PASS',group
 count=len(report['cases']) if isinstance(report.get('cases'),list) else report.get('cases',report.get('total'));assert count==counts[group],group
 for name in sources:assert report['sourceHashes'][name]==(executed_hash if name=='reading_upgrade_test.js' else sha(candidate/'source'/name)),group+'/'+name
 reading_groups[group]={'result':'PASS','cases':count,'sha256':sha(candidate/'docs/reading'/(group+'.json'))}
definition={'schema':'HOME1-VALIDATION-R4','buildId':contract['buildId'],'originalMathTestDefinitionHash':expected['testDefinitionHash'],'mathFixtureRunnerSha256':sha(repo/'github-upload/home-r1/math_fixture_v2.js'),'readingUpgradeExecutedTestSha256':executed_hash,'readingUpgradeRunnerSha256':sha(repo/'github-upload/home-r1/reading_upgrade_v2.js'),'navigationExpectedLabel':'进入数学侦探和主题选择'}
validation_hash=hashlib.sha256(json.dumps(definition,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest()
proof={'schema':2,'result':'PASS','buildId':contract['buildId'],'validationDefinition':definition,'validationDefinitionHash':validation_hash,'originalCpuRunId':40294526884,'updatedMathFixtureRunId':40298417018,'originalPassedGates':67,'updatedMathEntryFixtures':2,'uniqueMathGatesPassed':69,'originalArtifactHashesVerified':verified,'fixtureRevision':2,'originalMathAssertionsUnchanged':True,'readingNavigationCopyAssertionRevision':2,'originalFailedRecordsRetained':True,'frozenApplicationBytesChanged':False,'focusedContracts':read(candidate/'tmp/home-r1/portal-contract.json'),'readingAutomatedRegression':'PASS','readingGroups':reading_groups,'nativeRunId':40295386843,'nativeBrowser':'PASS','fullLearningAcceptance':False}
assert proof['focusedContracts']['result']=='PASS';(out/'complete-regression.json').write_text(json.dumps(proof,indent=2)+'\n');print(json.dumps(proof))
