# Evidence and retention

Every run gets a unique run ID (`YYYYMMDDTHHMMSSZ-<hex>`, `core/reporting/run-context.ts`),
created once in the main Playwright process and inherited by workers.

```
evidence/                      git-ignored, local only
  latest                       path of the most recent run
  runs/<runId>/
    run.json                   manifest: status, counts, projects, runtime, every failing
                               test with its attempts and attachment paths
    artifacts/                 screenshots, traces, videos, evidence.json, guard-report.json
    html/                      HTML report (npm run report opens the latest)
    results.json               JSON report
    bug-drafts/                triage.md/json + BugDraft JSON/Markdown (with runId)
    diagnostics/               optional navigation diagnostics (P1-7)
  phase-1d/                    logs of the Phase 1D verification runs
```

Earlier runs are never overwritten: Playwright only clears its own `outputDir`, which is
per run. Guard failures keep `evidence.json`, `guard-report.json`, a `guard-failure-N.png`
screenshot and the trace, all written as files and listed in `run.json`.

## Retention — preserve by default (`core/reporting/retention.ts`)
**No test run deletes evidence.** Cleanup is a separate, explicit command:

```bash
npm run evidence:plan      # dry-run: every run with keep/delete and the reason (default)
npm run evidence:prune     # --apply: deletes only runs marked "delete"
npm run evidence:verify    # manifest consistency (missing manifests / attachments)
```

A run is deletable **only if all** of these hold; otherwise it is kept:

| Check | Kept when |
|---|---|
| Folder type | symlink, non-directory, or name not a run ID |
| Pin | a `KEEP` file exists |
| Manifest | `run.json` missing, unparsable, or inconsistent (runId/status/finishedAt) |
| Result | status is not `passed` (failed runs are evidence) |
| Class | `retention.class` is not `routine` (`milestone`, `release`, `security`, `unclassified`) |
| Recency | among the newest `PQF_KEEP_ROUTINE_RUNS` (default 10) routine runs |
| Age | younger than `PQF_KEEP_ROUTINE_DAYS` (default 14) |

The class is recorded at run time from `PQF_RUN_CLASS` (`routine`, `milestone`, `release`,
`security`). Unset or unknown values become `unclassified` and are kept, so earlier runs
(without a class) are protected retroactively. Mark everyday local runs as disposable with
`PQF_RUN_CLASS=routine`; keep milestone and GO/NO-GO runs as `milestone`/`release` or pin them with `KEEP`.

Safety: the CLI only works inside this checkout (`package.json` name check) on
`<checkout>/evidence/runs`; the root must not be a symlink; each target is re-checked right
before removal (real directory, directly inside the real root, valid run ID). Every decision —
including dry-runs and refused deletions — is appended to `evidence/retention-audit.jsonl`.
There is no size-based deletion: disk usage is a reason to run `evidence:plan`, not to delete silently.

History: until Phase 2A.1 the reporter pruned automatically (newest 5 passing runs kept) and
removed the Phase 1D final run folders on 2026-11-22; their logs remain in `evidence/phase-1d/`.

## Sensitive data
- JSON evidence, guard reports and bug drafts are redacted (`core/reporting/redact.ts`):
  sensitive query parameters (token, key, secret, password, session, auth, code, sig…),
  URL credentials, token fragments, JWTs, `Bearer`/`Basic` values, and e-mail addresses
  outside `example.test/com/org/net`.
- **Traces and videos cannot be scrubbed.** They may contain cookies, headers and page
  content. Keep them local; never publish `evidence/` as-is. Publishing (Phase 2) must use
  a curated export (HTML report without traces, or redacted summaries).

## Runs without a manifest (`evidence:verify` → `manifest missing`)

The config always creates `evidence/runs/<runId>/`. `run.json`, `results.json` and `html/` are written only by the configured reporters. If a run passes `--reporter=…` on the CLI, it **replaces** those reporters, and the folder ends up holding only `artifacts/` with no manifest. A run that is still in progress also has no manifest until it finishes. Such runs are **kept**, never pruned (see the selection rules above). They are expected warnings, not data loss.

