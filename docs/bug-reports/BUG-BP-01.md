# [BUG-BP-01] Add to cart adds two units on a double-click

> Issue-ready report (matches `.github/ISSUE_TEMPLATE/bug.yml`). **Not filed automatically.**
> Seeded defect #1 of the QA Practice Bug Playground (`dup-add-cart`).

| Field | Value |
|---|---|
| Bug ID | BUG-BP-01 |
| Test case | TC-BUG-001 |
| Area | Cart · Add to cart |
| Severity | **Major** |
| Priority | _needs-triage (human decision)_ |
| Determinism | Deterministic |
| Production-safe test | Yes — client-side only, production guard active, no writes |

## Description
Add to cart adds two units on a double-click.

## Preconditions
- Signed in (demo session); cart empty.
- Bug Playground requires sign-in; reproduced with the app's offline demo session (no credentials).

## Steps to reproduce
1. Open /bug-playground/.
2. Double-click "Add to cart" for Latency Meter Mk II.

## Expected result
- One rapid double activation adds a single unit (quantity 1).

## Actual result
- Each click increments independently; cart quantity is 2.

## Severity rationale
Major (severity from the application's own defect registry). Silent over-ordering inflates totals and customer charges; common user gesture.

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
- Reproduction: `apps/qa-practice/tests/bug-playground/cart.bugs.spec.ts` — `reproduce(tc('TC-BUG-001'), bug('BUG-BP-01'))`
- Expected behaviour: same file — `test.fail(… expected(tc('TC-BUG-001'), bug('BUG-BP-01')))`
- Run: `npx playwright test --project=qa-practice-chromium --grep "BUG-BP-01"`
