# [BUG-BP-03] Cart total renders floating-point noise (19.990000000000002)

> Issue-ready report (matches `.github/ISSUE_TEMPLATE/bug.yml`). **Not filed automatically.**
> Seeded defect #3 of the QA Practice Bug Playground (`cart-total-float-precision`).

| Field | Value |
|---|---|
| Bug ID | BUG-BP-03 |
| Test case | TC-BUG-003 |
| Area | Cart · Total |
| Severity | **Major** |
| Priority | _needs-triage (human decision)_ |
| Determinism | Deterministic (IEEE-754 sum of 12.34 + 7.65) |
| Production-safe test | Yes — client-side only, production guard active, no writes |

## Description
Cart total renders floating-point noise (19.990000000000002).

## Preconditions
- Signed in (demo session); cart empty.
- Bug Playground requires sign-in; reproduced with the app's offline demo session (no credentials).

## Steps to reproduce
1. Open /bug-playground/.
2. Add Latency Meter Mk II (12.34).
3. Add Signal Splitter (7.65).

## Expected result
- Total USD reads 19.99 (two decimals).

## Actual result
- Total USD reads 19.990000000000002.

## Severity rationale
Major (severity from the application's own defect registry). Money shown incorrectly erodes trust and can propagate to payment amounts.

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
- Reproduction: `apps/qa-practice/tests/bug-playground/cart.bugs.spec.ts` — `reproduce(tc('TC-BUG-003'), bug('BUG-BP-03'))`
- Expected behaviour: same file — `test.fail(… expected(tc('TC-BUG-003'), bug('BUG-BP-03')))`
- Run: `npx playwright test --project=qa-practice-chromium --grep "BUG-BP-03"`
