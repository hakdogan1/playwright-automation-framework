# Right Click — test cases

Module: `/ui-elements/right-click/` · Automated in `apps/qa-practice/tests/mouse/right-click.spec.ts`
Source of expected values: QA Practice deployed revision 3d14d23 (`apps/qa-practice/data/ui-modules.data.ts`).

## TC-RCL-001 — The target is shown and no action is recorded
- **Type:** Smoke
- **Priority:** P1
- **Preconditions:** `/ui-elements/right-click/` is open; fresh browser context.

**Acceptance criteria**
- No menu and no action on load.

**Steps**
1. Open the page.

**Expected result**
- Target visible; "Action: none"; no menu.

## TC-RCL-002 — Right-click opens the menu with all actions
- **Type:** Functional
- **Priority:** P1
- **Preconditions:** `/ui-elements/right-click/` is open; fresh browser context.

**Acceptance criteria**
- Context click opens a role="menu" with the three actions.

**Steps**
1. Right-click the target.

**Expected result**
- Menu visible with Rename, Duplicate, Archive.

## TC-RCL-003 — Choosing an action records it and closes the menu
- **Type:** Functional
- **Priority:** P1
- **Preconditions:** `/ui-elements/right-click/` is open; fresh browser context.

**Acceptance criteria**
- Every menu item records its action.

**Steps**
1. Right-click, choose each item (separate tests).

**Expected result**
- "Action: <item>"; the menu is closed.

## TC-RCL-004 — A left click does not open the menu
- **Type:** Negative
- **Priority:** P2
- **Preconditions:** `/ui-elements/right-click/` is open; fresh browser context.

**Acceptance criteria**
- Only the context click opens the menu.

**Steps**
1. Left-click the target.

**Expected result**
- No menu; "Action: none".
