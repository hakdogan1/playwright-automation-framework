# Architecture

```
core/                 reusable, app-agnostic (must not import apps/ — enforced by ESLint)
  config/env.ts       fail-safe TEST_ENV / BASE_URL / GUARD_MODE resolution (zod)
  guard/              policy table + NetworkGuard (browser routes, WebSockets, APIRequestContext)
  fixtures/           test = guard + evidence + quality gates (TC-ID, @destructive); tc(), bug()
  reporting/          classifier, BugDraft, bug-draft reporter, TC validator
  ai/                 ai-guard (diff check) and prompts
apps/qa-practice/     the only app-specific code
  app.config.ts       hosts and environments
  pages/ components/  page and component objects (locators + actions, no assertions)
  support/ready.ts    readiness precondition (React hydration)
  data/               synthetic test data (@example.test)
  test-cases/         manual test cases with TC-IDs
  tests/<module>/     specs; every test carries tc('TC-…')
  agents/seed.spec.ts seed for Playwright Test Agents
framework-tests/      self-tests for core (unit + browser + reporter sub-process)
scripts/              CLIs: tc-validate, ai-guard
```

## Decisions
- **Composition over inheritance.** No BasePage. Page objects are small classes; fixtures compose.
- **Locators in constructors.** Required by Playwright 1.65 + `useDefineForClassFields`.
- **Assertions in specs.** Page/component objects expose locators and state. Exceptions:
  readiness waits in `goto()` and `support/ready.ts`.
- **Locator priority:** role/label → `data-testid` when the accessible name changes
  (e.g. the loading button) or no accessible handle exists.
- **No hidden retries.** Local runs use `retries: 0`. CI uses 1 isolated retry and `failOnFlakyTests: true`, so a test that only passes on retry is reported as flaky **and fails the CI run**. The three keys (`forbidOnly`, `retries`, `failOnFlakyTests`) stay literal in `playwright.config.ts`, so AI Guard can inspect them. `framework-tests/ci-flaky-gate.spec.ts` checks them statically and proves the behaviour with an isolated sub-project that contains a deterministic flaky test (no browser, no network, temp output).
- **Fake clock = installed *and* paused.** `page.clock.install()` alone keeps following real time (+508…511 ms per 500 real ms in all three engines), so boundary assertions can race a slow machine. App page objects call `pauseClock()` (`apps/qa-practice/support/clock.ts`) once the page is ready; only `clock.runFor()` moves time afterwards. Animations that need real time (Notifications exit, manual Close) run on the real clock or after `clock.resume()`.
- **One artifact folder per test.** Playwright deletes a test's output folder before the test runs, and titles that differ only in punctuation share a folder. The global setup (`core/reporting/collision-global-setup.ts`) refuses a run in which two tests would share one (see `docs/evidence-retention.md`).
- **Raw evidence never leaves the machine.** `evidence/` is git-ignored. `npm run privacy:check` fails when the publish set contains raw evidence, reports, binaries, unknown formats or sensitive content. Only `npm run evidence:export` (allow-listed metadata, masked and rescanned) produces something publishable. See `docs/evidence-privacy.md`.
- **Production politeness:** 2 workers against production.

## Adapting to a new product
Copy `apps/qa-practice` to `apps/<product>`, replace `app.config.ts`, pages, data and test cases,
add the project to `playwright.config.ts`. `core/` stays unchanged.
