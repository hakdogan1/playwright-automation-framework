/**
 * Alerts, Toast Messages, Loader / Spinner, Lazy Loaded Elements and Infinite Scroll — expected
 * values read from the app source at revision 3d14d23 (`AlertsWidget`, `ToastsWidget` in
 * `overlays.tsx`; `LoaderWidget` in `extras.tsx`; `LazyLoadWidget`, `InfiniteScrollWidget` in
 * `async.tsx`; identical in the local build d856264). All five are client-only.
 */

export const ALERTS = {
  message: 'Approve the deployment?',
  result: { initial: 'none', accepted: 'accepted', dismissed: 'dismissed' },
} as const;

export const TOASTS = {
  empty: 'No active toast messages.',
  success: { title: 'Profile update succeeded', text: 'Your profile settings were saved successfully.', role: 'status' },
  error: { title: 'Profile update failed', text: "We couldn't save your profile settings. Try again.", role: 'alert' },
  /** Only success toasts auto-dismiss. */
  successDismissMs: 5_000,
} as const;

export const LOADER = {
  idle: 'Load metrics',
  busy: 'Loading…',
  spinner: 'Fetching live ledger metrics…',
  delayMs: 1_600,
  metrics: [
    { label: 'MTTR', value: '11m' },
    { label: 'Pass rate', value: '99.4%' },
    { label: 'Coverage', value: '86%' },
  ],
  error: 'Service unavailable · ledger_timeout',
} as const;

export const LAZY = {
  idle: 'Mount lazy panel',
  busy: 'Loading…',
  delayMs: 1_200,
  title: 'Hydrated panel',
} as const;

export const INFINITE = {
  pageSize: 12,
  total: 60,
  delayMs: 350,
  /** Loads when the remaining scroll distance is at most this many pixels. */
  thresholdPx: 24,
  loader: 'Loading…',
  end: 'End of stream',
  item: (n: number) => `Defect #${String(n).padStart(3, '0')}`,
} as const;
