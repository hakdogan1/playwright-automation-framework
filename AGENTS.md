# Rules for AI assistants (Claude Code, Codex, Playwright Test Agents)

These rules apply to every AI-assisted change in this repository. They are enforced
by `npm run ai:guard` and by code review, not only by this text.

## Never, without a human-approved change
- Change an assertion, an expected value or an "Expected result" in `test-cases/`.
- Add `test.skip`, `test.fixme`, `test.fail` or `test.slow`, or tags `@known-bug` / `@quarantine`.
- Update visual baselines (`*-snapshots/`).
- Weaken or bypass the production guard (`core/guard`), call `page.route`, `context.route`,
  `routeFromHAR`, `unrouteAll` or `newContext` in `apps/`.
- Open, close, label or comment on issues. AI output is a **draft** only.
- Use real accounts, real email addresses or production write APIs. Test data uses `@example.test`.

If a test fails because the product behaves differently from the test case, **stop and report**.
That may be a product bug. Do not "heal" it.

## Allowed
- Propose test plans (`specs/`) and new tests that follow the POM, fixtures and TC-ID conventions.
- Fix locators and waits when the UI structure changed but the behaviour did not.
- Analyse failures from traces (`npx playwright trace …`) and `reports/bug-drafts/`.
- Draft bug reports from `BugDraft` JSON for a human to review.

## Playwright Test Agents
The generated healer definition allows "fixing assertions and expected values" and
marking tests `test.fixme()`. In this repository those two actions are **not allowed**;
the rules above take precedence. See `docs/ai-workflow.md`.

## Conventions
- Locators: role / label first, `data-testid` when no accessible handle exists.
- No fixed sleeps (`waitForTimeout`), no `force: true`, no new retries.
- Every app test has `annotation: [tc('TC-XXX-NNN')]` and a matching test case document.
- Run `npm run check` and the affected app tests before proposing a change.
