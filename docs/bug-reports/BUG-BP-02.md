# [BUG-BP-02] Catalog search is case-sensitive

> Issue-ready report (matches `.github/ISSUE_TEMPLATE/bug.yml`). **Not filed automatically.**
> Seeded defect #2 of the QA Practice Bug Playground (`search-case-sensitive`).

| Field | Value |
|---|---|
| Bug ID | BUG-BP-02 |
| Test case | TC-BUG-002 |
| Area | Catalog · Search |
| Severity | **Minor** |
| Priority | _needs-triage (human decision)_ |
| Determinism | Deterministic |
| Production-safe test | Yes — client-side only, production guard active, no writes |

## Description
Catalog search is case-sensitive.

## Preconditions
- Signed in (demo session).
- Bug Playground requires sign-in; reproduced with the app's offline demo session (no credentials).

## Steps to reproduce
1. Open /bug-playground/.
2. Type "signal splitter" in Search catalog.

## Expected result
- Signal Splitter is listed (matching ignores letter case).

## Actual result
- No product is listed; "No rows match — try changing search case or filters." is shown. The exact-case query "Signal Splitter" works.

## Severity rationale
Minor (severity from the application's own defect registry). Users miss products but can retry with other casing; no data loss.

## Environment
| | |
|---|---|
| Application | https://qapractice.hakdogan.com/bug-playground/ |
| Build revision | `3d14d23` (`/release-info.json`) |
| Browsers verified | Chromium, Firefox, WebKit (Playwright 1.65.1; Chromium with `--disable-quic`) |
| Framework | playwright-quality-framework (uncommitted, local) |
| CI | not available (GitHub Actions billing) |

## Evidence
- Production run, Chromium: `evidence/runs/20261122T203512Z-be6b68/` (results.json, HTML report)
- Production run, Firefox + WebKit: `evidence/runs/20261122T203901Z-89f84e/`
- Isolated local run: `evidence/runs/20261122T203431Z-873667/`
- Reproduction tests pass, so no failure screenshot/trace is produced; run the reproduction test with `--trace on` to capture one.

## Automation
- Reproduction: `apps/qa-practice/tests/bug-playground/catalog.bugs.spec.ts` — `reproduce(tc('TC-BUG-002'), bug('BUG-BP-02'))`
- Expected behaviour: same file — `test.fail(… expected(tc('TC-BUG-002'), bug('BUG-BP-02')))`
- Run: `npx playwright test --project=qa-practice-chromium --grep "BUG-BP-02"`
