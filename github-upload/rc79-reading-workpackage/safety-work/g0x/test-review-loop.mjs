import assert from 'node:assert/strict';
import {test} from 'node:test';
import {mkdtemp, readFile, readdir, rm, writeFile} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {runReviewLoop} from './review-loop.mjs';

test('R5 loop renews, reuses uncommitted evidence, and checkpoints consecutive families', async () => {
  const dir = await mkdtemp(path.join(os.tmpdir(), 'g0x-review-'));
  try {
    let state = JSON.parse(await readFile(new URL('./queue.json', import.meta.url), 'utf8'));
    const task = () => state.tasks.find(item => item.id === 'M-R5-REVIEW');
    const owner = 'test-independent-reviewer';
    const leaseId = 'test-lease';
    const ledger = task().semanticReview;
    const sourceSha = ledger.candidateSourceSha;
    const [first, second, third] = ledger.familyIds;
    Object.assign(ledger, {reviews: {}, completedCount: 0, issueCount: 0, nextFamilyId: first, lastReviewAt: null});
    task().status = 'ACTIVE';
    task().block = null;
    task().resultSha = null;
    task().completedAt = null;
    task().lease = {owner, id: leaseId, role: 'independent-reviewer', claimedAt: new Date().toISOString(), expiresAt: new Date(Date.now()+60_000).toISOString()};
    const worker = path.join(dir, 'worker');
    const log = path.join(dir, 'calls');
    await writeFile(worker, `#!/usr/bin/env node
const {appendFileSync}=require('node:fs');
const [sourceSha,familyId,reviewerRef]=process.argv.slice(2);
appendFileSync(${JSON.stringify(log)}, familyId+'\\n');
if(familyId===${JSON.stringify(third)}) process.exit(17);
const checks=Object.fromEntries(${JSON.stringify(ledger.dimensions)}.map(dim=>[dim,{status:'PASS',note:'Synthetic check. This is not a real review.',evidenceRef:'test/synthetic/receipt'}]));
console.log(JSON.stringify({sourceSha,familyId,reviewerRef,checks}));
`, {mode: 0o700});

    const transitions = [];
    let failFirstCheckpoint = true;
    const options = {owner, leaseId, sourceSha, worker, receiptDir: dir, ttlMinutes: 5,
      read: async () => ({state}),
      transact: async (command, snapshot, mutate) => {
        assert.equal(snapshot.state.revision, state.revision);
        if (command === 'review-checkpoint' && failFirstCheckpoint) {
          failFirstCheckpoint = false;
          throw Error('simulated write interruption');
        }
        state = mutate(state);
        transitions.push(command);
        return {state};
      }};

    await assert.rejects(runReviewLoop(options), /simulated write interruption/);
    assert.deepEqual(transitions, ['renew']);
    assert.notEqual(task().semanticReview.reviews[first]?.status, 'PASS');
    await assert.rejects(runReviewLoop(options), /exit 17/);
    assert.equal(task().semanticReview.reviews[first].status, 'PASS');
    assert.equal(task().semanticReview.reviews[second].status, 'PASS');
    assert.equal(task().semanticReview.nextFamilyId, third);
    assert.deepEqual((await readFile(log, 'utf8')).trim().split('\n'), [first, second, third]);
    const entries = await readdir(path.join(dir, sourceSha));
    assert.equal(entries.filter(name => name.includes('.stopped-')).length, 2);

    task().lease.expiresAt = new Date(Date.now()-1_000).toISOString();
    await assert.rejects(runReviewLoop(options), /current, unexpired lease/);
    assert.deepEqual(await readdir(path.join(dir, sourceSha)), entries);
    assert.deepEqual(transitions, ['renew', 'review-checkpoint', 'review-checkpoint']);
  } finally {
    await rm(dir, {recursive: true, force: true});
  }
});
