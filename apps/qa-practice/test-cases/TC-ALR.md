# Alerts — test cases

Module: `/ui-elements/alerts/` · Automated in `apps/qa-practice/tests/alerts/alerts.spec.ts`
Source of expected values: QA Practice `AlertsWidget` (`overlays.tsx`) at revision 3d14d23, the production build per `/release-info.json`; identical in the local build d856264. Data: `apps/qa-practice/data/async-overlays.data.ts`.

> **Dialogs.** The page opens a native `window.confirm`. `AlertsPage.answerConfirm()` waits for the dialog event before clicking and answers it, so the page never blocks. The JavaScript Alerts module (TC-JSA) covers alert/confirm/prompt in depth; this module has one confirm only.

## TC-ALR-001 — Accepting the confirm marks the chip "accepted"
- **Type:** Smoke
- **Priority:** P1
- **Preconditions:** `/ui-elements/alerts/` is open; fresh browser context.

**Acceptance criteria**
- Accepting the native confirm is reflected in the chip.

**Steps**
1. Check the chip.
2. Press "Fire confirm" and accept.

**Expected result**
- Chip "none" before; a `confirm` dialog with "Approve the deployment?"; chip "accepted".

## TC-ALR-002 — Dismissing the confirm marks the chip "dismissed"
- **Type:** Negative
- **Priority:** P1
- **Preconditions:** `/ui-elements/alerts/` is open; fresh browser context.

**Acceptance criteria**
- Cancelling the confirm is reflected as a refusal.

**Steps**
1. Press "Fire confirm" and dismiss.

**Expected result**
- A `confirm` dialog with "Approve the deployment?"; chip "dismissed".

## TC-ALR-003 — Each confirm is a new dialog and the chip follows the last answer
- **Type:** Edge
- **Priority:** P2
- **Preconditions:** `/ui-elements/alerts/` is open; fresh browser context.

**Acceptance criteria**
- Every press opens a fresh dialog; the chip shows the latest answer only.

**Steps**
1. Fire and accept.
2. Fire and dismiss.
3. Fire and accept.

**Expected result**
- Three dialogs with the same message; chip "accepted", "dismissed", "accepted".
