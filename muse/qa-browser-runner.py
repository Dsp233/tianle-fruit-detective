"""Run genuine RC67 HTTP/Chrome regression on the project's standard Actions runner.

This runner never writes to Pages, contacts the production site, reads user
records, installs a browser, or requests a repository write token.
"""
import hashlib
import json
import os
from pathlib import Path
import shutil
import subprocess
import sys
import time
import urllib.request
import zipfile


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


root = Path(__file__).resolve().parent.parent
candidate_configuration = json.loads((root / 'muse/qa-browser-candidate.json').read_text())
workspace = Path(os.environ['RUNNER_TEMP']) / 'rc67-browser'
workspace.mkdir()
evidence = workspace / 'evidence'
evidence.mkdir()
metadata = {
    'result': 'running', 'environment': 'GitHub Actions standard ubuntu-24.04',
    'runId': os.environ.get('GITHUB_RUN_ID'), 'testerCommit': os.environ.get('GITHUB_SHA'),
    'sourceCommit': 'a012c4e89f263c894f4173d95810b1ec3dda480c',
    'sourcePackageSha256': 'b29652875fc1b5ea79ae7bae6d48a8b86ff1658431d2e420630f4a19ddf31016',
    'candidateSourceCommit': candidate_configuration['candidateSourceCommit'],
    'productionSha256': candidate_configuration['productionSha256'],
    'store': 'tianle_amc8_rc67_local_v1', 'productionRecordsAccessed': False,
    'browserDownloaded': False, 'publicDeployment': False, 'commands': []
}


def write():
    (evidence / 'environment.json').write_text(json.dumps(metadata, indent=2) + '\n')


def run(command, cwd=None):
    result = subprocess.run(command, cwd=cwd, text=True, stdout=subprocess.PIPE,
                            stderr=subprocess.STDOUT)
    metadata['commands'].append({'command': command, 'exitCode': result.returncode,
                                 'output': result.stdout})
    print(result.stdout, flush=True)
    write()
    if result.returncode:
        raise RuntimeError('Command failed: ' + ' '.join(command))
    return result.stdout.strip()


server = None
try:
    package = root / 'muse/rc67-muse-handoff.zip'
    assert sha(package) == metadata['sourcePackageSha256'], 'The frozen Muse source ZIP changed'
    unpacked = workspace / 'unpacked'
    with zipfile.ZipFile(package) as archive:
        assert archive.testzip() is None
        manifest = json.loads(archive.read('manifest.json'))
        assert manifest['sourceCommit'] == metadata['sourceCommit']
        for entry in manifest['files']:
            assert hashlib.sha256(archive.read(entry['path'])).hexdigest() == entry['sha256']
        for name in archive.namelist():
            destination = (unpacked / name).resolve()
            assert destination.is_relative_to(unpacked.resolve()), 'Unsafe ZIP path'
        archive.extractall(unpacked)
    candidate = workspace / 'candidate'
    run([sys.executable, str(unpacked / 'restore-source.py'), str(candidate)])
    assert run(['git', 'rev-parse', 'HEAD'], cwd=candidate) == metadata['sourceCommit']
    assert candidate_configuration['baseSourceCommit'] == metadata['sourceCommit']
    assert {p['path'] for p in candidate_configuration['patches']} == {
        'source/competition_scene_ui.js', 'source/index.template.html',
        'source/competition_ui.js'}
    metadata['patches'] = candidate_configuration['patches']
    for patch in metadata['patches']:
        target = candidate / patch['path']
        patch_file = root / 'muse' / patch['file']
        assert sha(target) == patch['beforeSha256'], 'Unexpected original source'
        assert sha(patch_file) == patch['sha256'], 'Candidate patch bytes changed'
        shutil.copyfile(patch_file, target)
    metadata['publishedRuntimeSha256'] = sha(root / 'index.html')
    assert metadata['publishedRuntimeSha256'] in {
        candidate_configuration['previousPublishedSha256'], metadata['productionSha256']}
    run([sys.executable, 'source/build.py'], cwd=candidate)
    assert sha(candidate / 'index.html') == metadata['productionSha256']
    run([sys.executable, 'source/build.py', '--check'], cwd=candidate)
    run([sys.executable, 'source/build.py', '--local-prototype'], cwd=candidate)
    run([sys.executable, 'source/build.py', '--local-prototype', '--check'], cwd=candidate)
    production = (candidate / 'index.html').read_bytes()
    local = (candidate / 'local-preview/index.html').read_bytes()
    assert production.count(b"const STORE='tianle_amc8_question_design_v1';") == 1
    assert local == production.replace(b"const STORE='tianle_amc8_question_design_v1';",
                                      b"const STORE='tianle_amc8_rc67_local_v1';")
    metadata['localSha256'] = hashlib.sha256(local).hexdigest()
    tester = root / 'muse/qa-browser-test.js'
    metadata['testScriptSha256'] = sha(tester)
    shutil.copyfile(tester, candidate / 'source/test_rc67_browser.js')
    chrome = shutil.which('google-chrome') or shutil.which('chromium')
    assert chrome, 'No preinstalled Chrome/Chromium; browser installation is not attempted'
    metadata['browserExecutable'] = chrome
    metadata['browserVersion'] = run([chrome, '--version'])
    metadata['nodeVersion'] = run(['node', '--version'])
    write()
    with (evidence / 'http.log').open('w') as http_log:
        server = subprocess.Popen([sys.executable, '-u', '-m', 'http.server', '8768',
                                   '--bind', '127.0.0.1', '--directory',
                                   str(candidate / 'local-preview')], stdout=http_log,
                                   stderr=subprocess.STDOUT)
        for attempt in range(50):
            try:
                with urllib.request.urlopen('http://127.0.0.1:8768', timeout=1) as response:
                    assert response.status == 200 and response.read() == local
                break
            except OSError:
                if server.poll() is not None:
                    raise RuntimeError('Isolated HTTP server exited')
                time.sleep(0.1)
        else:
            raise RuntimeError('Isolated HTTP server did not become ready')
        env = {**os.environ, 'AMC8_BROWSER_EXECUTABLE': chrome,
               'AMC8_BROWSER_EVIDENCE': str(evidence),
               'AMC8_LOCAL_URL': 'http://127.0.0.1:8768'}
        with (evidence / 'operations.log').open('w') as log:
            process = subprocess.Popen(['node', 'source/test_rc67_browser.js'], cwd=candidate,
                                       env=env, text=True, stdout=subprocess.PIPE,
                                       stderr=subprocess.STDOUT)
            for line in process.stdout:
                print(line, end='', flush=True)
                log.write(line)
                log.flush()
            code = process.wait()
        result = json.loads((evidence / 'browser-results.json').read_text())
        metadata['result'] = result['result']
        metadata['browserExitCode'] = code
        write()
        assert code == 0 and result['result'] == 'passed', 'Real browser regression failed'
except Exception as error:
    metadata['result'] = 'failed'
    metadata['error'] = str(error)
    write()
    raise
finally:
    if server:
        server.terminate()
        server.wait(timeout=5)
    files = [{'path': p.name, 'bytes': p.stat().st_size, 'sha256': sha(p)}
             for p in sorted(evidence.iterdir()) if p.is_file() and p.name != 'file-manifest.json']
    (evidence / 'file-manifest.json').write_text(json.dumps(files, indent=2) + '\n')
