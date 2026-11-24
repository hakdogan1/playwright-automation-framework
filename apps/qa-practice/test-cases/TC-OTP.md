# OTP Login — test cases

Module: `/ui-elements/otp-login/` · Automated in `apps/qa-practice/tests/otp-login/otp-login.spec.ts`
Source of expected values: QA Practice `OtpLoginWidget` (`forms.tsx`) at revision 3d14d23, the production build per `/release-info.json`; identical in the local build d856264. Data: `apps/qa-practice/data/otp-files.data.ts`.

> **Safety.** The OTP is a fixed demo code (`123456`) shown on the page. The widget makes no request, sends no e-mail and writes no storage; TC-OTP-002 checks the network (no request other than GET, no request body; Next.js may prefetch route chunks with GET). The Production Guard reports confirm it.

> **Digit boxes.** The page object reuses the `OtpInput` component of Keyboard Keys with this module's test-id prefix (`otp-login-digit-`).

> **Not asserted (see `docs/observations/OBS-10-otp-and-text-file.md`).** The code is not bound to the username; a refused resend keeps the old code; a formatted code ("123 456") is cut by `maxLength=6` when pasted.

## TC-OTP-001 — Starts idle with six empty digit boxes
- **Type:** Smoke
- **Priority:** P1
- **Preconditions:** `/ui-elements/otp-login/` is open; fresh browser context.

**Acceptance criteria**
- The initial state is idle and accessible.

**Steps**
1. Open the page.

**Expected result**
- "Waiting for an OTP request…", `data-state="idle"`, `role="status"`; button "Fetch OTP"; six empty boxes named "OTP digit 1"…"OTP digit 6".

## TC-OTP-002 — Request, type the demo code and verify — without any write request
- **Type:** Smoke
- **Priority:** P1
- **Preconditions:** `/ui-elements/otp-login/` is open; fresh browser context. Request listener attached.

**Acceptance criteria**
- The happy path works entirely in the browser.

**Steps**
1. Enter `qa-runner`, press "Fetch OTP".
2. Type `123456` into the first box (focus advances), press "Verify OTP".

**Expected result**
- After 1: "Demo OTP sent. Use 123456 for this lab." (success), button "Resend OTP".
- After 2: boxes 1…6 = 1 2 3 4 5 6; "OTP verified. Login successful." (success).
- No request other than GET; no request with a body.

## TC-OTP-003 — Fetching without a username is refused (data-driven: empty, whitespace-only)
- **Type:** Negative
- **Priority:** P1
- **Preconditions:** `/ui-elements/otp-login/` is open; fresh browser context.

**Acceptance criteria**
- A username is required, after trimming.

**Steps**
1. Leave the username empty or enter three spaces; press "Fetch OTP".

**Expected result**
- "Enter a username before requesting an OTP." (error); the button still says "Fetch OTP".

## TC-OTP-004 — Verifying before requesting an OTP is refused
- **Type:** Negative
- **Priority:** P1
- **Preconditions:** `/ui-elements/otp-login/` is open; fresh browser context.

**Acceptance criteria**
- Verification needs a requested OTP.

**Steps**
1. Type `123456`, press "Verify OTP".

**Expected result**
- "Request an OTP first." (error).

## TC-OTP-005 — An incomplete code is refused
- **Type:** Negative
- **Priority:** P1
- **Preconditions:** `/ui-elements/otp-login/` is open; fresh browser context. Username `qa-runner` entered and an OTP requested.

**Acceptance criteria**
- All six digits are required.

**Steps**
1. Type `12345`, verify.

**Expected result**
- "Enter all 6 digits before submitting."

## TC-OTP-006 — A wrong code is refused
- **Type:** Negative
- **Priority:** P1
- **Preconditions:** `/ui-elements/otp-login/` is open; fresh browser context. Username `qa-runner` entered and an OTP requested.

**Acceptance criteria**
- Only the demo code is accepted.

**Steps**
1. Type `654321`, verify.

**Expected result**
- "Invalid OTP. Try 123456 for this lab." (error).

## TC-OTP-007 — A pasted code is spread over the boxes and non-digits are dropped
- **Type:** Edge
- **Priority:** P2
- **Preconditions:** `/ui-elements/otp-login/` is open; fresh browser context. Username `qa-runner` entered and an OTP requested.

**Acceptance criteria**
- Pasting into the first box fills the following boxes with digits only.

**Steps**
1. Paste `123456` into box 1, verify.
2. Resend, paste `12a456` into box 1.

**Expected result**
- After 1: boxes 1…6 = 1 2 3 4 5 6; verified.
- After 2: boxes = 1 2 4 5 6 and an empty sixth box.

## TC-OTP-008 — A code pasted into the fourth box fills only the remaining boxes
- **Type:** Edge
- **Priority:** P2
- **Preconditions:** `/ui-elements/otp-login/` is open; fresh browser context. Username `qa-runner` entered and an OTP requested.

**Acceptance criteria**
- Digits beyond the last box are discarded.

**Steps**
1. Paste `987654` into box 4.

**Expected result**
- Boxes = empty, empty, empty, 9, 8, 7.

## TC-OTP-009 — "Resend OTP" clears the entered digits
- **Type:** Functional
- **Priority:** P2
- **Preconditions:** `/ui-elements/otp-login/` is open; fresh browser context. Username `qa-runner` entered and an OTP requested.

**Acceptance criteria**
- A new request starts with empty boxes.

**Steps**
1. Type `654321`, verify.
2. Press "Resend OTP".

**Expected result**
- After 1: invalid. After 2: six empty boxes; "Demo OTP sent. Use 123456 for this lab."

## TC-OTP-010 — Editing the username or a digit clears the previous result
- **Type:** Functional
- **Priority:** P2
- **Preconditions:** `/ui-elements/otp-login/` is open; fresh browser context. Username `qa-runner` entered and an OTP requested.

**Acceptance criteria**
- A stale result is never shown for changed input.

**Steps**
1. Type `654321`, verify.
2. Change the last digit.
3. Verify again, then change the username.

**Expected result**
- After 2: "Waiting for an OTP request…". After 3: invalid, then idle again (`data-state="idle"`).
