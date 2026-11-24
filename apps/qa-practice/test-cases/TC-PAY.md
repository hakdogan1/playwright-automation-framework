# Payment Form — test cases

Module: `/ui-elements/form-payment/` · Automated in `apps/qa-practice/tests/forms/form-payment.spec.ts`
Source of expected values: QA Practice `form-lab.tsx` (`form-payment` config) at revision 3d14d23, the production build per `/release-info.json`; identical in the local build d856264. Data: `apps/qa-practice/data/form-lab.data.ts` (synthetic, `.test` mail domain).

> **Scope and clock.** Client-only Form Lab form (`ConfiguredForm`): `form-lab.tsx` has no network or storage calls; the Production Guard reports confirm it. The page object (`LabFormPage`, shared by the six configured forms) installs and pauses the fake clock; `submit()` advances exactly the 360 ms validation delay.

> **No card numbers.** No card number is entered, not even a published test card. The card field always holds letters (`abcd efgh ijkl mnop`), so "Card number format is invalid." is always reported and the other rules are checked next to it.

> **Not automated: the test-card flows** (4242… success, 4000…0002 declined, 4000…3155 authentication required). They need a card number in a field, which this framework does not do against the production site. They can be run against a local build of the app once the owner decides how (a separate local-only project needs a runner-config change, which AI Guard requires a human to approve).

> **Not asserted (OBS-09).** The required messages say "Cvv is required." and "Billing Zip is required." (labels "CVV", "Billing ZIP"); the expiry check is a fixed regular expression (years 26–99), so an expired date such as 01/26 passes in November 2026.

## TC-PAY-001 — The test-card warning and every field are shown
- **Type:** Smoke
- **Priority:** P1
- **Preconditions:** `/ui-elements/form-payment/` is open; fresh browser context; fake clock installed and paused.

**Acceptance criteria**
- The form is complete and warns against real cards.

**Steps**
1. Open the page.

**Expected result**
- "Test card data only. Do not enter real card information."; all six fields visible; expiry placeholder "MM/YY"; button "Pay with test card"; "Awaiting submission."

## TC-PAY-002 — An empty submit reports all eight issues in order
- **Type:** Negative
- **Priority:** P1
- **Preconditions:** `/ui-elements/form-payment/` is open; fresh browser context; fake clock installed and paused.

**Acceptance criteria**
- All issues are listed in source order.

**Steps**
1. Submit with empty fields.

**Expected result**
- ["Cardholder Name is required.", "Card Number is required.", "Expiry Date is required.", "Cvv is required.", "Billing Zip is required.", "Card number format is invalid.", "Expiry Date is required and must be future MM/YY.", "CVV length is invalid."]; "8 validation issues found."

## TC-PAY-003 — A card number with letters is rejected as the only issue
- **Type:** Negative
- **Priority:** P1
- **Preconditions:** `/ui-elements/form-payment/` is open; fresh browser context; fake clock installed and paused.

**Acceptance criteria**
- The card format rule rejects non-digits.

**Steps**
1. Fill every field validly except the card number (letters); submit.

**Expected result**
- Error state; errors exactly ["Card number format is invalid."]

## TC-PAY-004 — Expiry format (data-driven: 6 rows)
- **Type:** Edge
- **Priority:** P1
- **Preconditions:** `/ui-elements/form-payment/` is open; fresh browser context; fake clock installed and paused.

**Acceptance criteria**
- MM is 01–12, YY is 26–99, separator "/".

**Steps**
1. Base values with expiry 12/30 / 1/30 / 13/30 / 00/30 / 12/25 / 12-30; submit.

**Expected result**
- 12/30: only the card error. Others: card error + "Expiry Date is required and must be future MM/YY."

## TC-PAY-005 — CVV length (data-driven: 5 rows)
- **Type:** Edge
- **Priority:** P1
- **Preconditions:** `/ui-elements/form-payment/` is open; fresh browser context; fake clock installed and paused.

**Acceptance criteria**
- 3–4 digits.

**Steps**
1. Base values with CVV 12 / 123 / 1234 / 12345 / 12a; submit.

**Expected result**
- 123 and 1234: only the card error. Others: card error + "CVV length is invalid."

## TC-PAY-006 — Reset clears every field, the checkbox and the result
- **Type:** Functional
- **Priority:** P2
- **Preconditions:** `/ui-elements/form-payment/` is open; fresh browser context; fake clock installed and paused.

**Acceptance criteria**
- Reset clears every field.

**Steps**
1. Fill with "Save card" checked; submit; press Reset.

**Expected result**
- "Awaiting submission."; no errors; five text fields empty; "Save card" unchecked.
