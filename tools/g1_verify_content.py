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


def read_content_lock(path):
    with path.open(encoding="utf-8") as stream:
        return verify_manifest(json.load(stream))


def verify_manifest(files):
    if (not isinstance(files, dict) or len(files) != EXPECTED_FILES
            or manifest_sha256(files) != EXPECTED_INPUTS_SHA256):
        raise ValueError("Exam content manifest differs from frozen W1")
    return files


def verify_tree(content_dir, files):
    expected = {}
    for name, digest in files.items():
        path = PurePosixPath(name)
        if (path.parts[:1] != ("content",) or len(path.parts) < 2
                or ".." in path.parts or path.as_posix() != name
                or not isinstance(digest, str) or not re.fullmatch("[0-9a-f]{64}", digest)):
            raise ValueError(f"Invalid manifest entry: {name}")
        expected[PurePosixPath(*path.parts[1:]).as_posix()] = digest

    if content_dir.is_symlink() or not content_dir.is_dir():
        raise ValueError("Expected a real, unpacked content directory")
    actual = set()
    for path in sorted(content_dir.rglob("*")):
        name = path.relative_to(content_dir).as_posix()
        if path.is_symlink():
            raise ValueError(f"Symlink in content directory: {name}")
        if path.is_dir():
            continue
        if not path.is_file():
            raise ValueError(f"Non-regular file in content directory: {name}")
        actual.add(name)
    missing = sorted(expected.keys() - actual)
    extra = sorted(actual - expected.keys())
    if missing or extra:
        raise ValueError(f"Content paths differ: {len(missing)} missing {missing[:5]}, "
                         f"{len(extra)} unexpected {extra[:5]}")

    for name, digest in sorted(expected.items()):
        with (content_dir / name).open("rb") as stream:
            actual_digest = hashlib.file_digest(stream, "sha256").hexdigest()
        if actual_digest != digest:
            raise ValueError(f"Input SHA-256 mismatch: content/{name}")
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