Classification on 2026-11-23 (14 warnings; 15 after the CI flaky-gate mutation run, 18 after the Form Register clock diagnostics and 29 after the Faz 2C.2A.1 diagnostics, all on 2026-11-23; none caused by a framework reporting defect). It was revised after the independent QA review. The signal used is Playwright's own `artifacts/.last-run.json`, which the runner writes when a run finishes. If that file says `passed` but there is no `results.json`/`html`/`run.json`, the run completed while the config reporters did not run, which means a CLI reporter override. A missing `.last-run.json` means the run was interrupted.

| Run(s) | `.last-run.json` | Class | Evidence |
|---|---|---|---|
| `20261122T165750Z-1a53ec` | failed (1 test) | Diagnostic run, completed with a failure (`navigation.diag.ts`, P1-7 timeout investigation) | `diagnostics/` folder, 1 artifact |
| `20261122T165826Z-d625ac` | **missing** | Diagnostic run, **interrupted** before the runner finished | `diagnostics/` folder, no runner status |
| `20261122T203418Z-206c73` | passed | Run that executed **0 tests** and completed. **Origin UNKNOWN** (the earlier guess "zsh No tests found" is not supported, because that would not end as passed) | 0 artifacts |
| `20261122T203938Z-60a310`, `20261122T205424Z-a275f7`, `20261122T211608Z-180e82` | passed | Completed run with a reporter override; **origin unknown**, not started by this session, overlapped its runs | 133 / 149 / 208 test folders with guard reports, no `results.json`/`html`/`run.json` |
| `20261122T210618Z-97c5f8` … `20261122T210721Z-b9fe7c` (5), `20261123T062913Z-24556c`, `…062919Z-ac6c5b`, `…062923Z-17b3b7` | passed | Diagnostic runs started by this session with `--reporter=line` (temporary `zz-diag` specs for the Notifications clock and TC-SLD-007, deleted afterwards) | 1–15 test folders |
| `20261123T074325Z-37acfc` | failed (2 tests, intended) | Diagnostic mutation run started by this session with `--reporter=line`. `failOnFlakyTests` was temporarily set to `false` in the flaky-gate fixture (restored afterwards) to prove that `ci-flaky-gate.spec.ts` detects it | 5 test folders |
| `20261123T075657Z-76993e`, `…075659Z-aaefeb`, `…075703Z-44d886` | passed | Diagnostic runs started by this session with `--reporter=line`: a temporary clock spec (deleted afterwards) measured that `page.clock.install()` keeps following real time until `pauseAt()` (Form Register) | 1 test folder each |
| `20261123T081410Z-39e50b`, `…081425Z-1e1951`, `…081442Z-c3ef23`, `…081538Z-1b425f`, `…081614Z-a7e48d`, `…081654Z-9fa3d7` | passed | Diagnostic runs started by this session with `--reporter=line` (Faz 2C.2A.1). Temporary `zz-diag` specs, deleted afterwards, injected a 500 ms real delay to compare install-only with install + pauseAt (Keyboard Keys, Notifications, Bug Playground) | 2–8 test folders |
| `20261123T083020Z-743d1e`, `…083036Z-7dcbf1`, `…083108Z-c7ab4b`, `…083507Z-da650f`, `…083524Z-414a74` | failed ×4 (intended), passed ×1 | Development runs of `evidence-collision.spec.ts` with `--reporter=line`: the pre-fix reproduction (red by design), the rejected in-folder marker attempt and harness fixes, then green | framework test folders |

