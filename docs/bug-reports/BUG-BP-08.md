# [BUG-BP-08] Shipping policy link does nothing

> Issue-ready report (matches `.github/ISSUE_TEMPLATE/bug.yml`). **Not filed automatically.**
> Seeded defect #8 of the QA Practice Bug Playground (`shipping-policy-dead-link`).

| Field | Value |
|---|---|
| Bug ID | BUG-BP-08 |
| Test case | TC-BUG-008 |
| Area | Footer · Shipping policy |
| Severity | **Minor** |
| Priority | _needs-triage (human decision)_ |
| Determinism | Deterministic |
| Production-safe test | Yes — client-side only, production guard active, no writes |

## Description
Shipping policy link does nothing.

## Preconditions
- Signed in (demo session).
- Bug Playground requires sign-in; reproduced with the app's offline demo session (no credentials).

## Steps to reproduce
1. Open /bug-playground/.
2. Click "Shipping policy" in the footer.

## Expected result
- The shipping policy opens (navigation, new tab or dialog).

## Actual result
- Nothing happens: URL unchanged, no dialog, no new page.

## Severity rationale
Minor (severity from the application's own defect registry). Legally relevant information is unreachable; no data impact.

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
- Reproduction: `apps/qa-practice/tests/bug-playground/feedback.bugs.spec.ts` — `reproduce(tc('TC-BUG-008'), bug('BUG-BP-08'))`
- Expected behaviour: same file — `test.fail(… expected(tc('TC-BUG-008'), bug('BUG-BP-08')))`
- Run: `npx playwright test --project=qa-practice-chromium --grep "BUG-BP-08"`
