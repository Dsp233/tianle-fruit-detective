"""Exercise the downstream site build using public W1 stage fixtures only."""

import json
from pathlib import Path
import subprocess
import sys
import tempfile
from types import SimpleNamespace
import unittest

import build_site as site
from g1_compile_w1 import prime_projection_index


W1_RELEASE = "7e1b5df76e63abcb45836200dbde4d06e88eaf35"
OLD = json.loads((site.EVIDENCE / "local-reconstruction-receipt.json").read_text())[
    "historicalPackagedFilesEqualToArchive"
]


def git_blob(revision, name):
    return subprocess.check_output(["git", "show", f"{revision}:{name}"], cwd=site.ROOT)


def release_fixture(root):
    """Materialize previously published W1 packer outputs without any archive.

    Entrypoints use the old public Git revision. Other content-addressed
    outputs are retained in the current checkout and must match the prior
    packer receipt. This fixture cannot be passed to the production build CLI.
    """
    root.mkdir()
    for name, digest in OLD.items():
        body = git_blob(W1_RELEASE, name) if name.endswith(".html") else site.body_at(site.ROOT, name, digest)
        if site.sha(body) != digest:
            raise ValueError(f"Unexpected public fixture bytes: {name}")
        site.put(root, name, body)
    for name in ("muse/rc79/loading-r1/package-report.json",
                 "third-party-notices/pako-1.0.11.txt"):
        site.put(root, name, site.body_at(site.ROOT, name))
    report = json.loads(git_blob(W1_RELEASE, site.REPORT))
    # Isolate the published report's template from its annotations so the
    # existing packer-to-release report transformation runs in the smoke test.
    report["revision"] = "RC79-FIX15"
    site.put(root, site.REPORT, (json.dumps(report, ensure_ascii=False, indent=2) + "\n").encode())


class ReleaseTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.scratch = tempfile.TemporaryDirectory(prefix="g1-public-fixture-")
        cls.addClassCleanup(cls.scratch.cleanup)
        cls.root = Path(cls.scratch.name)
        cls.packed = cls.root / "packed"
        cls.release = cls.root / "release"
        release_fixture(cls.packed)
        cls.files = site.assemble_release(cls.packed, cls.release)

    def test_public_fixture_exact_runtime_and_approved_differences(self):
        changes = json.loads((site.EVIDENCE / "approved-runtime-diff.json").read_text())["changed"]
        changed = subprocess.check_output(
            ["git", "diff", "--name-only", site.MAIN, site.CR5], cwd=site.ROOT, text=True)
        self.assertEqual(set(changed.splitlines()) & self.files.keys(), changes.keys())
        for path, record in changes.items():
            self.assertEqual(site.sha(git_blob(site.MAIN, path)), record["main"])
            self.assertEqual(self.files[path], record.get("g1", record["cr5"]))
        changed_in_candidate = subprocess.check_output(
            ["git", "diff", "--name-only", site.CR5], cwd=site.ROOT, text=True)
        self.assertEqual(set(changed_in_candidate.splitlines()) & self.files.keys(),
                         {path for path, record in changes.items() if "g1" in record})
        for name, digest in self.files.items():
            site.body_at(site.ROOT, name, digest)
        print(f"FIXTURE_RUNTIME_EXACT files={len(self.files)} approved_main_deltas={len(changes)}")

    def test_corrupted_generated_entry_is_rejected(self):
        name = "index.html"
        original = (self.release / name).read_bytes()
        try:
            (self.release / name).write_bytes(original + b"\n<!-- unexpected edit -->\n")
            with self.assertRaisesRegex(ValueError, "SHA-256 mismatch: index.html"):
                site.verify_dist(self.release)
        finally:
            (self.release / name).write_bytes(original)

    def test_corrupted_illustration_is_rejected(self):
        illustrated = next(p for p in self.files if p.startswith("assets/reading-art/") and p.endswith(".webp"))
        target = self.release / illustrated
        original = target.read_bytes()
        try:
            target.write_bytes(b"broken WEBP")
            with self.assertRaisesRegex(ValueError, "SHA-256 mismatch: assets/reading-art/"):
                site.verify_dist(self.release)
        finally:
            target.write_bytes(original)

    def test_missing_math_shard_cannot_fall_back_to_git(self):
        name = next(p for p in OLD if p.startswith("assets/loading-r2/"))
        path = self.packed / name
        original = path.read_bytes()
        try:
            path.unlink()
            with self.assertRaisesRegex(ValueError, "Missing or non-regular file: assets/loading-r2/"):
                site.assemble_release(self.packed, self.root / "missing-shard")
        finally:
            path.write_bytes(original)

    def test_legacy_builder_rejects_staged_current_entries(self):
        result = subprocess.run(
            [sys.executable, "-B", str(site.ROOT / "reading-quality/build.py"),
             "--staged-root", str(self.release)], text=True, capture_output=True)
        self.assertNotEqual(result.returncode, 0, result)
        self.assertIn("Unexpected pre-language entry bytes: index.html", result.stderr)
        self.assertEqual(site.verify_dist(self.release), self.files)

    def test_existing_checkout_guard_leaves_release_unchanged(self):
        result = subprocess.run(
            [sys.executable, "-B", str(site.ROOT / "reading-quality/build.py")],
            cwd=site.ROOT, text=True, capture_output=True)
        self.assertNotEqual(result.returncode, 0, result)
        self.assertIn("refused before writing", result.stderr)
        for name, digest in self.files.items():
            site.body_at(site.ROOT, name, digest)

    def test_git_source_preparation_rebuilds_inline_home_image_exactly(self):
        target = self.root / "sources"
        lock = json.loads(site.SOURCE_LOCK.read_text())
        site.restore_git_sources(target, lock)
        site.body_at(target, "source/home_portal.js", lock["homePanda"]["originalSourceSha256"])

    def test_projection_bootstrap_uses_fresh_index_instead_of_archived_output(self):
        source = self.root / "projection-fixture"
        source.mkdir()
        mapping = {"mappingBuildId": "synthetic", "inputFiles": {}}
        expected = b'{\n  "mappingBuildId": "synthetic",\n  "inputFiles": {}\n}\n'
        compiler = SimpleNamespace(compile_mapping=lambda: mapping)
        with self.assertRaisesRegex(ValueError, "Compiled W1 exam index bytes drifted"):
            prime_projection_index(source, compiler, "0" * 64)
        self.assertFalse((source / "exam_runtime_index.json").exists())
        self.assertIs(prime_projection_index(source, compiler, site.sha(expected)), mapping)
        read = subprocess.check_output(
            ["node", "-e", "process.stdout.write(require('./exam_runtime_index.json').mappingBuildId)"],
            cwd=source, text=True)
        self.assertEqual(read, "synthetic")

    def test_official_entry_rejects_forged_fingerprint_contract(self):
        inputs = self.root / "forged-supply"
        inputs.mkdir()
        (inputs / "exam-content-lock.json").write_text('{"content/example.json":"' + "0" * 64 + '"}')
        output = self.root / "dist"
        result = subprocess.run(
            [sys.executable, "-B", str(site.TOOLS / "build_site.py"), "build",
             "--inputs", str(inputs), "--output", str(output)], text=True, capture_output=True)
        self.assertNotEqual(result.returncode, 0, result)
        self.assertIn("Exam content manifest differs from frozen W1", result.stderr)
        self.assertFalse(output.exists())


if __name__ == "__main__":
    unittest.main()
