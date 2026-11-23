# Modals — test cases

Module: `/ui-elements/modals/` · Automated in `apps/qa-practice/tests/modals/modals.spec.ts`

## TC-MOD-001 — Opening the modal focuses the title field
- **Type:** Smoke
- **Priority:** P1
- **Preconditions:** Modals page is open, no rows added.

**Acceptance criteria**
- "Open modal" shows the "New entry" dialog with focus in its first field.

**Steps**
1. Press "Open modal".

**Expected result**
- The dialog is visible; "Defect title" is focused; Save and Cancel are visible.

## TC-MOD-002 — Saving a title adds a row
- **Type:** Functional
- **Priority:** P1
- **Preconditions:** Modals page is open.

**Acceptance criteria**
- A non-empty title is saved as a new row and the dialog closes.

**Steps**
1. Open the dialog.
2. Enter "Checkout total rounding" and press Save.

**Expected result**
- The dialog closes; the newest row reads "Checkout total rounding"; the empty-state text is gone.

## TC-MOD-003 — Empty or whitespace-only title is not saved
- **Type:** Negative
- **Priority:** P1
- **Preconditions:** Modals page is open.

**Acceptance criteria**
- Save is ignored when the title is empty after trimming.

**Steps**
1. Open the dialog.
2. Press Save with an empty title, and again with only spaces.

**Expected result**
- The dialog stays open, no row is added, the empty-state text remains.

## TC-MOD-004 — Surrounding spaces are trimmed
- **Type:** Edge
- **Priority:** P3
- **Preconditions:** Modals page is open.

**Acceptance criteria**
- Saved titles are trimmed.

**Steps**
1. Save "   Login timeout   ".

**Expected result**
- The newest row reads "Login timeout".

## TC-MOD-005 — Escape, Cancel and the backdrop close without saving
- **Type:** Functional
- **Priority:** P1
- **Preconditions:** Modals page is open.

**Acceptance criteria**
- All three dismiss paths close the dialog and discard the typed title.

**Steps**
1. Open the dialog, type a title, press Escape.
2. Repeat with Cancel.
3. Repeat by clicking the backdrop.

**Expected result**
- The dialog closes each time; no row is added.

## TC-MOD-006 — Clicking inside the dialog does not close it
- **Type:** Negative
- **Priority:** P2
- **Preconditions:** Modals page is open.

**Acceptance criteria**
- Only the backdrop, Escape and Cancel close the dialog.

**Steps**
1. Open the dialog.
2. Click inside the dialog box.

**Expected result**
- The dialog stays open.

## TC-MOD-007 — Rows keep insertion order
- **Type:** Functional
- **Priority:** P2
- **Preconditions:** Modals page is open.

**Acceptance criteria**
- Rows are appended in the order they were saved.

**Steps**
1. Save "First defect".
2. Save "Second defect".

**Expected result**
- Rows read "First defect", "Second defect"; the latest row is "Second defect".
