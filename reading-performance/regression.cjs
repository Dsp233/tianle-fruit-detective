const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { chromium, webkit } = require('playwright');
const { serve } = require('./bench.cjs');

const key = 'tianle_amc8_question_design_v1_reading_r1';
const bytes = page => page.evaluate(key => localStorage.getItem(key), key);
const state = async page => JSON.parse(await bytes(page));
const ready = page => page.waitForFunction(() => window.ReadingUI.engine()?.status().status === 'ready');
const reading = page => page.locator('[data-home-hub] [data-action=reading]');
const landing = page => page.locator('.rd-today [data-action=rdStart]');
const entry = page => page.locator('button.brand[data-action=hubHome]');
const action = (page, name) => page.locator('[data-action=' + name + ']').first();

async function setup(browser, url, seed = {}) {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  await context.addInitScript(seed => {
    if (!sessionStorage.getItem('bench-seed')) {
      for (const [k, v] of Object.entries(seed)) localStorage.setItem(k, v);
      sessionStorage.setItem('bench-seed', '1');
    }
    window.testSpoken = [];
    Object.defineProperty(window, 'SpeechSynthesisUtterance', {
      configurable: true, value: class { constructor(text) { this.text = text; } },
    });
    Object.defineProperty(window, 'speechSynthesis', { configurable: true, value: {
      getVoices: () => [{ name: 'Test Mandarin', lang: 'zh-CN', localService: true, default: true }],
      speak(utterance) {
        window.testSpoken.push([utterance.text, utterance.lang]);
        queueMicrotask(() => { utterance.onstart?.(); utterance.onend?.(); });
      },
      cancel() {}, addEventListener() {}, removeEventListener() {},
    } });
  }, seed);
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  page.setDefaultTimeout(20000);
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  return { context, page, errors };
}

async function open(page) {
  await reading(page).click();
  await landing(page).waitFor();
  await ready(page);
}

async function baselineSeed(browser, url) {
  const { context, page, errors } = await setup(browser, url);
  try {
    await open(page);
    await page.evaluate(() => {
      const engine = window.ReadingUI.engine();
      engine.startDay(13);
      while (engine.current()) {
        engine.markReadDone();
        engine.submit(engine.current().question.answer);
        engine.next();
      }
      engine.startDay(1);
      engine.markReadDone();
      engine.select(1);
      engine.submit(1);
      engine.select(0);
    });
    await ready(page);
    assert.equal(await page.evaluate(() => window.ReadingUI.report().completedDays), 1);
    const raw = await bytes(page);
    const before = JSON.parse(raw);
    assert(before.events.some(event => event.questionId === 'R2-S01-1' && event.first && !event.correct));
    assert.equal(before.session.drafts['R2-S01-1'], 0);
    assert.deepEqual(errors, []);
    return { raw, before, data: await page.evaluate(() => window.__AMC8_READING_DATA) };
  } finally { await context.close(); }
}

function preserved(before, after) {
  assert.equal(after.contentHash, before.contentHash);
  assert.deepEqual(after.events.slice(0, before.events.length), before.events);
  assert.deepEqual(after.legacy, before.legacy);
  assert.deepEqual(after.suspendedSessions, before.suspendedSessions);
}

async function savedLearner(browser, base, { raw, before, data }) {
  const { context, page, errors } = await setup(browser, base, { [key]: raw, 'unrelated-test-key': 'keep' });
  try {
    await open(page);
    const actual = await page.evaluate(() => window.__AMC8_READING_DATA);
    // Full semantic equality of every material, answer, pinyin row and diagnostic.
    assert.deepEqual(actual, data);
    assert.equal(actual.lessons.length, 84);
    // Opening an existing session may append normal pause/speech status and
    // update its revision. Its events, draft, settings and identity survive.
    const opened = await state(page);
    preserved(before, opened);
    assert.equal(opened.session.id, before.session.id);
    assert.deepEqual(opened.session.drafts, before.session.drafts);
    assert.deepEqual(opened.settings, before.settings);
    assert.equal(await page.evaluate(() => window.ReadingUI.report().completedDays), 1);
    const resume = page.locator('[data-action=rdResume]').first();
    await resume.click();
    await page.locator('.rd-options').waitFor();
    assert.deepEqual((await state(page)).session.drafts, before.session.drafts);
    await action(page, 'rdSubmit').click();
    await ready(page);
    const after = await state(page);
    preserved(before, after);
    assert(after.events.some(event => event.questionId === 'R2-S01-1' && event.correct && !event.first));
    await page.reload({ waitUntil: 'domcontentloaded' });
    await ready(page);
    const reloaded = await state(page);
    preserved(after, reloaded);
    assert.equal(await page.evaluate(() => localStorage.getItem('unrelated-test-key')), 'keep');
    assert.equal(reloaded.events.filter(event => event.type === 'content_upgrade').length, 0);
    assert.deepEqual(errors, []);
  } finally { await context.close(); }
}

