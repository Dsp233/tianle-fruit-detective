import assert from 'node:assert/strict';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import {createRequire} from 'node:module';
const require = createRequire(import.meta.url);
const {chromium, webkit} = require('playwright');
const [fix15, frozen, qa, receipt] = process.argv.slice(2);
const variants = fix15 === '--refrozen' ? [['refrozen', frozen]] : Object.entries({fix15, frozen, qa});
const key = 'tianle_amc8_question_design_v1';
const results = [];
const mime = {'.html':'text/html; charset=utf-8','.js':'text/javascript','.css':'text/css','.json':'application/json','.webp':'image/webp'};

function serverFor(directory) {
  const root = path.resolve(directory);
  return http.createServer((req, res) => {
    try {
      const url = new URL(req.url, 'http://localhost');
      const filename = path.resolve(root, '.' + (url.pathname === '/' ? '/index.html' : decodeURIComponent(url.pathname)));
      if (!filename.startsWith(root + path.sep) || !fs.statSync(filename).isFile()) return res.writeHead(404).end();
      res.setHeader('Content-Type', mime[path.extname(filename)] ?? 'application/octet-stream');
      fs.createReadStream(filename).pipe(res);
    } catch { res.writeHead(404).end(); }
  });
}
const status = p => p.evaluate(() => progressStore.getStatus());
const settled = p => p.waitForFunction(() => typeof progressStore !== 'undefined' && progressStore.getStatus() === 'ready');
const stored = p => p.evaluate(key => JSON.parse(localStorage.getItem(key))?.rtm1 ?? null, key);
const at = p => p.locator('[data-rtm-task]');
const choice = p => at(p).locator('[data-action="rtmChoice"]').filter({hasText:'24'}).first();
const notice = p => p.locator('[data-rtm-feedback]').textContent();
const role = (p, name) => p.getByRole('button',{name,exact:true}).first();
async function setup(p, base, variant) {
  await p.goto(base);
  await role(p,'进入数学侦探').click();
  await settled(p);
  await role(p,'我是家长，确认调整选题设置').click();
  await role(p,'数的大小与位值').click(); await settled(p);
  await role(p,'四则与运算意义').click(); await settled(p);
  await role(p,'开始做题 →').click(); await settled(p);
  if (variant === 'refrozen') await at(p).waitFor();
  const openedImmediately = await at(p).isVisible();
  if (!openedImmediately) {
    // The existing asynchronous issue can leave the app on the selector.
    await p.reload();
    if (await role(p,'进入数学侦探').isVisible()) await role(p,'进入数学侦探').click();
    await settled(p);
    await role(p,'继续上次 →').click();
  }
  await at(p).waitFor();
  assert.match(await at(p).innerText(), /8\s*\+\s*4\s*×\s*2/);
  return openedImmediately;
}
async function reopen(p) {
  await p.reload();
  await settled(p);
  if (await at(p).isVisible()) return;
  if (await role(p,'进入数学侦探').isVisible()) {
    await role(p,'进入数学侦探').click(); await settled(p);
  }
  await role(p,'继续上次 →').click();
  await at(p).waitFor();
}
function first(record) {
  if (!record) return null;
  const event = (record.events ?? []).find(e => e.type === 'response_submitted');
  return event ?? JSON.stringify(record).match(/"type":"response_submitted"/)?.[0] ?? null;
}
async function test(browser, engine, variant, directory) {
  const server = serverFor(directory);
  await new Promise(resolve => server.listen(0,'127.0.0.1',resolve));
  const context = await browser.newContext();
  const p = await context.newPage();
  p.setDefaultTimeout(20000);
  const base = 'http://127.0.0.1:' + server.address().port + '/';
  const evidence = {engine,variant};
  try {
    evidence.openedImmediately = await setup(p,base,variant);
    await choice(p).click(); await settled(p);
    const draft = await stored(p);
    assert(draft?.sessions?.active?.input, 'Selected input must persist in the math draft');
    await reopen(p);
    assert.equal((await stored(p)).sessions.active.input, draft.sessions.active.input);
    evidence.draftReload = true;
    await p.evaluate(() => {
      const native = Storage.prototype.setItem;
      window.__mathSaveTrace = [];
      const real = progressStore.commit;
      progressStore.commit = (...args) => {
        const outcome = real(...args);
        window.__mathSaveTrace.push({ok:outcome.ok,reason:outcome.reason,pending:outcome.pending===true});
        return outcome;
      };
      window.__failMathWrite = false;
      Storage.prototype.setItem = function(key, value) {
        if (window.__failMathWrite && key === 'tianle_amc8_question_design_v1')
          throw new DOMException('Synthetic quota', 'QuotaExceededError');
        return native.call(this,key,value);
      };
    });
    await p.locator('[data-action="rtmSubmit"]').click();
    evidence.immediateNotice = await notice(p);
    await settled(p);
    evidence.writeTrace = await p.evaluate(() => window.__mathSaveTrace);
    const submitted = await stored(p);
    assert(submitted?.sessions?.active?.submissionOrdinal === 1, 'First answer must persist once');
    assert.equal(submitted.sessions.active.lastSubmittedInput,draft.sessions.active.input);
    if (variant === 'refrozen') {
      assert.doesNotMatch(evidence.immediateNotice, /未能保存|请导出记录后重试/);
      assert.doesNotMatch(await notice(p), /正在保存|未能保存/);
    }
    evidence.pendingWasReportedAsFailure = /未能保存/.test(evidence.immediateNotice) && evidence.writeTrace.some(s => s.pending);
    await reopen(p);
    assert.deepEqual(await stored(p),submitted);
    assert.match(await at(p).innerText(), /首次作答已保留/);
    evidence.firstAnswerReload = true;
    if (variant === 'qa') {
      const overlay = p.locator('#amc8-review-layer');
      await overlay.locator('#toggle-review').click();
      await at(p).locator('[data-action="rtmChoice"]').filter({hasText:'16'}).first().click();
      await overlay.locator('#note-text').fill('Synthetic overlay isolation check');
      await overlay.locator('#save-annotation').click();
      assert.deepEqual(await stored(p),submitted);
      await overlay.locator('#toggle-review').click();
      evidence.qaRecordUnchanged = true;
    }
    await p.evaluate(() => {
      const native = Storage.prototype.setItem;
      Storage.prototype.setItem = function(key,value) {
        if (key === 'tianle_amc8_question_design_v1') throw new DOMException('Synthetic quota','QuotaExceededError');
        return native.call(this,key,value);
      };
    });
    await at(p).locator('[data-action="rtmChoice"]').filter({hasText:'16'}).first().click();
    await p.waitForFunction(() => progressStore.getStatus() === 'unsaved');
    assert.deepEqual(await stored(p),submitted);
    const pending = await p.evaluate(() => progressStore.exportSnapshot().pending);
    assert(pending, 'Failed write must remain exportable');
    evidence.quotaRetainsOriginalAndPending = true;
    // Reload is the documented abandon-unsaved fallback after export.
    p.on('dialog', d => d.accept());
    await reopen(p);
    assert.deepEqual(await stored(p),submitted);
    evidence.reloadAfterFailedDraftPreservesFirst = true;
    evidence.result = 'OBSERVED';
  } catch (error) {
    evidence.result = 'ERROR'; evidence.error = String(error.stack);
    evidence.state = await status(p).catch(()=>null);
    evidence.page = (await p.locator('main').innerText({timeout:1500}).catch(()=>'' )).slice(0,900);
  } finally {
    results.push(evidence);
    fs.writeFileSync(receipt,JSON.stringify(results,null,2)+'\n');
    console.log(JSON.stringify(evidence));
    await context.close(); server.close();
  }
}
for (const [engine, driver] of Object.entries({chromium,webkit})) {
  const browser = await driver.launch();
  try { for (const [variant, dir] of variants) await test(browser,engine,variant,dir); }
  finally { await browser.close(); }
}
if (results.some(x=>x.result==='ERROR')) process.exitCode=1;
