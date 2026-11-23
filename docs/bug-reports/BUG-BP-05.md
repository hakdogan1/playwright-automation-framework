# [BUG-BP-05] Product count does not update after a category change

> Issue-ready report (matches `.github/ISSUE_TEMPLATE/bug.yml`). **Not filed automatically.**
> Seeded defect #5 of the QA Practice Bug Playground (`category-count-stale`).

| Field | Value |
|---|---|
| Bug ID | BUG-BP-05 |
| Test case | TC-BUG-005 |
| Area | Catalog · Product count |
| Severity | **Minor** |
| Priority | _needs-triage (human decision)_ |
| Determinism | Deterministic |
| Production-safe test | Yes — client-side only, production guard active, no writes |

## Description
Product count does not update after a category change.

## Preconditions
- Signed in (demo session).
- Bug Playground requires sign-in; reproduced with the app's offline demo session (no credentials).

## Steps to reproduce
1. Open /bug-playground/.
2. Select category "Kits".

## Expected result
- "Showing 1 products" (one Kits product is visible).

## Actual result
- Only Latency Meter Mk II is listed but the count still shows 3.

## Severity rationale
Minor (severity from the application's own defect registry). Misleading counter; the visible list is correct.

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
- Reproduction: `apps/qa-practice/tests/bug-playground/catalog.bugs.spec.ts` — `reproduce(tc('TC-BUG-005'), bug('BUG-BP-05'))`
- Expected behaviour: same file — `test.fail(… expected(tc('TC-BUG-005'), bug('BUG-BP-05')))`
- Run: `npx playwright test --project=qa-practice-chromium --grep "BUG-BP-05"`
