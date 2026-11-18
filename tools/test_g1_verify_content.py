import hashlib
import json
from pathlib import Path
from tempfile import TemporaryDirectory
import unittest
from unittest.mock import patch

import g1_verify_content as verify


class InputVerificationTests(unittest.TestCase):
    def setUp(self):
        directory = TemporaryDirectory()
        self.addCleanup(directory.cleanup)
        self.root = Path(directory.name)
        self.content = self.root / "content"
        self.content.mkdir()
        self.item = self.content / "lesson.json"
        self.item.write_bytes(b"{}")
        self.files = {"content/lesson.json": hashlib.sha256(b"{}").hexdigest()}

    def test_valid(self):
        self.assertEqual(verify.verify_tree(self.content, self.files), 1)

    def test_missing(self):
        self.item.unlink()
        with self.assertRaisesRegex(ValueError, "1 missing"):
            verify.verify_tree(self.content, self.files)

    def test_wrong_hash(self):
        self.item.write_bytes(b"[]")
        with self.assertRaisesRegex(ValueError, "SHA-256 mismatch"):
            verify.verify_tree(self.content, self.files)

    def test_unexpected_file(self):
        (self.content / "unused.json").touch()
        with self.assertRaisesRegex(ValueError, "1 unexpected"):
            verify.verify_tree(self.content, self.files)

    def test_symlink(self):
        self.item.unlink()
        external = self.root / "outside.json"
        external.write_bytes(b"{}")
        self.item.symlink_to(external)
        with self.assertRaisesRegex(ValueError, "Symlink"):
            verify.verify_tree(self.content, self.files)

    def test_manifest_cannot_approve_a_modified_input(self):
        index = self.root / "index.json"
        index.write_text(json.dumps({"inputFiles": self.files}))
        pinned = verify.manifest_sha256(self.files)
        with patch.object(verify, "EXPECTED_FILES", 1), patch.object(verify, "EXPECTED_INPUTS_SHA256", pinned):
            self.assertEqual(verify.read_contract(index), self.files)
            index.write_text(json.dumps({"inputFiles": {"content/lesson.json": "0" * 64}}))
            with self.assertRaisesRegex(ValueError, "differs from frozen W1"):
                verify.read_contract(index)


if __name__ == "__main__":
    unittest.main()
