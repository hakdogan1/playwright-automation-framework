# Tabs — test cases

Module: `/ui-elements/tabs/` · Automated in `apps/qa-practice/tests/tabs/tabs.spec.ts`
Source of expected values: QA Practice deployed revision 3d14d23 (`apps/qa-practice/data/ui-modules.data.ts`).

## TC-TAB-001 — Overview is active on load
- **Type:** Smoke
- **Priority:** P1
- **Preconditions:** `/ui-elements/tabs/` is open; fresh browser context.

**Acceptance criteria**
- The "Project tabs" tablist shows three tabs with Overview selected.

**Steps**
1. Open the page.

**Expected result**
- Tabs: Overview, Logs, Settings.
- Overview has aria-selected="true"; the panel shows the Overview text.

## TC-TAB-002 — Selecting a tab shows its panel and updates the URL hash
- **Type:** Functional
- **Priority:** P1
- **Preconditions:** `/ui-elements/tabs/` is open; fresh browser context.

**Acceptance criteria**
- Selecting a tab switches the panel and mirrors the tab in the URL hash.

**Steps**
1. Click Logs (and, separately, Settings).

**Expected result**
- The clicked tab is selected, Overview is not.
- The panel shows that tab's text; the URL ends with #logs / #settings.

## TC-TAB-003 — A deep link with a hash opens that tab
- **Type:** Functional
- **Priority:** P2
- **Preconditions:** `/ui-elements/tabs/` is open; fresh browser context.

**Acceptance criteria**
- A URL hash selects the tab on load.

**Steps**
1. Open the page with #settings.

**Expected result**
- Settings is selected; the panel shows the Settings text.

## TC-TAB-004 — An unknown hash falls back to Overview
- **Type:** Negative
- **Priority:** P2
- **Preconditions:** `/ui-elements/tabs/` is open; fresh browser context.

**Acceptance criteria**
- Invalid hashes are ignored.

**Steps**
1. Open the page with #does-not-exist.

**Expected result**
- Overview is selected; the panel shows the Overview text.

## TC-TAB-005 — A focused tab is activated with Enter
- **Type:** Edge
- **Priority:** P3
- **Preconditions:** `/ui-elements/tabs/` is open; fresh browser context.

**Acceptance criteria**
- Tabs are keyboard operable.

**Steps**
1. Focus "Logs".
2. Press Enter.

**Expected result**
- Logs is selected; the panel shows the Logs text.
