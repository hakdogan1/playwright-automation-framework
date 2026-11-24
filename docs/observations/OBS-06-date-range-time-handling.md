# [OBS-06] Date Range Picker: midnight hours are shown as 09, empty times as 09:00, and end-before-start is accepted

> **Status: DRAFT bug report — not filed.** Found while automating TC-DTR (Faz 2C.2E). No Bug-ID and no automated test; kept outside `docs/bug-reports/`. It is filed only on the owner's decision. QA Practice source was not modified.

- **Type:** Functional / data display, validation
- **Severity (proposed):** Medium for finding 1 (the chip shows a different time than the one entered). Low for 2–4.
- **Module:** `/ui-elements/date-range/` (`DateRangeWidget`, `extras.tsx`; `parseHtmlTime`, `lib/datetime-display.ts`, revision 3d14d23)

## Findings
Measured identically in Chromium, Firefox and WebKit on production (build 3d14d23), with today fixed to 15 January 2026, run `20261123T215419Z-feb2d8`. It was a temporary observation spec, deleted afterwards; it recorded state and asserted nothing. Finding 1 was first seen in a manual read-only check of the live page.

| # | Steps | Expected | Actual | Cause in the source |
|---|---|---|---|---|
| 1 | Pick 10 and 20, set the start time to **00:30** (also 00:00) | "00:30 - 10/01/2026 → …" | **"09:30 - 10/01/2026 → …"** (00:00 → "09:00"). The input itself shows 00:30. Other hours (e.g. 12:05) are correct. | `parseInt(hs, 10) \|\| 9`: hour 0 is falsy, so it falls back to 9 |
| 2 | Clear the end time (empty input) | "—", or a validation message | **"… → 09:00 - 20/01/2026"**: an empty end time is shown as 09:00 (not even the 17:00 default) | `parseHtmlTime("")` returns `{h: 9, m: 0}` |
| 3 | Set 18:00 and 08:00, pick the same day twice | Rejected, or the times swapped like the days are | **Accepted**: "18:00 - 07/01/2026 → 08:00 - 07/01/2026" (the range ends before it starts) | Only the days are ordered (`calTs` compares dates without times) |
| 4 | Open the calendar | Weekday headers, and the 1st placed under its weekday | Cells 1…N in a 7-column grid **always start in the first column**, with no weekday headers (1 January 2026 is a Thursday) | The grid renders only the day numbers |

**Also in the Date Picker** (`/ui-elements/date-picker/`, `DatePickerWidget` in `forms.tsx`, same `parseHtmlTime`): 00:30 is shown as "09:30 - 10/01/2026" and an empty time as "09:00 - …". Measured identically in Chromium, Firefox and WebKit, run `20261123T221917Z-ac5672` (Faz 2C.4). Not asserted by TC-DTP.

**Possible fast-click race (low).** In the final v1.0 regression (run `20261123T230900Z-155c28`, WebKit only, 1 of 4 projects) three quick picks 10, 20, 25 gave "10 → 25" instead of starting a new range: the third click reached `pick()` before React had re-rendered the second, and `pick()` reads `start`/`end` from the render closure instead of a functional state update. Not reproduced in 132 later runs once the page object waited for each pick to render (`20261124T070041Z-768718`). Users clicking that fast are rare; the cause in the code is certain, the user impact is not measured.

Also: day cells expose no selection state to assistive technology (`aria-pressed`, `aria-selected` and `aria-label` are all absent); the selection is visible only through styling.

## Why it matters
Finding 1 silently changes user input: a booking from 00:30 is displayed as 09:30, which nobody notices until it is wrong downstream. Findings 2 and 3 are the classic boundary gaps of date-time ranges (empty value, end before start on the same day). Finding 4 makes the calendar misleading as a calendar.

## Automation
Not automated. TC-DTR-001…011 assert only the intended, source-verified behaviour and avoid these inputs. If the owner confirms these as defects, they can follow the Bug Playground pattern (reproduce + `test.fail` expected test with a Bug-ID). That needs approval and is outside Faz 2C.2E.
