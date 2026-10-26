/* RC79 loading delivery: no question, grading or storage-schema changes. */
(() => {
  'use strict';
  const config = JSON.parse(document.getElementById('learning-delivery').textContent);
  const base = new URL(config.base, location.href);
  const root = document.getElementById('app');
  const status = document.getElementById('learning-load-status');
  const store = config.store;
  const scripts = new Map();
  const packets = new Map();
  let mathPromise = null, readingPromise = null, ready = false, intent = 0, retry = null;
  const host = window.__AMC8_READING_HOST = {
    store, view: 'home',
    get saved() { try { const value = JSON.parse(localStorage.getItem(store) || '{}'); return value && typeof value === 'object' ? value : {}; } catch (_) { return {}; } },
    taskNow: () => null,
    render() { if (host.view === 'reading' && window.__AMC8_ReadingRuntime) root.innerHTML = window.__AMC8_ReadingRuntime.render(); }
  };
  // APIs used by the existing application on older Safari versions.
  if (!Object.hasOwn) Object.hasOwn = (obj, key) => Object.prototype.hasOwnProperty.call(obj, key);
  function message(text, failed) {
    status.hidden = false;
    status.replaceChildren();
    const label = document.createElement('span');
    label.textContent = text;
    status.appendChild(label);
    if (failed) {
      const button = document.createElement('button');
      button.type = 'button'; button.dataset.loadRetry = 'true'; button.textContent = '重试加载';
      status.appendChild(button);
    }
  }
  function clear() { status.hidden = true; retry = null; }
  function fail(error, task) {
    console.error('Learning module load failed', error);
    retry = task;
    message('这次内容没有加载完成。请检查网络后重试，学习记录仍保留。', true);
  }
  async function download(path) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 30000);
    try {
      const response = await fetch(new URL(path, base), { signal: controller.signal });
      if (!response.ok) throw new Error('HTTP ' + response.status + ' ' + path);
      return await response.arrayBuffer();
    } finally { clearTimeout(timer); }
  }
  async function readPacket(packet) {
    if (!packets.has(packet.json)) packets.set(packet.json, (async () => {
      if (typeof DecompressionStream === 'function') {
        try {
          const bytes = await download(packet.gzip);
          const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'));
          return await new Response(stream).json();
        } catch (error) {
          // Native decompression is optional; the same exact JSON is always available.
          console.warn('Using JSON fallback', packet.json, String(error));
        }
      }
      const bytes = await download(packet.json);
      return JSON.parse(new TextDecoder().decode(bytes));
    })().catch(error => { packets.delete(packet.json); throw error; }));
    return packets.get(packet.json);
  }
  async function loadData(rows) {
    let next = 0, done = 0;
    const worker = async () => {
      while (next < rows.length) {
        const row = rows[next++], data = await readPacket(row);
        if (row.key === '__AMC8_SOURCE_FIGURES') {
          for (const key of Object.keys(data)) data[key] = new URL(data[key], base).href;
        }
        window[row.key] = data;
        ++done;
        if (!status.hidden) message('正在准备训练内容（' + done + '/' + rows.length + '）…');
      }
    };
    await Promise.all(Array.from({ length: Math.min(4, rows.length) }, worker));
  }
  function script(path) {
    if (!scripts.has(path)) scripts.set(path, new Promise((resolve, reject) => {
      const el = document.createElement('script');
      el.src = new URL(path, base).href; el.async = false;
      const timeout = setTimeout(() => { el.remove(); reject(new Error('Script timeout ' + path)); }, 45000);
      el.onload = () => { clearTimeout(timeout); resolve(); };
      el.onerror = () => { clearTimeout(timeout); el.remove(); reject(new Error('Script failed ' + path)); };
      document.head.appendChild(el);
    }).catch(error => { scripts.delete(path); throw error; }));
    return scripts.get(path);
  }
  async function loadScripts(rows) {
    // Preload over the network concurrently, execute in original dependency order.
    for (const path of rows) {
      const link = document.createElement('link');
      link.rel = 'preload'; link.as = 'script'; link.href = new URL(path, base).href;
      document.head.appendChild(link);
    }
    for (const path of rows) { await script(path); await new Promise(resolve => setTimeout(resolve, 0)); }
  }
  if (config.legacy) {
    const start = async () => {
      message('正在准备学习内容…');
      try { await loadData(config.data); await loadScripts(config.scripts); window.__AMC8_LEGACY_READY = true; clear(); }
      catch (error) { fail(error, start); }
    };
    document.addEventListener('click', event => { if (event.target.closest('[data-load-retry]') && retry) retry(); });
    start(); return;
  }
  function reading() {
    if (!readingPromise) readingPromise = (async () => {
      await loadData(config.reading.data);
      await loadScripts(config.reading.scripts);
      if (!window.__AMC8_ReadingRuntime) throw new Error('Reading initialization incomplete');
    })().catch(error => { readingPromise = null; throw error; });
    return readingPromise;
  }
  function math() {
    if (!mathPromise) mathPromise = (async () => {
      await loadData(config.math.data);
      await loadScripts(config.math.scripts);
      if (!window.__AMC8_MATH_NAV) throw new Error('Mathematics initialization incomplete');
      ready = true;
    })().catch(error => { mathPromise = null; throw error; });
    return mathPromise;
  }
  async function readingAction(action, data = {}) {
    const ticket = ++intent;
    message('正在准备阅读训练…');
    try {
      await reading();
      if (ticket !== intent) return;
      window.__AMC8_ReadingRuntime.handle(action, data);
      clear();
    } catch (error) { if (ticket === intent) fail(error, () => readingAction(action, data)); }
  }
  async function mathAction() {
    const ticket = ++intent;
    facade.leave();
    message('正在准备数学侦探…');
    try {
      await math();
      if (ticket !== intent) return;
      window.__AMC8_MATH_NAV.math();
      clear();
    } catch (error) { if (ticket === intent) fail(error, mathAction); }
  }
  const runtime = () => window.__AMC8_ReadingRuntime;
  const facade = window.ReadingUI = {
    handle(action, data) {
      if (action !== 'reading' && !String(action).startsWith('rd')) return false;
      if (runtime()) { ++intent; clear(); return runtime().handle(action, data); }
      readingAction(action, { ...data }); return true;
    },
    input: target => runtime()?.input(target) || false,
    leave: () => runtime()?.leave(),
    afterRender: () => { if (host.view === 'reading') runtime()?.afterRender(); },
    render: () => runtime()?.render() || '<p role="status">正在准备阅读训练…</p>',
    entry: () => runtime()?.entry() || '<section class="panel rd-entry"><h2>今天的中文阅读冒险</h2><p>先自己读，需要时再用拼音和朗读。</p><button class="primary" data-action="reading">进入中文阅读 →</button><button class="secondary" data-action="rdParent">家长阅读看板</button></section>',
    mathBridge: (task, feedback) => !task || !feedback || feedback.ok ? '' : '<section class="panel rd-math-bridge"><h3>这次卡在哪里？</h3><p>读题和数学想法可以分别记录。</p><button class="secondary" data-action="rdMathConcern" data-reason="character">有字不认识</button><button class="secondary" data-action="rdMathConcern" data-reason="conditions">没有找清条件</button><button class="secondary" data-action="rdMathConcern" data-reason="math">读懂了，还在想解法</button></section>',
    snapshot: () => { if (runtime()) return runtime().snapshot(); try { return JSON.parse(localStorage.getItem(store + '_reading_r1') || 'null'); } catch (_) { return null; } },
    report: () => runtime()?.report() || null,
    backup: () => runtime() ? runtime().backup() : localStorage.getItem(store + '_reading_r1'),
    engine: () => runtime()?.engine(),
    openMaterials: (ids, options) => reading().then(() => runtime().openMaterials(ids, options)),
    rt: value => runtime() ? runtime().rt(value) : String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])),
    pronounce: value => runtime()?.pronounce(value) || []
  };
  document.addEventListener('click', event => {
    const button = event.target.closest('button');
    if (!button) return;
    if (button.dataset.loadRetry) { if (retry) retry(); return; }
    const action = button.dataset.action;
    if (ready) { if (action === 'home' || action === 'hubHome') { ++intent; clear(); } return; }
    if (!action) return;
    if (action === 'hubHome') {
      ++intent; facade.leave(); host.view = 'home'; root.innerHTML = LearningPortal.page(); clear();
    } else if (action === 'home') mathAction();
    else if (action === 'speechStop') runtime()?.handle('rdVoiceStop');
    else if (action === 'reading' || action.startsWith('rd')) facade.handle(action, button.dataset);
  });
  for (const type of ['input', 'change']) document.addEventListener(type, event => { if (!ready) facade.input(event.target); });
  // Real image failures remain visible and retryable rather than silently showing an empty figure.
  document.addEventListener('error', event => {
    const image = event.target;
    if (!(image instanceof HTMLImageElement) || !image.closest('#app') || image.dataset.retryOffered) return;
    image.dataset.retryOffered = 'true';
    const button = document.createElement('button'); button.type = 'button'; button.textContent = '图片未加载，点此重试';
    button.addEventListener('click', () => { image.src = image.src.split('?')[0] + '?retry=' + Date.now(); button.remove(); delete image.dataset.retryOffered; });
    image.after(button);
  }, true);
  if (config.autoMath) {
    const startQA = () => math().then(() => { if (!config.hasAfter) window.__AMC8_MATH_NAV.math(); clear(); }).catch(error => fail(error, startQA));
    message('正在准备测试入口…'); startQA();
  } else if (location.hash === '#reading' || location.hash === '#reading-parent') readingAction(location.hash === '#reading-parent' ? 'rdParent' : 'reading');
  else if (location.hash === '#math') mathAction();
})();
