"""Verify complete frozen bytes before executing candidate code."""
import hashlib
import json
from pathlib import Path, PurePosixPath
import shutil
import sys
import tempfile
import zipfile


def sha(data):
    return hashlib.sha256(data).hexdigest()


def safe(name, basename=False):
    p = PurePosixPath(name)
    assert name and p.as_posix() == name and not p.is_absolute()
    assert '..' not in p.parts and '\\' not in name and name not in {'.', '..'}
    if basename:
        assert len(p.parts) == 1
    return name


def assemble(archive, receipt):
    if not archive.exists():
        assert receipt.get('uploadEncoding') == 'SPLIT_BYTES_V1'
        parts = receipt.get('uploadParts')
        assert isinstance(parts, list) and parts
        temporary = archive.with_name(archive.name + '.assembling')
        assert not temporary.exists()
        seen, total = set(), 0
        try:
            with temporary.open('xb') as output:
                for row in parts:
                    name = safe(row['file'], basename=True)
                    assert name not in seen
                    seen.add(name)
                    part = archive.parent / name
                    assert part.is_file() and not part.is_symlink()
                    data = part.read_bytes()
                    assert len(data) == row['bytes'] and sha(data) == row['sha256']
                    total += len(data)
                    assert total <= receipt['bytes']
                    output.write(data)
            assert total == receipt['bytes']
            assert sha(temporary.read_bytes()) == receipt['zipSha256']
            temporary.rename(archive)
        finally:
            temporary.unlink(missing_ok=True)
    assert archive.is_file() and not archive.is_symlink()
    assert archive.stat().st_size == receipt['bytes']
    assert sha(archive.read_bytes()) == receipt['zipSha256']


def validate(zip_file, manifest):
    names = zip_file.namelist()
    assert len(names) == len(set(names))
    rows = {safe(row['path']): row for row in manifest['files']}
    assert len(rows) == len(manifest['files'])
    assert set(names) == set(rows) | {'transfer-manifest.json'}
    for info in zip_file.infolist():
        safe(info.filename)
        assert (info.external_attr >> 16) & 0o170000 != 0o120000
    for name, row in rows.items():
        data = zip_file.read(name)
        assert len(data) == row['bytes'] and sha(data) == row['sha256']
    return rows


def materialize(archive, receipt_path, destination):
    assert not destination.exists(), 'Destination must be new'
    expected = json.loads(receipt_path.read_text())
    overlay_mode = expected.get('uploadEncoding') == 'FROZEN_TREE_OVERLAY_V1'
    if overlay_mode:
        base_path = receipt_path.parent / safe(expected['baseReceipt'], True)
        base_expected = json.loads(base_path.read_text())
        assert base_expected['buildId'] == expected['baseBuildId']
        assert base_expected['zipSha256'] == expected['baseZipSha256']
        base_archive = receipt_path.parent / safe(expected['baseArchive'], True)
        assemble(base_archive, base_expected)
        overlay_path = receipt_path.parent / safe(expected['overlayFile'], True)
        assert overlay_path.is_file() and not overlay_path.is_symlink()
        assert overlay_path.stat().st_size == expected['overlayBytes']
        assert sha(overlay_path.read_bytes()) == expected['overlaySha256']
    else:
        base_expected, base_archive, overlay_path = expected, archive, None
        assemble(base_archive, base_expected)

    destination.parent.mkdir(parents=True, exist_ok=True)
    staging = Path(tempfile.mkdtemp(prefix='.rc78-unpack-', dir=destination.parent))
    try:
        with zipfile.ZipFile(base_archive) as base:
            base_manifest = json.loads(base.read('transfer-manifest.json'))
            assert base_manifest['buildId'] == base_expected['buildId']
            base_rows = validate(base, base_manifest)
            assert len(base_rows) == base_expected['files']
            manifest, rows = base_manifest, base_rows
            if overlay_path:
                with zipfile.ZipFile(overlay_path) as overlay:
                    raw_manifest = overlay.read('transfer-manifest.json')
                    assert sha(raw_manifest) == expected['payloadManifestSha256']
                    manifest = json.loads(raw_manifest)
                    rows = {safe(row['path']): row for row in manifest['files']}
                    assert len(rows) == len(manifest['files'])
                    assert set(rows) == set(base_rows), 'Overlay may not add or delete payload paths'
                    changed = {name for name in rows if rows[name] != base_rows[name]}
                    assert changed and len(overlay.namelist()) == len(set(overlay.namelist()))
                    assert set(overlay.namelist()) == changed | {'transfer-manifest.json'}
                    for info in overlay.infolist():
                        safe(info.filename)
                        assert (info.external_attr >> 16) & 0o170000 != 0o120000
                    for name in changed:
                        data = overlay.read(name)
                        assert len(data) == rows[name]['bytes'] and sha(data) == rows[name]['sha256']
                    for name in rows:
                        target = staging / name
                        target.parent.mkdir(parents=True, exist_ok=True)
                        target.write_bytes(overlay.read(name) if name in changed else base.read(name))
                    (staging / 'transfer-manifest.json').write_bytes(raw_manifest)
            else:
                base.extractall(staging)
        assert manifest['buildId'] == expected['buildId']
        assert len(rows) == expected['files']
        actual = {p.relative_to(staging).as_posix() for p in staging.rglob('*') if p.is_file()}
        assert actual == set(rows) | {'transfer-manifest.json'}
        for name, row in rows.items():
            data = (staging / name).read_bytes()
            assert len(data) == row['bytes'] and sha(data) == row['sha256']
        contract = json.loads((staging / 'release-contract.json').read_text())
        assert contract['buildId'] == expected['buildId']
        release = contract['release']
        staging.rename(destination)
        print(json.dumps({'result': 'PASS', 'buildId': contract['buildId'],
                          'files': len(rows), 'release': release,
                          'materialization': 'verified overlay tree' if overlay_mode else 'verified archive'}))
    finally:
        if staging.exists():
            shutil.rmtree(staging)


if __name__ == '__main__':
    materialize(*map(Path, sys.argv[1:]))
