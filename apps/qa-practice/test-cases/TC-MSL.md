# Multi Select — test cases

Module: `/ui-elements/multi-select/` · Automated in `apps/qa-practice/tests/multi-select/multi-select.spec.ts`
Source of expected values: QA Practice deployed revision 3d14d23 (`apps/qa-practice/data/ui-modules.data.ts`).

## TC-MSL-001 — Every skill is offered and nothing is picked
- **Type:** Smoke
- **Priority:** P1
- **Preconditions:** `/ui-elements/multi-select/` is open; fresh browser context.

**Acceptance criteria**
- All five skills are offered; no chip exists initially.

**Steps**
1. Open the page.

**Expected result**
- Options: Cypress, Playwright, k6, Postman, Selenium.
- No chips; "No skills picked yet." is shown.

## TC-MSL-002 — Picked skills appear as chips in pick order
- **Type:** Functional
- **Priority:** P1
- **Preconditions:** `/ui-elements/multi-select/` is open; fresh browser context.

**Acceptance criteria**
- Each picked skill becomes a chip, in the order picked.

**Steps**
1. Pick Playwright, then k6.

**Expected result**
- Chips: Playwright, k6; the empty state is hidden.

## TC-MSL-003 — Clicking a picked option again removes it
- **Type:** Functional
- **Priority:** P2
- **Preconditions:** `/ui-elements/multi-select/` is open; fresh browser context.

**Acceptance criteria**
- Options toggle.

**Steps**
1. Pick Cypress and Postman.
2. Click Cypress again.

**Expected result**
- Only the Postman chip remains.

## TC-MSL-004 — The chip remove button removes a skill and the empty state returns
- **Type:** Negative
- **Priority:** P2
- **Preconditions:** `/ui-elements/multi-select/` is open; fresh browser context.

**Acceptance criteria**
- The × button removes its chip; with no chips the empty state is shown.

**Steps**
1. Pick Selenium.
2. Press "Remove selenium".

**Expected result**
- No chips; "No skills picked yet." is visible.

## TC-MSL-005 — All skills can be picked at once
- **Type:** Edge
- **Priority:** P3
- **Preconditions:** `/ui-elements/multi-select/` is open; fresh browser context.

**Acceptance criteria**
- There is no limit on the number of picked skills.

**Steps**
1. Pick all five skills in reverse order.

**Expected result**
- Five chips in the order picked.
