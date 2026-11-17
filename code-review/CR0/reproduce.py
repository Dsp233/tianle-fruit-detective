"""CR0: execute the pinned production bytes; never edit the working checkout.

Exit 1 means a product safety contract failed; exit 2 means a harness error.
Browser cases run on fresh synthetic profiles. Build mutations use throwaway
git worktrees. No workflow dispatch, production requests, or storage cleanup.
"""
import argparse
import base64
import contextlib
import functools
import gzip
import hashlib
import http.server
import json
import math
import os
from pathlib import Path
import re
import subprocess
import sys
import tempfile
import threading
import traceback
import fnmatch

ROOT = Path(__file__).resolve().parents[2]
BASE = '05f73af21ddf35134bb7c5e598cd75845e82baf2'
OUT = Path(os.environ.get('CR0_OUT', ROOT / 'code-review/CR0/evidence'))
OUT.mkdir(parents=True, exist_ok=True)
ROWS = []
KEY = 'tianle_q0_production_review_v1'
LEARNING = {'tianle_amc8_question_design_v1': '{"synthetic":"math-sentinel"}',
            'tianle_amc8_question_design_v1_reading_r1': '{"synthetic":"reading-sentinel"}'}

def sha(b):
    return hashlib.sha256(b).hexdigest()

def record(case, contract, **facts):
    row = dict(case=case, contract=contract, **facts)
    ROWS.append(row)
    print(json.dumps(row, ensure_ascii=False), flush=True)

def command(args, cwd, name, env=None):
    result = subprocess.run(args, cwd=cwd, env=env, text=True, stdout=subprocess.PIPE, stderr=subprocess.STDOUT)
    (OUT / (name + '.log')).write_text('$ ' + ' '.join(args) + '\n' + result.stdout + '\nEXIT=' + str(result.returncode) + '\n')
    return result

def config(root):
    return json.loads(re.search(r'<script id="learning-delivery" type="application/json">(.*?)</script>', (root/'index.html').read_text())[1])

def unpack(root, row):
    return gzip.decompress(b''.join(base64.b64decode(json.loads((root/p).read_text())['gz']) for p in row['parts']))

