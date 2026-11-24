# Date Picker — test cases

Module: `/ui-elements/date-picker/` · Automated in `apps/qa-practice/tests/date-picker/date-picker.spec.ts`
Source of expected values: QA Practice `DatePickerWidget` (`forms.tsx`) at revision 3d14d23, the production build per `/release-info.json`; identical in the local build d856264. Data: `apps/qa-practice/data/embed-dates.data.ts`. Time formatting: `lib/datetime-display.ts`.

> **Today.** Fixed with `page.clock.setFixedTime('2026-01-15T12:00:00Z')` (TC-DTP-006: 2028-02-15), as for the Date Range Picker. `Date` only; timers and animation frames stay real.

> **Not asserted here (see `docs/observations/OBS-06-date-range-time-handling.md`).** The shared time parsing shows hour 00 as 09 (00:30 → "09:30") and an empty time as 09:00 in this module too (measured in all three engines).

## TC-DTP-001 — Starts empty and the calendar shows the current month
- **Type:** Smoke
- **Priority:** P1
- **Preconditions:** `/ui-elements/date-picker/` is open; today = 15 January 2026; fresh browser context.

**Acceptance criteria**
- Initial state and calendar of the current month.

**Steps**
1. Check the initial state.
2. Open the calendar.

**Expected result**
- Combined field empty, read-only, placeholder "HH:mm - DD/MM/YYYY (pick a calendar day)"; time 09:00; "Open calendar"; no cells.
- Open: "Close", "Pick day · 2026-01", 31 cells.

## TC-DTP-002 — Picking a day fills the combined field and closes the calendar
- **Type:** Smoke
- **Priority:** P1
- **Preconditions:** `/ui-elements/date-picker/` is open; today = 15 January 2026; fresh browser context.

**Acceptance criteria**
- A pick sets the date and closes the calendar.

**Steps**
1. Open the calendar, pick 10.

**Expected result**
- "09:00 - 10/01/2026"; no cells; "Open calendar".

## TC-DTP-003 — The time is applied before and after the day is picked
- **Type:** Functional
- **Priority:** P1
- **Preconditions:** `/ui-elements/date-picker/` is open; today = 15 January 2026; fresh browser context.

**Acceptance criteria**
- The field always uses the current time input.

**Steps**
1. Set 08:15, pick 3.
2. Change the time to 23:59.

**Expected result**
- "08:15 - 03/01/2026", then "23:59 - 03/01/2026".

## TC-DTP-004 — Picking another day replaces the date
- **Type:** Functional
- **Priority:** P2
- **Preconditions:** `/ui-elements/date-picker/` is open; today = 15 January 2026; fresh browser context.

**Acceptance criteria**
- Only one date is kept.

**Steps**
1. Pick 10, reopen, pick 20.

**Expected result**
- "09:00 - 20/01/2026".

## TC-DTP-005 — A day in another month and year can be picked, and the calendar reopens there
- **Type:** Edge
- **Priority:** P1
- **Preconditions:** `/ui-elements/date-picker/` is open; today = 15 January 2026; fresh browser context.

**Acceptance criteria**
- Navigation crosses the year; the viewed month is kept.

**Steps**
1. Open, go to the previous month, pick 31.
2. Reopen the calendar.

**Expected result**
- "Pick day · 2025-12"; "09:00 - 31/12/2025"; reopened on "Pick day · 2025-12".

## TC-DTP-006 — 29 February exists in a leap year
- **Type:** Edge
- **Priority:** P2
- **Preconditions:** `/ui-elements/date-picker/` opened with today = 15 February 2028.

**Acceptance criteria**
- February 2028 has 29 days.

**Steps**
1. Open the calendar, pick 29.

**Expected result**
- 29 cells; "09:00 - 29/02/2028".

## TC-DTP-007 — Changing the time or closing the calendar without a day leaves the field empty
- **Type:** Negative
- **Priority:** P2
- **Preconditions:** `/ui-elements/date-picker/` is open; today = 15 January 2026; fresh browser context.

**Acceptance criteria**
- A time alone never creates a value.

**Steps**
1. Set 14:30.
2. Open and close the calendar without picking.

**Expected result**
- The combined field stays empty; no cells.
