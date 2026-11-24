# [OBS-09] Form Lab: preset selects fail as "required", Reset races the pending validation, and lab trigger accounts use a real domain

> **Status: DRAFT bug report — not filed.** Found while automating the eight Form Lab modules (Faz 2C.5). No Bug-ID and no automated test; kept outside `docs/bug-reports/`. It is filed only on the owner's decision. QA Practice source was not modified.

- **Type:** Functional / state, validation messages, test-data hygiene
- **Severity (proposed):** Medium for 1 and 2 (the UI shows or reports a state that is not the real one). Low for 3–6.
- **Modules:** `/ui-elements/form-*` (`form-lab.tsx`, revision 3d14d23)

## Findings
Findings 1–3 and 5 were measured identically in Chromium, Firefox and WebKit on production (build 3d14d23) with the fake clock installed and paused, runs `20261123T223909Z-3f11e9` and `20261123T224029Z-bd9bc9`. It was a temporary observation spec, deleted afterwards; it recorded state and asserted nothing. Findings 4 and 6 are from the source.

| # | Steps | Expected | Actual | Cause in the source |
|---|---|---|---|---|
| 1 | Profile: fill name, email and phone, leave Language/Timezone as displayed ("English", "Europe/Istanbul"), submit | Success: the visible choice is the value | **"Language is required." and "Timezone is required."** although both selects visibly show a value | The form state starts as `""`, which matches no option, so the browser shows the first option while the state stays empty |
| 2 | Any configured form (measured: Login): fill valid data, press Submit, press Reset before the 360 ms validation ends | Reset cancels the validation | The fields are empty, but **360 ms later the success message for the old values appears** ("Login success for qa.login@example.test.") | Reset does not clear the pending `setTimeout`; its callback validates the values captured before the reset |
| 3 | Contact (also Profile): choose a file, press Reset, submit valid text | No attachment, and the file input empty | The UI forgets the file ("Selected:" gone, message "Contact request sent."), but **the file input still holds it** (1 file) | Reset clears the file name in state; the uncontrolled `<input type="file">` is not cleared |
| 4 | Payment: submit with empty fields | Messages use the field labels ("CVV", "Billing ZIP") | **"Cvv is required."**, **"Billing Zip is required."** | `titleize()` builds the message from the field id |
| 4b | Payment: expiry `01/26` in November 2026 | Rejected as expired | **Accepted** (code reading): the rule is the fixed pattern `(2[6-9]\|[3-9][0-9])` for the year, with no month/date comparison; it also becomes wrong as years pass | `FUTURE_EXPIRY_RE` |
| 5 | Multi-step: press Next on the empty first step, then fix the fields | "2 validation issues found.", and the error clears once fixed (or a hint that Next re-checks) | **"2 validation issue found."** (singular), and the error state stays after the fields are valid until Next is pressed again | Message template without plural; errors are only recomputed on Next/Back |
| 6 | Login "locked account" and Profile "email already used" triggers | Trigger addresses on a reserved domain (`example.test`, RFC 2606) | Both use addresses on **`lab.dev`**, a registrable domain; the module documentation also uses another `lab.dev` address in its sample tests | Hard-coded trigger values |

## Why it matters
Finding 1 is a classic controlled-select defect: users see a valid choice and get a "required" error. Finding 2 is the same stale-timer race as OBS-07 (Loader): a cleared form reports success. Finding 3 lets the next submission behave differently from what the screen shows. Finding 6 means test data that copies the lab's own examples is real-looking personal data on someone's domain; the framework's privacy gate rejects it, so the "locked account" and "email already used" cases are **not automated**. They can be added after a reviewed privacy exception (`privacy-allowlist.json`, protected by AI Guard), or after the lab switches to reserved domains.

## Not automated for other reasons
- **Payment test-card flows** (success, declined, authentication required) need a card number in a field. The framework does not type card numbers into the production site; TC-PAY covers every other rule. Running them against a local build of the app is possible once the owner decides how (it needs a runner-config change, which AI Guard requires a human to approve).

## Automation
Not automated. The TC-LGN, TC-CNT, TC-ADR, TC-PAY, TC-CKO, TC-PRF, TC-MSF and TC-VER cases assert only the intended, source-verified behaviour and avoid these states. If the owner confirms these as defects, they can follow the Bug Playground pattern (reproduce + `test.fail` expected test with a Bug-ID). That needs approval and is outside this phase.
