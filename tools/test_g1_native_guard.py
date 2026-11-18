"""Canonical source controls and legacy overwrite protection."""

import json
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest

import build_site as site
from g1_offline_build import provision


class NativeGuards(unittest.TestCase):
    def test_forged_manifest_rejected_before_creating_dist(self):
        with tempfile.TemporaryDirectory() as temporary:
            directory = Path(temporary)
            source = directory / "source"
            source.mkdir()
            (source / "exam-content-lock.json").write_text(json.dumps({"content/other.json": "0" * 64}))
            args = [sys.executable, "-B", str(site.ROOT / "tools/build_site.py"), "build",
                    "--inputs", str(source), "--output", str(directory / "dist")]
            result = subprocess.run(args, capture_output=True, text=True)
            self.assertNotEqual(result.returncode, 0)
            self.assertIn("Exam content manifest differs from frozen W1", result.stderr)
            self.assertFalse((directory / "dist").exists())

    def test_bad_bundle_rejected_before_git_provisioning(self):
        with tempfile.TemporaryDirectory() as temporary:
            directory = Path(temporary)
            bundle = directory / "invalid.bundle"
            bundle.write_bytes(b"untrusted bytes")
            recipe = json.loads(site.SOURCE_LOCK.read_bytes())["canonicalSource"]
            with self.assertRaisesRegex(ValueError, "bundle SHA-256 mismatch"):
                provision(bundle, recipe, directory / "provisioned")
            self.assertFalse((directory / "provisioned").exists())

    def test_compiler_extra_paths_and_substitutions_fail(self):
        with tempfile.TemporaryDirectory() as temporary:
            source = Path(temporary)
            inputs = {"build.py": site.sha(b"original")}
            (source / "build.py").write_bytes(b"original")
            site.verify_locked_directory(source, inputs)
            (source / "unused.json").touch()
            with self.assertRaisesRegex(ValueError, "Unexpected generated runtime paths"):
                site.verify_locked_directory(source, inputs)
            (source / "unused.json").unlink()
            (source / "build.py").write_bytes(b"replaced")
            with self.assertRaisesRegex(ValueError, "SHA-256 mismatch: build.py"):
                site.verify_locked_directory(source, inputs)

    def test_legacy_builder_cannot_overwrite_the_current_release(self):
        names = ["index.html", "amc8/index.html", "source/index.html", "reading-art/release.json"]
        before = {name: site.body_at(site.ROOT, name) for name in names}
        result = subprocess.run([sys.executable, "-B", str(site.ROOT / "reading-quality/build.py")],
                                cwd=site.ROOT, capture_output=True, text=True)
        self.assertNotEqual(result.returncode, 0)
        self.assertIn("refused before writing", result.stderr)
        self.assertEqual({name: site.body_at(site.ROOT, name) for name in names}, before)


if __name__ == "__main__":
    unittest.main()
