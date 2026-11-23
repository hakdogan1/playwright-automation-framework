# Dropdowns — test cases

Modules: `/ui-elements/select/` (native select) and `/ui-elements/searchable-select/` (custom combobox)
Automated in `apps/qa-practice/tests/dropdowns/dropdowns.spec.ts`

## TC-DDL-001 — Native select defaults to Playwright and lists the supported tools
- **Type:** Smoke
- **Priority:** P1
- **Preconditions:** Single Select page is open.

**Acceptance criteria**
- Default value is Playwright; the option list is exactly the five supported tools in order.

**Steps**
1. Open `/ui-elements/select/`.
2. Inspect the "Preferred QA tool" select.

**Expected result**
- Value is `playwright`, summary reads "Tool: Playwright".
- Options: Playwright, Selenium WebDriver, Cypress, WebdriverIO, Appium.

## TC-DDL-002 — Selecting an option updates the summary
- **Type:** Functional
- **Priority:** P1
- **Preconditions:** Single Select page is open.

**Acceptance criteria**
- Every option can be selected and the summary reflects it.

**Steps**
1. Select each option by its label.

**Expected result**
- Summary reads "Tool: <label>" for the selected option.

## TC-DDL-003 — Focusing the searchable select lists every country
- **Type:** Smoke
- **Priority:** P1
- **Preconditions:** Searchable Select page is open.

**Acceptance criteria**
- Nothing is selected initially; focusing opens the full list.

**Steps**
1. Open `/ui-elements/searchable-select/`.
2. Focus the Country field.

**Expected result**
- "Selected: —" before interaction.
- The listbox is visible with all 10 countries.

## TC-DDL-004 — Typing filters the list and clicking selects
- **Type:** Functional
- **Priority:** P1
- **Preconditions:** Searchable Select page is open.

**Acceptance criteria**
- The list filters by substring; choosing an option fills the field and closes the list.

**Steps**
1. Type `ger`.
2. Click "Germany".

**Expected result**
- Exactly one option, Germany, is listed.
- "Selected: Germany", the field value is "Germany", the list is closed.

## TC-DDL-005 — A search with no match shows the empty state
- **Type:** Negative
- **Priority:** P2
- **Preconditions:** Searchable Select page is open.

**Acceptance criteria**
- An unmatched query shows an empty state and selects nothing.

**Steps**
1. Type `zzz`.

**Expected result**
- "No matches." is shown, no options are listed, selection stays "—".

## TC-DDL-006 — Keyboard selection with ArrowDown and Enter
- **Type:** Functional
- **Priority:** P2
- **Preconditions:** Searchable Select page is open.

**Acceptance criteria**
- The highlighted option moves with the arrow keys and Enter selects it.

**Steps**
1. Focus the field.
2. Press ArrowDown, then Enter.

**Expected result**
- The second option (Tunisia) is highlighted (`aria-selected="true"`) and then selected.
- The list closes.

## TC-DDL-007 — Search ignores case and diacritics
- **Type:** Edge
- **Priority:** P3
- **Preconditions:** Searchable Select page is open.

**Acceptance criteria**
- Matching folds case and removes diacritics (Turkish characters included).

**Steps**
1. Type `TÜRK`.

**Expected result**
- Exactly one option, Turkey, is listed.

## TC-DDL-008 — Clear resets the selection and Escape closes the list
- **Type:** Functional
- **Priority:** P2
- **Preconditions:** Searchable Select page is open.

**Acceptance criteria**
- Clear removes the selection and reopens the list; Escape closes it.

**Steps**
1. Search and select "Japan".
2. Press the clear button.
3. Press Escape.

**Expected result**
- After clear: "Selected: —", empty field, list visible.
- After Escape: list hidden.
