# JavaScript Alerts — test cases

Module: `/ui-elements/javascript-alerts/` · Automated in `apps/qa-practice/tests/javascript-alerts/javascript-alerts.spec.ts`
Source of expected values: QA Practice deployed revision 3d14d23 (`apps/qa-practice/data/ui-modules.data.ts`).

## TC-JSA-001 — No dialog has been handled on load
- **Type:** Smoke
- **Priority:** P1
- **Preconditions:** `/ui-elements/javascript-alerts/` is open; fresh browser context.

**Acceptance criteria**
- The result panel starts empty.

**Steps**
1. Open the page.

**Expected result**
- Result type "none"; "No dialog handled yet." is shown.

## TC-JSA-002 — An alert is shown and accepted
- **Type:** Functional
- **Priority:** P1
- **Preconditions:** `/ui-elements/javascript-alerts/` is open; fresh browser context.

**Acceptance criteria**
- The alert button opens a native alert with the expected message.

**Steps**
1. Click "Click for JS Alert" and accept.

**Expected result**
- One alert "Deployment queued."; result type alert, action accepted.

## TC-JSA-003 — A confirm is reported as accepted or dismissed
- **Type:** Functional
- **Priority:** P1
- **Preconditions:** `/ui-elements/javascript-alerts/` is open; fresh browser context.

**Acceptance criteria**
- Both confirm outcomes are recorded.

**Steps**
1. Click "Click for JS Confirm" and accept; repeat and dismiss.

**Expected result**
- One confirm "Approve production deploy?"; action accepted / dismissed.

## TC-JSA-004 — A required prompt rejects an empty value and re-asks
- **Type:** Negative
- **Priority:** P1
- **Preconditions:** `/ui-elements/javascript-alerts/` is open; fresh browser context.

**Acceptance criteria**
- Whitespace-only input is rejected with a warning and the prompt is shown again.

**Steps**
1. Click "Click for JS Prompt (Required)".
2. Enter spaces, accept the warning, then enter "v1.2.0".

**Expected result**
- Dialog sequence: prompt, alert "A release tag is required.", prompt.
- Result accepted with prompt value v1.2.0.

## TC-JSA-005 — Dismissing the required prompt is reported as dismissed
- **Type:** Negative
- **Priority:** P2
- **Preconditions:** `/ui-elements/javascript-alerts/` is open; fresh browser context.

**Acceptance criteria**
- Cancelling the prompt is not an error loop.

**Steps**
1. Click the required prompt and dismiss it.

**Expected result**
- One dialog; action dismissed; prompt value "(empty)".

## TC-JSA-006 — The optional prompt accepts an empty value
- **Type:** Edge
- **Priority:** P3
- **Preconditions:** `/ui-elements/javascript-alerts/` is open; fresh browser context.

**Acceptance criteria**
- An empty optional note is valid.

**Steps**
1. Click "Click for JS Prompt (Optional)" and accept empty.

**Expected result**
- One prompt "Enter an optional note:"; action accepted; value "(empty)".
