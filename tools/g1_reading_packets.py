"""Packet transport and staged entry checks for the AMC8 builders."""

import base64
import gzip
import hashlib
import json
import re


ENTRIES = ("index.html", "amc8/index.html", "source/index.html")
CONFIG = re.compile(r'(<script id="learning-delivery" type="application/json">)(.*?)(</script>)')


def isolated_stage(path, checkout):
    root = path.resolve(strict=True)
    if (path.is_symlink() or not root.is_dir() or root.is_relative_to(checkout)
            or checkout.is_relative_to(root) or (root / '.git').exists()):
        raise ValueError('Staged root must be isolated from the repository')
    if any(entry.is_symlink() for entry in root.rglob('*')):
        raise ValueError('Symlinks are not supported in the staged tree')
    return root


def sha(body):
    return hashlib.sha256(body).hexdigest()


def compact(value):
    return json.dumps(value, ensure_ascii=False, separators=(",", ":")).encode()


def config(html):
    matches = CONFIG.findall(html)
    if len(matches) != 1:
        raise ValueError("Expected exactly one learning-delivery config")
    return json.loads(matches[0][1])


def replace_config(html, value):
    body = compact(value).decode()
    updated, count = CONFIG.subn(lambda match: match[1] + body + match[3], html)
    if count != 1:
        raise ValueError("Expected exactly one learning-delivery config")
    return updated


def unpack(row, read):
    compressed = b"".join(base64.b64decode(json.loads(read(path))["gz"]) for path in row["parts"])
    body = gzip.decompress(compressed)
    if len(body) != row["bytes"] or sha(body) != row["id"]:
        raise ValueError("Baseline packet hash or length mismatch")
    return body


def pack(body, asset_dir, write, *, kind, key=None, part_bytes=85000):
    compressed = gzip.compress(body, compresslevel=9, mtime=0)
    if gzip.decompress(compressed) != body:
        raise ValueError("Packet failed its gzip round trip")
    parts = []
    for offset in range(0, len(compressed), part_bytes):
        envelope = compact({"gz": base64.b64encode(compressed[offset:offset + part_bytes]).decode()})
        path = f"assets/{asset_dir}/{sha(envelope)}.json"
        write(path, envelope)
        parts.append(path)
    row = {"id": sha(body), "kind": kind, "bytes": len(body), "gzipBytes": len(compressed), "parts": parts}
    if key:
        row["key"] = key
    return row
