"""Create an honest focused receipt for the FIX9 candidate."""
import json,os
from pathlib import Path
out=Path.cwd()/"muse/rc79/fix9";e=Path("/tmp/fix9-evidence")
names=["storage-browser.json","diagnostic-c-browser.json","diagnostic-d-browser.json","reading-order-browser.json","smoke-result.json","public-interaction.json","reading-feedback-browser.json","engine-test-results.json","diagnostic-integration.json"]
reports={name:json.loads((e/name).read_text()) for name in names}
assert reports["storage-browser.json"]["result"]=="PASS_WITH_REMAINING_WORK"
assert reports["diagnostic-integration.json"]["result"]=="PARTIAL_PASS" and reports["diagnostic-integration.json"]["populations"]["diagnosticQuestions"]==208
for name in names[1:-1]: assert reports[name]["result"]=="PASS",name
assert reports["engine-test-results.json"]["total"]==45 and reports["engine-test-results.json"]["passed"]==45
for name in ["diagnostic-c-browser.json","diagnostic-d-browser.json","reading-order-browser.json"]:assert {x["engine"] for x in reports[name]["checks"]}=={"chromium","webkit"},name
receipt={"revision":"RC79-FIX9","phase":"CANDIDATE","result":"PASS_WITH_REMAINING_WORK","sourceCommit":os.environ["GITHUB_SHA"],"runId":os.environ["GITHUB_RUN_ID"],"scope":"C original-story browser-start attribution, historical report compatibility, deferred diagnostic explanations and focused inherited regressions","diagnosticIntegration":"13 sets, 52 forms, 208 questions, synthetic speech callbacks","historicalRecordRewritten":False,"historyCComparison":"Previous eligible C is excluded from current comparison if original-story playback provenance cannot be verified","onstartGuarantee":"Browser callback indicates start only, not audible output, completion or comprehension","readingContentChanged":False,"pilotContentPublished":False,"drag":"NOT_IMPLEMENTED","physicalIPad":"NOT_TESTED","actualAudio":"NOT_TESTED","realChildObservation":"NOT_RUN","independentTeachingReview":"NOT_RUN","formalLearningAcceptance":"NOT_RUN","remaining":["Persistent fallback claim after owner terminates without close needs safe recovery","Concurrent reading writes still use the existing conflict strategy","Order drag interaction not implemented","Seven-day sample requires media review and integration"]}
out.mkdir(parents=True,exist_ok=True)
for name,report in {**reports,"candidate-receipt.json":receipt}.items():(out/name).write_text(json.dumps(report,ensure_ascii=False,indent=2)+"\n")
(out/"public-receipt.json").write_text(json.dumps({"revision":"RC79-FIX9","phase":"PUBLIC","result":"PENDING"},indent=2)+"\n")
print(json.dumps(receipt))
