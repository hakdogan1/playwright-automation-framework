# [BUG-BP-14] "Refresh prices" claims success without fetching data

> Issue-ready report (matches `.github/ISSUE_TEMPLATE/bug.yml`). **Not filed automatically.**
> Seeded defect #14 of the QA Practice Bug Playground (`refresh-catalog-fake-success`).

| Field | Value |
|---|---|
| Bug ID | BUG-BP-14 |
| Test case | TC-BUG-014 |
| Area | Catalog · Refresh prices |
| Severity | **Major** |
| Priority | _needs-triage (human decision)_ |
| Determinism | Deterministic |
| Production-safe test | Yes — client-side only, production guard active, no writes |

## Description
"Refresh prices" claims success without fetching data.

## Preconditions
- Signed in (demo session).
- Bug Playground requires sign-in; reproduced with the app's offline demo session (no credentials).

## Steps to reproduce
1. Open /bug-playground/.
2. Note the prices.
3. Press "Refresh prices".

## Expected result
- Current prices are requested from the server (a catalog request is made).

## Actual result
- Label changes to "Prices refreshed · just now"; prices identical; no catalog request to the application is made.

## Severity rationale
Major (severity from the application's own defect registry). Users act on stale prices believing they are current.

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
- Reproduction: `apps/qa-practice/tests/bug-playground/catalog.bugs.spec.ts` — `reproduce(tc('TC-BUG-014'), bug('BUG-BP-14'))`
- Expected behaviour: same file — `test.fail(… expected(tc('TC-BUG-014'), bug('BUG-BP-14')))`
- Run: `npx playwright test --project=qa-practice-chromium --grep "BUG-BP-14"`
