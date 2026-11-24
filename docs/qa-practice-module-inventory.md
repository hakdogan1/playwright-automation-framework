# QA Practice — module inventory

Source: QA Practice repository at the **deployed revision `3d14d23`**. The production app build reports this revision in `/release-info.json` (checked 2026-11-23); `origin/main` is `95a568e`, which differs only in `public/.htaccess`. Read with
`git show` (no checkout, no changes). Every `/ui-elements/<slug>/` route below returned HTTP 200
in production on 2026-11-22. Widget code is identical between the deployed revision and the local
build used for isolated runs (`d856264`): only `forms`, `layout`, `practice` and `sitemap` pages differ.

Legend — **Automated**: covered with TC-IDs (phase in brackets) · **Planned 2B**: suitable, not yet automated ·
**Needs isolation**: has side effects or depends on real services; do not run against production
without a mock/safe design.

## Coverage summary (updated 2026-11-24, Faz 2C.6)

| Scope | Automated | Notes |
|---|---|---|
| UI modules (`/ui-elements/<slug>/`) | **46 / 46** | Phase 1: 5 · 2A: 10 · 2C.1: 5 (Keyboard Keys, Slider, Drag & Drop, Dynamic Table, Notifications) · 2C.2A: 1 (Form Register) · 2C.2B: 1 (File Upload) · 2C.2C: 1 (File Download) · 2C.2D: 1 (Iframes) · 2C.2E: 1 (Date Range Picker) · 2C.3: 5 (Alerts, Toast Messages, Loader / Spinner, Lazy Loaded Elements, Infinite Scroll) · 2C.4: 5 (Tables, New Tab / Window, Shadow DOM, Date Picker, Image Handling Lab) · 2C.5: 8 (Login, Contact, Address, Payment, Checkout, Profile, Multi-Step, Validation Errors forms) · 2C.6: 3 (OTP Login, PDF Download, Generate Text File). The 46 is the number of built slug pages; the table below has 39 rows because one row groups the 8 remaining form slugs. |
| Bug Playground (`/bug-playground/`) | **15 / 15 defects** | **Not counted in the 46/46.** It is a separate signed-in lab route, not a `/ui-elements/` module (see the route table below). |
| TC-IDs | **293** | 278 for UI modules (40 from 2C.1, 12 from 2C.2A, 8 from 2C.2B, 7 from 2C.2C, 8 from 2C.2D, 11 from 2C.2E, 24 from 2C.3, 27 from 2C.4, 43 from 2C.5, 19 from 2C.6) + 15 TC-BUG. Each one is documented in `apps/qa-practice/test-cases/` and referenced by a spec (`npm run tc:validate`). |
| Bug-IDs | **15** | BUG-BP-01…15, one TC-BUG each; `docs/bug-playground-matrix.md` |
| Observations (no Bug-ID) | OBS-01 … OBS-10 | OBS-01: demo session queries production Supabase (blocked by the guard; `bug-playground-matrix.md`). OBS-02: slider lab layout collapse (draft, `docs/observations/OBS-02-slider-lab-layout.md`). OBS-03: file upload keeps the old preview after a rejected file, accepts any `image/*` and does not check the content (draft, `docs/observations/OBS-03-file-upload-validation.md`). OBS-04: the sample PDF has no xref/trailer and 0 pages; the sample CSV uses a real-looking address (draft, `docs/observations/OBS-04-file-download-content.md`). OBS-05: the iframes parent counts submit messages from any window (no origin/source check) and the "nested" frame is a sibling (draft, `docs/observations/OBS-05-iframes-messaging.md`). OBS-06: the date range shows hour 00 as 09, an empty time as 09:00, accepts end-before-start on one day and has no weekday alignment (draft, `docs/observations/OBS-06-date-range-time-handling.md`). OBS-07: Loader "Force error" during loading is overwritten by the pending timer (error + metrics at once), Lazy Load restarts are not handled, toast IDs can collide (draft, `docs/observations/OBS-07-async-timer-races.md`). OBS-08: Image Handling Lab statuses miss image events before hydration (all "loading" in Chromium), "Reset images" gets stuck in "loading", the 403 case is a 404, and the New Tab destination has the site default title (draft, `docs/observations/OBS-08-image-lab-and-new-tab.md`). OBS-06 also covers the Date Picker. OBS-09: Form Lab profile selects fail as "required" while showing a value, Reset races the pending validation, Reset keeps the file input, label/message mismatches, a fixed-year expiry rule, and trigger accounts on a non-reserved domain (draft, `docs/observations/OBS-09-form-lab.md`). OBS-10: the OTP is not bound to the username, a refused resend keeps the old session, formatted codes are cut by `maxLength`, and an empty text file is generated without a hint (draft, `docs/observations/OBS-10-otp-and-text-file.md`). |

## UI elements (`/ui-elements/<slug>/`, 46 modules)

