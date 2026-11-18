"""Build AMC8 from frozen W1 inputs and reviewed runtime changes."""

import argparse
import base64
import hashlib
from io import BytesIO
import json
import os
from pathlib import Path
import re
import shutil
import subprocess
import sys
import tempfile
from zipfile import ZipFile
import zlib

from g1_rebuild_w1_reading import HOME1_INPUTS
from g1_verify_content import checked_file, manifest_sha256, verify_files, verify_manifest, verify_tree

ROOT = Path(__file__).resolve().parents[1]
TOOLS = ROOT / "tools"
EVIDENCE = ROOT / "docs/engineering/governance/g1-source-build"
SOURCE_LOCK = TOOLS / "g1-source-lock.json"
RUNTIME_LOCK = TOOLS / "g1-runtime-lock.tsv"
MANIFEST = "muse/rc79/manifest.json"
REPORT = "muse/rc79/loading-r2/package-report.json"
Q0_IDENTITY = "q0-production-identity.json"
CR5 = "4df7c5e5d0c69501a7c0e8df850f9fa0254f23ae"
MAIN = "05f73af21ddf35134bb7c5e598cd75845e82baf2"
W1_TOOLS = ROOT / "github-upload/rc79-reading-workpackage/safety-work/w1-checkpoint"
PRE_ART = "reading-quality-identity.json"


def sha(body):
    return hashlib.sha256(body).hexdigest()


def body_at(root, name, expected=None):
    body = checked_file(root, name).read_bytes()
    if expected is not None and sha(body) != expected:
        raise ValueError(f"SHA-256 mismatch: {name}")
    return body


def put(root, name, body):
    target = root / name
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_bytes(body)


def runtime_contract():
    rows = {}
    header, *lines = RUNTIME_LOCK.read_text().splitlines()
    if header != "producer\tcr5_sha256\tpath":
        raise ValueError("Invalid runtime lock header")
    for line in lines:
        producer, digest, name = line.split("\t")
        if (name in rows or producer not in ("build", "static")
                or not re.fullmatch(r"[0-9a-f]{64}", digest)):
            raise ValueError(f"Invalid runtime lock row: {line}")
        rows[name] = (producer, digest)
    ledger = json.loads((EVIDENCE / "approved-runtime-diff.json").read_text())
    for name, expected in ledger["changed"].items():
        producer, digest = rows[name]
        candidate = expected.get("g1", digest)
        if digest != expected["cr5"] or not re.fullmatch(r"[0-9a-f]{64}", candidate):
            raise ValueError(f"Invalid runtime revision: {name}")
        rows[name] = (producer, candidate)
    return rows


def verify_dist(root):
    files = {name: digest for name, (_, digest) in runtime_contract().items()}
    verify_files(root, files)
    return files


def install_q0(root, manifest):
    identity = json.loads((ROOT / Q0_IDENTITY).read_bytes())
    home = body_at(root, "index.html", identity["originalHomepageSha256"])
    hook = ('<script src="./review-overlay.js" defer data-review-scope="formal" '
            f'data-review-build="{manifest["sourceCommit"]}"></script>\n').encode("ascii")
    if home.count(b"</body>") != 1:
        raise ValueError("Q0 cannot identify the exact homepage hook position")
    home = home.replace(b"</body>", hook + b"</body>")
    artifacts = {"index.html": sha(home)}
    for name in ("review-overlay.js", "review-overlay.css"):
        artifacts[name] = sha(body_at(root, name))
    if artifacts != identity["formalReviewArtifactSha256"]:
        raise ValueError("Q0 identity drift")
    identity["formalReviewArtifactSha256"] = artifacts
    put(root, "index.html", home)
    put(root, Q0_IDENTITY, (json.dumps(identity, indent=2) + "\n").encode())


def stage_command(directory, *args, env=None, capture=False):
    return subprocess.run([sys.executable, "-B", *map(str, args)], cwd=directory,
                          env=env, stdout=subprocess.PIPE if capture else sys.stderr, check=True)


