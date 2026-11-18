"""Targeted browser regressions on canonical output or its identical public runtime."""

import argparse
import ast
import json
import os
from pathlib import Path
import re
import runpy
import shutil
import tempfile

from playwright.sync_api import sync_playwright

import build_site as site
from test_g1_site_release import git_blob, release_fixture


def reading_checks():
    source = site.ROOT / "reading-quality/browser.py"
    functions = {"boot", "saved", "check_first_passage_width", "joint_learning_flow"}
    tree = ast.parse(source.read_text())
    nodes = [node for node in tree.body if isinstance(node, ast.FunctionDef) and node.name in functions]
    assert {node.name for node in nodes} == functions
    scope = {"json": json, "KEY": "tianle_amc8_question_design_v1_reading_r1"}
    exec(compile(ast.Module(body=nodes, type_ignores=[]), str(source), "exec"), scope)
    return scope


def layouts(browser, name, url, release, checks):
    css = re.search(r'href="./(assets/reading-quality/[0-9a-f]{64}\.css)"',
                    (release / "index.html").read_text())[1]
    for damaged in (False, True):
        context = browser.new_context(viewport={"width": 390, "height": 844})
        try:
            page = context.new_page()
            if damaged:
                body = (release / css).read_text() + "\n.rd-story-text{width:2000px!important}\n"
                page.route("**/" + css, lambda route: route.fulfill(
                    status=200, content_type="text/css", body=body))
            page.goto(url)
            page.locator("[data-home-hub] [data-action=reading]").click()
            page.locator(".rd-today [data-action=rdStart]").wait_for()
            try:
                checks["check_first_passage_width"](page, name)
            except AssertionError as error:
                assert damaged and "Reading passage extends outside viewport" in str(error), error
            else:
                assert not damaged, "Damaged CSS passed the production layout assertion"
                page.locator(".rd-story-art img").first.scroll_into_view_if_needed()
                page.wait_for_function("document.querySelector('.rd-story-art img').naturalWidth > 0")
                assert page.locator(".rd-pinyin").count() > 0
        finally:
            context.close()


def historical_reading(browser, baseline, candidate, checks, name):
    boot, saved, key = (checks[k] for k in ("boot", "saved", "KEY"))
    context, old = boot(browser, baseline)
    try:
        old.evaluate("""() => {
            const e = window.__AMC8_ReadingRuntime.engine();
            e.startDay(13);
            for (let n=0;n<10 && e.current();n++) {
                e.markReadDone(); e.submit(e.current().question.answer); e.next();
            }
            e.startDay(12); e.markReadDone(); e.select(0); e.submit(0); e.select(1);
        }""")
        seed = saved(old)
        original = json.loads(seed[key])
        assert original["session"] and any(e["type"] == "attempt" for e in original["events"])
    finally:
        context.close()
    seed["g1-unrelated"] = "keep"
    context, page = boot(browser, candidate, seed)
    try:
        upgraded = saved(page)
        state = json.loads(upgraded[key])
        assert all(event in state["events"] for event in original["events"])
        assert any(k.startswith(key + "_backup_before_content_") and v == seed[key]
                   for k, v in upgraded.items())
        assert upgraded["g1-unrelated"] == "keep"
        assert state["session"] is None
        assert any(original["session"] in row.get("sessions", []) for row in state["legacy"])
        result = page.evaluate("""([key,raw])=>{
            window.__AMC8_STORAGE_TEST=true;
            const e=ReadingEngine.create(window.__AMC8_READING_DATA, {
                getItem(k){return k===key?raw:null}, setItem(){throw Error('QuotaExceededError')}
            },key);
            return {status:e.status().status,persist:e.persist()};
        }""", [key, seed[key]])
        assert result == {"status": "read_only", "persist": False}, result
        page.reload()
        page.wait_for_function("window.__AMC8_ReadingRuntime")
        reloaded = saved(page)
        again = json.loads(reloaded[key])
        assert all(event in again["events"] for event in original["events"])
    finally:
        context.close()
    context, page = boot(browser, baseline, reloaded)
    try:
        rolled = saved(page)
        assert all(event in json.loads(rolled[key])["events"] for event in state["events"])
    finally:
        context.close()
    return {"engine": name, "case": "reading-upgrade-draft-quota-refresh-rollback", "result": "PASS"}


