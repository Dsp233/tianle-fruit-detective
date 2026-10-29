import json,os
from pathlib import Path
out=Path.cwd()/"muse/rc79/fix10";e=Path("/tmp/fix10-evidence")
names=["storage-browser.json","diagnostic-c-browser.json","diagnostic-d-browser.json","reading-order-browser.json","reading-routes-browser.json","smoke-result.json","reading-feedback-browser.json","engine-test-results.json","full-reading-integration.json"]
reports={name:json.loads((e/name).read_text()) for name in names}
assert reports["storage-browser.json"]["result"]=="PASS_WITH_REMAINING_WORK"
full=reports["full-reading-integration.json"];assert full["result"]=="PASS" and full["completeSuite"] and full["populations"]["courseQuestions"]==840 and full["populations"]["diagnosticQuestions"]==208 and full["populations"]["dailyRoutes"]==84
for name in names[1:7]:assert reports[name]["result"]=="PASS",name
assert reports["engine-test-results.json"]["passed"]==45 and reports["engine-test-results.json"]["total"]==45
for name in ["diagnostic-c-browser.json","diagnostic-d-browser.json","reading-order-browser.json","reading-routes-browser.json"]:assert {x["engine"] for x in reports[name]["checks"]}=={"chromium","webkit"},name
receipt={"revision":"RC79-FIX10","phase":"CANDIDATE","result":"PASS_WITH_REMAINING_WORK","sourceCommit":os.environ["GITHUB_SHA"],"runId":os.environ["GITHUB_RUN_ID"],"scope":"language-assisted practice suggestions, labelled review and opt-in unseen daily passage; complete synthetic reading-bank and focused inherited regressions","languageAssistanceNotIndependent":True,"originalAnswersRewritten":False,"calendarReviewPreserved":True,"newPassageDoesNotCompleteFullDay":True,"readingContentChanged":False,"priorSuiteFailure":"Full-bank suite first failed because it expected sorting cards not to move; the corrected assertion verifies that their displayed order matches the selected order. The initial failure is retained in the source evidence.","physicalIPad":"NOT_TESTED","realChild":"NOT_RUN","independentTeachingReview":"NOT_RUN","formalLearningAcceptance":"NOT_RUN","remaining":["fallback lock abnormal exit recovery","safe simultaneous reading writes","direct drag sorting","complete content review and expansion","physical devices, child and independent educational acceptance"]}
out.mkdir(parents=True,exist_ok=True)
for name,report in {**reports,"candidate-receipt.json":receipt}.items():(out/name).write_text(json.dumps(report,ensure_ascii=False,indent=2)+"\n")
(out/"public-receipt.json").write_text(json.dumps({"revision":"RC79-FIX10","phase":"PUBLIC","result":"PENDING"},indent=2)+"\n")
print(json.dumps(receipt))
