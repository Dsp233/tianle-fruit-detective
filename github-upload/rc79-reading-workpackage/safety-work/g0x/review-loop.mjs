import {spawn} from 'node:child_process';
import {readFile, mkdir, writeFile, rename, rmdir} from 'node:fs/promises';
import path from 'node:path';
import {randomUUID} from 'node:crypto';
import {checkpointSemanticReview, renew, finish, block} from './queue-core.mjs';

const id = 'M-R5-REVIEW';

export async function runReviewLoop({read, transact, owner, leaseId, sourceSha, worker, receiptDir, ttlMinutes}) {
  const common = () => ({id, owner, leaseId, at: new Date().toISOString()});
  const receipts = path.resolve(receiptDir, sourceSha);
  await mkdir(receipts, {recursive: true});
  const lock = path.join(receipts, `${Buffer.from(leaseId).toString('base64url')}.running`);
  await mkdir(lock);
  let terminalReason = 'completed';

  function owned(snapshot) {
    const task = snapshot.state.tasks.find(item => item.id === id);
    if (task?.status !== 'ACTIVE' || task.lease?.owner !== owner || task.lease.id !== leaseId ||
        Date.parse(task.lease.expiresAt) <= Date.now()) {
      throw Error('R5 requires the current, unexpired lease. Use queue-cli recover with verified stop evidence for an expired lease.');
    }
    if (task.semanticReview.candidateSourceSha !== sourceSha) throw Error('R5 candidate changed. Reload the queue before continuing.');
    return task;
  }

  async function commit(command, mutate) {
    // A competing write is safe to retry only after reading and validating the new state.
    for (let attempt = 0; ; attempt += 1) {
      const snapshot = await read();
      owned(snapshot);
      try {
        return await transact(command, snapshot, mutate);
      } catch (error) {
        if (attempt >= 3 || !/HEAD_CONFLICT|REVISION_CONFLICT|GitHub (409|422) \/git\/refs\/heads\//.test(error.message)) throw error;
        const latest = await read();
        owned(latest);
        if (latest.head === snapshot.head && latest.state.revision === snapshot.state.revision) throw error;
      }
    }
  }

  async function keepLease() {
    const task = owned(await read());
    const remaining = Date.parse(task.lease.expiresAt) - Date.now();
    if (remaining <= ttlMinutes * 30_000) {
      await commit('renew', state => renew(state, {...common(), ttlMinutes}));
      return ttlMinutes * 30_000;
    }
    return remaining - ttlMinutes * 30_000;
  }

  async function collect(familyId) {
    const receipt = path.join(receipts, `${familyId}.json`);
    try {
      const cached = JSON.parse(await readFile(receipt, 'utf8'));
      if (cached.reviewerRef === owner) return cached;
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
    }

    const env = {...process.env};
    delete env.GH_TOKEN;
    delete env.GITHUB_TOKEN;
    const child = spawn(worker, [sourceSha, familyId, owner], {env, stdio: ['ignore', 'pipe', 'inherit']});
    let output = '';
    child.stdout.setEncoding('utf8').on('data', chunk => { output += chunk; });
    const done = new Promise((resolve, reject) => {
      child.once('error', reject);
      child.once('close', (code, signal) => {
        if (code === 0) resolve(true);
        else reject(Error(`Reviewer stopped for ${familyId}: ${signal ?? `exit ${code}`}`));
      });
    });
    // Register a handler before the first asynchronous lease check.
    done.catch(() => {});
    try {
      for (;;) {
        const delay = await keepLease();
        let timer;
        const tick = new Promise(resolve => { timer = setTimeout(resolve, Math.max(1, delay), false); });
        try {
          if (await Promise.race([done, tick])) break;
        } finally {
          clearTimeout(timer);
        }
      }
      const review = JSON.parse(output);
      if (review?.familyId !== familyId || review.sourceSha !== sourceSha || review.reviewerRef !== owner) {
        throw Error(`Reviewer receipt identity mismatch for ${familyId}`);
      }
      const pending = `${receipt}.${randomUUID()}.tmp`;
      await writeFile(pending, `${JSON.stringify(review, null, 2)}\n`, {flag: 'wx'});
      await rename(pending, receipt);
      return review;
    } finally {
      if (child.exitCode === null && child.signalCode === null) child.kill();
      await done.catch(() => {});
    }
  }

  async function reviewFamilies() {
    for (;;) {
      await keepLease();
      const task = owned(await read());
      const review = task.semanticReview;
      const familyId = review.familyIds.find(family => !['PASS', 'ISSUE'].includes(review.reviews[family]?.status));
      if (!familyId) {
        if (review.issueCount) {
          const issues = review.familyIds.filter(family => review.reviews[family]?.status === 'ISSUE');
          await commit('block', state => block(state, {...common(), reason: `Candidate ${sourceSha} requires independent issue disposition: ${issues.join(', ')}`}));
          return {status: 'BLOCKED', sourceSha, issues};
        }
        const evidence = [...new Set(Object.values(review.reviews).flatMap(item => Object.values(item.checks).map(check => check.evidenceRef)))];
        await commit('pass', state => finish(state, {...common(), resultSha: sourceSha, evidence}));
        return {status: 'PASS', sourceSha, completedCount: review.completedCount};
      }

      const receipt = await collect(familyId);
      if (receipt?.familyId !== familyId || receipt.sourceSha !== sourceSha || receipt.reviewerRef !== owner) {
        throw Error(`Saved reviewer receipt identity mismatch for ${familyId}`);
      }
      const result = await commit('review-checkpoint', state => {
        const ledger = state.tasks.find(item => item.id === id).semanticReview;
        if (['PASS', 'ISSUE'].includes(ledger.reviews[familyId]?.status)) throw Error(`Concurrent review recorded for ${familyId}. Restart from the current queue.`);
        return checkpointSemanticReview(state, {...common(), review: receipt});
      });
      const ledger = result.state.tasks.find(item => item.id === id).semanticReview;
      const status = ledger.reviews[familyId].status;
      console.error(JSON.stringify({sourceSha, familyId, status, revision: result.state.revision, commitSha: result.commitSha ?? null,
        completed: ledger.completedCount, issues: ledger.issueCount, next: ledger.nextFamilyId}));
      if (status === 'IN_REVIEW') {
        await rename(path.join(receipts, `${familyId}.json`), path.join(receipts, `${familyId}.partial-${result.state.revision}.json`));
        return {status, sourceSha, familyId, reason: 'Partial evidence saved. Complete the family receipt before resuming.'};
      }
    }
  }

  try {
    owned(await read());
  } catch (error) {
    // Opening with an expired or foreign lease must never generate stop evidence.
    await rmdir(lock);
    throw error;
  }
  try {
    return await reviewFamilies();
  } catch (error) {
    terminalReason = error.message;
    throw error;
  } finally {
    // The worker has exited and this runner cannot make another queue write.
    await writeFile(path.join(receipts, `${path.basename(lock)}.stopped-${randomUUID()}.json`),
      `${JSON.stringify({task: id, owner, leaseId, sourceSha, stoppedAt: new Date().toISOString(), terminalReason}, null, 2)}\n`, {flag: 'wx'});
    await rmdir(lock);
  }
}
