# [BUG-BP-11] Compare clears instead of comparing

> Issue-ready report (matches `.github/ISSUE_TEMPLATE/bug.yml`). **Not filed automatically.**
> Seeded defect #11 of the QA Practice Bug Playground (`compare-button-noop`).

| Field | Value |
|---|---|
| Bug ID | BUG-BP-11 |
| Test case | TC-BUG-011 |
| Area | Catalog · Compare |
| Severity | **Minor** |
| Priority | _needs-triage (human decision)_ |
| Determinism | Deterministic (toast timing controlled with page.clock) |
| Production-safe test | Yes — client-side only, production guard active, no writes |

## Description
Compare clears instead of comparing.

## Preconditions
- Signed in (demo session).
- Bug Playground requires sign-in; reproduced with the app's offline demo session (no credentials).

## Steps to reproduce
1. Open /bug-playground/.
2. Press "Compare" for Latency Meter Mk II.

## Expected result
- The product appears in a comparison (list, page or clear disabled state).

## Actual result
- Toast "Compare list cleared"; no comparison exists anywhere.

## Severity rationale
Minor (severity from the application's own defect registry). Feature does not work and the message contradicts the action; no data loss.

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
- Reproduction: `apps/qa-practice/tests/bug-playground/feedback.bugs.spec.ts` — `reproduce(tc('TC-BUG-011'), bug('BUG-BP-11'))`
- Expected behaviour: same file — `test.fail(… expected(tc('TC-BUG-011'), bug('BUG-BP-11')))`
- Run: `npx playwright test --project=qa-practice-chromium --grep "BUG-BP-11"`
