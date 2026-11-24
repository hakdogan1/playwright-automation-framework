# Contact Form — test cases

Module: `/ui-elements/form-contact/` · Automated in `apps/qa-practice/tests/forms/form-contact.spec.ts`
Source of expected values: QA Practice `form-lab.tsx` (`form-contact` config) at revision 3d14d23, the production build per `/release-info.json`; identical in the local build d856264. Data: `apps/qa-practice/data/form-lab.data.ts` (synthetic, `.test` mail domain).

> **Scope and clock.** Client-only Form Lab form (`ConfiguredForm`): `form-lab.tsx` has no network or storage calls; the Production Guard reports confirm it. The page object (`LabFormPage`, shared by the six configured forms) installs and pauses the fake clock; `submit()` advances exactly the 360 ms validation delay.

> **Attachment.** A synthetic in-memory PNG (`data/synthetic-files.ts`); the app only reads its name. Choosing a file moves the animated result panel, so the page object advances the paused clock 1 s after setting a file (see `form-lab.pages.ts`).

> **Not asserted (OBS-09).** Reset keeps the chosen file in the file input while the UI forgets it.

## TC-CNT-001 — A complete message without attachment is sent
- **Type:** Smoke
- **Priority:** P1
- **Preconditions:** `/ui-elements/form-contact/` is open; fresh browser context; fake clock installed and paused.

**Acceptance criteria**
- Required fields filled → success.

**Steps**
1. Fill name, email, subject and a 51-character message; send.

**Expected result**
- "Contact request sent."; `data-state="success"`.

## TC-CNT-002 — An attachment is named in the selection and in the success message
- **Type:** Functional
- **Priority:** P2
- **Preconditions:** `/ui-elements/form-contact/` is open; fresh browser context; fake clock installed and paused.

**Acceptance criteria**
- The attachment name is shown and reported.

**Steps**
1. Fill the form and choose `evidence.png`.
2. Send.

**Expected result**
- "Selected: evidence.png"; "Contact request sent with evidence.png."

## TC-CNT-003 — An empty submit reports all six issues in order
- **Type:** Negative
- **Priority:** P1
- **Preconditions:** `/ui-elements/form-contact/` is open; fresh browser context; fake clock installed and paused.

**Acceptance criteria**
- All issues are listed in source order.

**Steps**
1. Send with empty fields.

**Expected result**
- ["Full Name is required.", "Email is required.", "Subject is required.", "Message is required.", "Email must be valid.", "Message must be at least 20 characters."]; "6 validation issues found."

## TC-CNT-004 — The message needs 20 characters after trimming
- **Type:** Edge
- **Priority:** P1
- **Preconditions:** `/ui-elements/form-contact/` is open; fresh browser context; fake clock installed and paused.

**Acceptance criteria**
- Boundary 19/20 on the trimmed value.

**Steps**
1. Message of 19 characters padded with spaces; send.
2. Message of exactly 20 characters; send.

**Expected result**
- After 1: ["Message must be at least 20 characters."]. After 2: success.

## TC-CNT-005 — An invalid email is rejected
- **Type:** Negative
- **Priority:** P2
- **Preconditions:** `/ui-elements/form-contact/` is open; fresh browser context; fake clock installed and paused.

**Acceptance criteria**
- The email format is checked.

**Steps**
1. Email `qa contact@example.test`; send.

**Expected result**
- ["Email must be valid."]

## TC-CNT-006 — Reset clears the text fields, the result and the attachment name
- **Type:** Functional
- **Priority:** P1
- **Preconditions:** `/ui-elements/form-contact/` is open; fresh browser context; fake clock installed and paused.

**Acceptance criteria**
- Reset returns the visible form to its initial state.

**Steps**
1. Fill with an attachment and send.
2. Press Reset.

**Expected result**
- Idle, "Awaiting submission."; name, email, subject, message empty; no "Selected:" line.
