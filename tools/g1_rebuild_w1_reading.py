"""Rebuild the frozen W1 reading seed from separately supplied R1 source files."""

import argparse
import hashlib
import json
from pathlib import Path
import subprocess
import sys
import tempfile


ROOT = Path(__file__).resolve().parents[1]
WORKPACKAGE = "bb0f4e0c2a16827628cb130afd02654e92a7db49"
PILOT = "98cfd12797013845c4771719778b9b5f62214308"
COURSE_TOOLS = "github-upload/rc79-reading-workpackage/safety-work/wp-course-data"
HOME1_INPUTS = {
    "build_reading.py": "834b3a08f75d81c3b0a7462da8251f034208a39a64e456e439eefbe34f28ec3a",
    "reading_engine.js": "53e793e38b55519923d53dc3618af206fa3e1ca31a630e3805da9f49a1a51591",
    "reading_ui.js": "c5e093b6cbcc2ce538c7c08662f73a5d9d676a41ef0a6edf078a2f21e4eb9d44",
    "reading_media.js": "9aebc47edfdd77f7d03917bc7236890d6666a0fc425eecf02ce899a96665b327",
    "reading/content_weeks_1_4.json": "a9232b5319cccdc39e73a819c731a1b3491a328ebce4a03f5e07381ba1e032e9",
    "reading/content_weeks_5_8.json": "e575104f02700a71e5d11f147ce7f2695ddfbab290962342007945436aa3d3fe",
    "reading/content_weeks_9_12.json": "b523382f731de75b031a053b246c1d9f2a88baec0ca5a01871dfa8089d806a80",
    "reading/weeks.json": "17eb17023852b805a391770e331ae6a225506af4a86493cef933c7c4f8b1e774",
    "reading/diagnostics.json": "414bd124152cb061a458e161a6a36004dd1a2a6ca67de7e75075d29be4240574",
    "reading/storyboard_review.json": "2a68d54dcc418cd00eee947f9ed026d01633d707ff31e9f39e08d400979d1ad4",
    "reading/pinyin_overrides.json": "434e474904afd183e71f38adc5bf03c5a3d27a4674baff694aabffda498bbdd1",
    "reading/content_compatibility.json": "2fbeae081923bf04504641a748912020aa715e73c68deccd2d97e8d8c9da5920",
    "reading/pinyin_context_review.json": "d3f56261f910c84d4ab233c702ba94fa6e811432782939bffff81338a93b3594",
}
R1_SHA256 = "0c8ad843af039308d749ce44f75ad74577b5fce96ffd009e18f770b13c849358"
W1_SHA256 = "bab0526fa3f45975511b2336a3f482fc2d6675a6ec74cc4b490c27fa881e4c4a"


def checked_bytes(path, expected):
    body = path.read_bytes()
    if hashlib.sha256(body).hexdigest() != expected:
        raise ValueError(f"SHA-256 mismatch: {path}")
    return body


def copy_pinned_git(commit, path, output):
    body = subprocess.check_output(["git", "show", f"{commit}:{path}"], cwd=ROOT)
    output.write_bytes(body)


def rebuild(input_dir):
    with tempfile.TemporaryDirectory(prefix="amc8-w1-reading-") as scratch:
        root = Path(scratch)
        r1 = root / "r1"
        (r1 / "reading").mkdir(parents=True)
        for name, digest in HOME1_INPUTS.items():
            (r1 / name).write_bytes(checked_bytes(input_dir / name, digest))
        subprocess.run([sys.executable, "-B", "build_reading.py"], cwd=r1, check=True)
        baseline = r1 / "reading_data.js"
        checked_bytes(baseline, R1_SHA256)

        r2 = root / "r2"
        r2.mkdir()
        for name in ("build_course.py", "extract_pinyin_fixture.py",
                     "apply_pinyin_corrections.py", "pinyin_corrections.json"):
            copy_pinned_git(WORKPACKAGE, f"{COURSE_TOOLS}/{name}", r2 / name)
        copy_pinned_git(PILOT, "github-upload/rc79-pilot-v11/story.json", r2 / "story.json")
        copy_pinned_git(PILOT, "pilot-reading-v5/index.html", r2 / "pilot.html")
        subprocess.run([sys.executable, "-B", "extract_pinyin_fixture.py",
                        "pilot.html", "fixture.json"], cwd=r2, check=True)
        subprocess.run([sys.executable, "-B", "build_course.py", "--story", "story.json",
                        "--baseline", str(baseline), "--pinyin", "fixture.json",
                        "--out-dir", "."], cwd=r2, check=True)
        return checked_bytes(r2 / "candidate_reading_data.js", W1_SHA256)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--r1-source-dir", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True, help="New file in an isolated build directory")
    args = parser.parse_args()
    if args.output.resolve().is_relative_to(ROOT) or args.output.exists():
        parser.error("Output must be a new file outside the repository")
    try:
        payload = rebuild(args.r1_source_dir)
        with args.output.open("xb") as stream:
            stream.write(payload)
    except (ValueError, OSError, subprocess.CalledProcessError) as exc:
        print(f"W1 reading seed rebuild rejected: {exc}", file=sys.stderr)
        return 1
    print(json.dumps({"bytes": len(payload), "r1Sha256": R1_SHA256, "w1Sha256": W1_SHA256}))
    return 0


if __name__ == "__main__":
    sys.exit(main())
