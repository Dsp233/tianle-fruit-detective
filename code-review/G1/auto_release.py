"""Read-only, immutable-identity preflight for AMC8 Actions Pages delivery.

This tool does not deploy, approve a pull request, or authorize a ruleset change.
"""
import argparse
import json
import re
import subprocess

RELEASE_PRODUCT = "1ffdc58e6c748434efba37f1b7b1556156694923"
# Candidate #86 incorporating #88: exact product-tree identity.
APPROVED_G1 = "f9b3ae84d1158cafed600ee158be8285850a44b1"
FROZEN_ROLLBACK = "05f73af21ddf35134bb7c5e598cd75845e82baf2"
POLICY_FILES = frozenset({
    ".github/workflows/amc8-production-gate.yml",
    ".github/workflows/amc8-controlled-pages.yml",
    ".github/workflows/g1-bootstrap-integrity.yml",
    "code-review/G1/production_gate.py",
    "code-review/G1/auto_release.py",
    "code-review/G1/test_auto_release.py",
    "code-review/G1/test_production_gate.py",
    "docs/engineering/governance/G1_PRODUCTION_GATE.md",
    "docs/engineering/governance/G1_AUTOMATION_HANDOFF.md",
})


def git(*args):
    return subprocess.check_output(["git", *args], stderr=subprocess.PIPE)


def sha(value):
    if not re.fullmatch(r"[0-9a-f]{40}", value):
        raise ValueError("Expected a full, lowercase Git SHA")
    return value


def paths_changed(before, after):
    raw = git("diff", "--no-renames", "--name-only", "-z", before, after, "--")
    return set(filter(None, raw.decode("utf-8").split("\0")))


def check(mode, ref, main_sha, base=None, head=None):
    sha(ref)
    sha(main_sha)
    if mode not in ("release", "rollback"):
        raise ValueError("Unknown delivery mode")
    if (base is None) != (head is None):
        raise ValueError("PR base and head must be provided together")
    if base is not None:
        sha(base)
        sha(head)
        parents = git("show", "-s", "--format=%P", ref).decode().split()
        if parents != [base, head]:
            raise ValueError("PR test-merge parent mismatch")
    if mode == "release" and ref != main_sha:
        raise ValueError("Candidate is not current main (or recorded PR test merge)")
    if mode == "rollback" and ref != FROZEN_ROLLBACK:
        raise ValueError("Rollback ref must be the frozen pre-G1 production SHA")
    git("cat-file", "-e", ref + "^{commit}")
    git("cat-file", "-e", main_sha + "^{commit}")
    if mode == "rollback":
        if ref != FROZEN_ROLLBACK:
            raise ValueError("Rollback ref must be the frozen pre-G1 production SHA")
        drift = paths_changed(FROZEN_ROLLBACK, ref)
    else:
        if ref != main_sha:
            raise ValueError("Candidate is not current main (or recorded PR test merge)")
        drift = paths_changed(APPROVED_G1, ref) - POLICY_FILES
        reference = APPROVED_G1
        if drift:
            if not (paths_changed(RELEASE_PRODUCT, ref) - POLICY_FILES):
                drift = set()
                reference = RELEASE_PRODUCT
            elif not (paths_changed(FROZEN_ROLLBACK, ref) - POLICY_FILES):
                drift = set()
                reference = FROZEN_ROLLBACK
    if drift:
        raise ValueError("Unapproved product or data drift: " + ", ".join(sorted(drift)))
    if mode == "release":
        missing = [p for p in POLICY_FILES if
                   subprocess.run(["git", "cat-file", "-e", ref + ":" + p],
                                  stdout=subprocess.DEVNULL,
                                  stderr=subprocess.DEVNULL).returncode != 0]
        if missing:
            raise ValueError("Missing trusted policy files: " + ", ".join(sorted(missing)))
    return {"decision": "PASS", "mode": mode, "ref": ref, "main": main_sha,
            "reference": reference if mode == "release" else FROZEN_ROLLBACK,
            "productDrift": 0, "allowedPolicyFiles": len(POLICY_FILES)}


def main():
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--mode", choices=["release", "rollback"], required=True)
    ap.add_argument("--ref", required=True)
    ap.add_argument("--main", required=True)
    ap.add_argument("--base")
    ap.add_argument("--head")
    args = ap.parse_args()
    try:
        result = check(args.mode, args.ref, args.main, args.base, args.head)
    except (ValueError, subprocess.CalledProcessError, UnicodeDecodeError) as exc:
        ap.exit(1, "AMC8 automated delivery rejected: " + str(exc) + "\n")
    print(json.dumps(result, sort_keys=True))


if __name__ == "__main__":
    main()
