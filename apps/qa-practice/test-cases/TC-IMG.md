# Image Handling Lab — test cases

Module: `/ui-elements/broken-images/` · Automated in `apps/qa-practice/tests/broken-images/broken-images.spec.ts`
Source of expected values: QA Practice `ImageHandlingLabWidget` (`extras.tsx`) at revision 3d14d23, the production build per `/release-info.json`; identical in the local build d856264. Data: `apps/qa-practice/data/broken-images.data.ts`.

> **Intentional lab bugs.** The four switches (missing fallback, wrong alt, infinite spinner, layout shift) are lab features, ON by default. As for the Slider lab (TC-SLD), each case checks that the defect reproduces when its switch is ON and that the intended behaviour holds when it is OFF.

> **Retry as precondition.** The initial status of a card is not a reliable oracle: an image that loads or fails before React hydrates never reports it (all five stayed "loading" in Chromium; some in Firefox and WebKit). Cases therefore press "Retry load", which mounts a new image element after hydration. When the working image already reported "loaded" (often in Firefox), Retry is disabled and there is nothing to retry; the page object then skips the click (the page load event and hydration have passed, so this check is race-free). This and "Reset images" leaving cards in "loading" are in `docs/observations/OBS-08-image-lab-and-new-tab.md`, not asserted.

> **Network.** The 404/403 cases request missing files on the app host (GET only; the Production Guard allows reads). The server answers 404 for both.

## TC-IMG-001 — Five image cases, four bug switches on by default
- **Type:** Smoke
- **Priority:** P1
- **Preconditions:** `/ui-elements/broken-images/` is open; fresh browser context.

**Acceptance criteria**
- The lab shows all cases and its default bug configuration.

**Steps**
1. Open the page.

**Expected result**
- Cards "Working image", "Broken image", "Slow loading image", "Unauthorized image", "Corrupted image"; all four switches checked; "Layout: risk of shift"; "Reset images" enabled.

## TC-IMG-002 — With the bugs off, the working image loads with its alt text and cannot be retried
- **Type:** Functional
- **Priority:** P1
- **Preconditions:** `/ui-elements/broken-images/` is open; fresh browser context. All switches off.

**Acceptance criteria**
- A working image is shown, described and final.

**Steps**
1. Retry the working image.

**Expected result**
- Status "loaded"; image visible, decoded, alt "Validation Lab brand patch"; Retry disabled.

## TC-IMG-003 — With the bugs off, each failing image shows its fallback and real alt text (data-driven: 404, 403, corrupted)
- **Type:** Functional
- **Priority:** P1
- **Preconditions:** `/ui-elements/broken-images/` is open; fresh browser context. All switches off.

**Acceptance criteria**
- Every failure has a specific fallback and the real alt text.

**Steps**
1. Retry the image.

**Expected result**
- Status "error"; fallback "Image failed to load. Showing product placeholder." / "You do not have permission to view this image." / "The image file is corrupted and cannot be previewed."; "Alt text: <real alt>"; image hidden; Retry enabled.

## TC-IMG-004 — The failed counter counts every failed card
- **Type:** Functional
- **Priority:** P2
- **Preconditions:** `/ui-elements/broken-images/` is open; fresh browser context. All switches off.

**Acceptance criteria**
- The summary counts failures only.

**Steps**
1. Retry the 404, 403 and corrupted images.
2. Retry the working image.

**Expected result**
- Three "error" statuses, one "loaded"; "Failed images: 3".

## TC-IMG-005 — Bug "missing fallback": the 404 image fails without fallback; off restores it
- **Type:** Functional
- **Priority:** P2
- **Preconditions:** `/ui-elements/broken-images/` is open; fresh browser context. Only "missing fallback" on.

**Acceptance criteria**
- The switch reproduces the defect and turning it off fixes it.

**Steps**
1. Retry the 404 image.
2. Turn the switch off.

**Expected result**
- On: "error", no fallback, broken native image visible. Off: fallback text shown, image hidden.

## TC-IMG-006 — Bug "wrong alt": images and fallbacks expose the wrong alt text; off restores it
- **Type:** Functional
- **Priority:** P2
- **Preconditions:** `/ui-elements/broken-images/` is open; fresh browser context. Only "wrong alt" on.

**Acceptance criteria**
- The switch reproduces the defect and turning it off fixes it.

**Steps**
1. Retry the 403 image.
2. Turn the switch off.

**Expected result**
- On: "Alt text: Decorative dashboard image"; the working image alt is the same. Off: "Alt text: Restricted user avatar"; working image alt "Validation Lab brand patch".

## TC-IMG-007 — Bug "infinite spinner": the slow image stays loading; off, it loads after 1400 ms
- **Type:** Edge
- **Priority:** P1
- **Preconditions:** `/ui-elements/broken-images/` is open; fresh browser context. Fake clock installed and paused.

**Acceptance criteria**
- The switch keeps the slow image loading forever; off, the delay is exactly 1.4 s.

**Steps**
1. Advance 10 s.
2. Turn the switch off, advance 1399 ms.
3. Advance 1 ms.

**Expected result**
- After 1: "loading", no image. After 2: "loading". After 3: "loaded", image visible.

## TC-IMG-008 — Bug "layout shift": the layout chip reports the risk; off, a stable fallback box
- **Type:** Functional
- **Priority:** P2
- **Preconditions:** `/ui-elements/broken-images/` is open; fresh browser context. Only "layout shift" on.

**Acceptance criteria**
- The layout chip reflects the switch.

**Steps**
1. Check the chip.
2. Turn the switch off.

**Expected result**
- On: "Layout: risk of shift", `data-state="error"`. Off: "Layout: stable fallback box", `data-state="stable"`.

## TC-IMG-009 — Retrying a failing image never reports it as loaded
- **Type:** Negative
- **Priority:** P1
- **Preconditions:** `/ui-elements/broken-images/` is open; fresh browser context. All switches off.

**Acceptance criteria**
- Retries cannot turn a missing image into a success.

**Steps**
1. Retry the 404 image three times.

**Expected result**
- Each time: "error" and the fallback visible.
