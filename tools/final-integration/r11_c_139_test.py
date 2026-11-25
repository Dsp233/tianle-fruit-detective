"""C #139 targeted real-browser teaching checks; no D credit or full regrading."""
import argparse,csv,io,json,re,sys,threading,zipfile
from pathlib import Path
from http.server import SimpleHTTPRequestHandler,ThreadingHTTPServer
from playwright.sync_api import sync_playwright
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
from g1_reading_packets import config,unpack
p=argparse.ArgumentParser()
for k in ('base','candidate','out','scores'):p.add_argument('--'+k,type=Path,required=True)
p.add_argument('--browser',required=True);a=p.parse_args();a.out.mkdir(parents=True,exist_ok=True)
root=a.base
class H(SimpleHTTPRequestHandler):
 def __init__(self,*args,**kw):super().__init__(*args,directory=str(root),**kw)
 def log_message(self,*args):pass
 def end_headers(self):self.send_header('Cache-Control','no-store');super().end_headers()
srv=ThreadingHTTPServer(('127.0.0.1',0),H);threading.Thread(target=srv.serve_forever,daemon=True).start()
url=f'http://127.0.0.1:{srv.server_port}/index.html#math'
control=config((a.base/'qa/index.html').read_text())['math']['scripts'][-1]
assert control['id']=='f12930312b8e007ab222216e6f478d87b24a0856ed7b0e191a98326ce32bec85'
qa=unpack(control,lambda n:(a.base/n).read_bytes()).decode()
scores=json.loads(a.scores.read_text())['rows'];assert len(scores)==36
figs={'natural-weighted','natural-tiles','natural-angleRatio','cubeProbability'}
feedback={'overlapProbability','ratioUnion','parityPermutations','stepwiseRoute','integratedWeightedPlan','integratedRatioPlan'}
def feedback_target(r):return r['familyId'] in feedback and r['configuration']!='length-border'
controls={'paintedCube','natural-fractionWeighted','natural-catch','natural-offers','rotatingColors','routeProbability','conditionalBalls','ratioTotal','factorBalance','percentRestore'}
targets=[e for e in scores if any(d['score']==1 for d in e['dimensions'].values())];assert len(targets)==12
with zipfile.ZipFile(a.base/'muse/rc73/rc73-muse-acceptance-kit.zip') as z:
 rows=[r for r in csv.DictReader(io.StringIO(z.read('ledgers/instance-environments.csv').decode('utf-8-sig'))) if r['environment']=='native_chrome' and r['familyId'] in figs|feedback|controls]
reqs=[dict(familyId=r['familyId'],configuration=r['configurationId'],seed=int(r['seed']),generatorRevision=int(r['generatorRevision'])) for r in rows]
# Include all 36 scored configs as cheap projection controls (not re-solving).
reqs=list({json.dumps(r,sort_keys=True):r for r in reqs+[e['recipe'] for e in scores]}.values())
assert all(e['recipe'] in reqs for e in targets)
def ready(p):p.wait_for_function("Boolean(window.__AMC8_MATH_NAV)&&typeof progressStore!=='undefined'&&progressStore.getStatus()==='ready'",timeout=60000)
def page_open(ctx):
 p=ctx.new_page();p.set_default_timeout(12000);p.goto(url,wait_until='domcontentloaded');ready(p)
 p.add_script_tag(content=qa);p.wait_for_function('Boolean(window.AMC8_QA)');return p
def load(p,r):
 actual=p.evaluate('r=>AMC8_QA.loadCase(r,true)',r);assert all(actual[k]==v for k,v in r.items()),actual;ready(p);return actual
PROJ="""()=>{const t=playerTask(),c=t.competition,v='variation:'+c.extension.key, main=CompetitionContentContracts.resolve(t,'main'),other=CompetitionContentContracts.resolve(t,v);
const diagnostic=(scopeId)=>CompetitionFeedback.diagnose({task:t,input:'-999999',scopeId});
return {identity:{id:t.id,version:t.contentVersion,recipe:c.recipe,signature:c.signature,math:c.math,mainPrompt:t.prompt,mainAnswer:c.answer,variationPrompt:c.extension.prompt,variationKey:c.extension.key,variationAnswer:c.extension.answer,variationMath:c.extension.problemState?.math,mainContract:main.answerContract,variantContract:other.answerContract,hints:main.hints,variantHints:other.hints},mainDiagram:main.diagram,variantDiagram:other.diagram,mainFeedback:diagnostic('main'),variantFeedback:diagnostic(v)} }"""
def project(browser,phase):
 out=[]
 # Bound synthetic learning-state accumulation in the QA controller.
 for start in range(0,len(reqs),20):
  ctx=browser.new_context(viewport={'width':1024,'height':768});p=page_open(ctx)
  try:
   for r in reqs[start:start+20]:
    print('PROJECTION '+phase+' '+str(len(out))+' '+json.dumps(r,ensure_ascii=False),flush=True)
    load(p,r);out.append({'recipe':r,'observed':p.evaluate(PROJ)})
  except Exception:
   print('PROJECTION_ERROR '+json.dumps(p.evaluate("()=>({status:progressStore.getStatus(),text:document.querySelector('#app')?.innerText?.slice(0,500)})"),ensure_ascii=False),flush=True)
   raise
  finally:ctx.close()
 return out
