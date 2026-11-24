# Loader / Spinner — test cases

Module: `/ui-elements/loader/` · Automated in `apps/qa-practice/tests/loader/loader.spec.ts`
Source of expected values: QA Practice `LoaderWidget` (`extras.tsx`) at revision 3d14d23, the production build per `/release-info.json`; identical in the local build d856264. Data: `apps/qa-practice/data/async-overlays.data.ts`.

> **Clock.** The 1.6 s delay is a `setTimeout`; the fake clock is installed before the page loads and paused once it is ready, so only `runFor()` moves time.

> **Not asserted here (see `docs/observations/OBS-07-async-timer-races.md`).** "Force error" during loading does not cancel the pending timer: 1.6 s later the metrics appear next to the error (measured in all three engines).

## TC-LDR-001 — "Load metrics" shows a busy, disabled button and a status spinner
- **Type:** Smoke
- **Priority:** P1
- **Preconditions:** `/ui-elements/loader/` is open; fresh browser context. Fake clock installed and paused.

**Acceptance criteria**
- Loading is visible and announced; the trigger cannot be pressed twice.

**Steps**
1. Check the idle state.
2. Press "Load metrics".

**Expected result**
- Idle: "Load metrics" enabled, no spinner, no card.
- Loading: "Loading…" disabled; role `status`, `aria-live="polite"`, "Fetching live ledger metrics…"; no card.

## TC-LDR-002 — The metrics appear exactly after 1600 ms
- **Type:** Functional
- **Priority:** P1
- **Preconditions:** `/ui-elements/loader/` is open; fresh browser context. Fake clock installed and paused.

**Acceptance criteria**
- The result replaces the spinner after the delay.

**Steps**
1. Press "Load metrics", advance 1599 ms.
2. Advance 1 ms.

**Expected result**
- After 1: spinner, no card. After 2: card with MTTR 11m, Pass rate 99.4%, Coverage 86%; no spinner; "Load metrics" enabled.

## TC-LDR-003 — Loading again replaces the metrics with the spinner until the new result
- **Type:** Functional
- **Priority:** P2
- **Preconditions:** `/ui-elements/loader/` is open; fresh browser context. Fake clock installed and paused. Metrics loaded.

**Acceptance criteria**
- A new load clears the old result first.

**Steps**
1. Press "Load metrics" again.
2. Advance 1600 ms.

**Expected result**
- After 1: no card, spinner. After 2: card, no spinner.

## TC-LDR-004 — "Force error" shows the service error without metrics or spinner
- **Type:** Negative
- **Priority:** P1
- **Preconditions:** `/ui-elements/loader/` is open; fresh browser context. Fake clock installed and paused.

**Acceptance criteria**
- The error state is exclusive.

**Steps**
1. Press "Force error".

**Expected result**
- "Service unavailable · ledger_timeout"; no card; no spinner; "Load metrics" enabled.

## TC-LDR-005 — Loading after an error clears the error and shows the metrics
- **Type:** Negative
- **Priority:** P1
- **Preconditions:** `/ui-elements/loader/` is open; fresh browser context. Fake clock installed and paused. Error forced.

**Acceptance criteria**
- Recovery from the error state.

**Steps**
1. Press "Load metrics".
2. Advance 1600 ms.

**Expected result**
- After 1: no error, spinner. After 2: card, no error.

## TC-LDR-006 — "Force error" after loaded metrics replaces them with the error
- **Type:** Edge
- **Priority:** P2
- **Preconditions:** `/ui-elements/loader/` is open; fresh browser context. Fake clock installed and paused. Metrics loaded.

**Acceptance criteria**
- The error replaces a previous result.

**Steps**
1. Press "Force error".

**Expected result**
- No card; "Service unavailable · ledger_timeout".
