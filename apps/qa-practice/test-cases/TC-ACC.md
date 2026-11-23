# Accordions — test cases

Module: `/ui-elements/accordions/` · Automated in `apps/qa-practice/tests/accordions/accordions.spec.ts`
Source of expected values: QA Practice deployed revision 3d14d23 (`apps/qa-practice/data/ui-modules.data.ts`).

## TC-ACC-001 — Account is expanded by default, the others collapsed
- **Type:** Smoke
- **Priority:** P1
- **Preconditions:** `/ui-elements/accordions/` is open; fresh browser context.

**Acceptance criteria**
- One section is open on load.

**Steps**
1. Open the page.

**Expected result**
- Headers: Account, Privacy, Billing.
- Account aria-expanded="true" with its panel text; Privacy and Billing "false".

## TC-ACC-002 — Opening a section closes the previously open one
- **Type:** Functional
- **Priority:** P1
- **Preconditions:** `/ui-elements/accordions/` is open; fresh browser context.

**Acceptance criteria**
- Single-open behaviour.

**Steps**
1. Click "Privacy".

**Expected result**
- Privacy expanded with its text; Account collapsed and its panel removed.

## TC-ACC-003 — Clicking the open section collapses it
- **Type:** Negative
- **Priority:** P2
- **Preconditions:** `/ui-elements/accordions/` is open; fresh browser context.

**Acceptance criteria**
- All sections can be closed.

**Steps**
1. Click "Account" while it is open.

**Expected result**
- Every header has aria-expanded="false"; no panel is rendered.

## TC-ACC-004 — Each header controls exactly its own panel
- **Type:** Edge
- **Priority:** P2
- **Preconditions:** `/ui-elements/accordions/` is open; fresh browser context.

**Acceptance criteria**
- aria-controls points to the panel that is shown.

**Steps**
1. Open Privacy, then Billing.

**Expected result**
- The panel referenced by each header's aria-controls is visible and shows that section's text.
