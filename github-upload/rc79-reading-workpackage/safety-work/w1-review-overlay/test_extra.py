from pathlib import Path
from playwright.sync_api import sync_playwright
import json
js=(Path(__file__).parent/'review-overlay.js').read_text()
css=(Path(__file__).parent/'review-overlay.css').read_text()
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--disable-dev-shm-usage']);page=b.new_page(viewport={'width':390,'height':844},accept_downloads=True,is_mobile=True,has_touch=True)
 page.set_default_timeout(3000)
 errs=[];page.on('pageerror',lambda x:errs.append(str(x)))
 page.set_content('<html><head><meta name="viewport" content="width=device-width, initial-scale=1"><base href="https://example.test/"><title>评审测试</title></head><body><h1>阅读第1天</h1><section class="card" data-question-id="R2-S01-1"><h2>第1题</h2><button id="c" data-action="answer">A 选项</button></section></body></html>')
 page.evaluate('''() => {let mem=new Map();Object.defineProperty(window,'localStorage',{configurable:true,value:{getItem:k=>mem.get(k)||null,setItem:(k,v)=>mem.set(k,String(v))}});window.__CLICKED=0;document.getElementById('c').addEventListener('click',()=>window.__CLICKED++)}''')
 page.add_script_tag(content=js)
 page.evaluate('(s)=>{let el=document.createElement("style");el.textContent=s;document.getElementById("amc8-review-layer").shadowRoot.append(el)}',css)
 root=page.locator('#amc8-review-layer')
 print('toggle',flush=True);root.locator('#toggle-review').click()
 print('select target',flush=True);page.locator('#c').click(force=True)
 root.locator('#note-text').fill('按钮文字应更易理解')
 root.locator('#note-reporter').fill('Alice')
 root.locator('#save-annotation').click();print('saved',flush=True)
 pin=root.locator('#review-markers .review-pin')
 assert pin.count()==1
 print('open pin',flush=True);pin.click()
 assert root.locator('#note-text').input_value()=='按钮文字应更易理解'
 root.locator('#note-text').fill('改成“选择这个答案”')
 root.locator('#save-annotation').click();print('edited',flush=True)
 root.locator('#open-list').click()
 print('processed',flush=True);root.locator('.review-note .note-actions button').nth(1).click()
 assert '已处理' in root.locator('.review-note').inner_text()
 root.locator('#review-version').fill('W1-RC-2026-11-08')
 root.locator('#review-date').fill('2026-11-08')
 print('download start',flush=True)
 page.evaluate('''()=>{URL.createObjectURL=(b)=>{window.__testBlob=b;return 'blob:test'};HTMLAnchorElement.prototype.click=function(){window.__testFile=this.download}}''')
 root.locator('#download-md').click()
 file_name=page.evaluate('window.__testFile')
 content=page.evaluate('window.__testBlob.text()')
 for term in ['W1-RC-2026-11-08','2026-11-08','改成“选择这个答案”','Alice','已处理','data-question-id','R2-S01-1']:
  assert term in content,term
 assert page.evaluate('window.__CLICKED')==0
 assert errs==[],errs
 print(json.dumps({'status':'PASS','editPin':True,'processed':True,'downloadMd':file_name,'includesCardAndSelector':True,'runtimeClickBlocked':True,'javascriptErrors':errs},ensure_ascii=False))
 b.close()
