"""Real Chromium/WebKit. Synthetic profiles only, no existing learner storage."""
import json,os,sys,time
from pathlib import Path
from playwright.sync_api import sync_playwright
OUT=Path(os.getenv('READING_EVIDENCE_DIR',Path(__file__).parent/'evidence'));OUT.mkdir(parents=True,exist_ok=True)
PUBLIC='--public' in sys.argv
JOINT='--joint' in sys.argv
IDENTITY='reading-art/release.json' if JOINT else 'reading-quality-identity.json'
URL=os.environ.get('READING_PUBLIC') if PUBLIC else 'http://127.0.0.1:4173/'
BASE='http://127.0.0.1:4174/'
KEY='tianle_amc8_question_design_v1_reading_r1'
results=[]
def boot(browser,url,seed=None,synthetic_voice=False):
 ctx=browser.new_context(viewport={'width':390,'height':844})
 if seed:ctx.add_init_script('if(!sessionStorage.getItem("reading-quality-seeded")){for(const [k,v] of Object.entries('+json.dumps(seed)+'))localStorage.setItem(k,v);sessionStorage.setItem("reading-quality-seeded","1");}')
 if synthetic_voice:
  ctx.add_init_script("""
    window.__w1Spoken = [];
    Object.defineProperty(window, 'SpeechSynthesisUtterance', {value: class {constructor(text){this.text=text;}}, configurable:true});
    Object.defineProperty(window, 'speechSynthesis', {value:{
      getVoices:()=>[{name:'Synthetic Mandarin',lang:'zh-CN',localService:true,default:true}],
      speak(u){window.__w1Spoken.push([u.text,u.lang]);queueMicrotask(()=>{u.onstart?.();u.onend?.();});},
      cancel(){}, addEventListener(){}, removeEventListener(){}
    }, configurable:true});
  """)
 page=ctx.new_page();page.set_default_timeout(20000);page.goto(url,wait_until='domcontentloaded')
 page.locator('[data-home-hub] [data-action=reading]').click();page.wait_for_function('window.__AMC8_ReadingRuntime && window.__AMC8_ReadingRuntime.engine()')
 page.wait_for_function("window.__AMC8_ReadingRuntime.engine().status().status==='ready'")
 return ctx,page
def saved(page):
 page.wait_for_function("window.__AMC8_ReadingRuntime.engine().status().status==='ready'")
 return page.evaluate('() => Object.fromEntries(Object.keys(localStorage).map(k=>[k,localStorage.getItem(k)]))')
measure=r'''({text,mode})=>{
 const r=window.__AMC8_ReadingRuntime,box=document.querySelector('.rd-text-evidence .rd-story-text');box.innerHTML=r.rt(text,{clickable:true,mode,focus:['分别','登记册']});
 const cells=[...box.querySelectorAll('.rd-char')], errors=[];
 const expected=Array.from(text).map((c,i)=>/[\u3400-\u9fff]/u.test(c)?[c,i]:null).filter(Boolean);
 if(cells.length!==expected.length)errors.push('missing-chars');
 let gap=0,prior=null,hidden=0;
 cells.forEach((el,i)=>{const rb=el.querySelector('.rd-base'),rt=el.querySelector('.rd-pinyin'),a=rb.getBoundingClientRect(),b=rt.getBoundingClientRect();
  if(rb.textContent!==expected[i][0]||+el.dataset.rdIndex!==expected[i][1])errors.push('char-offset');
  if(rt.textContent&&prior&&Math.abs(b.y-prior.y)<2&&b.x<prior.right-.5)errors.push('pinyin-overlap');
  if(rt.textContent)prior=b;else hidden++;
 });
 const container=box.getBoundingClientRect();
 for(const e of box.querySelectorAll('.rd-word')){const b=e.getBoundingClientRect();if(b.right>container.right+1)errors.push('unit-overflow');}
 const points=[];const walker=document.createTreeWalker(box,NodeFilter.SHOW_TEXT);let n;
 while(n=walker.nextNode()){if(n.parentElement.closest('.rd-pinyin'))continue;for(let i=0;i<n.length;i++){const range=document.createRange();range.setStart(n,i);range.setEnd(n,i+1);const a=range.getBoundingClientRect();points.push({c:n.data[i],y:a.y,x:a.x,right:a.right});}}
 // Chinese prohibited line starters, ignoring indentation and whitespace.
 let previous=null;for(const a of points){if(!a.c.trim())continue;if(previous&&a.y>previous.y+8&&/^[，。！？；：、）】》」』”’]$/.test(a.c))errors.push('punctuation-start');previous=a;}
 if(points.map(p=>p.c).join('')!==text)errors.push('text-order');
 const han=points.filter(x=>/[\u3400-\u9fff]/u.test(x.c));const ht=han.map(x=>x.c).join('');
 for(const word of ['分别','登记册','观察簿','管理员','温室','小禾','天乐'])for(let p=ht.indexOf(word);p>=0;p=ht.indexOf(word,p+1)){if(new Set(han.slice(p,p+word.length).map(x=>Math.round(x.y))).size>1)errors.push('split:'+word);}
 if(mode==='all'&&hidden)errors.push('missing-pinyin');if(mode==='none'&&cells.some(e=>getComputedStyle(e.querySelector('.rd-pinyin')).display!=='none'))errors.push('none-visible');
 return {errors:[...new Set(errors)],chars:cells.length,mode,docOverflow:document.documentElement.scrollWidth>innerWidth+1};}'''

