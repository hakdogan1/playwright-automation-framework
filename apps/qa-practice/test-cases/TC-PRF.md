# Profile Update Form — test cases

Module: `/ui-elements/form-profile/` · Automated in `apps/qa-practice/tests/forms/form-profile.spec.ts`
Source of expected values: QA Practice `form-lab.tsx` (`form-profile` config) at revision 3d14d23, the production build per `/release-info.json`; identical in the local build d856264. Data: `apps/qa-practice/data/form-lab.data.ts` (synthetic, `.test` mail domain).

> **Scope and clock.** Client-only Form Lab form (`ConfiguredForm`): `form-lab.tsx` has no network or storage calls; the Production Guard reports confirm it. The page object (`LabFormPage`, shared by the six configured forms) installs and pauses the fake clock; `submit()` advances exactly the 360 ms validation delay.

> **Selects.** Language and timezone are always chosen explicitly in these cases. **Not asserted (OBS-09):** both selects show their first option while the form state is empty, so a profile submitted without touching them is rejected as "Language is required." and "Timezone is required."; the "email already used" trigger address is on a non-reserved domain and is not copied (privacy gate).

> **Files.** Synthetic in-memory PNG/JPEG/TXT (`data/synthetic-files.ts`); only the file name is checked by the app.

## TC-PRF-001 — A complete profile is updated
- **Type:** Smoke
- **Priority:** P1
- **Preconditions:** `/ui-elements/form-profile/` is open; fresh browser context; fake clock installed and paused.

**Acceptance criteria**
- Valid profile → success.

**Steps**
1. Fill name, email, phone, language "de", timezone "Europe/Berlin"; update.

**Expected result**
- "Profile updated."; `data-state="success"`.

## TC-PRF-002 — PNG and JPG avatars are accepted (data-driven: avatar.png, avatar.JPG)
- **Type:** Functional
- **Priority:** P2
- **Preconditions:** `/ui-elements/form-profile/` is open; fresh browser context; fake clock installed and paused.

**Acceptance criteria**
- Allowed extensions, case-insensitive.

**Steps**
1. Valid profile with the avatar; update.

**Expected result**
- "Profile updated with <file name>."

## TC-PRF-003 — An avatar that is not PNG or JPG is rejected
- **Type:** Negative
- **Priority:** P1
- **Preconditions:** `/ui-elements/form-profile/` is open; fresh browser context; fake clock installed and paused.

**Acceptance criteria**
- Other file types are refused.

**Steps**
1. Valid profile with `avatar.txt`; update.

**Expected result**
- ["Upload invalid file type."]

## TC-PRF-004 — Invalid email and phone are both reported
- **Type:** Negative
- **Priority:** P1
- **Preconditions:** `/ui-elements/form-profile/` is open; fresh browser context; fake clock installed and paused.

**Acceptance criteria**
- Both rules report in order.

**Steps**
1. Email `qa.profile@`, phone `+49 30 123`; update.

**Expected result**
- ["Email must be valid.", "Invalid phone."]

## TC-PRF-005 — Reset clears the text fields, the result and the avatar name
- **Type:** Functional
- **Priority:** P2
- **Preconditions:** `/ui-elements/form-profile/` is open; fresh browser context; fake clock installed and paused.

**Acceptance criteria**
- Reset returns the visible form to its initial state.

**Steps**
1. Fill with an avatar; update; press Reset.

**Expected result**
- "Awaiting submission."; name, email, phone empty; no "Selected:" line.
