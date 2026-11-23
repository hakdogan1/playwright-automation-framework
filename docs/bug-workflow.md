# From failure to bug report

```
test fails ─► evidence (screenshot, trace, video, console, network, guard report)
          ─► deterministic classifier ─► triage.md / triage.json (every failure)
          ─► BugDraft (JSON + Markdown) only for product-defect candidates
          ─► human review ─► human files the issue (GitHub Issue Form)
```

## Classification (`core/reporting/classifier.ts`)
| Category | Meaning | Bug draft |
|---|---|---|
| `product-defect-candidate` | Assertion compared values; the same mismatch on every attempt | yes |
| `test-maintenance` | Locator did not match / strict-mode violation | no |
| `environment` | Explicit network error or 5xx recorded (guard blocks excluded) | no |
| `navigation-timeout` | Navigation did not finish in time; **cause unknown** until pending requests and the trace are reviewed | no |
| `test-infrastructure` | Config, fixture, traceability or tooling error | no |
| `guard-violation` | The guard refused an action | no |
| `flaky` | Failed, then passed on retry (CI only; on CI this also fails the run via `failOnFlakyTests`) | no |
| `unclassified` | No rule matched, or attempts disagreed | no |

"Candidate" is deliberate. In the first local run, six drafts were produced for Inputs tests.
Triage showed the cause was the test: decorative `aria-hidden` icons (✓, !) are part of
the element text. The tests were fixed; no bug was filed. That is the workflow working.

## BugDraft contents (`core/reporting/bug-draft.ts`)
Run ID · TC-IDs and linked bugs · classification and consistency · suggested severity (from tags) ·
priority `needs-triage` · reproduction steps in execution order (`[setup]` hook actions such as
navigation, `test.step` titles, Playwright actions outside steps with their locator, the failing
assertion) · expected result
(from the test case document and the assertion) · actual result · environment (test env,
base URL, browser, viewport, OS, Playwright, **app build revision** from `release-info.json`,
framework commit, CI run URL) · evidence paths (inside `evidence/runs/<runId>/`) · console errors ·
network failures · pending requests (in `evidence.json`) · fingerprint. Text and URLs are redacted
(see `docs/evidence-retention.md`).

See `docs/examples/bug-draft.example.md`.

## Filing (human only)
1. Read `evidence/runs/<runId>/bug-drafts/triage.md` (`head -1 evidence/latest` gives the last run).
2. For each draft: confirm it reproduces, search open issues for the fingerprint.
3. File with the "Bug" Issue Form; add label `fp:<fingerprint>`.
4. Link the test: `annotation: [tc('TC-…'), bug('#123')]`.

Nothing in this repository calls an issue tracker. Jira or Linear adapters will consume the
same `BugDraft` JSON (planned); a tracker interface is added when the first adapter exists.
