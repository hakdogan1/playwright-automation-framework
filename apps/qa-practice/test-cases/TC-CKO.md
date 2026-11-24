# Checkout Form — test cases

Module: `/ui-elements/form-checkout/` · Automated in `apps/qa-practice/tests/forms/form-checkout.spec.ts`
Source of expected values: QA Practice `form-lab.tsx` (`form-checkout` config) at revision 3d14d23, the production build per `/release-info.json`; identical in the local build d856264. Data: `apps/qa-practice/data/form-lab.data.ts` (synthetic, `.test` mail domain).

> **Scope and clock.** Client-only Form Lab form (`ConfiguredForm`): `form-lab.tsx` has no network or storage calls; the Production Guard reports confirm it. The page object (`LabFormPage`, shared by the six configured forms) installs and pauses the fake clock; `submit()` advances exactly the 360 ms validation delay.

> **Payment method.** A select with two test options (`test-success`, `test-declined`); the form has no card fields.

## TC-CKO-001 — A complete order with the successful test method is submitted
- **Type:** Smoke
- **Priority:** P1
- **Preconditions:** `/ui-elements/form-checkout/` is open; fresh browser context; fake clock installed and paused.

**Acceptance criteria**
- Valid order → confirmation.

**Steps**
1. Fill all fields, "Test card - successful", both checkboxes; submit.

**Expected result**
- "Order submitted successfully. Confirmation VL-2042 is ready."

## TC-CKO-002 — The declined test method blocks checkout
- **Type:** Negative
- **Priority:** P1
- **Preconditions:** `/ui-elements/form-checkout/` is open; fresh browser context; fake clock installed and paused.

**Acceptance criteria**
- A declined method is a blocking error.

**Steps**
1. Same with "Test card - declined".

**Expected result**
- ["Declined payment blocks checkout."]

## TC-CKO-003 — An empty submit reports all eight issues in order
- **Type:** Negative
- **Priority:** P1
- **Preconditions:** `/ui-elements/form-checkout/` is open; fresh browser context; fake clock installed and paused.

**Acceptance criteria**
- All issues are listed in source order.

**Steps**
1. Submit with empty fields.

**Expected result**
- Five "… is required." messages (Customer Email, Full Name, Shipping Address, City, Payment Method), then "Customer Email must be valid.", "Review order must be confirmed.", "Terms not accepted."; "8 validation issues found."

## TC-CKO-004 — Each confirmation checkbox is required (data-driven: review order, accept terms)
- **Type:** Negative
- **Priority:** P1
- **Preconditions:** `/ui-elements/form-checkout/` is open; fresh browser context; fake clock installed and paused.

**Acceptance criteria**
- Both checkboxes block the order on their own.

**Steps**
1. Valid order with one checkbox unchecked; submit.

**Expected result**
- ["Review order must be confirmed."] or ["Terms not accepted."].

## TC-CKO-005 — Fixing the errors lets the next submit succeed; Reset clears the form
- **Type:** Functional
- **Priority:** P2
- **Preconditions:** `/ui-elements/form-checkout/` is open; fresh browser context; fake clock installed and paused.

**Acceptance criteria**
- Errors are recomputed on each submit; Reset clears selects and checkboxes.

**Steps**
1. Declined method and terms unchecked; submit.
2. Choose the successful method, accept terms; submit.
3. Press Reset.

**Expected result**
- After 1: ["Declined payment blocks checkout.", "Terms not accepted."]. After 2: confirmation, no errors.
- After 3: "Awaiting submission."; payment method empty; "Review Order" unchecked.
