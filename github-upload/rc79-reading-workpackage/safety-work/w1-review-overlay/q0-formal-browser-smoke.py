#!/usr/bin/env python3
"""Isolated Q0 release browser smoke: no real learner data or external accounts."""
from contextlib import contextmanager
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from threading import Thread
from playwright.sync_api import sync_playwright
import json

ROOT=Path(__file__).resolve().parents[4]
class Quiet(SimpleHTTPRequestHandler):
    def __init__(self,*a,**kw): super().__init__(*a,directory=str(ROOT),**kw)
    def log_message(self,*args): pass

with ThreadingHTTPServer(('127.0.0.1',0),Quiet) as server:
    thread=Thread(target=server.serve_forever,daemon=True);thread.start()
    url=f'http://127.0.0.1:{server.server_port}/'
    with sync_playwright() as p:
        for engine in ('chromium','webkit'):
            browser=getattr(p,engine).launch(headless=True)
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
            # An adjustment remains visible and editable before the modal opens.
            page.locator('[data-home-hub] h1').first.tap()
            box=root.locator('.review-selection')
            box.wait_for(state='visible')
            assert root.locator('#edit-modal').is_hidden()
            move=box.locator('[data-edge="move"]')
            before_box=box.bounding_box()
            cx=before_box['x']+before_box['width']/2
            cy=before_box['y']+before_box['height']/2
            page.mouse.move(cx,cy);page.mouse.down();page.mouse.move(cx+14,cy+12,steps=4);page.mouse.up()
            moved=box.bounding_box()
            assert moved['y']>before_box['y']+8,(before_box,moved)
            corner=box.locator('[data-edge="se"]').bounding_box()
            x=corner['x']+corner['width']/2;y=corner['y']+corner['height']/2
            page.mouse.move(x,y);page.mouse.down();page.mouse.move(x+15,y+16,steps=4);page.mouse.up()
            assert box.bounding_box()['height']>moved['height']+10
            assert root.locator('#edit-modal').is_hidden()
            root.locator('#cancel-region').click()
            assert box.is_hidden()
            # The learning action must not fire while the reviewer is selecting its target.
            page.locator('[data-home-hub] [data-action="home"]').click(force=True)
            box.wait_for(state='visible')
            assert root.locator('#edit-modal').is_hidden()
            root.locator('#confirm-region').click()
            root.locator('#edit-modal').wait_for(state='visible')
            assert page.locator('[data-home-hub]').count()==1
            root.locator('#note-text').fill('Q0 合成验收意见（结束后删除）')
            root.locator('#save-annotation').click()
            root.locator('#review-markers .review-pin').first.wait_for()
            root.locator('#open-list').click()
            root.locator('#review-list-title').fill('Q0 合成验收')
            root.locator('#export-filename').fill('q0-synthetic-acceptance.md')
            with page.expect_download() as event:
                root.locator('#download-md').click()
            download=event.value
            assert download.suggested_filename=='q0-synthetic-acceptance.md',download.suggested_filename
            markdown=Path(download.path()).read_text(encoding='utf-8')
            for term in ('Q0 合成验收','Q0 合成验收意见','button','学习首页','选框（视窗比例）'):
                assert term in markdown,(term,markdown[:1000])
            root.locator('#close-list').click()
            page.reload(wait_until='domcontentloaded')
            root=page.locator('#amc8-review-layer')
            root.locator('#open-list').click()
            assert 'Q0 合成验收意见' in root.locator('#review-items').inner_text()
            assert page.evaluate('(k)=>localStorage.getItem(k)!==null',record_key)
            root.locator('#review-list-title').fill('评审清单')
            root.locator('#export-filename').fill('')
            page.on('dialog', lambda dialog: dialog.accept())
            root.locator('.review-note .note-actions button.delete').click()
            root.locator('#close-list').click()
            after=page.evaluate("""() => Object.fromEntries(Object.keys(localStorage).filter(k=>!k.startsWith('tianle_q0_production_review')).map(k=>[k,localStorage.getItem(k)]))""")
            assert before==after,'Reviewing changed learning localStorage state'
            assert root.locator('#toggle-review').get_attribute('aria-pressed')=='false'
            page.locator('[data-home-hub] [data-action="reading"]').click()
            page.locator('.rd-today [data-action=rdStart]').click()
            gloss=page.locator('.rd-vocabulary')
            gloss.wait_for()
            # Compare only rendered Han text, excluding the pinyin layer.
            for term in ('记星星的小本子','图书馆里修书的地方'):
                assert term in gloss.evaluate("(el)=>{const n=el.cloneNode(true);n.querySelectorAll('.rd-pinyin').forEach(e=>e.remove());return n.textContent}")
            page.locator('[data-action=rdReadDone]').click()
            assert page.locator('.rd-text-evidence').is_visible()
            assert gloss.is_visible()
            page.evaluate("async()=>{await window.ReadingUI.openMaterials(['R2-D001-EXTRA'])}")
            assert gloss.is_visible()
            page.evaluate("async()=>{await window.ReadingUI.openMaterials(['R2-D002-CORE'])}")
            assert not gloss.count()
            assert not errors,errors
            print(json.dumps({'status':'PASS','scope':'Q0_FORMAL_ISOLATED','engine':engine,'selectMoveResizeConfirm':True,'dayOneGlossary':True,'button':True,'interception':True,'downloadFilename':download.suggested_filename,'markdownContents':True,'persisted':True,'learningStorageUnchanged':True,'javascriptErrors':errors},ensure_ascii=False))
            browser.close()
    server.shutdown()
