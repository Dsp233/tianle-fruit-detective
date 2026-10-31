#!/usr/bin/env python3
"""Build an isolated, unreleased R2 candidate on the verified FIX15 basis.

The destination must already have the FIX15 source overlay applied. This
script never operates on the deployed checkout and does not package or publish.
"""
import hashlib, importlib, json, runpy, shutil, sys
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
dest=Path(sys.argv[1]).resolve(); source=dest/'source'
def digest(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def require(p,expected):
 actual=digest(p)
 if actual!=expected:raise RuntimeError(f'Unexpected input {p}: {actual}')

baseline={
 'index.html':'70e54a096d71f72b14cee1218ffa29367cf95f63a2e0ab1775a95ba10b93b4e8',
 'reading_data.js':'0c8ad843af039308d749ce44f75ad74577b5fce96ffd009e18f770b13c849358',
 'app.js':'c1d72fe395197a75b779d0fd197f653c233de19a26e45fda1f54ebf3e665dbd5',
 'reading_engine.js':'83d3f32c811337752c08496a1bcebae0001c13f346eddf88896701c5e95d5781',
 'version.json':'b4de0a7ea17325f834ab4ff595c37bd291c5e46c67144967a4253261369dc887',
 'reading.css':'74dc6973aeef0454fd1c1958305acceeffdf33b98467908f714c0e3b6fa9f94e',
}
for name,expected in baseline.items():require(source/name,expected)
inputs={
 'reading_data.js':(ROOT/'wp-course-data/candidate_reading_data.js','52e40699f3f89a667bb099feaa2077f519bc862b016aac955fea9f921e1e438b'),
 'reading_engine.js':(ROOT/'wp-engine/reading_engine.js','e2fb6c71b651904051a804952d0aca8b24c65aed0c73cbb7cc5bef8a495acd73'),
 'reading_ui.js':(ROOT/'wp-ui/reading_ui.js','e4cb2ac4faccab83846f896e2e8f5b3940d619f7ed8433ed7fbf86ca3fe2b4d9'),
 'reading-interactions.css':(ROOT/'wp-ui/reading-interactions.css','9e8cf1a6160126ef29db9ad4e4bafab76185eef17e080ad1ba18051ba1a53068'),
}
for p,expected in inputs.values():require(p,expected)
for name in ('reading_data.js','reading_engine.js','reading_ui.js'):shutil.copyfile(inputs[name][0],source/name)
release_path=source/'version.json'
release=json.loads(release_path.read_text(encoding='utf-8'))
release['label']='V12.0-rc.79 A9 · 中文阅读 84 天集成候选（未发布）'
release['readingCandidate']={'courseId':'R2-84D-20261031','status':'unreviewed-not-released'}
release_path.write_text(json.dumps(release,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
css=(source/'reading.css').read_text(encoding='utf-8')
css+='\n/* R2 candidate interaction controls */\n'+inputs['reading-interactions.css'][0].read_text(encoding='utf-8')
(source/'reading.css').write_text(css,encoding='utf-8')

# Run the repository's normal build while retaining the explicitly generated
# candidate data; the old compiler only understands the previous course.
sys.path.insert(0,str(source))
module=importlib.import_module('build_reading');module.build=lambda **kwargs:None
sys.argv=[str(source/'build.py')]
runpy.run_path(str(source/'build.py'),run_name='__main__')

# Preserve the same mapping and native-input compatibility checks used in the
# existing FIX13/FIX15 release build; no mathematical semantics may drift.
release=json.loads((source/'version.json').read_text(encoding='utf-8'))
semantic='f55f248abb8f46e201ead1d35a20598e387484f93a49874123d80f2513b37839'
baseline_ids=['a1d855c798c8458a6ea5d99c709e54e8341b87b23aa12b1c89211164e793ebb9','f881e9a2aadd16e35dc6a6eb9f9df87597dba298d3204e58d536a93f2421d07a','eeedb3aefdb021fab8c829171b4580fe9ff5a8b35f06a2a7c9678d3edc226da6','3838dcb354ee34c2b183e9781d9141516f69fd4f01ec84f725c6fafd5dcac63d','603184a9ce43e1b28ae389f351318d00d98b451c544fff148835101b4c283170','b84fb96120fcdbdf4dcb5a4ec0eabcc3ec1f7ac2fa4a51c0bd407872548ddd52']
if release.get('compatibleMappingBuildIds')!=baseline_ids or release.get('compatibleMappingSemanticSha256')!=semantic:raise RuntimeError('Mapping compatibility declaration changed')
mapping=json.loads((source/'exam_runtime_index.json').read_text(encoding='utf-8'));mapping.pop('mappingBuildId',None);mapping.pop('inputFiles',None)
canonical=json.dumps(mapping,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode('utf-8')
if hashlib.sha256(canonical).hexdigest()!=semantic:raise RuntimeError('Mathematics mapping semantics changed')
approved={'index.template.html':'2b0e32f513ea4c01fb937009f830b4061605325377ce6995e7e82a71db6c7811','selection_diagnostics.js':'374fc00d20bb08783542617c3dd61ac0a6bc9be467d8f7549b46863c660fcf19'}
if release.get('jointReuseCompatibleUiHashes')!=approved:raise RuntimeError('Joint evidence UI declaration changed')
old=json.loads((source/'joint_native_snapshot.json').read_text(encoding='utf-8'))['sourceHashes']
if importlib.import_module('native_reuse_inputs').source_hashes()!={**old,**approved}:raise RuntimeError('Native task or grading sources changed')
manifest={'status':'CANDIDATE_NOT_RELEASED','basisCommit':'98cfd12797013845c4771719778b9b5f62214308',
 'courseContentHash':'19c7b6231a0ffe5e7cdfcddc1224427ceed645511375b53024fb1a6c281dea01',
 'sourceInputs':{name:sha for name,(_,sha) in inputs.items()},'rawEntrySha256':digest(source/'index.html'),
 'mathMappingSemanticSha256':semantic,'independentTeachingAndDeviceReview':'NOT_RUN'}
(dest/'reading-workpackage-candidate.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(json.dumps(manifest,ensure_ascii=False))
