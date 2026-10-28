"""Record the exact scope of focused synthetic candidate tests."""
import json, os
from pathlib import Path
out=Path.cwd()/"muse/rc79/fix8";e=Path("/tmp/fix8-evidence")
names=["storage-browser.json","reading-order-browser.json","smoke-result.json","public-interaction.json","reading-feedback-browser.json","diagnostic-d-browser.json","engine-test-results.json"]
reports={name:json.loads((e/name).read_text()) for name in names}
assert reports["storage-browser.json"]["result"]=="PASS_WITH_REMAINING_WORK"
for name in names[1:]: assert reports[name]["result"]=="PASS", name
assert reports["engine-test-results.json"]["total"]==45 and reports["engine-test-results.json"]["passed"]==45
for id in ["native_pending_reacquisition","changed_baseline_never_overwritten","quota_retry","fallback_clean_release_pending_retry","math_ui_pending_retry_and_reload","math_ui_conflict_export_preserves_both","reading_conflict_ui_and_export","reading_quota_retry_and_reload"]:
 assert {x["engine"] for x in reports["storage-browser.json"]["checks"] if x["id"]==id and x["result"]=="PASS"}=={"chromium","webkit"},id
assert {x["engine"] for x in reports["storage-browser.json"]["checks"] if x["id"]=="fallback_owner_destroyed_without_release" and x["result"]=="STILL_OPEN"}=={"chromium","webkit"}
assert {x["engine"] for x in reports["reading-order-browser.json"]["checks"]}=={"chromium","webkit"}
receipt={"revision":"RC79-FIX8","phase":"CANDIDATE","result":"PASS_WITH_REMAINING_WORK","sourceCommit":os.environ["GITHUB_SHA"],"runId":os.environ["GITHUB_RUN_ID"],"scope":"Focused synthetic storage, reading save UI, tap ordering, loading and compatibility regressions", "readingEngineSuite":"45/45 after configuring known prerequisites in four synthetic fixtures; the unknown-prerequisite negative case remains", "historicalRecordRewritten":False,"contentChanged":False,"pilotContentPublished":False,"drag":"NOT_IMPLEMENTED", "physicalIPad":"NOT_TESTED","actualAudio":"NOT_TESTED","realChildObservation":"NOT_RUN","independentTeachingReview":"NOT_RUN","formalLearningAcceptance":"NOT_RUN", "remaining":["Persistent fallback claim after owner terminates without close needs safe recovery", "Concurrent reading writes still use the existing conflict strategy", "Order drag interaction not implemented", "Content inventory is unaudited; seven-day draft not integrated"]}
out.mkdir(parents=True,exist_ok=True)
for name, report in {**reports,"candidate-receipt.json":receipt}.items(): (out/name).write_text(json.dumps(report,ensure_ascii=False,indent=2)+"\n")
(out/"public-receipt.json").write_text(json.dumps({"revision":"RC79-FIX8","phase":"PUBLIC","result":"PENDING","note":"Public checks have not yet been recorded here."},indent=2)+"\n")
print(json.dumps(receipt))
