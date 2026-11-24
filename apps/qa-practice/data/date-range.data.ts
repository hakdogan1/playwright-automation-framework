/**
 * Date Range Picker (/ui-elements/date-range/) — expectations read from the app source
 * (`DateRangeWidget`, `extras.tsx`, and `lib/datetime-display.ts`, QA Practice revision 3d14d23;
 * identical in the local build d856264).
 *
 * The calendar opens on the current month, so tests fix "today" with page.clock.setFixedTime().
 * Noon UTC keeps the calendar day the same in every time zone from UTC-11 to UTC+11.
 */

export const DEFAULT_TIMES = { start: '09:00', end: '17:00' } as const;

export const EMPTY_CHIP = '— → —';

export const OPEN_LABEL = { closed: 'Open calendar', open: 'Close' } as const;

/** Fixed "today" for the tests: 15 January 2026. */
export const TODAY = { iso: '2026-01-15T12:00:00Z', year: 2026, month: 1 } as const;

/** One side of the chip: "HH:MM - DD/MM/YYYY". */
export function chipPart(time: string, day: number, month: number, year: number): string {
  return `${time} - ${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}/${year}`;
}

export const chip = (start: string, end: string) => `${start} → ${end}`;

/** "Pick range · YYYY-MM". */
export const monthLabel = (year: number, month: number) => `Pick range · ${year}-${String(month).padStart(2, '0')}`;

/** Month lengths the calendar must render (data-driven, includes a leap year). */
export const MONTH_LENGTHS = [
  { iso: '2026-01-15T12:00:00Z', year: 2026, month: 1, days: 31 },
  { iso: '2026-02-15T12:00:00Z', year: 2026, month: 2, days: 28 },
  { iso: '2028-02-15T12:00:00Z', year: 2028, month: 2, days: 29 },
  { iso: '2026-04-15T12:00:00Z', year: 2026, month: 4, days: 30 },
] as const;
