"""Verify the workflow-only G1 permission migration against its accepted base."""

import argparse
from copy import deepcopy
import json
from pathlib import Path
import re
import subprocess

import yaml

from quality_foundation import check_workflow, git


BASE = "a25e0fbe7857b3b12ab5aef3a8ad6c79d285b78a"
DIR = ".github/workflows/"
CHECK = DIR + "g1-ci-permissions.yml"
ISOLATED_BASE = "codex/g1-quality-foundation-20261119"
SOURCES = {
    "code-review/G1/ci_permissions.py",
    "code-review/G1/test_ci_permissions.py",
    "docs/engineering/governance/G1_CI_PERMISSION_RECEIPT.md",
}


def load_workflow(body):
    return yaml.load(body, Loader=yaml.BaseLoader)


def restrict_workflow(workflow):
    default = workflow["permissions"].copy()
    if default.get("contents") == "write":
        workflow["permissions"]["contents"] = "read"
    for job in workflow["jobs"].values():
        permissions = job.get("permissions", default)
        if permissions.get("contents") == "write":
            job["permissions"] = permissions
            continue
        for step in job["steps"]:
            if step.get("uses", "").startswith("actions/checkout@"):
                step.setdefault("with", {})["persist-credentials"] = "false"
    return workflow


def verify_workflow(path, original, candidate):
    if candidate != restrict_workflow(deepcopy(original)):
        raise ValueError(f"{path}: change outside permission and checkout migration")
    if any(scope != "read" for scope in candidate["permissions"].values()):
        raise ValueError(f"{path}: elevated workflow default")
    for name, job in candidate["jobs"].items():
        permissions = job.get("permissions", candidate["permissions"])
        if "write" not in permissions.values():
            continue
        events = candidate["on"]
        branch = r"rc\d+-[0-9a-z-]+"
        if set(events) == {"push"}:
            trigger = events["push"]
            branches = trigger.get("branches", [])
            confined = bool(trigger.get("paths") and branches and
                            all(re.fullmatch(branch, ref) for ref in branches))
        else:
            confined = (set(events) == {"workflow_dispatch"} and
                        re.fullmatch(r"github\.ref == 'refs/heads/" + branch + "'", job.get("if", "")))
        if not confined or {scope for scope, access in permissions.items() if access == "write"} != {"contents"}:
            raise ValueError(f"{path}:{name}: write job lacks the legacy event/ref restriction")


def inventory(workflows):
    rows = []
    for path, workflow in workflows.items():
        for name, job in workflow["jobs"].items():
            steps = job["steps"]
            rows.append({
                "path": path,
                "trigger": workflow["on"],
                "job": name,
                "condition": job.get("if"),
                "workflowPermissions": workflow["permissions"],
                "jobPermissions": job.get("permissions", workflow["permissions"]),
                "checkout": [
                    s.get("with", {}).get("persist-credentials", "default")
                    for s in steps if s.get("uses", "").startswith("actions/checkout@")
                ],
                "explicitTokenSteps": [
                    i for i, step in enumerate(steps, 1)
                    if re.search(r"github\.token|GITHUB_TOKEN", json.dumps(step), re.I)
                ],
                "artifactSteps": [
                    s["uses"] for s in steps if "artifact@" in s.get("uses", "")
                ],
                "gitWriteSteps": [
                    s.get("name", s["run"].splitlines()[0])
                    for s in steps if re.search(
                        r"git push|['\"]git['\"],\s*['\"]push['\"]|/(?:stage|stage_accepted)\.py",
                        s.get("run", ""),
                    )
                ],
            })
    return rows


def read_workflows(ref):
    names = git("ls-tree", "-r", "--name-only", ref, "--", DIR).decode().splitlines()
    return {name: load_workflow(git("show", f"{ref}:{name}")) for name in names}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--inventory", type=Path)
    args = parser.parse_args()
    try:
        git("merge-base", "--is-ancestor", BASE, "HEAD")
        changes = set(git("diff", "--name-only", "--no-renames", "-z", BASE, "HEAD").decode().split("\0")[:-1])
        before = read_workflows(BASE)
        after = read_workflows("HEAD")
        if set(after) != set(before) | {CHECK} or changes - (set(after) | SOURCES):
            raise ValueError("Candidate changes files outside the workflow migration")
        baseline_rows = inventory(before)
        for path, original in before.items():
            verify_workflow(path, original, after[path])
        check_workflow(CHECK, git("show", f"HEAD:{CHECK}"))
        if after[CHECK]["on"] != {"pull_request": {"branches": [ISOLATED_BASE]}}:
            raise ValueError(f"{CHECK}: verification must target the isolated base")
        candidate_rows = inventory(after)
        if any("write" in row["jobPermissions"].values() and not row["gitWriteSteps"]
               for row in candidate_rows):
            raise ValueError("A legacy write job has no identified Git write step")
        report = {"baseline": baseline_rows, "candidate": candidate_rows}
        if args.inventory:
            args.inventory.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
    except (OSError, ValueError, KeyError, TypeError, yaml.YAMLError, subprocess.CalledProcessError) as exc:
        parser.exit(1, f"G1 permission migration rejected: {exc}\n")
    for label, rows in report.items():
        inherited = sum("write" in row["workflowPermissions"].values() for row in rows)
        writers = sum("write" in row["jobPermissions"].values() for row in rows)
        persisted = sum(row["checkout"].count("default") + row["checkout"].count("true")
                        for row in rows if "write" not in row["jobPermissions"].values())
        print(f"{label}: {len(rows)} jobs, {writers} write jobs, "
              f"{inherited} jobs under write defaults, {persisted} credential-persisting read checkouts")


if __name__ == "__main__":
    main()
