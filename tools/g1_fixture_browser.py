"""Targeted browser regressions on the output of the public W1 fixture build."""

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


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--evidence", type=Path, required=True)
    parser.add_argument("--local-chromium", type=Path,
                        help="Run Chromium only with a locally provisioned binary")
    args = parser.parse_args()
    args.evidence.mkdir(parents=True, exist_ok=True)
    os.environ["CR0_OUT"] = str(args.evidence.resolve() / "q0")
    cr1 = runpy.run_path(str(site.ROOT / "code-review/CR1/reproduce.py"))
    cr4 = runpy.run_path(str(site.ROOT / "code-review/CR4/test.py"))
    checks = reading_checks()
    results = []
    with tempfile.TemporaryDirectory(prefix="g1-browser-fixture-") as temp:
        root = Path(temp)
        packed, release = root / "packed", root / "release"
        release_fixture(packed)
        files = site.assemble_release(packed, release)
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
                    results.append({"engine": name, "case": "layout-css-rejection-art-pinyin-voice-"
                                  "first-answer-13-legacy-diagnostics-math-qa-history", "result": "PASS"})
                finally:
                    browser.close()
    assert all(row["contract"] == "PASS" for row in cr1["ROWS"])
    report = {"scope": "public-packed-fixture-only", "runtimeFiles": len(files),
              "cases": results + cr1["ROWS"] + cr4["rows"]}
    (args.evidence / "fixture-browser.json").write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n")
    print(json.dumps({"scope": report["scope"], "caseCount": len(report["cases"])}))


if __name__ == "__main__":
    main()
