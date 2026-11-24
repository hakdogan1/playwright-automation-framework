# Infinite Scroll — test cases

Module: `/ui-elements/infinite-scroll/` · Automated in `apps/qa-practice/tests/infinite-scroll/infinite-scroll.spec.ts`
Source of expected values: QA Practice `InfiniteScrollWidget` (`async.tsx`) at revision 3d14d23, the production build per `/release-info.json`; identical in the local build d856264. Data: `apps/qa-practice/data/async-overlays.data.ts`.

> **Scrolling.** `InfiniteScrollPage.scrollToGap(px)` sets the scroll position of the list box so that `px` pixels remain below the visible area, and resolves once the browser has dispatched the scroll event (it is delivered with the next rendering update; without this wait Firefox missed loads, measured 2026-11-24). The mouse wheel is not used because the mobile project is touch-based. The app loads when the remaining distance is at most 24 px; each load takes 350 ms on the paused fake clock.

> **"No load" oracle.** Absence of a load is proven by the item count after a later single load: an extra load would have added 12 more items.

## TC-INF-001 — The first page shows 12 items and no loader
- **Type:** Smoke
- **Priority:** P1
- **Preconditions:** `/ui-elements/infinite-scroll/` is open; fresh browser context. Fake clock installed and paused.

**Acceptance criteria**
- The initial page is complete and idle.

**Steps**
1. Open the page.

**Expected result**
- 12 items "Defect #000"…"Defect #011"; no loader; no "End of stream".

## TC-INF-002 — Scrolling to the bottom shows the loader and appends the next 12 items after 350 ms
- **Type:** Smoke
- **Priority:** P1
- **Preconditions:** `/ui-elements/infinite-scroll/` is open; fresh browser context. Fake clock installed and paused.

**Acceptance criteria**
- Reaching the bottom loads the next page after the delay.

**Steps**
1. Scroll to the bottom.
2. Advance 349 ms.
3. Advance 1 ms.

**Expected result**
- After 1: "Loading…". After 2: loader, 12 items. After 3: 24 items, last "Defect #023", no loader.

## TC-INF-003 — Loading continues to 60 items and then shows "End of stream"
- **Type:** Functional
- **Priority:** P1
- **Preconditions:** `/ui-elements/infinite-scroll/` is open; fresh browser context. Fake clock installed and paused.

**Acceptance criteria**
- The full dataset loads page by page and the end is announced.

**Steps**
1. Scroll to the bottom and wait 350 ms, four times.

**Expected result**
- 24, 36, 48, 60 items; last "Defect #059"; "End of stream".

## TC-INF-004 — A load starts at 24 px from the bottom, not at 25 px
- **Type:** Edge
- **Priority:** P1
- **Preconditions:** `/ui-elements/infinite-scroll/` is open; fresh browser context. Fake clock installed and paused.

**Acceptance criteria**
- The threshold is 24 px.

**Steps**
1. Scroll to 25 px above the bottom, wait 350 ms.
2. Scroll to 24 px above the bottom, wait 350 ms.

**Expected result**
- After 2: the loader was shown and there are exactly 24 items (36 if 25 px had loaded too).

## TC-INF-005 — Scrolling again while a page is loading does not load twice
- **Type:** Negative
- **Priority:** P1
- **Preconditions:** `/ui-elements/infinite-scroll/` is open; fresh browser context. Fake clock installed and paused.

**Acceptance criteria**
- A load in progress blocks further loads.

**Steps**
1. Scroll to the bottom.
2. While loading, scroll up 100 px and back to the bottom.
3. Wait 350 ms.

**Expected result**
- Exactly 24 items; no loader.

## TC-INF-006 — After the end of the stream, scrolling loads nothing more
- **Type:** Edge
- **Priority:** P2
- **Preconditions:** `/ui-elements/infinite-scroll/` is open; fresh browser context. Fake clock installed and paused.

**Acceptance criteria**
- No load is started after the last page.

**Steps**
1. Load all 60 items.
2. Scroll up and back to the bottom, wait 1050 ms.

**Expected result**
- No loader; 60 items; "End of stream" still shown.
