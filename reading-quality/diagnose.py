"""Reproduce the supplied D02 counterexample on the actual packaged runtime."""
import json, os
from pathlib import Path
from playwright.sync_api import sync_playwright
out=Path(__file__).parent/'evidence';out.mkdir(exist_ok=True)
measure=r'''() => {const box=document.querySelector('.rd-text-evidence .rd-story-text');const rs=[...box.querySelectorAll('ruby')];const cs=rs.map(r=>({text:r.querySelector('rb').textContent, x:r.getBoundingClientRect().x,y:r.querySelector('rb').getBoundingClientRect().y,w:r.getBoundingClientRect().width}));let splits=[];for(const word of ['分别','登记册','观察簿','封面','管理员','展览','编号','温室','记录','小禾','天乐']){const text=cs.map(c=>c.text).join('');for(let i=text.indexOf(word);i>=0;i=text.indexOf(word,i+1)){if(new Set(cs.slice(i,i+word.length).map(c=>Math.round(c.y))).size>1)splits.push(word);}}const s=getComputedStyle(rs[0]);return {width:innerWidth,splitWords:splits,rubyCount:rs.length,meanCellWidth:cs.reduce((s,c)=>s+c.w,0)/cs.length,overflow:document.documentElement.scrollWidth>innerWidth,style:{display:s.display,minWidth:s.minWidth,padding:s.padding,margin:s.margin},height:box.getBoundingClientRect().height};}'''
with sync_playwright() as p:
 b=p.chromium.launch(executable_path=os.getenv('CHROMIUM_PATH'),args=['--no-sandbox'])
 results=[]
 for width in [320,375,390,414,768]:
  page=b.new_page(viewport={'width':width,'height':844});page.goto(os.getenv('BASELINE_URL','http://127.0.0.1:4174/'));page.locator('[data-home-hub] [data-action=reading]').click();page.wait_for_function('window.__AMC8_ReadingRuntime')
  page.evaluate("() => {const r=window.__AMC8_ReadingRuntime;r.handle('rdStart',{day:'2'});r.handle('rdReadDone');}")
  page.locator('.rd-text-evidence').wait_for()
  for name,css in [('baseline','/* baseline */'),('cell-spacing-only','.rd-char{min-width:0;margin:0;padding:0}'),('wrap-only','.rd-story-text{overflow-wrap:normal}'),('font-only','.rd-story-text{font-size:22px!important;line-height:1.9}')]:
   style=page.add_style_tag(content=css);r=page.evaluate(measure);r['experiment']=name;results.append(r)
   if name=='baseline' and width in [375,390]:page.locator('.rd-text-evidence').screenshot(path=str(out/f'before-{width}.png'))
   style.evaluate('(e)=>e.remove()')
  page.close()
 b.close()
(out/'baseline-ab.json').write_text(json.dumps(results,ensure_ascii=False,indent=2)+'\n')
print(json.dumps(results,ensure_ascii=False))