def diagnostics_and_math_history(browser, url, checks):
    context, page = checks["boot"](browser, url)
    try:
        summary = page.evaluate("""() => {
            const data = window.__AMC8_READING_DATA;
            const active = data.courseScope.activeCourseId;
            const sets = data.diagnostics.sets;
            return {active, legacy:sets.filter(s=>s.courseId!==active).length, total:sets.length};
        }""")
        assert summary == {"active": "R2-84D-20261031", "legacy": 13, "total": 13}, summary
    finally:
        context.close()
    context = browser.new_context()
    try:
        page = context.new_page()
        response = page.goto(url + "qa/history/")
        assert response and response.ok
        page.get_by_role("heading", name="RC64 合成旧记录 · 公网兼容 QA").wait_for()
        page.locator("[data-home-hub] [data-action=home]").click()
        page.wait_for_function("window.__AMC8_MATH_NAV && !document.querySelector('[data-loading-channel]')")
        stored = page.evaluate("Object.fromEntries(Object.entries(localStorage))")
        assert any("RC64 合成旧记录：第二题草稿保留" in value for value in stored.values()), stored.keys()
        assert not stored.get("tianle_amc8_question_design_v1"), stored.keys()
        page.reload()
        assert any("RC64 合成旧记录：首题先错后对" in value
                   for value in page.evaluate("Object.values(localStorage)"))
    finally:
        context.close()



def exercise_pending_draft(browser, url, checks):
    context, page = checks["boot"](browser, url)
    try:
        engine = "window.__AMC8_ReadingRuntime.engine()"
        page.evaluate(f"() => {{ const e = {engine}; e.startDay(1); e.markReadDone(); }}")
        checks["saved"](page)
        page.evaluate("""async () => {
            const key = window.__AMC8_ReadingRuntime.engine().key;
            const db = await new Promise((resolve, reject) => {
                const request = indexedDB.open('amc8-writer-locks-v1', 1);
                request.onsuccess = () => resolve(request.result);
                request.onerror = () => reject(request.error);
            });
            window.g1Hold = true;
            await new Promise((resolve, reject) => {
                const tx = db.transaction('locks', 'readwrite');
                tx.oncomplete = () => db.close();
                tx.onerror = () => reject(tx.error);
                const store = tx.objectStore('locks');
                const hold = () => {
                    const req = store.get(key);
                    req.onsuccess = () => { resolve(); if (window.g1Hold) hold(); };
                    req.onerror = () => reject(req.error);
                };
                hold();
            });
        }""")
        pending = page.evaluate("""() => {
            const e = window.__AMC8_ReadingRuntime.engine();
            const raw = localStorage.getItem(e.key);
            e.select(1);
            return {status:e.status().status, savedUnchanged:raw===localStorage.getItem(e.key),
                    drafts:e.snapshot().session.drafts};
        }""")
        assert pending["status"] == "acquiring" and pending["savedUnchanged"] and pending["drafts"], pending
        page.evaluate("window.g1Hold = false")
        stored = checks["saved"](page)
        assert json.loads(stored[checks["KEY"]])["session"]["drafts"] == pending["drafts"]
        page.reload()
        page.wait_for_function("window.__AMC8_ReadingRuntime?.engine()?.status().status === 'ready'")
        assert page.evaluate(f"{engine}.snapshot().session.drafts") == pending["drafts"]
    finally:
        context.close()


