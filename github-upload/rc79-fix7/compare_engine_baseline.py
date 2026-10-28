"""Keep the four pre-existing fixture failures visible and reject any new failure."""
import json
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

source = Path(sys.argv[1]).resolve()
out = Path(sys.argv[2]).resolve()
baseline = Path(__file__).resolve().parent.parent / 'rc79-fix6/overlay/source/reading_engine.js'
expected = sorted([
    'prior reading exposure excludes transfer and diagnostic reuse',
    'calendar completion alone does not advance reading complexity',
    'sufficient matched first evidence on multiple dates permits next week without forcing pinyin removal',
    'self-reported mathematics reading barrier targets language remediation once',
])
results = {}
with tempfile.TemporaryDirectory() as temp:
    for label, engine in [('FIX6', baseline), ('FIX7', source / 'reading_engine.js')]:
        root = Path(temp) / label
        (root / 'source').mkdir(parents=True)
        shutil.copyfile(engine, root / 'source/reading_engine.js')
        shutil.copyfile(source / 'reading_engine_test.js', root / 'source/reading_engine_test.js')
        process = subprocess.run(['node', 'source/reading_engine_test.js'], cwd=root, capture_output=True, text=True)
        report = json.loads((root / 'docs/reading/engine_test_results.json').read_text())
        failures = sorted(row['name'] for row in report['cases'] if row['status'] == 'FAIL')
        results[label] = {'exitCode': process.returncode, 'report': report}
        assert report['total'] == 45 and report['passed'] == 41, label
        assert failures == expected and process.returncode == 1, (label, failures)
out.parent.mkdir(parents=True, exist_ok=True)
receipt = {'result': 'NO_NEW_FAILURES', 'suiteResult': '41_OF_45_PASS_IN_BOTH',
           'knownFailures': expected, 'scope': 'unchanged synthetic fixture suite, not full acceptance',
           'results': results}
out.write_text(json.dumps(receipt, ensure_ascii=False, indent=2) + '\n')
print(json.dumps({k: v for k, v in receipt.items() if k != 'results'}))
