# Toast Messages — test cases

Module: `/ui-elements/toasts/` · Automated in `apps/qa-practice/tests/toasts/toasts.spec.ts`
Source of expected values: QA Practice `ToastsWidget` (`overlays.tsx`) at revision 3d14d23, the production build per `/release-info.json`; identical in the local build d856264. Data: `apps/qa-practice/data/async-overlays.data.ts`.

> **Clock strategy (as TC-NTF).** Auto-dismiss timing uses the installed and paused fake clock, so the boundary is exact. A removed toast stays in the DOM until its exit animation ends, which needs real time: tests resume the clock before checking that it is gone, and manual Close (TC-TST-006) runs on the real clock. The empty state renders on `toasts.length === 0`, so it flips at the dismissal itself and is the timing oracle.

## TC-TST-001 — Two scenario buttons and an empty viewport on load
- **Type:** Smoke
- **Priority:** P1
- **Preconditions:** `/ui-elements/toasts/` is open; fresh browser context.

**Acceptance criteria**
- No toast on load.

**Steps**
1. Open the page.

**Expected result**
- "Show success scenario" and "Show error scenario" enabled; "No active toast messages."; 0 toasts.

## TC-TST-002 — Each scenario shows its title, text, time and live-region role (data-driven: success, error)
- **Type:** Functional
- **Priority:** P1
- **Preconditions:** `/ui-elements/toasts/` is open; fresh browser context. Fake clock installed and paused.

**Acceptance criteria**
- Each kind has its own text and the right ARIA role; only errors can be closed.

**Steps**
1. Press the scenario button.

**Expected result**
- Success: role `status`, "Profile update succeeded" / "Your profile settings were saved successfully.", a time `H:MM:SS`, no Close.
- Error: role `alert`, "Profile update failed" / "We couldn't save your profile settings. Try again.", a time, one "Close error toast".
- The empty state is hidden.

## TC-TST-003 — A success toast stays until 5000 ms and then disappears
- **Type:** Edge
- **Priority:** P1
- **Preconditions:** `/ui-elements/toasts/` is open; fresh browser context. Fake clock installed and paused.

**Acceptance criteria**
- Success toasts auto-dismiss after exactly 5 s.

**Steps**
1. Fire success, advance 4999 ms.
2. Advance 1 ms.
3. Resume real time.

**Expected result**
- After 1: toast visible, empty state hidden. After 2: empty state visible. After 3: 0 toasts.

## TC-TST-004 — An error toast does not auto-dismiss, even after 60 seconds
- **Type:** Negative
- **Priority:** P1
- **Preconditions:** `/ui-elements/toasts/` is open; fresh browser context. Fake clock installed and paused.

**Acceptance criteria**
- Errors stay until the user closes them.

**Steps**
1. Fire error, advance 60 s.

**Expected result**
- The error toast is still visible; 1 toast.

## TC-TST-005 — Toasts stack in firing order and only the success toast expires
- **Type:** Functional
- **Priority:** P2
- **Preconditions:** `/ui-elements/toasts/` is open; fresh browser context. Fake clock installed and paused.

**Acceptance criteria**
- New toasts are appended; expiry removes only the success toast.

**Steps**
1. Fire error, success, error.
2. Advance 5000 ms and resume real time.

**Expected result**
- After 1: 3 toasts titled failed, succeeded, failed. After 2: 0 success, 2 error toasts; empty state hidden.

## TC-TST-006 — Close removes only its own error toast
- **Type:** Functional
- **Priority:** P1
- **Preconditions:** `/ui-elements/toasts/` is open; fresh browser context. Real clock.

**Acceptance criteria**
- Close dismisses exactly one toast.

**Steps**
1. Fire two error toasts.
2. Close the first.
3. Close the remaining one.

**Expected result**
- After 2: 1 error toast. After 3: empty state visible, 0 toasts.