def joint_scenes(page, name):
 days=(1,2,12,20,38,47,49,50,60,61,69,84)
 risk=(2,20,47,61)
 cases=[(d,w,m) for d in days for w in (320,390) for m in ('all','none')]
 cases += [(d,w,m) for d in risk for w in (375,414,768) for m in ('focus','demand')]
 receipts=[]
 for day,width,mode in cases:
  page.set_viewport_size({'width':width,'height':844})
  expected=page.evaluate("""async ([day,mode])=>{
   const r=window.__AMC8_ReadingRuntime,id='R2-D'+String(day).padStart(3,'0')+'-CORE';
   await r.openMaterials([id]);r.engine().setting('pinyin',mode);
   r.handle('rdPanelAll');
   return r.engine().current().material.panels.map(p=>p.text);
  }""",[day,mode])
  rendered=page.evaluate(r"""(mode)=>[...document.querySelectorAll('.rd-panel .rd-story-text')].map(box=>{
   const chars=[...box.querySelectorAll('.rd-char')], errors=[];
   const pins=chars.map(x=>x.querySelector('.rd-pinyin'));
   let prior=null;
   if(mode==='all'&&pins.some(x=>!x.textContent))errors.push('missing-pinyin');
   if((mode==='none'||mode==='demand')&&pins.some(x=>x.textContent))errors.push('unexpected-pinyin');
   const right=box.getBoundingClientRect().right;
   for(const word of box.querySelectorAll('.rd-word')){
    if(word.dataset.pinyinMode!==mode)errors.push('wrong-mode');
    if(word.getBoundingClientRect().right>right+1)errors.push('overflow');
   }
   for(const pin of pins){
    if(!pin.textContent)continue;
    const b=pin.getBoundingClientRect();
    if(prior&&Math.abs(b.y-prior.y)<2&&b.x<prior.right-.5)errors.push('overlap');
    prior=b;
   }
   const text=box.cloneNode(true);
   text.querySelectorAll('.rd-pinyin').forEach(n=>n.remove());
   const walker=document.createTreeWalker(box,NodeFilter.SHOW_TEXT);let node,prev;
   while(node=walker.nextNode()){
    if(node.parentElement.closest('.rd-pinyin'))continue;
    for(let i=0;i<node.length;i++){
     const c=node.data[i];if(!c.trim())continue;
     const range=document.createRange();range.setStart(node,i);range.setEnd(node,i+1);
     const a=range.getBoundingClientRect();
     if(prev&&a.y>prev.y+8&&/^[，。！？；：、）】》」』”’]$/u.test(c))errors.push('punctuation-start');
     prev=a;
    }
   }
   const han=chars.map(x=>[x.querySelector('.rd-base').textContent,
      Math.round(x.querySelector('.rd-base').getBoundingClientRect().y)]);
   const joined=han.map(x=>x[0]).join('');
   for(const word of ['分别','登记册','观察簿','管理员','温室','小禾','天乐']){
    for(let p=joined.indexOf(word);p>=0;p=joined.indexOf(word,p+1)){
     if(new Set(han.slice(p,p+word.length).map(x=>x[1])).size>1)errors.push('split:'+word);
    }
   }
   return {text:text.textContent,errors:[...new Set(errors)]};
  })""",mode)
  assert [p['text'] for p in rendered]==expected,(name,day,width,mode)
  assert not any(p['errors'] for p in rendered),(name,day,width,mode,[p['errors'] for p in rendered])
  receipts.append({'day':day,'width':width,'mode':mode,'panels':len(rendered)})
 for day in (2,47,61):
  page.set_viewport_size({'width':390,'height':844})
  page.evaluate("""async day=>{ const r=window.__AMC8_ReadingRuntime;await r.openMaterials(['R2-D'+String(day).padStart(3,'0')+'-CORE']);r.engine().setting('pinyin','all');r.handle('rdPanelAll'); }""",day)
  page.locator('.rd-comic-grid').screenshot(path=str(OUT/f'joint-{name}-d{day}{"-public" if PUBLIC else ""}.png'))
 (OUT/f'joint-layout-{name}{"-public" if PUBLIC else ""}.json').write_text(json.dumps(receipts,indent=2)+'\n')
 return len(receipts)

