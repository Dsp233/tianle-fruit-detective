"""Check the read-only controls and accepted runtime of the G1 follow-up."""

import argparse
import json
from pathlib import Path
import subprocess

import yaml


ROOT = Path(__file__).resolve().parents[2]
RUNTIME = "tools/g1-runtime-lock.tsv"
SOURCE = "tools/g1-source-lock.json"
LEDGER = "docs/engineering/governance/g1-source-build/approved-runtime-diff.json"
WORKFLOWS = (
    ".github/workflows/g1-quality-foundation.yml",
    ".github/workflows/g1-source-build-intake.yml",
    ".github/workflows/w1-illustration.yml",
    ".github/workflows/w1-reading-quality.yml",
)
RISK_PATHS = {
    "math": ("canonical/w1/source/math_", "github-upload/rc79-fix15/overlay/source/", "qa/"),
    "reading": ("canonical/w1/source/reading_", "reading-art/", "reading-quality/", "assets/reading-"),
    "storage": ("canonical/w1/source/progress_store.js", "source/progress_store.js", "source/storage_namespaces.js"),
    "review": ("review-overlay.", "q0-production-identity.json"),
    "build": ("tools/g1_", "tools/build_site.py", "tools/g1-", "canonical/w1/", "reading-art/build.py"),
    "workflow": (".github/workflows/",),
    "release": ("release/", ".github/workflows/", "tools/g1-runtime-lock.tsv"),
}


def git(*args):
    return subprocess.check_output(["git", *args], cwd=ROOT)


def protected_paths(runtime, ledger):
    rows = runtime.splitlines()
    if not rows or rows.pop(0) != "producer\tcr5_sha256\tpath":
        raise ValueError("Unexpected runtime lock header")
    return {row.split("\t", 2)[2] for row in rows} | ledger["runtime"].keys() | {RUNTIME, SOURCE, LEDGER}


def check_frozen_runtime(changes, protected):
    drift = sorted(path for path in changes if path in protected or
                   path.startswith(("assets/g1-runtime/", "canonical/w1/")))
    if drift:
        raise ValueError("Frozen runtime or identity files changed: " + ", ".join(drift))


def check_workflow(path, body):
    workflow = yaml.load(body, Loader=yaml.BaseLoader)
    if not isinstance(workflow, dict) or workflow.get("permissions") != {"contents": "read"}:
        raise ValueError(f"{path}: grant only contents: read at workflow level")
    events = workflow["on"]
    if "pull_request" not in events or "pull_request_target" in events:
        raise ValueError(f"{path}: require pull_request without pull_request_target")
    if not workflow["jobs"]:
        raise ValueError(f"{path}: no verification jobs")
    for name, job in workflow["jobs"].items():
        where = f"{path}:{name}"
        if "uses" in job or job.get("permissions", workflow["permissions"]) != {"contents": "read"}:
            raise ValueError(f"{where}: reusable or elevated job outside the reviewed policy")
        if not job["steps"]:
            raise ValueError(f"{where}: empty verification job")
        for step in job["steps"]:
            if step.get("uses", "").startswith("actions/checkout@"):
                if step.get("with", {}).get("persist-credentials") != "false":
                    raise ValueError(f"{where}: checkout leaves credentials persisted")


def affected_checks(changes):
    affected = {}
    for path in changes:
        matches = [risk for risk, prefixes in RISK_PATHS.items() if path.startswith(prefixes)]
        if matches:
            affected[path] = matches
        elif not path.startswith(("docs/", "code-review/")):
            affected[path] = ["unmapped: manual applicability review"]
    return affected


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--base", required=True, help="Accepted G1 SHA")
    args = parser.parse_args()
    try:
        base = git("rev-parse", "--verify", "--end-of-options", args.base + "^{commit}").decode().strip()
        git("merge-base", "--is-ancestor", base, "HEAD")
        changes = git("diff", "--no-renames", "--name-only", "-z", base, "HEAD", "--")
        paths = changes.decode().split("\0")[:-1]
        runtime = git("show", f"{base}:{RUNTIME}").decode()
        ledger = json.loads(git("show", f"{base}:{LEDGER}"))
        check_frozen_runtime(paths, protected_paths(runtime, ledger))
        for path in WORKFLOWS:
            check_workflow(path, git("show", f"HEAD:{path}"))
    except (ValueError, KeyError, IndexError, TypeError, yaml.YAMLError, subprocess.CalledProcessError) as exc:
        parser.exit(1, f"G1 foundation rejected: {exc}\n")
    print(json.dumps({"result": "PASS", "base": base, "readOnlyWorkflows": WORKFLOWS,
                      "frozenRuntimeChanged": False, "affectedChecks": affected_checks(paths)}, indent=2))


if __name__ == "__main__":
    main()
