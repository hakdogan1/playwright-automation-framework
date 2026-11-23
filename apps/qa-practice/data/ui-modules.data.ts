/**
 * Expected content of the Phase 2A modules, taken from the QA Practice source
 * at the deployed revision (3d14d23). Tests assert against these values.
 */
export const PLANS = ['Starter', 'Pro', 'Enterprise'] as const;

export const SKILLS = [
  { id: 'cypress', label: 'Cypress' },
  { id: 'playwright', label: 'Playwright' },
  { id: 'k6', label: 'k6' },
  { id: 'postman', label: 'Postman' },
  { id: 'selenium', label: 'Selenium' },
] as const;

export const TABS = [
  { id: 'overview', label: 'Overview', body: 'Headline metrics — pass rate, MTTR, open defects. Updated every minute.' },
  { id: 'logs', label: 'Logs', body: 'Streaming console output from the most recent run. Shard 2/4 · branch main.' },
  { id: 'settings', label: 'Settings', body: 'Test concurrency, retry budget, base URL — change here, persist per project.' },
] as const;

export const ACCORDION_SECTIONS = [
  { label: 'Account', body: 'Display name, email, password reset cadence. Single source for all session-bound personal data.' },
  { label: 'Privacy', body: 'Cookie banner state, telemetry opt-out, data export request flow. GDPR + CCPA compliant.' },
  { label: 'Billing', body: 'Card on file, billing cycle, invoice history. Failed-charge retries surface here as warnings.' },
] as const;

export const DOUBLE_CLICK_DEFAULT = 'Quality engineering @ scale';

export const CONTEXT_MENU_ITEMS = ['Rename', 'Duplicate', 'Archive'] as const;

/** Static table: columns and the rows shown by the app (names, roles, statuses only). */
export const TABLE_COLUMNS = ['Name', 'Email', 'Role', 'Status', 'Action'] as const;
export const TABLE_ROWS = [
  { name: 'Hasan Akdoğan', role: 'QA Lead', status: 'Active' },
  { name: 'Mira Stone', role: 'Admin', status: 'Active' },
  { name: 'Alex Reed', role: 'Engineer', status: 'Invited' },
  { name: 'Yuki Tan', role: 'Manager', status: 'Suspended' },
] as const;

/** Pagination: 15 records, 5 per page; names cycle, every third record is "Ready". */
export const PAGE_SIZE = 5;
export const TOTAL_RECORDS = 15;
const FLOWS = ['Login', 'Checkout', 'Search', 'Reports', 'Profile'];
export function expectedRecord(id: number): { text: RegExp; status: 'Ready' | 'Reviewed' } {
  const index = id - 1;
  return { text: new RegExp(`^Record ${id} · ${FLOWS[index % 5] ?? ''} flow`), status: index % 3 === 0 ? 'Ready' : 'Reviewed' };
}

export const JS_DIALOGS = {
  alert: 'Deployment queued.',
  confirm: 'Approve production deploy?',
  requiredPrompt: 'Enter a release tag (required):',
  requiredValidation: 'A release tag is required.',
  optionalPrompt: 'Enter an optional note:',
} as const;