def assemble_release(packed, root):
    """Assemble the exact published target from a fresh W1 packer output."""
    if root.exists() or root.is_symlink():
        raise ValueError("Release staging requires a new directory")
    root.mkdir()
    old = json.loads((EVIDENCE / "local-reconstruction-receipt.json").read_text())
    rows = runtime_contract()
    # These paths must come from the packer, including every current math shard.
    # Never fall back to checked-in outputs if one is absent.
    for name, digest in old["historicalPackagedFilesEqualToArchive"].items():
        put(root, name, body_at(packed, name, digest))
    for name in ("muse/rc79/loading-r1/package-report.json",
                 "third-party-notices/pako-1.0.11.txt"):
        put(root, name, body_at(packed, name))
    for name, (producer, digest) in rows.items():
        if producer == "static":
            if (root / name).exists():
                raise ValueError(f"Static path would replace a packed output: {name}")
            put(root, name, body_at(ROOT, name, digest))

    # The historical manifest metadata is release evidence. Recompute each
    # entry's size and hash from the verified W1 stage before later overlays.
    manifest = json.loads(body_at(ROOT, MANIFEST, rows[MANIFEST][1]))
    allowlist = json.loads(body_at(W1_TOOLS, "w1-g5-allowlist.json", manifest["w1AllowlistSha256"]))
    if (manifest["sourceCommit"], manifest["w1ArtifactId"]) != (allowlist["source"], allowlist["artifactId"]):
        raise ValueError("W1 release identity mismatch")
    for item in allowlist["actions"]:
        if item["path"] != REPORT:
            body_at(root, item["path"], item["newSha256"])
    for name in manifest["entryFiles"]:
        body = body_at(root, name)
        manifest["entryFiles"][name] = {"bytes": len(body), "sha256": sha(body)}
    put(root, MANIFEST, (json.dumps(manifest, indent=2) + "\n").encode())

    report = json.loads(body_at(packed, REPORT))
    if report["revision"] != "RC79-FIX15" or report["pinyinProjection"][0]["pinyinExact"] is not True:
        raise ValueError("Unexpected packaging basis or missing pinyin proof")
    approved_report = json.loads(body_at(ROOT, REPORT, rows[REPORT][1]))
    for annotation in (
        "revision", "changeScope", "readingContentChangedSincePreviousDelivery",
        "gradingChangedSincePreviousDelivery", "readingFeedbackChangedSincePreviousDelivery",
        "readingFeedbackChangeScope", "completeVersionVerification",
        "independentTeachingAndDeviceReview", "releaseStatus",
    ):
        report[annotation] = approved_report[annotation]
    put(root, REPORT, (json.dumps(report, ensure_ascii=False, indent=2) + "\n").encode())
    body_at(root, REPORT, rows[REPORT][1])

    install_q0(root, manifest)
    stage_command(root, ROOT / "reading-quality/build.py", "--staged-root", root)
    body_at(root, PRE_ART, rows[PRE_ART][1])
    art = json.loads(stage_command(root, ROOT / "reading-art/build.py", "--staged-root",
                                   root, capture=True).stdout)
    print(f"READING_ART days={art['days']} positions={art['positions']} "
          f"manifest_paths={len(art['files'])}", file=sys.stderr)
    return verify_dist(root)


def locked_inputs(input_root):
    if input_root.is_symlink() or not input_root.is_dir():
        raise ValueError("Provide the unpacked, fixed canonical source directory")
    return verify_manifest(json.loads(body_at(input_root, "exam-content-lock.json")))


def check_toolchain(lock):
    toolchain = lock["toolchain"]
    versions = {
        "python": ".".join(map(str, sys.version_info[:3])),
        "node": subprocess.check_output(["node", "--version"], text=True).strip().removeprefix("v"),
        "zlib": zlib.ZLIB_RUNTIME_VERSION,
    }
    for name, version in versions.items():
        if version != toolchain[name]:
            raise ValueError(f"Use locked {name} {toolchain[name]}, found {version}")
    for executable, path, key in (
        ("python", sys.executable, "pythonSha256"),
        ("projection python3", shutil.which("python3"), "pythonSha256"),
        ("node", shutil.which("node"), "nodeSha256"),
    ):
        if path is None:
            raise ValueError(f"Missing locked executable: {executable}")
        with Path(path).open("rb") as binary:
            digest = hashlib.file_digest(binary, "sha256").hexdigest()
        if digest != toolchain[key]:
            raise ValueError(f"SHA-256 mismatch for locked {executable}")
        versions[key] = digest
    return versions


def restore_git_sources(stage, lock):
    for name, digest in lock["gitFiles"].items():
        body = body_at(ROOT / "canonical/w1", name, digest)
        if name == "source/home_portal.js":
            panda = lock["homePanda"]
            image = body_at(ROOT, panda["path"], Path(panda["path"]).stem)
            marker = b"__AMC8_HOME_PANDA_BASE64__"
            if body.count(marker) != 1:
                raise ValueError("Expected one homepage image placeholder")
            body = body.replace(marker, base64.b64encode(image))
            if sha(body) != panda["originalSourceSha256"]:
                raise ValueError("Reconstructed W1 home_portal.js differs from the frozen source")
        put(stage, name, body)


