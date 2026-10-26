/* Focused delivery smoke checks; this is deliberately not the complete RC79 suite. */
'use strict';
const fs = require('fs'), path = require('path'), http = require('http');
const assert = require('assert/strict');
const { chromium, webkit } = require('playwright');
const root = path.resolve(process.argv[2] || '.'), out = path.resolve(process.argv[3] || 'tmp/loading-r1');
fs.mkdirSync(out, { recursive: true });
const report = { revision: 'RC79-LOAD1', scope: 'targeted loading, navigation, record preservation and failure recovery', completeVersionVerification: 'NOT_RUN_USER_REQUESTED', physicalIPad: 'NOT_TESTED', checks: [] };
function check(name, detail = {}) { report.checks.push({ name, result: 'PASS', ...detail }); console.log('PASS ' + name); }
let server;
async function listen() {
  server = http.createServer((req, res) => {
    let target = path.resolve(root, '.' + decodeURIComponent(new URL(req.url, 'http://local').pathname));
    if (!target.startsWith(root + path.sep) && target !== root) { res.writeHead(403).end(); return; }
    try {
      if (fs.statSync(target).isDirectory()) target = path.join(target, 'index.html');
      const ext = path.extname(target);
      res.setHeader('Content-Type', ({ '.html':'text/html; charset=utf-8', '.js':'text/javascript; charset=utf-8', '.css':'text/css', '.json':'application/json', '.png':'image/png', '.webp':'image/webp' })[ext] || 'application/octet-stream');
      res.setHeader('Cache-Control', 'public,max-age=3600');
      fs.createReadStream(target).pipe(res);
    } catch (_) { res.writeHead(404).end(); }
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  return 'http://127.0.0.1:' + server.address().port + '/';
}
const action = (p, name, extra = '') => p.locator('[data-action="' + name + '"]' + extra).first();
async function main() {
  const base = process.env.PUBLIC_BASE || await listen();
  const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  const config = JSON.parse(html.match(/<script id="learning-delivery" type="application\/json">([\s\S]*?)<\/script>/)[1]);
  assert(Buffer.byteLength(html) < 18000);
  check('home-document-under-18KB', { bytes: Buffer.byteLength(html), previousBytes: 33074875 });
  if (!process.env.PUBLIC_BASE) {
    const pkg = JSON.parse(fs.readFileSync(path.join(root, 'muse/rc79/loading-r1/package-report.json')));
    for (const row of pkg.pages) {
      const text = fs.readFileSync(path.join(root, row.path), 'utf8');
      assert(!text.includes('data:image/png;base64,'), row.path);
      for (const m of text.matchAll(/<(?:script|link)\b[^>]*(?:src|href)="([^"]+)"/g)) {
        if (/^(https?:|data:|#)/.test(m[1])) continue;
        assert(fs.existsSync(path.resolve(root, path.dirname(row.path), m[1])), row.path + ' missing ' + m[1]);
      }
    }
    check('all-public-html-resource-references', { pages: pkg.pages.length });
  }
  for (const [name, engine] of [['chromium', chromium], ['webkit', webkit]]) {
    const browser = await engine.launch({ headless: true });
    try {
      const context = await browser.newContext({ locale: 'zh-CN', viewport: { width: 820, height: 1180 } });
      const p = await context.newPage(), errors = [], requests = [];
      p.setDefaultTimeout(60000);
      p.on('pageerror', error => { errors.push(String(error)); console.error(name + ' page error: ' + error.stack); });
      p.on('console', message => { if (message.type() === 'error') console.error(name + ' console: ' + message.text()); });
      p.on('request', request => requests.push(request.url()));
      await p.goto(base, { waitUntil: 'networkidle' });
      assert.equal(await p.locator('[data-home-hub] .dojo-path').count(), 2);
      assert.equal(await p.evaluate(() => typeof window.__AMC8_EXAM_MAPPING), 'undefined');
      assert.equal(await p.evaluate(() => typeof window.__AMC8_READING_DATA), 'undefined');
      assert.equal(requests.filter(x => /\.(bin|json)(\?|$)/.test(x)).length, 0);
      const homeBytes = await p.evaluate(() => performance.getEntriesByType('resource').reduce((n, r) => n + r.decodedBodySize, 0));
      assert(homeBytes < 300000, 'Home resources too large: ' + homeBytes);
      await p.screenshot({ path: path.join(out, name + '-home.png'), fullPage: true });
      check(name + '-instant-home-no-question-banks', { resourceDecodedBytes: homeBytes });

      const mathPaths = [...config.math.scripts, ...config.math.data.flatMap(x => [x.json, x.gzip])];
      await p.getByRole('button', { name: '进入阅读训练', exact: true }).click();
      await action(p, 'rdStart').waitFor({ state: 'visible' });
      assert(!requests.some(url => mathPaths.some(file => url.endsWith('/' + file))), 'Reading fetched mathematics data');
      await action(p, 'rdStart').click();
      await action(p, 'rdReadDone').click();
      await action(p, 'rdPick', '[data-index="0"]').click();
      const readingBefore = await p.evaluate(() => localStorage.getItem(window.__AMC8_READING_HOST.store + '_reading_r1'));
      assert(readingBefore);
      await p.screenshot({ path: path.join(out, name + '-reading.png'), fullPage: true });
      check(name + '-reading-without-math-downloads');

      await action(p, 'hubHome').click();
      assert.equal(await p.locator('[data-home-hub]').count(), 1);
      await p.getByRole('button', { name: '进入数学侦探', exact: true }).click();
      await action(p, 'topicSelect').waitFor({ state: 'visible' });
      await action(p, 'topicSelect', '[data-code="A01"]').click();
      await action(p, 'topicSelect', '[data-code="A02"]').click();
      assert.equal(await action(p, 'topicStart').isEnabled(), true);
      await action(p, 'topicStart').click();
      await p.waitForFunction(() => view === 'examMapping' || view === 'competition');
      const mathBefore = await p.evaluate(() => JSON.stringify({ topicPractice: saved.topicPractice, rtm1: saved.rtm1, competition: saved.competition }));
      await p.screenshot({ path: path.join(out, name + '-math.png'), fullPage: true });
      await action(p, 'reading').click();
      await action(p, 'rdResume').waitFor({ state: 'visible' });
      await action(p, 'rdResume').click();
      const beforeDraft = JSON.parse(readingBefore);
      const afterDraft = await p.evaluate(() => window.ReadingUI.snapshot());
      // Drafts and first answers are preserved; pause/resume timestamps may change.
      assert.deepEqual(afterDraft.session?.drafts, beforeDraft.session?.drafts);
      await action(p, 'home').click();
      assert.equal(await p.evaluate(() => JSON.stringify({ topicPractice: saved.topicPractice, rtm1: saved.rtm1, competition: saved.competition })), mathBefore);
      await p.reload({ waitUntil: 'networkidle' });
      assert.equal(await p.locator('[data-home-hub]').count(), 1);
      await action(p, 'home').click();
      await action(p, 'topicSelect').waitFor({ state: 'visible' });
      assert.equal(await p.evaluate(() => JSON.stringify({ topicPractice: saved.topicPractice, rtm1: saved.rtm1, competition: saved.competition })), mathBefore);
      assert.deepEqual(errors, []);
      check(name + '-math-load-and-drafts-survive-module-switch-and-reload');
      await context.close();

      const fallback = await browser.newContext({ locale: 'zh-CN' });
      await fallback.addInitScript(() => { window.DecompressionStream = undefined; });
      const q = await fallback.newPage();
      await q.goto(base + '#reading');
      await action(q, 'rdStart').waitFor({ state: 'visible', timeout: 60000 });
      assert.equal(await q.evaluate(() => typeof window.__AMC8_EXAM_MAPPING), 'undefined');
      check(name + '-reading-deep-link-without-native-decompression');
      await fallback.close();

      const recovery = await browser.newContext();
      const r = await recovery.newPage();
      await r.route('**/*', route => /\.(bin|json)$/.test(route.request().url()) ? route.abort('failed') : route.continue());
      await r.goto(base);
      await action(r, 'reading').click();
      await r.locator('[data-load-retry]').waitFor({ state: 'visible', timeout: 60000 });
      await r.unroute('**/*');
      await r.locator('[data-load-retry]').click();
      await action(r, 'rdStart').waitFor({ state: 'visible', timeout: 60000 });
      check(name + '-failed-download-explicit-retry');
      await recovery.close();

      if (name === 'chromium') {
        for (const route of ['source/', 'amc8/', 'qa/', 'qa/normal/', 'qa/history/', 'academy/', 'muse/rc79/maintenance.html']) {
          const ctx = await browser.newContext(), page = await ctx.newPage(), failures = [];
          page.on('pageerror', e => failures.push(String(e)));
          await page.goto(base + route, { waitUntil: 'networkidle' });
          if (route.startsWith('qa/')) await page.waitForFunction(() => !!window.__AMC8_MATH_NAV);
          assert((await page.locator('body').innerText()).length > 40);
          assert.deepEqual(failures, [], route);
          check('public-entry-' + route);
          await ctx.close();
        }
      }
    } finally { await browser.close(); }
  }
  report.result = 'PASS';
}
main().catch(error => { report.result = 'FAIL'; report.error = error.stack; console.error(error); process.exitCode = 1; }).finally(() => {
  fs.writeFileSync(path.join(out, 'smoke-result.json'), JSON.stringify(report, null, 2));
  if (server) server.close();
});
