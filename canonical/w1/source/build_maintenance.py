"""Build a read-only, namespace-scoped maintenance archive page."""
import argparse, html, json, pathlib, re

ROOT = pathlib.Path(__file__).resolve().parent

def build(check=False):
    release = json.loads((ROOT/'version.json').read_text())
    version = re.search(r'rc\.(\d+)', release['siteVersion']).group(1)
    scripts = '\n'.join((ROOT/name).read_text() for name in ['progress_store.js','storage_namespaces.js','maintenance_ui.js'])
    assert '</script' not in scripts.lower()
    payload = ('<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">'
      '<title>学习记录只读导出</title><style>body{max-width:960px;margin:24px auto;padding:16px;font:18px/1.7 system-ui;color:#173d45}section{display:flex;gap:12px;flex-wrap:wrap;align-items:center;padding:16px;border-bottom:1px solid #bdd3d6}label{flex:1;min-width:220px}button{padding:12px;min-height:44px;font:inherit}input{margin-right:10px}a{color:#14657b}</style>'
      '<h1>学习记录只读导出</h1><p>'+html.escape(release['label'])+'</p><p>分别读取正式练习与测试记录，保留原文，不修改、迁移或合并。此页只能读取已经保存的记录，其他页面尚未保存的草稿请从原页面导出。</p>'
      '<div id="sources"></div><button id="export">导出所选来源</button><p id="status" role="status" aria-live="polite"></p>'
      '<p><a href="../../">返回正式练习</a> · <a href="../../qa/">定向 QA</a></p><script>window.__AMC8_RELEASE='+json.dumps(release,ensure_ascii=False).replace('<','\\u003c')+';\n'+scripts+'</script></html>').encode()
    target=ROOT.parent/'muse'/('rc'+version)/'maintenance.html'
    if check:
        assert target.exists() and target.read_bytes()==payload,'Maintenance build is stale'
    else:
        target.parent.mkdir(parents=True,exist_ok=True);target.write_bytes(payload)
    return target

if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('--check',action='store_true');a=p.parse_args();print(build(a.check))
