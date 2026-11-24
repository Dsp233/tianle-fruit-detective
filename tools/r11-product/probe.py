#!/usr/bin/env python3
"""R1.1 A/B engineering probe. Reuse legacy QA controls over frozen production bytes.
Never writes a production page, real learner profile, or queue. D targeted follow-up; execution success is not acceptance signoff."""
import argparse, functools, hashlib, json, re, subprocess, sys, threading
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT=Path(__file__).resolve().parents[2]
sys.path.insert(0,str(ROOT/'tools'))
from g1_reading_packets import config, unpack, sha
BASE='72f2f229246af362f9024db217479357890c8cd3'
SKILLS=['A02.02','L02.02','G04.06','G05.03','C04.05','D03.01']
CASES=[
 dict(familyId='threeGroupBalance',configuration='change-goal',seed=2147483647,generatorRevision=4),
 dict(familyId='signedProduct',configuration='signedProduct',seed=2,generatorRevision=3)
]
def main():
 ap=argparse.ArgumentParser()
 ap.add_argument('--out',type=Path,default=Path('r11-probe-output'))
 ap.add_argument('--cases',type=Path)
 args=ap.parse_args(); args.out.mkdir(exist_ok=True,parents=True)
 html=(ROOT/'index.html').read_bytes()
 assert html==subprocess.check_output(['git','show',BASE+':index.html'],cwd=ROOT)
 cfg=config(html.decode()); legacy=config((ROOT/'qa/index.html').read_text())
 control=legacy['math']['scripts'][-1]
 assert control['id']=='f12930312b8e007ab222216e6f478d87b24a0856ed7b0e191a98326ce32bec85'
 qa=unpack(control,lambda n:(ROOT/n).read_bytes()).decode()
 assert 'window.AMC8_QA=' in qa
 # Keep the production HTML, scripts and packets byte-for-byte. The synthetic
 # localhost origin and a fresh browser context isolate every storage API.
 report=dict(base=BASE,entrySha256=sha(html),store=cfg['store'],
             mathScriptIds=[x['id'] for x in cfg['math']['scripts']],
             qaControlId=control['id'],scope='D_TARGETED_ATTEMPT_WITH_AB_REUSE',cases=[],skills=[],errors=[])
 for channel in ('math','reading'):
  for kind in ('data','optionalData','scripts'):
   for row in cfg[channel].get(kind,[]): unpack(row,lambda n:(ROOT/n).read_bytes())
 class Handler(SimpleHTTPRequestHandler):
  def log_message(self,*a): pass
 server=ThreadingHTTPServer(('127.0.0.1',0),functools.partial(Handler,directory=str(ROOT)))
 threading.Thread(target=server.serve_forever,daemon=True).start()
 url=f'http://127.0.0.1:{server.server_port}/index.html'
 with sync_playwright() as p:
  browser=p.chromium.launch(headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
  context=browser.new_context(viewport={'width':1024,'height':768},accept_downloads=True)
  page=context.new_page(); page.set_default_timeout(60000)
  page.on('pageerror',lambda error:report['errors'].append(str(error)))
  try:
   page.goto(url+'#math',wait_until='domcontentloaded')
   page.wait_for_function('Boolean(window.__AMC8_MATH_NAV)',timeout=90000)
   report['origin']=page.evaluate('location.origin')
   assert report['origin'].startswith('http://127.0.0.1:')
   # A synthetic browser context is the only destination for reused QA code.
   assert not page.evaluate('Boolean(window.AMC8_QA)')
   page.add_script_tag(content=qa)
   page.wait_for_function('Boolean(window.AMC8_QA)')
   report['abEvidenceReused']='45378015639; not rerun'
   for i,case in enumerate(json.loads(args.cases.read_text()) if args.cases else CASES):
    item={'requested':case}
    try:
     page.goto(url+'#math',wait_until='domcontentloaded')
     page.wait_for_function('Boolean(window.__AMC8_MATH_NAV)',timeout=30000)
     if not page.evaluate('Boolean(window.AMC8_QA)'): page.add_script_tag(content=qa)
     page.wait_for_function('Boolean(window.AMC8_QA)',timeout=10000)
     item.update(page.evaluate("""requested=>{
       const loaded=AMC8_QA.loadCase(requested,true), task=playerTask();
       const session=topicSession();
       const routes=task?SourceCatalog.taskRoutes(task):[];
       const first=routes.find(r=>r.requiredSkills?.length&&!r.unverifiedKnowledge?.length);
       const boundary=first?{routeId:first.id,requiredSkills:first.requiredSkills,positive:SourceCatalog.allowedRoutes([first],first.requiredSkills).length,negative:SourceCatalog.allowedRoutes([first],first.requiredSkills.slice(1)).length}:null;
       const scopeBlocked=task?Boolean(competitionScopedContent(task)?.scopeBlocked):null;
       return {loaded,boundary,scopeBlocked,recipe:task?.competition?.recipe??null,
         taskId:task?.id??null, sessionId:session?.id??null,
         text:document.querySelector('#app')?.innerText?.slice(0,5000)??'',
         controls:[...document.querySelectorAll('#app [data-action]')].map(x=>x.dataset.action),
         storageKeys:Object.keys(localStorage)};
     }""",case))
     assert item['loaded']['familyId']==case['familyId']
     assert item['loaded']['configuration']==case['configuration']
     assert item['loaded']['seed']==case['seed']
     assert item['loaded']['generatorRevision']==case['generatorRevision']
     assert item['recipe'] and item['recipe']['seed']==case['seed']
     assert item['sessionId'].startswith('qa-')
     assert item['text'].strip()
     if not args.cases:
      assert item['scopeBlocked']==(case['familyId']=='signedProduct')
     if item['boundary']:
      assert item['boundary']['positive']==1 and item['boundary']['negative']==0
     item['identityAndRender']='PASS'
     page.screenshot(path=str(args.out/f'case-{i}.png'),full_page=True)
     if case['familyId']=='threeGroupBalance' and case['configuration']=='change-goal':
      expected=json.loads((ROOT/'tools/r11-product/d-independent-expected.json').read_text())
      item['independentExpectationCommit']='a234de9cef28f4e3bd601cca59e9fb40d0936a58'
      item['independentActions']=[]
      def snapshot():
       return page.evaluate("""()=>{const s=topicSession(), t=playerTask();const i=s?.items?.find(i=>i.taskId===t?.id)||s?.items?.[0];return {text:document.querySelector('#app')?.innerText, item:i,sessionId:s?.id,storage:localStorage.getItem('tianle_amc8_question_design_v1')}}""")
      inputs=page.locator('#app input:visible')
      item['visibleInputs']=inputs.evaluate_all("xs=>xs.map(x=>({type:x.type,placeholder:x.placeholder,outer:x.outerHTML}))")
      assert inputs.count()==1, 'Ambiguous answer input; inspect DOM before selecting'
      for value in [expected['independent']['wrongCases'][1]['input'],expected['independent']['unknown'],expected['independent']['answer']]:
       page.locator('#app input:visible').fill(value)
       page.locator('#app [data-action=check]').click()
       item['independentActions'].append({'input':value,'actual':snapshot()})
       page.screenshot(path=str(args.out/f'd-threegroup-{value}.png'),full_page=True)
      # The QA route may reload to home. Observe before navigating; do not recreate task.
      item['beforeReloadUrl']=page.url
      page.reload(wait_until='domcontentloaded')
      page.wait_for_timeout(1500)
      item['afterReloadObservation']=page.evaluate("""()=>({url:location.href,text:document.body.innerText.slice(0,8000),keys:Object.keys(localStorage),mathReady:Boolean(window.__AMC8_MATH_NAV)})""")
      page.screenshot(path=str(args.out/'d-threegroup-reload.png'),full_page=True)
      if not item['afterReloadObservation']['mathReady']:
       page.goto(url+'#math',wait_until='domcontentloaded')
       page.wait_for_function('Boolean(window.__AMC8_MATH_NAV)',timeout=30000)
      item['afterMathNavigation']=page.evaluate("""()=>({url:location.href,text:document.querySelector('#app')?.innerText?.slice(0,8000),keys:Object.keys(localStorage)})""")
      item['restoreDisposition']='OBSERVED_NOT_SIGNED'
     if case['familyId']=='signedProduct':
      item['boundaryDisposition']='POLICY_RENDER_ONLY'

    except Exception as ex: item['identityAndRender']='FAIL';item['error']=str(ex)
    report['cases'].append(item)
   # Historical FIX6 continuation: project only visible prompt fields; never emit keys.
   report['promptProjection']=page.evaluate("""()=>{if(typeof ExamMapping==='undefined')return {available:false};const d=ExamMapping.data;const ids=new Set(['AMC8-2000-13','AMC8-2000-14','AMC8-2000-15','AMC8-2000-16','AMC8-2000-18','AMC8-2015-10','AMC8-2015-11','AMC8-2015-12','AMC8-2015-13','AMC8-2015-14','AMC8-2015-15']);return {available:Boolean(d),shape:Object.keys(d||{}),problems:(Array.isArray(d?.problems)?d.problems:[]).filter(x=>ids.has(x.id||x.problemId)).map(x=>({id:x.id||x.problemId,prompt:typeof x.prompt==='string'?x.prompt:null,givenText:typeof x.givenText==='string'?x.givenText:null}))}}""")

  except Exception as ex: report['fatal']=str(ex)
  finally:
   (args.out/'receipt.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
   print(json.dumps(report,ensure_ascii=False))
   context.close();browser.close()
 server.shutdown()
 if report.get('fatal') or report['errors'] or any(x['identityAndRender']!='PASS' for x in report['cases']):
  raise SystemExit(1)
if __name__=='__main__':main()
