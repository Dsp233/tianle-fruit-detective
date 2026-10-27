/* RC79 LOAD2: bounded compressed transport; no question, grading or storage-schema changes. */
(() => {
  'use strict';
  const config = JSON.parse(document.getElementById('learning-delivery').textContent);
  const base = new URL(config.base, location.href);
  const root = document.getElementById('app');
  const status = document.getElementById('learning-load-status');
  const store = config.store;
  // The guide is independent of the learning records and never changes the
  // selected curriculum. Existing profiles keep it collapsed by default.
  const guide = document.getElementById('learning-guide');
  if (guide && store) {
    const guideKey = store + '_intro_v1';
    try { if (!localStorage.getItem(guideKey) && !localStorage.getItem(store) && !localStorage.getItem(store + '_reading_r1')) guide.open = true; } catch (_) {}
    guide.addEventListener('toggle', () => { if (!guide.open) { try { localStorage.setItem(guideKey, 'seen'); } catch (_) {} } });
    document.addEventListener('click', event => {
      const close = event.target.closest('[data-guide-dismiss]');
      const entry = event.target.closest('[data-action="home"],[data-action="reading"],[data-action="rdParent"]');
      if (close || entry) guide.open = false;
    }, true);
  }
  const scripts = new Map();
  const packets = new Map();
  const chunks = new Map();
  let networkActive = 0;
  const networkQueue = [];
  const yieldFrame = () => new Promise(resolve => setTimeout(resolve, 0));
  let mathPromise = null, readingPromise = null, ready = false, intent = 0, retry = null;
  const host = window.__AMC8_READING_HOST = {
    store, view: 'home',
    get saved() { try { const value = JSON.parse(localStorage.getItem(store) || '{}'); return value && typeof value === 'object' ? value : {}; } catch (_) { return {}; } },
    taskNow: () => null,
    render() { if (host.view === 'reading' && window.__AMC8_ReadingRuntime) root.innerHTML = window.__AMC8_ReadingRuntime.render(); }
  };
  // APIs used by the existing application on older Safari versions.
  if (!Object.hasOwn) Object.hasOwn = (obj, key) => Object.prototype.hasOwnProperty.call(obj, key);
  // The evidence store and older lesson modules use .at() when reading the
  // last submission. Safari versions before that API must keep the same
  // original first/retry records instead of failing during parent views.
  const relativeAt=function(index){
    const value=Object(this),length=Number(value.length)||0,n=Number(index)||0;
    let i=n<0?Math.ceil(n):Math.floor(n);if(i<0)i+=length;
    return i<0||i>=length?undefined:value[i];
  };
  if (!Array.prototype.at) Object.defineProperty(Array.prototype,'at',{value:relativeAt,configurable:true,writable:true});
  if (!String.prototype.at) Object.defineProperty(String.prototype,'at',{value:relativeAt,configurable:true,writable:true});
  function message(text, failed) {
    status.hidden = false;
    status.textContent = '';
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
    if (networkActive >= 3) await new Promise(resolve => networkQueue.push(resolve));
    else ++networkActive;
    try {
      return await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('GET', new URL(path, base).href, true);
        xhr.timeout = 25000;
        xhr.onload = () => xhr.status >= 200 && xhr.status < 300 ? resolve(xhr.responseText) : reject(new Error('HTTP ' + xhr.status + ' ' + path));
        xhr.onerror = () => reject(new Error('Network error ' + path));
        xhr.ontimeout = () => reject(new Error('Network timeout ' + path));
        xhr.send();
      });
    } finally { const next = networkQueue.shift(); if (next) next(); else --networkActive; }
  }
  function chunk(path) {
    if (!chunks.has(path)) chunks.set(path, (async () => {
      let last;
      for (let attempt = 0; attempt < 2; attempt++) {
        try {
          const text = await download(path);
          if (text.length > 131072) throw new Error('Transport part too large');
          const row = JSON.parse(text), binary = atob(row.gz), bytes = new Uint8Array(binary.length);
          for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
          return bytes;
        } catch (error) { last = error; await yieldFrame(); }
      }
      throw last;
    })().catch(error => { chunks.delete(path); throw error; }));
    return chunks.get(path);
  }
  async function readPacket(packet) {
    if (!packets.has(packet.id)) packets.set(packet.id, (async () => {
      const parts = await Promise.all(packet.parts.map(chunk));
      const bytes = new Uint8Array(parts.reduce((n, part) => n + part.length, 0));
      let offset = 0; for (const part of parts) { bytes.set(part, offset); offset += part.length; }
      await yieldFrame();
      // The same small ES5 decoder works on Safari without streams, fetch or TextDecoder.
      const text = window.pako.ungzip(bytes, { to: 'string' });
      await yieldFrame();
      return packet.kind === 'js' ? text : JSON.parse(text);
    })().catch(error => { packets.delete(packet.id); throw error; }));
    return packets.get(packet.id);
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
        await yieldFrame();
      }
    };
    await Promise.all(Array.from({ length: Math.min(3, rows.length) }, worker));
  }
  // Historical correspondence is only needed on its parent-facing panel.
  // Keep its original reviewed data intact and load it on demand.
  if (!config.legacy && config.math.optionalData?.length) {
    const optional = new Map(config.math.optionalData.map(row => [row.key, row]));
    window.__AMC8_OPTIONAL_DATA = {
      async load(key) {
        const row = optional.get(key);
        if (!row) throw new Error('Unknown optional data: ' + key);
        if (window[key] === undefined) window[key] = await readPacket(row);
        return true;
      }
    };
  }
  function script(packet, text) {
    if (!scripts.has(packet.id)) scripts.set(packet.id, new Promise((resolve, reject) => {
      const el = document.createElement('script');
      const url = URL.createObjectURL(new Blob([text + '\n//# sourceURL=amc8-' + packet.id + '.js'], { type: 'text/javascript' }));
      el.src = url; el.async = false;
      let executionError = null;
      const capture = event => { if (event.filename === url || String(event.filename).includes(packet.id)) executionError = event.error || new Error(event.message); };
      window.addEventListener('error', capture);
      const finish = error => { window.removeEventListener('error', capture); URL.revokeObjectURL(url); error ? reject(error) : resolve(); };
      el.onload = () => finish(executionError);
      el.onerror = () => { el.remove(); finish(new Error('Script failed ' + packet.id)); };
      document.head.appendChild(el);
    }).catch(error => { scripts.delete(packet.id); throw error; }));
    return scripts.get(packet.id);
  }
  async function loadScripts(rows) {
    // Keep only a small window of inflated source text in memory. Downloads
    // remain concurrent, while scripts execute in their original order.
    const pending = new Map(), width = 3;
    const prepare = index => {
      if (index >= rows.length || pending.has(index)) return;
      const packet = rows[index];
      const work = scripts.has(packet.id) ? scripts.get(packet.id).then(() => ({ loaded: true })) : readPacket(packet).then(text => ({ text }));
      pending.set(index, work.catch(error => ({ error })));
    };
    for (let i = 0; i < Math.min(width, rows.length); i++) prepare(i);
    for (let i = 0; i < rows.length; i++) {
      const row = await pending.get(i); if (row.error) throw row.error;
      if (!row.loaded) await script(rows[i], row.text);
      pending.delete(i); packets.delete(rows[i].id); prepare(i + width);
      await yieldFrame();
    }
  }
  if (config.legacy) {
    const start = async () => {
      message('正在准备学习内容…');
      try { await loadData(config.data); await loadScripts(config.scripts); window.__AMC8_LEGACY_READY = true; clear(); }
      catch (error) { fail(error, start); }
    };
    document.addEventListener('click', event => { if (event.target.closest('[data-load-retry]') && retry) retry(); });
    window.__AMC8_BOOT_READY = true;
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
    try {
      channel('reading'); message('正在准备阅读训练…');
      await reading();
      if (ticket !== intent) return;
      window.__AMC8_ReadingRuntime.handle(action, data);
      clear();
    } catch (error) { if (ticket === intent) fail(error, () => readingAction(action, data)); }
  }
  async function mathAction(target = 'math') {
    const ticket = ++intent;
    try {
      facade.leave(); channel('math'); message('正在准备数学侦探…');
      await math();
      if (ticket !== intent) return;
      if (target === 'progress') window.__AMC8_MATH_NAV.progress();
      else window.__AMC8_MATH_NAV.math();
      clear();
    } catch (error) { if (ticket === intent) fail(error, () => mathAction(target)); }
  }
  function channel(name) {
    const title = name === 'reading' ? '阅读训练' : '数学侦探';
    root.innerHTML = '<section class="panel" data-loading-channel="' + name + '"><p class="kicker">天乐的功夫学堂</p><h1>' + title + '</h1><p>正在准备课程，请稍等。加载进度会显示在上方。</p><button class="secondary" data-action="hubHome">返回学习首页</button></section>';
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
  // History stores only a screen and an existing session reference. Restoring
  // a screen never submits an answer or starts a replacement exercise.
  function installNavigation() {
    const h=window.history;if(!h?.pushState||!h?.replaceState)return null;
    const key='__tianleNavigationV1',routeActions=new Set(['hubHome','home','reading','rdHome','rdPlan','rdParent','rdOpenDiagnostic','rdStart','rdChallenge','rdResume','rdDiagnostic','topicStart','topicChallenge','topicExit','rtmBack','rtmConnectedResume','rtmConnectedRetry','rtmConnectedNew','progress']);
    let sequence=0,pending=null;
    const stateFor=route=>({...((h.state&&typeof h.state==='object')?h.state:{}),[key]:route});
    const current=(hint='')=>{
      const loading=root.querySelector('[data-loading-channel]');
      if(loading)return loading.dataset.loadingChannel==='reading'?{page:'reading',screen:hint==='rdParent'?'parent':'home',sessionId:null}:{page:hint==='progress'?'math-progress':'math-select'};
      if(host.view==='reading'&&runtime())return {page:'reading',...runtime().navigationState()};
      return window.__AMC8_MATH_NAV?.route()||{page:'hub'};
    };
    const previous=h.state?.[key]||null;
    try{if(!previous){const initial=location.hash==='#math'?{page:'math-select'}:location.hash==='#reading-parent'?{page:'reading',screen:'parent',sessionId:null}:location.hash==='#reading'?{page:'reading',screen:'home',sessionId:null}:{page:'hub'};h.replaceState(stateFor(initial),'');}}catch(_){return null}
    const push=route=>{try{const last=h.state?.[key];if(JSON.stringify(last)!==JSON.stringify(route))h.pushState(stateFor(route),'')}catch(_){}};
    async function restore(route){
      const ticket=++intent;
      try{
        if(route.page==='hub'){if(ready)window.__AMC8_MATH_NAV.home();else{facade.leave();host.view='home';root.innerHTML=LearningPortal.page()}clear();return}
        if(route.page==='reading'){
          window.__AMC8_MATH_NAV?.stop();channel('reading');message('正在准备阅读训练…');await reading();if(ticket!==intent)return;
          runtime().restoreNavigation(route);clear();return;
        }
        if(['math-select','math-progress','math-work','math-topic'].includes(route.page)){
          if(!ready)facade.leave();channel('math');message('正在准备数学侦探…');await math();if(ticket!==intent)return;
          window.__AMC8_MATH_NAV.restore(route);clear();return;
        }
      }catch(error){if(ticket===intent)fail(error,()=>restore(route))}
    }
    window.addEventListener('popstate',event=>{sequence++;pending=null;const route=event.state?.[key];if(route&&typeof route.page==='string')restore(route)});
    const finishNavigation=ticket=>{
      if(!pending||pending.ticket!==ticket||ticket!==sequence)return;
      const action=pending.action;pending=null;push(current(action));
    };
    document.addEventListener('click',event=>{
      const action=event.target.closest?.('[data-action]')?.dataset.action;if(!routeActions.has(action))return;
      if(pending)finishNavigation(pending.ticket);
      try{h.replaceState(stateFor(current()),'')}catch(_){}
      // The application's handlers run at document during bubbling. Window's
      // bubbling listener runs afterwards and records their destination before
      // a user can immediately press Back. The timer is only a fallback for a
      // click whose propagation is deliberately stopped.
      const ticket=++sequence;pending={ticket,action};setTimeout(()=>finishNavigation(ticket),0);
    },true);
    window.addEventListener('click',()=>{if(pending)finishNavigation(pending.ticket)});
    return {previous,restore,push};
  }
  const navigation=installNavigation();
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
    else if (action === 'progress') mathAction('progress');
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
  window.__AMC8_BOOT_READY = true;
  const queued = window.__AMC8_PENDING_ACTION;
  delete window.__AMC8_PENDING_ACTION;
  if (queued === 'reading' || queued === 'rdParent') { navigation?.push({page:'reading',screen:queued==='rdParent'?'parent':'home',sessionId:null});readingAction(queued); }
  else if (queued === 'home') { navigation?.push({page:'math-select'});mathAction(); }
  else if (config.autoMath) {
    const startQA = () => math().then(() => { if (!config.hasAfter) window.__AMC8_MATH_NAV.math(); clear(); }).catch(error => fail(error, startQA));
    message('正在准备测试入口…'); startQA();
  } else if (navigation?.previous&&navigation.previous.page!=='hub') navigation.restore(navigation.previous);
  else if (location.hash === '#reading' || location.hash === '#reading-parent') readingAction(location.hash === '#reading-parent' ? 'rdParent' : 'reading');
  else if (location.hash === '#math') mathAction();
})();
