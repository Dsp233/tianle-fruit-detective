"""Run the actual CR2 passage assertion against an isolated damaged stylesheet."""
import ast, functools, json, re, subprocess, tempfile, threading
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'code-review/CR5/evidence'
OUT.mkdir(parents=True, exist_ok=True)
tree = ast.parse((ROOT / 'reading-quality/browser.py').read_text())
nodes = [n for n in tree.body if isinstance(n, ast.FunctionDef) and n.name == 'check_first_passage_width']
assert len(nodes) == 1
scope = {'json': json}
exec(compile(ast.fix_missing_locations(ast.Module(body=nodes, type_ignores=[])), '<CR2 actual assertion>', 'exec'), scope)
assertion = scope['check_first_passage_width']
class Quiet(SimpleHTTPRequestHandler):
 def log_message(self, *args): pass
def serve(root):
 server = ThreadingHTTPServer(('127.0.0.1', 0), functools.partial(Quiet, directory=str(root)))
 threading.Thread(target=server.serve_forever, daemon=True).start()
 return server, 'http://127.0.0.1:%d/' % server.server_port
rows = []
with tempfile.TemporaryDirectory(prefix='cr5-css-') as temp:
 work = Path(temp) / 'fault'
 subprocess.run(['git','worktree','add','--detach',str(work),'HEAD'],cwd=ROOT,check=True)
 try:
  html=(work/'index.html').read_text()
  css=re.search(r'href="(?:\./)?(assets/reading-quality/[0-9a-f]{64}\.css)"',html).group(1)
  with (work/css).open('a') as f: f.write('\n.rd-story-text{width:2000px!important}\n')
  normal,normal_url=serve(ROOT);fault,fault_url=serve(work)
  try:
   with sync_playwright() as pw:
    for engine in ('chromium','webkit'):
     browser=getattr(pw,engine).launch()
     try:
      for case,url in (('normal',normal_url),('damaged',fault_url)):
       page=browser.new_page(viewport={'width':390,'height':844});page.set_default_timeout(25000)
       page.goto(url);page.locator('[data-home-hub] [data-action=reading]').click()
       page.locator('.rd-today [data-action=rdStart]').wait_for()
       try:
        assertion(page,engine)
       except AssertionError as e:
        assert case=='damaged' and 'Reading passage extends outside viewport' in str(e),str(e)
        rows.append({'engine':engine,'case':case,'actual':'REJECTED','assertion':str(e)})
       else:
        assert case=='normal','damaged CSS was not rejected'
        rows.append({'engine':engine,'case':case,'actual':'ACCEPTED'})
       finally: page.close()
     finally:browser.close()
  finally:
   normal.shutdown();fault.shutdown();normal.server_close();fault.server_close()
 finally:subprocess.run(['git','worktree','remove','--force',str(work)],cwd=ROOT,check=True)
(OUT/'css-fault.json').write_text(json.dumps(rows,ensure_ascii=False,indent=2)+'\n')
print(json.dumps(rows,ensure_ascii=False),flush=True)
