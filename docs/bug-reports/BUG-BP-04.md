# [BUG-BP-04] Logout in the storefront does not end the session

> Issue-ready report (matches `.github/ISSUE_TEMPLATE/bug.yml`). **Not filed automatically.**
> Seeded defect #4 of the QA Practice Bug Playground (`fake-logout-session`).

| Field | Value |
|---|---|
| Bug ID | BUG-BP-04 |
| Test case | TC-BUG-004 |
| Area | Account · Logout |
| Severity | **Critical** |
| Priority | _needs-triage (human decision)_ |
| Determinism | Deterministic |
| Production-safe test | Yes — client-side only, production guard active, no writes |

## Description
Logout in the storefront does not end the session.

## Preconditions
- Signed in (demo session).
- Bug Playground requires sign-in; reproduced with the app's offline demo session (no credentials).

## Steps to reproduce
1. Open /bug-playground/.
2. Open the account menu ("Account · Demo").
3. Press "Logout".

## Expected result
- The session ends: the lab offers "Sign in to lab" and the session flag is cleared.

## Actual result
- "Signed out locally" toast; the account still reads "Account · Demo" and the session flag `vl-lab-demo-session` is still "1".

## Severity rationale
Critical (severity from the application's own defect registry). A user who logs out stays authenticated; on shared devices this exposes the account.

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
- Reproduction: `apps/qa-practice/tests/bug-playground/account.bugs.spec.ts` — `reproduce(tc('TC-BUG-004'), bug('BUG-BP-04'))`
- Expected behaviour: same file — `test.fail(… expected(tc('TC-BUG-004'), bug('BUG-BP-04')))`
- Run: `npx playwright test --project=qa-practice-chromium --grep "BUG-BP-04"`

## Related observation (OBS-01, not one of the 15 seeded defects)
While a session exists, the app queries Supabase `rest/v1/bug_progress` for the synthetic demo user (`user_id=eq.demo-lab-trainee`) and, on each discovered bug, attempts an upsert. The production guard blocked these reads in every run, so no write was attempted. Worth a human review: a demo/offline session probably should not call the production backend at all.
