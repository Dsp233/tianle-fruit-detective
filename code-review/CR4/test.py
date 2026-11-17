import base64,gzip,hashlib,json,math,os,re,subprocess,tempfile,threading,functools
from pathlib import Path
from http.server import ThreadingHTTPServer,SimpleHTTPRequestHandler
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[2]
BASE='05f73af21ddf35134bb7c5e598cd75845e82baf2'
OUT=ROOT/'code-review/CR4/evidence';OUT.mkdir(parents=True,exist_ok=True)
rows=[]
def config(root):return json.loads(re.search(r'<script id="learning-delivery" type="application/json">(.*?)</script>',(root/'index.html').read_text())[1])
def packet(root,row):return gzip.decompress(b''.join(base64.b64decode(json.loads((root/p).read_text())['gz']) for p in row['parts']))
class Handler(SimpleHTTPRequestHandler):
 def log_message(self,*args):pass
def serve(root):
 s=ThreadingHTTPServer(('127.0.0.1',0),functools.partial(Handler,directory=str(root)));threading.Thread(target=s.serve_forever,daemon=True).start();return s,'http://127.0.0.1:%s/'%s.server_port
def check(browser,name,root,url,candidate):
 for kind in ('json','js','broken','normal','no_crypto'):
  row=config(root)['reading']['data' if kind in ('json','broken','normal','no_crypto') else 'scripts'][0];body=packet(root,row)
  if kind=='json':
   data=json.loads(body);title=data['materials'][0]['title'];mut=('测' if title[0]!='测' else '试')+title[1:];body=body.replace(json.dumps(title,ensure_ascii=False).encode(),json.dumps(mut,ensure_ascii=False).encode(),1);assert len(body)==row['bytes']
  if kind=='js':body+=b'\nwindow.__CR0_PACKET_EXECUTED=true;\n'
  compressed=b'broken gzip' if kind=='broken' else gzip.compress(body,mtime=0)
  size=math.ceil(len(compressed)/len(row['parts']));replacements={p:json.dumps({'gz':base64.b64encode(compressed[i*size:(i+1)*size]).decode()}) for i,p in enumerate(row['parts'])}
  context=browser.new_context();page=context.new_page();page.set_default_timeout(25000);calls=[]
  if kind=='no_crypto':page.add_init_script("Object.defineProperty(window,'crypto',{value:{},configurable:true})")
  if kind in ('json','js','broken'):
   for p,payload in replacements.items():
    def route_handler(route,request,payload=payload):
     calls.append(request.url);route.fulfill(status=200,content_type='application/json',body=payload)
    page.route('**/'+p,route_handler)
  page.goto(url);page.locator('[data-home-hub] [data-action=reading]').click()
  if candidate and kind in ('json','js','broken','no_crypto') or kind=='broken':
   page.locator('[data-load-retry]').wait_for();assert not page.evaluate('window.__CR0_PACKET_EXECUTED===true')
   if kind in ('json','js','broken'):
    assert not page.evaluate("window.__AMC8_ReadingRuntime !== undefined")
    page.unroute_all(behavior='wait');page.locator('[data-load-retry]').click();page.locator('.rd-today [data-action=rdStart]').wait_for()
  else:
   page.locator('.rd-today [data-action=rdStart]').wait_for()
   if kind=='json':assert page.evaluate('title=>window.__AMC8_READING_DATA.materials[0].title===title',mut)
   if kind=='js':assert page.evaluate('window.__CR0_PACKET_EXECUTED===true')
  rows.append(dict(engine=name,version='candidate' if candidate else 'baseline',case=kind,result='PASS',requests=len(calls),declared=row['id'],actual=hashlib.sha256(body).hexdigest(),bytes=len(body)))
  context.close()
def main():
 with tempfile.TemporaryDirectory() as d:
  old=Path(d)/'base';subprocess.run(['git','worktree','add','--detach',str(old),BASE],cwd=ROOT,check=True)
  try:
   s1,u1=serve(old);s2,u2=serve(ROOT)
   try:
    with sync_playwright() as p:
     for name in ('chromium','webkit'):
      b=getattr(p,name).launch()
      try:check(b,name,old,u1,False);check(b,name,ROOT,u2,True)
      finally:b.close()
   finally:s1.shutdown();s2.shutdown();s1.server_close();s2.server_close()
  finally:subprocess.run(['git','worktree','remove','--force',str(old)],cwd=ROOT,check=True)
 (OUT/'browser.json').write_text(json.dumps(rows,ensure_ascii=False,indent=2));print(json.dumps(rows,ensure_ascii=False),flush=True)
if __name__=='__main__':main()
