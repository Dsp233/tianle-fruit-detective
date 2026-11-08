"""Build the isolated M1 mathematics candidate with the frozen W1 reading data."""
import argparse
import hashlib
import json
from pathlib import Path
import runpy
import subprocess
import sys

from restore_w1_source import MANIFEST, restore

PATCH_INPUTS = (
    "app.js", "demo_ui.js", "joint_families.json", "competition_reviewed.js",
    "competition_design.js", "variation_state.js", "competition_design_oracles.js",
    "competition_content_contracts.js",
)
PRESERVED = ("exam_runtime_index.json", "progress_store.js", "reading_data.js", "reading_engine.js", "reading_ui.js")


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def build(archive, destination):
    restore(archive, destination)
    source = destination.resolve() / "source"
    inventory = json.loads((destination / MANIFEST).read_bytes())["files"]
    assert all(sha(source / name) == inventory[f"source/{name}"] for name in PATCH_INPUTS)
    patch = Path(__file__).resolve().with_name("m1-demo-previous.patch")
    subprocess.run(
        ["patch", "--batch", "--forward", "--fuzz=0", "-p0", "-i", str(patch)],
        cwd=source, check=True,
    )
    sys.path.insert(0, str(source))
    import build_reading

    build_reading.build = lambda **kwargs: None
    sys.argv = [str(source / "build.py")]
    runpy.run_path(str(source / "build.py"), run_name="__main__")
    assert all(sha(source / name) == inventory[f"source/{name}"] for name in PRESERVED)
    print(json.dumps({
        "status": "M1_CANDIDATE_NOT_DEPLOYED",
        "baseSource": "f935008b75d79cfc44610b197122c01e1b6b9a6e",
        "entrySha256": sha(destination / "index.html"),
        "patchSha256": sha(patch),
        "preserved": {name: sha(source / name) for name in PRESERVED},
    }))


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("archive", type=Path)
    parser.add_argument("destination", type=Path)
    args = parser.parse_args()
    build(args.archive, args.destination)
