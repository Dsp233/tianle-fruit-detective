"""Offline release-envelope regression tests; does not touch main or publish Pages."""
import hashlib
import json
import shutil
import tempfile
import unittest
from pathlib import Path

from g5_release_envelope import (
    ALLOWLIST, WORKFLOW, VERIFY, STAGER, MANIFEST, REQUIRED,
    checksum, stage, verify_contract
)

ROOT = Path(__file__).resolve().parents[4]  # github-upload/rc79-reading-workpackage...
# Resolve actual checkout root instead of relying on the test's current directory.
ROOT = next(p for p in Path(__file__).resolve().parents if (p / WORKFLOW).is_file())
MAIN_SHA = '23755d3aa9bf9e479468bb24263f81ea8228430e'
SRC_SHA = 'c8575da9d28c40b5bf79412928a0be8c397e7094'


class G5EnvelopeTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        root = Path(self.tmp.name)
        self.main = root / 'main'
        self.candidate = root / 'candidate'
        self.frozen = root / 'frozen'
        self.output = root / 'release'
        for d in (self.main, self.candidate, self.frozen):
            d.mkdir()
        old = {'deliveryRevision': 'RC79-FIX15', 'dataCompatibility': {'storageVersion': 2},
               'entryFiles': {}, 'candidateId': 'old'}
        p = self.main / MANIFEST
        p.parent.mkdir(parents=True, exist_ok=True)
        p.write_text(json.dumps(old), encoding='utf-8')
        rows = []
        for i, name in enumerate(sorted(REQUIRED)):
            oldbytes = ('old ' + name).encode()
            newbytes = oldbytes if i == 0 else ('new ' + name).encode()
            a = self.main / name
            a.parent.mkdir(parents=True, exist_ok=True)
            a.write_bytes(oldbytes)
            f = self.frozen / name
            f.parent.mkdir(parents=True, exist_ok=True)
            f.write_bytes(newbytes)
            rows.append({'path': name, 'action': 'retain' if i == 0 else 'replace',
                         'oldSha256': checksum(oldbytes), 'newSha256': checksum(newbytes)})
        allow = {'status': 'PROPOSED_ALLOWLIST_NOT_DEPLOYED', 'source': SRC_SHA,
                 'mainBaseline': MAIN_SHA, 'artifactId': 13595790278,
                 'keepOtherMainPaths': True, 'deletes': [], 'actions': rows}
        self.allow = allow
        self.save_allowlist()
        for name in (WORKFLOW, VERIFY, STAGER):
            p = self.candidate / name
            p.parent.mkdir(parents=True, exist_ok=True)
            shutil.copyfile(ROOT / name, p)

    def save_allowlist(self):
        p = self.candidate / ALLOWLIST
        p.parent.mkdir(parents=True, exist_ok=True)
        p.write_text(json.dumps(self.allow, indent=2) + '\n', encoding='utf-8')

    def test_stage_includes_runtime_workflow_verifier_and_bound_manifest(self):
        receipt = stage(self.candidate, self.main, self.frozen, self.output, MAIN_SHA, 'a' * 64)
        self.assertEqual(receipt['state'], 'STAGED_NOT_DEPLOYED')
        self.assertEqual(receipt['copiedRuntimeFiles'], 3)
        self.assertEqual(receipt['runtimeActionCount'], 4)
        self.assertEqual(len(receipt['supportFiles']), 4)
        for p in (WORKFLOW, VERIFY, STAGER, ALLOWLIST):
            self.assertEqual((self.output / p).read_bytes(), (self.candidate / p).read_bytes())
        m = json.loads((self.output / MANIFEST).read_text())
        self.assertEqual(m['deliveryRevision'], 'RC79-W1')
        self.assertEqual(m['sourceCommit'], SRC_SHA)
        self.assertEqual(m['previousDeliveryCommit'], MAIN_SHA)
        self.assertEqual(m['w1ArtifactId'], 13595790278)
        self.assertEqual(m['w1AllowlistSha256'], checksum((self.candidate / ALLOWLIST).read_bytes()))
        self.assertNotIn('rawApplicationBuildSha256', m)
        self.assertFalse((self.output / '.git').exists())
        self.assertTrue((self.output / 'w1-g5-staging-receipt.json').exists())
        for row in self.allow['actions']:
            self.assertEqual(checksum((self.output / row['path']).read_bytes()), row['newSha256'])

    def test_preflight_catches_wrong_baseline(self):
        with self.assertRaisesRegex(ValueError, 'main SHA mismatch'):
            verify_contract(self.candidate, self.main, '0' * 40)

    def test_preflight_catches_missing_workflow(self):
        (self.candidate / WORKFLOW).unlink()
        with self.assertRaisesRegex(ValueError, 'missing release support'):
            verify_contract(self.candidate, self.main, MAIN_SHA)

    def test_preflight_catches_old_runtime_mismatch(self):
        p = self.main / 'index.html'
        p.write_text('changed after allowlist', encoding='utf-8')
        with self.assertRaisesRegex(ValueError, 'baseline changed'):
            verify_contract(self.candidate, self.main, MAIN_SHA)

    def test_preflight_catches_unapproved_asset(self):
        self.allow['actions'].append({'path': 'secret-token.txt', 'action': 'add',
                                      'oldSha256': None, 'newSha256': 'f' * 64})
        self.save_allowlist()
        with self.assertRaisesRegex(ValueError, 'unapproved runtime'):
            verify_contract(self.candidate, self.main, MAIN_SHA)

    def test_stage_catches_corrupt_frozen_bytes_and_cleans_output(self):
        (self.frozen / 'index.html').write_bytes(b'corrupt')
        # index.html might be retain by sort order, choose a changed entry
        wrong = next(row['path'] for row in self.allow['actions'] if row['action'] == 'replace')
        (self.frozen / wrong).write_bytes(b'bad bytes')
        with self.assertRaisesRegex(ValueError, 'frozen artifact hash mismatch'):
            stage(self.candidate, self.main, self.frozen, self.output, MAIN_SHA, 'b' * 64)
        self.assertFalse(self.output.exists())


if __name__ == '__main__':
    unittest.main()
