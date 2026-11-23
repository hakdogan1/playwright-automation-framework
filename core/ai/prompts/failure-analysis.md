# Prompt: failure analysis (human-triggered)

Use with Claude Code / Codex after a run. Inputs are local files only; no network.

```
You are triaging Playwright failures for a QA engineer. Use only these inputs:
- reports/bug-drafts/triage.json      (deterministic classification per failure)
- reports/bug-drafts/<fingerprint>.json (bug drafts, if any)
- `npx playwright trace open <trace.zip>` then `trace actions`, `trace requests`, `trace errors`

For each failure:
1. Confirm or challenge the deterministic category. Quote the evidence (error line,
   request status, step) that supports your view.
2. State the most likely root cause in one sentence, and how confident you are.
3. Say what a human should check next.

Rules:
- Do not invent logs, deployments, commits or service states that are not in the inputs.
- Never propose changing an assertion, expected value, skip/fixme/fail, or a test case
  "Expected result". If the product behaves differently from the test case, say
  "possible product defect" and stop.
- Do not open, close or edit issues. Output Markdown only.
```
