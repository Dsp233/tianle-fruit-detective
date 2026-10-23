"""Verify a packaged candidate before any CI script is executed."""
import hashlib
import json
from pathlib import Path,PurePosixPath
import sys
import zipfile

archive,receipt,destination=map(Path,sys.argv[1:])
assert not destination.exists(),'Destination must be new'
expected=json.loads(receipt.read_text())
if not archive.exists():
    assert expected.get('uploadEncoding')=='SPLIT_BYTES_V1','Missing archive without registered split parts'
    parts=expected.get('uploadParts');assert isinstance(parts,list) and parts,'Missing upload part manifest'
    seen=set();total=0
    temporary=archive.with_name(archive.name+'.assembling')
    assert not temporary.exists(),'Unexpected pre-existing assembly file'
    try:
        with temporary.open('xb') as output:
            for row in parts:
                name=row['file'];relative=PurePosixPath(name)
                assert len(relative.parts)==1 and not relative.is_absolute() and name not in {'.','..'} and '\\' not in name,'Unsafe upload part path'
                assert name not in seen,'Duplicate upload part';seen.add(name)
                part=receipt.parent/name
                assert part.is_file() and not part.is_symlink(),'Missing or linked upload part'
                data=part.read_bytes()
                assert len(data)==row['bytes'] and hashlib.sha256(data).hexdigest()==row['sha256'],'Upload part hash mismatch'
                total+=len(data);assert total<=expected['bytes'],'Upload part total exceeds archive size'
                output.write(data)
        assert total==expected['bytes'],'Upload parts incomplete'
        assert hashlib.sha256(temporary.read_bytes()).hexdigest()==expected['zipSha256'],'Assembled archive hash mismatch'
        temporary.rename(archive)
    finally:
        if temporary.exists():temporary.unlink()
assert archive.stat().st_size==expected['bytes'],'Archive byte count mismatch'
assert hashlib.sha256(archive.read_bytes()).hexdigest()==expected['zipSha256'],'Archive hash mismatch' 
with zipfile.ZipFile(archive) as z:
    names=z.namelist();assert len(names)==len(set(names))
    manifest=json.loads(z.read('transfer-manifest.json'))
    assert len(manifest['files'])==expected['files']
    assert set(names)=={r['path'] for r in manifest['files']}|{'transfer-manifest.json'}
    for info in z.infolist():
        p=PurePosixPath(info.filename)
        assert not p.is_absolute() and '..' not in p.parts and '\\' not in info.filename
        assert (info.external_attr>>16)&0o170000!=0o120000
    for row in manifest['files']:
        data=z.read(row['path']);assert len(data)==row['bytes'] and hashlib.sha256(data).hexdigest()==row['sha256']
    z.extractall(destination)
contract=json.loads((destination/'release-contract.json').read_text())
assert contract['buildId']==expected['buildId']==manifest['buildId']
print(json.dumps({'result':'PASS','buildId':contract['buildId'],'files':len(manifest['files']),'release':contract['release']}))
