# Static Table — test cases

Module: `/ui-elements/static-table/` · Automated in `apps/qa-practice/tests/tables/static-table.spec.ts`
Source of expected values: QA Practice deployed revision 3d14d23 (`apps/qa-practice/data/ui-modules.data.ts`).

## TC-TBL-001 — The table shows the expected columns and rows
- **Type:** Smoke
- **Priority:** P1
- **Preconditions:** `/ui-elements/static-table/` is open; fresh browser context.

**Acceptance criteria**
- Fixed columns and four users.

**Steps**
1. Open the page.

**Expected result**
- Columns: Name, Email, Role, Status, Action; 4 body rows; "No row action yet."

## TC-TBL-002 — Each row has the right role and status
- **Type:** Functional
- **Priority:** P1
- **Preconditions:** `/ui-elements/static-table/` is open; fresh browser context.

**Acceptance criteria**
- Cells are found by column header and row content, not by index.

**Steps**
1. For each user, read Name, Role, Status and Email cells.

**Expected result**
- Role and Status match the data set; Email is a valid address.

## TC-TBL-003 — View reports the row it belongs to
- **Type:** Functional
- **Priority:** P2
- **Preconditions:** `/ui-elements/static-table/` is open; fresh browser context.

**Acceptance criteria**
- The row action acts on its own row.

**Steps**
1. Press View in the "Alex Reed" row.

**Expected result**
- "Opened Alex Reed".

## TC-TBL-004 — Every email in the table is unique
- **Type:** Edge
- **Priority:** P3
- **Preconditions:** `/ui-elements/static-table/` is open; fresh browser context.

**Acceptance criteria**
- Data integrity of the Email column.

**Steps**
1. Read every Email cell.

**Expected result**
- 4 emails, all distinct.
