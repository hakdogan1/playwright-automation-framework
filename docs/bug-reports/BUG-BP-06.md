# [BUG-BP-06] Cart quantity can go to zero and negative

> Issue-ready report (matches `.github/ISSUE_TEMPLATE/bug.yml`). **Not filed automatically.**
> Seeded defect #6 of the QA Practice Bug Playground (`cart-negative-quantity`).

| Field | Value |
|---|---|
| Bug ID | BUG-BP-06 |
| Test case | TC-BUG-006 |
| Area | Cart · Quantity |
| Severity | **Critical** |
| Priority | _needs-triage (human decision)_ |
| Determinism | Deterministic |
| Production-safe test | Yes — client-side only, production guard active, no writes |

## Description
Cart quantity can go to zero and negative.

## Preconditions
- Signed in (demo session); cart empty.
- Bug Playground requires sign-in; reproduced with the app's offline demo session (no credentials).

## Steps to reproduce
1. Open /bug-playground/.
2. Add Latency Meter Mk II.
3. Press "Decrease quantity" twice.

## Expected result
- Quantity never goes below 1, or the line is removed.

## Actual result
- The line stays with quantity -1; Total USD shows 0.

## Severity rationale
Critical (severity from the application's own defect registry). Invalid order state; totals and checkout disagree with the visible cart.

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
- Reproduction: `apps/qa-practice/tests/bug-playground/cart.bugs.spec.ts` — `reproduce(tc('TC-BUG-006'), bug('BUG-BP-06'))`
- Expected behaviour: same file — `test.fail(… expected(tc('TC-BUG-006'), bug('BUG-BP-06')))`
- Run: `npx playwright test --project=qa-practice-chromium --grep "BUG-BP-06"`
