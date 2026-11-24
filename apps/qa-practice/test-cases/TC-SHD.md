# Shadow DOM — test cases

Module: `/ui-elements/shadow-dom/` · Automated in `apps/qa-practice/tests/shadow-dom/shadow-dom.spec.ts`
Source of expected values: QA Practice `ShadowDomWidget` (`data.tsx`) at revision 3d14d23, the production build per `/release-info.json`; identical in the local build d856264. Data: `apps/qa-practice/data/embed-dates.data.ts`.

> **Locators.** Playwright locators pierce open shadow roots, so the page object uses ordinary role and test-id locators scoped to the host.

## TC-SHD-001 — The button and the counter inside the shadow root are reachable
- **Type:** Smoke
- **Priority:** P1
- **Preconditions:** `/ui-elements/shadow-dom/` is open; fresh browser context.

**Acceptance criteria**
- Shadow content is visible and usable.

**Steps**
1. Locate the button and the counter.

**Expected result**
- "Increment (inside shadow)" visible and enabled; "count: 0".

## TC-SHD-002 — Each click increments the counter
- **Type:** Functional
- **Priority:** P1
- **Preconditions:** `/ui-elements/shadow-dom/` is open; fresh browser context.

**Acceptance criteria**
- The shadow button updates its own counter.

**Steps**
1. Click three times.

**Expected result**
- "count: 1", "count: 2", "count: 3".

## TC-SHD-003 — The keyboard activates the shadow button too
- **Type:** Functional
- **Priority:** P2
- **Preconditions:** `/ui-elements/shadow-dom/` is open; fresh browser context.

**Acceptance criteria**
- The button is a native, keyboard-operable button.

**Steps**
1. Focus the button, press Enter, then Space.

**Expected result**
- "count: 2".

## TC-SHD-004 — The elements live only in one open shadow root, not in the light DOM
- **Type:** Edge
- **Priority:** P2
- **Preconditions:** `/ui-elements/shadow-dom/` is open; fresh browser context.

**Acceptance criteria**
- The shadow boundary is real and the root is attached once.

**Steps**
1. Query the light DOM and the shadow root.

**Expected result**
- 0 matches for the button/counter test IDs in the light DOM; shadow root mode `open`; exactly 1 button in it.
