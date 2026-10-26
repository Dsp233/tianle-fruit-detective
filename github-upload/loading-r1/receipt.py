import hashlib
import json
import os
from pathlib import Path
import shutil

stage = os.environ['STAGE']
out = Path('muse/rc79/loading-r1')
out.mkdir(parents=True, exist_ok=True)
evidence = Path('/tmp/loading-evidence')
smoke = json.loads((evidence / 'smoke-result.json').read_text())
assert smoke['result'] == 'PASS'
shutil.copyfile(evidence / 'smoke-result.json', out / (stage + '-smoke-result.json'))
shutil.copyfile(evidence / 'chromium-home.png', out / 'home.png')
receipt = {
    'revision': 'RC79-LOAD1',
    'stage': stage,
    'result': 'PASS',
    'workflowRunId': os.environ['GITHUB_RUN_ID'],
    'testedCommit': os.environ['GITHUB_SHA'],
    'site': 'https://dsp233.github.io/tianle-fruit-detective/',
    'scope': smoke['scope'],
    'completeVersionVerification': 'NOT_RUN_USER_REQUESTED',
    'physicalIPad': 'NOT_TESTED',
    'baseline': '63c9a525bc613dbee3a5afb52043963b146ce473',
    'entries': {},
}
for name in ['index.html', 'source/index.html', 'amc8/index.html', 'qa/index.html', 'qa/normal/index.html', 'qa/history/index.html', 'academy/index.html', 'muse/rc79/maintenance.html']:
    data = Path(name).read_bytes()
    receipt['entries'][name] = {'bytes': len(data), 'sha256': hashlib.sha256(data).hexdigest()}
(out / (stage + '-receipt.json')).write_text(json.dumps(receipt, ensure_ascii=False, indent=2) + '\n')
for name in ['RC79_WORK_STATUS.json', 'HOME_WORK_STATUS.json']:
    p = Path(name)
    previous = json.loads(p.read_text())
    previous['deliveryRevision'] = 'RC79-LOAD1'
    previous['deliveryStatus'] = 'PRODUCTION_PUBLISHED_AND_LOADING_VERIFIED' if stage == 'public' else 'CANDIDATE_LOADING_VERIFIED'
    previous['loadingEvidence'] = 'muse/rc79/loading-r1/' + stage + '-receipt.json'
    previous['completeVersionVerificationForDelivery'] = 'NOT_RUN_USER_REQUESTED'
    if stage == 'public':
        previous['status'] = 'PRODUCTION_PUBLISHED_AND_PUBLICLY_VERIFIED'
        previous['productionDeployed'] = True
        previous['nextSteps'] = []
    p.write_text(json.dumps(previous, ensure_ascii=False, indent=2) + '\n')
print(json.dumps({'stage': stage, 'checks': len(smoke['checks']), 'result': 'PASS'}))
