# Evidence privacy

Raw evidence can hold things that must not be published: what a page displayed (addresses in page snapshots), request headers inside traces (a backend key was captured there once), local file paths, screenshots and videos. The framework therefore separates **raw** from **publishable** evidence and checks every publication path. The checks fail closed.

## Trust boundary

| Zone | What | Where | Leaves this machine? |
|---|---|---|---|
| Raw (untrusted) | Everything Playwright and the framework write: traces, screenshots, videos, `error-context.md`, HTML report, `results.json`, manifests, bug drafts, guard reports | `evidence/runs/<runId>/` (git-ignored) | **Never.** Retention, guard and bug reporting work on it unchanged. |
| Publishable | Allow-listed metadata only, masked and rescanned | `evidence-export/<runId>/` (git-ignored) | Only by a deliberate act: the CI artifact, or attaching it to an issue by hand. |

Screenshots, videos, traces, `error-context.md` and HTML reports are **never** exported. Pixels and DOM snapshots cannot be reliably scrubbed.

## Components

- **Catalogue — `core/reporting/privacy.ts`.**
  - Detects these classes:
    - e-mail addresses (except reserved ones: `example.com/org/net/test` and the TLDs `.test`, `.example`, `.invalid`, `.localhost`);
    - JWTs, Bearer/Basic tokens, Supabase publishable/secret keys;
    - Authorization/Cookie/API-key header values;
    - URLs with credentials or sensitive parameters;
    - local user paths and Supabase project hosts.
  - It reuses the patterns and functions of `redact.ts`. Evidence redaction (bug drafts, `evidence.json`, guard reports) is unchanged.
  - `redactForPublication` calls that redaction and then masks the publication-only classes.
  - Findings carry rule, line and count, never the value.
- **Publication gate — `npm run privacy:check`** (`core/reporting/privacy-gate.ts`). It classifies tracked, staged, untracked and ignored files. For the set Git would publish, it fails on:
  - raw evidence, report and diagnostic paths: `evidence/`, `evidence-export/`, `test-results/`, `playwright-report/`, `blob-report/`, `reports/`, and the files `trace.zip`, `error-context.md`, `results.json`, `run.json`, `.last-run.json`, `*.trace`, `*.network`, `*.har`, `*.webm`, `*.mp4`, `*.log`;
  - binaries and **unknown formats**: only known text formats are read;
  - sensitive content in the working copy **and** in the staged version;
  - a `.gitignore` that does not ignore the raw locations (probed with `git check-ignore`).
  It is part of `npm run check` and the CI quality job.
- **Exceptions — `privacy-allowlist.json`.**
  - Only for reviewed synthetic fixtures. Each entry is pinned to an exact `(path, rule, count)` and has a reason.
  - A changed count, or an entry that no longer matches anything, fails the gate.
  - Current entries: the synthetic JWT, Bearer and `token=` fixtures of the redaction tests.
- **Sanitized export — `npm run evidence:export -- <runId>`** (`core/reporting/evidence-export.ts`).
  - Copies only `run.json`, `bug-drafts/*.md|json` and `artifacts/*/guard-report.json` and `artifacts/*/evidence.json` into a staging folder.
  - Masks them for publication and rescans them. A non-text file or any remaining finding aborts the export and removes the staging folder.
  - On success it renames the folder into place (atomic, never overwriting) and writes `EXPORT.json` (files, hashes, excluded counts).
  - It reads raw evidence only and uploads nothing.
- **CI** (`.github/workflows/ci.yml`; not yet run on GitHub, so its behaviour there is UNKNOWN).
  - The quality job runs `privacy:check`.
  - The QA job fixes one run ID per job (`PQF_RUN_ID`), so the test run and the export use the same run.
  - The export runs even when tests fail (metadata of a failed run is still useful), but only for that run ID.
  - The triage summary and the artifact upload run **only if the export step succeeded**.
  - The upload takes exactly `evidence-export/<run ID>/` (`if-no-files-found: error`, hidden files excluded, so a `.staging-*` folder can never be included).
  - There is no fallback to raw reports: raw evidence never leaves the runner.
  - Simulated locally (shell logic only): a same-run export works; a missing run is refused with exit 1 and no folder; a failed test run still exports clean metadata.
- **Protected exceptions.** `privacy-allowlist.json` is protected by AI Guard. Every added, removed or changed exception is a finding that needs the same human approval as an assertion change (`assertion-change-approved`). There is no separate bypass.

## Verification (2026-11-23)

- **Self-tests** in `framework-tests/privacy.spec.ts` (24 tests, deterministic ×3). The synthetic values are assembled at runtime, so the test file itself passes the gate.
  - Each class is detected; clean text and reserved addresses pass.
  - Binary and unknown formats are rejected.
  - Raw evidence forced into Git fails; a staged-only secret is caught.
  - A missing ignore rule fails; exceptions match only exactly.
  - Export: allow-list only, masked, raw run unchanged, no overwrite, a non-text file refuses the export.
  - Retention and verification are unchanged; evidence redaction keeps its existing outputs.
  - No synthetic secret appears in any output.
- **Real exports.**
  - Run `20261122T202545Z-26512f` contains a backend key in its trace headers: 37 metadata files exported, 218 excluded.
  - Run `20261123T193343Z-8cc749` contains addresses in page snapshots: 251 exported, 529 excluded.
  - An independent scan of both exports found 0 addresses, keys, hosts, local paths, JWTs or auth values.
- **Raw evidence after all of this.**
  - 21,068 of the 21,070 baseline files are byte-identical.
  - `evidence/latest` is the pointer each run rewrites.
  - `evidence/retention-audit.jsonl` was only appended to: the baseline equals its first 764 lines.

## Limits

- The gate checks what Git would publish. It does not cover copying files elsewhere by hand, or screenshots pasted into issues.
- The catalogue is pattern-based. New secret formats need a new rule; unknown file formats are rejected rather than guessed.
- Raw evidence still holds the captured data locally (for example in 3 runs with the backend key in trace headers, and in 33 runs with addresses). It is kept as is: nothing is deleted or rewritten.
