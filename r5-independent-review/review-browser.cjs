'use strict';

const crypto = require('node:crypto');
const fs = require('node:fs/promises');
const http = require('node:http');
const path = require('node:path');
const { chromium } = require('playwright');

const sha256 = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const mime = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2'
};

async function serveCandidate(root) {
  const server = http.createServer(async (request, response) => {
    try {
      const url = new URL(request.url, 'http://127.0.0.1');
      const requested = url.pathname === '/' ? '/index.html' : url.pathname;
      const file = path.resolve(root, '.' + decodeURIComponent(requested));
      const extension = path.extname(file);
      if (!file.startsWith(root + path.sep) || !mime[extension]) {
        response.writeHead(404).end();
        return;
      }
      const bytes = await fs.readFile(file);
      response.writeHead(200, {
        'content-type': mime[extension],
        'cache-control': 'no-store'
      }).end(bytes);
    } catch {
      response.writeHead(404).end();
    }
  });
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
  return server;
}

function locate(page, step) {
  if (step.role && typeof step.name === 'string') {
    return page.getByRole(step.role, { name: step.name, exact: true });
  }
  if (step.role && typeof step.nameIncludes === 'string') {
    return page.getByRole(step.role, { name: step.nameIncludes });
  }
  if (typeof step.text === 'string') {
    return page.getByText(step.text, { exact: true });
  }
  throw new Error('A visible role and name or exact text is required.');
}

async function review(candidate, output, planBytes) {
  const plan = JSON.parse(planBytes);
  const entry = await fs.readFile(path.join(candidate, 'index.html'));
  if (sha256(entry) !== plan.entrySha256) throw new Error('Frozen entry SHA-256 mismatch.');
  if (!/^[0-9a-f]{40}$/.test(plan.candidateSha) || !/^[0-9]+$/.test(String(plan.artifactId))) {
    throw new Error('Candidate SHA and artifact ID are required.');
  }
  if (!plan.reviewerRef || !Array.isArray(plan.steps)) throw new Error('Missing review identity or steps.');

  await fs.mkdir(output, { recursive: true });
  const server = await serveCandidate(candidate);
  const origin = 'http://127.0.0.1:' + server.address().port;
  const session = {
    reviewerRef: plan.reviewerRef,
    sessionId: crypto.randomUUID(),
    startedAt: new Date().toISOString(),
    workflowRunId: process.env.GITHUB_RUN_ID || null,
    workflowRunAttempt: process.env.GITHUB_RUN_ATTEMPT || null,
    candidateSha: plan.candidateSha,
    artifactId: String(plan.artifactId),
    entrySha256: plan.entrySha256,
    planSha256: sha256(planBytes),
    browser: null,
    events: []
  };
  let browser;
  let context;
  let page;
  let contextId;
  let stepIndex = -1;

  async function capture(label, questionId) {
    if (!/^[a-zA-Z0-9_-]+$/.test(label)) throw new Error('Invalid capture label.');
    const prefix = String(stepIndex + 1).padStart(3, '0') + '-' + label;
    const body = page.locator('body');
    const views = {
      'visible.txt': await body.innerText(),
      'ax.txt': await body.ariaSnapshot(),
      'png': await page.screenshot({ fullPage: true, animations: 'disabled' })
    };
    const files = [];
    for (const [suffix, data] of Object.entries(views)) {
      const filename = prefix + '.' + suffix;
      await fs.writeFile(path.join(output, filename), data);
      files.push({ filename, sha256: sha256(data) });
    }
    session.events.push({ action: 'capture', contextId, questionId, label, at: new Date().toISOString(), files });
  }

  async function openFreshContext() {
    await context?.close();
    contextId = crypto.randomUUID();
    context = await browser.newContext({
      viewport: { width: 1440, height: 1000 },
      serviceWorkers: 'block',
      locale: 'zh-CN',
      timezoneId: 'Etc/UTC'
    });
    // The fresh context has no saved state. Only its frozen loopback origin can receive requests.
    await context.route('**/*', route => new URL(route.request().url()).origin === origin
      ? route.continue()
      : route.abort());
    page = await context.newPage();
    page.setDefaultTimeout(8000);
    const response = await page.goto(origin + '/index.html', { waitUntil: 'load', timeout: 30000 });
    if (!response?.ok()) throw new Error('Frozen entry did not render over loopback.');
  }

  try {
    await fs.writeFile(path.join(output, 'review-plan.json'), planBytes);
    browser = await chromium.launch({ headless: true });
    session.browser = { name: 'Chromium', version: browser.version() };
    await openFreshContext();
    await capture('initial');

    for (const step of plan.steps) {
      stepIndex++;
      if (step.action === 'capture') {
        if (step.present) await locate(page, step.present).waitFor({ state: 'visible' });
        await capture(step.label, step.questionId);
        continue;
      }
      if (step.action === 'freshContext') {
        await openFreshContext();
        session.events.push({ ...step, contextId, at: new Date().toISOString() });
        continue;
      }
      if (step.action === 'advanceBrowserDate') {
        const hours = step.hours;
        if (!Number.isInteger(hours) || hours < 1 || hours > 72) {
          throw new Error('Simulated review time must be between 1 and 72 whole hours.');
        }
        const simulatedDate = new Date(Date.now() + hours * 60 * 60 * 1000);
        await page.clock.setFixedTime(simulatedDate);
        session.events.push({ ...step, contextId, simulatedDate: simulatedDate.toISOString(), at: new Date().toISOString() });
        continue;
      }
      const target = locate(page, step);
      await target.waitFor({ state: 'visible' });
      if (step.action === 'click') await target.click();
      else if (step.action === 'fill') await target.fill(step.value);
      else if (step.action === 'press') await target.press(step.key);
      else throw new Error('Unsupported learner action: ' + step.action);
      session.events.push({ ...step, contextId, at: new Date().toISOString() });
    }
    session.status = 'COMPLETED';
  } catch (error) {
    session.status = 'INCOMPLETE';
    session.failure = { stepIndex, error: error.message };
    if (page) await capture('failure').catch(() => {});
    throw error;
  } finally {
    session.finishedAt = new Date().toISOString();
    await fs.writeFile(path.join(output, 'session.json'), JSON.stringify(session, null, 2) + '\n');
    await context?.close();
    await browser?.close();
    await new Promise(resolve => server.close(resolve));
  }
}

if (process.argv.length !== 5) {
  console.error('Usage: node review-browser.cjs CANDIDATE_DIR OUTPUT_DIR REVIEW_PLAN_JSON');
  process.exitCode = 2;
} else {
  const [candidate, output, plan] = process.argv.slice(2).map(file => path.resolve(file));
  fs.readFile(plan).then(planBytes => review(candidate, output, planBytes)).catch(error => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
