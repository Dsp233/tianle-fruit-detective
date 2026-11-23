"""Read-only refusal tests for main integration; no network or Git mutations."""
import unittest
from unittest.mock import patch
import production_gate as g

BASE = "a" * 40
HEAD = "b" * 40
MERGE = "c" * 40

class ProductionGateTests(unittest.TestCase):
    def git(self, *args):
        if args[:3] == ("show", "-s", "--format=%P"):
            return BASE + " " + HEAD + "\n"
        return "deadbeef\n"

    def test_preserves_existing_site_product(self):
        def drift(ref, candidate):
            return set() if ref == g.ROLLBACK else {"index.html"}
        with patch.object(g, "git", side_effect=self.git), \
             patch.object(g, "changed_paths", return_value=set()), \
             patch.object(g, "product_drift", side_effect=drift):
            result = g.verify("main", BASE, HEAD, MERGE)
        self.assertEqual(result["result"], "PASS")
        self.assertEqual(result["reference"], g.ROLLBACK)

    def test_accepts_frozen_g1_product_without_drift(self):
        with patch.object(g, "git", side_effect=self.git), \
             patch.object(g, "changed_paths", return_value=set()), \
             patch.object(g, "product_drift", return_value=set()):
            result = g.verify("main", BASE, HEAD, MERGE)
        self.assertEqual(result["reference"], g.REFERENCE)

    def test_exact_w1_file_identity_only(self):
        path = "reading-quality/check.py"
        with patch.object(g, "changed_paths", return_value={path, "index.html"}):
            with patch.object(g, "git", return_value=g.ACCEPTED_W1_CHECK_BLOB + "\n"):
                self.assertEqual(g.product_drift(g.REFERENCE, MERGE), {"index.html"})
                self.assertEqual(g.product_drift(g.ROLLBACK, MERGE), {path, "index.html"})
            with patch.object(g, "git", return_value="0" * 40 + "\n"):
                self.assertEqual(g.product_drift(g.REFERENCE, MERGE), {path, "index.html"})

    def test_exact_w1_only_change_accepted(self):
        path = "reading-quality/check.py"
        with patch.object(g, "changed_paths", return_value={path}):
            with patch.object(g, "git", return_value=g.ACCEPTED_W1_CHECK_BLOB + "\n"):
                self.assertEqual(g.product_drift(g.REFERENCE, MERGE), set())
    def test_rejects_policy_mutation(self):
        with patch.object(g, "git", side_effect=self.git), \
             patch.object(g, "changed_paths", return_value={".github/workflows/amc8-controlled-pages.yml"}), \
             self.assertRaisesRegex(ValueError, "separately reviewed"):
            g.verify("main", BASE, HEAD, MERGE)

    def test_rejects_runtime_drift_against_both_versions(self):
        with patch.object(g, "git", side_effect=self.git), \
             patch.object(g, "changed_paths", return_value=set()), \
             patch.object(g, "product_drift", return_value={"index.html"}), \
             self.assertRaisesRegex(ValueError, "accepted Git tree"):
            g.verify("main", BASE, HEAD, MERGE)

    def test_rejects_unmatched_merge_parents(self):
        with patch.object(g, "git", return_value="bad parents\n"), \
             self.assertRaisesRegex(ValueError, "parents differ"):
            g.verify("main", BASE, HEAD, MERGE)

if __name__ == "__main__":
    unittest.main()
