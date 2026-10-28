# RC79 FIX7: parent-reading diagnostic eligibility

The D condition instructs a parent to read only the original passage. FIX6 could count system speech alone as valid D evidence and could accept parent-plus-system speech. FIX7 requires recorded parent reading and excludes system speech requests and pinyin exposure from D comparisons.

Current reports also exclude previously recorded D attempts with those incompatible aid flags. Their stored answers, original validity fields, first-answer totals and assistance events remain unchanged. The parent diagnostic panel explains the rule. No content, question answers, math grading or storage key changes are included.

Builds restore the frozen HOME1 artifact, validate and apply the published FIX6 overlay, then validate the five-file FIX7 delta. The established packaging and math-compatibility checks are reused. Candidate identity and reading engine revision advance to FIX7 / 4; content, storage and math evidence versions stay the same.

Verification includes delivered-data engine checks, built-page UI event checks, Chromium and WebKit diagnostic entry/submission/reload checks, and focused reading, math, record and loading regressions. Browser speech-start events are simulated; these checks do not validate physical audio, an iPad, learning outcomes or educational equivalence.

The old synthetic `reading_engine_test.js` suite has four identical failures on FIX6 and FIX7 (41/45 on both). `compare_engine_baseline.py` records both complete reports and fails on any change to that failure set. These inherited fixture failures are visible in receipts and remain open; the suite is not described as passing. C-condition original-passage playback attribution remains outside this D-only repair.

The FIX6 public workflow remains available manually; FIX7 becomes the automatically triggered current-release check. A successful candidate run stages only the tested entry bytes and evidence onto its own branch. Public checks verify exact deployed entry hashes and repeat the browser checks after merge.
