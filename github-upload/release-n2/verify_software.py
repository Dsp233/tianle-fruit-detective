"""Verify immutable N2 engineering evidence without changing frozen files."""
import hashlib
import importlib.util
import json
from pathlib import Path
import subprocess
import sys

BUILD = '847890a5ef2f4d81edf5ad7e9fd2c53794dda834559f27f5513c956ecada61ec'
DEFINITION = '1e8502a3f8317fe0421a27b2074d2a6a71713bce8ada44941d304b5d40e23ab3'
ARCHIVE_SHA = '85d06c34609d67796c58524638ce28b7de5a6be6ca10dca54f043dceb2ae3746'
EXECUTION = '7ca48366c2ffd6a6e855b31b7fdfd4fa89b79e59'
ACCEPTANCE_RUN = 40280729918
MAIN = '18c6885b4a0d585d486c031b629d7a7129187939'
PUBLIC_FILES = {'index.html', 'source/index.html', 'amc8/index.html', 'academy/index.html',
                'qa/index.html', 'qa/normal/index.html', 'qa/history/index.html',
                'muse/rc79/maintenance.html'}

def read(path):
    return json.loads(Path(path).read_text())

def sha(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()

def module(name, path):
    spec = importlib.util.spec_from_file_location(name, path)
    loaded = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(loaded)
    return loaded

def candidate_identity(candidate):
    candidate = Path(candidate).resolve()
    sys.path.insert(0, str(candidate / 'source'))
    contract = read(candidate / 'release-contract.json')
    assert contract['buildId'] == BUILD
    assert contract['release']['candidateId'] == 'RC79-A9-READING-R1.2-N2'
    assert contract['sourceCommit'] == 'a005758f4aa52ee5abfb28da2c4b92c12fdab500'
    assert set(contract['files']) == PUBLIC_FILES
    plan = module('current_n2_runner', candidate / 'source/run_rc70_gates.py').make_plan(candidate / 'release-contract.json')
    assert plan['testDefinitionHash'] == DEFINITION
    assert len(plan['tasks']) == 82
    assert sum(t['kind'] == 'cpu' for t in plan['tasks']) == 69
    assert sum(t['kind'] == 'browser' for t in plan['tasks']) == 13
    return contract, plan

def reading(candidate, evidence):
    candidate, evidence = Path(candidate).resolve(), Path(evidence).resolve()
    gate = module('current_n2_reading_gate', candidate / 'source/reading_release_gate.py')
    expected_counts = {'compiler_unit_results': 19, 'context_test_results': 37,
        'upgrade_test_results': 11, 'engine_test_results': 45, 'ui_media_test_results': 26,
        'integration_test_results': 5, 'recovery_test_results': 12, 'release_gate_test_results': 19}
    verified = {}
    for name, sources in gate.SOURCE_GROUPS.items():
        report = read(evidence / (name + '.json'))
        assert report['result'] == 'PASS', name
        assert all(report.get('sourceHashes', {}).get(n) == sha(candidate / 'source' / n) for n in sources), name + ' source identity'
        count = len(report['cases']) if isinstance(report.get('cases'), list) else report.get('cases', report.get('total'))
        assert count == expected_counts[name], name + ' complete population'
        if 'passed' in report:
            assert report['passed'] == expected_counts[name], name + ' passed population'
        verified[name] = {'status': 'PASS', 'cases': count, 'sha256': sha(evidence / (name + '.json'))}
    for name in ['integration_test_results', 'recovery_test_results']:
        report = read(evidence / (name + '.json'))
        path = Path(report.get('compiledHtmlPath', 'qa/normal/index.html'))
        assert not path.is_absolute() and '..' not in path.parts
        assert report['compiledHtmlSha256'] == sha(candidate / path)
        assert report['productionBuildSha256'] == sha(candidate / 'index.html')
    integrated = read(evidence / 'integration_test_results.json')
    assert integrated['completeSuite'] is True
    data = json.loads((candidate / 'source/reading_data.js').read_text().split('window.__AMC8_READING_DATA=', 1)[1].rstrip().removesuffix(';'))
    content = read(evidence / 'content_validation.json')
    assert content['result'] == 'PASS'
    assert content['contentHash'] == integrated['contentHash'] == data['contentHash']
    assert content['pinyinHash'] == data['pinyinHash']
    assert content['materials'] == 252 and content['courseQuestions'] == 840
    provenance = read(evidence / 'math_provenance.json')
    assert provenance['status'] == 'PASS_SCOPED_CONTEXT_REFRESH'
    assert provenance['oldReviewScopeAndNotesPreserved'] is True
    return {'status': 'PASS', 'contentHash': data['contentHash'], 'groups': verified,
            'humanAndPhysicalAcceptance': 'NOT_RUN_OR_UNVERIFIED', 'learningEffect': 'NOT_MEASURED'}

def complete(candidate, accepted, reading_evidence, out):
    candidate, accepted, out = Path(candidate).resolve(), Path(accepted).resolve(), Path(out).resolve()
    contract, expected = candidate_identity(candidate)
    plan = read(accepted / 'plan.json')
    assert all(plan[k] == expected[k] for k in ['buildId', 'testDefinitionHash', 'tasks'])
    receipt, aggregate = read(accepted / 'ci-receipt.json'), read(accepted / 'acceptance.json')
    assert receipt['buildId'] == aggregate['buildId'] == BUILD
    assert receipt['sourceCommit'] == contract['sourceCommit']
    assert receipt['buildSha256'] == contract['buildSha256']
    # The collector binds testDefinitionHash in plan.json and each saved attempt;
    # its ci-receipt schema records sourceTreeHash rather than repeating that field.
    assert receipt['sourceTreeHash'] == contract['sourceTreeHash']
    assert str(receipt['runId']) == str(ACCEPTANCE_RUN)
    assert receipt['executionCommit'] == EXECUTION
    assert receipt['developmentResult'] == aggregate['result'] == 'PASS'
    assert receipt['logicalTasks'] == len(aggregate['cases']) == 82
    assert not receipt['failedTasks'] and not receipt['populationErrors'] and not aggregate['errors']
    assert {c['caseId'] for c in aggregate['cases']} == {t['caseId'] for t in expected['tasks']}
    assert all(c['status'] in {'PASS', 'POLICY_PASS'} for c in aggregate['cases'])
    out.mkdir(parents=True, exist_ok=True)
    # Re-run the original collector over every saved attempt and its artifact hashes.
    fresh = out / 'independent-aggregate.json'
    subprocess.run(['node', str(candidate / 'source/rc70_acceptance.js'), '--manifest',
        str(candidate / 'release-contract.json'), '--run-dir', str(accepted), '--gate',
        'development', '--out', str(fresh)], check=True)
    assert read(fresh)['result'] == 'PASS'
    for name in ['matrix', 'browser']:
        population = receipt['populations'][name]
        assert population['instances'] == 765 and population['completeIdentitySet'] is True
        assert population['FAIL'] == population['NOT_RUN'] == 0
    def statuses(value, path='selfVerification'):
        if isinstance(value, dict):
            if 'status' in value:
                allowed = {'PASS', 'REVIEW_PENDING'} if path.endswith('.semantic') else {'PASS'}
                assert value['status'] in allowed, path
            for k, v in value.items():
                statuses(v, path + '.' + k)
    statuses(receipt['selfVerification'])
    result = {'status': 'PASS', 'buildId': BUILD, 'testDefinitionHash': DEFINITION,
        'archiveSha256': ARCHIVE_SHA, 'acceptanceRunId': ACCEPTANCE_RUN, 'logicalTasks': 82,
        'reading': reading(candidate, reading_evidence), 'independentQualityAndHumanReview':
        'REVIEW_PENDING_NOT_A_SOFTWARE_EXECUTION_CLAIM', 'fullLearningAcceptance': False}
    (out / 'software-verification.json').write_text(json.dumps(result, ensure_ascii=False, indent=2) + '\n')
    return result

if __name__ == '__main__':
    if sys.argv[1] == 'reading':
        candidate_identity(Path(sys.argv[2]))
        print(json.dumps(reading(Path(sys.argv[2]), Path(sys.argv[3]))))
    else:
        print(json.dumps(complete(*map(Path, sys.argv[1:5]))))
