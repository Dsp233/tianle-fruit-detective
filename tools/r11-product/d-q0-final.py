#!/usr/bin/env python3
"""Real public HTTPS Chromium smoke using only a new synthetic browser profile."""
from pathlib import Path
from playwright.sync_api import sync_playwright
import json
import os, hashlib, subprocess
OUT=Path('r11-probe-output');OUT.mkdir(exist_ok=True)
BASE='72f2f229246af362f9024db217479357890c8cd3'
assert Path('index.html').read_bytes()==subprocess.check_output(['git','show',BASE+':index.html'])

url=os.environ.get('AMC8_PUBLIC_BASE','https://dsp233.github.io/tianle-fruit-detective/')
if not url.startswith('https://'): raise ValueError('Live smoke requires HTTPS')

with sync_playwright() as p:
    browser=p.chromium.launch(headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
    page=browser.new_page(viewport={'width':390,'height':844},is_mobile=True,has_touch=True,accept_downloads=True)
    page.set_default_timeout(15000)
    errors=[]
    page.on('pageerror',lambda e:errors.append(str(e)))
    page.goto(url,wait_until='domcontentloaded')
    root=page.locator('#amc8-review-layer')
    root.locator('#toggle-review').wait_for()
    assert root.locator('#mode-label').inner_text()=='评审模式'
    assert root.locator('#review-toolbar').count()==0 or root.locator('#toggle-review').is_visible()
    record_key='tianle_q0_production_review_v1'
    before=page.evaluate("""() => Object.fromEntries(Object.keys(localStorage).filter(k=>!k.startsWith('tianle_q0_production_review')).map(k=>[k,localStorage.getItem(k)]))""")
    root.locator('#toggle-review').click()
    assert root.locator('#toggle-review').get_attribute('aria-pressed')=='true'
    # The learning action must not fire while the reviewer is selecting its target.
    page.locator('[data-home-hub] [data-action="home"]').click(force=True)
    if root.locator('#confirm-region').count():
        root.locator('#confirm-region').click()
    root.locator('#edit-modal').wait_for(state='visible')
    assert page.locator('[data-home-hub]').count()==1
    root.locator('#note-text').fill('Q0 线上合成验收意见（结束后删除）')
    root.locator('#save-annotation').click()
    root.locator('#review-markers .review-pin').first.wait_for()
    root.locator('#open-list').click()
    note=root.locator('.review-note').first
    beforeNote=note.inner_text()
    note.get_by_role('button',name='标为已处理',exact=True).click()
    note.get_by_text('已处理',exact=True).wait_for()
    processed=note.inner_text()
    note.get_by_role('button',name='重新打开',exact=True).click()
    note.get_by_text('待处理',exact=True).wait_for()
    reopened=note.inner_text()
    root.locator('#review-list-title').fill('Q0 合成验收')
    root.locator('#export-filename').fill('q0-synthetic-acceptance.md')
    with page.expect_download() as event:
        root.locator('#download-md').click()
    download=event.value
    assert download.suggested_filename=='q0-synthetic-acceptance.md',download.suggested_filename
    markdown=Path(download.path()).read_text(encoding='utf-8')
    download.save_as(str(OUT/'q0-synthetic-acceptance.md'))
    page.screenshot(path=str(OUT/'q0-note-list.png'),full_page=True)
    for term in ('Q0 合成验收','Q0 线上合成验收意见','button','学习首页'):
        assert term in markdown,(term,markdown[:1000])
    root.locator('#close-list').click()
    page.reload(wait_until='domcontentloaded')
    root=page.locator('#amc8-review-layer')
    root.locator('#open-list').click()
    assert 'Q0 线上合成验收意见' in root.locator('#review-items').inner_text()
    assert page.evaluate('(k)=>localStorage.getItem(k)!==null',record_key)
    root.locator('#review-list-title').fill('评审清单')
    root.locator('#export-filename').fill('')
    page.on('dialog', lambda dialog: dialog.accept())
    root.locator('.review-note .note-actions button.delete').click()
    root.locator('#close-list').click()
    after=page.evaluate("""() => Object.fromEntries(Object.keys(localStorage).filter(k=>!k.startsWith('tianle_q0_production_review')).map(k=>[k,localStorage.getItem(k)]))""")
    assert before==after,'Reviewing changed learning localStorage state'
    assert root.locator('#toggle-review').get_attribute('aria-pressed')=='false'
    assert not errors,errors
    result={'base':BASE,'url':url,'status':'PASS','scope':'V3 F20 public synthetic independent test','button':True,'interception':True,'downloadFilename':download.suggested_filename,'markdownContents':True,'persisted':True,'learningStorageUnchanged':True,'javascriptErrors':errors,'beforeNote':beforeNote,'processed':processed,'reopened':reopened,'downloadSha256':hashlib.sha256(markdown.encode()).hexdigest()}
    (OUT/'q0-receipt.json').write_text(json.dumps(result,ensure_ascii=False,indent=2))
    print('Q0_RECEIPT '+json.dumps(result,ensure_ascii=False))
    browser.close()
