# QA Practice — module inventory

Source: QA Practice repository at the **deployed revision `3d14d23`**. The production app build reports this revision in `/release-info.json` (checked 2026-11-23); `origin/main` is `95a568e`, which differs only in `public/.htaccess`. Read with
`git show` (no checkout, no changes). Every `/ui-elements/<slug>/` route below returned HTTP 200
in production on 2026-11-22. Widget code is identical between the deployed revision and the local
build used for isolated runs (`d856264`): only `forms`, `layout`, `practice` and `sitemap` pages differ.

Legend — **Automated**: covered with TC-IDs (phase in brackets) · **Planned 2B**: suitable, not yet automated ·
**Needs isolation**: has side effects or depends on real services; do not run against production
without a mock/safe design.

## Coverage summary (updated 2026-11-23, Faz 2C.2C)

| Scope | Automated | Notes |
|---|---|---|
| UI modules (`/ui-elements/<slug>/`) | **23 / 46** | Phase 1: 5 · 2A: 10 · 2C.1: 5 (Keyboard Keys, Slider, Drag & Drop, Dynamic Table, Notifications) · 2C.2A: 1 (Form Register) · 2C.2B: 1 (File Upload) · 2C.2C: 1 (File Download). The 46 is the number of built slug pages; the table below has 39 rows because one row groups the 8 remaining form slugs. |
| Bug Playground (`/bug-playground/`) | **15 / 15 defects** | **Not counted in the 20/46.** It is a separate signed-in lab route, not a `/ui-elements/` module (see the route table below). |
| TC-IDs | **161** | 146 for UI modules (40 from 2C.1, 12 from 2C.2A, 8 from 2C.2B, 7 from 2C.2C) + 15 TC-BUG. Each one is documented in `apps/qa-practice/test-cases/` and referenced by a spec (`npm run tc:validate`). |
| Bug-IDs | **15** | BUG-BP-01…15, one TC-BUG each; `docs/bug-playground-matrix.md` |
| Observations (no Bug-ID) | OBS-01 … OBS-04 | OBS-01: demo session queries production Supabase (blocked by the guard; `bug-playground-matrix.md`). OBS-02: slider lab layout collapse (draft, `docs/observations/OBS-02-slider-lab-layout.md`). OBS-03: file upload keeps the old preview after a rejected file, accepts any `image/*` and does not check the content (draft, `docs/observations/OBS-03-file-upload-validation.md`). OBS-04: the sample PDF has no xref/trailer and 0 pages; the sample CSV uses a real-looking address (draft, `docs/observations/OBS-04-file-download-content.md`). |

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
| date-picker | Date Picker | Date & Files | Planned 2B | TC-DTP | needs `page.clock` for "today" |
| date-range | Date Range Picker | Date & Files | Planned 2B | TC-DTR | needs `page.clock` |
| broken-images | Image Handling Lab | Date & Files | Planned 2B | TC-IMG | image load states |
| file-upload | File Upload | Date & Files | **Automated** (2C.2B) | TC-UPL | 8 TCs (13 tests): synthetic in-memory PNG/JPEG/TXT/PDF, exact 1 MiB boundary, decoded preview size; client-only (no request with a write method or body). Observation OBS-03 (draft) |
| file-download | File Download | Date & Files | **Automated** (2C.2C) | TC-DWN | 7 TCs (9 tests): TXT/CSV/PDF content checks in memory, Blob MIME/size via a test-side object-URL recorder, revoke after 500 ms; CSV address never stored or printed. Observation OBS-04 (draft) |
| pdf-download | PDF Download | Date & Files | Planned 2B | TC-PDF | `download` event |
| generate-text-file | Generate Text File | Date & Files | Planned 2B | TC-TXT | `download` event + content |
| drag-drop | Drag & Drop | Mouse | **Automated** (2C.1) | TC-DND | 6 TCs: HTML5 drag between columns, order, no-op drop |
| tables | Tables | Tables | Planned 2B | TC-DTB | renders the dynamic table |
| dynamic-table | Dynamic Table | Tables | **Automated** (2C.1) | TC-DTB | 9 TCs: search, filter, sort, paging, edit/cancel/delete (client state only) |
| alerts | Alerts | Overlays | Planned 2B | TC-ALR | |
| notifications | Notifications | Overlays | **Automated** (2C.1) | TC-NTF | 7 TCs (15 tests): auto-dismiss on fake clock, Close on real clock (known clock limitation, TC-NTF.md) |
| toasts | Toast Messages | Overlays | Planned 2B | TC-TST | timers → `page.clock` |
| loader | Loader / Spinner | Async | Planned 2B | TC-LDR | timers → `page.clock` |
| infinite-scroll | Infinite Scroll | Async | Planned 2B | TC-INF | scroll-triggered loading |
| lazy-load | Lazy Loaded Elements | Async | Planned 2B | TC-LZY | intersection-based |
| new-tab | New Tab / Window | Navigation | Planned 2B | TC-NWT | `context.waitForEvent('page')`; popup inherits the guard |
| iframes | Iframes | Embed | Planned 2B | TC-IFR | frame locators; check iframe sources against the allowlist first |
| shadow-dom | Shadow DOM | Embed | Planned 2B | TC-SHD | open shadow roots |
| otp-login | OTP Login | Forms | Planned 2B | TC-OTP | client-side OTP demo; random opacity jitter in QA Mode only |
| form-register | Register Form | Form Lab | **Automated** (2C.2A) | TC-FRM | 12 TCs (15 tests): `LabForm` component (shared `FormLabWidget` contract), fake + paused clock for the 360 ms validation; client-only (no network/storage in `form-lab.tsx`) |
| form-login, form-contact, form-address, form-payment, form-checkout, form-profile, form-multi-step, form-validation-errors (8) | Form Lab | Form Lab | Planned | — | same `FormLabWidget`; the first six can reuse `LabForm`. Payment/checkout: card fields → use only the app's published test cards and run locally first |

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
Counts: see [Coverage summary](#coverage-summary-updated-2026-11-23-faz-2c2c) at the top (23 of 46 UI modules, 146 UI TC-IDs).

Remaining automation-ready modules (no side effects): alerts, toasts, loader, lazy-load, infinite-scroll, new-tab, iframes, shadow-dom, file-download / pdf-download / generate-text-file, date pickers (with `page.clock`). Selection and order for Faz 2C.2 are not decided yet.
