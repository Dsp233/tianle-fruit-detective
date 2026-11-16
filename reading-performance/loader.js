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

  async function readReadingAsset(path) {
    try { return await download(path); }
    catch (_) { await yieldFrame(); return download(path); }
  }

  let readingDataPromise, readingSourcePromise;
  function loadReadingData(path) {
    if (!readingDataPromise) {
      readingDataPromise = readReadingAsset(path).then(body => {
        const data = restoreReadingData(JSON.parse(body));
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
