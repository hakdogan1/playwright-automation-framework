# Prompt: bug report polish (human-triggered)

```
Rewrite this BugDraft JSON as a clear bug report for a developer. Keep every fact,
invent none. Keep: TC-ID, reproduction steps, expected (test case + assertion),
actual, environment table, evidence paths, fingerprint.

- Title: "<area>: <observed behaviour> (expected <expected behaviour>)".
- Leave Priority as "needs-triage". You may suggest a severity with one-line reasoning.
- If the draft looks like a test problem (locator, timing, data) rather than a product
  defect, say so at the top and recommend NOT filing it.
- Output Markdown only. Do not file the issue.
```
