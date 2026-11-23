/**
 * Expected values for the Phase 2C.1 modules, from the QA Practice source at
 * the deployed revision 3d14d23 (src/components/practice/widgets/*.tsx).
 */

/** keyboard-keys.tsx — debounce/search timings and copy. */
export const KEYBOARD = {
  searchDebounceMs: 550,
  validationDebounceMs: 400,
  searchResults: ['Playwright · end-to-end testing', 'Playwright vs Cypress — benchmarks', 'CI recipes for Playwright sharding'],
  disabledValue: 'Read-only release 2026-Q2',
} as const;

/** passwordStrength(): one point each for length ≥ 8, lower, upper, digit, symbol; capped at 4. */
export const PASSWORD_STRENGTH = [
  { value: '', label: 'Too weak', score: 0 },
  { value: 'abc', label: 'Weak', score: 1 },
  { value: 'abcdefgh', label: 'Fair', score: 2 },
  { value: 'Abc1', label: 'Strong', score: 3 },
  { value: 'Abcdefg1!', label: 'Excellent', score: 4 },
] as const;

/** clicks.tsx — DragDropWidget initial board. */
export const BOARD = {
  todo: ['Design test pyramid'],
  doing: ['QA review', 'Perf budget'],
  done: ['Lint config'],
} as const;

/** data.tsx — DynamicTableWidget rows (names, roles, statuses; e-mails are not asserted). */
export const DYNAMIC_USERS = [
  { id: 'usr-104', name: 'Hasan Akdoğan', role: 'QA Lead', status: 'Active' },
  { id: 'usr-211', name: 'Mira Stone', role: 'Admin', status: 'Active' },
  { id: 'usr-318', name: 'Alex Reed', role: 'Engineer', status: 'Invited' },
  { id: 'usr-427', name: 'Noor Khan', role: 'QA', status: 'Active' },
  { id: 'usr-532', name: 'Yuki Tan', role: 'Manager', status: 'Suspended' },
  { id: 'usr-633', name: 'Hugo Silva', role: 'QA', status: 'Active' },
  { id: 'usr-744', name: 'Ivy Chen', role: 'Engineer', status: 'Suspended' },
  { id: 'usr-855', name: 'Zara Koc', role: 'Ops', status: 'Active' },
] as const;
export const DYNAMIC_PAGE_SIZE = 4;

/** overlays.tsx — NotificationsWidget copy and auto-dismiss delays (error never auto-dismisses). */
export const NOTIFICATIONS = {
  success: { text: 'Success: profile saved.', dismissMs: 3200, role: 'status' },
  info: { text: 'Info: sync started.', dismissMs: 3200, role: 'status' },
  warning: { text: 'Warning: quota almost full.', dismissMs: 4500, role: 'status' },
  error: { text: 'Error: payment failed.', dismissMs: null, role: 'alert' },
} as const;

/** Time for framer-motion exit animations once a toast is removed (controlled clock). */
export const EXIT_ANIMATION_MS = 1_000;
