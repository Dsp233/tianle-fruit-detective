"""Rebuild the application while preserving the verified HOME1 reading data.

The local environment does not have pypinyin. This repair changes application
code, not the 84-day content or pronunciation table. Verify the exact frozen
reading_data.js before allowing the normal builder to consume it.
"""
import hashlib
import importlib
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
