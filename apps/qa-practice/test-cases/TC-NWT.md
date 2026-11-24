# New Tab / Window — test cases

Module: `/ui-elements/new-tab/` · Automated in `apps/qa-practice/tests/new-tab/new-tab.spec.ts`
Source of expected values: QA Practice `NewTabWidget` (`data.tsx`) at revision 3d14d23, the production build per `/release-info.json`; identical in the local build d856264. Data: `apps/qa-practice/data/embed-dates.data.ts`. Destination: `app/practice/new-tab/destination/page.tsx`.

> **Guard.** The new tab belongs to the same browser context, so the Production Guard (context level) covers its requests too.

> **Not asserted here (see `docs/observations/OBS-08-image-lab-and-new-tab.md`).** The destination's document title is the site default, not its own metadata title "New Tab destination".

## TC-NWT-001 — The link targets a new tab without referrer
- **Type:** Smoke
- **Priority:** P1
- **Preconditions:** `/ui-elements/new-tab/` is open; fresh browser context.

**Acceptance criteria**
- The link is set up as a safe new-tab link.

**Steps**
1. Inspect the "Open destination ↗" link.

**Expected result**
- `target="_blank"`, `rel="noreferrer"`, `href="/ui-elements/new-tab/destination"`.

## TC-NWT-002 — Clicking opens the destination page in a second tab and keeps the module open
- **Type:** Smoke
- **Priority:** P1
- **Preconditions:** `/ui-elements/new-tab/` is open; fresh browser context.

**Acceptance criteria**
- The destination opens in a new tab; the original tab is unchanged.

**Steps**
1. Click "Open destination ↗".

**Expected result**
- New tab at `/ui-elements/new-tab/destination/` with heading "Destination" and "QA Practice · popup"; the first tab still shows the module; 2 tabs.

## TC-NWT-003 — The new tab has no opener and no referrer
- **Type:** Edge
- **Priority:** P1
- **Preconditions:** `/ui-elements/new-tab/` is open; fresh browser context.

**Acceptance criteria**
- `rel="noreferrer"` takes effect (no reverse tabnabbing, no referrer leak).

**Steps**
1. Open the destination.

**Expected result**
- `window.opener === null`; `document.referrer` is empty.

## TC-NWT-004 — "Back to module" in the new tab returns that tab to the module
- **Type:** Functional
- **Priority:** P2
- **Preconditions:** `/ui-elements/new-tab/` is open; fresh browser context.

**Acceptance criteria**
- The destination links back without opening another tab.

**Steps**
1. Open the destination.
2. Click "← Back to module" in the new tab.

**Expected result**
- The new tab shows `/ui-elements/new-tab/` with heading "New Tab / Window"; the first tab is unchanged; still 2 tabs.
