# Checkboxes — test cases

Module: `/ui-elements/checkbox/` · Automated in `apps/qa-practice/tests/checkbox/checkbox.spec.ts`
Source of expected values: QA Practice deployed revision 3d14d23 (`apps/qa-practice/data/ui-modules.data.ts`).

## TC-CHK-001 — All checkboxes start unchecked
- **Type:** Smoke
- **Priority:** P1
- **Preconditions:** `/ui-elements/checkbox/` is open; fresh browser context.

**Acceptance criteria**
- Parent and child checkboxes are unchecked on load.

**Steps**
1. Open the page.

**Expected result**
- "Select all squads", Identity, Wallet and Admin are unchecked.
- Parent state reads "none selected".

## TC-CHK-002 — "Select all" checks and unchecks every child
- **Type:** Functional
- **Priority:** P1
- **Preconditions:** `/ui-elements/checkbox/` is open; fresh browser context.

**Acceptance criteria**
- The parent controls all children in both directions.

**Steps**
1. Check "Select all squads".
2. Uncheck it.

**Expected result**
- After check: all children checked, state "all selected".
- After uncheck: all unchecked, state "none selected".

## TC-CHK-003 — A partial selection makes the parent indeterminate
- **Type:** Functional
- **Priority:** P1
- **Preconditions:** `/ui-elements/checkbox/` is open; fresh browser context.

**Acceptance criteria**
- With some but not all children checked, the parent is indeterminate and not checked.

**Steps**
1. Check "Wallet" only.

**Expected result**
- Parent `indeterminate` is true and it is not checked.
- State reads "indeterminate".

## TC-CHK-004 — Checking every child one by one checks the parent
- **Type:** Edge
- **Priority:** P2
- **Preconditions:** `/ui-elements/checkbox/` is open; fresh browser context.

**Acceptance criteria**
- The parent reflects children checked individually.

**Steps**
1. Check Identity, Wallet, Admin.

**Expected result**
- Parent checked, not indeterminate; state "all selected".

## TC-CHK-005 — Clicking an indeterminate parent selects all children
- **Type:** Edge
- **Priority:** P2
- **Preconditions:** `/ui-elements/checkbox/` is open; fresh browser context.

**Acceptance criteria**
- Activating an indeterminate parent selects every child.

**Steps**
1. Check "Identity".
2. Click "Select all squads".

**Expected result**
- All children checked; state "all selected".

## TC-CHK-006 — Unchecking one child of a full selection returns to indeterminate
- **Type:** Negative
- **Priority:** P2
- **Preconditions:** `/ui-elements/checkbox/` is open; fresh browser context.

**Acceptance criteria**
- Removing one child from a full selection unchecks the parent.

**Steps**
1. Check "Select all squads".
2. Uncheck "Admin".

**Expected result**
- Parent unchecked and indeterminate; state "indeterminate".
