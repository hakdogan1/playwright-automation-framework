# Double Click — test cases

Module: `/ui-elements/double-click/` · Automated in `apps/qa-practice/tests/mouse/double-click.spec.ts`
Source of expected values: QA Practice deployed revision 3d14d23 (`apps/qa-practice/data/ui-modules.data.ts`).

## TC-DBL-001 — The label is shown and no editor is open
- **Type:** Smoke
- **Priority:** P1
- **Preconditions:** `/ui-elements/double-click/` is open; fresh browser context.

**Acceptance criteria**
- Read mode on load.

**Steps**
1. Open the page.

**Expected result**
- Label reads "Quality engineering @ scale"; no editor exists.

## TC-DBL-002 — Double-click opens the editor and Save keeps the edit
- **Type:** Functional
- **Priority:** P1
- **Preconditions:** `/ui-elements/double-click/` is open; fresh browser context.

**Acceptance criteria**
- Double-click enters edit mode with the current value; Save writes the new value.

**Steps**
1. Double-click the label.
2. Replace the text with "Shift-left testing" and press Save.

**Expected result**
- Editor focused with the current value.
- After Save the editor is gone and the label shows the new text.

## TC-DBL-003 — A single click does not open the editor
- **Type:** Negative
- **Priority:** P2
- **Preconditions:** `/ui-elements/double-click/` is open; fresh browser context.

**Acceptance criteria**
- Only a double click enters edit mode.

**Steps**
1. Click the label once.

**Expected result**
- No editor; label unchanged.

## TC-DBL-004 — Unicode and symbols are saved verbatim
- **Type:** Edge
- **Priority:** P3
- **Preconditions:** `/ui-elements/double-click/` is open; fresh browser context.

**Acceptance criteria**
- Text is stored as typed (no HTML interpretation).

**Steps**
1. Save "Kalite güvencesi ✓ <b>ğüşıöç</b>".

**Expected result**
- The label shows exactly that text, markup included as text.
