"""Derive an isolated QA page directly from the verified production bundle."""
import argparse
import hashlib
import json
import re
import subprocess
from pathlib import Path

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--check', action='store_true')
args = parser.parse_args()
root = Path(__file__).resolve().parent
production = (root.parent / 'index.html').read_text(encoding='utf-8')
release = json.loads((root / 'version.json').read_text())
release_id = 'rc'+re.search(r'rc\.(\d+)', release['siteVersion']).group(1)
namespaces = json.loads(subprocess.check_output(['node','-e',"console.log(JSON.stringify(require('./source/storage_namespaces').registry(require('./source/version.json'))))"],cwd=root.parent,text=True))
store = "const STORE='"+next(r['key'] for r in namespaces if r['scope']=='main')+"';"
assert production.count(store) == 1
isolated = production.replace(store, "const STORE='tianle_amc8_qa_" + release_id + "_v1';")
validation = root / 'validation_fixtures.js'
if validation.exists():
    prelude = validation.read_text(encoding='utf-8')
    assert '</script' not in prelude.lower()
    isolated = isolated.replace('<script>', '<script>\n'+prelude+'\n</script>\n<script>', 1)
controls = (root / 'qa_controls.js').read_text(encoding='utf-8')
assert '</script' not in controls.lower()
assert isolated.count('</body>') == 1
payload = isolated.replace('</body>', '<script>\n' + controls + '\n</script>\n</body>').encode('utf-8')
target = root.parent / 'qa' / 'index.html'
normal_payload = production.replace(store, "const STORE='tianle_amc8_qa_normal_" + release_id + "_v1';").encode('utf-8')
normal_target = root.parent / 'qa' / 'normal' / 'index.html'
fixture = json.loads((root / 'qa_rc64_fixture.json').read_text(encoding='utf-8'))
assert fixture['synthetic'] is True
fixture_json = json.dumps(fixture['record'], ensure_ascii=False, separators=(',', ':')).replace('<', '\\u003c')
history_store = 'tianle_amc8_qa_history_'+release_id+'_v1'
preload = '<script>\n(function(){try{if(localStorage.getItem(' + json.dumps(history_store) + ')===null)localStorage.setItem(' + json.dumps(history_store) + ',' + json.dumps(fixture_json, ensure_ascii=False).replace('<', '\\u003c') + ')}catch{}})();\n</script>\n'
history = production.replace(store, "const STORE='" + history_store + "';")
history = history.replace('<script>', preload+'<script>', 1)
history = history.replace('<body>', '<body><section class="panel" style="max-width:1180px;margin:18px auto;padding:18px"><h1>RC64 合成旧记录 · 公网兼容 QA</h1><p>独立测试记录；点击“继续上次”检查第二题草稿与排除项，再回看首题的先错后对记录。本页使用当前主站生产恢复代码。</p><p><a href="../">定向 QA</a> · <a href="../../muse/legacy-record-fixture.json">合成记录与期望值</a></p></section>', 1)
history_payload = history.encode('utf-8')
history_target = root.parent / 'qa' / 'history' / 'index.html'
if args.check:
    assert normal_target.is_file() and normal_target.read_bytes() == normal_payload, 'Normal QA build is stale'
    assert target.is_file() and target.read_bytes() == payload, 'QA build is stale'
    assert history_target.is_file() and history_target.read_bytes() == history_payload, 'History QA build is stale'
else:
    target.parent.mkdir(exist_ok=True)
    target.write_bytes(payload)
    normal_target.parent.mkdir(exist_ok=True)
    normal_target.write_bytes(normal_payload)
    history_target.parent.mkdir(exist_ok=True)
    history_target.write_bytes(history_payload)
print(('Verified' if args.check else 'Built') + ' QA using production bundle; SHA-256 ' + hashlib.sha256(payload).hexdigest())
print('History QA SHA-256 ' + hashlib.sha256(history_payload).hexdigest())
