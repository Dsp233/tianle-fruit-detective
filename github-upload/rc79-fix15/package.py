"""Delivery-only post-build pass. Inputs stay immutable; no curriculum or scoring edits."""
import argparse
import base64
import gzip
import hashlib
import html
import json
import os
from pathlib import Path
import re

HERE = Path(__file__).resolve().parent
DEC = json.JSONDecoder()
SCRIPT = re.compile(r'<script\b([^>]*)>([\s\S]*?)</script>', re.I)
STYLE = re.compile(r'<style\b[^>]*>([\s\S]*?)</style>', re.I)


def compact(value):
    return json.dumps(value, ensure_ascii=False, separators=(',', ':'))


class Package:
    def __init__(self, root):
        self.root = root
        self.assets = root / 'assets' / 'loading-r1'
        self.assets.mkdir(parents=True, exist_ok=True)
        self.identities = []
        self.pages = []

    def asset(self, value, ext):
        raw = value.encode('utf-8') if isinstance(value, str) else value
        digest = hashlib.sha256(raw).hexdigest()
        path = self.assets / (digest + '.' + ext)
        path.write_bytes(raw)
        return path.relative_to(self.root).as_posix()

    def image(self, uri):
        header, encoded = uri.split(',', 1)
        ext = {'image/png': 'png', 'image/webp': 'webp', 'image/jpeg': 'jpg', 'image/gif': 'gif'}[header[5:].split(';')[0]]
        raw = base64.b64decode(encoded, validate=True)
        return self.asset(raw, ext)

    def packet(self, key, value):
        text = compact(value)
        raw = text.encode('utf-8')
        self.identities.append({'key': key, 'sha256': hashlib.sha256(raw).hexdigest(), 'bytes': len(raw)})
        return {'key': key, 'json': self.asset(raw, 'json'), 'gzip': self.asset(gzip.compress(raw, mtime=0), 'bin'), 'bytes': len(raw)}

    def extract(self, source):
        """JSON is parsed as data, not millions of JavaScript AST nodes."""
        rows = []
        replacements = []
        pattern = r'window\.(__AMC8_[A-Z0-9_]+)\s*=\s*'
        for match in re.finditer(pattern, source):
            try:
                value, end = DEC.raw_decode(source, match.end())
            except ValueError:
                continue
            key = match[1]
            if key == '__AMC8_SOURCE_FIGURES':
                original = value
                value = {digest: self.image(uri) for digest, uri in value.items()}
                assert all(Path(path).stem == digest for digest, path in value.items()), 'Figure bytes changed'
                self.identities.append({'key': key, 'originalImageBytes': sum(len(base64.b64decode(x.split(',')[1])) for x in original.values()), 'images': len(value), 'exactImageHashes': True})
            rows.append(self.packet(key, value))
            replacements.append((match.start(), end, ''))
        for start, end, text in reversed(replacements):
            source = source[:start] + text + source[end:]
        # Generated exercise literals are unchanged, but decoded through the same JSON path.
        replacements = []
        for match in re.finditer(r'const ([A-Z][A-Z0-9_]+)\s*=\s*', source):
            try:
                value, end = DEC.raw_decode(source, match.end())
            except ValueError:
                continue
            if isinstance(value, (dict, list)) and end - match.end() > 32000:
                key = '__AMC8_STATIC_' + match[1]
                rows.append(self.packet(key, value))
                replacements.append((match.end(), end, 'window.' + key))
        for start, end, text in reversed(replacements):
            source = source[:start] + text + source[end:]
        return source, rows

    def chunks(self, source):
        pieces = re.split(r"(?m)(?=^'use strict';)", source)
        bundles, current = [], ''
        for piece in pieces:
            if current and len((current + piece).encode()) > 220000:
                bundles.append(self.asset(current, 'js'))
                current = ''
            current += piece
        if current.strip():
            bundles.append(self.asset(current, 'js'))
        return bundles

    def main(self, path, text):
        blocks = list(SCRIPT.finditer(text))
        release_at = next(i for i, m in enumerate(blocks) if m[2].startswith('window.__AMC8_RELEASE='))
        body = [m[2] for m in blocks]
        home_at = release_at + 1
        app_at = next(i for i, s in enumerate(body) if s.startswith("'use strict';\nconst ReadingUI=window.ReadingUI;"))
        read_ui = next(i for i, s in enumerate(body) if s.startswith('/* Additive child and parent route;'))
        read_data = next(i for i, s in enumerate(body) if 'window.__AMC8_READING_DATA=' in s)
        assert read_ui == app_at - 1 and read_data == app_at - 4
        app = body[app_at]
        store = re.search(r"const STORE='([^']+)';", app)[1]
        relative = os.path.relpath(self.root, path.parent).replace(os.sep, '/') + '/'
        text = text.replace('__AMC8_RELEASE_BASE__', relative)

        portal = body[home_at]
        match = re.search(r'window\.__AMC8_HOME_PANDA=("[^"]+");', portal)
        panda = self.image(json.loads(match[1]))
        portal = portal[:match.start()] + 'window.__AMC8_HOME_PANDA=new URL(' + json.dumps(panda) + ',new URL(' + json.dumps(relative) + ',location.href)).href;' + portal[match.end():]
        book = re.search(r"const book='([^']+)';", portal)[1]
        detective = re.search(r"const detective='([^']+)';", portal)[1]
        markup = re.search(r'function page\(\)\{return `([\s\S]+?)`\}', portal)[1]
        markup = markup.replace('${book}', book).replace('${detective}', detective).replace('${window.__AMC8_HOME_PANDA}', relative + panda)
        assert '${' not in markup

        math = '\n'.join(body[:release_at] + body[home_at + 1:read_data])
        math, math_data = self.extract(math)
        reading = body[read_data]
        reading, reading_data = self.extract(reading)
        assert not re.sub(r'/\*[\s\S]*?\*/', '', reading).strip().strip(';'), 'Reading data must be data only'
        ui = body[read_ui]
        ui = ui.replace('window.ReadingUI=(()=>{', 'window.__AMC8_ReadingRuntime=(()=>{\n const host=window.__AMC8_READING_HOST;\n const STORE=host.store;')
        ui = re.sub(r'\bview\b', 'host.view', ui)
        ui = ui.replace('saved.attempts', 'host.saved.attempts').replace('saved.topicPractice', 'host.saved.topicPractice')
        ui = re.sub(r'\brender\(\)', 'host.render()', ui)
        ui = re.sub(r'\btaskNow\(\)', 'host.taskNow()', ui)
        read_code = (self.root / 'source/progress_store.js').read_text() + '\n' + '\n'.join(body[read_data+1:read_ui] + [ui])
        # Remove only eager initial rendering/hash routing. The loader selects the requested module.
        tail = "\nrender();\nif(window.location?.hash==='#reading')ReadingUI.handle('reading',{});\nif(window.location?.hash==='#reading-parent')ReadingUI.handle('rdParent',{});\nif(window.location?.hash==='#math'){homePortal=false;open('home');}"
        assert app.count(tail) == 1
        binding = """
const readingHost=window.__AMC8_READING_HOST;
const previousReadingView=readingHost.view;
Object.defineProperties(readingHost,{view:{configurable:true,get:()=>view,set:value=>{view=value}},saved:{configurable:true,get:()=>saved}});
readingHost.render=render;readingHost.taskNow=taskNow;
if(previousReadingView==='reading')view='reading';
window.__AMC8_MATH_NAV={
 math(){homePortal=false;open('home')},home(){homePortal=true;open('home')},progress(){homePortal=false;open('progress')},stop(){stopAllSpeech()},
 route(){if(view==='reading')return null;if(view==='home')return {page:homePortal?'hub':'math-select'};if(view==='progress')return {page:'math-progress'};if(view==='examMapping'){const a=saved.rtm1?.sessions?.active;return {page:'math-work',attemptId:a?.attemptId||null,finished:a?.finished===true}}if(view==='competition'&&topicActive&&topicSession()){const s=topicSession();return {page:'math-topic',sessionId:s.id,cursor:s.cursor,taskId:s.items[s.cursor]?.taskId||null}}return {page:'math-select'}},
 restore(target){
  homePortal=false;
  if(target?.page==='math-progress'){open('progress');return}
  if(target?.page==='math-topic'){const s=topicSession();if(s?.id===target.sessionId&&s.cursor===target.cursor&&s.items[s.cursor]?.taskId===target.taskId){topicOpenCurrent();return}open('progress');return}
  if(target?.page==='math-work'){
   const a=saved.rtm1?.sessions?.active;
   if(!target.attemptId||a?.attemptId===target.attemptId&&(!a.finished||target.finished)){ExamMappingUI.handle('rtmOpen',{});return}
   const old=a?.attemptId===target.attemptId?a:(saved.rtm1?.sessions?.archived||[]).find(x=>x.attemptId===target.attemptId);
   if(old){ExamMappingUI.handle('rtmHistory',{});ExamMappingUI.handle('rtmReview',{id:old.attemptId});return}
   open('progress');return;
  }
  open('home');
 }
};
"""
        app = app.replace(tail, binding)
        math_scripts = self.chunks(math) + [self.asset(app, 'js')]
        after = body[app_at+1:]
        math_scripts += [self.asset(s, 'js') for s in after]
        config = {'revision': 'RC79-LOAD1', 'base': relative, 'store': store,
                  'math': {'data': math_data, 'scripts': math_scripts},
                  'reading': {'data': reading_data, 'scripts': self.chunks(read_code)},
                  'autoMath': path.relative_to(self.root).as_posix().startswith('qa/'), 'hasAfter': bool(after)}
        # Remove all original scripts and move only the tiny release/portal/loader back.
        text = SCRIPT.sub('', text)
        text = text.replace('<main id="app"></main>', '<main id="app">' + markup + '</main>')
        assert 'data-home-hub' in text
        status = '<div id="learning-load-status" class="learning-load-status" role="status" aria-live="polite" hidden></div>'
        text = text.replace('<main id="app">', status + '<main id="app">', 1)
        text = self.styles(text, relative)
        config_path = self.asset(compact(config), 'json')
        # Config is small and inline so startup does not depend on an extra request.
        release = DEC.raw_decode(body[release_at].split('=', 1)[1])[0]
        release['deliveryRevision'] = 'RC79-LOAD1'
        final = '<script>window.__AMC8_RELEASE=' + compact(release).replace('<', '\\u003c') + ';</script>\n<script id="learning-delivery" type="application/json">' + compact(config).replace('<', '\\u003c') + '</script>\n'
        final += '<script src="' + relative + self.asset(portal, 'js') + '" defer></script>\n'
        final += '<script src="' + relative + self.asset((HERE / 'loader.js').read_text(), 'js') + '" defer></script>\n'
        final += '<noscript><p role="alert">请开启浏览器的 JavaScript 后使用训练。</p></noscript>'
        text = text.replace('</body>', final + '\n</body>')
        self.pages.append({'path': path.relative_to(self.root).as_posix(), 'beforeBytes': len(path.read_bytes()), 'afterBytes': len(text.encode()), 'mode': 'independent-portal-reading-math', 'config': config_path, 'initialDataPackets': 0, 'questionImagesEager': 0, 'mathDataBytes': sum(row['bytes'] for row in math_data), 'readingDataBytes': sum(row['bytes'] for row in reading_data)})
        return text

    def styles(self, text, relative):
        def replace(match):
            css = match[1]
            # No remotely hosted assets/fonts are introduced.
            return '<link rel="stylesheet" href="' + relative + self.asset(css, 'css') + '">'
        text = STYLE.sub(replace, text)
        extra = '.learning-load-status{position:sticky;top:8px;z-index:20;max-width:1100px;margin:12px auto;padding:14px 18px;background:#fff5da;color:#173a3a;border:1px solid #d9b65e;border-radius:14px;box-shadow:0 4px 18px #173a3a18}.learning-load-status[hidden]{display:none}.learning-load-status button{margin-left:12px;min-height:44px;border:1px solid #476e61;border-radius:10px;padding:8px 16px;background:white;color:#173a3a}'
        return text.replace('</head>', '<link rel="stylesheet" href="' + relative + self.asset(extra, 'css') + '">\n</head>')

    def other(self, path, text):
        relative = os.path.relpath(self.root, path.parent).replace(os.sep, '/') + '/'
        script_bytes = sum(len(m[2].encode()) for m in SCRIPT.finditer(text))
        if script_bytes > 256000:
            sources = [m[2] for m in SCRIPT.finditer(text) if 'src=' not in m[1] and 'application/json' not in m[1]]
            code, data = self.extract('\n'.join(sources))
            code = re.sub(r'data:image/(?:png|webp|jpeg|gif);base64,[A-Za-z0-9+/=]+', lambda m: relative + self.image(m[0]), code)
            config = {'legacy': True, 'base': relative, 'data': data, 'scripts': self.chunks(code)}
            text = SCRIPT.sub(lambda m: m[0] if 'src=' in m[1] or 'application/json' in m[1] else '', text)
            text = self.styles(text, relative)
            text = text.replace('<main id="app"></main>', '<main id="app"><p role="status">正在准备学习内容…</p></main>')
            text = text.replace('<body>', '<body><div id="learning-load-status" class="learning-load-status" role="status" hidden></div>', 1)
            boot = '<script id="learning-delivery" type="application/json">' + compact(config).replace('<', '\\u003c') + '</script><script src="' + relative + self.asset((HERE / 'loader.js').read_text(), 'js') + '" defer></script>'
            text = text.replace('</body>', boot + '</body>')
            self.pages.append({'path': path.relative_to(self.root).as_posix(), 'beforeBytes': len(path.read_bytes()), 'afterBytes': len(text.encode()), 'mode': 'cached-data-packets'})
            return text
        # Historic previews and the academy retain their independent scripts/stores.
        text = re.sub(r'data:image/(?:png|webp|jpeg|gif);base64,[A-Za-z0-9+/=]+', lambda m: relative + self.image(m[0]), text)
        def replace(match):
            attrs, source = match.groups()
            if 'src=' in attrs or 'application/json' in attrs or not source.strip():
                return match[0]
            return '<script' + attrs + ' src="' + relative + self.asset(source, 'js') + '" defer></script>'
        text = SCRIPT.sub(replace, text)
        text = self.styles(text, relative)
        # Keep a useful state while any legacy app is still loading.
        text = text.replace('<main id="app"></main>', '<main id="app"><p role="status">正在准备学习内容…</p></main>')
        self.pages.append({'path': path.relative_to(self.root).as_posix(), 'beforeBytes': len(path.read_bytes()), 'afterBytes': len(text.encode()), 'mode': 'cached-external-resources'})
        return text

    def run(self):
        targets = sorted(self.root.rglob('*.html'))
        for path in targets:
            name = path.relative_to(self.root).as_posix()
            if any(p in name for p in ['.git/', 'node_modules/', 'assets/', 'github-upload/', 'content/']) or 'template' in path.name:
                continue
            text = path.read_text(encoding='utf-8')
            if 'id="learning-delivery"' in text:
                raise ValueError('Already packaged: ' + name)
            built = self.main(path, text) if 'const LearningPortal=' in text else self.other(path, text)
            path.write_text(built, encoding='utf-8')
        report = {'revision': 'RC79-LOAD1', 'baselineCommit': '63c9a525bc613dbee3a5afb52043963b146ce473', 'validationScope': 'loading-only targeted checks; no complete release verification', 'pages': self.pages, 'dataIdentities': self.identities, 'assets': len(list(self.assets.iterdir())), 'storageSchemaChanged': False, 'gradingChanged': False, 'contentChanged': False}
        target = self.root / 'muse/rc79/loading-r1/package-report.json'
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_text(json.dumps(report, ensure_ascii=False, indent=2))
        print(compact({'pages': len(self.pages), 'assets': report['assets'], 'beforeHtmlBytes': sum(p['beforeBytes'] for p in self.pages), 'afterHtmlBytes': sum(p['afterBytes'] for p in self.pages), 'main': next(p for p in self.pages if p['path'] == 'index.html')}))


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('root', type=Path)
    Package(parser.parse_args().root.resolve()).run()
