"""Verify published browser mappings differ only in build identity."""
import base64
import gzip
import hashlib
import json
import sys
from pathlib import Path

source = Path(sys.argv[1]).resolve()
assets = Path(sys.argv[2]).resolve() if len(sys.argv) > 2 else Path.cwd() / 'assets/loading-r2'
sys.path.insert(0, str(source))
from compile_exam_mapping import browser_projection

common = [
    '08508cf2135ee20375006136f68daf694a1177900a001ee78bc165daa7008db2',
    '143aff02252e4fd868e38a7dcca7f245d188eca89084f6d2f6e59cdbf92c85ed',
    '03f19312ac1e178f02a008344e342d023801b17cbb25db6404ba2f4e454f5ebc',
    '247b4097fc8eba130a11d89662eddef4bb810cbbe8dc01cfdc3f0fdab17ab90c',
]
prior = [
    ('FIX1', '410be3b82fddeba7defdfbb5e58fee24409a8eefb0cfead0e1e19cad32f69c97', 'f881e9a2aadd16e35dc6a6eb9f9df87597dba298d3204e58d536a93f2421d07a',
     ['b417ca33f04eb0657a2534f9ee3959a4b06945ad2e4491990eed669d27267b1f', '0aed7f36249b3501c1a80900cc8a7da79524bda83e89cfad79191d81084369b8']),
    ('FIX2', '00b32fcfee4f43b83780d8081293da0b75b40873c2277ba3e151e36ab9d02672', 'eeedb3aefdb021fab8c829171b4580fe9ff5a8b35f06a2a7c9678d3edc226da6',
     ['d6122c42bfb2fb855bbd70af268aa00d091b35ed43aa8ecf434fcd257992fb5f', '14f21fabf721ae6f1d2eb2f5ba482ab42119dd21c911190a4cc11cbb1bc97abd']),
    ('FIX3', 'bf6ba1703f0f1d38c596a20ff813ef810e7a7cd5b3d659d90658da844b78fcce', '3838dcb354ee34c2b183e9781d9141516f69fd4f01ec84f725c6fafd5dcac63d',
     ['7e4f4ad155321d635e15df9c5fcbc918dc9450fd4b191bcb174c3bdbdb6c777a', 'acaab561abf1a78ffa560771cfecb7c4db9b3c9c1e84d15287ef4aeaffd9911c']),
    ('FIX4', 'd3d43d30bb089531122b56d947e02ae2ca96a0708a141e06d6e1fd8b5cec404e', '603184a9ce43e1b28ae389f351318d00d98b451c544fff148835101b4c283170',
     ['16efedd03adca6354e830af9efd0b7b1522fc50666cb0ec5be2279290025de1b', 'e7c4930b5d8a6218fbfa1e717071c3609f14bcbcc04ef2407712f88913367115']),
]
current = browser_projection(json.loads((source / 'exam_runtime_index.json').read_text()))
current.pop('mappingBuildId')
for name, expected, build_id, tail in prior:
    pieces = []
    for digest in common + tail:
        part = (assets / (digest + '.json')).read_bytes()
        assert hashlib.sha256(part).hexdigest() == digest, (name, digest)
        pieces.append(base64.b64decode(json.loads(part)['gz'], validate=True))
    raw = gzip.decompress(b''.join(pieces))
    assert hashlib.sha256(raw).hexdigest() == expected, name
    old = json.loads(raw)
    assert old.pop('mappingBuildId') == build_id, name
    assert old == current, name + ' browser mapping changed'
    print(name, 'published browser mapping exactly matches current content')
