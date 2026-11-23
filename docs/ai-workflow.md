# AI-assisted workflow

Normal test runs make **no AI calls**. AI is a development-time assistant with
deterministic guardrails.

| Task | Tool | Output | Gate |
|---|---|---|---|
| Test planning | Playwright **Planner** (seed: `apps/qa-practice/agents/seed.spec.ts`) | Markdown plan in `specs/` | Human turns accepted items into `test-cases/TC-*.md` |
| Test generation | Playwright **Generator** / Claude Code / Codex | Spec proposal | Must use app fixtures + `tc()`; `npm run check` |
| Locator maintenance | Playwright **Healer** (restricted) | Locator/wait patch | `ai-guard`; no assertion or skip changes |
| Failure analysis | `npx playwright trace …` + `core/ai/prompts/failure-analysis.md` | Markdown notes | Human decides |
| Bug report draft | `core/ai/prompts/bug-report-draft.md` on a `BugDraft` | Markdown | Human files the issue |

## Status (this phase)
- **Evaluated, not activated.** `npx playwright init-agents --loop=claude` was run in an
  isolated folder to inspect its output (3 agent definitions, `.mcp.json`, `seed.spec.ts`).
- The generated **healer** instructions allow "fixing assertions and expected values" and
  marking tests `test.fixme()`. Both conflict with this repository's rules, so the agents are
  not committed yet. When activated, `AGENTS.md` takes precedence and `ai-guard` blocks such diffs.
- The seed test runs through the guarded fixtures, so an agent browser launched via the seed
  inherits the production guard. *Not yet verified with a live agent session.*

## Activation (when approved)
```bash
npx playwright init-agents --loop=claude --project=qa-practice-agent-seed
```
Regenerate after every Playwright upgrade (official guidance).

## Guardrails
- ESLint blocks guard bypasses (`route`, `newContext`, `page.request`, `browser.newPage`, direct browser imports) in `apps/`.
- AI never gets issue-write permissions.
- `npm run ai:guard` (`core/ai/ai-guard.ts` + `scripts/ai-guard.ts`), described below.

## ai-guard
Compares **file contents** of the base revision with the working tree (tracked, staged and
untracked files) and parses specs with the TypeScript compiler API. Base:
explicit argument → `AI_GUARD_BASE` → `origin/main` → `HEAD` → empty tree (no commits yet).
Exit codes: `0` PASS, `1` protected change without approval, `2` could not inspect —
an inspection error is never reported as PASS.

| Flagged (needs reviewer approval) | How |
|---|---|
| Assertion removed or changed, incl. multi-line chains and `expect.soft/poll` | AST: matcher chain text per test |
| Assertion moved under `if`/`try`/`&&`/callback | AST: control-flow context is part of the signature |
| Local expected value changed (`const expected = …` in the test) | AST: const initialisers per test |
| Test removed | AST: test titles |
| `test.skip/fixme/fail` (declaration, in body, file-level, conditional), `testInfo.*`, `test.info().*` | AST: call count |
| New `return`/`throw` in a test body | AST: early-exit count |
| `@known-bug`/`@quarantine` changes, removed `tc()` IDs | AST: test details |
| `apps/*/data/**` value changed or removed | AST: top-level initialisers |
| Runner config: `testDir`, `testMatch`, `testIgnore`, `grep`, `grepInvert`, `retries`, `timeout`, `expect`, `forbidOnly`, `failOnFlakyTests`, snapshot options, `shard`, `maxFailures` | AST: property values |
| Visual baselines (`*-snapshots/`) added/changed/removed | path |
| "Expected result" sections in `test-cases/*.md` | per TC-ID text |
| `privacy-allowlist.json`: every added, removed or changed privacy exception (path, rule, count or reason); an unreadable file fails | JSON entries per path + rule |
| Guard code: `.github/workflows/*.yml`, `.github/CODEOWNERS`, `scripts/ai-guard.ts`, `core/ai/*.ts` (added or content changed) | content |
| Deleted or renamed protected files | git name-status |

Approval: `AI_GUARD_APPROVED=1` (CI: reviewer-applied label `assertion-change-approved`).
The first commit of a new repository needs approval once, because every protected file is new
to the empty tree (intentional `test.fail` self-tests and the config are reported).

**Known false positives:** renaming a test title (reported as removed); reordering identical
assertions inside a new `if`; any change of a protected config key, even a stricter one
(e.g. lowering `retries`).

**Known false negatives (not detected):**
- Assertions in helpers, page objects or custom matchers outside spec files, and changes to
  locators that make an assertion pass vacuously.
- Expected values coming from files other than `apps/*/data/**` or test-local `const`s
  (e.g. `let`, function parameters, imported constants from other folders).
- `test.slow()` and timeout changes inside specs (`slow` only extends time, so it is not protected).
- Tests generated dynamically from data (loops) when the data file is outside `apps/*/data/`.
- Weakening via environment variables or CLI flags at run time (`--grep-invert`, `--retries`).

## Baseline approval (root commit)

The first commit of the repository has no parent, so AI Guard compares it with the empty tree and every protected file in it is a finding (18 at the time of writing). These findings are approved once, by a human, outside the commit.

**Trusted reference.** The reference is `{"commit", "manifestSha256", "findingIds"}`: the exact 40-character commit SHA, the SHA-256 of the canonical finding manifest, and the exact list of finding IDs. Each ID covers rule, file, detail and the SHA-256 of the file content. The reference is stored only in the GitHub **environment secret** `AI_GUARD_BASELINE_REF` of the environment `ai-guard-baseline`:
- It never lives in the commit: a commit cannot approve itself.
- Only repository admins can set it.
- GitHub releases it to a job only after a required reviewer approved that job.

