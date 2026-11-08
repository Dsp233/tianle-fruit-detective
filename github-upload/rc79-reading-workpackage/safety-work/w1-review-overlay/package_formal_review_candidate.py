"""Prepare an isolated Q0 candidate from the byte-verified W1 production release."""
import argparse
import hashlib
import json
import re
import shutil
import tempfile
from pathlib import Path, PurePosixPath

MANIFEST = 'muse/rc79/manifest.json'
OVERLAY = ('review-overlay.js', 'review-overlay.css')


def sha(data):
    return hashlib.sha256(data).hexdigest()


def package(production, receipt, output, expected_commit):
    report = json.loads(receipt.read_bytes())
    if (report['status'] != 'PUBLIC_W1_BYTES_VERIFIED'
            or report['testedCommit'] != expected_commit
            or not re.fullmatch(r'[a-f0-9]{40}', expected_commit)):
        raise ValueError('Receipt does not identify the requested production commit')
    files = report['sha256']
    if len(files) != 440 or not {'index.html', MANIFEST} <= files.keys() or set(OVERLAY) & files.keys():
        raise ValueError('Unexpected base release file set')
    manifest = json.loads((production / MANIFEST).read_bytes())
    source = manifest.get('sourceCommit', '')
    if manifest['deliveryRevision'] != 'RC79-W1' or not re.fullmatch(r'[a-f0-9]{40}', source):
        raise ValueError('The verified base must be W1')
    if output.exists():
        raise FileExistsError(output)
    output.parent.mkdir(parents=True, exist_ok=True)
    temp = Path(tempfile.mkdtemp(prefix='.q0-', dir=output.parent))
    try:
        for name, digest in files.items():
            path = PurePosixPath(name)
            if path.is_absolute() or '..' in path.parts or path.as_posix() != name:
                raise ValueError(f'Unsafe path: {name}')
            data = (production / path).read_bytes()
            if sha(data) != digest:
                raise ValueError(f'Base release byte mismatch: {name}')
            target = temp / path
            target.parent.mkdir(parents=True, exist_ok=True)
            target.write_bytes(data)
        index = temp / 'index.html'
        before = index.read_bytes()
        if before.count(b'</body>') != 1 or b'review-overlay.js' in before:
            raise ValueError('Unexpected W1 home page')
        hook = ('<script src="./review-overlay.js" defer data-review-scope="formal" '
                f'data-review-build="{source}"></script>\n').encode('ascii')
        index.write_bytes(before.replace(b'</body>', hook + b'</body>'))
        for name in OVERLAY:
            shutil.copyfile(Path(__file__).with_name(name), temp / name)
        identity = {
            'status': 'Q0_CANDIDATE_NOT_DEPLOYED',
            'productionCommit': expected_commit,
            'learningSourceCommit': source,
            'baseReceiptSha256': sha(receipt.read_bytes()),
            'baseHomepageSha256': files['index.html'],
            'unchangedLearningPaths': len(files) - 1,
            'candidateSha256': {name: sha((temp / name).read_bytes())
                                for name in ('index.html', *OVERLAY)},
        }
        (temp / 'q0-candidate-identity.json').write_text(
            json.dumps(identity, indent=2) + '\n', encoding='utf-8')
        temp.rename(output)
        return identity
    except BaseException:
        shutil.rmtree(temp)
        raise


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--production', type=Path, required=True)
    parser.add_argument('--receipt', type=Path, required=True)
    parser.add_argument('--output', type=Path, required=True)
    parser.add_argument('--expected-commit', required=True)
    args = parser.parse_args()
    print(json.dumps(package(args.production, args.receipt, args.output, args.expected_commit), indent=2))
