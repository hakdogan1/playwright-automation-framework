# [BUG-BP-10] Newsletter consent is pre-checked

> Issue-ready report (matches `.github/ISSUE_TEMPLATE/bug.yml`). **Not filed automatically.**
> Seeded defect #10 of the QA Practice Bug Playground (`newsletter-prechecked-dark-pattern`).

| Field | Value |
|---|---|
| Bug ID | BUG-BP-10 |
| Test case | TC-BUG-010 |
| Area | Profile · Marketing consent |
| Severity | **Major** |
| Priority | _needs-triage (human decision)_ |
| Determinism | Deterministic |
| Production-safe test | Yes — client-side only, production guard active, no writes |

## Description
Newsletter consent is pre-checked.

## Preconditions
- Signed in (demo session).
- Bug Playground requires sign-in; reproduced with the app's offline demo session (no credentials).

## Steps to reproduce
1. Open /bug-playground/.
2. Account menu → Edit profile.

## Expected result
- "Send me QA tips & product updates" starts unchecked.

## Actual result
- The checkbox starts checked.

## Severity rationale
Major (severity from the application's own defect registry). Consent by default conflicts with GDPR opt-in requirements (legal risk).

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
- Reproduction: `apps/qa-practice/tests/bug-playground/account.bugs.spec.ts` — `reproduce(tc('TC-BUG-010'), bug('BUG-BP-10'))`
- Expected behaviour: same file — `test.fail(… expected(tc('TC-BUG-010'), bug('BUG-BP-10')))`
- Run: `npx playwright test --project=qa-practice-chromium --grep "BUG-BP-10"`