| Slug | Title | Category | Status | TC prefix | Notes |
|---|---|---|---|---|---|
| buttons | Buttons | Forms | **Automated** (Phase 1) | TC-BTN | 9 TCs |
| inputs | Inputs | Forms | **Automated** (Phase 1) | TC-INP | 7 TCs |
| select | Single Select | Selection | **Automated** (Phase 1) | TC-DDL | native select (TC-DDL-001/002) |
| searchable-select | Searchable Select | Selection | **Automated** (Phase 1) | TC-DDL | combobox (TC-DDL-003…008) |
| modals | Popups / Modals | Overlays | **Automated** (Phase 1) | TC-MOD | 7 TCs |
| checkbox | Checkboxes | Selection | **Automated** (2A) | TC-CHK | parent/indeterminate logic |
| radio | Radio Buttons | Selection | **Automated** (2A) | TC-RAD | group + keyboard |
| multi-select | Multi Select | Selection | **Automated** (2A) | TC-MSL | toggle chips |
| tabs | Tabs | Navigation | **Automated** (2A) | TC-TAB | hash deep links |
| accordions | Accordions | Navigation | **Automated** (2A) | TC-ACC | single-open, aria-controls |
| javascript-alerts | JavaScript Alerts | Overlays | **Automated** (2A) | TC-JSA | native dialogs, prompt loop |
| double-click | Double Click | Mouse | **Automated** (2A) | TC-DBL | inline edit |
| right-click | Right Click | Mouse | **Automated** (2A) | TC-RCL | role="menu" |
| static-table | Static Table | Tables | **Automated** (2A) | TC-TBL | header-based cell lookup |
| pagination | Pagination | Tables | **Automated** (2A) | TC-PAG | boundaries |
| keyboard-keys | Keyboard Keys | Forms | **Automated** (2C.1) | TC-KEY | 10 TCs (13 tests): typing metrics, OTP, debounced search (fake clock), password score, phone mask, challenge |
| slider | Slider Interaction Lab | Selection | **Automated** (2C.1) | TC-SLD | 8 TCs (11 tests): bug switches, clamping, keyboard, drag (centre start, bounded press value; Firefox mousedown commit documented in TC-SLD.md). Layout observation OBS-02 (draft) |
| date-picker | Date Picker | Date & Files | **Automated** (2C.4) | TC-DTP | 7 TCs: today fixed with `setFixedTime`, pick closes the calendar, time applied before/after, year crossing, leap day. OBS-06 (draft) also applies |
| date-range | Date Range Picker | Date & Files | **Automated** (2C.2E) | TC-DTR | 11 TCs (14 tests): today fixed with `page.clock.setFixedTime` (timers stay real), chip as oracle (cells have no a11y state), year rollover, cross-month ranges, month lengths incl. leap year. Observation OBS-06 (draft) |
| broken-images | Image Handling Lab | Date & Files | **Automated** (2C.4) | TC-IMG | 9 TCs (11 tests): the four intentional bug switches on/off, fallbacks and alt texts, 1400 ms slow image on the paused fake clock; statuses read after Retry (hydration race). Observation OBS-08 (draft) |
| file-upload | File Upload | Date & Files | **Automated** (2C.2B) | TC-UPL | 8 TCs (13 tests): synthetic in-memory PNG/JPEG/TXT/PDF, exact 1 MiB boundary, decoded preview size; client-only (no request with a write method or body). Observation OBS-03 (draft) |
| file-download | File Download | Date & Files | **Automated** (2C.2C) | TC-DWN | 7 TCs (9 tests): TXT/CSV/PDF content checks in memory, Blob MIME/size via a test-side object-URL recorder, revoke after 500 ms; CSV address never stored or printed. Observation OBS-04 (draft) |
| pdf-download | PDF Download | Date & Files | **Automated** (2C.6) | TC-PDF | 4 TCs: exact content, Blob MIME/size, revoke, blob: URL only (File Download helpers reused) |
| generate-text-file | Generate Text File | Date & Files | **Automated** (2C.6) | TC-TXT | 5 TCs: exact content incl. multi-line and UTF-8 byte size, Blob MIME, revoke. Observation OBS-10 (draft) |
| drag-drop | Drag & Drop | Mouse | **Automated** (2C.1) | TC-DND | 6 TCs: HTML5 drag between columns, order, no-op drop |
| tables | Tables | Tables | **Automated** (2C.4) | TC-TBS | 3 TCs: route-level only; same `DynamicTableWidget` as dynamic-table, whose behaviour TC-DTB covers (`DynamicTablePage` with the Tables route) |
| dynamic-table | Dynamic Table | Tables | **Automated** (2C.1) | TC-DTB | 9 TCs: search, filter, sort, paging, edit/cancel/delete (client state only) |
| alerts | Alerts | Overlays | **Automated** (2C.3) | TC-ALR | 3 TCs: one native confirm, accept/dismiss/repeat |
| notifications | Notifications | Overlays | **Automated** (2C.1) | TC-NTF | 7 TCs (15 tests): auto-dismiss on fake clock, Close on real clock (known clock limitation, TC-NTF.md) |
| toasts | Toast Messages | Overlays | **Automated** (2C.3) | TC-TST | 6 TCs (7 tests): success auto-dismiss at 5000 ms on the paused fake clock, error stays, Close on the real clock (as TC-NTF). Observation OBS-07 (draft) |
| loader | Loader / Spinner | Async | **Automated** (2C.3) | TC-LDR | 6 TCs: 1600 ms boundary on the paused fake clock, status role, error and recovery. Observation OBS-07 (draft) |
| infinite-scroll | Infinite Scroll | Async | **Automated** (2C.3) | TC-INF | 6 TCs: scroll position set via `scrollTop` and the scroll event awaited, 24 px threshold, 350 ms per page, 60 items and end, no double load |
| lazy-load | Lazy Loaded Elements | Async | **Automated** (2C.3) | TC-LZY | 3 TCs: click-triggered (not intersection-based), 1200 ms boundary on the paused fake clock. Observation OBS-07 (draft) |
| new-tab | New Tab / Window | Navigation | **Automated** (2C.4) | TC-NWT | 4 TCs: popup tab (same context, so the guard applies), `noreferrer` (no opener, empty referrer), back link. Observation OBS-08 (draft) |
| iframes | Iframes | Embed | **Automated** (2C.2D) | TC-IFR | 8 TCs: frame locators, frame boundary both ways, parent counter via postMessage (test-side message recorder), inline `srcdoc` frames with 0 frame requests. Observation OBS-05 (draft) |
| shadow-dom | Shadow DOM | Embed | **Automated** (2C.4) | TC-SHD | 4 TCs: piercing locators, click and keyboard, one open root, nothing in the light DOM |
| otp-login | OTP Login | Forms | **Automated** (2C.6) | TC-OTP | 10 TCs (11 tests): fixed demo code, no write request (network checked), paste distribution, resend; `OtpInput` component reused. Observation OBS-10 (draft) |
| form-register | Register Form | Form Lab | **Automated** (2C.2A) | TC-FRM | 12 TCs (15 tests): `LabForm` component (shared `FormLabWidget` contract), fake + paused clock for the 360 ms validation; client-only (no network/storage in `form-lab.tsx`) |
| form-login, form-contact, form-address, form-payment, form-checkout, form-profile, form-multi-step, form-validation-errors (8) | Form Lab | Form Lab | **Automated** (2C.5) | TC-LGN, TC-CNT, TC-ADR, TC-PAY, TC-CKO, TC-PRF, TC-MSF, TC-VER | 43 TCs (71 tests): one `LabFormPage` for the six configured forms (+ `LabForm` component), separate page objects for the wizard and the validation-errors lab; fake + paused clock. Not automated: payment test-card flows (no card numbers on production) and the locked-account / used-email triggers (non-reserved addresses, privacy gate). Observation OBS-09 (draft) |

