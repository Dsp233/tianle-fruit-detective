#!/usr/bin/env python3
"""Read-only actual-runtime route membership, using 7 previously graded objects; no new grade credit."""
import functools,json,subprocess,threading
from pathlib import Path
from http.server import SimpleHTTPRequestHandler,ThreadingHTTPServer
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[2];OUT=ROOT/'r11-probe-output';OUT.mkdir(exist_ok=True)
BASE='72f2f229246af362f9024db217479357890c8cd3'
assert (ROOT/'index.html').read_bytes()==subprocess.check_output(['git','show',BASE+':index.html'],cwd=ROOT)
class H(SimpleHTTPRequestHandler):
 def log_message(self,*a):pass
srv=ThreadingHTTPServer(('127.0.0.1',0),functools.partial(H,directory=str(ROOT)));threading.Thread(target=srv.serve_forever,daemon=True).start()
url=f'http://127.0.0.1:{srv.server_port}/index.html#math'
try:
 with sync_playwright() as p:
  b=p.chromium.launch(headless=True,args=['--no-sandbox','--disable-dev-shm-usage']);ctx=b.new_context();page=ctx.new_page();page.goto(url);page.wait_for_function("Boolean(window.__AMC8_MATH_NAV)&&typeof progressStore!=='undefined'&&progressStore.getStatus()==='ready'",timeout=60000)
  rows=page.evaluate("""()=>{const groups={'AMC8-2000-06':['RTM-LSHAPE-CHECK','RTM-LSHAPE-DISJOINT-INTEGRATION','RTM-LSHAPE-NEW'],'AMC8-2000-11':['RTM-DIGIT-ENUMERATE-NEW'],'AMC8-2000-23':['RTM-AVERAGE-TO-TOTAL-NEW','RTM-OVERLAP-INTEGRATION-NEW','RTM-OVERLAP-MULTIPLICITY']};let out=[];for(const [id,targets] of Object.entries(groups)){let units=SKILL_DATA.units.map(x=>x.id);const prof=SourceCatalog.profile({sourceIds:['AMC8'],examIds:[id],topicIds:units});const problem=ExamMapping.getProblem(id);const plans=ExamMappingUI.supplyPlans(prof).map(x=>({examId:x.examId,routeId:x.routeId,taskIds:x.taskIds,pendingTaskIds:x.pendingTaskIds}));const routes=(problem.routeIds||[]).map(r=>{const x=ExamMapping.data.routes[r];return {id:r,requiredKnowledge:x.requiredKnowledge,judgmentIds:x.judgmentIds,counterexampleTaskIds:x.counterexampleTaskIds,integrationTaskIds:x.integrationTaskIds}});const bindings=Object.values(ExamMapping.data.bindings).filter(b=>targets.includes(b.taskRef?.taskId)).map(b=>({judgmentId:b.judgmentId,taskId:b.taskRef.taskId,matchLevel:b.matchLevel,policyGaps:b.policyGaps}));const projected=targets.map(t=>({id:t,eligible:ExamMapping.taskAllowed(ExamMapping.data.tasks[t],prof).eligible,routeMembership:plans.filter(p=>p.taskIds.includes(t)).map(p=>p.routeId)}));out.push({id,plans,routes,bindings,projected});}return out;}""")
  (OUT/'child-route-membership.json').write_text(json.dumps(rows,ensure_ascii=False,indent=2))
  print('ROUTE_MEMBERSHIP '+json.dumps(rows,ensure_ascii=False),flush=True)
  ctx.close();b.close()
finally:srv.shutdown()
