"""Reproduce the frozen HOME1 application only for isolated compatibility tests."""
import hashlib
import importlib
import json
import runpy
import shutil
import sys
from pathlib import Path
root=Path(sys.argv[1]).resolve()
expected_reading='0c8ad843af039308d749ce44f75ad74577b5fce96ffd009e18f770b13c849358'
expected_build='df38ff002e12f35e7cd90fe2718e94797305ff9b921135af5997217590404599'
expected_mapping='a1d855c798c8458a6ea5d99c709e54e8341b87b23aa12b1c89211164e793ebb9'
if hashlib.sha256((root/'reading_data.js').read_bytes()).hexdigest()!=expected_reading:raise RuntimeError('Frozen reading data differs')
sys.path.insert(0,str(root))
module=importlib.import_module('build_reading');module.build=lambda **kwargs:None
sys.argv=[str(root/'build.py')];runpy.run_path(str(root/'build.py'),run_name='__main__')
html=root.parent/'index.html'
if hashlib.sha256(html.read_bytes()).hexdigest()!=expected_build:raise RuntimeError('Frozen HOME1 build does not match its contract')
if json.loads((root/'exam_runtime_index.json').read_text())['mappingBuildId']!=expected_mapping:raise RuntimeError('Frozen mapping build does not match the delivered baseline')
target=root.parent/'tmp/fix79-baseline.html';target.parent.mkdir(parents=True,exist_ok=True);shutil.copyfile(html,target)
print('Verified exact HOME1 baseline for isolated old-record compatibility checks')
