# Pagination — test cases

Module: `/ui-elements/pagination/` · Automated in `apps/qa-practice/tests/tables/pagination.spec.ts`
Source of expected values: QA Practice deployed revision 3d14d23 (`apps/qa-practice/data/ui-modules.data.ts`).

## TC-PAG-001 — The first page shows records 1–5 and Previous is disabled
- **Type:** Smoke
- **Priority:** P1
- **Preconditions:** `/ui-elements/pagination/` is open; fresh browser context.

**Acceptance criteria**
- Page 1 of 3 with five records.

**Steps**
1. Open the page.

**Expected result**
- "Page 1 of 3"; records 1–5; "Showing records 1–5 of 15"; Previous disabled; page 1 current.

## TC-PAG-002 — Next moves to page 2 and Previous returns
- **Type:** Functional
- **Priority:** P1
- **Preconditions:** `/ui-elements/pagination/` is open; fresh browser context.

**Acceptance criteria**
- Sequential navigation.

**Steps**
1. Press Next.
2. Press Previous.

**Expected result**
- Page 2 shows records 6–10 and "Showing records 6–10 of 15"; Previous returns to page 1.

## TC-PAG-003 — The last page shows the final records and disables Next
- **Type:** Edge
- **Priority:** P1
- **Preconditions:** `/ui-elements/pagination/` is open; fresh browser context.

**Acceptance criteria**
- Upper boundary.

**Steps**
1. Press page 3.

**Expected result**
- "Page 3 of 3"; records 11–15; Next disabled; page 3 current.

## TC-PAG-004 — Page buttons jump directly and mark the current page
- **Type:** Functional
- **Priority:** P2
- **Preconditions:** `/ui-elements/pagination/` is open; fresh browser context.

**Acceptance criteria**
- Direct navigation and aria-current.

**Steps**
1. Press 3, 1, 2.

**Expected result**
- aria-current follows the pressed page; first record matches that page.

## TC-PAG-005 — Record statuses follow the data set
- **Type:** Edge
- **Priority:** P3
- **Preconditions:** `/ui-elements/pagination/` is open; fresh browser context.

**Acceptance criteria**
- Every third record (1, 4, 7 …) is Ready, others Reviewed.

**Steps**
1. Read statuses on page 1.

**Expected result**
- Records 1 and 4 Ready; 2, 3, 5 Reviewed.

## TC-PAG-006 — Boundary controls are disabled only at the ends
- **Type:** Negative
- **Priority:** P1
- **Preconditions:** `/ui-elements/pagination/` is open; fresh browser context.

**Acceptance criteria**
- Previous disabled only on page 1; Next only on page 3.

**Steps**
1. Visit pages 1, 2, 3.

**Expected result**
- Page 1: Previous disabled, Next enabled. Page 2: both enabled. Page 3: Previous enabled, Next disabled.
