"""Build the lossless reading transport from the accepted W1 data and runtime."""
import hashlib
import json
from pathlib import Path

DIRECTORY = Path(__file__).resolve().parent
LOADER = (DIRECTORY / 'loader.js').read_text()
READING = '''      await loadData(config.reading.data);
      await loadScripts(config.reading.scripts);
      if (!window.__AMC8_ReadingRuntime) throw new Error('Reading initialization incomplete');'''
PARALLEL = '''      if (config.reading.delivery) {
        const delivery = config.reading.delivery;
        const [, source] = await Promise.all([loadReadingData(delivery.data), loadReadingSource(delivery.script)]);
        // Publish the runtime only after its data is available, including to
        // callers that use the runtime directly rather than the facade.
        await script(config.reading.scripts[0], source);
        readingSourcePromise = null;
      } else {
        await loadData(config.reading.data);
        await loadScripts(config.reading.scripts);
      }
      if (!window.__AMC8_ReadingRuntime) throw new Error('Reading initialization incomplete');'''
INSERT = '  function reading() {\n'


def encode(source):
    data = json.loads(source)
    pinyin = data.pop('pinyinTexts')
    reviewed = data.pop('contextReviewedPositions')
    indexes = {}

    def collect(value):
        if isinstance(value, str):
            indexes.setdefault(value, len(indexes))
        elif isinstance(value, list):
            for item in value:
                collect(item)
        elif isinstance(value, dict):
            for key in sorted(value):
                collect(value[key])

    collect(data)
    default = data['pinyinMap']
    rows = []
    for text, sounds in pinyin.items():
        overrides = []
        for index, (char, sound) in enumerate(zip(text, sounds, strict=True)):
            if sound != default.get(char, ''):
                overrides.extend([index, sound])
        rows.append([indexes.get(text, text), overrides])
    return json.dumps(
        [data, rows, [[indexes.get(text, text), offsets] for text, offsets in reviewed.items()]],
        ensure_ascii=False, separators=(',', ':')
    ).encode()


def assets(source, runtime):
    files = {}
    config = {}
    for key, ext, content in (('data', 'json', encode(source)), ('script', 'js', runtime)):
        path = f'assets/reading-performance/{hashlib.sha256(content).hexdigest()}.{ext}'
        files[path] = content
        config[key] = path
    return config, files


def apply(html):
    for needle in (INSERT, READING):
        if html.count(needle) != 1:
            raise ValueError('Unexpected reading loader source')
    return html.replace(INSERT, LOADER + '\n' + INSERT).replace(READING, PARALLEL)


def remove(html):
    return html.replace(LOADER + '\n' + INSERT, INSERT).replace(PARALLEL, READING)
