# Dynamic Table — test cases

Module: `/ui-elements/dynamic-table/` · Automated in `apps/qa-practice/tests/tables/dynamic-table.spec.ts`
Source of expected values: QA Practice deployed revision 3d14d23 (`apps/qa-practice/data/phase2c.data.ts`).

## TC-DTB-001 — Shows 8 users on two pages of 4
- **Type:** Smoke
- **Priority:** P1
- **Preconditions:** `/ui-elements/dynamic-table/` is open; fresh browser context (8 seeded users, 4 per page).

**Acceptance criteria**
- Initial count, page and paging buttons.

**Steps**
1. Open the page.

**Expected result**
- "8 matches"; first 4 users; "Page 1 / 2"; Prev disabled, Next enabled.

## TC-DTB-002 — Search matches any column, ignoring case
- **Type:** Functional
- **Priority:** P1
- **Preconditions:** `/ui-elements/dynamic-table/` is open; fresh browser context (8 seeded users, 4 per page).

**Acceptance criteria**
- Case-insensitive search over name/email/role/status.

**Steps**
1. Search "qa".
2. Search "NOOR".

**Expected result**
- Users whose role contains "qa"; then "1 match" Noor Khan.

## TC-DTB-003 — Status filter and search combine
- **Type:** Functional
- **Priority:** P1
- **Preconditions:** `/ui-elements/dynamic-table/` is open; fresh browser context (8 seeded users, 4 per page).

**Acceptance criteria**
- Filter and search are AND-ed.

**Steps**
1. Filter Suspended.
2. Search "engineer".

**Expected result**
- Suspended users; then only Ivy Chen, "1 match".

## TC-DTB-004 — A search without matches shows the empty state and disables paging
- **Type:** Negative
- **Priority:** P2
- **Preconditions:** `/ui-elements/dynamic-table/` is open; fresh browser context (8 seeded users, 4 per page).

**Acceptance criteria**
- Empty result is explicit.

**Steps**
1. Search "zzz".

**Expected result**
- "0 matches"; "No rows match this filter."; "Page 1 / 1"; Prev and Next disabled.

## TC-DTB-005 — Sorting by name toggles ascending and descending
- **Type:** Functional
- **Priority:** P2
- **Preconditions:** `/ui-elements/dynamic-table/` is open; fresh browser context (8 seeded users, 4 per page).

**Acceptance criteria**
- Header shows the direction; rows follow it.

**Steps**
1. Click Name.
2. Click Name again.

**Expected result**
- "Name ↑" with A→Z first page; "Name ↓" with Z→A first page.

## TC-DTB-006 — Next shows the second page and is disabled on the last page
- **Type:** Edge
- **Priority:** P2
- **Preconditions:** `/ui-elements/dynamic-table/` is open; fresh browser context (8 seeded users, 4 per page).

**Acceptance criteria**
- Paging boundary.

**Steps**
1. Press Next.

**Expected result**
- "Page 2 / 2"; users 5–8; Next disabled; Prev enabled.

## TC-DTB-007 — Editing a row and saving updates it
- **Type:** Functional
- **Priority:** P1
- **Preconditions:** `/ui-elements/dynamic-table/` is open; fresh browser context (8 seeded users, 4 per page).

**Acceptance criteria**
- Inline edit persists in the table (client state only).

**Steps**
1. Edit Mira: role "QA Manager", status Invited, Save.

**Expected result**
- Row shows QA Manager / Invited; "Updated <name>".

## TC-DTB-008 — Cancelling an edit keeps the original values
- **Type:** Negative
- **Priority:** P2
- **Preconditions:** `/ui-elements/dynamic-table/` is open; fresh browser context (8 seeded users, 4 per page).

**Acceptance criteria**
- Cancel discards changes.

**Steps**
1. Edit Mira, change role, Cancel.

**Expected result**
- Original role; "Cancelled editing <name>".

## TC-DTB-009 — Deleting rows updates the count and collapses empty pages
- **Type:** Edge
- **Priority:** P2
- **Preconditions:** `/ui-elements/dynamic-table/` is open; fresh browser context (8 seeded users, 4 per page).

**Acceptance criteria**
- Page index clamps when the last page empties.

**Steps**
1. Go to page 2; delete its 4 rows.

**Expected result**
- "4 matches"; "Page 1 / 1"; first 4 users.
