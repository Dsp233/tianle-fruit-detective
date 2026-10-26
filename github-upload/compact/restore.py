"""Restore one exact frozen ZIP; does not execute candidate code or deploy."""
import argparse, base64, ctypes, hashlib, io, json, lzma, os, tarfile
from pathlib import Path

ARCHIVE_SHA = 'f428b50683962f146148d3b6f2b0cd00e5beaab305c41496891dfe117427004a'
ARCHIVE_SIZE = 99990895

def digest(data):
    return hashlib.sha256(data).hexdigest()

class Stream(ctypes.Structure):
    _fields_ = [('next_in', ctypes.c_void_p), ('avail_in', ctypes.c_uint),
                ('total_in', ctypes.c_ulong), ('next_out', ctypes.c_void_p),
                ('avail_out', ctypes.c_uint), ('total_out', ctypes.c_ulong),
                ('msg', ctypes.c_void_p), ('state', ctypes.c_void_p),
                ('zalloc', ctypes.c_void_p), ('zfree', ctypes.c_void_p),
                ('opaque', ctypes.c_void_p), ('data_type', ctypes.c_int),
                ('adler', ctypes.c_ulong), ('reserved', ctypes.c_ulong)]

class Compressor:
    def __init__(self, library):
        self.lib = ctypes.CDLL(str(Path(library).resolve()))
        self.lib.zlibVersion.restype = ctypes.c_char_p
        self.version = self.lib.zlibVersion()
        self.lib.deflateInit2_.argtypes = [ctypes.POINTER(Stream), ctypes.c_int,
            ctypes.c_int, ctypes.c_int, ctypes.c_int, ctypes.c_int,
            ctypes.c_char_p, ctypes.c_int]
        self.lib.deflate.argtypes = [ctypes.POINTER(Stream), ctypes.c_int]
        self.lib.deflateEnd.argtypes = [ctypes.POINTER(Stream)]

    def compress(self, data):
        stream = Stream()
        source = ctypes.create_string_buffer(data)
        target = ctypes.create_string_buffer(len(data) + len(data)//500 + 128)
        stream.next_in = ctypes.addressof(source)
        stream.avail_in = len(data)
        stream.next_out = ctypes.addressof(target)
        stream.avail_out = len(target)
        status = self.lib.deflateInit2_(ctypes.byref(stream), 6, 8, -15, 8, 0,
                                      self.version, ctypes.sizeof(Stream))
        if status != 0:
            raise ValueError('Pinned deflater initialization failed')
        try:
            if self.lib.deflate(ctypes.byref(stream), 4) != 1:
                raise ValueError('Pinned deflater did not finish')
            return target.raw[:stream.total_out]
        finally:
            self.lib.deflateEnd(ctypes.byref(stream))

def restore(manifest_path, output):
    manifest_path = Path(manifest_path).resolve()
    receipt = json.loads(manifest_path.read_text())
    if receipt.get('schema') != 1 or receipt.get('archiveSha256') != ARCHIVE_SHA:
        raise ValueError('Unexpected candidate transport identity')
    combined = bytearray()
    seen = set()
    for part in receipt['parts']:
        name = part['file']
        if Path(name).name != name or name in seen:
            raise ValueError('Unsafe or duplicate transport name')
        seen.add(name)
        path = manifest_path.parent / name
        if path.is_symlink():
            raise ValueError('Linked transport part')
        data = path.read_bytes()
        if len(data) != part['bytes'] or digest(data) != part['sha256']:
            raise ValueError('Transport part hash mismatch')
        combined.extend(data)
    if len(combined) != receipt['transportBytes'] or digest(combined) != receipt['transportSha256']:
        raise ValueError('Transport aggregate hash mismatch')
    raw = lzma.decompress(combined, memlimit=256*1024*1024)
    if len(raw) != receipt['tarBytes']:
        raise ValueError('Transport expansion size mismatch')
    with tarfile.open(fileobj=io.BytesIO(raw), mode='r:') as archive:
        members = archive.getmembers()
        if any(not x.isfile() or Path(x.name).name != x.name for x in members):
            raise ValueError('Unsafe transport member')
        if len({x.name for x in members}) != len(members):
            raise ValueError('Duplicate transport member')
        def get(name):
            return archive.extractfile(name).read()
        recipe = json.loads(get('recipe.json'))
        library = get('libz.so')
        if digest(library) != receipt['compressorSha256'] or digest(get('recipe.json')) != receipt['recipeSha256']:
            raise ValueError('Pinned restore inputs mismatch')
        output = Path(output).resolve()
        output.parent.mkdir(parents=True, exist_ok=True)
        library_path = output.with_name(output.name+'.transport-libz.so')
        library_path.write_bytes(library)
        os.chmod(library_path, 0o500)
        compressor = Compressor(library_path)
        temporary = output.with_name(output.name+'.restoring')
        sha = hashlib.sha256()
        count = 0
        with temporary.open('wb') as destination:
            for item in recipe['entries']:
                prefix = base64.b64decode(item['prefix'], validate=True)
                payload = get(item['payload'])
                if digest(payload) != item['payload']:
                    raise ValueError('Payload identity mismatch')
                compressed = compressor.compress(payload) if item['mode'] == 'deflate6' else payload
                if len(compressed) != item['bytes'] or digest(compressed) != item['sha256']:
                    raise ValueError('Compressed entry identity mismatch')
                for block in (prefix, compressed):
                    destination.write(block); sha.update(block); count += len(block)
            tail = base64.b64decode(recipe['tail'], validate=True)
            destination.write(tail); sha.update(tail); count += len(tail)
        if sha.hexdigest() != ARCHIVE_SHA or count != ARCHIVE_SIZE:
            temporary.unlink(missing_ok=True)
            raise ValueError('Reconstructed frozen archive does not match')
        temporary.replace(output)
        library_path.unlink()
    return {'result': 'PASS', 'zipSha256': ARCHIVE_SHA, 'bytes': count,
            'entries': len(recipe['entries']), 'candidateCodeExecuted': False}

if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('manifest'); parser.add_argument('output')
    args = parser.parse_args()
    print(json.dumps(restore(args.manifest, args.output)))
