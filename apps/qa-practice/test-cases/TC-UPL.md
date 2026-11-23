# File Upload — test cases

Module: `/ui-elements/file-upload/` · Automated in `apps/qa-practice/tests/file-upload/file-upload.spec.ts`
Source of expected values: QA Practice `FileUploadWidget` (`data.tsx`) at revision 3d14d23, the production build per `/release-info.json`; identical in the local build d856264. Texts: `apps/qa-practice/data/file-upload.data.ts`.

> **Scope and safety.** The widget validates and previews the file in the browser only (`URL.createObjectURL`). There is no upload request; TC-UPL-001 asserts that no request with a write method or a body is made, and the Production Guard reports confirm that nothing was written. All files are synthetic (generated pixels, fixed strings).

> **Not asserted here (see `docs/observations/OBS-03-file-upload-validation.md`).** Measured in all three engines:
> - After a rejected file, the previous preview stays.
> - Any `image/*` (for example GIF) is accepted, although the message says PNG or JPG.
> - Content is not checked (text bytes declared as PNG are accepted).
> - Clearing the selection keeps the old name and preview.
> These look unintended. They are reported, not encoded as expected behaviour.

## TC-UPL-001 — A valid PNG is accepted and previewed without being sent anywhere
- **Type:** Smoke
- **Priority:** P1
- **Preconditions:** `/ui-elements/file-upload/` is open; fresh browser context; files are synthetic in-memory buffers (`data/synthetic-files.ts`).

**Acceptance criteria**
- An image/png file is accepted, previewed from a blob: URL, and never leaves the browser: no request with a write method or a body is made during the upload.

**Steps**
1. Check the initial state.
2. Choose the 1×1 PNG `qa-avatar.png`.

**Expected result**
- Initially "No file chosen" and no preview.
- After choosing: name `qa-avatar.png`, no error, preview `src` starts with `blob:`, alt "Avatar preview", "Preview hydrated." visible, decoded size 1×1, no request with a write method or a body during the upload. Plain GETs are not counted: the app prefetches route chunks in the background (for example `/_next/static/chunks/app/login/page-*.js`), which made a first "no request at all" check fail intermittently on 2026-11-23.

## TC-UPL-002 — A valid JPEG is accepted and previewed
- **Type:** Functional
- **Priority:** P1
- **Preconditions:** `/ui-elements/file-upload/` is open; fresh browser context; files are synthetic in-memory buffers (`data/synthetic-files.ts`).

**Acceptance criteria**
- An image/jpeg file is accepted and decoded.

**Steps**
1. Choose the 3×2 JPEG `qa-avatar.jpg`.

**Expected result**
- Name `qa-avatar.jpg`, no error, `blob:` preview decoded at 3×2 (proves the JPEG itself was rendered).

## TC-UPL-003 — An unsupported type is rejected without a preview (data-driven: TXT, PDF)
- **Type:** Negative
- **Priority:** P1
- **Preconditions:** `/ui-elements/file-upload/` is open; fresh browser context; files are synthetic in-memory buffers (`data/synthetic-files.ts`).

**Acceptance criteria**
- Types that do not start with `image/` are rejected by the app's JavaScript (the `accept` attribute is not what is tested: setInputFiles bypasses it).

**Steps**
1. Choose `qa-notes.txt` (text/plain) or `qa-report.pdf` (application/pdf).

**Expected result**
- Error "Unsupported file type. Use a PNG or JPG.", the chosen name is shown, no preview, no "Preview hydrated.".

## TC-UPL-004 — An image of exactly 1,048,576 bytes is accepted
- **Type:** Edge
- **Priority:** P1
- **Preconditions:** `/ui-elements/file-upload/` is open; fresh browser context; files are synthetic in-memory buffers (`data/synthetic-files.ts`).

**Acceptance criteria**
- Boundary: the app rejects only `size > 1024 * 1024`.

**Steps**
1. Choose a PNG padded to exactly 1,048,576 bytes.

**Expected result**
- The input holds 1,048,576 bytes; no error; `blob:` preview decoded at 1×1 (the padding after IEND is ignored by the decoder).

## TC-UPL-005 — An image of 1,048,577 bytes is rejected as too large
- **Type:** Negative
- **Priority:** P1
- **Preconditions:** `/ui-elements/file-upload/` is open; fresh browser context; files are synthetic in-memory buffers (`data/synthetic-files.ts`).

**Acceptance criteria**
- One byte over the cap is rejected.

**Steps**
1. Choose a PNG padded to 1,048,577 bytes.

**Expected result**
- The input holds 1,048,577 bytes; error "File exceeds 1MB cap."; name shown; no preview.

## TC-UPL-006 — Choosing a valid file after a rejected one clears the error and shows the preview
- **Type:** Functional
- **Priority:** P1
- **Preconditions:** `/ui-elements/file-upload/` is open; fresh browser context; files are synthetic in-memory buffers (`data/synthetic-files.ts`).

**Acceptance criteria**
- The error belongs to the last choice only.

**Steps**
1. Choose `qa-notes.txt`.
2. Choose `qa-avatar.png`.

**Expected result**
- After step 1: the unsupported-type error.
- After step 2: no error, name `qa-avatar.png`, "Preview hydrated.", decoded 1×1.

## TC-UPL-007 — Choosing another image replaces the preview
- **Type:** Edge
- **Priority:** P2
- **Preconditions:** `/ui-elements/file-upload/` is open; fresh browser context; files are synthetic in-memory buffers (`data/synthetic-files.ts`).

**Acceptance criteria**
- The preview always shows the latest accepted image.

**Steps**
1. Choose the 1×1 PNG.
2. Choose the 2×2 PNG `qa-avatar-2.png`.

**Expected result**
- The preview `src` changes, one preview only, decoded size 1×1 then 2×2, name `qa-avatar-2.png`, no error.

## TC-UPL-008 — The app receives the exact name, MIME type and size and reports the right result (data-driven: png, jpeg, txt, pdf, oversize)
- **Type:** Functional
- **Priority:** P1
- **Preconditions:** `/ui-elements/file-upload/` is open; fresh browser context; files are synthetic in-memory buffers (`data/synthetic-files.ts`).

**Acceptance criteria**
- What the app validates (`input.files[0]`) is exactly the synthetic file, and the visible result matches the source rules.

**Steps**
1. Choose each file.

**Expected result**
- `input.files[0]` = {name, type, size} of the synthetic file.
- Name shown.
- png/jpeg: no error, 1 preview.
- txt/pdf: unsupported-type error, no preview.
- oversize: "File exceeds 1MB cap.", no preview.
