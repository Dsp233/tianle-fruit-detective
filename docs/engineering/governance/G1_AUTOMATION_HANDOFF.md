# G1 production automation bootstrap — protected first installation

- Source evidence: Draft #81 `ec161f2931014ce87795692a40943edefd0b7f03` and earlier #70–#83.
- Protected current site: `05f73af21ddf35134bb7c5e598cd75845e82baf2`. This bootstrap is built directly on that main SHA, not on #81. No runtime, exam, W1, assets, or storage files are modified.
- Machine acceptance: 7 positive and refusal unit tests; exact Git SHA, test-merge parents, and current-site byte equivalence; read-only Jekyll build and Pages artifact preview. Read the actual new PR logs before calling PASS.
- Future automation: a trusted baseline script protects ordinary main PRs; configured production Pages Actions publishes frozen versions, checks a public SHA receipt, and attempts automatic emergency restore on post-deployment smoke failures.
- First install is intentionally fail-closed while main lacks trusted gate code. A separately authorized bootstrap requires the owner to verify the scoped diff and production Pages setting; never treat a PR-head-provided check as independent approval.
- Before any merge: switch Pages publishing source to Actions in a controlled window, set/review main rules, verify proper site continuity. The default `AMC8_G1_PAGES_ACTIONS_ENABLED` variable is absent or false.
- After bootstrap: enable server-required check and prove positive/negative merger behavior. **Only then** enable controlled Pages, verify public content, and sign the G0-X tasks using a separate protected queue PR.
- #81 source/module changes are **not** included in this bootstrap; they need dedicated production product validation if later integrated.
- NOT_RUN: bootstrap main merge, Pages source switch, production ruleset, production Pages delivery, production rollback.
