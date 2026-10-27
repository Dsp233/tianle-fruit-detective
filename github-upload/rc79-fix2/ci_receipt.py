"""Record candidate tests without claiming formal acceptance."""
import json
import os
from pathlib import Path

root=Path.cwd()
out=root/"muse/rc79/fix2"
browser=json.loads(Path("/tmp/fix79-evidence/fix79-browser-result.json").read_text())
loading=json.loads(Path("/tmp/fix79-evidence/smoke-result.json").read_text())
parent=json.loads(Path("/tmp/fix79-evidence/parent-review-browser.json").read_text())
assert browser["result"]==loading["result"]==parent["result"]=="PASS"
receipt={"revision":"RC79-FIX2","phase":"CANDIDATE","result":"PASS",
         "sourceCommit":os.environ["GITHUB_SHA"],"runId":os.environ["GITHUB_RUN_ID"],
         "browserChecks":len(browser["checks"]),"loadingChecks":len(loading["checks"]),"parentReviewBrowserChecks":len(parent["checks"]),
         "scope":"targeted candidate tests; isolated synthetic records",
         "formalLearningAcceptance":"NOT_RUN","physicalIPad":"NOT_TESTED",
         "remaining":"See github-upload/rc79-fix2/PROGRESS.json"}
(out/"candidate-receipt.json").write_text(json.dumps(receipt,ensure_ascii=False,indent=2)+"\n")
(out/"browser-result.json").write_text(json.dumps(browser,ensure_ascii=False,indent=2)+"\n")
(out/"loading-result.json").write_text(json.dumps(loading,ensure_ascii=False,indent=2)+"\n")
print(json.dumps(receipt))
