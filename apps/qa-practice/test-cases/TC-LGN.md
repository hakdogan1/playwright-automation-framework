# Login Form — test cases

Module: `/ui-elements/form-login/` · Automated in `apps/qa-practice/tests/forms/form-login.spec.ts`
Source of expected values: QA Practice `form-lab.tsx` (`form-login` config) at revision 3d14d23, the production build per `/release-info.json`; identical in the local build d856264. Data: `apps/qa-practice/data/form-lab.data.ts` (synthetic, `.test` mail domain).

> **Scope and clock.** Client-only Form Lab form (`ConfiguredForm`): `form-lab.tsx` has no network or storage calls; the Production Guard reports confirm it. The page object (`LabFormPage`, shared by the six configured forms) installs and pauses the fake clock; `submit()` advances exactly the 360 ms validation delay.

> **Demo password.** Success needs the lab's published demo password `Password123!` (shown in the module's own documentation); any valid address on the reserved `.test` domain is accepted.

> **Not automated (see `docs/observations/OBS-09-form-lab.md`).** The "locked account" trigger address is on a non-reserved domain; copying it would fail the privacy gate (it needs a reviewed privacy exception). Reset while validating lets the pending result appear on the cleared form.

## TC-LGN-001 — Valid credentials sign in and show the success toast
- **Type:** Smoke
- **Priority:** P1
- **Preconditions:** `/ui-elements/form-login/` is open; fresh browser context; fake clock installed and paused.

**Acceptance criteria**
- Valid credentials produce the success state and toast.

**Steps**
1. Check the idle state.
2. Enter `qa.login@example.test` and the demo password; press "Sign in".

**Expected result**
- Idle: "Awaiting submission.", button "Sign in".
- "Login success for qa.login@example.test."; `data-state="success"`; toast "Success toast: …"; no errors.

## TC-LGN-002 — "Remember me" is reflected in the success message
- **Type:** Functional
- **Priority:** P2
- **Preconditions:** `/ui-elements/form-login/` is open; fresh browser context; fake clock installed and paused.

**Acceptance criteria**
- The checkbox changes the message.

**Steps**
1. Valid credentials with "Remember me" checked; sign in.

**Expected result**
- "Login success for qa.login@example.test with remember me enabled."

## TC-LGN-003 — A wrong password is the only issue
- **Type:** Negative
- **Priority:** P1
- **Preconditions:** `/ui-elements/form-login/` is open; fresh browser context; fake clock installed and paused.

**Acceptance criteria**
- A wrong password is reported precisely.

**Steps**
1. Valid email, password `WrongPass1!`; sign in.

**Expected result**
- Errors exactly ["Invalid password."]; "1 validation issue found."; "Error toast: Fix validation errors before submitting."

## TC-LGN-004 — An empty submit reports the required fields and the email format
- **Type:** Negative
- **Priority:** P1
- **Preconditions:** `/ui-elements/form-login/` is open; fresh browser context; fake clock installed and paused.

**Acceptance criteria**
- All empty-form issues are listed in order.

**Steps**
1. Sign in with empty fields.

**Expected result**
- ["Email is required.", "Password is required.", "Email must be valid."]; "3 validation issues found."

## TC-LGN-005 — An invalid email with the right password is rejected
- **Type:** Negative
- **Priority:** P2
- **Preconditions:** `/ui-elements/form-login/` is open; fresh browser context; fake clock installed and paused.

**Acceptance criteria**
- The email format is checked.

**Steps**
1. Email `qa.login.example.test`, demo password; sign in.

**Expected result**
- Errors exactly ["Email must be valid."]

## TC-LGN-006 — Surrounding spaces in the email are trimmed
- **Type:** Edge
- **Priority:** P2
- **Preconditions:** `/ui-elements/form-login/` is open; fresh browser context; fake clock installed and paused.

**Acceptance criteria**
- Values are trimmed before validation and in the message.

**Steps**
1. Email with two leading and trailing spaces; sign in.

**Expected result**
- "Login success for qa.login@example.test."

## TC-LGN-007 — While validating the button is disabled; Reset afterwards clears the form
- **Type:** Functional
- **Priority:** P1
- **Preconditions:** `/ui-elements/form-login/` is open; fresh browser context; fake clock installed and paused.

**Acceptance criteria**
- The submit is busy during validation; Reset returns to idle.

**Steps**
1. Fill with a wrong password and "Remember me"; press "Sign in" without advancing.
2. Advance 360 ms.
3. Press Reset.

**Expected result**
- After 1: "Validating..." disabled. After 2: error state.
- After 3: idle, "Awaiting submission.", no errors, both fields empty, checkbox unchecked.
