"""Recover the pinned W1 source in a fresh M work directory."""
import argparse
import hashlib
import json
from pathlib import Path, PurePosixPath
from shutil import rmtree
from zipfile import ZipFile

SOURCE = "f935008b75d79cfc44610b197122c01e1b6b9a6e"
ARCHIVE_SHA = "691e39be468335977f615b4d96497ff81d6b2f38dc7cee6ff0e6f0e44ec00e21"
MANIFEST = "tested-package-inventory.json"


def restore(archive, target):
    with archive.open("rb") as file:
        if hashlib.file_digest(file, "sha256").hexdigest() != ARCHIVE_SHA:
            raise ValueError("Unexpected frozen W1 ZIP SHA-256")
        file.seek(0)
        with ZipFile(file) as package:
            inventory = json.loads(package.read(MANIFEST))
            if inventory["sourceCommit"] != SOURCE:
                raise ValueError("Unexpected frozen W1 source")
            files = inventory["files"]
            names = package.namelist()
            if len(names) != len(set(names)) or set(names) != set(files) | {MANIFEST}:
                raise ValueError("W1 ZIP members differ from tested inventory")
            target.mkdir(parents=True, exist_ok=False)
            try:
                for name, digest in files.items():
                    path = PurePosixPath(name)
                    if not (name.startswith("source/") or name == "docs/exam-review-ledger.csv"):
                        continue
                    if path.is_absolute() or ".." in path.parts or path.as_posix() != name:
                        raise ValueError(f"Invalid source path: {name}")
                    if "__pycache__" in path.parts:
                        continue
                    data = package.read(name)
                    if hashlib.sha256(data).hexdigest() != digest:
                        raise ValueError(f"Unexpected source bytes: {name}")
                    output = target / path
                    output.parent.mkdir(parents=True, exist_ok=True)
                    output.write_bytes(data)
                (target / MANIFEST).write_bytes(package.read(MANIFEST))
            except BaseException:
                rmtree(target)
                raise


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("archive", type=Path)
    parser.add_argument("target", type=Path)
    args = parser.parse_args()
    restore(args.archive, args.target)
