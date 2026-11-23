# [BUG-BP-07] Required display name accepts whitespace only

> Issue-ready report (matches `.github/ISSUE_TEMPLATE/bug.yml`). **Not filed automatically.**
> Seeded defect #7 of the QA Practice Bug Playground (`profile-name-whitespace-only`).

| Field | Value |
|---|---|
| Bug ID | BUG-BP-07 |
| Test case | TC-BUG-007 |
| Area | Profile · Display name |
| Severity | **Major** |
| Priority | _needs-triage (human decision)_ |
| Determinism | Deterministic |
| Production-safe test | Yes — client-side only, production guard active, no writes |

## Description
Required display name accepts whitespace only.

## Preconditions
- Signed in (demo session).
- Bug Playground requires sign-in; reproduced with the app's offline demo session (no credentials).

## Steps to reproduce
1. Open /bug-playground/.
2. Account menu → Edit profile.
3. Enter three spaces as Display name (required) and press Save.

## Expected result
- Save is rejected with a validation message; the dialog stays open.

## Actual result
- The dialog closes and "Profile saved" is shown. (An empty name is correctly rejected with "Display name required.")

## Severity rationale
Major (severity from the application's own defect registry). Required data can be blank; downstream screens show empty names.

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
- Reproduction: `apps/qa-practice/tests/bug-playground/account.bugs.spec.ts` — `reproduce(tc('TC-BUG-007'), bug('BUG-BP-07'))`
- Expected behaviour: same file — `test.fail(… expected(tc('TC-BUG-007'), bug('BUG-BP-07')))`
- Run: `npx playwright test --project=qa-practice-chromium --grep "BUG-BP-07"`
