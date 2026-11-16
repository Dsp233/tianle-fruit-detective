"""Issue #45 supplemental public checks, run only on the verification branch."""
import hashlib
import json
import mimetypes
import subprocess
from pathlib import Path
from urllib.parse import urlparse
from playwright.sync_api import sync_playwright

PUBLIC = 'https://dsp233.github.io/tianle-fruit-detective/'
RELEASE = 'f8e791e6cc5c62769b1c356723a4da67da05ce45'
OLD = '1894e72fd542c7ce6f2acff31c851281795559ae'
BASE = 'http://127.0.0.1:4174/'
KEY = 'tianle_amc8_question_design_v1_reading_r1'
EXPECTED = json.loads(Path('reading-art/release.json').read_text())['files']['index.html']
OUT = Path('reading-art/browser-evidence')
OUT.mkdir(exist_ok=True)
VOICE = r"""(() => {
 const calls = window.__w1Utterances = [];
 const voice = {lang:'zh-CN', name:'QA Mandarin', localService:true};
 let generation = 0;
 Object.defineProperty(window, 'SpeechSynthesisUtterance', {
   value: class {constructor(text) {this.text = text;}},
 });
 Object.defineProperty(window, 'speechSynthesis', {value: {
   getVoices: () => [voice],
   cancel: () => {generation++;},
   speak: u => {
     const own = generation;
     calls.push({text:u.text, lang:u.lang, local:u.voice.localService});
     setTimeout(() => {
       if (generation !== own) return;
       u.onstart?.();
       u.onboundary?.({charIndex:0, charLength:1});
       u.onend?.();
     }, 0);
   },
 }});
})();"""

def baseline(route):
    path = urlparse(route.request.url).path.lstrip('/') or 'index.html'
    if path.endswith('/'):
        path += 'index.html'
    v = subprocess.run(['git', 'show', f'{OLD}:{path}'], capture_output=True, check=False)
    if v.returncode:
        route.fulfill(status=404, body='')
        return
    content_type = mimetypes.guess_type(path)[0] or 'application/octet-stream'
    route.fulfill(body=v.stdout, content_type=content_type)

def reading(page):
    page.wait_for_function("document.querySelector('[data-home-hub] [data-action=reading]') || window.__AMC8_ReadingRuntime")
    entry = page.locator('[data-home-hub] [data-action=reading]')
    if entry.is_visible():
        entry.click()
    page.wait_for_function("window.__AMC8_ReadingRuntime?.engine()?.status().status === 'ready'")

def storage(page):
    return page.evaluate("() => Object.fromEntries(Object.entries(localStorage))")

def kept(previous, current):
    assert all(event in current['events'] for event in previous['events']), 'historical events lost'
    assert current['session']['id'] == previous['session']['id'], 'old session identity changed'
    assert current['session']['drafts'] == previous['session']['drafts'], 'old drafts changed'
    assert sum(e['type'] == 'content_upgrade' for e in previous['events']) == sum(
        e['type'] == 'content_upgrade' for e in current['events']), 'art release re-upgraded storage'

