import hashlib,importlib.util,json,os,pathlib,subprocess,sys
repo=pathlib.Path.cwd();tmp=pathlib.Path(os.environ['RUNNER_TEMP']);candidate=tmp/'candidate';os.chdir(candidate)
def run(*a):subprocess.run(list(a),check=True)
run(sys.executable,'source/rc70_ci.py','cpu')
plan=json.loads((tmp/'rc70-run/plan.json').read_text());tasks=[t for t in plan['tasks'] if t['kind']=='cpu'];assert len(tasks)==69
rows=[]
for task in tasks:
 attempts=sorted((tmp/'rc70-run/cases'/task['caseId']).glob('attempt-*/result.json'),key=lambda p:int(p.parent.name.split('-')[-1]));assert attempts
 result=json.loads(attempts[-1].read_text());assert result['status']=='PASS' and result['buildId']==plan['buildId']
 rows.append({'caseId':task['caseId'],'status':result['status']})
run('node','source/test_home_portal.js')
reading=[['python3','source/build_reading.py','--check','--report','docs/reading/content_validation.json'],['python3','source/reading_compiler_test.py'],['python3','source/reading_context_test.py','--out','docs/reading/context_test_results.json'],['node','source/reading_upgrade_test.js','--out','docs/reading/upgrade_test_results.json'],['node','source/reading_engine_test.js'],['node','source/reading_media_test.js'],['node','source/reading_recovery_test.js'],['python3','source/reading_release_gate_test.py'],['node','source/reading_integration_test.js']]
for command in reading:run(*command)
result={'schema':1,'result':'PASS','buildId':plan['buildId'],'testDefinitionHash':plan['testDefinitionHash'],'cpuTasks':rows,'focusedContracts':json.loads(pathlib.Path('tmp/home-r1/portal-contract.json').read_text()),'readingAutomatedRegression':'PASS','fullLearningAcceptance':False}
assert result['focusedContracts']['result']=='PASS';out=tmp/'home-core';out.mkdir(exist_ok=True);(out/'result.json').write_text(json.dumps(result,indent=2)+'\n');print(json.dumps({'result':'PASS','cpuTasks':69,'focusedContracts':9,'reading':'PASS'}))
