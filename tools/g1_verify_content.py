"""Validate a separately provisioned, unpacked W1 exam content tree."""

import argparse
import hashlib
import json
from pathlib import Path, PurePosixPath
import re
import sys


EXPECTED_FILES = 7710
EXPECTED_INPUTS_SHA256 = "f26fc00bb0847edb32810ad533ada7a8c4faf299e325a32cb1c47e344c349d8a"


def manifest_sha256(files):
    body = json.dumps(files, ensure_ascii=False, separators=(",", ":"), sort_keys=True)
    return hashlib.sha256(body.encode("utf-8")).hexdigest()


def read_contract(index_path):
    with index_path.open(encoding="utf-8") as stream:
        index = json.load(stream)
    files = {
        name: digest
        for name, digest in index["inputFiles"].items()
        if name.startswith("content/")
    }
    return verify_manifest(files)


def verify_manifest(files):
    if (not isinstance(files, dict) or len(files) != EXPECTED_FILES
            or manifest_sha256(files) != EXPECTED_INPUTS_SHA256):
        raise ValueError("Exam content manifest differs from frozen W1")
    return files


def verify_tree(content_dir, files, *, stage=None):
    expected = {}
    for name, digest in files.items():
        path = PurePosixPath(name)
        if (path.parts[:1] != ("content",) or len(path.parts) < 2
                or ".." in path.parts or path.as_posix() != name
                or not isinstance(digest, str) or not re.fullmatch("[0-9a-f]{64}", digest)):
            raise ValueError(f"Invalid manifest entry: {name}")
        expected[PurePosixPath(*path.parts[1:]).as_posix()] = digest

    return verify_files(content_dir, expected, stage=stage)


def checked_file(root, name):
    path = PurePosixPath(name)
    if not path.parts or path.is_absolute() or ".." in path.parts or path.as_posix() != name:
        raise ValueError(f"Invalid build path: {name}")
    target = root
    for part in path.parts:
        target = target / part
        if target.is_symlink():
            raise ValueError(f"Symlink in input/output: {name}")
    if not target.is_file():
        raise ValueError(f"Missing or non-regular file: {name}")
    return target


def verify_files(directory, expected, *, stage=None):
    """Require the exact path set and optionally stage the same bytes that were checked."""
    if directory.is_symlink() or not directory.is_dir():
        raise ValueError(f"Expected a real, unpacked directory: {directory}")
    actual = set()
    for path in directory.rglob("*"):
        name = path.relative_to(directory).as_posix()
        if path.is_symlink() or not (path.is_file() or path.is_dir()):
            raise ValueError(f"Symlink or non-regular file in input/output: {name}")
        if path.is_file():
            actual.add(name)
    missing = sorted(expected.keys() - actual)
    extra = sorted(actual - expected.keys())
    if missing or extra:
        raise ValueError(f"Paths differ: {len(missing)} missing {missing[:5]}, "
                         f"{len(extra)} unexpected {extra[:5]}")

    for name, digest in sorted(expected.items()):
        with checked_file(directory, name).open("rb") as stream:
            body = stream.read() if stage is not None else None
            actual_digest = hashlib.file_digest(stream, "sha256") if body is None else hashlib.sha256(body)
        if actual_digest.hexdigest() != digest:
            raise ValueError(f"SHA-256 mismatch: {name}")
        if stage is not None:
            target = stage / name
            target.parent.mkdir(parents=True, exist_ok=True)
            target.write_bytes(body)
    return len(actual)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--exam-index", type=Path, required=True,
                        help="Frozen exam index supplying the input fingerprints")
    parser.add_argument("--content-dir", type=Path, required=True)
    args = parser.parse_args()
    try:
        files = read_contract(args.exam_index)
        count = verify_tree(args.content_dir, files)
    except (OSError, ValueError, KeyError, AttributeError, TypeError) as exc:
        print(f"W1 content rejected: {exc}", file=sys.stderr)
        return 1
    print(json.dumps({"files": count, "inputManifestSha256": manifest_sha256(files)}))
    return 0


if __name__ == "__main__":
    sys.exit(main())
