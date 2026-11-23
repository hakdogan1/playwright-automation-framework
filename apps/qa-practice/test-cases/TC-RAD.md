# Radio Buttons — test cases

Module: `/ui-elements/radio/` · Automated in `apps/qa-practice/tests/radio/radio.spec.ts`
Source of expected values: QA Practice deployed revision 3d14d23 (`apps/qa-practice/data/ui-modules.data.ts`).

## TC-RAD-001 — The plan group defaults to Starter
- **Type:** Smoke
- **Priority:** P1
- **Preconditions:** `/ui-elements/radio/` is open; fresh browser context.

**Acceptance criteria**
- The "Plan tier" group offers three plans with Starter selected.

**Steps**
1. Open the page.

**Expected result**
- Three radios in the group; Starter checked; summary "Plan: Starter".

## TC-RAD-002 — Choosing a plan selects only that option
- **Type:** Functional
- **Priority:** P1
- **Preconditions:** `/ui-elements/radio/` is open; fresh browser context.

**Acceptance criteria**
- Exactly one plan is selected at a time.

**Steps**
1. Check each of Starter, Pro, Enterprise.

**Expected result**
- Summary reads "Plan: <plan>"; the other two radios are unchecked.

## TC-RAD-003 — Clicking the selected option keeps it selected
- **Type:** Negative
- **Priority:** P2
- **Preconditions:** `/ui-elements/radio/` is open; fresh browser context.

**Acceptance criteria**
- A radio cannot be deselected by clicking it again.

**Steps**
1. Click "Starter" while it is selected.

**Expected result**
- Starter stays checked; summary "Plan: Starter".

## TC-RAD-004 — Arrow keys move the selection within the group
- **Type:** Edge
- **Priority:** P2
- **Preconditions:** `/ui-elements/radio/` is open; fresh browser context.

**Acceptance criteria**
- Native keyboard behaviour of a radio group is preserved.

**Steps**
1. Focus "Starter".
2. Press ArrowDown.

**Expected result**
- Pro is checked and focused; summary "Plan: Pro".
