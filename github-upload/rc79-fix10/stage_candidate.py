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

package = load("fix10_package", here.parent / "rc79-fix6/package.py").Package(root)
for name in entries:
    path = root / name
    source = path.read_text(encoding="utf-8")
    if "const LearningPortal=" not in source or 'id="learning-delivery"' in source:
        raise RuntimeError("Expected a freshly built application entry: " + name)
    path.write_text(package.main(path, source), encoding="utf-8")
report = {"revision":"RC79-FIX10-PACKAGING", "pages":package.pages,
          "dataIdentities":package.identities}
path = root / "muse/rc79/loading-r1/package-report.json"
path.parent.mkdir(parents=True, exist_ok=True)
path.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
upgrade = load("fix10_upgrade", here.parent / "rc79-fix6/load2-tools/upgrade.py")
upgrade.Upgrade(root).run()
out = root / "muse/rc79/loading-r2/package-report.json"
payload = json.loads(out.read_text())
payload["revision"] = "RC79-FIX10"
payload["gradingChanged"] = True  # Relative to the frozen HOME1 content baseline.
payload["gradingChangedSincePreviousDelivery"] = False
payload["readingDiagnosticEligibilityChanged"] = "C requires a correlated original-story browser onstart event. Unverifiable legacy C is excluded from current comparisons; D boundary is preserved; original events remain unchanged."
payload["readingFeedbackChangedSincePreviousDelivery"] = False
payload["readingFeedbackChangeScope"] = "No feedback changes in FIX10."
payload["changeScope"] = "Language-assisted practice suggestions, visible review provenance, an optional unseen passage, and drag handles for order cards; no reading content or prior evidence rewriting."
payload["storageStaleFallbackLockRecovery"] = "NOT_IMPLEMENTED"
payload["readingConcurrentWrites"] = "Existing conflict strategy; comprehensive concurrency redesign pending"
payload["readingOrderDrag"] = "Mouse and synthetic touch pointer checks required; physical iPad remains untested"
payload["readingContentChangedSincePreviousDelivery"] = False
payload["readingEngineRevision"] = 6
out.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n")
print(json.dumps({"entries":entries,"maxPartBytes":payload["maxTransportPartBytes"],
                  "pinyinExact":payload["pinyinProjection"][0]["pinyinExact"]}))
