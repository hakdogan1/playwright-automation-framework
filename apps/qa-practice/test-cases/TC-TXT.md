# Generate Text File — test cases

Module: `/ui-elements/generate-text-file/` · Automated in `apps/qa-practice/tests/generate-text-file/generate-text-file.spec.ts`
Source of expected values: QA Practice `GenerateTextFileWidget / downloadBlob` (`data.tsx`) at revision 3d14d23, the production build per `/release-info.json`; identical in the local build d856264. Data: `apps/qa-practice/data/otp-files.data.ts`.

> **Reuse.** Same Blob download helpers as File Download (TC-DWN); content checked in memory only. Texts are synthetic.

> **Not asserted (see `docs/observations/OBS-10-otp-and-text-file.md`).** An empty textarea is downloaded as a 0-byte file with "ready · 0 bytes" and no hint.

## TC-TXT-001 — The default text is downloaded exactly and the UI reports its size
- **Type:** Smoke
- **Priority:** P1
- **Preconditions:** `/ui-elements/generate-text-file/` is open; fresh browser context; object URLs recorded by a test-side init script (observation only).

**Acceptance criteria**
- The prefilled text becomes the file.

**Steps**
1. Check the textarea and result.
2. Press "Generate file".

**Expected result**
- Textarea holds the release-notes sample; "Generated file not downloaded yet."
- File `generated-qa-notes.txt` with exactly that text; "generated-qa-notes.txt ready · <bytes> bytes".

## TC-TXT-002 — Edited multi-line text is downloaded exactly
- **Type:** Functional
- **Priority:** P1
- **Preconditions:** `/ui-elements/generate-text-file/` is open; fresh browser context; object URLs recorded by a test-side init script (observation only).

**Acceptance criteria**
- Line breaks, blank lines and indentation are kept.

**Steps**
1. Replace the text (5 lines, blank line, indentation, no trailing newline); generate.

**Expected result**
- Exactly the same text; size in bytes reported.

## TC-TXT-003 — Non-ASCII text is UTF-8 encoded and its size is counted in bytes
- **Type:** Edge
- **Priority:** P1
- **Preconditions:** `/ui-elements/generate-text-file/` is open; fresh browser context; object URLs recorded by a test-side init script (observation only).

**Acceptance criteria**
- Encoding is UTF-8; the size is bytes, not characters.

**Steps**
1. Enter `Ünïcødé ✓ 🙂`; generate.

**Expected result**
- The file decodes to the same text; byte length = UTF-8 length (more than the character count); the UI shows that byte count.

## TC-TXT-004 — The Blob is text/plain, comes from a blob: URL and is revoked
- **Type:** Functional
- **Priority:** P2
- **Preconditions:** `/ui-elements/generate-text-file/` is open; fresh browser context; object URLs recorded by a test-side init script (observation only).

**Acceptance criteria**
- MIME type and lifecycle of the object URL.

**Steps**
1. Generate the file.

**Expected result**
- Download URL `blob:`; one Blob of type `text/plain` with the file's size; the URL is revoked (within 2 s).

## TC-TXT-005 — Each press downloads the current text as a new file
- **Type:** Edge
- **Priority:** P2
- **Preconditions:** `/ui-elements/generate-text-file/` is open; fresh browser context; object URLs recorded by a test-side init script (observation only).

**Acceptance criteria**
- The file always reflects the textarea at the time of the press.

**Steps**
1. Enter "first version", generate.
2. Enter "second version", generate.

**Expected result**
- Two files with the respective text, different saved paths; the UI reports the second size.
