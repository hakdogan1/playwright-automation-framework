# Lazy Loaded Elements — test cases

Module: `/ui-elements/lazy-load/` · Automated in `apps/qa-practice/tests/lazy-load/lazy-load.spec.ts`
Source of expected values: QA Practice `LazyLoadWidget` (`async.tsx`) at revision 3d14d23, the production build per `/release-info.json`; identical in the local build d856264. Data: `apps/qa-practice/data/async-overlays.data.ts`.

> **Clock.** The 1.2 s delay is a `setTimeout` on the installed and paused fake clock. The panel's exit animation needs real time, so TC-LZY-003 resumes the clock at the end.

> **Not asserted here (see `docs/observations/OBS-07-async-timer-races.md`).** A second press while loading does not restart the delay: the first timer mounts the panel and resets the button while the second timer is still pending.

## TC-LZY-001 — The trigger switches to "Loading…" and nothing is mounted yet
- **Type:** Smoke
- **Priority:** P1
- **Preconditions:** `/ui-elements/lazy-load/` is open; fresh browser context. Fake clock installed and paused.

**Acceptance criteria**
- The delayed panel is not in the DOM before its time.

**Steps**
1. Check the idle state.
2. Press "Mount lazy panel".

**Expected result**
- Idle: "Mount lazy panel", no panel. After the press: "Loading…", no panel.

## TC-LZY-002 — The panel is mounted exactly after 1200 ms
- **Type:** Functional
- **Priority:** P1
- **Preconditions:** `/ui-elements/lazy-load/` is open; fresh browser context. Fake clock installed and paused.

**Acceptance criteria**
- The panel mounts after the delay.

**Steps**
1. Press the trigger, advance 1199 ms.
2. Advance 1 ms.

**Expected result**
- After 1: no panel, "Loading…". After 2: panel "Hydrated panel" with "Mounted after a ~1.2s delay."; button "Mount lazy panel".

## TC-LZY-003 — Triggering again after the panel is shown mounts it again, once
- **Type:** Edge
- **Priority:** P2
- **Preconditions:** `/ui-elements/lazy-load/` is open; fresh browser context. Fake clock installed and paused. Panel mounted.

**Acceptance criteria**
- A new trigger reloads the panel without duplicating it.

**Steps**
1. Press the trigger again.
2. Advance 1200 ms and resume real time.

**Expected result**
- After 1: "Loading…". After 2: exactly 1 visible panel; button "Mount lazy panel".
