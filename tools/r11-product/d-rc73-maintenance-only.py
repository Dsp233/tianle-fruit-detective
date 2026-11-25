"""RC73 maintenance: current formal actual browser, independent synthetic raw-string oracle."""
import os,json,hashlib,threading,functools,subprocess,concurrent.futures
from pathlib import Path
from http.server import SimpleHTTPRequestHandler,ThreadingHTTPServer
from playwright.sync_api import sync_playwright
ROOT=Path(os.environ['D_PRODUCT']);OUT=Path('r11-probe-output');OUT.mkdir(exist_ok=True)
assert subprocess.check_output(['git','-C',str(ROOT),'rev-parse','HEAD'],text=True).strip()=='d0c9c3e265a7a76052487d374255fcda35f21117'
class H(SimpleHTTPRequestHandler):
 def log_message(self,*a):pass
srv=ThreadingHTTPServer(('127.0.0.1',0),functools.partial(H,directory=str(ROOT)));threading.Thread(target=srv.serve_forever,daemon=True).start()
url=f'http://127.0.0.1:{srv.server_port}/muse/rc73/maintenance.html'
keys=['tianle_amc8_question_design_v1']+['tianle_amc8_'+s+'_rc'+str(v)+'_v1' for v in (73,72) for s in ('qa','qa_normal','qa_history')]
def raw(p):
 return p.evaluate("()=>Object.fromEntries(Array.from({length:localStorage.length},(_,i)=>localStorage.key(i)).map(k=>[k,window.__dOriginalGet.call(localStorage,k)]))")
def download(p,btn,name):
 with p.expect_download() as d:btn.click()
 f=OUT/(name+'.json');d.value.save_as(str(f));return json.loads(f.read_text()),hashlib.sha256(f.read_bytes()).hexdigest()
def verify(payload,want,backups):
 e={v['namespace']:v for v in payload['entries']};assert set(e)==set(want),(set(e),set(want))
 for k,v in want.items():
  a=e[k];assert a['raw']==v and a['bytes']==len(v.encode()) and a['sha256']==hashlib.sha256(v.encode()).hexdigest(),k
  b={x['key']:x for x in a['backups']};exp={x:y for x,y in backups.items() if x.startswith(k+'_backup_')};assert set(b)==set(exp),(k,b,exp)
  for bk,bv in exp.items():assert b[bk]['raw']==bv and b[bk]['bytes']==len(bv.encode()) and b[bk]['sha256']==hashlib.sha256(bv.encode()).hexdigest()
 return len(e)
def run(engine):
 result={'engine':engine,'cases':[],'errors':[]}
 with sync_playwright() as pw:
  b=getattr(pw,engine).launch(headless=True,**({'args':['--no-sandbox','--disable-dev-shm-usage']} if engine=='chromium' else {}))
  def ctx_fixture(fixture,failed=None):
   ctx=b.new_context(accept_downloads=True,viewport={'width':1024,'height':768});p=ctx.new_page()
   p.add_init_script(script='''(()=>{const values='''+json.dumps(fixture,ensure_ascii=False)+''',fail='''+json.dumps(failed)+''';window.__dOriginalGet=Storage.prototype.getItem;const prior=window.__dOriginalGet;for(const [k,v] of Object.entries(values))localStorage.setItem(k,v);if(fail)Storage.prototype.getItem=function(k){if(k===fail)throw new DOMException('D controlled read failure','SecurityError');return prior.call(this,k)}})()''')
   p.goto(url,wait_until='domcontentloaded');p.wait_for_function('window.__AMC8_MAINTENANCE_READY===true');return ctx,p
  fixture={keys[0]:' { "schema": 1, "marker": "正式甲" } ',keys[1]:'{broken JSON',keys[2]:'{"schema":9999,"future":true}',keys[3]:'{"unknown":{"中文":"原样保留"}}',keys[4]:'["历史",1]',keys[5]:'{"history":"B"}',keys[6]:'{"history":"C"}'}
  backups={keys[0]+'_backup_1':'旧正式备份甲',keys[2]+'_backup_future':' {unknown backup} '};allv=fixture|backups|{'d-unregistered-sentinel':'不属于七来源','tianle_amc8_question_design_v1_reading_r1':'独立阅读命名空间'}
  try:
   ctx,p=ctx_fixture(allv);before=raw(p);assert before==allv
   p.screenshot(path=str(OUT/(engine+'-inventory.png')),full_page=True)
   assert p.locator('#sources input').count()==7
   for k in keys:
    btn=p.locator('section').filter(has=p.locator('input[value="'+k+'"]')).get_by_role('button')
    a,h=download(p,btn,engine+'-single-'+str(keys.index(k)));assert verify(a,{k:fixture[k]},backups)==1 and a['errors']==[];assert raw(p)==before
    result['cases'].append({'case':'single','namespace':k,'downloadSha256':h,'rawPreserved':True})
   a,h=download(p,p.locator('#export'),engine+'-all');assert verify(a,fixture,backups)==7 and a['errors']==[];assert raw(p)==before
   result['cases'].append({'case':'all-seven','downloadSha256':h,'rawPreserved':True,'malformedFutureUnknownExact':True,'backupsExact':True,'unregisteredExcluded':True})
   ctx.close()
   # Missing and controlled failing getItem; fail after render to exercise export path too.
   subset={keys[0]:fixture[keys[0]],keys[1]:fixture[keys[1]]};ctx,p=ctx_fixture(subset)
   assert p.locator('#sources input:disabled').count()==5
   p.evaluate("k=>{const old=window.__dOriginalGet;Storage.prototype.getItem=function(v){if(v===k)throw new DOMException('D fault','SecurityError');return old.call(this,v)}}",keys[1])
   before=raw(p);a,h=download(p,p.locator('#export'),engine+'-partial-read-error');assert verify(a,{keys[0]:subset[keys[0]]},{})==1
   assert a['errors']==[{'namespace':keys[1],'reason':'READ_FAILED'}];assert raw(p)==before
   result['cases'].append({'case':'partial-read-error','downloadSha256':h,'rawPreserved':True,'missing':5,'failed':keys[1],'exported':keys[0]})
   ctx.close()
   ctx,p=ctx_fixture({},failed=keys[1]);assert p.locator('#sources input:disabled').count()==7
   assert '无法读取' in p.locator('#sources').inner_text();p.locator('#export').click();assert '没有保存记录' in p.locator('#status').inner_text();assert raw(p)=={}
   p.screenshot(path=str(OUT/(engine+'-empty.png')),full_page=True)
   result['cases'].append({'case':'empty-inventory','rawPreserved':True,'readFailureVisible':True});ctx.close();result['status']='PASS'
  except Exception as e:result['errors'].append(repr(e));result['status']='PARTIAL'
  finally:b.close()
 return result
try:
 with concurrent.futures.ThreadPoolExecutor(max_workers=2) as p:rows=list(p.map(run,['chromium','webkit']))
 (OUT/'d-rc73-maintenance.json').write_text(json.dumps(rows,ensure_ascii=False,indent=2))
 for r in rows:print('D_MAINTENANCE '+json.dumps(r,ensure_ascii=False),flush=True)
finally:srv.shutdown()
