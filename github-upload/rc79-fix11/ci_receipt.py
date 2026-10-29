import json,os
from pathlib import Path
out=Path.cwd()/"muse/rc79/fix11";e=Path("/tmp/fix11-evidence")
names=["storage-browser.json","diagnostic-c-browser.json","diagnostic-d-browser.json","reading-order-browser.json","reading-routes-browser.json","reading-drag-browser.json","percent-browser.json","smoke-result.json","reading-feedback-browser.json","engine-test-results.json","full-reading-integration.json","math-runtime.json"]
reports={name:json.loads((e/name).read_text()) for name in names}
assert reports["storage-browser.json"]["result"]=="PASS_WITH_REMAINING_WORK"
for name in names[1:9]:assert reports[name]["result"]=="PASS",name
full=reports["full-reading-integration.json"];assert full["result"]=="PASS" and full["completeSuite"] and full["populations"]["courseQuestions"]==840 and full["populations"]["diagnosticQuestions"]==208 and full["populations"]["dailyRoutes"]==84
assert reports["engine-test-results.json"]["passed"]==45 and reports["engine-test-results.json"]["total"]==45
assert reports["math-runtime.json"]["result"]=="PASS" and reports["math-runtime.json"]["cases"]>=38
for name in ["diagnostic-c-browser.json","diagnostic-d-browser.json","reading-order-browser.json","reading-routes-browser.json","reading-drag-browser.json","percent-browser.json"]:assert {x["engine"] for x in reports[name]["checks"]}=={"chromium","webkit"},name
receipt={"revision":"RC79-FIX11","phase":"CANDIDATE","result":"PASS_WITH_REMAINING_WORK","sourceCommit":os.environ["GITHUB_SHA"],"runId":os.environ["GITHUB_RUN_ID"],"scope":"six exact percentage-value input contracts, old first-answer preservation, and inherited synthetic reading and storage regressions","parserRevision":2,"exactFractionRequired":True,"previousAnswersRewritten":False,"otherTaskUnitRulesChanged":False,"readingContentChanged":False,"physicalIPad":"NOT_TESTED","realChild":"NOT_RUN","independentTeachingReview":"NOT_RUN","formalLearningAcceptance":"NOT_RUN","remaining":["fallback lock abnormal exit recovery","safe simultaneous reading writes","full upgraded course and content review","complete math coverage","physical devices, child and independent educational acceptance"]}
out.mkdir(parents=True,exist_ok=True)
for name,report in {**reports,"candidate-receipt.json":receipt}.items():(out/name).write_text(json.dumps(report,ensure_ascii=False,indent=2)+"\n")
(out/"public-receipt.json").write_text(json.dumps({"revision":"RC79-FIX11","phase":"PUBLIC","result":"PENDING"},indent=2)+"\n");print(json.dumps(receipt))
