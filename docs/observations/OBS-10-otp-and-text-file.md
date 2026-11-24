# [OBS-10] OTP Login: the code is not bound to the username and formatted codes are cut; Generate Text File accepts empty content

> **Status: DRAFT — not filed.** Found while automating TC-OTP and TC-TXT (Faz 2C.6). No Bug-ID and no automated test; kept outside `docs/bug-reports/`. It is filed only on the owner's decision. QA Practice source was not modified.

- **Type:** Functional / authentication logic (demo), input handling, validation
- **Severity (proposed):** Low (client-only practice labs), but finding 1 is a pattern that is a real vulnerability in production OTP flows.
- **Modules:** `/ui-elements/otp-login/` (`OtpLoginWidget`, `forms.tsx`), `/ui-elements/generate-text-file/` (`GenerateTextFileWidget`, `data.tsx`); revision 3d14d23

## Findings
Measured identically in Chromium, Firefox and WebKit on production (build 3d14d23), runs `20261123T225630Z-15e2bd` and `20261123T225948Z-84b7e3`. Temporary observation specs, deleted afterwards; they recorded state and asserted nothing. During the OTP measurement the page made only GET requests (Next.js route prefetches), no write and no request body.

| # | Steps | Expected | Actual | Cause in the source |
|---|---|---|---|---|
| 1 | Enter `qa-runner`, Fetch OTP, change the username to `someone-else`, enter 123456, Verify | The OTP belongs to the user it was requested for: verification fails or a new request is needed | **"OTP verified. Login successful."** for the other username | `requested` is a single boolean; the username is not stored with the request |
| 2 | After a request, clear the username (spaces) and press "Resend OTP" | The old session ends (digits cleared) or stays clearly valid | "Enter a username before requesting an OTP." — but the **entered digits stay** and the earlier request is still valid, so Verify still succeeds | The username check returns before resetting `requested` and the digits |
| 3 | Paste a formatted code `123 456` or `123-456` into the first box | All six digits are used (separators ignored, as the code strips non-digits) | Only **1 2 3 4 5** arrive; Verify says "Enter all 6 digits before submitting." | `maxLength=6` cuts the pasted text to 6 characters before the non-digit stripping runs |
| 4 | Generate Text File: clear the textarea, press "Generate file" | A hint, or a disabled button for empty content | A **0-byte** `generated-qa-notes.txt` is downloaded, "ready · 0 bytes" | No check on the content |

## Why it matters
Finding 1 is the core OTP rule (a code is valid for one user and one request); real systems that verify a code without binding it to the account allow account takeover. Finding 3 is a common usability defect: codes from SMS or e-mail are often formatted with a space or hyphen. Finding 4 is a minor validation gap.

## Automation
Not automated. TC-OTP-001…010 and TC-TXT-001…005 assert only the intended, source-verified behaviour and avoid these inputs. If the owner confirms these as defects, they can follow the Bug Playground pattern (reproduce + `test.fail` expected test with a Bug-ID). That needs approval and is outside this phase.
