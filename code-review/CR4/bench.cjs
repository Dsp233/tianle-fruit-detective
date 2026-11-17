const assert = require('node:assert/strict');
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const zlib = require('node:zlib');
const { chromium } = require('playwright');

const mime = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.webp': 'image/webp',
  '.png': 'image/png',
};

async function serve(directory, { parallel = false, weak = false } = {}) {
  let nextResponse = 0;
  const cache = new Map();
  const server = http.createServer((request, response) => {
    const pathname = new URL(request.url, 'http://localhost').pathname;
    const file = path.join(directory, pathname.endsWith('/') ? pathname + 'index.html' : pathname);
    if (!fs.existsSync(file) || !fs.statSync(file).isFile()) {
      response.writeHead(404).end();
      return;
    }
    const type = mime[path.extname(file)] || 'application/octet-stream';
    const gzip = /^(text\/|application\/json)/.test(type) && /\bgzip\b/.test(request.headers['accept-encoding'] || '');
    const key = file + ':' + gzip;
    if (!cache.has(key)) {
      let source = fs.readFileSync(file);
      if (parallel && pathname === '/') {
        source = Buffer.from(source.toString().replace(
          '      await loadData(config.reading.data);\n      await loadScripts(config.reading.scripts);',
          '      const prefetch = Promise.all(config.reading.scripts.map(readPacket)).catch(error => error);\n' +
          '      await loadData(config.reading.data);\n' +
          '      const result = await prefetch; if (result instanceof Error) throw result;\n' +
          '      await loadScripts(config.reading.scripts);'
        ));
      }
      cache.set(key, gzip ? zlib.gzipSync(source) : source);
    }
    const body = cache.get(key);
    const headers = { 'Content-Type': type, 'Content-Length': body.length, Vary: 'Accept-Encoding' };
    if (gzip) headers['Content-Encoding'] = 'gzip';
    const send = () => response.writeHead(200, headers).end(body);
    if (weak && /\/assets\//.test(pathname)) {
      // Inject latency per request and charge all responses against one link.
      nextResponse = Math.max(nextResponse, Date.now() + 180) + body.length * 1000 / 163840;
      setTimeout(send, nextResponse - Date.now());
    } else send();
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  return { url: 'http://127.0.0.1:' + server.address().port + '/', close: () => server.close() };
}

function instrument() {
  const marks = window.readingBench = { inflate: [], parse: [], engine: [], render: [] };
  function measure(list, functionToMeasure, target, args) {
    const begin = performance.now();
    try { return functionToMeasure.apply(target, args); }
    finally { list.push(performance.now() - begin); }
  }
  function wrapGlobal(name, modify) {
    let value;
    Object.defineProperty(window, name, {
      configurable: true,
      get: () => value,
      set: item => { value = item; modify(item); },
    });
  }
  wrapGlobal('pako', value => {
    const original = value.ungzip;
    value.ungzip = function (...args) { return measure(marks.inflate, original, this, args); };
  });
  const parse = JSON.parse;
  JSON.parse = function (text, ...args) {
    if (typeof text === 'string' && (text.startsWith('{"gz":') || text.length > 1_000_000)) {
      return measure(marks.parse, parse, this, [text, ...args]);
    }
    return parse.call(this, text, ...args);
  };
  wrapGlobal('ReadingEngine', value => {
    const original = value.create;
    value.create = function (...args) { return measure(marks.engine, original, this, args); };
  });
  wrapGlobal('__AMC8_ReadingRuntime', value => {
    marks.runtime = performance.now();
    const original = value.handle;
    value.handle = function (...args) { return measure(marks.render, original, this, args); };
  });
  document.addEventListener('click', event => {
    if (event.target.closest('[data-home-hub] [data-action=reading]')) {
      marks.click = performance.now();
      marks.inflate.length = marks.parse.length = marks.engine.length = marks.render.length = 0;
    }
  }, true);
  new MutationObserver(() => {
    if (marks.click === undefined || marks.route >= marks.click) return;
    const start = document.querySelector('.rd-today [data-action=rdStart]');
    if (start && !start.disabled && !document.querySelector('[data-loading-channel]')) {
      marks.route = performance.now();
      requestAnimationFrame(() => requestAnimationFrame(() => { marks.presented = performance.now(); }));
    }
  }).observe(document, { childList: true, subtree: true });
}

async function measure(browser, url) {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  try {
    await context.addInitScript(instrument);
    const page = await context.newPage();
    const cdp = await context.newCDPSession(page);
    await cdp.send('Network.enable');
    await cdp.send('Network.setCacheDisabled', { cacheDisabled: true });
    await page.goto(url, { waitUntil: 'networkidle' });
    await cdp.send('Network.emulateNetworkConditions', {
      offline: false, latency: 180, downloadThroughput: 160 * 1024, uploadThroughput: 160 * 1024,
    });
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: 3 });
    const read = async () => {
      await page.locator('[data-home-hub] [data-action=reading]').click();
      await page.waitForFunction(() => window.readingBench.presented >= window.readingBench.click);
      return page.evaluate(() => {
        const { click, route, presented, runtime, inflate, parse, engine, render } = window.readingBench;
        const sum = values => values.reduce((total, value) => total + value, 0);
        const resources = performance.getEntriesByType('resource')
          .filter(entry => entry.startTime >= click && entry.responseEnd <= route && /\/assets\//.test(entry.name))
          .map(entry => ({
            name: new URL(entry.name).pathname, startMs: entry.startTime - click,
            endMs: entry.responseEnd - click, bodyBytes: entry.encodedBodySize, transferBytes: entry.transferSize,
          }));
        return {
          readyMs: route - click, presentedMs: presented - click,
          runtimeReadyMs: runtime >= click ? runtime - click : null, resources,
          finalResponseMs: resources.length ? Math.max(...resources.map(resource => resource.endMs)) : null,
          inflateMs: sum(inflate), jsonParseMs: sum(parse), engineCreateMs: sum(engine), actionAndRenderMs: sum(render),
        };
      });
    };
    const cold = await read();
    const art = page.locator('.rd-today img').first();
    await art.evaluate(image => image.decode());
    cold.withArtworkMs = await page.evaluate(() => performance.now() - window.readingBench.click);
    await page.locator('button.brand[data-action=hubHome]').click();
    const warm = await read();
    return { cold, warm };
  } finally {
    await context.close();
  }
}

async function main() {
  const paths = process.argv.slice(2);
  assert(paths.length > 0, 'Usage: node bench.cjs BASE_DIRECTORY [CANDIDATE_DIRECTORY]');
  const rounds = Number(process.env.READING_BENCH_RUNS || 7);
  const cases = [{ name: 'baseline', directory: paths[0] }];
  if (paths[1]) {
    if (paths[2]) cases.push({ name: 'previous-candidate', directory: paths[2] });
    cases.push({ name: 'candidate', directory: paths[1] });
  }
  const servers = await Promise.all(cases.map(({ directory, parallel }) => serve(path.resolve(directory), { parallel })));
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_BIN });
  try {
    const results = cases.map(({ name }) => ({ name, samples: [] }));
    for (let i = 0; i < rounds; i++) {
      const order = servers.map((_, index) => index);
      if (i % 2) order.reverse();
      for (const index of order) results[index].samples.push(await measure(browser, servers[index].url));
    }
    const median = values => {
      const sorted = values.slice().sort((a, b) => a - b);
      const middle = Math.floor(sorted.length / 2);
      return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
    };
    const totals = metrics => Object.fromEntries(Object.keys(metrics[0]).filter(k => k !== 'resources')
      .map(key => [key, metrics[0][key] === null ? null : median(metrics.map(row => row[key]))]));
    for (const result of results) {
      for (const kind of ['cold', 'warm']) {
        const rows = result.samples.map(sample => sample[kind]);
        result[kind + 'Median'] = { ...totals(rows),
          requests: median(rows.map(row => row.resources.length)),
          bodyBytes: median(rows.map(row => row.resources.reduce((n, resource) => n + resource.bodyBytes, 0))),
          transferBytes: median(rows.map(row => row.resources.reduce((n, resource) => n + resource.transferBytes, 0))),
        };
      }
    }
    console.log(JSON.stringify({ browser: browser.version(), latencyMs: 180, downloadBytesPerSec: 163840,
      cpuSlowdown: 3, results }, null, 2));
  } finally {
    await browser.close();
    servers.forEach(server => server.close());
  }
}

if (require.main === module) main().catch(error => { console.error(error); process.exitCode = 1; });
module.exports = { serve };

