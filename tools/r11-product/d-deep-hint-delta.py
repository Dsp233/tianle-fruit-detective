"""D six-dimensional remaining hint/restore and targeted visual/feedback review; no regrading."""
import os,sys,json,threading,functools,hashlib,subprocess,concurrent.futures
from pathlib import Path
from http.server import SimpleHTTPRequestHandler,ThreadingHTTPServer
from playwright.sync_api import sync_playwright
ROOT=Path(os.environ['D_PRODUCT']);OUT=Path('r11-probe-output');OUT.mkdir(exist_ok=True)
assert subprocess.check_output(['git','-C',str(ROOT),'rev-parse','HEAD'],text=True).strip()=='3f22d8002406857a33a3e254ebafc4366f6cec51'
sys.path.insert(0,str(ROOT/'tools'))
from g1_reading_packets import config,unpack
control=config((ROOT/'qa/index.html').read_text())['math']['scripts'][-1]
assert control['id']=='f12930312b8e007ab222216e6f478d87b24a0856ed7b0e191a98326ce32bec85'
qa=unpack(control,lambda n:(ROOT/n).read_bytes()).decode()
rows=json.loads(Path('tools/r11-product/d-six-dimension-score-delta.json').read_text())['rows'];assert len(rows)==36
class H(SimpleHTTPRequestHandler):
 def log_message(self,*a):pass
srv=ThreadingHTTPServer(('127.0.0.1',0),functools.partial(H,directory=str(ROOT)));threading.Thread(target=srv.serve_forever,daemon=True).start()
URL=f'http://127.0.0.1:{srv.server_port}/index.html#math'
def ready(p):p.wait_for_function("Boolean(window.__AMC8_MATH_NAV)&&typeof progressStore!=='undefined'&&progressStore.getStatus()==='ready'",timeout=45000)
def snapshot(p):
 return p.evaluate("""()=>{let t=playerTask(),w=topicSession()?.items?.[0]?.draft?.work,m=w?.scopes?.main;return {id:t?.id,workId:w?.workId,help:m?.help,feedback:m?.feedback,answerState:m?.answerState,text:document.querySelector('#app').innerText,svgs:[...document.querySelectorAll('#app svg')].filter(x=>x.getClientRects().length).map(x=>({viewBox:x.getAttribute('viewBox'),text:x.textContent,markup:x.outerHTML})),controls:[...document.querySelectorAll('#app [data-action]')].filter(x=>x.getClientRects().length).map(x=>({action:x.dataset.action,text:x.innerText,disabled:!!x.disabled}))}}""")
def shot(p,ident,stage):
 f=OUT/f'{ident}-{stage}.png';p.screenshot(path=str(f),full_page=True);return dict(file=f.name,sha256=hashlib.sha256(f.read_bytes()).hexdigest())
def action(p,a):return p.locator(f'#app [data-action={a}]:visible').first
def run(batch):
 result=[]
 with sync_playwright() as pw:
  b=pw.chromium.launch(headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
  for e in batch:
   x={'id':e['id'],'recipe':e['recipe'],'status':'PARTIAL','errors':[],'hints':[],'wrongDelta':[]}
   ctx=b.new_context(viewport={'width':1024,'height':768});p=ctx.new_page();p.set_default_timeout(6000)
   try:
    p.goto(URL,wait_until='domcontentloaded');ready(p);p.add_script_tag(content=qa);p.wait_for_function('Boolean(window.AMC8_QA)')
    req=e['recipe'];a=p.evaluate('r=>AMC8_QA.loadCase(r,true)',req);assert all(a[k]==v for k,v in req.items()) and a['taskId']==e['id'];ready(p)
    first=snapshot(p);assert first['id']==e['id'];assert e['mainVisible'] in first['text']
    x['before']=first
    # Fresh targeted confirmation only, using unused non-equal options (not inferring misconception from a number).
    if e['id'] in ('COMP-14B2E628','COMP-86E3F8AD'):
     vals=['9','15'] if e['id']=='COMP-14B2E628' else ['8','9']
     for val in vals:
      loc=p.locator('#app [data-action=competitionPick]:visible').filter(has_text=__import__('re').compile('^'+val+'$'))
      assert loc.count()==1
      loc.click();ready(p);action(p,'check').click();ready(p)
      s=snapshot(p);assert s['feedback'] and not s['feedback']['ok'] and s['answerState']!='correct'
      x['wrongDelta'].append({'input':val,'feedback':s['feedback'],'shot':shot(p,e['id'],'wrong-'+val)})
    action(p,'competitionHint').click();ready(p)
    for i in range(12):
     s=snapshot(p);x['hints'].append({'state':s,'shot':shot(p,e['id'],f'hint-{i+1}')})
     nxt=action(p,'competitionHintMore')
     if not nxt.count() or not nxt.is_enabled():break
     previous=(s.get('help') or {}).get('revealedHintIds',[])
     nxt.click();ready(p)
     after=snapshot(p);assert (after.get('help') or {}).get('revealedHintIds',[])!=previous,'hint did not progress'
    else:x['errors'].append('hint progression exceeds 12')
    exposed=(snapshot(p).get('help') or {}).get('revealedHintIds',[])
    assert exposed,'no help exposure recorded'
    # close and reopen existing hints, no new exposure merely from reopening
    close=action(p,'competitionCloseHints')
    if close.count() and close.is_enabled():
     close.click();ready(p);afterClose=snapshot(p);x['close']={'closed':not (afterClose.get('help') or {}).get('open',False),'exposurePreserved':(afterClose.get('help') or {}).get('revealedHintIds',[])==exposed}
     action(p,'competitionHint').click();ready(p);x['reopen']={'exposurePreserved':(snapshot(p).get('help') or {}).get('revealedHintIds',[])==exposed}
    # Inspect actual solution presentation and retained exposure without answering.
    sol=action(p,'competitionShowSolution')
    if sol.count() and sol.is_enabled():
     sol.click();ready(p);s=snapshot(p);x['solution']={'state':s,'shot':shot(p,e['id'],'solution')}
    x['status']='OBSERVED' if not x['errors'] else 'REVIEW'
   except Exception as ex:x['errors'].append(repr(ex))
   finally:ctx.close()
   result.append(x)
  b.close()
 return result
try:
 with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:allrows=[x for chunk in pool.map(run,[rows[i::4] for i in range(4)]) for x in chunk]
 allrows.sort(key=lambda x:x['id'])
 receipt={'base':'3f22d8002406857a33a3e254ebafc4366f6cec51','scope':'36 hint progression/exposure and solution visibility; targeted 4 figure/feedback candidates; no new mathematical credit or full six-dimensional pass','rows':allrows}
 (OUT/'d-deep-hint-delta.json').write_text(json.dumps(receipt,ensure_ascii=False,indent=2))
 for x in allrows:
  first=x['hints'][0]['state'] if x['hints'] else {}
  print('D_HINT_ROW '+json.dumps({'id':x['id'],'recipe':x['recipe'],'status':x['status'],'errors':x['errors'],'hintCount':len(x['hints']),'firstHintText':first.get('text',''),'firstHintShot':x['hints'][0]['shot'] if x['hints'] else None,'close':x.get('close'),'reopen':x.get('reopen'),'solutionSeen':(x.get('solution',{}).get('state',{}).get('help') or {}).get('solutionSeen'),'wrongDelta':x['wrongDelta']},ensure_ascii=False),flush=True)
finally:srv.shutdown()
