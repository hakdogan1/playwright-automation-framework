# Form Register — test cases

Module: `/ui-elements/form-register/` · Automated in `apps/qa-practice/tests/forms/form-register.spec.ts`
Source of expected values: QA Practice `form-lab.tsx` at revision 3d14d23 (the production build per `/release-info.json`; identical in the local build d856264). Data: `apps/qa-practice/data/form-register.data.ts` (synthetic, `.test` mail domain).

> **Scope and safety.** The register form is a client-only lab: `form-lab.tsx` contains no network or storage calls, so no account is created and nothing is written. The Production Guard reports of every run confirm this (no write, no Supabase call).

> **Clock.** `FormRegisterPage.goto()` installs Playwright's fake clock and then **pauses** it; `submit()` advances exactly 360 ms. Pausing matters: after `install()` alone the fake clock kept following real time (+508…511 ms per 500 real ms in Chromium, Firefox and WebKit). That made TC-FRM-002 fail at 359 ms, which was a test-helper defect, not a product defect. The result panel has no exit animation, so the Notifications clock limitation (TC-NTF) does not apply here.

## TC-FRM-001 — A complete, valid registration succeeds
- **Type:** Smoke
- **Priority:** P1
- **Preconditions:** `/ui-elements/form-register/` is open; fresh browser context; fake clock installed and paused (the 360 ms validation delay is advanced exactly).

**Acceptance criteria**
- Valid data produces the success state; nothing is sent to a server (client-only widget).

**Steps**
1. Check the initial result panel.
2. Fill every field with valid data.
3. Submit.

**Expected result**
- Initially: data-state "idle", "Awaiting submission."
- After submit: data-state "success", role "status", message "Registration success for qa_runner_01.", no error list.

## TC-FRM-002 — While validating, the submit button is disabled and says "Validating..."
- **Type:** Functional
- **Priority:** P1
- **Preconditions:** `/ui-elements/form-register/` is open; fresh browser context; fake clock installed and paused (the 360 ms validation delay is advanced exactly). Valid synthetic data: Test / Runner / `qa_runner_01` / `qa.runner@example.test` / `Passw0rd!` twice / Germany / terms accepted.

**Acceptance criteria**
- Submit cannot be repeated during the 360 ms validation; the result is only produced at 360 ms.

**Steps**
1. Click "Create account" without advancing the clock.
2. Advance 359 ms.
3. Advance 1 ms.

**Expected result**
- After the click and at 359 ms: button disabled with the text "Validating...", result still "idle".
- At 360 ms: button enabled, "Create account", result "success".

## TC-FRM-003 — An empty form reports all ten issues in order
- **Type:** Negative
- **Priority:** P1
- **Preconditions:** `/ui-elements/form-register/` is open; fresh browser context; fake clock installed and paused (the 360 ms validation delay is advanced exactly).

**Acceptance criteria**
- Every rule fires on an empty form, in the app's validation order.

**Steps**
1. Submit the untouched form.

**Expected result**
- data-state "error", "10 validation issues found."
- Errors, in order: the 7 required-field messages (First Name, Last Name, Username, Email, Password, Confirm Password, Country), then "Email must be a valid email address.", "Password must be at least 8 characters.", "Terms checkbox is required."
- There is no "Passwords must match.", because two empty passwords are equal.

## TC-FRM-004 — An invalid email is the only issue (data-driven: 4 rows)
- **Type:** Negative
- **Priority:** P1
- **Preconditions:** `/ui-elements/form-register/` is open; fresh browser context; fake clock installed and paused (the 360 ms validation delay is advanced exactly). Valid synthetic data: Test / Runner / `qa_runner_01` / `qa.runner@example.test` / `Passw0rd!` twice / Germany / terms accepted.

**Acceptance criteria**
- Emails rejected by `/^[^\s@]+@[^\s@]+\.[^\s@]+$/` produce exactly one error.

**Steps**
1. Use valid data with the email `qa.runner`, `qa.runner@example`, `qa runner@example.test` or `qa.runner@@example.test`.
2. Submit.

**Expected result**
- "1 validation issue found."; errors: "Email must be a valid email address." only.

## TC-FRM-005 — Different passwords are rejected
- **Type:** Negative
- **Priority:** P1
- **Preconditions:** `/ui-elements/form-register/` is open; fresh browser context; fake clock installed and paused (the 360 ms validation delay is advanced exactly). Valid synthetic data: Test / Runner / `qa_runner_01` / `qa.runner@example.test` / `Passw0rd!` twice / Germany / terms accepted.

**Acceptance criteria**
- Confirmation must equal the password.

**Steps**
1. Use valid data with the confirmation `Passw0rd?`.
2. Submit.

**Expected result**
- data-state "error"; errors: "Passwords must match." only.

## TC-FRM-006 — Registration without accepting the terms is rejected
- **Type:** Negative
- **Priority:** P1
- **Preconditions:** `/ui-elements/form-register/` is open; fresh browser context; fake clock installed and paused (the 360 ms validation delay is advanced exactly). Valid synthetic data: Test / Runner / `qa_runner_01` / `qa.runner@example.test` / `Passw0rd!` twice / Germany / terms accepted.

