"""Verify a GitHub test merge against the accepted release or rollback tree."""

import argparse
import json
import re
import subprocess


REFERENCE = "1ffdc58e6c748434efba37f1b7b1556156694923"
# Independently validated #86 after #88; exact frozen product-tree identity.
APPROVED_G1 = "76709a9058bf4e940dadabcf5f13e2c4603e666b"
# Proposed exact successor identities. Activate only after integration acceptance.
APPROVED_M = "cd34e02035d7bc62cbde9a4a39b1a0dac7492709"
APPROVED_W2 = "2a94f29d5f0b47a7c80f503d6479ce5d4332430c"
APPROVED_PF = "6a8b7ea235154223bc78a9961d20d9c77b7ecf20"
APPROVED_R11_C = "27138591a1f8d050abfb66fb3411d8922dfca584"
APPROVED_R11_C_TEACHING = "68411c7a540857f60e2c11f6ac290082799b521d"
APPROVED_SUCCESSORS = (APPROVED_M, APPROVED_W2, APPROVED_PF, APPROVED_R11_C, APPROVED_R11_C_TEACHING)
ROLLBACK = "05f73af21ddf35134bb7c5e598cd75845e82baf2"
REHEARSAL_BASE = "a25e0fbe7857b3b12ab5aef3a8ad6c79d285b78a"
REHEARSAL = "codex/g1-production-gate-rehearsal-20261119"
CONTROL_FILES = {
    ".github/workflows/amc8-production-gate.yml",
    ".github/workflows/amc8-controlled-pages.yml",
    ".github/workflows/g1-bootstrap-integrity.yml",
    "code-review/G1/production_gate.py",
    "code-review/G1/auto_release.py",
    "code-review/G1/test_auto_release.py",
    "code-review/G1/test_production_gate.py",
    "docs/engineering/governance/G1_PRODUCTION_GATE.md",
    "docs/engineering/governance/G1_AUTOMATION_HANDOFF.md",
}


def git(*args):
    return subprocess.check_output(["git", *args], text=True)


def changed_paths(base, candidate):
    return set(git("diff", "--no-renames", "--name-only", "-z", base, candidate, "--").split("\0")[:-1])


def product_drift(reference, candidate):
    return changed_paths(reference, candidate) - CONTROL_FILES


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
    elif target != REHEARSAL or base != REHEARSAL_BASE:
        raise ValueError("Unexpected rehearsal base")

    # Accept only byte-identical product trees. Engineering policy paths remain
    # separately reviewed; this does not create a general W1 path exemption.
    reference = APPROVED_G1
    action = "release"
    drift = product_drift(APPROVED_G1, merge)
    if drift:
        if not product_drift(REFERENCE, merge):
            reference = REFERENCE
            drift = set()
        elif not product_drift(ROLLBACK, merge):
            reference = ROLLBACK
            action = "rollback" if product_drift(ROLLBACK, base) else "baseline"
            drift = set()
    if drift:
        for successor in APPROVED_SUCCESSORS:
            if not product_drift(successor, merge):
                reference = successor
                drift = set()
                break
    if drift:
        raise ValueError("Changes outside the accepted Git tree: " + ", ".join(sorted(drift)))

    return {"result": "PASS", "action": action, "target": target, "reference": reference, "base": base,
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
