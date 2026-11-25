"""D six-dimensional remaining hint/restore and targeted visual/feedback review; no regrading."""
import os,sys,json,threading,functools,hashlib,subprocess,concurrent.futures
from pathlib import Path
from http.server import SimpleHTTPRequestHandler,ThreadingHTTPServer
from playwright.sync_api import sync_playwright
ROOT=Path(os.environ['D_PRODUCT']);OUT=Path('r11-probe-output');OUT.mkdir(exist_ok=True)
assert subprocess.check_output(['git','-C',str(ROOT),'rev-parse','HEAD'],text=True).strip()=='f306ceafc90b16e5794e3e4a1df95101a73e2778'
sys.path.insert(0,str(ROOT/'tools'))
from g1_reading_packets import config,unpack
control=config((ROOT/'qa/index.html').read_text())['math']['scripts'][-1]
assert control['id']=='f12930312b8e007ab222216e6f478d87b24a0856ed7b0e191a98326ce32bec85'
qa=unpack(control,lambda n:(ROOT/n).read_bytes()).decode()
rows=[]
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


import re
BASE='f306ceafc90b16e5794e3e4a1df95101a73e2778'
oldroot=Path('/tmp/d-old')
oldserver=ThreadingHTTPServer(('127.0.0.1',0),functools.partial(H,directory=str(oldroot)));threading.Thread(target=oldserver.serve_forever,daemon=True).start()
oldurl=f'http://127.0.0.1:{oldserver.server_port}/index.html#math'
def load(p,url,recipe):
 p.goto(url,wait_until='domcontentloaded');ready(p);p.add_script_tag(content=qa);p.wait_for_function('Boolean(window.AMC8_QA)')
 a=p.evaluate('r=>AMC8_QA.loadCase(r,true)',recipe);assert all(a[k]==v for k,v in recipe.items()),a;ready(p);return a
res=[]
try:
 with sync_playwright() as pw:
  for engine in ('chromium','webkit'):
   b=getattr(pw,engine).launch(headless=True,**({'args':['--no-sandbox','--disable-dev-shm-usage']} if engine=='chromium' else {}))
   ctx=b.new_context(viewport={'width':1024,'height':768});p=ctx.new_page();p.set_default_timeout(8000)
   x={'engine':engine,'errors':[]}
   try:
    # RC73 exact revision 5 only; original independent answer 2 is frozen in #132.
    r={'familyId':'natural-weighted','configuration':'natural-weighted','seed':1,'generatorRevision':5}
    a=load(p,URL,r);assert a['taskId']=='COMP-30D489A8'
    action(p,'competitionIndependentVariation').click();ready(p);scope=p.evaluate("()=>topicSession()?.items?.[0]?.draft?.work?.activeScopeId");assert scope=='variation:remove-high-to-target-v2',scope
    before=snapshot(p);p.locator('#app [data-competition-input="extension"]:visible').fill('4/2');action(p,'competitionExtensionCheck').click();ready(p)
    v=p.evaluate("""s=>{let m=topicSession()?.items?.[0]?.draft?.work?.scopes?.[s];return {feedback:m?.feedback,answerState:m?.answerState,input:m?.input,help:m?.help}}""",scope)
    x['weightedRev5']={'recipe':r,'identity':a,'actual':v,'visible':snapshot(p)['text'],'pass':v['answerState']=='correct' and bool((v['feedback'] or {}).get('ok')),'shot':shot(p,'weighted-rev5',engine)}
    # One unchanged non-chase family as a paired actual visual control, no grading.
    r={'familyId':'machineMeeting','configuration':'machineMeeting','seed':1,'generatorRevision':3}
    x['machineMeeting']={}
    for version,url in [('before',oldurl),('after',URL)]:
     a=load(p,url,r);action(p,'competitionHint').click();ready(p);s=snapshot(p);x['machineMeeting'][version]={'identity':a,'text':s['text'],'shot':shot(p,'machineMeeting',engine+'-'+version)}
    x['machineMeeting']['sameHintText']=x['machineMeeting']['before']['text']==x['machineMeeting']['after']['text']
   except Exception as exc:x['errors'].append(repr(exc))
   finally:ctx.close();b.close()
   res.append(x)
   print('D_EXACT_CONTROL '+json.dumps(x,ensure_ascii=False),flush=True)
 (OUT/'d-exact-weighted-opposite-control.json').write_text(json.dumps({'base':BASE,'scope':'exact RC73 revision 5 legal equivalence, before/after non-chase control; no new independent math grade','rows':res},ensure_ascii=False,indent=2))
finally:srv.shutdown();oldserver.shutdown()
