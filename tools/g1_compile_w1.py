"""Run the original math compiler while holding the verified W1 R2 seed fixed."""

import hashlib
import importlib
import json
from pathlib import Path
import runpy
import sys

from g1_rebuild_w1_reading import W1_SHA256

RAW_SHA = "463ded01d3d17c9ca6b1b726d973419838643224cb888390ae85a0609fa9a11e"
MAPPING_SHA = "f55f248abb8f46e201ead1d35a20598e387484f93a49874123d80f2513b37839"


def prime_projection_index(source, compiler, expected_digest):
    # The original CommonJS projections eagerly load the default index before
    # receiving the newly compiled mapping. Supply that generated index first.
    mapping = compiler.compile_mapping()
    body = (json.dumps(mapping, ensure_ascii=False, indent=2) + "\n").encode()
    if hashlib.sha256(body).hexdigest() != expected_digest:
        raise ValueError("Compiled W1 exam index bytes drifted")
    (source / "exam_runtime_index.json").write_bytes(body)
    return mapping


def compile_w1(root):
    source = root / "source"
    if hashlib.sha256((source / "reading_data.js").read_bytes()).hexdigest() != W1_SHA256:
        raise ValueError("W1 compiler did not receive the verified R2 reading seed")
    sys.path.insert(0, str(source))
    compiler = importlib.import_module("compile_exam_mapping")
    lock = json.loads(Path(__file__).with_name("g1-source-lock.json").read_bytes())
    mapping = prime_projection_index(source, compiler, lock["examIndexSha256"])
    # Reuse the result of the original compiler for build.py; emit_outputs
    # still runs all of its projections and compatibility checks.
    compiler.compile_mapping = lambda: mapping
    # Historical W1 integration uses the already compiled R2 data with the
    # pre-R2 template compiler. Its own R1 hook would otherwise replace them.
    importlib.import_module("build_reading").build = lambda **_: None
    sys.argv = [str(source / "build.py")]
    runpy.run_path(sys.argv[0], run_name="__main__")
    index = json.loads((source / "exam_runtime_index.json").read_bytes())
    del index["mappingBuildId"], index["inputFiles"]
    semantic_bytes = json.dumps(index, ensure_ascii=False, sort_keys=True, separators=(",", ":")).encode()
    if hashlib.sha256(semantic_bytes).hexdigest() != MAPPING_SHA:
        raise ValueError("W1 math mapping semantics drifted")
    for name in ("index.html", "amc8/index.html", "source/index.html"):
        if hashlib.sha256((root / name).read_bytes()).hexdigest() != RAW_SHA:
            raise ValueError(f"W1 raw build drifted: {name}")


if __name__ == "__main__":
    compile_w1(Path(sys.argv[1]))