@contextlib.contextmanager
def checkout():
    with tempfile.TemporaryDirectory(prefix='amc8-cr0-') as temp:
        work = Path(temp) / 'repo'
        subprocess.run(['git', 'worktree', 'add', '--detach', str(work), BASE], cwd=ROOT, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        try:
            yield work
        finally:
            subprocess.run(['git', 'worktree', 'remove', '--force', str(work)], cwd=ROOT, check=True, stdout=subprocess.DEVNULL)

class QuietHandler(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *args):
        pass

@contextlib.contextmanager
def serve(root):
    server = http.server.ThreadingHTTPServer(('127.0.0.1', 0), functools.partial(QuietHandler, directory=str(root)))
    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()
    try:
        yield 'http://127.0.0.1:' + str(server.server_port) + '/'
    finally:
        server.shutdown()
        server.server_close()
        thread.join()

def inventory(root):
    cfg = config(root)
    packets = []
    for module in ('reading', 'math'):
        for kind in ('data', 'scripts'):
            for i, row in enumerate(cfg[module][kind]):
                body = unpack(root, row)
                assert sha(body) == row['id']
                packets.append(dict(module=module, group=kind, index=i, id=sha(body), bytes=len(body), parts=row['parts']))
    (OUT/'runtime-inventory.json').write_text(json.dumps(packets, indent=2)+'\n')
    record('runtime-packet-integrity-control', 'PASS', packets=len(packets), source_sha=BASE)

def builds():
    results = []
    for i in range(2):
        with checkout() as work:
            result = command([sys.executable, 'reading-art/build.py'], work, f'CR-002-art-clean-{i+1}')
            assert result.returncode == 0, result.stdout
            release = json.loads((work/'reading-art/release.json').read_text())
            digest = {p: sha((work/p).read_bytes()) for p in release['files']}
            assert digest == release['files']
            baseline_digest = {p: sha((ROOT/p).read_bytes()) for p in release['files']}
            diff = subprocess.check_output(['git','diff','--name-only'], cwd=work, text=True).splitlines()
            results.append(digest)
            record(f'CR-002-supported-art-build-{i+1}', 'PASS' if digest == baseline_digest and not diff else 'FAIL',
                   command='python reading-art/build.py', matches_main=digest == baseline_digest, tracked_changes=diff, files=len(digest))
    record('CR-002-two-clean-builds', 'PASS' if results[0] == results[1] else 'FAIL', byte_identical=results[0] == results[1])
    with checkout() as work:
        before = config(work)['reading']
        result = command([sys.executable, 'reading-quality/build.py'], work, 'CR-002-historical-quality-build')
        assert result.returncode == 0, result.stdout
        after = config(work)['reading']
        js = unpack(work, after['scripts'][0]).decode()
        gate = command([sys.executable, 'reading-art/build.py', '--verify-release'], work, 'CR-002-after-old-build-gate')
        changes = subprocess.check_output(['git','diff','--name-only'], cwd=work, text=True).splitlines()
        record('CR-002-old-builder-preserves-current-release', 'FAIL' if after != before else 'PASS',
               before_runtime=before['scripts'][0]['id'], after_runtime=after['scripts'][0]['id'],
               story_art_preserved='const storyArtByMaterial' in js, vocabulary_preserved='function dayOneVocabulary' in js,
               command_exit=result.returncode, downstream_release_gate_exit=gate.returncode, tracked_changes=changes)

def workflow_matrix(work, changed):
    import yaml
    matrix = []
    for path in sorted((work/'.github/workflows').glob('*.yml')):
        data = yaml.safe_load(path.read_text())
        events = data.get('on', data.get(True, {}))
        if not isinstance(events, dict):
            continue
        event = events.get('pull_request')
        if 'pull_request' not in events:
            continue
        event = event or {}
        branches = event.get('branches', ['*'])
        triggered = any(fnmatch.fnmatchcase('main', p) for p in branches) and any(fnmatch.fnmatchcase(changed,p) for p in event.get('paths',['**']))
        matrix.append(dict(workflow=path.name, triggered=triggered))
    return matrix

def identify(work, name):
    import yaml
    workflow = yaml.safe_load((work/'.github/workflows/w1-reading-quality.yml').read_text())
    steps = workflow['jobs']['reading']['steps']
    block = next(s['run'] for s in steps if s.get('id') == 'kind')
    with tempfile.NamedTemporaryFile() as output:
        r = command(['bash', '-e', '-c', block], work, name, env={**os.environ, 'GITHUB_OUTPUT':output.name})
        values = Path(output.name).read_text()
    skipped = [s.get('name',s.get('run',s.get('uses'))) for s in steps if "steps.kind.outputs.art != 'true'" in s.get('if','') and 'art=true' in values]
    return r.returncode, values, skipped

def boot(browser, url, seed=None):
    context = browser.new_context(viewport={'width':390, 'height':844}, accept_downloads=True)
    if seed:
        context.add_init_script('if (!sessionStorage.getItem("cr0seed")) {for(const [k,v] of Object.entries('+json.dumps(seed)+'))localStorage.setItem(k,v);sessionStorage.setItem("cr0seed","1")}')
    page = context.new_page()
    page.set_default_timeout(20000)
    page.goto(url)
    page.locator('#toggle-review').wait_for()
    return context, page

def note_seed():
    return json.dumps({'schema':1,'notes':[{'id':1,'text':'CR0 original synthetic note','path':'/','pageTitle':'','element':'h1','selector':'#app h1','card':'#app','status':'open','category':'Bug','build':BASE,'version':'CR0','relativeX':.5,'relativeY':.5}], 'nextId':2})

def review_cases(browser, engine, url):
    for action in ('create','edit','processed','delete'):
        for failed in (False, True):
            seed = dict(LEARNING)
            if action != 'create':
                seed[KEY] = note_seed()
            ctx, page = boot(browser, url, seed)
            try:
                if failed:
                    page.evaluate('''key => { const original = Storage.prototype.setItem; window.__cr0Throws=0;
                    Storage.prototype.setItem=function(k,v) {if(k===key){window.__cr0Throws++;throw new DOMException('CR0 synthetic quota','QuotaExceededError')} return original.call(this,k,v)} }''', KEY)
                if action == 'create':
                    page.locator('#toggle-review').click()
                    page.locator('#app h1').click()
                    page.locator('#confirm-region').click()
                    page.locator('#note-text').fill('CR0 unsaved synthetic note')
                    page.locator('#save-annotation').click()
                else:
                    page.locator('#open-list').click()
                    page.locator('.note-actions').get_by_role('button', name='修改', exact=True).click()
                    if action == 'edit':
                        page.locator('#note-text').fill('CR0 edited synthetic note')
                        page.locator('#save-annotation').click()
                    elif action == 'processed':
                        page.locator('#mark-processed').click()
                    else:
                        page.once('dialog', lambda d: d.accept())
                        page.locator('#delete-annotation').click()
                status = page.locator('#review-save-status').inner_text()
                stored = page.evaluate('k=>localStorage.getItem(k)',KEY)
                throws = page.evaluate('window.__cr0Throws||0')
                page.locator('#open-list').click()
                memory_count = page.locator('.review-note').count()
                warning = page.locator('#list-storage-warning').inner_text()
                with page.expect_download() as download:
                    page.locator('#download-md').click()
                text = Path(download.value.path()).read_text(encoding='utf-8-sig')
                assert 'CR0' in text
                assert page.evaluate('keys=>Object.fromEntries(keys.map(k=>[k,localStorage.getItem(k)]))',list(LEARNING)) == LEARNING
                page.reload()
                page.locator('#open-list').click()
                reloaded_count = page.locator('.review-note').count()
                reloaded_text = page.locator('#review-items').inner_text()
                success_claim = any(s in status for s in ('意见已保存','意见状态已更新','意见已删除'))
                if failed:
                    assert throws == 1 and stored == seed.get(KEY), (throws,stored)
                    assert '未持久化' in warning
                    contract = 'FAIL' if success_claim else 'PASS'
                else:
                    assert success_claim
                    value = json.loads(stored)
                    assert len(value['notes']) == (0 if action=='delete' else 1)
                    if action=='processed': assert value['notes'][0]['status']=='processed'
                    if action=='edit': assert value['notes'][0]['text']=='CR0 edited synthetic note'
                    assert reloaded_count == memory_count
                    contract = 'PASS'
                record(f'CR-001-{engine}-{action}-'+('quota' if failed else 'control'),contract,
                       status=status, throws=throws, memory_count=memory_count, reloaded_count=reloaded_count,
                       reloaded_text=reloaded_text, persistent_unchanged=stored==seed.get(KEY), warning=warning,
                       export_has_unsaved_text=('CR0 unsaved synthetic note' in text or 'CR0 edited synthetic note' in text),
                       export_has_original='CR0 original synthetic note' in text, learning_sentinels_unchanged=True)
            finally:
                ctx.close()

def reading_page(browser,url):
    ctx,page=boot(browser,url)
    page.locator('[data-home-hub] [data-action=reading]').click()
    page.locator('.rd-today [data-action=rdStart]').click()
    page.locator('.rd-story-text').first.wait_for()
    return ctx,page

def overflow(page):
    return page.evaluate('''()=>({viewport:innerWidth,document:document.documentElement.scrollWidth,
       storyWidth:document.querySelector('.rd-story-text').getBoundingClientRect().width})''')

def ci_cases(browsers):
    with checkout() as work:
        css = re.search(r'href="\./(assets/reading-quality/[^\"]+\.css)"',(work/'index.html').read_text())[1]
        with serve(work) as url:
            controls={}
            for engine,browser in browsers.items():
                ctx,page=reading_page(browser,url)
                controls[engine]=overflow(page)
                assert controls[engine]['document'] <= 391, controls
                ctx.close()
            original=(work/css).read_bytes()
            (work/css).write_bytes(original+b'\n/* CR0 isolated fault */\n.rd-story-text{width:2000px!important}\n')
            code, outputs, skipped=identify(work,'CR-003-layout-identify')
            matrix=workflow_matrix(work,css)
            for engine,browser in browsers.items():
                ctx,page=reading_page(browser,url)
                actual=overflow(page)
                assert actual['document']>391,actual
                record('CR-003-'+engine+'-layout-fault-gate','FAIL' if code==0 and skipped else 'PASS',
                       changed_path=css,baseline=controls[engine],actual=actual,release_identify_exit=code,
                       workflow_outputs=outputs,skipped_steps=skipped,pr_trigger_matrix=matrix,
                       execution_scope='local replay of exact main workflow shell and parsed path filters; hosted via CR0 workflow')
                ctx.close()
            (work/css).write_bytes(original)
        # Art-only negative control: the existing verifier must reject bad bytes.
        asset=next(p for p in json.loads((work/'reading-art/release.json').read_text())['files'] if p.endswith('.webp'))
        (work/asset).write_bytes((work/asset).read_bytes()+b'CR0')
        result=command([sys.executable,'reading-art/build.py','--verify-release'],work,'CR-003-art-fault-gate')
        record('CR-003-art-only-control','PASS' if result.returncode else 'FAIL',changed_path=asset,
               verifier_exit=result.returncode,pr_trigger_matrix=workflow_matrix(work,asset))

def packet_cases(browser,engine,url,root):
    for kind in ('json','js','broken-gzip'):
        row=config(root)['reading']['data' if kind!='js' else 'scripts'][0]
        original=unpack(root,row)
        if kind=='json':
            data=json.loads(original); data['materials'][0]['title']='CR0 synthetic packet substitution'
            body=json.dumps(data,ensure_ascii=False,separators=(',',':')).encode()
        elif kind=='js': body=original+b'\nwindow.__CR0_PACKET_EXECUTED=true;\n'
        else: body=b'not gzip'
        compressed=gzip.compress(body,mtime=0) if kind!='broken-gzip' else body
        size=math.ceil(len(compressed)/len(row['parts']))
        replacements={p:json.dumps({'gz':base64.b64encode(compressed[i*size:(i+1)*size]).decode()}) for i,p in enumerate(row['parts'])}
        ctx=browser.new_context(viewport={'width':390,'height':844})
        page=ctx.new_page();page.set_default_timeout(20000)
        for p,payload in replacements.items():
            page.route('**/'+p,lambda route,payload=payload:route.fulfill(status=200,content_type='application/json',body=payload))
        page.goto(url);page.locator('[data-home-hub] [data-action=reading]').click()
        if kind=='broken-gzip':
            page.locator('[data-load-retry]').wait_for()
            accepted=False
        else:
            page.locator('.rd-today [data-action=rdStart]').wait_for()
            accepted=page.evaluate("window.__CR0_PACKET_EXECUTED===true" if kind=='js' else "window.__AMC8_READING_DATA.materials[0].title==='CR0 synthetic packet substitution'")
            assert accepted
        record(f'CR-004-{engine}-{kind}',('PASS' if not accepted else 'FAIL'),
               declared_sha=row['id'],actual_sha=sha(body),declared_bytes=row['bytes'],actual_bytes=len(body),
               accepted=accepted,fixture='valid compressed replacement under unchanged packet paths/manifest' if kind!='broken-gzip' else 'invalid gzip negative control')
        ctx.close()

def main():
    parser=argparse.ArgumentParser();parser.add_argument('--build-only',action='store_true');parser.add_argument('--browser-only',action='store_true');args=parser.parse_args()
    assert subprocess.check_output(['git','rev-parse',BASE],cwd=ROOT,text=True).strip()==BASE
    if not args.browser_only:
        inventory(ROOT);builds()
    if not args.build_only:
        from playwright.sync_api import sync_playwright
        with sync_playwright() as pw, checkout() as work, serve(work) as url:
            browsers={name:getattr(pw,name).launch() for name in ('chromium','webkit')}
            try:
                record('browser-environment','INFO',versions={k:b.version for k,b in browsers.items()},python=sys.version,source_sha=BASE)
                for engine,browser in browsers.items():
                    review_cases(browser,engine,url)
                    packet_cases(browser,engine,url,work)
                ci_cases(browsers)
            finally:
                for b in browsers.values():b.close()

if __name__=='__main__':
    exit_code=0
    try:
        main()
        exit_code=1 if any(x['contract']=='FAIL' for x in ROWS) else 0
    except Exception:
        error=traceback.format_exc();print(error,flush=True)
        record('harness','ERROR',error=error);exit_code=2
    finally:
        result={'source_sha':BASE,'test_sha':subprocess.check_output(['git','rev-parse','HEAD'],cwd=ROOT,text=True).strip(),
                'rows':ROWS,'exit_code':exit_code,'meaning':'FAIL is an executed violated product contract, not a harness PASS; missing cases are NOT_RUN'}
        (OUT/'results.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n')
        print('CR0_RESULT='+json.dumps(result,ensure_ascii=False),flush=True)
    sys.exit(exit_code)