receipts = []
with sync_playwright() as p:
    for name in ('chromium', 'webkit'):
        browser = getattr(p, name).launch()
        old = browser.new_page(viewport={'width':390,'height':844})
        old.route(BASE+'**', baseline)
        assert old.goto(BASE, wait_until='domcontentloaded').ok
        reading(old)
        old.evaluate("""() => {
          const e = window.__AMC8_ReadingRuntime.engine();
          e.startDay(13);
          for (let i=0; i<10 && e.current(); i++) {
            e.markReadDone(); e.submit(e.current().question.answer); e.next();
          }
          e.startDay(2); e.markReadDone(); e.select(0); e.submit(0); e.select(1);
        }""")
        previous = storage(old)
        original = json.loads(previous[KEY])
        assert original['session']['drafts'] and any(e['type']=='attempt' for e in original['events'])
        assert old.evaluate('window.__AMC8_ReadingRuntime.report().completedDays') == 1
        old.context.close()

        ctx = browser.new_context(viewport={'width':390,'height':844})
        previous['w1-unrelated-sentinel'] = 'unchanged'
        ctx.add_init_script(VOICE)
        ctx.add_init_script("""if (!sessionStorage.getItem('w1-seeded')) {
          const saved = """+json.dumps(previous)+""";
          for (const [key, value] of Object.entries(saved)) localStorage.setItem(key,value);
          sessionStorage.setItem('w1-seeded','1');
        }""")
        page = ctx.new_page()
        page.set_default_timeout(22000)
        errors = []
        page.on('pageerror', lambda error: errors.append(str(error)))
        result = page.goto(PUBLIC, wait_until='domcontentloaded')
        assert result and result.ok and result.url == PUBLIC
        assert hashlib.sha256(result.body()).hexdigest() == EXPECTED
        reading(page)
        kept(original, json.loads(storage(page)[KEY]))
        assert storage(page)['w1-unrelated-sentinel'] == 'unchanged'
        assert page.evaluate('window.__AMC8_ReadingRuntime.report().completedDays') == 1
        page.reload(wait_until='domcontentloaded')
        reading(page)
        kept(original, json.loads(storage(page)[KEY]))
        ctx.close()

        # Use a separate clean profile for new attempts, separate from the old-data fixture.
        ctx = browser.new_context(viewport={'width':390,'height':844})
        ctx.add_init_script(VOICE)
        page = ctx.new_page()
        page.set_default_timeout(22000)
        page.on('pageerror', lambda error: errors.append(str(error)))
        assert page.goto(PUBLIC, wait_until='domcontentloaded').ok
        reading(page)
        page.evaluate("window.__AMC8_ReadingRuntime.handle('rdStart',{day:'71'})")
        page.locator('[data-action=rdSpeakSentence]').click()
        page.wait_for_function("""() => window.__AMC8_ReadingRuntime.snapshot().events.some(
          e => e.type==='speech_status' && e.status==='ended' && e.originKind==='sentence')""")
        spoken = page.evaluate('window.__w1Utterances')
        panel = page.evaluate('window.__AMC8_ReadingRuntime.engine().current().material.panels[0].text')
        assert ''.join(x['text'] for x in spoken) == panel
        assert all(x['lang']=='zh-CN' and x['local'] for x in spoken)
        page.locator('[data-action=rdReadDone]').click()
        current = page.evaluate("""() => {
          const c = window.__AMC8_ReadingRuntime.engine().current();
          return {id:c.question.id, answer:c.question.answer};
        }""")
        page.locator(f".rd-question [data-action=rdPick][data-index='{current['answer']}']").click()
        page.locator('.rd-question [data-action=rdSubmit]').click()
        page.wait_for_function("""id => window.__AMC8_ReadingRuntime.snapshot().events.some(
          e => e.type==='attempt' && e.questionId===id && e.correct===true)""", arg=current['id'])
        saved = json.loads(storage(page)[KEY])
        attempt = next(e for e in saved['events'] if e['type']=='attempt' and e['questionId']==current['id'])
        assert attempt['correct'] is True
        page.reload(wait_until='domcontentloaded')
        reading(page)
        after = json.loads(storage(page)[KEY])
        assert attempt in after['events']
        assert not errors, errors
        receipts.append({
            'browser':name,'productionSha':RELEASE,'https':PUBLIC,'oldFixtureSha':OLD,
            'previousEventsPreserved':len(original['events']),'completedDaysPreserved':1,
            'oldDraftAndReload':'PASS','speechTextLanguageAndEnded':'PASS',
            'speechOutput':'synthetic local Mandarin voice','correctAnswerAndReload':'PASS',
        })
        ctx.close()
        browser.close()
(OUT/'supplemental-public.json').write_text(json.dumps(receipts,indent=2)+'\n')
print(json.dumps(receipts))
