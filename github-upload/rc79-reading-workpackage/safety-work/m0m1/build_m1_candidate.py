"""Build the isolated M1 mathematics candidate with the frozen W1 reading data."""
import argparse
import hashlib
import json
from pathlib import Path
import subprocess
import sys

from restore_w1_source import MANIFEST, restore

PATCH_INPUTS = (
    "app.js", "curriculum_ui.js", "demo_ui.js", "staged_ui.js", "joint_families.json", "joint_extended.js",
    "joint_reuse_review.js", "competition_reviewed.js",
    "competition_design.js", "variation_state.js", "competition_design_oracles.js",
    "competition_content_contracts.js", "teaching_skill_contracts.js", "version.json",
)
PRESERVED = ("progress_store.js", "reading_data.js", "reading_engine.js", "reading_ui.js")
MAPPING = "exam_runtime_index.json"


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def compile_source(source):
    command = (
        "import build_reading, runpy; "
        "build_reading.build = lambda **kwargs: None; "
        "runpy.run_path('build.py', run_name='__main__')"
    )
    subprocess.run([sys.executable, "-c", command], cwd=source, check=True)


def build(archive, destination):
    restore(archive, destination)
    source = destination.resolve() / "source"
    inventory = json.loads((destination / MANIFEST).read_bytes())["files"]
    compile_source(source)
    baseline = destination / "index.html"
    assert sha(baseline) == "463ded01d3d17c9ca6b1b726d973419838643224cb888390ae85a0609fa9a11e"
    baseline.rename(destination / "w1-baseline.html")
    mapping_path = source / MAPPING
    assert sha(mapping_path) == inventory[f"source/{MAPPING}"]
    original_mapping = json.loads(mapping_path.read_bytes())
    original_mapping_id = original_mapping["mappingBuildId"]
    assert all(sha(source / name) == inventory[f"source/{name}"] for name in PATCH_INPUTS)
    patch = Path(__file__).resolve().with_name("m1-demo-previous.patch")
    subprocess.run(
        ["patch", "--batch", "--forward", "--fuzz=0", "-p0", "-i", str(patch)],
        cwd=source, check=True,
    )
    compile_source(source)
    assert all(sha(source / name) == inventory[f"source/{name}"] for name in PRESERVED)
    # The compatibility adapter is a compiler input. Keep its new provenance
    # while requiring every question, mapping, scope and eligibility field to match W1.
    candidate_mapping = json.loads(mapping_path.read_bytes())
    candidate_mapping_id = candidate_mapping["mappingBuildId"]
    assert candidate_mapping_id != original_mapping_id
    original_mapping["mappingBuildId"] = candidate_mapping_id
    original_mapping["inputFiles"]["joint_reuse_review.js"] = sha(source / "joint_reuse_review.js")
    assert candidate_mapping == original_mapping, "unexpected change to the exam mapping"
    print(json.dumps({
        "status": "M1_CANDIDATE_NOT_DEPLOYED",
        "baseSource": "f935008b75d79cfc44610b197122c01e1b6b9a6e",
        "entrySha256": sha(destination / "index.html"),
        "patchSha256": sha(patch),
        "mappingProvenance": {"frozen": original_mapping_id, "candidate": candidate_mapping_id},
        "preserved": {name: sha(source / name) for name in PRESERVED},
    }))


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("archive", type=Path)
    parser.add_argument("destination", type=Path)
    args = parser.parse_args()
    build(args.archive, args.destination)