## Other areas (outside `/ui-elements/`)

| Route | Area | Status | Notes |
|---|---|---|---|
| `/register/`, `/login/`, `/forgot-password/` | Auth | **Needs isolation** | Real Supabase auth (`signUp`, `signInWithPassword`); only with `guard.mock()` |
| `/bug-playground/` (lab) | Bug Playground (15 seeded defects) | **Automated** (2B) | TC-BUG-001…015, BUG-BP-01…15; requires sign-in (demo session); see `bug-playground-matrix.md` |
| `/dashboard/`, `/wallet/`, `/users/`, `/admin/`, `/reports/`, `/settings/`, `/checkout/` (lab) | Signed-in lab shell | Planned | demo session is local; check Supabase usage per page |
| `/forms/`, `/practice/`, `/scenarios/`, `/edge-cases/` | Catalogues / scenarios | Planned | |
| `/locator-lab/`, `/locator-practice-hub/`, `/iframes-shadow-dom/`, `/script-practice/`, `/code-lab/`, `/framework/` | Learning labs | Planned | content-heavy; good for smoke |
| `/api-docs/`, `/api-testing-lab/`, `/data-api/`, `/mail/`, `/live-dashboard/` | Simulated API / data | Planned | all simulated client-side; live dashboard has random "flaky" runs |
| `/debug-lab/` | Legacy | — | redirects to Bug Playground |
| `/test/` | Internal Supabase check page | **Do not test in production** | internal |

## Next candidates
Counts: see [Coverage summary](#coverage-summary-updated-2026-11-24-faz-2c6) at the top (46 of 46 UI modules, 278 UI TC-IDs).

All 46 UI modules are automated. Documented coverage gaps: payment test-card flows (local-only, deferred), locked-account / used-email triggers (after a switch to reserved domains), and the product behaviours recorded in OBS-01…OBS-10. Selection and order of the next phase are not decided yet.
