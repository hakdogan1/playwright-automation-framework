# Multi-Step Form — test cases

Module: `/ui-elements/form-multi-step/` · Automated in `apps/qa-practice/tests/forms/form-multi-step.spec.ts`
Source of expected values: QA Practice `form-lab.tsx` (`MultiStepFormLab`) at revision 3d14d23, the production build per `/release-info.json`; identical in the local build d856264. Data: `apps/qa-practice/data/form-lab.data.ts` (synthetic, `.test` mail domain).

> **Scope.** Client-only wizard without timers: Personal Info → Address → Preferences → Review → Submit. Only steps 1 and 2 validate.

> **Not asserted (OBS-09).** The error count reads "2 validation issue found." (singular), and the error state stays after the fields are fixed until Next is pressed again; the cases assert the error list instead.

## TC-MSF-001 — A valid wizard goes through all five steps and submits
- **Type:** Smoke
- **Priority:** P1
- **Preconditions:** `/ui-elements/form-multi-step/` is open; fresh browser context.

**Acceptance criteria**
- Happy path through every step.

**Steps**
1. Fill step 1 (the message becomes "Step is valid. Continue when ready."), Next.
2. Fill step 2, Next.
3. Choose Turkish and the newsletter, Next.
4. Check the review, Next.
5. Submit.

**Expected result**
- Progress "Step 1 of 5: Personal Info" … "Step 5 of 5: Submit"; Back disabled on step 1; review "Test · qa.wizard@example.test · Teststrasse 1, Berlin"; "Ready to submit the completed wizard."; no Next on the last step; "Multi-step form submitted successfully."

## TC-MSF-002 — Step 1 blocks Next until first name and a valid email are given
- **Type:** Negative
- **Priority:** P1
- **Preconditions:** `/ui-elements/form-multi-step/` is open; fresh browser context.

**Acceptance criteria**
- Step 1 validation.

**Steps**
1. Press Next on the empty step.
2. Enter a name and `qa.wizard@example`, press Next.

**Expected result**
- Initially "Complete required fields before continuing.". After 1: still step 1, error state, ["First Name is required.", "Email must be valid."]. After 2: ["Email must be valid."], still step 1.

## TC-MSF-003 — Step 2 blocks Next until address and city are given
- **Type:** Negative
- **Priority:** P1
- **Preconditions:** `/ui-elements/form-multi-step/` is open; fresh browser context.

**Acceptance criteria**
- Step 2 validation.

**Steps**
1. Complete step 1, press Next on the empty step 2.

**Expected result**
- ["Address is required.", "City is required."]; still step 2.

## TC-MSF-004 — Back keeps the entered values and clears the errors
- **Type:** Functional
- **Priority:** P2
- **Preconditions:** `/ui-elements/form-multi-step/` is open; fresh browser context.

**Acceptance criteria**
- Navigation does not lose data.

**Steps**
1. Complete step 1, Next, Next on the empty step 2, Back.

**Expected result**
- Step 1; first name and email kept; no errors; Back disabled.

## TC-MSF-005 — Back after submitting leaves the success state
- **Type:** Edge
- **Priority:** P2
- **Preconditions:** `/ui-elements/form-multi-step/` is open; fresh browser context.

**Acceptance criteria**
- Success belongs to the submit step only.

**Steps**
1. Complete and submit the wizard, press Back.

**Expected result**
- "Step 4 of 5: Review"; result no longer "success"; "Step is valid. Continue when ready."
