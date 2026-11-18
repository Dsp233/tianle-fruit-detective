"""Apply a frozen HOME1 overlay, sharing only hash-locked RC79 modules."""

import hashlib
import json
from pathlib import Path

SHARED_MODULES = {
    "source/competition_ui.js",
    "source/connected_learning.js",
    "source/exam_mapping.js",
    "source/periodic_practice.js",
    "source/problem_state.js",
    "source/progress_store.js",
    "source/reading_engine.js",
    "source/reading_media.js",
    "source/reading_ui.js",
    "source/selection_diagnostics.js",
    "source/source_selection_ui.js",
    "source/topic_session.js",
    "source/transfer_policy.js",
}


def overlay_source(overlay, relative):
    path = overlay / "overlay" / relative
    if relative.as_posix() in SHARED_MODULES and not path.exists():
        return overlay.parent / "rc79-fix1" / "overlay" / relative
    return path


def apply_overlay(candidate, overlay):
    manifest = json.loads((overlay / "overlay-manifest.json").read_bytes())
    contract = json.loads((candidate / "release-contract.json").read_bytes())
    if contract["buildId"] != manifest["baselineContentBuild"]:
        raise ValueError("Unexpected HOME1 build")
    files = {}
    for name, row in manifest["files"].items():
        relative = Path(name)
        if relative.is_absolute() or ".." in relative.parts or relative.parts[:1] != ("source",):
            raise ValueError(f"Invalid overlay path: {name}")
        target = candidate / relative
        baseline = row["baselineSha256"]
        actual = hashlib.sha256(target.read_bytes()).hexdigest() if target.exists() else None
        if actual != baseline or (baseline is not None and contract["sourceFiles"][name] != baseline):
            raise ValueError(f"Baseline digest mismatch: {name}")
        body = overlay_source(overlay, relative).read_bytes()
        if hashlib.sha256(body).hexdigest() != row["candidateSha256"]:
            raise ValueError(f"Overlay digest mismatch: {name}")
        files[target] = body
    for target, body in files.items():
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_bytes(body)
    print(json.dumps({"overlayFiles": len(files), "baseline": contract["buildId"]}))
