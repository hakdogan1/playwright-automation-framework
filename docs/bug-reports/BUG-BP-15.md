# [BUG-BP-15] Chat shows "online" while all agents are offline

> Issue-ready report (matches `.github/ISSUE_TEMPLATE/bug.yml`). **Not filed automatically.**
> Seeded defect #15 of the QA Practice Bug Playground (`chat-widget-shows-online-offline`).

| Field | Value |
|---|---|
| Bug ID | BUG-BP-15 |
| Test case | TC-BUG-015 |
| Area | Support · Live chat |
| Severity | **Minor** |
| Priority | _needs-triage (human decision)_ |
| Determinism | Deterministic (indicator is a decorative, aria-hidden dot; assertion uses its colour class) |
| Production-safe test | Yes — client-side only, production guard active, no writes |

## Description
Chat shows "online" while all agents are offline.

## Preconditions
- Signed in (demo session).
- Bug Playground requires sign-in; reproduced with the app's offline demo session (no credentials).

## Steps to reproduce
1. Open /bug-playground/.
2. Open "Live chat".

## Expected result
- The presence indicator shows offline when the panel says all agents are offline.

## Actual result
- Green presence dot (online) while the panel says "All agents are offline".

## Severity rationale
Minor (severity from the application's own defect registry). Misleading availability; users wait for help that will not come.

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
- Reproduction: `apps/qa-practice/tests/bug-playground/feedback.bugs.spec.ts` — `reproduce(tc('TC-BUG-015'), bug('BUG-BP-15'))`
- Expected behaviour: same file — `test.fail(… expected(tc('TC-BUG-015'), bug('BUG-BP-15')))`
- Run: `npx playwright test --project=qa-practice-chromium --grep "BUG-BP-15"`
