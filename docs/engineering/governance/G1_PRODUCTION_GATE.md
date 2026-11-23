# G1 first main bootstrap — production safety gate

Current public main is `05f73af21ddf35134bb7c5e598cd75845e82baf2`. The source candidate #81 at `ec161f2931014ce87795692a40943edefd0b7f03` contains additional math, reading and build changes compared with current main and **must not be merged directly**. The initial bootstrap PR carries only the 8 infrastructure paths listed below; runtime/site files remain unchanged.

The first installation intentionally leaves `AMC8 verified production identity` red, because `main` does not yet hold the trusted validator. This is a **fail-closed** condition, not a test success. The project owner must separately approve this one-time setup after checking file allowlist and Pages publishing mode. Do not bypass an active required check.

Once the trusted validator is installed, it reads the validator from the PR's *base* tree rather than candidate HEAD. All future ordinary main PRs must keep the frozen public product tree identical to `05f73af21ddf35134bb7c5e598cd75845e82baf2` except designated policy files, which themselves require a separately approved policy update. Install a branch protection / ruleset requiring `AMC8 verified production identity`, PR updates, no direct push, and required review of sensitive policy paths. Verify one valid and one invalid PR against the **actual GitHub merge button**, not only GitHub Actions.

The controlled Pages Actions workflow is **disabled** until Pages Source is changed from `main / root` to `GitHub Actions`, branch protections are verified, and variable `AMC8_G1_PAGES_ACTIONS_ENABLED=true` is set. The existing site must be observed throughout the cutover, with the old public tree preserved for rollback. Jekyll packaging is validated in a read-only PR job; no production upload occurs in this bootstrap PR.

Inherited G1 engineering #70–#83 evidence is not a substitute for a production release of the additional #81 product changes, nor for a real rollback. Those remain NOT_RUN and require a separate validated product-release PR.

## Exact allowlist for this first bootstrap

- .github/workflows/amc8-production-gate.yml
- .github/workflows/amc8-controlled-pages.yml
- .github/workflows/g1-automated-acceptance.yml
- code-review/G1/production_gate.py
- code-review/G1/auto_release.py
- code-review/G1/test_auto_release.py
- docs/engineering/governance/G1_PRODUCTION_GATE.md
- docs/engineering/governance/G1_AUTOMATION_HANDOFF.md

**Never force-update main or install an unsigned, self-approved ruleset.** This bootstrap remains Draft until Pages/admin steps are resolved.
