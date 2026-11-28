"""D2 natural continuation only; restore the actual next-task browser storage."""
import time
from pathlib import Path
exec(Path("tools/r11-product/d-v3-public-natural-only-20261128.py").read_text().split("# Only uncovered public widths")[0])
x={"formal":"fcef9785308363379b028129871c92700e1f93d4","engine":ENGINE,"checks":{},"errors":[]}
frozen={"id":"RTM-2013-04-DECISION","prompt":"7人各多付2.5，代付的那一份多少？","givenText":"","options":["17.5","20","2.5"],"answer":"17.5","derivation":"7×(5/2)=35/2=17.5; seven additional contributions cover one missing share."}
def run(p,ctx,st):
 source=next(json.loads(v["value"]) for o in st["origins"] for v in o["localStorage"] if v["name"]=="tianle_amc8_question_design_v1")["rtm1"]
 ready_profile(p)
 if not p.locator('[data-rtm-task]').is_visible():
  loc(p,'rtmConnectedResume').first.click();ready(p)
 wait_task(p)
 a=active(p);base=state_report(p)["eventsById"]
 x["checks"]["restore"]={"sameAttempt":a["attemptId"]==source["sessions"]["active"]["attemptId"],"oldEventsExact":retained(source["eventsById"],base),"before":a,"screenshot":snap(p,"restore")}
 assert a["id"]==frozen["id"] and a["attemptId"]==source["sessions"]["active"]["attemptId"] and retained(source["eventsById"],base)
 assert fingerprint(p,frozen)
 assert set(a["definition"]["requiredKnowledge"])<=set(a["profileSnapshot"]["declaredSkillIds"])
 assert not a["priorExposure"] and not a["priorMethodHelp"] and not a["helpLevel"] and not a["submissionOrdinal"]
 assert not any(v.get("type")=="response_submitted" and (v.get("taskId")==a["id"] or v.get("mathKey")==a["mathKey"] or v.get("originProblemGroupId")==a["originProblemGroupId"]) for v in base.values())
 post=submit_label(p,frozen,frozen["answer"])
 events=state_report(p)["eventsById"];new=[v for k,v in events.items() if k not in base]
 x["checks"]["submit"]={"derivation":frozen["derivation"],"after":post,"newEvents":new,"oldEventsExact":retained(base,events),"screenshot":snap(p,"submitted")}
 assert post["feedback"]["outcome"]=="VERIFIED" and retained(base,events)
 responses=[v for v in new if v.get("type")=="response_submitted"]
 assert len(responses)==1 and responses[0]["submissionOrdinal"]==1
 assert not responses[0]["result"].get("methodAssisted")
 # This decision item is local judgment evidence, not T2/T3 independent holdout.
 x["checks"]["newResponseScope"]=responses[0]["result"]
 if next_task(p):
  x["checks"]["nextActual"]={"active":active(p),"screenshot":snap(p,"next")}
 x["checks"]["finalEventsExact"]=retained(events,state_report(p)["eventsById"])
 math_home(p)
 ctx.storage_state(path=str(OUT/"d2-natural-continuation-storage.json"))
try:
 with sync_playwright() as pw:
  b=getattr(pw,ENGINE).launch(headless=True,**({"args":["--no-sandbox","--disable-shm-usage"]} if ENGINE=="chromium" else {}))
  st=json.loads(next(Path("/tmp/d-latest").rglob("natural-continuation-storage.json")).read_text())
  ctx=b.new_context(storage_state=st,viewport={"width":1024,"height":768},has_touch=True,accept_downloads=True)
  p=ctx.new_page();p.set_default_timeout(20000)
  p.on("pageerror",lambda e:x["errors"].append(str(e)))
  p.on("dialog",lambda d:d.accept() if "家长" in d.message else d.dismiss())
  x["identityBefore"]=hashlib.sha256(p.request.get(PUB+"index.html?d2="+str(time.time_ns())).body()).hexdigest()
  assert x["identityBefore"]==hashlib.sha256((ROOT/"index.html").read_bytes()).hexdigest()
  run(p,ctx,st)
  x["identityAfter"]=hashlib.sha256(p.request.get(PUB+"index.html?d2="+str(time.time_ns())).body()).hexdigest()
  assert x["identityAfter"]==x["identityBefore"]
  x["status"]="OBSERVED"
  ctx.close();b.close()
except Exception as e:
 x["errors"].append(repr(e));x["status"]="PARTIAL"
finally:
 srv.shutdown()
 (OUT/"d2-natural-continuation.json").write_text(json.dumps(x,ensure_ascii=False,indent=2))
 print("D2_NATURAL "+json.dumps({"engine":ENGINE,"status":x.get("status"),"checks":list(x["checks"]),"errors":x["errors"]},ensure_ascii=False),flush=True)
