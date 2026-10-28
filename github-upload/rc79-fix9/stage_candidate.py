"""Repackage only rebuilt learning entries, preserving all other live pages."""
import importlib.util
import json
import sys
from pathlib import Path

here = Path(__file__).resolve().parent
root = Path(sys.argv[1]).resolve()
entries = ["index.html", "source/index.html", "amc8/index.html",
           "qa/index.html", "qa/normal/index.html", "qa/history/index.html"]

def load(name, path):
    spec = importlib.util.spec_from_file_location(name, path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module

package = load("fix9_package", here.parent / "rc79-fix6/package.py").Package(root)
for name in entries:
    path = root / name
    source = path.read_text(encoding="utf-8")
    if "const LearningPortal=" not in source or 'id="learning-delivery"' in source:
        raise RuntimeError("Expected a freshly built application entry: " + name)
    path.write_text(package.main(path, source), encoding="utf-8")
report = {"revision":"RC79-FIX9-PACKAGING", "pages":package.pages,
          "dataIdentities":package.identities}
path = root / "muse/rc79/loading-r1/package-report.json"
path.parent.mkdir(parents=True, exist_ok=True)
path.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
upgrade = load("fix9_upgrade", here.parent / "rc79-fix6/load2-tools/upgrade.py")
upgrade.Upgrade(root).run()
out = root / "muse/rc79/loading-r2/package-report.json"
payload = json.loads(out.read_text())
payload["revision"] = "RC79-FIX9"
payload["gradingChanged"] = True  # Relative to the frozen HOME1 content baseline.
payload["gradingChangedSincePreviousDelivery"] = False
payload["readingDiagnosticEligibilityChanged"] = "C requires a correlated original-story browser onstart event. Unverifiable legacy C is excluded from current comparisons; D boundary is preserved; original events remain unchanged."
payload["readingFeedbackChangedSincePreviousDelivery"] = True
payload["readingFeedbackChangeScope"] = "Diagnostic explanations are deferred until the material questions are answered; ordinary practice feedback is unchanged."
payload["changeScope"] = "C audio provenance and deferred diagnostic explanations; storage and ordering fixes retained; full independent acceptance pending"
payload["storageStaleFallbackLockRecovery"] = "NOT_IMPLEMENTED"
payload["readingConcurrentWrites"] = "Existing conflict strategy; comprehensive concurrency redesign pending"
payload["readingOrderDrag"] = "NOT_IMPLEMENTED"
payload["readingContentChangedSincePreviousDelivery"] = False
payload["readingEngineRevision"] = 5
out.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n")
print(json.dumps({"entries":entries,"maxPartBytes":payload["maxTransportPartBytes"],
                  "pinyinExact":payload["pinyinProjection"][0]["pinyinExact"]}))
