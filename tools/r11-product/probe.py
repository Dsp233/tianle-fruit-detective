#!/usr/bin/env python3
"""R1.1 A/B engineering probe. Reuse legacy QA controls over frozen production bytes.
Never writes a production page, real learner profile, or queue. Not D acceptance."""
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
 dict(familyId='outsideAngle',configuration='outsideAngle',seed=1,generatorRevision=3),
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
             qaControlId=control['id'],scope='ENGINEERING_ONLY',cases=[],skills=[],errors=[])
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
   report['familyCount']=page.evaluate('AMC8_QA.families.length')
   report['configurationCount']=page.evaluate('AMC8_QA.families.filter(x=>!x.qaValidation).reduce((n,x)=>n+x.configurations.length,0)')
   # Exact identity reconciliation, not another full mathematical test.
   pairs=sorted(page.evaluate("AMC8_QA.families.filter(x=>!x.qaValidation).flatMap(x=>x.configurations.map(c=>[x.familyId,c]))"))
   expected_hash='c50c841217782d75877229b54a8e604e4908d31162131a5c706beda84aa16169'
   digest=lambda rows:hashlib.sha256(json.dumps(rows,ensure_ascii=False,separators=(',',':')).encode()).hexdigest()
   matches=[x for i,x in enumerate(pairs) if digest(pairs[:i]+pairs[i+1:])==expected_hash]
   report['contractMapping']={'count':len(pairs),'contractCount':153,'contractSha256':expected_hash,'extraConfigurations':matches,'exactMatch':len(pairs)==154 and len(matches)==1,'pairs':pairs}
   # Actual rendered selector and grading path (engineering-only).
   page.locator('#qa-family').select_option('outsideAngle')
   page.locator('#qa-configuration').select_option('outsideAngle')
   page.locator('#qa-seed').fill('1')
   page.locator('#qa-revision').select_option('3')
   page.locator('#qa-form button[type=submit]').click()
   assert 'outsideAngle' in page.locator('#qa-status').inner_text()
   assert page.evaluate("AMC8_QA.current().taskId")== 'COMP-BA0EDF2F'
   page.locator('#app [data-action=competitionPick]').filter(has_text=re.compile(r'^117$')).click()
   page.locator('#app [data-action=check]').click()
   report['engineeringGradeSmoke']={'case':'COMP-BA0EDF2F','input':'117','visibleText':page.locator('#app').inner_text(),'session':page.evaluate("topicSession().items[0]")}
   assert report['engineeringGradeSmoke']['session']['passed'] is True
   page.screenshot(path=str(args.out/'engineering-grade.png'),full_page=True)
   for i,case in enumerate(json.loads(args.cases.read_text()) if args.cases else CASES):
    item={'requested':case}
    try:
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
    except Exception as ex: item['identityAndRender']='FAIL';item['error']=str(ex)
    report['cases'].append(item)
   for skill in SKILLS:
    item={'skillId':skill}
    try:
     item.update(page.evaluate("""id=>{
       const skill=SKILL_DATA.skills.find(x=>x.id===id);
       const banks=Object.entries(PRACTICE_BANKS).filter(([name,bank])=>Object.hasOwn(bank,id));
       return {exists:!!skill,skillName:skill?.name??skill?.title??null,
         banks:banks.map(([name,bank])=>({name,taskId:bank[id]?.id??null,mode:bank[id]?.mode??null}))};
     }""",skill))
     item['staticOperationBinding']='PASS' if item['exists'] and item['banks'] else 'NOT_PROVEN'
    except Exception as ex: item['staticOperationBinding']='NOT_PROVEN';item['error']=str(ex)
    report['skills'].append(item)
   assert all(x['staticOperationBinding']=='PASS' for x in report['skills'])
   report['negativeInput']=page.evaluate("""()=>{try{AMC8_QA.validate({familyId:'outsideAngle',configuration:'outsideAngle',seed:0,generatorRevision:3});return false}catch(e){return true}}""")
  except Exception as ex: report['fatal']=str(ex)
  finally:
   (args.out/'receipt.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
   print(json.dumps(report,ensure_ascii=False))
   context.close();browser.close()
 server.shutdown()
 if not report.get('contractMapping',{}).get('exactMatch') or report.get('fatal') or report['errors'] or not report.get('negativeInput') or any(x['identityAndRender']!='PASS' for x in report['cases']):
  raise SystemExit(1)
if __name__=='__main__':main()