async function weakFlow(browser, base) {
  const { context, page, errors } = await setup(browser, base);
  try {
    await open(page);
    await landing(page).click();
    const firstText = await page.evaluate(() => window.ReadingUI.engine().current().material.panels[0].text);
    await action(page, 'rdSpeakSentence').click();
    await page.waitForFunction(text => window.testSpoken.map(line => line[0]).join('') === text, firstText);
    assert(await page.evaluate(() => window.testSpoken.every(line => line[1] === 'zh-CN')));
    await action(page, 'rdPanelNext').click();
    assert.equal(await page.locator('.rd-panel-number').innerText(), '2/3');
    await page.locator('.rd-panel img').first().evaluate(image => image.decode());
    assert(await page.locator('.rd-panel .rd-pinyin').count() > 0);
    await action(page, 'rdReadDone').click();
    await page.locator('.rd-options [data-action=rdPick][data-index="1"]').click();
    await action(page, 'rdSubmit').click();
    await ready(page);
    assert((await state(page)).events.some(event => event.questionId === 'R2-S01-1' && event.first && !event.correct));
    await page.evaluate(() => window.ReadingUI.openMaterials(['R2-D084-EXTRA']));
    const lateImage = page.locator('.rd-panel img').first();
    await lateImage.evaluate(image => image.decode());
    assert.equal(await page.evaluate(() => window.ReadingUI.engine().current().material.id), 'R2-D084-EXTRA');
    await entry(page).click();
    await open(page);
    assert.deepEqual(errors, []);
  } finally { await context.close(); }
}

async function interruptedLoad(browser, url, delivery, raw) {
  const { context, page, errors } = await setup(browser, url, { [key]: raw });
  try {
    let dataRequests = 0;
    let scriptRequests = 0;
    await page.route('**/' + delivery.script, route => { scriptRequests++; return route.continue(); });
    await page.route('**/' + delivery.data, route => {
      dataRequests++;
      return dataRequests <= 2 ? route.abort('failed') : route.continue();
    });
    const sourceResponse = page.waitForResponse(response => response.url().endsWith(delivery.script));
    await reading(page).click();
    const retry = page.locator('[data-load-retry]');
    await retry.waitFor();
    assert.equal(await (await sourceResponse).finished(), null);
    assert.equal(await bytes(page), raw);
    assert(await page.evaluate(() => typeof window.__AMC8_ReadingRuntime === 'undefined'));
    assert.equal(await page.evaluate(() => window.ReadingUI.engine()), undefined);
    await retry.click();
    await landing(page).waitFor();
    await ready(page);
    preserved(JSON.parse(raw), await state(page));
    assert.equal(dataRequests, 3);
    assert.equal(scriptRequests, 1);
    assert.deepEqual(errors, []);
  } finally { await context.close(); }
}

async function unreadableRecord(browser, url) {
  const raw = '{"invalid archival record":';
  const { context, page, errors } = await setup(browser, url, { [key]: raw });
  try {
    await reading(page).click();
    await page.locator('.rd-storage-alert').waitFor();
    assert.equal(await page.evaluate(() => window.ReadingUI.engine().status().status), 'read_only');
    assert.equal(await page.evaluate(() => JSON.parse(window.ReadingUI.backup()).unreadableOriginal), raw);
    assert.equal(await bytes(page), raw);
    assert.deepEqual(errors, []);
  } finally { await context.close(); }
}

async function main() {
  const baseline = await serve(path.resolve(process.argv[2]));
  const candidate = await serve(process.cwd());
  const weak = await serve(process.cwd(), { weak: true });
  const html = fs.readFileSync('index.html', 'utf8');
  const config = JSON.parse(html.match(/<script id="learning-delivery" type="application\/json">(.*?)<\/script>/)[1]);
  const results = [];
  try {
    for (const [name, type] of [['chromium', chromium], ['webkit', webkit]]) {
      const browser = await type.launch(name === 'chromium' ? { executablePath: process.env.CHROMIUM_BIN } : {});
      try {
        const seed = await baselineSeed(browser, baseline.url);
        await savedLearner(browser, candidate.url, seed);
        await unreadableRecord(browser, candidate.url);
        await weakFlow(browser, weak.url);
        await interruptedLoad(browser, candidate.url, config.reading.delivery, seed.raw);
        results.push({ name, version: browser.version(), courseData: 'identical', existingLearner: 'pass',
          weakNetwork: 'pass', interruptedLoad: 'pass', unreadableRecord: 'pass', originalEvents: seed.before.events.length,
          historicalCompletedDays: 1, days: seed.data.lessons.length });
      } finally { await browser.close(); }
    }
    console.log(JSON.stringify(results, null, 2));
  } finally { [baseline, candidate, weak].forEach(server => server.close()); }
}

main().catch(error => { console.error(error); process.exitCode = 1; });
