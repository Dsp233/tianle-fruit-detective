import unittest

from quality_foundation import affected_checks, check_frozen_runtime, check_workflow, protected_paths


READ_ONLY = """on: [pull_request]
permissions:
  contents: read
jobs:
  verify:
    steps:
      - uses: actions/checkout@v4
        with:
          persist-credentials: false
"""


class FoundationTests(unittest.TestCase):
    def test_accepts_read_only_candidate(self):
        check_workflow("workflow.yml", READ_ONLY)
        check_frozen_runtime(["docs/engineering/governance/REPORT.md"], {"index.html"})

    def test_rejects_workflow_write(self):
        with self.assertRaisesRegex(ValueError, "contents: read"):
            check_workflow("workflow.yml", READ_ONLY.replace("contents: read", "contents: write"))

    def test_rejects_job_write_override(self):
        with self.assertRaisesRegex(ValueError, "elevated job"):
            check_workflow("workflow.yml", READ_ONLY.replace("    steps:", "    permissions: write-all\n    steps:"))

    def test_rejects_default_checkout_credentials(self):
        with self.assertRaisesRegex(ValueError, "credentials persisted"):
            check_workflow("workflow.yml", READ_ONLY.replace("        with:\n          persist-credentials: false\n", ""))

    def test_rejects_target_event(self):
        with self.assertRaisesRegex(ValueError, "pull_request_target"):
            check_workflow("workflow.yml", READ_ONLY.replace("pull_request", "pull_request_target"))

    def test_rejects_empty_job(self):
        with self.assertRaisesRegex(ValueError, "empty verification job"):
            check_workflow("workflow.yml", READ_ONLY.split("steps:")[0] + "steps: []\n")

    def test_rejects_locked_output_and_new_generated_shard(self):
        protected = protected_paths("producer\tcr5_sha256\tpath\nbuild\tproof\tindex.html\n", {"runtime": {}})
        for path in ("index.html", "tools/g1-source-lock.json", "assets/g1-runtime/extra.js", "canonical/w1/new.js"):
            with self.subTest(path=path), self.assertRaisesRegex(ValueError, "Frozen runtime"):
                check_frozen_runtime([path], protected)

    def test_retains_all_applicable_routes(self):
        self.assertEqual(affected_checks(["canonical/w1/source/progress_store.js",
                                         ".github/workflows/w1-illustration.yml", "new_entry.js"]),
                         {"canonical/w1/source/progress_store.js": ["storage", "build"],
                          ".github/workflows/w1-illustration.yml": ["workflow", "release"],
                          "new_entry.js": ["unmapped: manual applicability review"]})


if __name__ == "__main__":
    unittest.main()
