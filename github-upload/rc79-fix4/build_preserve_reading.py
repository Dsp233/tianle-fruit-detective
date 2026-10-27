"""Rebuild the application while preserving the verified HOME1 reading data.

The local environment does not have pypinyin. This repair changes application
code, not the 84-day content or pronunciation table. Verify the exact frozen
reading_data.js before allowing the normal builder to consume it.
"""
import hashlib
import importlib
import json
import runpy
import sys
from pathlib import Path

root = Path(sys.argv[1]).resolve() if len(sys.argv) > 1 else Path(__file__).resolve().parent / "work" / "source"
data = root / "reading_data.js"
actual = hashlib.sha256(data.read_bytes()).hexdigest()
expected = "0c8ad843af039308d749ce44f75ad74577b5fce96ffd009e18f770b13c849358"
if actual != expected:
    raise RuntimeError("Frozen reading data differs from the verified baseline")
sys.path.insert(0, str(root))
module = importlib.import_module("build_reading")
module.build = lambda **kwargs: None
sys.argv = [str(root / "build.py")]
runpy.run_path(str(root / "build.py"), run_name="__main__")
# Recompiling after runtime fixes changes the mapping build identifier because
# it hashes runtime source files. Keep the identifier honest, and allow the
# earlier one only if the complete mathematical mapping is byte-equivalent
# after excluding the compiler's own input-hash metadata.
release=json.loads((root / "version.json").read_text(encoding="utf-8"))
expected_semantics="f55f248abb8f46e201ead1d35a20598e387484f93a49874123d80f2513b37839"
baseline_ids=["a1d855c798c8458a6ea5d99c709e54e8341b87b23aa12b1c89211164e793ebb9",
              "f881e9a2aadd16e35dc6a6eb9f9df87597dba298d3204e58d536a93f2421d07a",
              "eeedb3aefdb021fab8c829171b4580fe9ff5a8b35f06a2a7c9678d3edc226da6",
              "3838dcb354ee34c2b183e9781d9141516f69fd4f01ec84f725c6fafd5dcac63d"]
if release.get("compatibleMappingBuildIds") != baseline_ids or release.get("compatibleMappingSemanticSha256") != expected_semantics:
    raise RuntimeError("Mapping compatibility declaration differs from the verified baseline")
mapping=json.loads((root / "exam_runtime_index.json").read_text(encoding="utf-8"))
mapping.pop("mappingBuildId",None)
mapping.pop("inputFiles",None)
canonical=json.dumps(mapping,ensure_ascii=False,sort_keys=True,separators=(",",":")).encode("utf-8")
if hashlib.sha256(canonical).hexdigest()!=expected_semantics:
    raise RuntimeError("Mapping semantics changed; old sessions cannot be declared compatible")
approved_ui={"index.template.html":"2b0e32f513ea4c01fb937009f830b4061605325377ce6995e7e82a71db6c7811",
             "selection_diagnostics.js":"374fc00d20bb08783542617c3dd61ac0a6bc9be467d8f7549b46863c660fcf19"}
if release.get("jointReuseCompatibleUiHashes")!=approved_ui:
    raise RuntimeError("Joint evidence UI compatibility declaration changed")
old_native=json.loads((root / "joint_native_snapshot.json").read_text(encoding="utf-8"))["sourceHashes"]
current_native=importlib.import_module("native_reuse_inputs").source_hashes()
if current_native!={**old_native,**approved_ui}:
    raise RuntimeError("Native task or grading sources changed; old joint evidence needs review")
print("Verified baseline-compatible mathematics mapping semantics")
