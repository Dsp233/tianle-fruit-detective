"""Run disclosed test repairs against the unchanged, verified R1.2 application."""
import hashlib
import importlib.util
import json
import os
from pathlib import Path
import shutil
import subprocess
import sys

BASE_ZIP_SHA = 'f428b50683962f146148d3b6f2b0cd00e5beaab305c41496891dfe117427004a'
EXPECTED_BUILD = '24e0de45e6d2b23684efb00fa711c9b9f6c341cd8637264a8b9b0c9822731f6c'
ALLOWED = {'source/rc79_native_helpers.js', 'source/rc79_native_fix_cases.js',
           'source/rc79_persona_actions.js'}

def sha(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()

candidate, patch_root, output = map(lambda x: Path(x).resolve(), sys.argv[1:4])
output.mkdir(parents=True, exist_ok=True)
contract = json.loads((candidate / 'release-contract.json').read_text())
assert contract['buildId'] == EXPECTED_BUILD
sys.path.insert(0, str(candidate / 'source'))
spec = importlib.util.spec_from_file_location('frozen_runner', candidate / 'source/run_rc70_gates.py')
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)
# Validate every original frozen source/fixture before applying a disclosed test patch.
plan = module.make_plan(candidate / 'release-contract.json')
original_definition = plan['testDefinitionHash']
manifest = json.loads((patch_root / 'overlay-manifest.json').read_text())
assert set(manifest['files']) == ALLOWED
assert manifest['baseArchiveSha256'] == BASE_ZIP_SHA
application_hashes = {name: sha(candidate / name) for name in contract['files']}
for name, digest in manifest['files'].items():
    source = patch_root / 'overlay' / name
    assert sha(source) == digest
    shutil.copyfile(source, candidate / name)
definition = {'baseTestDefinitionHash': original_definition, 'overlayFiles': manifest['files'],
              'scope': 'DIAGNOSTIC_ONLY_25_TARGETED_PLUS_40_PERSONA'}
plan['testDefinitionHash'] = hashlib.sha256(json.dumps(definition, sort_keys=True,
    separators=(',', ':')).encode()).hexdigest()
plan['diagnosticOnly'] = True
plan['baseTestDefinitionHash'] = original_definition
plan_path = output / 'diagnostic-plan.json'
plan_path.write_text(json.dumps(plan, ensure_ascii=False, indent=2) + '\n')
env = {**os.environ, 'AMC8_RC79_PLAN': str(plan_path), 'DIAG_ROOT': str(candidate),
       'DIAG_OUT': str(output)}
javascript = r"""
const root=process.env.DIAG_ROOT,out=process.env.DIAG_OUT;
const N=require(root+'/source/native_browser_support');
(async()=>{const env=await N.start(root,out);if(!env)throw Error('BROWSER_UNAVAILABLE');
try{await require(root+'/source/rc79_native_acceptance').run(env,root,out)}
finally{await env.close()}})().catch(e=>{console.error(e);process.exitCode=1});
"""
result = subprocess.run(['node', '-e', javascript], env=env)
unchanged = all(sha(candidate / name) == digest for name, digest in application_hashes.items())
summary = {'diagnosticOnly': True, 'formalReleaseAllowed': False,
           'baseArchiveSha256': BASE_ZIP_SHA, 'baseBuildId': EXPECTED_BUILD,
           'testDefinitionHash': plan['testDefinitionHash'],
           'baseTestDefinitionHash': original_definition,
           'testOverlayFiles': manifest['files'], 'applicationEntriesUnchanged': unchanged,
           'result': 'PASS' if result.returncode == 0 and unchanged else 'FAIL',
           'note': 'These repaired test observations cannot replace a newly frozen complete acceptance run.'}
for name in ['rc79-fix-native.json', 'rc79-persona-native.json']:
    path = output / name
    if path.exists():
        report = json.loads(path.read_text())
        rows = report.get('rows', [])
        summary[name] = {'result': report.get('result'), 'total': len(rows),
            'passed': sum(row.get('status') == 'PASS' for row in rows),
            'failed': [row.get('caseId', row.get('executionId')) for row in rows
                       if row.get('status') != 'PASS']}
(output / 'diagnostic-summary.json').write_text(json.dumps(summary, ensure_ascii=False,
    indent=2) + '\n')
print(json.dumps(summary, ensure_ascii=False))
raise SystemExit(result.returncode or (0 if unchanged else 1))
