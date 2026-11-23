# [OBS-03] File Upload: rejected files leave the old preview, and validation is looser than stated

> **Status: DRAFT bug report — not filed.** Found while automating TC-UPL (Faz 2C.2B). Not a seeded Bug Playground defect, no Bug-ID and no automated test; kept outside `docs/bug-reports/` on purpose. It is filed only on the owner's decision. QA Practice source was not modified.
>
> (Earlier reports mentioned an "OBS-03 candidate" for the iframes postMessage origin check. That candidate was never written up and will get the next free number.)

- **Type:** Functional / validation
- **Severity (proposed):** Medium for findings 1 and 4 (the UI shows a state that is not the real one). Low for 2 and 3 (lab-level validation gaps).
- **Module:** `/ui-elements/file-upload/` (`FileUploadWidget`, `data.tsx`)

## Findings
All four were observed identically in Chromium, Firefox and WebKit on the local build d856264, whose `data.tsx` is identical to the production build 3d14d23. Runs: `20261123T100516Z-30cc33` (Chromium), `…100520Z-334128` (Firefox), `…100525Z-6b533b` (WebKit). Each was a temporary observation spec, deleted afterwards; it recorded state and asserted nothing.

| # | Steps | Expected | Actual | Cause in the source |
|---|---|---|---|---|
| 1 | Choose a valid JPEG, then a `.txt` file | Error and **no** preview, or the previous file clearly kept | Error "Unsupported file type…" **and the previous 3×2 JPEG preview stays**, next to the name `qa-notes.txt` | `onChange` sets the error and returns before `setPreview`, and never clears the old preview |
| 2 | Choose a 1×1 GIF (`image/gif`) | Rejected ("Use a PNG or JPG", `accept="image/png, image/jpeg"`) | **Accepted**, previewed at 1×1 | The check is `file.type.startsWith("image/")`, so any image type passes (GIF, WebP, SVG…) |
| 3 | Choose text bytes declared as `image/png` (`not-really.png`) | Rejected or an error when the image cannot be decoded | **Accepted**, "Preview hydrated." shown, the image decodes to 0×0 (broken) | Only the declared MIME type is checked, never the content |
| 4 | Choose a file, then clear the selection (empty file list) | Back to "No file chosen", no preview | The input is empty, **but the old name and preview stay** | With no file, `onChange` clears only the error and returns |

Other observations:
- During all four steps the page made **0 network requests** (besides `blob:`/`data:`). The widget is client-only, as the source shows.
- `URL.createObjectURL` is called for every accepted file and never revoked (memory). This is a code-reading finding only; it is not tested.

## Why it matters
Findings 1 and 4 make the UI claim a state that is not the real one: the picture shown is not the selected file. In a real avatar or KYC upload this is how wrong images get submitted. Findings 2 and 3 show validation that differs from the promise in the UI text, which is a classic contract mismatch between client and server.

## Automation
Not automated. TC-UPL-001…008 assert only the intended, source-verified behaviour. If the owner confirms these as defects, they can follow the Bug Playground pattern (reproduce + `test.fail` expected test with a Bug-ID). That needs approval and is outside Faz 2C.2B.