def joint_learning_flow(browser, url):
 context,page=boot(browser,url,synthetic_voice=True)
 try:
  start=page.locator('.rd-today [data-action=rdStart]')
  start.click()
  expected=page.evaluate("()=>window.__AMC8_ReadingRuntime.engine().current().material.panels[0].text")
  page.locator('[data-action=rdSpeakSentence]').first.click()
  page.wait_for_function("expected=>window.__w1Spoken.map(x=>x[0]).join('')===expected",arg=expected)
  assert page.evaluate("()=>window.__w1Spoken.every(x=>x[1]==='zh-CN')")
  page.locator('[data-action=rdPanelNext]').click()
  assert page.locator('.rd-panel-number').inner_text()=='2/3'
  page.locator('[data-action=rdPanelPrev]').click()
  page.locator('[data-action=rdReadDone]').click()
  page.locator('.rd-options [data-action=rdPick][data-index="1"]').click()
  page.locator('[data-action=rdSubmit]').click()
  a=json.loads(saved(page)[KEY])
  first=next(e for e in a['events'] if e['type']=='attempt' and e['questionId']=='R2-S01-1')
  assert first['first'] and not first['correct']
  page.locator('.rd-options [data-action=rdPick][data-index="0"]').click()
  page.locator('[data-action=rdSubmit]').click()
  retry=json.loads(saved(page)[KEY])
  assert first in retry['events']
  assert any(e['type']=='attempt' and e['questionId']=='R2-S01-1' and e['correct'] and not e['first'] for e in retry['events'])
  page.reload(wait_until='domcontentloaded')
  page.wait_for_function("key=>JSON.parse(localStorage.getItem(key)).events.length>=2",arg=KEY)
  assert first in page.evaluate("key=>JSON.parse(localStorage.getItem(key)).events",KEY)
 finally:
  context.close()

