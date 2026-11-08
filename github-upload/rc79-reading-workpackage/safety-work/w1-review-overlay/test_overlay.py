from pathlib import Path
from playwright.sync_api import sync_playwright
import json
ROOT=Path(__file__).parent
js=(ROOT/'review-overlay.js').read_text()
css=(ROOT/'review-overlay.css').read_text()
fixture='''<!doctype html><html lang="zh-CN"><head><base href="https://example.test/"><title>W1 预览首页</title><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="font:16px system-ui;padding:15px"><h1>数学侦探</h1><section class="card" id="question-card" data-question-id="Q01"><h2>第1天阅读训练</h2><button id="next" data-action="next" style="padding:20px">下一页</button><p id="bodytxt">这是卡片内容。</p></section></body></html>'''
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
 page=browser.new_page(viewport={'width':390,'height':844},device_scale_factor=1,is_mobile=True,has_touch=True,accept_downloads=True)
 page.set_default_timeout(4000)
 errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 page.route('**/review-overlay.css',lambda route:route.fulfill(status=200,body=css,content_type='text/css'))
 page.set_content(fixture)
 page.evaluate('''() => {const mem = new Map(); Object.defineProperty(window,'localStorage',{configurable:true,value:{getItem:k=>mem.has(k)?mem.get(k):null,setItem:(k,v)=>mem.set(k,String(v)),removeItem:k=>mem.delete(k),key:i=>Array.from(mem.keys())[i]||null,get length(){return mem.size;}}});window.__NAV_COUNTER=0;document.getElementById('next').addEventListener('click',()=>window.__NAV_COUNTER++)}''')
 page.add_script_tag(content=js)
 page.evaluate('''(css)=>{let s=document.createElement('style');s.textContent=css;document.getElementById('amc8-review-layer').shadowRoot.append(s)}''',css)
 root=page.locator('#amc8-review-layer')
 toggle=root.locator('#toggle-review');assert toggle.count()==1,errors
 assert page.evaluate('window.__NAV_COUNTER')==0
 # normal click works before reviewing
 page.locator('#next').click();assert page.evaluate('window.__NAV_COUNTER')==1
 toggle.click();assert toggle.get_attribute('aria-pressed')=='true'
 # The app click must not fire while review on; annotator opens instead
 page.locator('#next').click(force=True)
 page.wait_for_timeout(200)
 print('modal-while-review',root.locator('#edit-modal').is_visible(), 'nav-counter',page.evaluate('window.__NAV_COUNTER'),'errors',errors)
 assert root.locator('#edit-modal').is_visible(), 'Review click should launch note editor'
 assert page.evaluate('window.__NAV_COUNTER')==1,'Review click must not navigate'
 root.locator('#note-category').select_option(label='内容')
 root.locator('#note-text').fill('这条说明应该更清楚')
 root.locator('#note-reporter').fill('测试员')
 root.locator('#save-annotation').click()
 assert root.locator('#review-markers .review-pin').count()==1
 assert root.locator('#review-markers .review-pin').inner_text()=='1'
 # hide and unhide
 root.locator('#open-list').click()
 root.locator('#review-version').fill('W1-RC-QA-V2')
 root.locator('#review-date').fill('2026-11-08')
 root.locator('#toggle-markers').click()
 assert root.locator('#review-markers .review-pin').count()==0
 assert root.locator('#export-filename').inner_text()=='W1-RC-QA-V2_评审清单_2026-11-08.md'
 with page.expect_download() as actual_download:
  root.locator('#download-md').click()
 assert actual_download.value.suggested_filename=='W1-RC-QA-V2_评审清单_2026-11-08.md'
 assert root.locator('#edit-modal').is_hidden(),'Markdown export must not open an annotation editor'
 root.locator('#close-list').click()
 # mark can reappear after leaving review
 root.locator('#open-list').click()
 root.locator('#toggle-markers').click()
 root.locator('#close-list').click()
 assert root.locator('#review-markers .review-pin').count()==1
 # review off => app button works again
 toggle.click();assert toggle.get_attribute('aria-pressed')=='false'
 page.locator('#next').click(force=True);assert page.evaluate('window.__NAV_COUNTER')==2
 # refresh layer script in same page should reload notes
 page.evaluate('''() => {document.getElementById('amc8-review-layer').remove(); window.__AMC8_REVIEW_OVERLAY_LOADED__=false}''')
 page.add_script_tag(content=js)
 page.evaluate('''(css)=>{let s=document.createElement('style');s.textContent=css;document.getElementById('amc8-review-layer').shadowRoot.append(s)}''',css)
 assert page.locator('#amc8-review-layer').locator('#review-markers .review-pin').count()==1
 page.screenshot(path=str(ROOT/'mobile-test.png'))
 print(json.dumps({'status':'PASS','app_click_normal':True,'app_click_blocked_in_review':True,'edit':True,'marker':True,'hide':True,'export_version_date':True,'restore':True,'errors':errors},ensure_ascii=False))
 browser.close()