def stage_reading_dependency(input_root, target, toolchain):
    name = toolchain["pypinyinWheel"]
    wheel = body_at(input_root, "wheels/" + name, toolchain["pypinyinSha256"])
    # The locked wheel includes JSON dictionaries that pypinyin opens as
    # ordinary files. Use a fresh directory instead of zip-importing it.
    with ZipFile(BytesIO(wheel)) as package:
        package.extractall(target)


def build_w1(input_root, stage, lock, content):
    restore_git_sources(stage, lock)
    verify_files(input_root / "compiler", lock["controlledCompilerFiles"], stage=stage)
    verify_tree(input_root / "content", content, stage=stage / "source/content")
    verify_files(input_root / "r1", HOME1_INPUTS)
    dependency = stage / "_dependencies"
    stage_reading_dependency(input_root, dependency, lock["toolchain"])
    env = {
        "PATH": os.environ["PATH"],
        "PYTHONPATH": str(dependency),
        "PYTHONNOUSERSITE": "1",
        "PYTHONHASHSEED": "0",
        "TZ": "UTC",
        "LC_ALL": "C.UTF-8",
    }
    output = stage / "source/reading_data.js"
    stage_command(stage, TOOLS / "g1_rebuild_w1_reading.py", "--r1-source-dir",
                  input_root / "r1", "--output", output, env=env)
    stage_command(stage, TOOLS / "g1_compile_w1.py", stage, env=env)
    stage_command(stage, stage / "source/build_qa.py", env=env)
    stage_command(stage, ROOT / "github-upload/rc79-fix15/stage_candidate.py", stage, env=env)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    commands = parser.add_subparsers(dest="command", required=True)
    build = commands.add_parser("build", help="Build with the fixed canonical source supply")
    build.add_argument("--inputs", type=Path, required=True)
    build.add_argument("--output", type=Path, default=ROOT / "dist")
    verify = commands.add_parser("verify", help="Check an existing dist for byte and path drift")
    verify.add_argument("output", type=Path)
    args = parser.parse_args()
    try:
        if args.command == "verify":
            files = verify_dist(args.output)
            mode = "byte-verification"
        else:
            output = args.output.resolve()
            inputs = args.inputs.resolve()
            if (args.output.is_symlink() or output.exists() or output == ROOT
                    or (output.is_relative_to(ROOT) and output != ROOT / "dist")
                    or output.is_relative_to(inputs) or inputs.is_relative_to(output)):
                raise ValueError("Output must be new and isolated from source inputs")
            lock = json.loads(SOURCE_LOCK.read_text())
            content = locked_inputs(args.inputs)
            versions = check_toolchain(lock)
            with (tempfile.TemporaryDirectory(prefix="amc8-g1-build-") as temporary,
                  tempfile.TemporaryDirectory(prefix=".amc8-dist-", dir=output.parent) as publish):
                packed = Path(temporary) / "w1"
                packed.mkdir()
                build_w1(inputs, packed, lock, content)
                staged_output = Path(publish) / "site"
                # The legacy reading guards require isolation from the checkout.
                release = Path(temporary) / "release" if output.parent == ROOT else staged_output
                files = assemble_release(packed, release)
                if release != staged_output:
                    shutil.copytree(release, staged_output)
                    verify_dist(staged_output)
                staged_output.rename(output)
            mode = "canonical-rebuild"
        result = {
            "mode": mode,
            "approvedMain": MAIN,
            "approvedCR5": CR5,
            "runtimeLockSha256": sha(RUNTIME_LOCK.read_bytes()),
            "files": files,
        }
        if args.command == "build":
            result.update(toolchain=versions, sourceLockSha256=sha(SOURCE_LOCK.read_bytes()),
                          canonicalSource=lock["canonicalSource"],
                          canonicalInputs={
                              "examFiles": len(content),
                              "examFingerprintSha256": manifest_sha256(content),
                              "compilerFiles": len(lock["controlledCompilerFiles"]),
                              "compilerFingerprintSha256": manifest_sha256(lock["controlledCompilerFiles"]),
                              "r1Files": len(HOME1_INPUTS),
                              "r1FingerprintSha256": manifest_sha256(HOME1_INPUTS),
                          },
                          sourceCommit=subprocess.check_output(["git", "rev-parse", "HEAD"],
                                                                cwd=ROOT, text=True).strip())
        print(json.dumps(result, ensure_ascii=False, indent=2, sort_keys=True))
    except (OSError, ValueError, KeyError, subprocess.CalledProcessError) as exc:
        print(f"AMC8 build rejected: {exc}", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
