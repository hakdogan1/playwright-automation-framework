# Address Form — test cases

Module: `/ui-elements/form-address/` · Automated in `apps/qa-practice/tests/forms/form-address.spec.ts`
Source of expected values: QA Practice `form-lab.tsx` (`form-address` config) at revision 3d14d23, the production build per `/release-info.json`; identical in the local build d856264. Data: `apps/qa-practice/data/form-lab.data.ts` (synthetic, `.test` mail domain).

> **Scope and clock.** Client-only Form Lab form (`ConfiguredForm`): `form-lab.tsx` has no network or storage calls; the Production Guard reports confirm it. The page object (`LabFormPage`, shared by the six configured forms) installs and pauses the fake clock; `submit()` advances exactly the 360 ms validation delay.

> **Rules.** Postal code `/^[A-Za-z0-9 -]{4,10}$/`, phone `/^[0-9]{7,15}$/` (digits only). The success message shows the country code (e.g. `DE`), as the source does.

## TC-ADR-001 — A complete address is saved; line 2 is optional
- **Type:** Smoke
- **Priority:** P1
- **Preconditions:** `/ui-elements/form-address/` is open; fresh browser context; fake clock installed and paused.

**Acceptance criteria**
- All required fields valid → success without line 2.

**Steps**
1. Fill everything except line 2 (Berlin, DE); save.

**Expected result**
- "Address saved for Berlin, DE."

## TC-ADR-002 — An empty submit reports all eight issues in order
- **Type:** Negative
- **Priority:** P1
- **Preconditions:** `/ui-elements/form-address/` is open; fresh browser context; fake clock installed and paused.

**Acceptance criteria**
- All issues are listed in source order.

**Steps**
1. Save with empty fields.

**Expected result**
- Six "… is required." messages (Address Line 1, City, State, Postal Code, Country, Phone Number), then "Postal code format is invalid.", "Phone Number must be numeric."; "8 validation issues found."

## TC-ADR-003 — Postal code boundaries (data-driven: 6 rows)
- **Type:** Edge
- **Priority:** P1
- **Preconditions:** `/ui-elements/form-address/` is open; fresh browser context; fake clock installed and paused.

**Acceptance criteria**
- Length 4–10, letters, digits, space and hyphen only.

**Steps**
1. Valid address with postal code 123 / 1234 / SW1A 1AA / AB-12345-C / AB-12345-CD / 1234#; save.

**Expected result**
- Rejected ("Postal code format is invalid." only): 123, AB-12345-CD, 1234#. Accepted: the others.

## TC-ADR-004 — Phone boundaries (data-driven: 5 rows)
- **Type:** Edge
- **Priority:** P1
- **Preconditions:** `/ui-elements/form-address/` is open; fresh browser context; fake clock installed and paused.

**Acceptance criteria**
- 7–15 digits, nothing else.

**Steps**
1. Valid address with phone 123456 / 1234567 / 15 digits / 16 digits / "030 1234567"; save.

**Expected result**
- Rejected ("Phone Number must be numeric." only): 6 digits, 16 digits, with a space. Accepted: 7 and 15 digits.

## TC-ADR-005 — Without a country the address is rejected
- **Type:** Negative
- **Priority:** P2
- **Preconditions:** `/ui-elements/form-address/` is open; fresh browser context; fake clock installed and paused.

**Acceptance criteria**
- The country select is required.

**Steps**
1. Valid address with "Select country"; save.

**Expected result**
- ["Country is required."]

## TC-ADR-006 — Reset returns every field and the result to the initial state
- **Type:** Functional
- **Priority:** P2
- **Preconditions:** `/ui-elements/form-address/` is open; fresh browser context; fake clock installed and paused.

**Acceptance criteria**
- Reset clears every field.

**Steps**
1. Fill everything including line 2; save; press Reset.

**Expected result**
- "Awaiting submission."; all seven fields empty (country back to "Select country").
