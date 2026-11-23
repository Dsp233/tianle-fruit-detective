import copy
import unittest

from ci_permissions import load_workflow, restrict_workflow, verify_workflow


WRITER = """
on:
  push:
    branches: [rc79-fix-example]
    paths: [ready.json]
permissions:
  contents: write
  actions: read
jobs:
  stage:
    steps:
      - uses: actions/checkout@v4
      - run: git push origin HEAD:refs/heads/rc79-fix-example
"""
READER = """
on:
  pull_request:
    branches: [main]
permissions:
  contents: read
jobs:
  validate:
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      - run: python check.py
"""


class PermissionMigrationTests(unittest.TestCase):
    def workflow_pair(self, body):
        original = load_workflow(body)
        return original, restrict_workflow(copy.deepcopy(original))

    def test_confined_writer_keeps_required_access(self):
        original, candidate = self.workflow_pair(WRITER)
        verify_workflow("legacy.yml", original, candidate)
        self.assertEqual(original["permissions"]["contents"], "write")
        self.assertEqual(candidate["jobs"]["stage"]["permissions"],
                         {"contents": "write", "actions": "read"})

    def test_read_checkout_keeps_fetch_options(self):
        original, candidate = self.workflow_pair(READER)
        verify_workflow("read.yml", original, candidate)
        self.assertEqual(candidate["jobs"]["validate"]["steps"][0]["with"],
                         {"fetch-depth": "0", "persist-credentials": "false"})

    def test_rejects_inherited_and_new_write_permissions(self):
        original, candidate = self.workflow_pair(WRITER)
        with self.assertRaisesRegex(ValueError, "outside permission"):
            verify_workflow("legacy.yml", copy.deepcopy(original), original)
        candidate["jobs"]["stage"]["permissions"]["actions"] = "write"
        with self.assertRaisesRegex(ValueError, "outside permission"):
            verify_workflow("legacy.yml", original, candidate)

    def test_rejects_write_events_outside_legacy_branches(self):
        for body in (WRITER.replace("rc79-fix-example", "main"),
                     WRITER.replace("  push:", "  pull_request_target:")):
            with self.subTest(body=body), self.assertRaisesRegex(ValueError, "event/ref restriction"):
                verify_workflow("legacy.yml", *self.workflow_pair(body))

    def test_rejects_reenabled_read_credentials(self):
        original, candidate = self.workflow_pair(READER)
        del candidate["jobs"]["validate"]["steps"][0]["with"]["persist-credentials"]
        with self.assertRaisesRegex(ValueError, "outside permission"):
            verify_workflow("read.yml", original, candidate)

    def test_rejects_changed_checkout_ref_or_removed_step(self):
        original, candidate = self.workflow_pair(READER)
        candidate["jobs"]["validate"]["steps"].pop()
        with self.assertRaisesRegex(ValueError, "outside permission"):
            verify_workflow("read.yml", original, candidate)
        original, candidate = self.workflow_pair(READER)
        candidate["jobs"]["validate"]["steps"][0]["with"]["ref"] = "different"
        with self.assertRaisesRegex(ValueError, "outside permission"):
            verify_workflow("read.yml", original, candidate)
