# PDF Download — test cases

Module: `/ui-elements/pdf-download/` · Automated in `apps/qa-practice/tests/pdf-download/pdf-download.spec.ts`
Source of expected values: QA Practice `PdfDownloadWidget / downloadBlob` (`data.tsx`) at revision 3d14d23, the production build per `/release-info.json`; identical in the local build d856264. Data: `apps/qa-practice/data/otp-files.data.ts`.

> **Reuse.** Same Blob download mechanism and helpers as File Download (`support/downloads.ts`, TC-DWN). The file is checked in memory and never attached to evidence.

> **Content.** The same minimal PDF as OBS-04 (no xref/trailer, 0 pages): the cases assert what the app writes, not that it is a valid document.

## TC-PDF-001 — The PDF has the exact name and content, and the UI reports its size
- **Type:** Smoke
- **Priority:** P1
- **Preconditions:** `/ui-elements/pdf-download/` is open; fresh browser context; `URL.createObjectURL`/`revokeObjectURL` recorded by a test-side init script (observation only).

**Acceptance criteria**
- The sample PDF is generated with fixed content.

**Steps**
1. Check the result text.
2. Press "Download sample PDF".

**Expected result**
- Initially "No PDF download yet."
- File `sample-validation-report.pdf` with exactly the app's 4 lines (`%PDF-1.4` … `%%EOF`); UI "sample-validation-report.pdf · 95 bytes".

## TC-PDF-002 — The Blob is application/pdf, matches the file and its URL is revoked
- **Type:** Functional
- **Priority:** P1
- **Preconditions:** `/ui-elements/pdf-download/` is open; fresh browser context; `URL.createObjectURL`/`revokeObjectURL` recorded by a test-side init script (observation only).

**Acceptance criteria**
- MIME type and size agree; the object URL is released.

**Steps**
1. Download the PDF.

**Expected result**
- One Blob of type `application/pdf` with the file's size; the download URL is that Blob URL; it is revoked (within 2 s); the saved file is still complete.

## TC-PDF-003 — Downloading twice gives two independent, identical files
- **Type:** Edge
- **Priority:** P2
- **Preconditions:** `/ui-elements/pdf-download/` is open; fresh browser context; `URL.createObjectURL`/`revokeObjectURL` recorded by a test-side init script (observation only).

**Acceptance criteria**
- Each press creates a new file and URL.

**Steps**
1. Download twice.

**Expected result**
- Identical content, different saved paths, two different Blob URLs.

## TC-PDF-004 — The file comes from a blob: URL, not from the server
- **Type:** Negative
- **Priority:** P2
- **Preconditions:** `/ui-elements/pdf-download/` is open; fresh browser context; `URL.createObjectURL`/`revokeObjectURL` recorded by a test-side init script (observation only). Request listener attached.

**Acceptance criteria**
- Nothing is downloaded from the server.

**Steps**
1. Download the PDF.

**Expected result**
- Download URL starts with `blob:`; no request for a `.pdf` path.
