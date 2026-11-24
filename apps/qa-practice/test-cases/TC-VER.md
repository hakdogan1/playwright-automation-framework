# Validation Errors — test cases

Module: `/ui-elements/form-validation-errors/` · Automated in `apps/qa-practice/tests/forms/form-validation-errors.spec.ts`
Source of expected values: QA Practice `form-lab.tsx` (`ValidationErrorsLab`) at revision 3d14d23, the production build per `/release-info.json`; identical in the local build d856264. Data: `apps/qa-practice/data/form-lab.data.ts` (synthetic, `.test` mail domain).

> **Scope.** Nine buttons, each showing one canned negative result; no fields and no timers.

## TC-VER-001 — Nine scenario buttons and an idle result on load
- **Type:** Smoke
- **Priority:** P1
- **Preconditions:** `/ui-elements/form-validation-errors/` is open; fresh browser context.

**Acceptance criteria**
- All scenarios are offered; nothing is shown yet.

**Steps**
1. Open the page.

**Expected result**
- Buttons Empty submit, Invalid email, Short password, Mismatched passwords, Invalid phone, Expired card, Invalid CVV, Unchecked terms, Server error simulation; idle; "Choose a negative scenario."; no errors.

## TC-VER-002 — Each scenario shows its error (data-driven: 9 rows)
- **Type:** Negative
- **Priority:** P1
- **Preconditions:** `/ui-elements/form-validation-errors/` is open; fresh browser context.

**Acceptance criteria**
- Each button shows exactly its message as message and error.

**Steps**
1. Press the scenario button.

**Expected result**
- `data-state="error"`, `role="status"`; message and error list exactly the scenario text (e.g. "Server error simulation: 500 response, retry allowed."); "Error toast: Fix validation errors before submitting."

## TC-VER-003 — A second scenario replaces the first
- **Type:** Edge
- **Priority:** P2
- **Preconditions:** `/ui-elements/form-validation-errors/` is open; fresh browser context.

**Acceptance criteria**
- Only the latest scenario is shown.

**Steps**
1. Press "Empty submit", then "Server error simulation".

**Expected result**
- Errors exactly ["Server error simulation: 500 response, retry allowed."]
