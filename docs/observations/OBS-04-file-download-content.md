# [OBS-04] File Download: the sample PDF is structurally incomplete, and the sample CSV uses a real-looking address

> **Status: DRAFT — not filed.** Found while automating TC-DWN (Faz 2C.2C). No Bug-ID and no automated test; kept outside `docs/bug-reports/`. It is filed only on the owner's decision. QA Practice source was not modified.

- **Module:** `/ui-elements/file-download/` (`downloadBlob` / `FileDownloadWidget`, `data.tsx`, revision 3d14d23)
- **Severity (proposed):** Low (practice files), but both affect what a learner tests against.

## 1. The PDF is not a complete PDF document
**Source and download, identical in Chromium, Firefox and WebKit (95 bytes):** the file has a `%PDF-1.4` header, object 1 (`/Type/Catalog`), object 2 (`/Type/Pages`, `/Count 0`) and `%%EOF`.

What a PDF file needs (ISO 32000-1, §7.5) but this one lacks:
- **No cross-reference table** (`xref`) and **no `trailer`** with `/Root`. Readers have to repair the file or reject it.
- **0 pages** (`/Count 0`, no page objects): even a repaired file shows nothing.

**Why it matters:** a test that only checks the `%PDF-` signature (the usual first check) passes, while the file would not open as a document. TC-DWN-003 asserts what the app writes (header, objects, end marker) and leaves the gaps here, instead of claiming the file is valid.

**Suggestion for the owner:** generate a minimal one-page PDF with an xref table and a trailer, or call the file a "PDF-signature sample".

## 2. The sample CSV contains a real-looking e-mail address
The CSV's single data row uses an address on the app owner's real domain. It is deliberately not repeated here.

- **Risk:** it gets copied into test data, reports and evidence by people practising, and it can be scraped.
- **What the framework does:** the address is never stored. TC-DWN-002 checks only that the column holds a well-formed address, as a boolean.
- **Suggestion:** use a reserved domain (`example.com` / `.test`, RFC 2606).

## Evidence
- Probe runs: `20261123T120805Z-b39e79` (Chromium), `…120812Z-335b5f` (Firefox), `…120820Z-fc02cc` (WebKit). Each was a temporary spec, deleted afterwards, that logged metadata only: names, sizes, Blob types, revocations and the first 8 bytes.
- In all three engines: 57 / 66 / 95 bytes, `text/plain` / `text/csv` / `application/pdf`, each URL revoked, the saved file readable after the revoke.
