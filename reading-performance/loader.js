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
    for (const [key, overrides] of pinyin) {
      const text = getText(key);
      const sounds = Array.from(text, char => data.pinyinMap[char] || '');
      for (let i = 0; i < overrides.length; i += 2) sounds[overrides[i]] = overrides[i + 1];
      data.pinyinTexts[text] = sounds;
    }
    data.contextReviewedPositions = Object.fromEntries(reviewed.map(([key, offsets]) => [getText(key), offsets]));
    return data;
  }

  let readingDataPromise, readingScriptPromise, readingReady = false;
  function loadReadingData(path) {
    if (!readingDataPromise) {
      readingDataPromise = download(path).then(body => {
        const data = restoreReadingData(JSON.parse(body));
        if (!data.contentHash || !Array.isArray(data.materials)) throw new Error('Invalid reading data');
        window.__AMC8_READING_DATA = data;
      }).catch(error => { readingDataPromise = null; throw error; });
    }
    return readingDataPromise;
  }

  function loadReadingScript(path) {
    if (!readingScriptPromise) {
      readingScriptPromise = new Promise((resolve, reject) => {
        const el = document.createElement('script');
        el.src = new URL(path, base).href;
        el.async = true;
        let executionError;
        const capture = event => {
          if (event.filename === el.src) executionError = event.error || new Error(event.message);
        };
        window.addEventListener('error', capture);
        function finish(error) {
          window.removeEventListener('error', capture);
          el.remove();
          if (error) reject(error);
          else resolve();
        }
        el.onload = () => finish(executionError || (!window.__AMC8_ReadingRuntime && new Error('Reading initialization incomplete')));
        el.onerror = () => finish(new Error('Reading script failed to load'));
        document.head.appendChild(el);
      }).catch(error => { readingScriptPromise = null; throw error; });
    }
    return readingScriptPromise;
  }
