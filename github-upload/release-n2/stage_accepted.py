"""Stage only exact accepted N2 public entries, retaining unverified human claims."""
import json
import os
from pathlib import Path
import shutil
import subprocess
import urllib.request
from verify_software import ACCEPTANCE_RUN, ARCHIVE_SHA, BUILD, EXECUTION, MAIN, PUBLIC_FILES, complete, read, sha

repo = Path.cwd()
temporary = Path(os.environ['RUNNER_TEMP'])
candidate, accepted, reading = temporary / 'stage-candidate', temporary / 'accepted', temporary / 'reading-evidence'
verification = complete(candidate, accepted, reading, temporary / 'stage-verification')
request = urllib.request.Request('https://api.github.com/repos/Dsp233/tianle-fruit-detective/actions/runs/' + str(ACCEPTANCE_RUN),
    headers={'Authorization': 'Bearer ' + os.environ['GH_TOKEN'], 'Accept': 'application/vnd.github+json'})
with urllib.request.urlopen(request, timeout=30) as response:
    run = json.load(response)
assert run['status'] == 'completed' and run['conclusion'] == 'success'
assert run['head_sha'] == EXECUTION
assert run['path'] == '.github/workflows/rc79-native2-acceptance.yml'
branch = 'rc79-reading-r1-2-20261026'
assert os.environ['GITHUB_REF'] == 'refs/heads/' + branch
def remote(name):
    rows = subprocess.check_output(['git', 'ls-remote', '--heads', 'origin', 'refs/heads/' + name], text=True).splitlines()
    assert len(rows) == 1
    return rows[0].split()[0]
assert remote('main') == MAIN, 'Main changed; inspect its newer changes before staging'
assert remote(branch) == os.environ['GITHUB_SHA'], 'Release branch changed during staging'
contract = read(candidate / 'release-contract.json')
assert set(contract['files']) == PUBLIC_FILES
paths = []
for name in sorted(PUBLIC_FILES):
    assert sha(candidate / name) == contract['files'][name]
    target = repo / name
    target.parent.mkdir(parents=True, exist_ok=True)
    shutil.copyfile(candidate / name, target)
    paths.append(name)
copies = [(candidate / 'release-contract.json', 'muse/rc79/release-contract.json'),
    (accepted / 'ci-receipt.json', 'muse/rc79/ci-receipt.json'),
    (accepted / 'acceptance.json', 'muse/rc79/acceptance.json'),
    (temporary / 'stage-verification/software-verification.json', 'muse/rc79/software-verification.json')]
for source, name in copies:
    target = repo / name
    target.parent.mkdir(parents=True, exist_ok=True)
    shutil.copyfile(source, target)
    paths.append(name)
receipt = {'schema': 2, 'phase': 'STAGED_FOR_MAIN', 'candidateId': contract['release']['candidateId'],
    'buildId': BUILD, 'buildSha256': contract['buildSha256'], 'archiveSha256': ARCHIVE_SHA,
    'acceptanceRunId': ACCEPTANCE_RUN, 'acceptanceExecutionCommit': EXECUTION,
    'stagingRunId': os.environ['GITHUB_RUN_ID'], 'rollbackCommit': MAIN, 'files': contract['files'],
    'productionFeatureFlags': contract['release']['features'], 'productionDeployed': False,
    'softwareVerification': 'PASS', 'fullLearningAcceptance': False,
    'humanAndPhysicalReview': 'NOT_RUN_OR_UNVERIFIED',
    'deploymentAuthorization': 'User explicitly requested continuing until the latest math and Chinese reading version is published.',
    'scope': 'Publish the software after its complete engineering acceptance; retain pending real-device, independent teaching and child-effect observations honestly.'}
name = 'muse/rc79/staging-receipt.json'
(repo / name).write_text(json.dumps(receipt, ensure_ascii=False, indent=2) + '\n')
paths.append(name)
status = read(repo / 'RC79_WORK_STATUS.json')
status.update(currentState='STAGED_FOR_MAIN', softwareVerification='PASS', productionDeployed=False,
              acceptanceRunId=ACCEPTANCE_RUN, stagingRunId=os.environ['GITHUB_RUN_ID'])
(repo / 'RC79_WORK_STATUS.json').write_text(json.dumps(status, ensure_ascii=False, indent=2) + '\n')
paths.append('RC79_WORK_STATUS.json')
subprocess.run(['git', 'add', '--', *paths], check=True)
subprocess.run(['git', '-c', 'user.name=github-actions[bot]', '-c',
    'user.email=41898282+github-actions[bot]@users.noreply.github.com', 'commit', '-m',
    'Stage verified RC79 A9 and Chinese Reading R1.2 N2 pages for production'], check=True)
subprocess.run(['git', 'push', 'origin', 'HEAD:refs/heads/' + branch], check=True)
print(json.dumps({'result': 'PASS', 'stagedCommit': subprocess.check_output(['git', 'rev-parse', 'HEAD'], text=True).strip(), **receipt}))
