import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const [uiPath, storePath] = process.argv.slice(2);
const ui = fs.readFileSync(uiPath, 'utf8');
const store = fs.readFileSync(storePath, 'utf8');
const match = ui.match(/\n function commit\(next\)\{[\s\S]+?\n \}/);
assert(match, 'The RTM1 commit handler must be present');
assert(store.includes("return {ok:false,reason:'PENDING',pending:true}"));
assert(store.includes('storage.setItem(namespace,pending)'));

const first = { id: 'first', input: '24' };
const draft = { input: '24', attempts: [] };
const next = { input: '24', attempts: [first] };
let pending;
let durable = JSON.stringify(draft);
const ctx = vm.createContext({
  saved: { rtm1: draft },
  canPersist: true,
  restored: () => ({ readOnly: false }),
  progressStore: { getStatus: () => 'ready' },
  persist() {
    pending = JSON.stringify(ctx.saved.rtm1);
    return { ok: false, reason: 'PENDING', pending: true };
  },
  message: '',
  next,
});
assert.equal(vm.runInContext(match[0] + '\ncommit(next)', ctx), false);
assert.equal(ctx.saved.rtm1, draft);
assert.match(ctx.message, /未能保存/);
assert.deepEqual(JSON.parse(durable), draft);
durable = pending; // Successful asynchronous store write, after UI has returned.
assert.deepEqual(JSON.parse(durable), next);
assert.equal(ctx.saved.rtm1, draft, 'Live UI and disk can diverge');
console.log('REPRODUCED: accepted pending write is reported as failure, live RTM1 rolls back, first answer persists on successful completion');
