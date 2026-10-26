import hashlib,json,os,pathlib,shutil,subprocess
repo=pathlib.Path.cwd();tmp=pathlib.Path(os.environ['RUNNER_TEMP']);candidate=tmp/'candidate'
read=lambda p:json.loads(p.read_text());contract=read(candidate/'release-contract.json')
assert contract['release']['candidateId']=='RC79-A9-READING-R1.2-HOME1'
assert os.environ['CORE_RESULT']==os.environ['NATIVE_RESULT']=='success'
native=read(tmp/'native/native-result.json');assert native['result']=='PASS'
def remote(branch):return subprocess.check_output(['git','ls-remote','--heads','origin','refs/heads/'+branch],text=True).split()[0]
branch='rc79-home-h1-20261026';assert remote('main')=='dab6341bd7ac749ab8d7f102e3c8eba9b07d7fa8';assert remote(branch)==os.environ['GITHUB_SHA']
paths=[]
for name,sha in contract['files'].items():
 assert hashlib.sha256((candidate/name).read_bytes()).hexdigest()==sha
 dest=repo/name;dest.parent.mkdir(parents=True,exist_ok=True);shutil.copyfile(candidate/name,dest);paths.append(name)
folder=repo/'muse/rc79/home-h1';folder.mkdir(parents=True,exist_ok=True)
for source,name in [(candidate/'release-contract.json','release-contract.json'),(tmp/'native/native-result.json','native-result.json')]:shutil.copyfile(source,folder/name);paths.append('muse/rc79/home-h1/'+name)
if (tmp/'home-followup/complete-regression.json').exists():
 proof=read(tmp/'home-followup/complete-regression.json');assert proof['result']=='PASS' and proof['buildId']==contract['buildId'] and proof['uniqueMathGatesPassed']==69
 for name in ['complete-regression.json','test_connected_learning-fixture.json','test_knowledge-fixture.json']:
  shutil.copyfile(tmp/'home-followup'/name,folder/name);paths.append('muse/rc79/home-h1/'+name)
status={'schema':1,'candidateId':contract['release']['candidateId'],'buildId':contract['buildId'],'phase':'STAGED','runId':os.environ['GITHUB_RUN_ID'],'coreTasks':69,'focusedNavigationContracts':9,'nativeNavigationAndLayouts':'PASS','readingRegression':'PASS','fullLearningAcceptance':False,'humanAndPhysicalReview':'NOT_RUN_OR_UNVERIFIED','rollbackCommit':'dab6341bd7ac749ab8d7f102e3c8eba9b07d7fa8'}
for name in ['HOME_WORK_STATUS.json','muse/rc79/home-h1/staging-receipt.json']:(repo/name).write_text(json.dumps(status,ensure_ascii=False,indent=2)+'\n');paths.append(name)
subprocess.run(['git','add','--',*paths],check=True);subprocess.run(['git','-c','user.name=github-actions[bot]','-c','user.email=41898282+github-actions[bot]@users.noreply.github.com','commit','-m','Stage verified two-door panda homepage and precise selection guidance'],check=True);subprocess.run(['git','push','origin','HEAD:refs/heads/'+branch],check=True)
print(json.dumps(status))
