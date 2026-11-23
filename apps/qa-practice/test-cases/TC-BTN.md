# Buttons — test cases

Module: `/ui-elements/buttons/` · Automated in `apps/qa-practice/tests/buttons/buttons.spec.ts`

## TC-BTN-001 — All button variants render in their initial state
- **Type:** Smoke
- **Priority:** P1
- **Preconditions:** Buttons page is open.

**Acceptance criteria**
- Click, double-click, right-click and hover buttons are enabled.
- The disabled button is disabled.
- The loading button shows "Click to Load".
- The feedback panel shows the initial instruction.

**Steps**
1. Open `/ui-elements/buttons/`.
2. Inspect every button and the feedback panel.

**Expected result**
- Four interactive buttons are enabled, "Disabled Button" is disabled.
- Loading button text is "Click to Load".
- Feedback message is "Choose a button to see its behavior."

## TC-BTN-002 — Single click is reported
- **Type:** Functional
- **Priority:** P1
- **Preconditions:** Buttons page is open.

**Acceptance criteria**
- A single click on "Click Me" is acknowledged in the card and the shared feedback panel.

**Steps**
1. Click "Click Me".

**Expected result**
- Card status and feedback message read "Click detected."
- Feedback panel variant is `click`.

## TC-BTN-003 — Double click is reported
- **Type:** Functional
- **Priority:** P2
- **Preconditions:** Buttons page is open.

**Acceptance criteria**
- A double click on "Double Click Me" is acknowledged.

**Steps**
1. Double-click "Double Click Me".

**Expected result**
- Card status and feedback message read "Double-click detected."

## TC-BTN-004 — A single click on the double-click button is ignored
- **Type:** Negative
- **Priority:** P2
- **Preconditions:** Buttons page is open.

**Acceptance criteria**
- Only a double click triggers the double-click action.

**Steps**
1. Click "Double Click Me" once.

**Expected result**
- Card status still reads "Double-click the button."
- Feedback panel variant stays `idle`.

## TC-BTN-005 — Right click is reported
- **Type:** Functional
- **Priority:** P2
- **Preconditions:** Buttons page is open.

**Acceptance criteria**
- A context-menu click is acknowledged and the browser menu is suppressed.

**Steps**
1. Right-click "Right Click Me".

**Expected result**
- Card status and feedback message read "Right-click detected."

## TC-BTN-006 — Hover shows the tooltip and leaving hides it
- **Type:** Functional
- **Priority:** P2
- **Preconditions:** Buttons page is open, desktop pointer.

**Acceptance criteria**
- The tooltip is hidden by default, visible while hovering, hidden again after leaving.

**Steps**
1. Hover "Hover Over Me".
2. Move the pointer away from the card.

**Expected result**
- While hovering the tooltip is visible and the feedback reads "Hover detected."
- After leaving, the tooltip is hidden.

## TC-BTN-007 — The disabled button cannot be activated
- **Type:** Negative
- **Priority:** P1
- **Preconditions:** Buttons page is open.

**Acceptance criteria**
- The disabled button is disabled for pointer and assistive technology.

**Steps**
1. Inspect "Disabled Button".

**Expected result**
- The button is disabled and has `aria-disabled="true"`.
- No feedback is shown (variant `idle`).

## TC-BTN-008 — Each attempt on the disabled button is counted
- **Type:** Edge
- **Priority:** P3
- **Preconditions:** Buttons page is open.

**Acceptance criteria**
- Every attempt on the "Try disabled button" control increments the counter by one.

**Steps**
1. Press "Try disabled button" three times.

**Expected result**
- Counter reads `attempts=1`, `attempts=2`, `attempts=3` after each press.
- Feedback reads "This button is disabled and cannot be clicked."

## TC-BTN-009 — The loading button runs one async action and completes
- **Type:** Functional
- **Priority:** P1
- **Preconditions:** Buttons page is open.

**Acceptance criteria**
- While loading the button is busy and disabled, so it cannot start a second action.
- When the action ends the button is enabled again and reports success.

**Steps**
1. Click "Click to Load".
2. Observe the button while loading.
3. Wait for completion.

**Expected result**
- During loading: `aria-busy="true"`, disabled, text "Loading…".
- After loading: text "Loaded", enabled, status and feedback "Loading completed successfully."
