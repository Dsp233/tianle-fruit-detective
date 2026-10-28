"""Targeted FIX7 receipt, with inherited test failures explicitly retained."""
import json
import os
from pathlib import Path

out = Path.cwd() / 'muse/rc79/fix7'
evidence = Path('/tmp/fix79-evidence')
names = ['parent-review-browser.json', 'lazy-history-browser.json', 'smoke-result.json',
         'public-interaction.json', 'reading-feedback-browser.json', 'diagnostic-d-browser.json']
reports = {name: json.loads((evidence / name).read_text()) for name in names}
assert all(report['result'] == 'PASS' for report in reports.values())
diagnostic = reports['diagnostic-d-browser.json']['checks']
assert {row['engine'] for row in diagnostic} == {'chromium', 'webkit'}
assert all(all(row.get(key) for key in ['diagnosticEntry', 'voiceOnlyExcluded', 'parentOnlyValid',
                                      'legacyExcludedAfterReload', 'originalAttemptsPreserved']) for row in diagnostic)
baseline = json.loads((evidence / 'engine-baseline-comparison.json').read_text())
assert baseline['result'] == 'NO_NEW_FAILURES' and len(baseline['knownFailures']) == 4
receipt = {'revision': 'RC79-FIX7', 'phase': 'CANDIDATE', 'result': 'PASS',
           'sourceCommit': os.environ['GITHUB_SHA'], 'runId': os.environ['GITHUB_RUN_ID'],
           'scope': 'D parent-only eligibility and report compatibility; focused browser and record regressions',
           'readingDiagnosticBrowserChecks': len(diagnostic),
           'historicalAttemptsRewritten': False, 'syntheticSpeechStart': True,
           'existingEngineSuite': '41/45 in both FIX6 and FIX7; no new failures',
           'knownEngineFixtureFailures': baseline['knownFailures'],
           'fullAcceptance': 'NOT_RUN', 'physicalIPad': 'NOT_TESTED', 'physicalAudio': 'NOT_TESTED',
           'independentTeachingReview': 'NOT_RUN',
           'remaining': 'See github-upload/rc79-fix7/PROGRESS.json'}
out.mkdir(parents=True, exist_ok=True)
for name, report in {**reports, 'engine-baseline-comparison.json': baseline, 'candidate-receipt.json': receipt}.items():
    (out / name).write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n')
print(json.dumps(receipt))
