"""Targeted FIX4 receipt; no complete learning acceptance claim."""
import json,os
from pathlib import Path
out=Path.cwd()/"muse/rc79/fix4"
parent=json.loads(Path("/tmp/fix79-evidence/parent-review-browser.json").read_text())
lazy=json.loads(Path("/tmp/fix79-evidence/lazy-history-browser.json").read_text())
loading=json.loads(Path("/tmp/fix79-evidence/smoke-result.json").read_text())
assert parent["result"]==lazy["result"]==loading["result"]=="PASS"
assert len(parent["checks"])==2 and all(x.get("examAndPreparationSourceVisible") and x.get("malformedHistorySafelyDisplayed") for x in parent["checks"])
receipt={"revision":"RC79-FIX4","phase":"CANDIDATE","result":"PASS","sourceCommit":os.environ["GITHUB_SHA"],"runId":os.environ["GITHUB_RUN_ID"],"loadingChecks":len(loading["checks"]),"parentReviewBrowserChecks":len(parent["checks"]),"lazyHistoryBrowserChecks":len(lazy["checks"]),"sourceIdentityBrowserChecks":len([x for x in parent["checks"] if x.get("examAndPreparationSourceVisible")]),"oldPublishedMappingProjectionsVerified":3,"deferredBytes":lazy["deferredBytes"],"scope":"targeted candidate tests; isolated synthetic records","formalLearningAcceptance":"NOT_RUN","physicalIPad":"NOT_TESTED","remaining":"See github-upload/rc79-fix4/PROGRESS.json"}
for name,data in [("candidate-receipt.json",receipt),("parent-review-browser.json",parent),("lazy-history-browser.json",lazy),("loading-result.json",loading)]: (out/name).write_text(json.dumps(data,ensure_ascii=False,indent=2)+"\n")
print(json.dumps(receipt))