def exercise_transactions(browser, url):
    store_source = (site.ROOT / "canonical/w1/source/progress_store.js").read_text()
    context = browser.new_context()
    try:
        context.route("**/g1-synthetic-store", lambda route: route.fulfill(
            status=200, content_type="text/html", body="<!doctype html><title>G1 synthetic storage</title>"))
        pages = [context.new_page(), context.new_page()]
        for page in pages:
            page.goto(url + "g1-synthetic-store")
            page.add_script_tag(content=store_source)
            page.evaluate("""() => {
                Object.defineProperty(navigator, 'locks', {value:undefined, configurable:true});
                window.g1Store = ProgressStore.open('g1-concurrent', {transactional:true});
            }""")
            page.wait_for_function("g1Store.getStatus() === 'ready'")
        # Both tabs hold the same initial snapshot. The serialized write in
        # IndexedDB decides which commits. The loser must retain its draft.
        for i, page in enumerate(pages):
            page.evaluate("""i => {
                window.g1Race = new BroadcastChannel('g1-race');
                g1Race.onmessage = () => { window.g1RaceStarted = true; g1Store.commit({answer:i}, null); };
            }""", i)
        pages[0].evaluate("window.g1RaceTrigger = new BroadcastChannel('g1-race'); g1RaceTrigger.postMessage('start')")
        rows = []
        for page in pages:
            page.wait_for_function("""window.g1RaceStarted && ['ready','conflict'].includes(g1Store.getStatus()) &&
                (g1Store.getStatus() === 'conflict' || g1Store.exportSnapshot().pending === null)""")
            rows.append(page.evaluate("({status:g1Store.getStatus(), ...g1Store.exportSnapshot()})"))
        assert sorted(row["status"] for row in rows) == ["conflict", "ready"], rows
        winner = next(row for row in rows if row["status"] == "ready")
        loser = next(row for row in rows if row["status"] == "conflict")
        disk = pages[0].evaluate("localStorage.getItem('g1-concurrent')")
        assert disk == winner["stored"] and json.loads(loser["pending"]) != json.loads(disk), rows

        page = pages[0]
        page.evaluate("""() => {
            window.g1Quota = true;
            const storage = {getItem:k=>localStorage.getItem(k),setItem(k,v){
                if (k==='g1-quota' && g1Quota) throw new DOMException('injected quota','QuotaExceededError');
                localStorage.setItem(k,v);
            }};
            window.g1FailingStore = ProgressStore.open('g1-quota',{storage,transactional:true});
        }""")
        page.wait_for_function("g1FailingStore.getStatus() === 'ready'")
        page.evaluate("g1FailingStore.commit({draft:'g1-retry'},null)")
        page.wait_for_function("g1FailingStore.getStatus() === 'unsaved'")
        assert page.evaluate("localStorage.getItem('g1-quota')") is None
        assert json.loads(page.evaluate("g1FailingStore.exportSnapshot().pending")) == {"draft": "g1-retry"}
        page.evaluate("g1Quota=false; g1FailingStore.retry()")
        page.wait_for_function("g1FailingStore.getStatus() === 'ready' && g1FailingStore.exportSnapshot().pending === null")
        page.reload()
        assert json.loads(page.evaluate("localStorage.getItem('g1-quota')")) == {"draft": "g1-retry"}

        page.add_script_tag(content=store_source)
        page.evaluate("""async () => {
            const key = 'g1-legacy-claim';
            localStorage.setItem(key, '{"answer":"before"}');
            await new Promise((resolve, reject) => {
                const request = indexedDB.open('amc8-writer-locks-v1', 1);
                request.onerror = reject;
                request.onsuccess = () => {
                    const db = request.result;
                    const tx = db.transaction('locks', 'readwrite');
                    tx.objectStore('locks').put({owner:'legacy-writer'}, key);
                    tx.oncomplete = () => { db.close(); resolve(); };
                    tx.onabort = () => { db.close(); reject(tx.error); };
                };
            });
            window.g1Legacy = ProgressStore.open(key);
        }""")
        page.wait_for_function("g1Legacy.getStatus() === 'read_only'")
        page.evaluate("""() => g1Legacy.commit({answer:'after'}, g1Legacy.exportSnapshot().stored)""")
        assert json.loads(page.evaluate("localStorage.getItem('g1-legacy-claim')")) == {"answer": "before"}
        assert json.loads(page.evaluate("g1Legacy.exportSnapshot().pending")) == {"answer": "after"}
        page.evaluate("localStorage.setItem('g1-legacy-claim_writer_released','legacy-writer'); g1Legacy.retry()")
        page.wait_for_function("g1Legacy.getStatus() === 'ready' && g1Legacy.exportSnapshot().pending === null")
        assert json.loads(page.evaluate("localStorage.getItem('g1-legacy-claim')")) == {"answer": "after"}
    finally:
        context.close()

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--evidence", type=Path, required=True)
    parser.add_argument("--local-chromium", type=Path,
                        help="Run Chromium only with a locally provisioned binary")
    inputs = parser.add_mutually_exclusive_group(required=True)
    inputs.add_argument("--dist", type=Path, help="Test an actual canonical build output")
    inputs.add_argument("--git-runtime", action="store_true",
                        help="Test the identical public Git runtime on hosted runners")
    inputs.add_argument("--packed-fixture", action="store_true", help="Historical fixture reproduction")
    args = parser.parse_args()
    args.evidence.mkdir(parents=True, exist_ok=True)
    os.environ["CR0_OUT"] = str(args.evidence.resolve() / "q0")
    cr1 = runpy.run_path(str(site.ROOT / "code-review/CR1/reproduce.py"))
    cr4 = runpy.run_path(str(site.ROOT / "code-review/CR4/test.py"))
    checks = reading_checks()
    results = []
    with tempfile.TemporaryDirectory(prefix="g1-browser-fixture-") as temp:
        root = Path(temp)
        release = root / "release"
        if args.dist:
            release = args.dist.resolve(strict=True)
            files = site.verify_dist(release)
            scope = "canonical-dist"
        elif args.git_runtime:
            files = {path: digest for path, (_, digest) in site.runtime_contract(include_runtime=False).items()}
            for path, digest in files.items():
                site.put(release, path, site.body_at(site.ROOT, path, digest))
            site.install_runtime(release)
            files = site.verify_dist(release)
            scope = "public-git-runtime-with-shared-bootstrap-and-storage"
        else:
            packed = root / "packed"
            release_fixture(packed)
            files = site.assemble_release(packed, release)
            scope = "public-packed-fixture-only"
        # The adjacent approved W1 language-stage entry is the rollback basis.
        # Reuse the retained public assets but provide only the three previous
        # entry HTML bytes; never send these old entries through the build CLI.
        rollback = root / "rollback"
        shutil.copytree(release, rollback)
        for name in ("index.html", "amc8/index.html", "source/index.html"):
            site.put(rollback, name, git_blob("2c997d120b93622929ff241a2adbad8e35de7e84", name))
        with cr1["serve"](release) as url, cr1["serve"](rollback) as old, sync_playwright() as p:
            engines = ("chromium",) if args.local_chromium else ("chromium", "webkit")
            for name in engines:
                options = {"executable_path": str(args.local_chromium)} if args.local_chromium else {}
                browser = getattr(p, name).launch(**options)
                try:
                    cr1["review_cases"](browser, name, url, candidate=True)
                    cr1["extra_cases"](browser, name, url)
                    cr4["check"](browser, name, release, url, candidate=True)
                    layouts(browser, name, url, release, checks)
                    checks["joint_learning_flow"](browser, url)
                    diagnostics_and_math_history(browser, url, checks)
                    results.append(historical_reading(browser, old, url, checks, name))
                    exercise_pending_draft(browser, url, checks)
                    results.append({"engine": name, "case": "held-reading-save-draft-refresh", "result": "PASS"})
                    exercise_transactions(browser, url)
                    results.append({"engine": name, "case": "two-tab-writes-conflict-quota-and-legacy-claim", "result": "PASS"})
                    results.append({"engine": name, "case": "layout-css-rejection-art-pinyin-voice-"
                                  "first-answer-13-legacy-diagnostics-math-qa-history", "result": "PASS"})
                finally:
                    browser.close()
    assert all(row["contract"] == "PASS" for row in cr1["ROWS"])
    report = {"scope": scope, "runtimeFiles": len(files),
              "cases": results + cr1["ROWS"] + cr4["rows"]}
    (args.evidence / "fixture-browser.json").write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n")
    print(json.dumps({"scope": report["scope"], "caseCount": len(report["cases"])}))


if __name__ == "__main__":
    main()
