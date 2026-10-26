"""Rebuild and freeze the disclosed record-preservation repair and native test revision N2."""
import hashlib
import importlib.util
import json
from pathlib import Path
import shutil
import subprocess
import sys

base, patch, frozen, package_dir = map(lambda x: Path(x).resolve(), sys.argv[1:5])
contract = json.loads((base / 'release-contract.json').read_text())
assert contract['buildId'] == '24e0de45e6d2b23684efb00fa711c9b9f6c341cd8637264a8b9b0c9822731f6c'
sys.path.insert(0, str(base / 'source'))

def load_module(name, path):
    spec = importlib.util.spec_from_file_location(name, path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module

runner = load_module('original_gate_runner', base / 'source/run_rc70_gates.py')
runner.make_plan(base / 'release-contract.json')
sha = lambda p: hashlib.sha256(Path(p).read_bytes()).hexdigest()
manifest = json.loads((patch / 'overlay-manifest.json').read_text())
assert manifest['baseArchiveSha256'] == 'f428b50683962f146148d3b6f2b0cd00e5beaab305c41496891dfe117427004a'
assert set(manifest['files']) == {'source/rc79_native_helpers.js',
    'source/rc79_native_fix_cases.js', 'source/rc79_persona_actions.js', 'source/competition_ui.js', 'source/version.json'}
for name, digest in manifest['files'].items():
    assert sha(patch / 'overlay' / name) == digest
    shutil.copyfile(patch / 'overlay' / name, base / name)
for script in ['build.py', 'build_qa.py', 'build_maintenance.py']:
    subprocess.run([sys.executable, 'source/' + script], cwd=base, check=True)
note = base / 'docs/rc79/native-test-revision-N2.md'
shutil.copyfile(patch / 'CHANGELOG.md', note)
(base / '.gitignore').write_text('__pycache__/\n*.pyc\ntmp/\n')
commands = [['git', 'init', '--quiet'],
    ['git', 'config', 'user.name', 'RC79 Acceptance'],
    ['git', 'config', 'user.email', 'rc79-acceptance@localhost'],
    ['git', 'add', '--', 'source', 'docs', '.github', '.gitignore'],
    ['git', 'commit', '--quiet', '-m', 'Freeze R1.2 record-preservation repair and native acceptance revision N2']]
for command in commands:
    subprocess.run(command, cwd=base, check=True)
freezer = load_module('native1_freezer', base / 'source/freeze_rc70.py')
new = freezer.freeze(frozen)
changed_sources = {name for name in set(contract['sourceFiles']) | set(new['sourceFiles']) if contract['sourceFiles'].get(name) != new['sourceFiles'].get(name)}
assert changed_sources == set(manifest['files']), 'Unexpected source changes during rebuild'
assert new['release']['candidateId'] == 'RC79-A9-READING-R1.2-N2'
assert new['files']['index.html'] != contract['files']['index.html']
assert new['sourceTreeHash'] != contract['sourceTreeHash']
assert new['buildId'] != contract['buildId']
package_dir.mkdir(parents=True, exist_ok=True)
packager = load_module('native1_packager', frozen / 'source/package_rc70_candidate.py')
receipt = packager.package(frozen, package_dir / 'RC79_A9_R12_NATIVE2_candidate.zip')
runner.make_plan(frozen / 'release-contract.json')
summary = {'revision': 'NATIVE2', 'baseBuildId': contract['buildId'],
    'buildId': new['buildId'], 'changedApplicationEntries': [name for name in new['files'] if new['files'][name] != contract['files'][name]],
    'changedSourceFiles': manifest['files'], 'archive': receipt,
    'formalReleaseAllowed': False, 'developmentAcceptance': 'NOT_RUN',
    'note': 'New immutable identity; all 69 CPU and 13 browser tasks and reading checks must run.'}
(package_dir / 'freeze-receipt.json').write_text(json.dumps(summary, ensure_ascii=False,
    indent=2) + '\n')
print(json.dumps(summary, ensure_ascii=False))
