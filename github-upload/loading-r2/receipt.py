import hashlib
import json
import os
from pathlib import Path
import shutil

stage = os.environ['STAGE']
out = Path('muse/rc79/loading-r2')
out.mkdir(parents=True, exist_ok=True)
evidence = Path('/tmp/loading-evidence')
smoke = json.loads((evidence / 'smoke-result.json').read_text())
assert smoke['result'] == 'PASS'
shutil.copyfile(evidence / 'smoke-result.json', out / (stage + '-smoke-result.json'))
if (evidence / 'baseline-result.json').exists():
    shutil.copyfile(evidence / 'baseline-result.json', out / 'baseline-result.json')
for source, target in [('chromium-home.png','home.png'), ('webkit-reading.png','reading-webkit.png')]:
    shutil.copyfile(evidence / source, out / target)
receipt = {'revision':'RC79-LOAD2', 'stage':stage, 'result':'PASS', 'workflowRunId':os.environ['GITHUB_RUN_ID'], 'testedCommit':os.environ['GITHUB_SHA'], 'site':'https://dsp233.github.io/tianle-fruit-detective/', 'scope':smoke['scope'], 'completeVersionVerification':'NOT_RUN_USER_REQUESTED', 'physicalIPad':'NOT_TESTED', 'baseline':'ecd6c6a87047378f41629c9b3afdf90f657a3b0c', 'entries':{}}
for name in ['index.html','source/index.html','amc8/index.html','qa/index.html','qa/normal/index.html','qa/history/index.html','academy/index.html','muse/rc79/maintenance.html']:
    data = Path(name).read_bytes()
    receipt['entries'][name] = {'bytes':len(data),'sha256':hashlib.sha256(data).hexdigest()}
(out / (stage + '-receipt.json')).write_text(json.dumps(receipt, ensure_ascii=False, indent=2) + '\n')
for name in ['RC79_WORK_STATUS.json','HOME_WORK_STATUS.json']:
    p = Path(name)
    previous = json.loads(p.read_text())
    previous['deliveryRevision'] = 'RC79-LOAD2'
    previous['deliveryStatus'] = 'PRODUCTION_PUBLISHED_AND_LOADING_VERIFIED' if stage == 'public' else 'CANDIDATE_LOADING_VERIFIED'
    previous['loadingEvidence'] = 'muse/rc79/loading-r2/' + stage + '-receipt.json'
    previous['completeVersionVerificationForDelivery'] = 'NOT_RUN_USER_REQUESTED'
    previous['deliveryContentBaseline'] = {'candidateId':previous.get('currentCandidateId'),'contentBuildId':previous.get('currentBuildId'),'contentAndGradingUnchanged':True}
    if stage == 'public':
        previous['date'] = '2026-10-27'
        previous['currentState'] = 'PRODUCTION_PUBLISHED_AND_PUBLICLY_VERIFIED'
        previous['productionDeployed'] = True
        previous['deliveryReleaseCommit'] = os.environ['GITHUB_SHA']
        previous['deliveryRollbackCommit'] = receipt['baseline']
        previous['deliveryPublicVerificationRunId'] = os.environ['GITHUB_RUN_ID']
        previous['nextSteps'] = []
    p.write_text(json.dumps(previous, ensure_ascii=False, indent=2) + '\n')
print(json.dumps({'stage':stage,'checks':len(smoke['checks']),'result':'PASS'}))
