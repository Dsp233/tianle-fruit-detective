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
        await script({ id: delivery.script }, source);
        readingSourcePromise = null;
      } else {
        await loadData(config.reading.data);
        await loadScripts(config.reading.scripts);
      }
      if (!window.__AMC8_ReadingRuntime) throw new Error('Reading initialization incomplete');'''
INSERT = '  function reading() {\n'
HOST_RENDER = "    render() { if (host.view === 'reading' && window.__AMC8_ReadingRuntime) root.innerHTML = window.__AMC8_ReadingRuntime.render(); }"
SHARDED_HOST_RENDER = "    render: () => renderReading(),\n    readingQuestionHash: q => readingQuestionHashes[q.id],\n    readingMaterialHash: m => readingMaterialHashes[m.id],\n    readingPassage: m => readingPassages[m.id]"
FACADE = "      if (runtime()) { ++intent; clear(); return runtime().handle(action, data); }"
SHARDED_FACADE = '''      if (runtime()) {
        ++intent; clear();
        if (action === 'rdRetryContent') { renderReading(); return true; }
        return runtime().handle(action, data);
      }'''
DISPLAY = ('prompt', 'hint', 'explanation', 'options')




def compact(value):
    return json.dumps(value, ensure_ascii=False, separators=(',', ':'))


def collect(value, out):
    if isinstance(value, str):
        out.setdefault(value, len(out))
    elif isinstance(value, list):
        for item in value:
            collect(item, out)
    elif isinstance(value, dict):
        for key in sorted(value):
            collect(value[key], out)


def fingerprint(text):
    result = 2166136261
    for character in text:
        result = ((result ^ ord(character)) * 16777619) & 0xffffffff
    return f'{result:08x}'


def partition(source, runtime):
    data = json.loads(source)
    pinyin = data.pop('pinyinTexts')
    reviewed = data.pop('contextReviewedPositions')
    hashes = {}
    material_hashes = {}
    passages = {}
    passage_indexes = {}
    weeks = {}
    active = data['courseScope']['activeCourseId']
    diagnostic_materials = [m for stage in data['diagnostics']['sets']
                            for form in stage['forms'] for m in form['materials']]
    for material in data['materials'] + diagnostic_materials:
        text = material['text']
        if text:
            passages[material['id']] = passage_indexes.setdefault(text, len(passage_indexes))
    for material in data['materials']:
        if material['courseId'] == active and material['week'] <= 1:
            continue
        group = f'week-{material["week"]}' if material['courseId'] == active else f'legacy-{material["week"]}'
        questions = []
        for question in material['questions']:
            hashes[question['id']] = fingerprint(compact(question))
            display = {k: question[k] for k in DISPLAY if k in question}
            for k in display:
                question[k] = ([str(i) for i in range(len(question[k]))] if k == 'options' else None)
            questions.append(display)
        panels, text = material['panels'], material['text']
        material_hashes[material['id']] = fingerprint(text)
        material['text'] = None
        material['panels'] = [None] * len(panels)
        weeks.setdefault(group, []).append([material['id'], panels, questions])
    indexes = {}
    collect(data, indexes)
    owners = {}
    for week, materials in weeks.items():
        strings = {}
        collect(materials, strings)
        for _, panels, _ in materials:
            text = ''.join(panel['text'] for panel in panels)
            strings.setdefault(text, len(strings))
        for value in strings:
            owners.setdefault(value, []).append(week)
    supplementary = {week: [rows, [], []] for week, rows in weeks.items()}

    def separate(rows, bucket):
        initial = []
        for text, value in rows:
            groups = owners.get(text)
            if groups and text not in indexes and text not in runtime:
                for week in groups:
                    supplementary[week][bucket].append([text, value])
            else:
                initial.append([indexes.get(text, text), value])
        return initial

    def overrides(text, sounds):
        result = []
        for index, (char, sound) in enumerate(zip(text, sounds, strict=True)):
            if sound != data['pinyinMap'].get(char, ''):
                result.extend([index, sound])
        return result

    initial = [data, separate(((t, overrides(t, s)) for t, s in pinyin.items()), 1),
               separate(reviewed.items(), 2), hashes, material_hashes, passages]
    return initial, supplementary


def patch_runtime(source):
    changes = (
        ("  const diagnostics=data.diagnostics?.sets||[];",
         "  const questionHash=q=>window.__AMC8_READING_HOST?.readingQuestionHash?.(q)??hash(JSON.stringify(q));\n"
         "  const materialHash=m=>window.__AMC8_READING_HOST?.readingMaterialHash?.(m)??hash(m.text);\n"
         "  const passageKey=m=>window.__AMC8_READING_HOST?.readingPassage?.(m)??m.text;\n"
         "  const diagnostics=data.diagnostics?.sets||[];", 1),
        ("typeof m.text!=='string'", "passageKey(m)==null", 1),
        ("previous!==m.text", "previous!==passageKey(m)", 1),
        ("passageGroups.set(id,m.text)", "passageGroups.set(id,passageKey(m))", 1),
        ("typeof one.text==='string'&&one.text.length>0&&one.text===other.text",
         "passageKey(one)!=null&&passageKey(one)!==''&&passageKey(one)===passageKey(other)", 1),
        ("hash(descriptor.m.text)", "materialHash(descriptor.m)", 1),
        ("hash(d.m.text)", "materialHash(d.m)", 1),
        ("materialHash:hash(c.material.text)", "materialHash:materialHash(c.material)", 2),
        ("e.materialHash===hash(m.text)", "e.materialHash===materialHash(m)", 1),
        ("hash(qs.get(e.questionId).m.text)", "materialHash(qs.get(e.questionId).m)", 2),
        ("hash(JSON.stringify(qs.get(e.questionId).q))", "questionHash(qs.get(e.questionId).q)", 2),
        ("function openCurrent(){const c=current();if(!c)return null;",
         "function openCurrent(){const c=current();if(!c)return null;if(c.material.text===null)return c;", 1),
        ("function touch(){const s=state.session;if(!s||s.paused)return;",
         "function touch(){const s=state.session;if(!s||s.paused||currentMaterialPending())return;", 1),
        ("function openCurrent(){const c=current();",
         "function currentMaterialPending(){const s=state.session;return s&&bank.get(s.materialIds[s.materialIndex])?.text===null;}\n"
         "  function activateContent(){const s=state.session;if(s&&!s.openMaterialIds.includes(s.materialIds[s.materialIndex])){s.lastTick=clock();openCurrent();}}\n"
         "  function openCurrent(){const c=current();", 1),
        ("return {unfinished,resumeSession,markReadDone,key,data,start,", "return {unfinished,resumeSession,markReadDone,key,data,activateContent,start,", 1),
        ("hash(JSON.stringify(descriptor.q))", "questionHash(descriptor.q)", 1),
        ("hash(JSON.stringify(d.q))", "questionHash(d.q)", 1),
        ("questionHash:hash(JSON.stringify(q))", "questionHash:questionHash(q)", 1),
        ("e.questionHash===hash(JSON.stringify(q))", "e.questionHash===questionHash(q)", 1),
        ("ui.screen='course';host.view='reading';host.render();}\n function handle",
         "ui.screen='course';host.view='reading';return host.render();}\n function handle", 1),
        ("return {render:renderPage,handle,input,entry,mathBridge,leave,afterRender,navigationState,restoreNavigation,",
         "return {render:renderPage,handle,input,entry,mathBridge,leave,afterRender,navigationState,restoreNavigation,"
         "visibleMaterial:()=>ui.screen==='course'?engine?.current()?.material.id:null,", 1),
    )
    for before, after, count in changes:
        if source.count(before) != count:
            raise ValueError('Unexpected reading runtime source: ' + before)
        source = source.replace(before, after)
    return source


def assets(source, runtime):
    files = {}
    runtime = runtime.decode()
    startup, weeks = partition(source, runtime)

    def asset(content, ext):
        path = f'assets/reading-performance/{hashlib.sha256(content).hexdigest()}.{ext}'
        files[path] = content
        return path

    config = {'data': asset(compact(startup).encode(), 'json'),
              'script': asset(patch_runtime(runtime).encode(), 'js'),
              'weeks': {week: asset(compact(rows).encode(), 'json') for week, rows in weeks.items()}}
    return config, files


def apply(html):
    for needle in (INSERT, READING, HOST_RENDER, FACADE):
        if html.count(needle) != 1:
            raise ValueError('Unexpected reading loader source')
    return (html.replace(INSERT, LOADER + '\n' + INSERT).replace(READING, PARALLEL)
            .replace(HOST_RENDER, SHARDED_HOST_RENDER).replace(FACADE, SHARDED_FACADE))


def remove(html):
    return (html.replace(LOADER + '\n' + INSERT, INSERT).replace(PARALLEL, READING)
            .replace(SHARDED_HOST_RENDER, HOST_RENDER).replace(SHARDED_FACADE, FACADE))
