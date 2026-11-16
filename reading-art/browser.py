"""Check actual reading panel navigation and image rendering in two engines."""
import json
import os
from pathlib import Path
from playwright.sync_api import sync_playwright

base = os.getenv('READING_ART_URL', 'http://127.0.0.1:4173/')
evidence = Path('reading-art/browser-evidence')
evidence.mkdir(exist_ok=True)
records = json.loads(Path('reading-art/assets.json').read_text())
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
            node.locator('..').screenshot(path=evidence / f'{name}-day1-panel{index}.png')
            if index != 3:
                page.locator('[data-action=rdPanelNext]').click()
        page.locator('[data-action=rdPanelAll]').click()
        assert page.locator('.rd-story-art').count() == 3
        page.locator('[data-action=rdReadDone]').click()
        assert page.locator('.rd-text-evidence .rd-story-text').is_visible()
        assert page.locator('.rd-text-evidence .rd-pinyin').count() > 0
        assert not errors, errors
        receipts.append({'engine': name, 'day': 1, 'panelPositions': 3,
                         'allPanels': 'pass', 'readToQuestion': 'pass', 'errors': errors})
        browser.close()
(evidence / 'receipt.json').write_text(json.dumps(receipts, indent=2) + '\n')
print(json.dumps(receipts))
