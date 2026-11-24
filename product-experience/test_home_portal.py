from pathlib import Path
from playwright.sync_api import sync_playwright
import json, os, hashlib, base64, io
from PIL import Image
root=Path(__file__).resolve().parent.parent/'canonical/w1/source'
new_js=(root/'home_portal.js').read_text();new_css=(root/'home_portal.css').read_text()
old_js=new_js.replace('和熊猫一起找线索、想办法。<br>读懂故事，解开数学谜题。','读懂一个故事，解开一个谜题。<br>和熊猫一起，慢慢想，试着做。').replace('<button type="button" class="dojo-path','<button class="dojo-path').replace('读故事 · 找线索 · 说理由','读故事 · 看拼音 · 想一想').replace('用学过的知识，挑战新谜题','选已学知识，挑战新题').replace('先自己想一想，遇到难题再找提示。','不着急，比昨天多想一步，就很好。')
old_css=new_css.split('\n/* P-03:')[0]
def blob_sha(s):
 b=s.encode();return hashlib.sha1(f'blob {len(b)}\0'.encode()+b).hexdigest()
assert blob_sha(old_js)=='3319ec0f07eda0fabf34fafac5317ccdf7fda86d'
assert blob_sha(old_css)=='29aa707fd0bb0c7c172c5291ec05840a47e73a4c'
# Local fixture only; use a synthetic 960x640 WebP in place of the private artwork.
im=Image.new('RGB',(960,640),(200,222,200));buf=io.BytesIO();im.save(buf,format='WEBP');art=base64.b64encode(buf.getvalue()).decode()
rows=[]
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path=os.environ.get('CHROMIUM_BIN'),args=['--no-sandbox'])
 for w,h in [(320,568),(375,667),(390,844),(700,800),(768,1024),(1024,768),(844,390),(667,375)]:
  for mode,js,css in [('baseline',old_js,old_css),('candidate',new_js,new_css)]:
   page=browser.new_page(viewport={'width':w,'height':h},reduced_motion='reduce')
   errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
   page.set_content('<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>*{box-sizing:border-box}body{margin:0;font:16px sans-serif}header{height:64px}main{max-width:1120px;margin:auto;padding:0 12px}'+css+'</style><header></header><main id="root"></main><script>'+js.replace('__AMC8_HOME_PANDA_BASE64__',art)+'</script><script>root.innerHTML=LearningPortal.page();window.actions=[];root.addEventListener("click",e=>{const button=e.target.closest("[data-action]");if(button)actions.push(button.dataset.action)});</script>')
   boxes=page.locator('.dojo-path').evaluate_all('(nodes)=>nodes.map(n=>{let b=n.getBoundingClientRect();return {x:b.x,y:b.y,width:b.width,height:b.height,bottom:b.bottom,scrollWidth:n.scrollWidth,clientWidth:n.clientWidth}})')
   assert len(boxes)==2
   if mode=='candidate':
    assert all(b['x']>=0 and b['x']+b['width']<=w and b['width']>=44 and b['height']>=44 and b['scrollWidth']<=b['clientWidth']+1 for b in boxes), (w,h,boxes)
    assert max(b['bottom'] for b in boxes)<=h,(w,h,boxes)
   page.get_by_role('button',name='进入阅读训练').click();page.get_by_role('button',name='进入数学侦探').focus();page.keyboard.press('Enter');assert page.evaluate('actions')==['reading','home'];assert not errors,errors
   rows.append({'size':f'{w}x{h}','mode':mode,'entryTop':round(boxes[0]['y'],1),'entryBottom':round(max(b['bottom'] for b in boxes),1),'bothVisible':max(b['bottom'] for b in boxes)<=h,'actions':'PASS (fixture delegation only)'})
   page.close()
 browser.close()
print(json.dumps({'browser':'Chromium local component fixture; synthetic artwork, not full app','results':rows},ensure_ascii=False,indent=2))
