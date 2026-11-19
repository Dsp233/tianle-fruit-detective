"""Verify the GitHub test merge against the signed-off G1 candidate."""

import argparse
import json
import re
import subprocess


REFERENCE = "a25e0fbe7857b3b12ab5aef3a8ad6c79d285b78a"
REHEARSAL = "codex/g1-production-gate-rehearsal-20261119"
CONTROL_FILES = {
    ".github/workflows/amc8-production-gate.yml",
    "code-review/G1/production_gate.py",
    "docs/engineering/governance/G1_PRODUCTION_GATE.md",
}


def git(*args):
    return subprocess.check_output(["git", *args], text=True)


def changed_paths(base, candidate):
    return set(git("diff", "--no-renames", "--name-only", "-z", base, candidate, "--").split("\0")[:-1])


def verify(target, base, head, merge):
    if any(not re.fullmatch(r"[0-9a-f]{40}", sha) for sha in (base, head, merge)):
        raise ValueError("Expected full Git commit SHAs")
    parents = git("show", "-s", "--format=%P", merge).split()
    if parents != [base, head]:
        raise ValueError("Test merge parents differ from this pull request base and head")
    if target == "main":
        control_changes = changed_paths(base, merge) & CONTROL_FILES
        if control_changes:
            raise ValueError("Production control changes require a separately reviewed policy update")
    elif target != REHEARSAL or base != REFERENCE:
        raise ValueError("Unexpected rehearsal base")

    drift = changed_paths(REFERENCE, merge) - CONTROL_FILES
    if drift:
        raise ValueError("Changes outside the accepted Git tree: " + ", ".join(sorted(drift)))

    return {"result": "PASS", "target": target, "reference": REFERENCE, "base": base,
            "head": head, "testMerge": merge, "tree": git("rev-parse", f"{merge}^{{tree}}").strip()}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    for field in ("target", "base", "head", "merge"):
        parser.add_argument("--" + field, required=True)
    args = parser.parse_args()
    try:
        result = verify(args.target, args.base, args.head, args.merge)
    except (ValueError, subprocess.CalledProcessError) as exc:
        parser.exit(1, f"AMC8 production gate rejected: {exc}\n")
    print(json.dumps(result, sort_keys=True))


if __name__ == "__main__":
    main()
