# Notifications — test cases

Module: `/ui-elements/notifications/` · Automated in `apps/qa-practice/tests/notifications/notifications.spec.ts`
Source of expected values: QA Practice deployed revision 3d14d23 (`apps/qa-practice/data/phase2c.data.ts`).

> **Clock strategy.** Auto-dismiss timing (TC-NTF-003/004) uses Playwright's fake clock, installed and paused, so the assertions are exact. Manual Close (TC-NTF-006/007) runs on the real clock: with the fake clock installed, a toast removed by Close never finished its exit animation (12/12 local attempts, all four kinds, also after `clock.resume()`), while on the real clock it was removed every time (4/4). That is a test-harness interaction, not a product defect. The root cause inside the animation library is UNKNOWN.

## TC-NTF-001 — Four triggers and an empty viewport on load
- **Type:** Smoke
- **Priority:** P1
- **Preconditions:** `/ui-elements/notifications/` is open; fresh browser context.

**Acceptance criteria**
- No toast on load.

**Steps**
1. Open the page.

**Expected result**
- Success/Info/Warning/Error enabled; "No notifications yet."; 0 toasts.

## TC-NTF-002 — Each kind shows its message with the right live-region role (data-driven: 4 rows)
- **Type:** Functional
- **Priority:** P1
- **Preconditions:** `/ui-elements/notifications/` is open; fresh browser context. Fake clock.

**Acceptance criteria**
- Text, role and close button per kind.

**Steps**
1. Press each trigger.

**Expected result**
- Expected text; role status (success/info/warning) or alert (error); Close button; empty state hidden.

## TC-NTF-003 — Auto-dismiss happens exactly at the documented delay (data-driven: 3 rows)
- **Type:** Edge
- **Priority:** P1
- **Preconditions:** `/ui-elements/notifications/` is open; fresh browser context. Fake clock installed **and paused** (only `advance()` moves time).

**Acceptance criteria**
- The toast is dismissed exactly at its delay: not 1 ms earlier, and at the delay itself.
- After the exit animation the toast is gone from the DOM.

**Steps**
1. Press the trigger.
2. Advance delay − 1 ms.
3. Advance 1 ms.
4. Resume real time.

**Expected result**
- At delay − 1 ms: the toast is visible and the empty state is hidden.
- At the delay: the empty state "No notifications yet." is visible.
- After resuming: the toast element is removed.
- Delays: success/info 3200 ms, warning 4500 ms.

**Why the empty state is the oracle (2026-11-23)**
- The empty state renders on `toasts.length === 0` (app state), so it flips at the dismissal itself.
- The toast element alone does not show that: a dismissed toast stays in the DOM during its exit animation.
- With the old install-only clock and a 500 ms real delay, the toast had already been dismissed at "delay − 1 ms" (empty state visible), but the toast was still counted. The old check could not see an early dismissal.
- The exit animation does not finish on the paused clock; after `resume()` the toast was removed within 1.8–3.4 real seconds (Chromium, Firefox, WebKit).

## TC-NTF-004 — Error does not auto-dismiss, even after 60 seconds
- **Type:** Negative
- **Priority:** P1
- **Preconditions:** `/ui-elements/notifications/` is open; fresh browser context. Fake clock.

**Acceptance criteria**
- Errors persist until the user acts.

**Steps**
1. Press Error.
2. Advance 60 s.

**Expected result**
- Error toast still visible; 1 toast.

## TC-NTF-005 — Toasts stack in the order they were fired
- **Type:** Functional
- **Priority:** P2
- **Preconditions:** `/ui-elements/notifications/` is open; fresh browser context. Fake clock.

**Acceptance criteria**
- Stacking order is the firing order.

**Steps**
1. Press Warning, Success, Error.

**Expected result**
- 3 toasts in that order.

## TC-NTF-006 — Close removes a toast before its timer (data-driven: 4 rows)
- **Type:** Functional
- **Priority:** P1
- **Preconditions:** `/ui-elements/notifications/` is open; fresh browser context. Real clock.

**Acceptance criteria**
- Close removes the toast within 2× the exit animation.

**Steps**
1. Press a trigger.
2. Press its Close button.

**Expected result**
- Toast gone within 2000 ms; empty state visible.

## TC-NTF-007 — Closing one toast leaves the others intact
- **Type:** Edge
- **Priority:** P2
- **Preconditions:** `/ui-elements/notifications/` is open; fresh browser context. Real clock.

**Acceptance criteria**
- Close only affects its own toast.

**Steps**
1. Press Warning and Error.
2. Close Warning.

**Expected result**
- Warning gone; Error still visible; 1 toast.
