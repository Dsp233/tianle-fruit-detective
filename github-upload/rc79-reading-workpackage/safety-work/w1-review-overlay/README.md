# AMC8 W1 — in-page review overlay (preview only)

Purpose: **add review mode to the existing W1 preview homepage**, not a new `/review.html` page, separate entry, phone-frame wrapper, or production feature.

Frozen learning-source baseline: `c8575da9d28c40b5bf79412928a0be8c397e7094` (successful integrated CI `42425597193`, full artifact `13595790278`). The QA overlay does **not** change course data, math/reading logic, historical user records or FIX15 production. The static preview homepage `index.html` adds one script reference to `./review-overlay.js`. The original index bytes are otherwise retained; all other original runtime files are byte-identical. The packager retains /source/ and adds a QA version receipt page for the pre-existing footer link when the frozen preview has no version index. The QA package is **not** the original frozen RC ZIP and must not be promoted to production as-is.

## Existing preview site deployment

1. Validate the overlay against the target frozen W1 version in browser tests, then approve it for the **existing** device-preview origin `https://amc8-w1-device-preview.surprisingsheep.chatgpt.site/`. Do not create another website or route.
2. Retrieve the frozen GitHub Actions artifact `13595790278`. Run `python3 package_review_preview.py /path/to/full-rc.zip /path/to/preview-overlay.zip`. This builds a static preview root with the original assets + the unchanged original-learning app code + a minimal `index.html` script tag injection and these two QA files: `review-overlay.js` and `review-overlay.css`.
3. Replace **the existing preview deployment** with those exact static files using its authorized deployment workflow. Confirm `GET /` shows the regular W1 app with a fixed **评审模式** button at lower left. There is **no** `/review.html` entry. Do not upload to production Pages or create another preview origin.
4. Compare the deployed files to `review-preview-identity.json`, particularly the runtime files that must remain unchanged. Note the intentionally modified `index.html` hash separately. Validate preview interactions in a real browser with synthetic records. Physical iPad Safari is part of final project UAT.
5. **Do not gate production on G4-E physical-device PASS**: under AMC8 Master Delivery R2.0 / W1 R1.2, physical iPad, real listening, and child/parent trials are deferred to final UAT. When W1-R1/R2/R3 engineering checks and the separately authorized G5 conditions pass, promote the **original frozen RC runtime files**, **without** this QA overlay, to production. The notes live under a namespaced, preview-origin localStorage key; they are not learning records.

## User interaction

- Click lower-left **评审模式**. A red banner appears; pointer/tap selects actual page elements, without activating learning-app buttons.
- Choose category `交互 / 视觉 / 内容 / 遗漏 / Bug`, write feedback, optionally enter author. Red numbered pins retain notes across page navigation and refresh in the same browser. Pins are clickable to edit while reviewing; pins do not block application controls outside review mode.
- **评审清单** lists notes; edit, mark processed, reopen, delete, or hide pins for screenshots.
- Edit the review list title, version/date and optional custom Markdown filename. Filter notes by status and use 重新定位 to attach an existing note to a new target. Copy Markdown or download `.md` containing IDs, status, category, URL, CSS selector, card, feedback and reporter. Export before clearing browser site data or switching browser/device.

## Evidence and caveats

- `python3 test_overlay.py` and `python3 test_extra.py` passed in local Chromium with mobile-touch simulation, including normal vs intercepted app clicks, add/edit notes, processed status, hidden pins, persistence, export metadata and table content. The full W1 deployed site and actual Safari/iPad have **not** been revalidated with QA overlay.
- Browser environment prevented HTTP/file-based navigation to the local full W1 app; the browser tests used a controlled DOM fixture. Do not claim full site E2E pass from these tests. Independent local `node --check` and ZIP manifests are verified.
- Do not add this feature to the baseline `READY.json` release gates or reopen the G1–G3 frozen application; it is a separate preview QA-only delivery.

## Integration into the existing W1 delivery queue (2026-11-08)

This package is tracked as **W1-R2-QA**, optional early in-preview review-tool validation. Do not create a second workstream or release gate: the original W1-R1/R2/R3 → G5 remains authoritative. The original device-preview URL and original homepage are preferred if the authorized deployer can update them. If its credentials are unavailable, mark `BLOCKED_QA_PREVIEW` and continue normal W1-R2/R3; do not ask for passwords or claim a new site.

- The injected index SHA is **different** from the frozen RC and requires its own QA manifest; compare unchanged math/reading/storage runtime files against the original frozen RC manifest, and separately verify the overlay CSS/JS bytes. Updating the preview invalidates the old `index.html` hash assertion for the updated preview, not the historical G4 receipt.
- Existing tests in this directory are **controlled DOM fixtures**; before overwriting the existing preview, verify the selected static file set is a complete reference closure and run full W1 entry, math, reading, navigation, first-answer and persistence tests in a separate browser profile using synthetic data.
- QA review-only overlay may be omitted from production, leaving the original RC as the G5 candidate. This preview QA work must not be called a full Q0 implementation acceptance: editable review-list title and arbitrary filename editing should be checked against the master requirements, not inferred from the current editable version/date fields.
- **G4-E is deferred to the project-final UAT**, not a pre-release gate. No real-device pass is claimed by Chromium touch emulation; the preview QA tool's availability does not resolve independent Muse private-site HTTP 403.

Current integrated-browser and deployment results are recorded in [W1 release preparation and QA receipt](../w1-checkpoint/w1-release-preflight-20261108.md).
