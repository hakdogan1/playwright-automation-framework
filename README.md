# playwright-quality-framework

A reusable Playwright + TypeScript framework for professional test automation:
a **production guard** that keeps tests from writing real data, **TC-ID traceability**
between manual test cases and automated tests, and **deterministic failure triage with
bug drafts** that a human reviews before anything is filed.

Reference application: [QA Practice](https://qapractice.hakdogan.com) (read-only, production).

> Status: Phase 2C.2C (local). 23 of 46 QA Practice UI modules automated. The 15 Bug Playground defects are covered separately and are not part of that count. In total: 161 TC-IDs and 15 Bug-IDs, verified on Chromium, mobile Chromium (smoke), Firefox and WebKit. CI workflow is prepared but not yet verified on GitHub Actions. Coverage details: [module inventory](docs/qa-practice-module-inventory.md#coverage-summary-updated-2026-11-23-faz-2c2c).

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