The code (`core/ai/baseline.ts`) only verifies the reference; it is not the source of trust.

**Flow.**
1. Create the root commit locally (after approval).
2. Run `node scripts/ai-guard.ts --manifest <file> --reference <file>`. The manifest file holds rules, files, details and content hashes, never file content. The reference file is written with mode 600 and never printed.
3. Compare the manifest with the reviewed finding list.
4. Store the reference file's content as the environment secret.
5. Push. `ai-guard-scan` describes the commit. `ai-guard-baseline` pauses for approval and then runs with `AI_GUARD_BASELINE=1`. `quality` always runs and fails unless, for a root commit, the baseline job succeeded.
6. After the baseline, delete the secret. It is bound to one SHA and useless for any other commit.

**The environment itself is verified.** If the environment were missing, GitHub would create it **unprotected** and the job would run without any approval. The same happens if it has no required reviewer, or lets admins bypass. So before checking the baseline, the job reads the environment through the API (`--verify-environment`) and fails unless all of these hold:
- reviewer `hakdogan1`;
- `can_admins_bypass: false`;
- deployments from `main` only.

This also covers a reference stored by mistake as a repository secret: without the protection the job fails here.

**Verification is fail-closed.** It requires a root commit, a clean work tree, a valid reference (strict schema), the exact SHA, the exact manifest hash and exactly the same finding IDs. Any failure exits 1, and the output contains only reason codes and counts. On any later commit the baseline mode is refused (`not-root-commit`). Without `AI_GUARD_BASELINE=1` a reference approves nothing.

**Trust boundary.** For `pull_request` runs GitHub executes the pull request's own workflow file, so checks in the repository can be edited by the change they check. The boundary that a pull request cannot move is in GitHub settings:
- branch protection or a ruleset on `main`: pull request required, required status checks (`quality`), no force push or deletion;
- code-owner review for `.github/**`, `scripts/ai-guard.ts`, `core/ai/**` and `privacy-allowlist.json`;
- the environment's deployment branch policy (`main` only). A pull request branch cannot deploy to `ai-guard-baseline`, so a modified workflow cannot obtain the reference.

`pull_request_target` is not used. The organization-level ruleset "require workflows to pass" is not available for a personal repository.

**GitHub settings to create (outside the repository).**
- Environment `ai-guard-baseline`: required reviewer (the owner), "prevent self-review" **off** (single maintainer, see below), administrators may **not** bypass, deployment branches: `main` only, secret `AI_GUARD_BASELINE_REF`.
- Branch protection or ruleset on `main` as above.
- `.github/CODEOWNERS` (owner `@hakdogan1`) covers the workflows, `scripts/ai-guard.ts`, `core/ai/`, `privacy-allowlist.json` and itself. `framework-tests/codeowners.spec.ts` checks it against AI Guard's protected classes.
- Actions: require approval for workflows from first-time contributors; read-only token for fork pull requests.

**Plan limits (GitHub docs, checked 2026-11-24).**
- Environment required reviewers on Free, Pro and Team are available for **public** repositories only.
- Branch protection, rulesets and code-owner review in private repositories need Pro or higher.

So this design needs a public repository, unless the plan is Enterprise.

**Single maintainer.**
- "Prevent self-review" must be off; otherwise nobody could approve. The approval is then a deliberate, recorded step by the owner bound to an exact reference, not a second person.
- Pull request authors cannot approve their own pull requests, so required reviews only constrain other contributors. The owner keeps admin bypass on `main` for own changes, which therefore rely on AI Guard and the owner's review.

### Safe first-push order

Each step must be done in this order; skipping or reordering one opens a way around the approval.
1. **Locally.**
   - Create the root commit from the pinned file list.
   - Run `node scripts/ai-guard.ts --manifest <file> --reference <file>`.
   - Review all findings in the manifest against the reviewed list.
   - Keep the reference file private (mode 600).
2. **Create the repository** on GitHub: public, and **empty** (no README, license or .gitignore). An initialised repository would already have a root commit, and ours would no longer be the root.
3. **Actions.**
   - Make sure Actions are enabled **before** the push: without them the commit would land with no check at all.
   - Default token permissions: read-only.
   - Require approval for workflows from first-time contributors.
4. **Environment `ai-guard-baseline`.**
   - Required reviewer `hakdogan1`.
   - "Prevent self-review" off (single maintainer).
   - **Admin bypass off.**
   - Deployment branches: selected, `main` only.
5. **Environment secret** `AI_GUARD_BASELINE_REF`: the content of the reference file. Store it as an **environment** secret only, never as a repository secret. Then delete the local reference file.
6. **Push** the root commit to `main`.
7. **Approve.**
   - `ai-guard-scan` runs, and `ai-guard-baseline` waits.
   - Before approving, compare the run's commit SHA with the local SHA, and the finding count in the scan log with the reviewed count.
   - Approve. The job verifies the environment and then the exact SHA, manifest hash and finding IDs.
   - `quality` must be green.
8. **Afterwards.**
   - Delete the secret.
   - Create the branch protection / ruleset on `main`: pull request required, required status checks `quality` (and `ai-guard-scan`), no force push or deletion, code-owner review.
   - From now on, changes go through pull requests and the normal AI Guard.

If step 7 fails, nothing is approved. Find the cause locally. A corrected root commit needs a new reference. Replacing the pushed root commit needs a force push to `main`, which is only possible before step 8 and must be a deliberate decision.

## Measuring value (next phase)
Time to first green test, share of generated lines humans changed, locator lint findings,
seeded-bug detection rate (QA Practice Bug Playground), healer suggestions accepted vs
rejected, tokens and cost per task.
