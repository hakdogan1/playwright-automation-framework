# [BUG-BP-09] Empty promo code reports "Promo code applied ✓"

> Issue-ready report (matches `.github/ISSUE_TEMPLATE/bug.yml`). **Not filed automatically.**
> Seeded defect #9 of the QA Practice Bug Playground (`promo-empty-still-applies`).

| Field | Value |
|---|---|
| Bug ID | BUG-BP-09 |
| Test case | TC-BUG-009 |
| Area | Checkout · Promo code |
| Severity | **Major** |
| Priority | _needs-triage (human decision)_ |
| Determinism | Deterministic (toast lasts 420 ms; tests freeze timers with page.clock) |
| Production-safe test | Yes — client-side only, production guard active, no writes |

## Description
Empty promo code reports "Promo code applied ✓".

## Preconditions
- Signed in (demo session); promo field empty.
- Bug Playground requires sign-in; reproduced with the app's offline demo session (no credentials).

## Steps to reproduce
1. Open /bug-playground/.
2. Press "Apply" next to Promo without entering a code.

## Expected result
- A validation message (or no action); no success message.

## Actual result
- Toast "Promo code applied ✓". (A non-empty unknown code is correctly rejected.)

## Severity rationale
Major (severity from the application's own defect registry). False success message about pricing; users expect a discount that never applies.

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
- Reproduction: `apps/qa-practice/tests/bug-playground/feedback.bugs.spec.ts` — `reproduce(tc('TC-BUG-009'), bug('BUG-BP-09'))`
- Expected behaviour: same file — `test.fail(… expected(tc('TC-BUG-009'), bug('BUG-BP-09')))`
- Run: `npx playwright test --project=qa-practice-chromium --grep "BUG-BP-09"`
