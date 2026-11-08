# AMC8 W1 — in-page review overlay (preview only)

Purpose: **add review mode to the existing W1 preview homepage**, not a new `/review.html` page, separate entry, phone-frame wrapper, or production feature.

Frozen learning-source baseline: `c8575da9d28c40b5bf79412928a0be8c397e7094` (successful integrated CI `42425597193`, full artifact `13595790278`). The QA overlay does **not** change course data, math/reading logic, historical user records or FIX15 production. The static preview homepage `index.html` adds one script reference to `./review-overlay.js`. The original index bytes are otherwise retained; all other original runtime files are byte-identical. The QA package is **not** the original frozen RC ZIP and must not be promoted to production as-is.

## Existing preview site deployment

1. Validate the overlay against the target frozen W1 version in browser tests, then approve it for the **existing** device-preview origin `https://amc8-w1-device-preview.surprisingsheep.chatgpt.site/`. Do not create another website or route.
2. Retrieve the frozen GitHub Actions artifact `13595790278`. Run `python3 package_review_preview.py /path/to/full-rc.zip /path/to/preview-overlay.zip`. This builds a static preview root with the original assets + the unchanged original-learning app code + a minimal `index.html` script tag injection and these two QA files: `review-overlay.js` and `review-overlay.css`.
3. Replace **the existing preview deployment** with those exact static files using its authorized deployment workflow. Confirm `GET /` shows the regular W1 app with a fixed **评审模式** button at lower left. There is **no** `/review.html` entry. Do not upload to production Pages or create another preview origin.
4. Compare the deployed files to `review-preview-identity.json`, particularly the runtime files that must remain unchanged. Note the intentionally modified `index.html` hash separately. Validate preview-only interactions in desktop/mobile and actual iPad Safari; do not infer native iPad pass from emulated Chromium tests.
5. When G4-E passes, promote the **original frozen RC files**, without QA overlay, to production. The annotation records live in a namespaced preview-only localStorage key; they are not learning records.

## User interaction

- Click lower-left **评审模式**. A red banner appears; pointer/tap selects actual page elements, without activating learning-app buttons.
- Choose category `交互 / 视觉 / 内容 / 遗漏 / Bug`, write feedback, optionally enter author. Red numbered pins retain notes across page navigation and refresh in the same browser. Pins are clickable to edit while reviewing; pins do not block application controls outside review mode.
- **评审清单** lists notes; edit, mark processed, reopen, delete, or hide pins for screenshots.
- Edit review version/date (both used in generated file name); copy Markdown or download `.md` containing IDs, status, category, URL, CSS selector, card, feedback and reporter. Export before clearing browser site data or switching browser/device.

## Evidence and caveats

- `python3 test_overlay.py` and `python3 test_extra.py` passed in local Chromium with mobile-touch simulation, including normal vs intercepted app clicks, add/edit notes, processed status, hidden pins, persistence, export metadata and table content. The full W1 deployed site and actual Safari/iPad have **not** been revalidated with QA overlay.
- Browser environment prevented HTTP/file-based navigation to the local full W1 app; the browser tests used a controlled DOM fixture. Do not claim full site E2E pass from these tests. Independent local `node --check` and ZIP manifests are verified.
- Do not add this feature to the baseline `READY.json` release gates or reopen the G1–G3 frozen application; it is a separate preview QA-only delivery.