def action(p,a):return p.locator(f'#app [data-action={a}]:visible').first
def scene(p,rootloc,kind,label):
 loc=rootloc.locator(f'[data-scene-kind="{kind}"]:visible').first;loc.wait_for(state='visible')
 sv=loc.locator('svg');assert sv.count()==1
 out={'kind':kind,'text':loc.inner_text(),'svg':sv.evaluate('el=>el.outerHTML')}
 if kind=='scene-tiledRectangle':
  r=sv.locator('rect').first;out['size']=[float(r.get_attribute(k)) for k in ('width','height')]
  r=sv.locator('rect').nth(1);out['tile']=[float(r.get_attribute(k)) for k in ('width','height')]
 if kind=='scene-cube':
  out['grid']=sv.locator('path.scene-cube-grid').count();out['faces']=sv.locator('polygon').count()
 if kind=='scene-polygonAngles':
  out['widths']=sv.locator('rect').evaluate_all('els=>els.map(e=>Number(e.getAttribute("width")))')
 p.screenshot(path=str(a.out/f'{a.browser}-{label}.png'),full_page=True)
 return out
def check_fig(p,e):
 r=e['recipe'];load(p,r);f=r['familyId'];assert p.evaluate('()=>playerTask().id')==e['id']
 rec={'id':e['id'],'scope':[]}
 kinds={'natural-tiles':'scene-tiledRectangle','cubeProbability':'scene-cube'}
 if f in kinds:
  action(p,'competitionHint').click();ready(p);rec['main']=scene(p,p.locator('#app'),kinds[f],e['id']+'-main')
 # Independent variation opens directly, no new main mathematical credit.
 load(p,r);action(p,'competitionIndependentVariation').click();ready(p)
 ext=p.locator('details.competition-extension');ext.wait_for(state='visible');assert ext.evaluate('el=>el.open')
 ext.locator('[data-action=competitionHint]:visible').first.click();ready(p)
 kind={'natural-weighted':'scene-populationRemoval','natural-tiles':'scene-tiledRectangle','natural-angleRatio':'scene-polygonAngles','cubeProbability':'scene-cube'}[f]
 rec['variation']=scene(p,ext,kind,e['id']+'-variant')
 if f=='natural-weighted':
  assert all(t in rec['variation']['text'] for t in ['红队 1 人','蓝队 3 人','原人数 4','原总分','剩余总分 ÷ 剩余人数','≤ 7','?'])
  more=ext.locator('[data-action=competitionHintMore]:visible').first
  if more.count() and more.is_enabled():
   more.click();ready(p);rec['variation2']=scene(p,ext,kind,e['id']+'-variant-hint2')
  else:raise AssertionError('second hint not available')
 elif f=='natural-tiles':
  for x in [rec['main'],rec['variation']]:
   assert abs(x['size'][0]/x['size'][1]-.4)<1e-7 and x['tile'][0]==x['tile'][1] and '规格示意' in x['text'],x
 elif f=='natural-angleRatio':
  x=rec['variation'];assert len(x['widths'])==4 and all(abs(b/x['widths'][0]-r)<1e-7 for b,r in zip(x['widths'],[1,2,3,3])) and '不是四边形实形' in x['text']
 elif f=='cubeProbability':
  for x in [rec['main'],rec['variation']]:assert x['grid']==18 and x['faces']==3 and '六面涂色' in x['text'],x
 return rec
