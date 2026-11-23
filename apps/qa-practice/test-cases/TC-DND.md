# Drag & Drop — test cases

Module: `/ui-elements/drag-drop/` · Automated in `apps/qa-practice/tests/drag-drop/drag-drop.spec.ts`
Source of expected values: QA Practice deployed revision 3d14d23 (`apps/qa-practice/data/phase2c.data.ts`).

## TC-DND-001 — The board starts with the expected cards per column
- **Type:** Smoke
- **Priority:** P1
- **Preconditions:** `/ui-elements/drag-drop/` is open; fresh browser context (board state is not persisted).

**Acceptance criteria**
- Initial board matches the seed.

**Steps**
1. Open the page.

**Expected result**
- todo: Design test pyramid; doing: QA review, Perf budget; done: Lint config.

## TC-DND-002 — Dragging a card to another column moves it to the end
- **Type:** Functional
- **Priority:** P1
- **Preconditions:** `/ui-elements/drag-drop/` is open; fresh browser context (board state is not persisted).

**Acceptance criteria**
- A drop appends the card to the target column.

**Steps**
1. Drag "Design test pyramid" to done.

**Expected result**
- todo empty; done: Lint config, Design test pyramid.

## TC-DND-003 — Cards can be moved back and forth without duplication
- **Type:** Functional
- **Priority:** P1
- **Preconditions:** `/ui-elements/drag-drop/` is open; fresh browser context (board state is not persisted).

**Acceptance criteria**
- A card exists exactly once after repeated moves.

**Steps**
1. Drag "QA review" to done, then back to doing.

**Expected result**
- doing: Perf budget, QA review; done: Lint config; one "QA review" card.

## TC-DND-004 — Dropping a card on its own column moves it to the end
- **Type:** Edge
- **Priority:** P3
- **Preconditions:** `/ui-elements/drag-drop/` is open; fresh browser context (board state is not persisted).

**Acceptance criteria**
- Same-column drop re-appends.

**Steps**
1. Drag "QA review" onto doing.

**Expected result**
- doing: Perf budget, QA review.

## TC-DND-005 — Dropping outside any column changes nothing
- **Type:** Negative
- **Priority:** P2
- **Preconditions:** `/ui-elements/drag-drop/` is open; fresh browser context (board state is not persisted).

**Acceptance criteria**
- Drops outside drop zones are ignored.

**Steps**
1. Drag "Lint config" onto the page heading.

**Expected result**
- All columns unchanged.

## TC-DND-006 — Every card can end up in one column
- **Type:** Edge
- **Priority:** P3
- **Preconditions:** `/ui-elements/drag-drop/` is open; fresh browser context (board state is not persisted).

**Acceptance criteria**
- A column can hold all cards; others can be empty.

**Steps**
1. Drag the three other cards to done.

**Expected result**
- done holds 4 cards in drop order; todo and doing empty.
