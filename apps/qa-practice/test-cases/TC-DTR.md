# Date Range Picker — test cases

Module: `/ui-elements/date-range/` · Automated in `apps/qa-practice/tests/date-range/date-range.spec.ts`
Source of expected values: QA Practice `DateRangeWidget` (`extras.tsx`) and `lib/datetime-display.ts` at revision 3d14d23, the production build per `/release-info.json`; identical in the local build d856264. Data: `apps/qa-practice/data/date-range.data.ts`.

> **Today.** The calendar opens on the current month, so every test fixes the date with `page.clock.setFixedTime('2026-01-15T12:00:00Z')` (TC-DTR-009 uses other dates). This fixes `Date` only; timers and animation frames stay real, so the calendar's open animation runs. Noon UTC is the same calendar day from UTC-11 to UTC+11.

> **Oracle.** Day cells have no accessible state (no `aria-pressed`/`aria-selected`), so the chip "HH:MM - DD/MM/YYYY → HH:MM - DD/MM/YYYY" is the oracle for the selection. The styling of selected cells is not asserted.

> **Not asserted here (see `docs/observations/OBS-06-date-range-time-handling.md`).** Measured in Chromium, Firefox and WebKit: hour 00 is shown as 09 (00:30 → "09:30"), an empty time is shown as 09:00, a same-day range with an end time before the start time is accepted, and the grid has no weekday headers or offset.

## TC-DTR-001 — Starts empty with default times and toggles the calendar of the current month
- **Type:** Smoke
- **Priority:** P1
- **Preconditions:** `/ui-elements/date-range/` is open; today = 15 January 2026; fresh browser context.

**Acceptance criteria**
- Initial state is an empty range with default times; the toggle opens and closes the calendar of the current month.

**Steps**
1. Check the initial state.
2. Press "Open calendar".
3. Press "Close".

**Expected result**
- Chip "— → —", times 09:00 and 17:00, button "Open calendar", no day cells.
- Open: button "Close", label "Pick range · 2026-01", 31 cells from 1 to 31.
- Closed again: button "Open calendar", no day cells.

## TC-DTR-002 — Picking a start and a later end day shows the range with the default times
- **Type:** Smoke
- **Priority:** P1
- **Preconditions:** Calendar open on January 2026.

**Acceptance criteria**
- The first pick sets the start, the second a later end.

**Steps**
1. Pick 10. 2. Pick 20.

**Expected result**
- After 1: "09:00 - 10/01/2026 → —". After 2: "09:00 - 10/01/2026 → 17:00 - 20/01/2026".

## TC-DTR-003 — An end day before the start day swaps the two
- **Type:** Functional
- **Priority:** P1
- **Preconditions:** Calendar open on January 2026.

**Acceptance criteria**
- The range is always ordered from the earlier to the later day.

**Steps**
1. Pick 20, then 10.

**Expected result**
- "09:00 - 10/01/2026 → 17:00 - 20/01/2026".

## TC-DTR-004 — Start and end times are applied to the range, also after the days are picked
- **Type:** Functional
- **Priority:** P1
- **Preconditions:** `/ui-elements/date-range/` is open; today = 15 January 2026.

**Acceptance criteria**
- The chip uses the current time inputs, before and after the days are picked.

**Steps**
1. Set 08:15 and 18:45, open the calendar, pick 3 and 9.
2. Change the times to 07:05 and 23:59.

**Expected result**
- After 1: "08:15 - 03/01/2026 → 18:45 - 09/01/2026". After 2: "07:05 - 03/01/2026 → 23:59 - 09/01/2026".

## TC-DTR-005 — A third pick starts a new range
- **Type:** Functional
- **Priority:** P2
- **Preconditions:** Calendar open on January 2026; range 10–20 picked.

**Acceptance criteria**
- With a complete range, the next pick starts over.

**Steps**
1. Pick 25. 2. Pick 5.

**Expected result**
- After 1: "09:00 - 25/01/2026 → —". After 2: "09:00 - 05/01/2026 → 17:00 - 25/01/2026".

## TC-DTR-006 — Reset clears the days but keeps the times, the open calendar and the viewed month
- **Type:** Functional
- **Priority:** P1
- **Preconditions:** Start time 10:30; calendar open on February 2026; range 2–12 February picked.

**Acceptance criteria**
- Reset affects only the picked days.

**Steps**
1. Press Reset.

**Expected result**
- Chip "— → —"; times 10:30 and 17:00; button "Close"; label "Pick range · 2026-02".

## TC-DTR-007 — Picking the same day twice gives a one-day range
- **Type:** Edge
- **Priority:** P2
- **Preconditions:** Calendar open on January 2026.

**Acceptance criteria**
- Start and end can be the same day.

**Steps**
1. Pick 15 twice.

**Expected result**
- "09:00 - 15/01/2026 → 17:00 - 15/01/2026".

## TC-DTR-008 — Month navigation crosses years and a range can span months in either order
- **Type:** Edge
- **Priority:** P1
- **Preconditions:** Calendar open on January 2026.

**Acceptance criteria**
- Prev/Next move across the year boundary; the range keeps days from different months and orders them.

**Steps**
1. Press "Previous month".
2. Pick 28, press "Next month", pick 4.
3. Press "Next month", pick 5, press "Previous month", pick 25.

**Expected result**
- After 1: "Pick range · 2025-12", 31 cells.
- After 2: "Pick range · 2026-01"; "09:00 - 28/12/2025 → 17:00 - 04/01/2026".
- After 3: "09:00 - 25/01/2026 → 17:00 - 05/02/2026".

## TC-DTR-009 — The calendar has the right number of days per month (data-driven)
- **Type:** Edge
- **Priority:** P1
- **Preconditions:** `/ui-elements/date-range/` opened with today fixed to the 15th of each month below.

**Acceptance criteria**
- The grid has one cell per day of the viewed month, including February in a leap year.

**Steps**
1. Open the page with today = 2026-01, 2026-02, 2028-02 and 2026-04 (one test each), then open the calendar.

**Expected result**
- 31, 28, 29 and 30 cells; the last cell is that number; label "Pick range · YYYY-MM".

## TC-DTR-010 — Closing and reopening the calendar keeps the range and the viewed month
- **Type:** Edge
- **Priority:** P2
- **Preconditions:** Calendar open; range 6 January – 3 February picked; February viewed.

**Acceptance criteria**
- Closing the calendar hides it without losing state.

**Steps**
1. Press "Close", then "Open calendar".

**Expected result**
- No cells while closed; after reopening the chip is unchanged and the label is "Pick range · 2026-02".

## TC-DTR-011 — Changing times or pressing Reset without picked days leaves the range empty
- **Type:** Negative
- **Priority:** P2
- **Preconditions:** `/ui-elements/date-range/` is open; today = 15 January 2026; no days picked.

**Acceptance criteria**
- Times alone never create a range; Reset without a range is harmless.

**Steps**
1. Set 06:00 and 22:00, press Reset with the calendar closed.
2. Open the calendar and press Reset.

**Expected result**
- Chip "— → —" throughout; times stay 06:00 and 22:00; after 1 the calendar is still closed; after 2 the label is "Pick range · 2026-01".
