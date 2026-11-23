# Inputs — test cases

Module: `/ui-elements/inputs/` · Automated in `apps/qa-practice/tests/inputs/inputs.spec.ts`
Test data: `apps/qa-practice/data/inputs.data.ts` (synthetic, `@example.test` only).

## TC-INP-001 — The form renders empty and waits for input
- **Type:** Smoke
- **Priority:** P1
- **Preconditions:** Inputs page is open.

**Acceptance criteria**
- Email and password are empty; the password is masked.
- No result and no rule state is shown before interaction.

**Steps**
1. Open `/ui-elements/inputs/`.

**Expected result**
- Email and password fields are empty, password type is `password`.
- Result area reads "Awaiting submission…" (state `idle`).
- All five password rules are `idle`.

## TC-INP-002 — Valid email and password sign in
- **Type:** Smoke
- **Priority:** P1
- **Preconditions:** Inputs page is open.

**Acceptance criteria**
- A valid email and a password meeting every rule produce a success message with the email.

**Steps**
1. Enter `qa.user@example.test` and `Strong#Pass1`.
2. Press "Sign in".

**Expected result**
- Result state is `success` and reads "Login successful — welcome, qa.user@example.test."
- No email error is shown.

## TC-INP-003 — Invalid email is rejected
- **Type:** Negative
- **Priority:** P1
- **Preconditions:** Inputs page is open.

**Acceptance criteria**
- Emails without `@`, without a dot in the domain, with a space, or only whitespace are rejected.

**Steps**
1. Enter each invalid email with a valid password.
2. Press "Sign in".

**Expected result**
- Inline alert "Please enter a valid email address." is shown and the email has `aria-invalid="true"`.
- Result state is `error`: "Please enter a valid email address before submitting."

## TC-INP-004 — Submitting an empty form reports both fields
- **Type:** Negative
- **Priority:** P2
- **Preconditions:** Inputs page is open.

**Acceptance criteria**
- An empty submission names both problems.

**Steps**
1. Press "Sign in" without entering anything.

**Expected result**
- Result reads "Please correct the email address and password before submitting."
- The email alert is visible.

## TC-INP-005 — Password length boundary
- **Type:** Edge
- **Priority:** P2
- **Preconditions:** Inputs page is open.

**Acceptance criteria**
- 7 characters fail the length rule; 8 characters pass it (minimum boundary).

**Steps**
1. Type `Abcdef1` (7 characters).
2. Type `Abcdef1!` (8 characters).

**Expected result**
- 7 characters: length rule `fail`.
- 8 characters: every rule `ok`.

## TC-INP-006 — Each password rule blocks sign in on its own
- **Type:** Negative
- **Priority:** P1
- **Preconditions:** Inputs page is open.

**Acceptance criteria**
- A password that breaks exactly one rule marks only that rule as failed and blocks sign in.

**Steps**
1. For each rule (length, number, upper, lower, special) enter a valid email and a password breaking only that rule.
2. Press "Sign in".

**Expected result**
- The broken rule is `fail`, the other four are `ok`.
- Result reads "Password does not meet all requirements yet."; no email error.

## TC-INP-007 — Surrounding spaces in the email are trimmed
- **Type:** Edge
- **Priority:** P3
- **Preconditions:** Inputs page is open.

**Acceptance criteria**
- Leading and trailing spaces do not invalidate an email and are not echoed back.

**Steps**
1. Enter `  qa.user@example.test  ` and a valid password.
2. Press "Sign in".

**Expected result**
- Result state is `success` with the trimmed email `qa.user@example.test`.
