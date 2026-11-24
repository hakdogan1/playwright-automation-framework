/**
 * Shadow DOM, New Tab / Window and Date Picker — expectations read from the app source at
 * revision 3d14d23 (`ShadowDomWidget`, `NewTabWidget` in `data.tsx`; the destination page
 * `app/practice/new-tab/destination/page.tsx`; `DatePickerWidget` in `forms.tsx` with
 * `lib/datetime-display.ts`; identical in the local build d856264).
 */

export const SHADOW = { counter: (n: number) => `count: ${n}` } as const;

export const NEW_TAB = {
  destinationTitle: 'New Tab destination',
  destinationHeading: 'Destination',
  eyebrow: 'QA Practice · popup',
  back: '← Back to module',
} as const;

export const DATE_PICKER = {
  defaultTime: '09:00',
  placeholder: 'HH:mm - DD/MM/YYYY (pick a calendar day)',
  open: { closed: 'Open calendar', open: 'Close' },
  /** Fixed "today": 15 January 2026 (noon UTC is the same day from UTC-11 to UTC+11). */
  today: '2026-01-15T12:00:00Z',
} as const;

export const pickDayLabel = (year: number, month: number) => `Pick day · ${year}-${String(month).padStart(2, '0')}`;
