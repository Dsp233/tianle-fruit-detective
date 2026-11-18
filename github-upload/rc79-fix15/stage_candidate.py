"""Repackage only rebuilt learning entries, preserving all other live pages."""
import importlib.util
import json
import sys
from pathlib import Path

here = Path(__file__).resolve().parent
root = Path(sys.argv[1]).resolve()
entries = ("index.html", "source/index.html", "amc8/index.html",
           "qa/index.html", "qa/normal/index.html", "qa/history/index.html")

def load(name, path):
    spec = importlib.util.spec_from_file_location(name, path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module

package = load("fix15_package", here / "package.py").Package(root)
apps = {}
for name in entries:
    path = root / name
    source = path.read_text(encoding="utf-8")
    if "const LearningPortal=" not in source or 'id="learning-delivery"' in source:
        raise RuntimeError("Expected a freshly built application entry: " + name)
    apps[name] = package.pack_app(path, source)
report = {"revision":"RC79-FIX15-PACKAGING", "pages":package.pages,
          "dataIdentities":package.identities}
path = root / "muse/rc79/loading-r1/package-report.json"
path.parent.mkdir(parents=True, exist_ok=True)
path.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
loader_path = here / "loader-r2.js"
upgrade = load("fix15_upgrade", here.parent / "rc79-fix6/load2-tools/upgrade.py")
upgrade.Upgrade(root, loader_path=loader_path).run(apps=apps)
final_loader = loader_path.read_text(encoding="utf-8")
for name in entries:
    if (root / name).read_text(encoding="utf-8").count(final_loader) != 1:
        raise RuntimeError("Final packaged entry does not contain the tested FIX15 loader exactly once: " + name)
out = root / "muse/rc79/loading-r2/package-report.json"
payload = json.loads(out.read_text())
payload["revision"] = "RC79-FIX15"
payload["gradingChanged"] = True  # Relative to the frozen HOME1 content baseline.
payload["gradingChangedSincePreviousDelivery"] = False
payload["readingDiagnosticEligibilityChanged"] = "C requires a correlated original-story browser onstart event. Unverifiable legacy C is excluded from current comparisons; D boundary is preserved; original events remain unchanged."
payload["readingFeedbackChangedSincePreviousDelivery"] = False
payload["readingFeedbackChangeScope"] = "No feedback changes in FIX15."
payload["changeScope"] = "Back up exact pre-upgrade reading record before content migration; include it in unified export. No math or grading changes."
payload["storageStaleFallbackLockRecovery"] = "NOT_IMPLEMENTED: mathematics fallback retains the tested lifetime claim"
payload["readingConcurrentWrites"] = "Serialized compare-and-write for updated reading pages; old cached pages remain a limitation"
payload["readingOrderDrag"] = "Mouse and synthetic touch pointer checks required; physical iPad remains untested"
payload["readingContentChangedSincePreviousDelivery"] = False
payload["readingEngineRevision"] = 7
out.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n")
print(json.dumps({"entries":entries,"load1Compresses":len(package.packet_assets),
                  "load1Extractions":len(package.app_packets),
                  "maxPartBytes":payload["maxTransportPartBytes"],
                  "pinyinExact":payload["pinyinProjection"][0]["pinyinExact"]}))
