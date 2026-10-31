"""Repackage only rebuilt learning entries, preserving all other live pages."""
import importlib.util
import json
import shutil
import sys
import tempfile
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

package = load("fix15_package", here.parent / "rc79-fix15/package.py").Package(root)
for name in entries:
    path = root / name
    source = path.read_text(encoding="utf-8")
    if "const LearningPortal=" not in source or 'id="learning-delivery"' in source:
        raise RuntimeError("Expected a freshly built application entry: " + name)
    path.write_text(package.main(path, source), encoding="utf-8")
report = {"revision":"RC79-FIX15-PACKAGING", "pages":package.pages,
          "dataIdentities":package.identities}
path = root / "muse/rc79/loading-r1/package-report.json"
path.parent.mkdir(parents=True, exist_ok=True)
path.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
load2 = here.parent / "rc79-fix6/load2-tools"
# LOAD2 replaces the LOAD1 bootstrap. Give that final upgrade an isolated copy
# of its original tooling with the FIX15 loader, leaving historical tools intact.
with tempfile.TemporaryDirectory(prefix="fix15-load2-") as tmp:
    temp = Path(tmp)
    for name in ["upgrade.py", "compact_reading.js", "pako_inflate.min.js", "PAKO-LICENSE.txt"]:
        shutil.copyfile(load2 / name, temp / name)
    shutil.copyfile(here / "loader-r2.js", temp / "loader.js")
    upgrade = load("fix15_upgrade", temp / "upgrade.py")
    upgrade.Upgrade(root).run()
    final_loader = (temp / "loader.js").read_text(encoding="utf-8")
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
print(json.dumps({"entries":entries,"maxPartBytes":payload["maxTransportPartBytes"],
                  "pinyinExact":payload["pinyinProjection"][0]["pinyinExact"]}))