with sync_playwright() as p:
 for name in ['chromium','webkit']:
  browser=getattr(p,name).launch()
  ctx,page=boot(browser,URL);errs=[];page.on('pageerror',lambda e:errs.append(str(e)))
  page.evaluate("()=>{const r=window.__AMC8_ReadingRuntime;r.handle('rdStart',{day:'2'});r.handle('rdReadDone');}")
  page.locator('.rd-text-evidence').wait_for()
  actual=page.evaluate("()=>({hash:window.__AMC8_READING_DATA.contentHash,paragraphs:document.querySelectorAll('.rd-text-evidence .rd-paragraph').length})")
  assert actual['hash']==json.loads(Path(IDENTITY).read_text())['contentHash'];assert actual['paragraphs']==3
  for width in [375,390]:
   page.set_viewport_size({'width':width,'height':844});page.locator('.rd-text-evidence').screenshot(path=str(OUT/f'{"public" if PUBLIC else "after"}-{name}-{width}.png'))
  # UI pinyin toggle persists, and character actions retain original passage offset.
  page.locator('[data-action=rdPinyin]').click();assert page.locator('.rd-text-evidence .rd-pinyin').first.inner_text()==''
  page.wait_for_function("window.__AMC8_ReadingRuntime.engine().status().status==='ready'")
  page.locator('.rd-text-evidence [data-action=rdChar] .rd-base').nth(5).click()
  click_ok=page.evaluate("()=>window.__AMC8_ReadingRuntime.snapshot().events.some(e=>e.type==='aid_requested'&&e.kind==='pinyin')")
  if not click_ok:
   debug=page.locator('.rd-text-evidence [data-action=rdChar]').nth(5).evaluate("e=>({html:e.outerHTML,dataset:{...e.dataset},hit:document.elementFromPoint(e.getBoundingClientRect().x+e.getBoundingClientRect().width/2,e.getBoundingClientRect().y+e.getBoundingClientRect().height/2)?.outerHTML})")
   debug['before']=page.evaluate("()=>window.__AMC8_ReadingRuntime.snapshot().events.slice(-4)")
   page.locator('.rd-text-evidence [data-action=rdChar]').nth(5).press('Enter')
   debug['afterKeyboard']=page.evaluate("()=>window.__AMC8_ReadingRuntime.snapshot().events.slice(-6)")
   print('CHARACTER_DEBUG',json.dumps(debug,ensure_ascii=False),flush=True)

  page.locator('[data-action=rdPinyin]').click()
  before_keyboard=page.evaluate("()=>window.__AMC8_ReadingRuntime.snapshot().events.filter(e=>e.type==='aid_requested'&&e.kind==='pinyin').length")
  page.locator('.rd-text-evidence [data-action=rdChar]').nth(8).press('Enter')
  assert page.evaluate("()=>window.__AMC8_ReadingRuntime.snapshot().events.filter(e=>e.type==='aid_requested'&&e.kind==='pinyin').length")>before_keyboard
  aligned=page.evaluate(r"""()=>{const box=document.querySelector('.rd-text-evidence .rd-story-text');box.innerHTML=window.__AMC8_ReadingRuntime.rt('册，47号。',{mode:'all'});const w=document.createTreeWalker(box,NodeFilter.SHOW_TEXT),p=[];let n;while(n=w.nextNode()){if(n.parentElement.closest('.rd-pinyin'))continue;for(let i=0;i<n.length;i++){const r=document.createRange();r.setStart(n,i);r.setEnd(n,i+1);const a=r.getBoundingClientRect();p.push({c:n.data[i],y:a.y,bottom:a.bottom});}}return p;}""")
  assert max(x['bottom'] for x in aligned)-min(x['bottom'] for x in aligned)<5,aligned
  # The legacy layout harness measures all archived paragraphs in one page.
  page.evaluate("""async () => {
   const r=window.__AMC8_ReadingRuntime;
   const weeks=new Map(window.__AMC8_READING_DATA.materials.filter(m=>m.courseId==='R2-84D-20261031'&&m.text===null).map(m=>[m.week,m.id]));
   if(weeks.size){for(const id of weeks.values())await r.openMaterials([id]);await r.openMaterials(['R2-D002-CORE']);r.handle('rdReadDone');}
  }""")
  stories=page.evaluate("()=>window.__AMC8_READING_DATA.materials.filter(m=>m.courseId==='R2-84D-20261031'&&m.id.endsWith('-CORE')).map(m=>({day:m.day,text:m.text}))")
  assert len(stories)==84
  failures=[];count=0
  for width in ([375,390] if PUBLIC or JOINT else [320,375,390,414,768]):
   page.set_viewport_size({'width':width,'height':844})
   for mode in (['all','none'] if PUBLIC else ['all','focus','demand','none']):
    for story in stories:
     r=page.evaluate(measure,{'text':story['text'],'mode':mode});count+=1
     if r['errors'] or r['docOverflow']:failures.append({'day':story['day'],'width':width,**r})
  (OUT/f'layout-{name}{"-public" if PUBLIC else ""}.json').write_text(json.dumps({'cases':count,'failures':failures},ensure_ascii=False,indent=2)+'\n')
  assert not failures,failures[:8]
  assert click_ok, 'Character mouse click failed (see CHARACTER_DEBUG)'
  assert not errs,errs
  ctx.close()
  if JOINT:
   ctx,page=boot(browser,URL)
   try: visible=joint_scenes(page,name)
   finally:ctx.close()
   joint_learning_flow(browser,URL)
   results.append({'browser':name,'visibleCases':visible,'syntheticMandarinAndFirstAttempt':'PASS'})
  # Real old-page write -> exact raw injection into fresh candidate profile -> reload/rollback.
  if not PUBLIC:
   for day in ([12,24] if JOINT else [2,12]):
    c,old=boot(browser,BASE)
    old.evaluate('''day=>{const e=window.__AMC8_ReadingRuntime.engine();e.startDay(13);for(let n=0;n<10&&e.current();n++){e.markReadDone();e.submit(e.current().question.answer);e.next();}e.startDay(day);e.markReadDone();e.select(0);e.submit(0);e.select(1);}''',day)
    old_completed=old.evaluate('()=>window.__AMC8_ReadingRuntime.report().completedDays');assert old_completed==1
    seed=saved(old);assert KEY in seed,list(seed)
    original=json.loads(seed[KEY]);assert any(e['type']=='attempt' for e in original['events']);c.close()
    seed['reading-quality-unrelated-sentinel']='unchanged'
    c,new=boot(browser,URL,seed);upgraded=saved(new);state=json.loads(upgraded[KEY])
    assert any(v==seed[KEY] for k,v in upgraded.items() if k.startswith(KEY+'_backup_before_content_')),'missing exact raw backup'
    for e in original['events']:assert e in state['events'],'lost/rewritten original event'
    assert upgraded['reading-quality-unrelated-sentinel']=='unchanged'
    assert new.evaluate('()=>window.__AMC8_ReadingRuntime.report().completedDays')==old_completed
    affected=day==(12 if JOINT else 2)
    if affected:
     assert state['session'] is None
     assert any(original['session'] in x.get('sessions',[]) for x in state['legacy']),'missing archived draft'
    else:
     assert state['session']['id']==original['session']['id'];assert state['session']['drafts']==original['session']['drafts']
    new.reload();new.wait_for_function('window.__AMC8_ReadingRuntime');again=saved(new)
    againstate=json.loads(again[KEY])
    assert all(e in againstate['events'] for e in state['events']),{'before':state['events'],'after':againstate['events']}
    assert sum(e['type']=='content_upgrade' for e in againstate['events'])==sum(e['type']=='content_upgrade' for e in state['events']),'Upgrade repeated on reload'
    c.close()
    c,rolled=boot(browser,BASE,again);back=saved(rolled);backstate=json.loads(back[KEY])
    assert all(e in backstate['events'] for e in state['events']);assert any(v==again[KEY] for k,v in back.items() if k.startswith(KEY+'_backup_before_content_'))
    c.close();results.append({'browser':name,'day':day,'upgrade':'PASS','rollback':'PASS','eventsPreserved':len(original['events']),'completedDaysPreserved':old_completed,'draft':'archived with exact original' if affected else 'preserved'})
   # Simulate full storage at the exact pre-upgrade backup boundary. Real engine, deterministic storage adapter.
   c,q=boot(browser,URL)
   fail=q.evaluate('''old=>{const map=new Map(Object.entries(old));const raw=map.get('tianle_amc8_question_design_v1_reading_r1');window.__AMC8_STORAGE_TEST=true;
    const e=ReadingEngine.create(window.__AMC8_READING_DATA,{getItem:k=>map.has(k)?map.get(k):null,setItem(){throw Error('QuotaExceededError')}},'tianle_amc8_question_design_v1_reading_r1');
    const result={status:e.status().status,persist:e.persist(),same:map.get('tianle_amc8_question_design_v1_reading_r1')===raw};delete window.__AMC8_STORAGE_TEST;return result;}''',seed)
   assert fail=={'status':'read_only','persist':False,'same':True},fail;c.close()
   results.append({'browser':name,'quotaFailClosed':'PASS'})
  results.append({'browser':name,'layoutCases':count,'mixedScriptBaseline':aligned,'runtimeErrors':errs,'contentHash':actual['hash'],'realDevice':'DEFERRED'})
  browser.close()
(OUT/('public-browser.json' if PUBLIC else 'browser-checks.json')).write_text(json.dumps(results,ensure_ascii=False,indent=2)+'\n');print(json.dumps(results,ensure_ascii=False))
