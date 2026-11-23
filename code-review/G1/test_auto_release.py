"""Positive and refusal tests for the separately implemented release preflight."""
import unittest
from types import SimpleNamespace
from unittest.mock import patch

import auto_release as a

MAIN = "a" * 40
BASE = "b" * 40
HEAD = "c" * 40


class ReleasePreflightTests(unittest.TestCase):
    def fake_git(self, *args):
        if args[:3] == ("show", "-s", "--format=%P"):
            return (BASE + " " + HEAD + "\n").encode()
        return b""

    def test_accept_exact_product_with_policy_only_changes(self):
        with patch.object(a, "git", side_effect=self.fake_git), \
             patch.object(a, "paths_changed", return_value=set(a.POLICY_FILES)), \
             patch.object(a.subprocess, "run", return_value=SimpleNamespace(returncode=0)):
            result = a.check("release", MAIN, MAIN, BASE, HEAD)
        self.assertEqual(result["decision"], "PASS")
        self.assertEqual(result["productDrift"], 0)

    def test_reject_runtime_or_learning_data_drift(self):
        for path in ("index.html", "assets/reading/surprise.js",
                     "data/learning-records.json"):
            with self.subTest(path=path), patch.object(a, "git", side_effect=self.fake_git), \
                 patch.object(a, "paths_changed", return_value={path}), \
                 self.assertRaisesRegex(ValueError, "Unapproved product"):
                a.check("release", MAIN, MAIN)

    def test_accept_exact_frozen_current_site_before_g1_product(self):
        def differences(before, after):
            return set(a.POLICY_FILES) if before == a.FROZEN_ROLLBACK else {"index.html"}
        with patch.object(a, "git", side_effect=self.fake_git), \
             patch.object(a, "paths_changed", side_effect=differences), \
             patch.object(a.subprocess, "run", return_value=SimpleNamespace(returncode=0)):
            result = a.check("release", MAIN, MAIN)
        self.assertEqual(result["reference"], a.FROZEN_ROLLBACK)

    def test_accept_new_g1_w1_product_only_at_exact_tree(self):
        def differences(before, after):
            return set(a.POLICY_FILES) if before == a.APPROVED_G1 else {"reading-quality/check.py"}
        with patch.object(a, "git", side_effect=self.fake_git), \
             patch.object(a, "paths_changed", side_effect=differences), \
             patch.object(a.subprocess, "run", return_value=SimpleNamespace(returncode=0)):
            result = a.check("release", MAIN, MAIN, BASE, HEAD)
        self.assertEqual(result["reference"], a.APPROVED_G1)

    def test_accept_original_verified_g1_product(self):
        def differences(before, after):
            return set(a.POLICY_FILES) if before == a.RELEASE_PRODUCT else {"reading-quality/check.py"}
        with patch.object(a, "git", side_effect=self.fake_git), \
             patch.object(a, "paths_changed", side_effect=differences), \
             patch.object(a.subprocess, "run", return_value=SimpleNamespace(returncode=0)):
            result = a.check("release", MAIN, MAIN)
        self.assertEqual(result["reference"], a.RELEASE_PRODUCT)

    def test_reject_stale_or_unmatched_main(self):
        with self.assertRaisesRegex(ValueError, "not current main"):
            a.check("release", MAIN, HEAD)

    def test_reject_forged_test_merge_parents(self):
        with patch.object(a, "git", return_value=b"a b\n"), \
             self.assertRaisesRegex(ValueError, "parent mismatch"):
            a.check("release", MAIN, MAIN, BASE, HEAD)

    def test_reject_policy_file_missing(self):
        with patch.object(a, "git", side_effect=self.fake_git), \
             patch.object(a, "paths_changed", return_value=set()), \
             patch.object(a.subprocess, "run", return_value=SimpleNamespace(returncode=1)), \
             self.assertRaisesRegex(ValueError, "Missing trusted policy"):
            a.check("release", MAIN, MAIN)

    def test_rollback_only_to_pre_g1_snapshot(self):
        with patch.object(a, "git", side_effect=self.fake_git), \
             patch.object(a, "paths_changed", return_value=set()):
            self.assertEqual(a.check("rollback", a.FROZEN_ROLLBACK, MAIN)["decision"], "PASS")
            with self.assertRaisesRegex(ValueError, "frozen"):
                a.check("rollback", HEAD, MAIN)

    def test_reject_malformed_sha_and_incomplete_pr_identity(self):
        with self.assertRaisesRegex(ValueError, "full, lowercase"):
            a.check("release", "short", MAIN)
        with self.assertRaisesRegex(ValueError, "together"):
            a.check("release", MAIN, MAIN, base=BASE)


if __name__ == "__main__":
    unittest.main()
