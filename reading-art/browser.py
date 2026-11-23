"""Check actual reading panel navigation and image rendering in two engines."""
import json
import os
import subprocess
import sys
import tarfile
import tempfile
import time
from pathlib import Path
from urllib.request import urlopen
from playwright.sync_api import sync_playwright

base = os.getenv('READING_ART_URL', 'http://127.0.0.1:4173/')
evidence = Path('reading-art/browser-evidence')
evidence.mkdir(exist_ok=True)
records = json.loads(Path('reading-art/assets.json').read_text())
scenes = json.loads(Path('reading-art/scenes.json').read_text())
receipts = []
with sync_playwright() as p:
    for name in ('chromium', 'webkit'):
        browser = getattr(p, name).launch()
        page = browser.new_page(viewport={'width': 390, 'height': 844})
        errors = []
        page.on('pageerror', lambda error: errors.append(str(error)))
        response = page.goto(base)
        assert response and response.ok
        page.locator('[data-home-hub] [data-action=reading]').click()
        page.locator('.rd-today [data-action=rdStart]').click()
        for index in range(1, 4):
            node = page.locator(f'.rd-story-art[data-art-panel="{index}"] img')
            node.scroll_into_view_if_needed()
            page.wait_for_function(
                """index => document.querySelector('.rd-story-art[data-art-panel="' + index +
                '"] img')?.naturalWidth > 0""", arg=index
            )
            assert node.get_attribute('src').endswith(records['1']['path'])
            if index != 3:
                page.locator('[data-action=rdPanelNext]').click()
        page.locator('[data-action=rdPanelAll]').click()
        assert page.locator('.rd-story-art').count() == 3
        page.locator('[data-action=rdReadDone]').click()
        assert page.locator('.rd-text-evidence .rd-story-text').is_visible()
        assert page.locator('.rd-text-evidence .rd-pinyin').count() > 0
        coverage = 0
        for scene in scenes:
            record = records.get(str(scene['day']))
            if not record:
                continue
            for material in scene['materials']:
                page.evaluate("id => window.__AMC8_ReadingRuntime.openMaterials([id])", material)
                panel = page.locator('.rd-panel .rd-story-art')
                if panel.count() != 3:
                    page.locator('[data-action=rdPanelAll]').click()
                assert panel.count() == 3, material
                images = panel.locator('img')
                assert all(url.endswith(record['path']) for url in
                           images.evaluate_all("nodes => nodes.map(node => node.src)")), material
                images.last.scroll_into_view_if_needed()
                page.wait_for_function(
                    "url => [...document.images].some(img => img.src.endsWith(url) && img.naturalWidth > 0)",
                    arg=record['path']
                )
                coverage += 3
        assert coverage == len(records) * 6
        assert not errors, errors
        receipts.append({'engine': name, 'day': 1, 'panelPositions': coverage,
                         'allPanels': 'pass', 'readToQuestion': 'pass', 'errors': errors})
        browser.close()
(evidence / 'receipt.json').write_text(json.dumps(receipts, indent=2) + '\n')
print(json.dumps(receipts))

release = Path('reading-art/release.json')
if '--panels-only' not in sys.argv and release.exists() and 'contentHash' in json.loads(release.read_text()):
    python = sys.executable
    language = [python, 'reading-quality/browser.py', '--joint']
    env = {**os.environ, 'READING_EVIDENCE_DIR': str(evidence)}
    if base.startswith('https://'):
        subprocess.run([*language, '--public'], env={**env, 'READING_PUBLIC': base}, check=True)
        subprocess.run(
            [python, 'github-upload/rc79-reading-workpackage/safety-work/w1-review-overlay/q0-public-browser-smoke.py'],
            env={**env, 'AMC8_PUBLIC_BASE': base}, check=True,
        )
    else:
        subprocess.run([python, 'reading-quality/check.py', '--joint'], env=env, check=True)
        baseline = 'f8e791e6cc5c62769b1c356723a4da67da05ce45'
        with tempfile.TemporaryDirectory() as old:
            with subprocess.Popen(['git', 'archive', baseline], stdout=subprocess.PIPE) as archive:
                with tarfile.open(fileobj=archive.stdout, mode='r|') as snapshot:
                    snapshot.extractall(old, filter='data')
                if archive.wait():
                    raise RuntimeError('Could not extract original W1 release')
            with subprocess.Popen(
                [python, '-m', 'http.server', '4174', '--bind', '127.0.0.1', '--directory', old],
                stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
            ) as server:
                try:
                    for _ in range(50):
                        try:
                            with urlopen('http://127.0.0.1:4174/', timeout=1):
                                break
                        except OSError:
                            time.sleep(0.1)
                    else:
                        raise RuntimeError('Original W1 release did not start')
                    subprocess.run(language, env=env, check=True)
                finally:
                    server.terminate()