Complete runs that used the config reporters all verify as `ok`. Missing-manifest runs are kept (`retention.ts`, rule "manifest missing: never deleted automatically"; framework test `retention.spec.ts` #4).

Convention: evidence runs use the config reporters. Diagnostic runs that override `--reporter` are allowed but leave manifest-less folders, which is acceptable because they are kept.

## Artifact folder collisions (found and guarded 2026-11-23)

**Root cause.** Playwright names each test's output folder `<file>-<sanitized title>` (trimmed to 60 characters with a hash) plus the project id and the `-retryN`/`-repeatN` suffixes. Sanitizing turns runs of special characters into one `-`; Playwright's own `sanitizeForFilePath` turns both `email "a b@c.test"` and `email "a.b@@c.test"` into `email-a-b-c-test-`. **Before every test, Playwright deletes that folder** (`removeFolders([testInfo.outputDir])`, `workerProcessEntry.js:1630`, 1.65.1). So the second of two such tests deletes the first test's whole evidence folder before any framework code runs. It does not merely overwrite files.

- Seen in run `20261123T080136Z-251ec9` (223 folders for 224 tests) and `20261123T080639Z-7f5d9e` (28 for 30): two TC-FRM-004 rows. Both runs are kept unchanged; one TC-FRM-004 row per project has no evidence of its own there.
- The spec titles were fixed with row numbers (run `20261123T080823Z-9d6751`: 46 folders, 46 guard reports, 0 duplicates).

**Guard.** `core/reporting/collision-global-setup.ts` (wired as `globalSetup` in `playwright.config.ts`) lists the whole suite with `playwright test --list` and computes every folder name with Playwright's own `sanitizeForFilePath`/`trimLongString` (`core/reporting/output-collisions.ts`). If two tests would share a folder, the run is refused **before any test runs**, and the message names both tests and the folder. It costs one listing pass (about 0.7 s); the listing writes only to a temp folder.

Rejected alternatives (measured, so not repeated):
- An owner marker inside the folder: Playwright deletes it with the folder.
- Throwing in a reporter's `onBegin`: the tests still ran.
- Handing the result from the reporter to the global setup: the global setup runs before `onBegin`.

**Verification.** `framework-tests/evidence-collision.spec.ts`:
- Reproduction: without the guard, one folder remains and only the second test's file survives.
- The predicted folder names equal the names Playwright creates.
- With the guard, the run is refused, no test runs and nothing is written.
- The framework's own suite has no collisions.

Mutation check: restoring the old TC-FRM-004 titles made the real suite refuse to start, naming exactly the folder that had collided (`forms-form-register-Form-R-7ce21-mple-test-is-the-only-issue-qa-practice-chromium`). A refused run still leaves a valid, failed manifest with 0 tests (for example `20261123T083544Z-bbac24`), which retention keeps.

**Rule for data-driven tests:** give each title a row number or another alphanumeric key. The guard enforces this.

## Runs from other processes (2026-11-23)

- `20261123T101525Z-7e52e5`: existing Inputs tests, complete manifest. Not started by the Faz 2C.2B session. At that time a Playwright `test-server` (`cli.js test-server -c playwright.config.ts --host 127.0.0.1`, typically an editor extension or UI mode) was running in this folder. No source file was changed by it. The run is kept as is.

## Personal data in page snapshots (found 2026-11-23, open)

Playwright writes `error-context.md`, with an ARIA snapshot of the page, for every failing test, including the intended failures of the Bug Playground `@known-bug` tests (`test.fail`). The HTML report copies these snapshots. The Bug Playground page shows a real-looking e-mail address on the app owner's domain, so that address is in the evidence of **21 of 129 runs** (every run with those tests, since Faz 2B), for example run `20261123T193343Z-8cc749` (9 snapshots plus 9 HTML report copies).

- It is public site content, not a secret, and no evidence was deleted or rewritten.
- File Download runs do not contain it: neither the downloaded CSV (never attached) nor a deliberately failing CSV assertion leaked it (mutation run `20261123T193330Z-1e9df2`, all artifacts including the trace scanned).
- **Addressed by the publication boundary (2026-11-23):** raw snapshots stay local and are never exported or published; see `docs/evidence-privacy.md`. The raw files themselves are kept unchanged.
