  function restoreReadingData(packed) {
    const [data, pinyin, reviewed] = packed;
    const texts = new Set();
    function collect(value) {
      if (typeof value === 'string') texts.add(value);
      else if (Array.isArray(value)) value.forEach(collect);
      else if (value !== null && typeof value === 'object') {
        Object.keys(value).sort().forEach(key => collect(value[key]));
      }
    }
    collect(data);
    const byIndex = Array.from(texts);
    const getText = key => typeof key === 'number' ? byIndex[key] : key;
    data.pinyinTexts = Object.create(null);
    data.contextReviewedPositions = Object.create(null);
    addReadingPronunciations(data, pinyin, reviewed, getText);
    return data;
  }

  function addReadingPronunciations(data, pinyin, reviewed, getText) {
    for (const [key, overrides] of pinyin) {
      const text = getText(key);
      const sounds = Array.from(text, char => data.pinyinMap[char] || '');
      for (let i = 0; i < overrides.length; i += 2) sounds[overrides[i]] = overrides[i + 1];
      data.pinyinTexts[text] = sounds;
    }
    for (const [key, offsets] of reviewed) data.contextReviewedPositions[getText(key)] = offsets;
  }

  async function readReadingAsset(path) {
    try { return await download(path); }
    catch (_) { await yieldFrame(); return download(path); }
  }

  let readingDataPromise, readingSourcePromise;
  let readingQuestionHashes, readingMaterialHashes, readingPassages, readingPaintTask, readingPaint = 0;
  const materialsById = new Map(), weekRequests = new Map(), loadedWeeks = new Set();
  function loadReadingData(path) {
    if (!readingDataPromise) {
      readingDataPromise = readReadingAsset(path).then(body => {
        const packed = JSON.parse(body);
        const data = restoreReadingData(packed);
        [readingQuestionHashes, readingMaterialHashes, readingPassages] =
          packed.slice(3).map(table => Object.assign(Object.create(null), table));
        for (const material of data.materials) {
          if (material.panels[0] === null) materialsById.set(material.id, material);
        }
        if (!data.contentHash || !Array.isArray(data.materials)) throw new Error('Invalid reading data');
        window.__AMC8_READING_DATA = data;
      }).catch(error => { readingDataPromise = null; throw error; });
    }
    return readingDataPromise;
  }

  function loadReadingSource(path) {
    if (!readingSourcePromise) {
      readingSourcePromise = readReadingAsset(path).catch(error => {
        readingSourcePromise = null;
        throw error;
      });
    }
    return readingSourcePromise;
  }

  function readingFingerprint(text) {
    let hash = 2166136261;
    for (const char of text) {
      hash = Math.imul(hash ^ char.codePointAt(0), 16777619);
    }
    return (hash >>> 0).toString(16).padStart(8, '0');
  }

  function readingWeek(material) {
    return (material.courseId === window.__AMC8_READING_DATA.courseScope.activeCourseId ? 'week-' : 'legacy-') + material.week;
  }

  function requestReadingWeek(week) {
    if (!weekRequests.has(week)) {
      const request = readReadingAsset(config.reading.delivery.weeks[week]).then(body => {
        const [rows, pinyin, reviewed] = JSON.parse(body);
        const expected = [...materialsById.values()].filter(material => readingWeek(material) === week);
        if (rows.length !== expected.length) throw new Error('Incomplete reading week');
        for (const [index, [id, panels, displays]] of rows.entries()) {
          const material = expected[index];
          if (id !== material.id || panels.length !== material.panels.length ||
              readingFingerprint(panels.map(panel => panel.text).join('')) !== readingMaterialHashes[id] ||
              displays.length !== material.questions.length ||
              material.questions.some((question, i) =>
                readingFingerprint(JSON.stringify({ ...question, ...displays[i] })) !== readingQuestionHashes[question.id])) {
            throw new Error('Reading week does not match its index');
          }
        }
        addReadingPronunciations(window.__AMC8_READING_DATA, pinyin, reviewed, text => text);
        for (const [id, panels, displays] of rows) {
          const material = materialsById.get(id);
          material.panels = panels;
          material.text = panels.map(panel => panel.text).join('');
          material.questions.forEach((question, i) => Object.assign(question, displays[i]));
        }
        loadedWeeks.add(week);
      }).finally(() => weekRequests.delete(week));
      weekRequests.set(week, request);
    }
    return weekRequests.get(week);
  }

  const readingContentLoading = '<section class="panel" data-reading-content-loading aria-busy="true"><p role="status">正在加载本课内容…</p></section>';
  function renderReading() {
    if (host.view !== 'reading' || !runtime()) return;
    root.innerHTML = readingMarkup();
    return readingPaintTask;
  }

  function readingMarkup() {
    const id = runtime().visibleMaterial?.();
    const material = materialsById.get(id);
    const week = material && readingWeek(material);
    const paint = ++readingPaint;
    readingPaintTask = null;
    if (!week || loadedWeeks.has(week)) {
      if (week) runtime().engine().activateContent();
      return runtime().render();
    }
    const current = () => paint === readingPaint && host.view === 'reading' && runtime().visibleMaterial() === id;
    readingPaintTask = requestReadingWeek(week).then(() => {
      if (current()) {
        runtime().engine().activateContent();
        root.innerHTML = runtime().render();
      }
    }, () => {
      if (current()) root.innerHTML = '<section class="panel" data-reading-content-error><p role="alert">本课内容暂时无法加载，学习记录已保留。</p><button class="primary" data-action="rdRetryContent">重试加载</button><button class="secondary" data-action="rdHome">阅读首页</button></section>';
    });
    return readingContentLoading;
  }
