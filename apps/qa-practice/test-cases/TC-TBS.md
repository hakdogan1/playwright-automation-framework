# Tables — test cases

Module: `/ui-elements/tables/` · Automated in `apps/qa-practice/tests/tables/tables-route.spec.ts`
Source of expected values: QA Practice `TablesWidget` (`data.tsx`) at revision 3d14d23, the production build per `/release-info.json`; identical in the local build d856264. Data: `apps/qa-practice/data/phase2c.data.ts`.

> **Same component as Dynamic Table.** `TablesWidget` returns `<DynamicTableWidget />`. The widget's behaviour is covered in depth by TC-DTB-001…009 on `/ui-elements/dynamic-table/`; it is not re-automated here. These cases only prove that this route renders and wires the widget (`DynamicTablePage` with the Tables route).

## TC-TBS-001 — The Tables route renders the dynamic users table
- **Type:** Smoke
- **Priority:** P1
- **Preconditions:** `/ui-elements/tables/` is open; fresh browser context.

**Acceptance criteria**
- The route shows the dynamic table with its initial data.

**Steps**
1. Open the page.

**Expected result**
- URL ends with `/ui-elements/tables/`; heading "Tables"; "8 matches"; the first 4 users; "Page 1 / 2".

## TC-TBS-002 — Search and status filter work on this route
- **Type:** Functional
- **Priority:** P2
- **Preconditions:** `/ui-elements/tables/` is open; fresh browser context.

**Acceptance criteria**
- The widget is interactive on this route.

**Steps**
1. Filter by "Suspended" and search "engineer".

**Expected result**
- Only "Ivy Chen"; "1 match".

## TC-TBS-003 — A search without matches shows the empty state on this route
- **Type:** Negative
- **Priority:** P2
- **Preconditions:** `/ui-elements/tables/` is open; fresh browser context.

**Acceptance criteria**
- The empty state works on this route.

**Steps**
1. Search "zzz".

**Expected result**
- "0 matches"; "No rows match this filter."; Next disabled.
