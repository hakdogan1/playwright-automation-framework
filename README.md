# playwright-quality-framework

A reusable Playwright + TypeScript framework for professional test automation:
a **production guard** that keeps tests from writing real data, **TC-ID traceability**
between manual test cases and automated tests, and **deterministic failure triage with
bug drafts** that a human reviews before anything is filed.

Reference application: [QA Practice](https://qapractice.hakdogan.com) (read-only, production).

> Status: Phase 2C.6 (local). 46 of 46 QA Practice UI modules automated. The 15 Bug Playground defects are covered separately and are not part of that count. In total: 293 TC-IDs and 15 Bug-IDs, verified on Chromium, mobile Chromium (smoke), Firefox and WebKit. CI workflow is prepared but not yet verified on GitHub Actions. Coverage details: [module inventory](docs/qa-practice-module-inventory.md#coverage-summary-updated-2026-11-24-faz-2c6).

## v1.0 final regression (local, 2026-11-24)

Run against production (QA Practice build `3d14d23`, read-only guard). Evidence stays local in `evidence/runs/<run ID>/` (git-ignored).

| Run | Scope | Result |
|---|---|---|
| `20261123T230822Z-e009b8` | Framework self-tests | 280 / 280 passed |
| `20261123T230900Z-155c28` | All UI modules on Chromium, Firefox, WebKit (391 each) + mobile smoke (53), including the Bug Playground | **1,225 passed / 1 failed** · 0 flaky · 0 retries · 0 skipped. 45 known Bug Playground defects failed as expected (`test.fail`, 15 per desktop browser) |
| `20261124T070041Z-768718` | Targeted rerun after the fix: Date Range on all four projects, each test 3 times | **132 / 132 passed** |

- **The failure:** WebKit, TC-DTR-005 ("a third pick starts a new range"). The test clicked days 10, 20 and 25 in quick succession. The click on 25 reached the app before React had re-rendered the pick of 20, and the app's `pick()` reads the selection from the render closure, so the range became 10 → 25.
- **The fix (test side, no assertion changed):** `DateRangePage.pick()` waits until each pick has changed the chip before the next click, as a user who sees each result. The race in the app's code is recorded in [OBS-06](docs/observations/OBS-06-date-range-time-handling.md).
- Production Guard: 1,226 reports in production/enforce mode, no request other than GET, no unknown host. Analytics was stubbed; the Bug Playground's backend reads were blocked as expected (OBS-01).
- **Not verified yet:** GitHub Actions CI has never run. Deferred: payment test-card flows (local-only), the locked-account and used-email triggers (need reserved domains), API and DB tests (v1.1). Open product findings: OBS-01…OBS-10 (drafts, not filed).

## Quick start
```bash
npm ci
npx playwright install chromium
npm run check                 # typecheck, lint, TC validator, privacy gate, framework self-tests
npm run privacy:check         # fail-closed check of what Git would publish (docs/evidence-privacy.md)
npm run evidence:export -- <runId>  # sanitized, metadata-only copy of one run (never uploads)
npm run test:qa-practice      # QA Practice on Chromium + mobile (production, read-only)
npm run report                # open the HTML report of the latest run
```
Without `TEST_ENV`, tests run with the strictest (production) policy.
Every run writes its evidence to `evidence/runs/<runId>/` (git-ignored). Evidence is preserved by default; see the retention policy.

| Variable | Values | Default |
|---|---|---|
| `TEST_ENV` | `local`, `ci`, `staging`, `production` | `production` (safe default) |
| `BASE_URL` | absolute URL | from `apps/<app>/app.config.ts` |
| `GUARD_MODE` | `enforce`, `observe` (not allowed in production) | `enforce` |

## What is inside
| Layer | Path | Purpose |
|---|---|---|
| Config | `core/config` | Fail-safe environment resolution |
| Guard | `core/guard` | Domain/method policy for browser, WebSocket and API requests; Supabase blocked; analytics stubbed |
| Fixtures | `core/fixtures` | Guard, evidence capture, TC-ID and `@destructive` gates, `tc()` / `bug()` |
| Reporting | `core/reporting` | Classifier, `BugDraft` (JSON + Markdown), reporter, TC validator |
| AI | `core/ai`, `AGENTS.md` | ai-guard diff check, prompts, agent rules |
| App | `apps/qa-practice` | Page/component objects, data, test cases, specs |
| Self-tests | `framework-tests` | Unit, browser and reporter sub-process tests for `core/` |

Docs: [architecture](docs/architecture.md) · [production guard](docs/production-guard.md) ·
[bug workflow](docs/bug-workflow.md) · [AI workflow](docs/ai-workflow.md) ·
[evidence & retention](docs/evidence-retention.md) ·
[QA Practice module inventory](docs/qa-practice-module-inventory.md) · [Bug Playground matrix](docs/bug-playground-matrix.md) · [P1-7 timeout](docs/navigation-timeout.md) ·
[example bug draft](docs/examples/bug-draft.example.md)

## Scripts
| Script | Does |
|---|---|
| `npm run check` | typecheck + lint + `tc:validate` + `privacy:check` + framework self-tests |
| `npm run test:smoke` | `@smoke` on Chromium |
| `npm run test:cross-browser` | Firefox + WebKit (needs `npx playwright install firefox webkit`) |
| `npm run tc:validate` | Test cases ⇄ tests consistency |
| `npm run ai:guard` | Fails if a change touches test oracles without approval (exit 2 = could not inspect) |
| `npm run evidence:plan` / `evidence:prune` / `evidence:verify` | Evidence cleanup dry-run / explicit deletion / manifest check (tests never delete evidence) |
| `npx playwright test --project=diagnostics` | Navigation timing matrix against production (manual, read-only) |

## Rules
No fixed sleeps, no `force`, no hidden retries. Role/label locators first.
Test data uses `@example.test`. AI never changes assertions or files issues (see `AGENTS.md`).
