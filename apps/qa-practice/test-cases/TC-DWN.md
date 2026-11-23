# File Download — test cases

Module: `/ui-elements/file-download/` · Automated in `apps/qa-practice/tests/file-download/file-download.spec.ts`
Source of expected values: QA Practice `FileDownloadWidget` / `downloadBlob` (`data.tsx`) at revision 3d14d23, the production build per `/release-info.json`; identical in the local build d856264. Data: `apps/qa-practice/data/file-download.data.ts`.

> **Scope and safety.** The files are Blobs built in the browser and downloaded through a temporary `<a download>`; nothing is fetched or sent, and the Production Guard reports confirm it. Downloaded files live only in Playwright's temporary download folder for the test and are never attached to evidence.

> **Personal data.** The CSV contains a real-looking e-mail address on the app owner's domain. It is not copied into test data or this document. Tests check only structure, and every CSV assertion reports counts or booleans, so a failure message cannot contain it.

> **MIME type.** Playwright's Download object has no MIME type. A test-side init script (`apps/qa-practice/support/downloads.ts`) records the type and size of each Blob passed to `URL.createObjectURL` and every revoked URL, without changing the app's behaviour.

> **Revoke timing.** The app revokes each blob URL 500 ms after the click. Playwright saves a download when it starts, so reading the file afterwards is safe; this was measured in Chromium, Firefox and WebKit and is asserted by TC-DWN-007.

## TC-DWN-001 — The TXT download has the exact name and content
- **Type:** Smoke
- **Priority:** P1
- **Preconditions:** `/ui-elements/file-download/` is open; fresh browser context; `URL.createObjectURL`/`revokeObjectURL` are recorded by a test-side init script (observation only).

**Acceptance criteria**
- The TXT file is generated in the browser with fixed content.

**Steps**
1. Check the initial result text.
2. Press "Download TXT".

**Expected result**
- Initially "No download yet."
- Download `validation-lab-sample.txt`, content exactly "Validation Lab TXT download\nDownloaded from UI Elements.\n", UI "validation-lab-sample.txt (57 bytes)".

## TC-DWN-002 — The CSV download has the expected header, one data row and four fields per row
- **Type:** Functional
- **Priority:** P1
- **Preconditions:** `/ui-elements/file-download/` is open; fresh browser context; `URL.createObjectURL`/`revokeObjectURL` are recorded by a test-side init script (observation only).

**Acceptance criteria**
- The CSV structure is correct. Its content is never copied into test data or messages (it holds a real-looking address).

**Steps**
1. Press "Download CSV".

**Expected result**
- Name `validation-lab-users.csv`, header `name,email,role,status`, 1 data row, 4 fields, the email column is a well-formed address (asserted as a boolean), file ends with a newline.

## TC-DWN-003 — The PDF download has a PDF header, an end marker and the catalog and pages objects
- **Type:** Functional
- **Priority:** P1
- **Preconditions:** `/ui-elements/file-download/` is open; fresh browser context; `URL.createObjectURL`/`revokeObjectURL` are recorded by a test-side init script (observation only).

**Acceptance criteria**
- The PDF starts and ends as a PDF and contains the two objects the app writes.

**Steps**
1. Press "Download PDF".

**Expected result**
- Name `validation-lab-sample.pdf`, starts with `%PDF-1.4`, ends with `%%EOF`, contains `1 0 obj<</Type/Catalog/Pages 2 0 R>>` and `2 0 obj<</Type/Pages/Count 0>>`. Structural gaps (no xref/trailer, 0 pages) are in OBS-04, not asserted.

## TC-DWN-004 — Name, size and MIME type agree between the download, the Blob and the UI (data-driven: txt, csv, pdf)
- **Type:** Functional
- **Priority:** P1
- **Preconditions:** `/ui-elements/file-download/` is open; fresh browser context; `URL.createObjectURL`/`revokeObjectURL` are recorded by a test-side init script (observation only).

**Acceptance criteria**
- Playwright's download, the Blob the page created and the UI text describe the same file.

**Steps**
1. Press one download button.

**Expected result**
- Suggested name as in the source; exactly one Blob; its type is `text/plain`, `text/csv` or `application/pdf`; its size equals the downloaded bytes (57, 66, 95); the download URL is that Blob's URL; UI "<name> (<bytes> bytes)".

## TC-DWN-005 — Consecutive TXT, CSV and PDF downloads are separate files
- **Type:** Functional
- **Priority:** P2
- **Preconditions:** `/ui-elements/file-download/` is open; fresh browser context; `URL.createObjectURL`/`revokeObjectURL` are recorded by a test-side init script (observation only).

**Acceptance criteria**
- Each click produces its own file with its own content.

**Steps**
1. Download TXT, then CSV, then PDF.

**Expected result**
- Three expected names, each content matching its type (TXT text, CSV header, PDF header), three distinct saved files, Blob types in click order, UI shows the last one (PDF).

## TC-DWN-006 — Downloading the same file twice gives two independent, identical files
- **Type:** Edge
- **Priority:** P2
- **Preconditions:** `/ui-elements/file-download/` is open; fresh browser context; `URL.createObjectURL`/`revokeObjectURL` are recorded by a test-side init script (observation only).

**Acceptance criteria**
- A repeated download is a new file, not a reuse.

**Steps**
1. Download TXT twice.

**Expected result**
- Same bytes, two different saved paths, two Blobs with different URLs.

## TC-DWN-007 — The UI reports the download and the blob URL is revoked afterwards
- **Type:** Edge
- **Priority:** P2
- **Preconditions:** `/ui-elements/file-download/` is open; fresh browser context; `URL.createObjectURL`/`revokeObjectURL` are recorded by a test-side init script (observation only).

**Acceptance criteria**
- The app releases each blob: URL (500 ms after the click) and the saved file stays complete.

**Steps**
1. Check "No download yet.".
2. Download the PDF.
3. Wait for the revocation.

**Expected result**
- UI "validation-lab-sample.pdf (95 bytes)"; the PDF's blob URL is revoked (within 2 s); the saved file, re-read from disk, still has the Blob's size.