def wrong_ui(p,e):
 r=e['recipe'];load(p,r);assert p.evaluate('()=>playerTask().id')==e['id']
 prior=e['dimensions']['使用体验']['evidence']['wrongFeedback']
 val=re.search(r'你得到的是 (.*?)。',prior).group(1)
 picks=p.locator('#app [data-action=competitionPick]:visible')
 if picks.count():
  option=picks.filter(has_text=re.compile('^'+re.escape(val)+'$'));assert option.count()==1,(val,picks.all_inner_texts());option.click()
 else:
  inp=p.locator('#app input:visible');assert inp.count()==1;inp.fill(val)
 ready(p);action(p,'check').click();ready(p)
 actual=p.evaluate("()=>{const s=topicSession(),t=playerTask(),w=(s.items.find(i=>i.taskId===t.id)||s.items[0]).draft.work;return {feedback:w.scopes.main.feedback,state:w.scopes.main.answerState}}")
 assert actual['feedback'] and not actual['feedback']['ok'] and actual['state']!='correct',actual
 assert actual['feedback']['text']!=prior,(e['id'],actual)
 p.screenshot(path=str(a.out/f'{a.browser}-{e["id"]}-wrong.png'),full_page=True)
 return {'id':e['id'],'input':val,'prior':prior,'actual':actual}
def check_text(r,main,variant):
 f,k=r['familyId'],r['configuration']
 words={'overlapProbability':(['面积','并集'],['第一块面积','重叠面积']),'ratioUnion':(['交集','参加次数'],['棋类人数不变','球类']),'parityPermutations':(['间隙','偶数'],['首位','间隙'] if k=='first-odd-transfer' else ['奇数','间隙']),'stepwiseRoute':(['每一步','相乘'],['完整路线','等概率']),'integratedWeightedPlan':(['整包','最低费用'],['上限','可行']) if k=='mean-admission' else (['组数','费用'],['预算','人数']),'integratedRatioPlan':(['门洞','余料','角柱'],['已有板材','角柱','单块'])}
 for text,keys in zip([main,variant],words[f]):assert all(x in text for x in keys),(r,text,keys)
report={'browser':a.browser,'scope':'C #139; 12 low cells and shared controls; no independent signoff','status':'NOT_PROVEN'}
try:
 with sync_playwright() as pw:
  b=getattr(pw,a.browser).launch(headless=True,**({'args':['--no-sandbox','--disable-dev-shm-usage']} if a.browser=='chromium' else {}))
  before=project(b,'baseline')
  root=a.candidate;after=project(b,'candidate');ctx=b.new_context(viewport={'width':1024,'height':768});page=page_open(ctx)
  report['projectionChecks']=[]
  for x,y in zip(before,after):
   r=x['recipe'];assert r==y['recipe'];prev=x['observed'];new=y['observed'];f=r['familyId']
   assert prev['identity']==new['identity'],r
   if f=='natural-weighted' and new['identity']['variationKey']=='remove-high-to-target-v2':
    d=new['variantDiagram'];assert prev['variantDiagram'] is None and d['kind']=='scene-populationRemoval' and d['count']==d['red']+d['blue']
    assert prev['mainDiagram']==new['mainDiagram']
   else:assert prev['mainDiagram']==new['mainDiagram'] and prev['variantDiagram']==new['variantDiagram'],r
   if feedback_target(r):check_text(r,new['mainFeedback']['text'],new['variantFeedback']['text'])
   else:assert prev['mainFeedback']==new['mainFeedback'] and prev['variantFeedback']==new['variantFeedback'],r
   report['projectionChecks'].append({'recipe':r,'identity':new['identity']['id'],'mainKind':new['mainDiagram']['kind'] if new['mainDiagram'] else None,'variationKind':new['variantDiagram']['kind'] if new['variantDiagram'] else None,'feedbackChanged':prev['mainFeedback']!=new['mainFeedback'] or prev['variantFeedback']!=new['variantFeedback']})
  report['figures']=[];report['feedbackUI']=[]
  for e in targets:
   if e['recipe']['familyId'] in figs:report['figures'].append(check_fig(page,e))
   else:
    x=wrong_ui(page,e);check_text(e['recipe'],x['actual']['feedback']['text'],page.evaluate(PROJ)['variantFeedback']['text']);report['feedbackUI'].append(x)
  assert len(report['figures'])==4 and len(report['feedbackUI'])==8
  ctx.close();b.close();report['status']='PASS'
finally:
 (a.out/f'receipt-{a.browser}.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
 print('C139 '+json.dumps({'browser':a.browser,'status':report['status'],'projections':len(report.get('projectionChecks',[])),'figures':[x['id'] for x in report.get('figures',[])],'feedback':[x['id'] for x in report.get('feedbackUI',[])]},ensure_ascii=False),flush=True)
 srv.shutdown()