**Acceptance criteria**
- The terms checkbox is mandatory.

**Steps**
1. Use valid data with terms unchecked.
2. Submit.

**Expected result**
- Checkbox unchecked; data-state "error"; errors: "Terms checkbox is required." only.

## TC-FRM-007 — Registration without a country is rejected
- **Type:** Negative
- **Priority:** P2
- **Preconditions:** `/ui-elements/form-register/` is open; fresh browser context; fake clock installed and paused (the 360 ms validation delay is advanced exactly). Valid synthetic data: Test / Runner / `qa_runner_01` / `qa.runner@example.test` / `Passw0rd!` twice / Germany / terms accepted.

**Acceptance criteria**
- The placeholder option ("Select country", value "") counts as empty.

**Steps**
1. Use valid data with the country left at "Select country".
2. Submit.

**Expected result**
- Select value ""; data-state "error"; errors: "Country is required." only.

## TC-FRM-008 — A 7-character password is rejected and 8 characters are accepted
- **Type:** Edge
- **Priority:** P1
- **Preconditions:** `/ui-elements/form-register/` is open; fresh browser context; fake clock installed and paused (the 360 ms validation delay is advanced exactly). Valid synthetic data: Test / Runner / `qa_runner_01` / `qa.runner@example.test` / `Passw0rd!` twice / Germany / terms accepted.

**Acceptance criteria**
- Boundary: minimum length 8.

**Steps**
1. Use password and confirmation `Passw0r` (7); submit.
2. Change both to `Passw0rd` (8); submit.

**Expected result**
- 7: "Password must be at least 8 characters." only.
- 8: data-state "success", no errors.

## TC-FRM-009 — Whitespace-only required fields count as empty
- **Type:** Edge
- **Priority:** P2
- **Preconditions:** `/ui-elements/form-register/` is open; fresh browser context; fake clock installed and paused (the 360 ms validation delay is advanced exactly). Valid synthetic data: Test / Runner / `qa_runner_01` / `qa.runner@example.test` / `Passw0rd!` twice / Germany / terms accepted.

**Acceptance criteria**
- Required checks use the trimmed value.

**Steps**
1. Set First Name `   `, Last Name ` `, Username tab+space; submit.
2. Restore them, set Email to spaces; submit.

**Expected result**
- Step 1: errors First Name, Last Name, Username required.
- Step 2: "Email is required." and "Email must be a valid email address." (the format rule also fires on the empty value).

## TC-FRM-010 — Password rules: length uses the trimmed value, matching uses the raw value
- **Type:** Edge
- **Priority:** P2
- **Preconditions:** `/ui-elements/form-register/` is open; fresh browser context; fake clock installed and paused (the 360 ms validation delay is advanced exactly). Valid synthetic data: Test / Runner / `qa_runner_01` / `qa.runner@example.test` / `Passw0rd!` twice / Germany / terms accepted.

**Acceptance criteria**
- Documents the app's trimming rules for passwords.

**Steps**
1. Set the confirmation to the password plus one trailing space; submit.
2. Set both to seven spaces + `x` (8 raw characters, 1 trimmed); submit.

**Expected result**
- Step 1: "Passwords must match." only (the trimmed length passes).
- Step 2: "Password must be at least 8 characters." only (the values are equal).

## TC-FRM-011 — Fixing the errors clears them and the next submit succeeds
- **Type:** Functional
- **Priority:** P1
- **Preconditions:** `/ui-elements/form-register/` is open; fresh browser context; fake clock installed and paused (the 360 ms validation delay is advanced exactly).

**Acceptance criteria**
- Each submit validates the current values; old errors do not persist.

**Steps**
1. Submit the empty form.
2. Fix everything except the email (`qa.runner@example`); submit.
3. Fix the email; submit.

**Expected result**
- 10 errors, then exactly 1 ("Email must be a valid email address.", "1 validation issue found."), then success with no error list.

## TC-FRM-012 — Reset and reload return the form to a clean, reusable state
- **Type:** Functional
- **Priority:** P2
- **Preconditions:** `/ui-elements/form-register/` is open; fresh browser context; fake clock installed and paused (the 360 ms validation delay is advanced exactly). Valid synthetic data: Test / Runner / `qa_runner_01` / `qa.runner@example.test` / `Passw0rd!` twice / Germany / terms accepted.

**Acceptance criteria**
- The form is independent and re-runnable; no state survives Reset or a reload (no storage).

**Steps**
1. Register once.
2. Press "Reset".
3. Register again as `qa_runner_02`.
4. Reload the page.

**Expected result**
- After Reset: all 7 inputs empty, terms unchecked, data-state "idle", "Awaiting submission.", no errors.
- Second registration: "Registration success for qa_runner_02."
- After reload: username empty, data-state "idle".
