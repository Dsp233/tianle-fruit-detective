#!/usr/bin/env python3
"""Read-only prompt projection from actual current browser runtime; no answers or option IDs exported."""
import json,functools,threading,subprocess,time
from pathlib import Path
from http.server import SimpleHTTPRequestHandler,ThreadingHTTPServer
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[2];OUT=ROOT/'r11-probe-output';OUT.mkdir(exist_ok=True)
BASE='72f2f229246af362f9024db217479357890c8cd3'
assert (ROOT/'index.html').read_bytes()==subprocess.check_output(['git','show',BASE+':index.html'],cwd=ROOT)
class H(SimpleHTTPRequestHandler):
 def log_message(self,*a):pass
srv=ThreadingHTTPServer(('127.0.0.1',0),functools.partial(H,directory=str(ROOT)));threading.Thread(target=srv.serve_forever,daemon=True).start()
try:
 with sync_playwright() as p:
  b=p.chromium.launch(headless=True,args=['--no-sandbox','--disable-dev-shm-usage']);c=b.new_context();page=c.new_page();page.goto(f'http://127.0.0.1:{srv.server_port}/index.html#math');page.wait_for_function("Boolean(window.__AMC8_MATH_NAV) && typeof ExamMapping!=='undefined'",timeout=60000)
  rows=page.evaluate("""()=>{const d=ExamMapping.data;const result=[];const proj=(v)=>({prompt:v.prompt||'',givenText:v.givenText||'',options:(v.options||[]).map(o=>typeof o==='string'?o:String(o.label||o.text||o.title||'')),figures:(v.givenFigures||[]).map(f=>({sha256:f.sha256,source:window.__AMC8_SOURCE_FIGURES?.[f.sha256]||null})),table:(v.givenTable||[]),renderingMode:v.renderingMode||null});for(const p of Object.values(d.problems)){try{const checked=ConnectedLearning.review(p);const v={...p.presentation,...(checked.eligible?checked.record:{})};result.push({id:p.examId,group:p.examId,role:'exam',eligible:checked.eligible,recipe:p.recipe?{familyId:p.recipe.familyId,configuration:p.recipe.configuration,seed:p.recipe.seed,generatorRevision:p.recipe.generatorRevision}:null,...proj(v)});for(const t of Object.values(d.tasks).filter(t=>t.originProblemGroupId===p.examId)){let row=checked.record?.tasks?.[t.taskId];let def=row?ConnectedLearning.definition({definition:t},row):t;result.push({id:t.taskId,group:p.examId,role:t.taskId.split('-').pop().toLowerCase(),eligible:checked.eligible,...proj(def)})}}catch(e){result.push({id:p.examId,error:String(e)})}}return result}""")
  summary={'base':BASE,'kind':'PROMPT_PROJECTION_NO_KEYS','count':len(rows),'unique':len({x['id'] for x in rows}),'errors':[r for r in rows if 'error'in r],'emptyPrompts':[r['id'] for r in rows if not r.get('prompt')],'figureObjects':sum(bool(r.get('figures')) for r in rows),'figureReferences':sum(len(r.get('figures',[])) for r in rows),'missingFigureReferences':sum(not f.get('source') for r in rows for f in r.get('figures',[]))}
  (OUT/'visible-prompts.json').write_text(json.dumps(rows,ensure_ascii=False,indent=2));(OUT/'projection-summary.json').write_text(json.dumps(summary,ensure_ascii=False,indent=2));print('PROJECTION_SUMMARY '+json.dumps(summary,ensure_ascii=False))
  for i in range(0,len(rows),16):
   print('PROMPT_BATCH '+json.dumps(rows[i:i+16],ensure_ascii=False,separators=(',',':')),flush=True)
  c.close();b.close()
finally:srv.shutdown()
