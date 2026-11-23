/**
 * Bug Playground ("Northwind QA Supplies") — facts taken from the QA Practice
 * source at the deployed revision 3d14d23:
 *   src/components/bug-playground/buggy-demo-app.tsx (behaviour)
 *   src/data/bug-playground-discovery-registry.ts (15 seeded defects, severities)
 */
export const BUG_PLAYGROUND_PATH = '/bug-playground/';
export const APP_REVISION = '3d14d23';

export const PRODUCTS = [
  { id: 'p-latency', name: 'Latency Meter Mk II', price: 12.34, category: 'Kits' },
  { id: 'p-split', name: 'Signal Splitter', price: 7.65, category: 'Accessories' },
  { id: 'p-sniffer', name: 'Traffic Sniffer Probe', price: 42.5, category: 'Accessories' },
] as const;
export type ProductName = (typeof PRODUCTS)[number]['name'];

/** localStorage flag the app uses for its offline demo session (src/lib/auth-context.tsx). */
export const DEMO_SESSION_STORAGE = { key: 'vl-lab-demo-session', value: '1' } as const;

export interface SeededBug {
  bugId: string;
  tcId: string;
  number: number;
  key: string;
  title: string;
  /** Severity from the app's own registry; see docs/bug-reports for the rationale. */
  severity: 'Critical' | 'Major' | 'Minor';
}

export const SEEDED_BUGS: readonly SeededBug[] = [
  { bugId: 'BUG-BP-01', tcId: 'TC-BUG-001', number: 1, key: 'dup-add-cart', title: 'Add to cart duplicates on rapid double activation', severity: 'Major' },
  { bugId: 'BUG-BP-02', tcId: 'TC-BUG-002', number: 2, key: 'search-case-sensitive', title: 'Search is case-sensitive', severity: 'Minor' },
  { bugId: 'BUG-BP-03', tcId: 'TC-BUG-003', number: 3, key: 'cart-total-float-precision', title: 'Cart total shows floating-point noise', severity: 'Major' },
  { bugId: 'BUG-BP-04', tcId: 'TC-BUG-004', number: 4, key: 'fake-logout-session', title: 'Logout does not clear the session', severity: 'Critical' },
  { bugId: 'BUG-BP-05', tcId: 'TC-BUG-005', number: 5, key: 'category-count-stale', title: 'Product count is stale after a category change', severity: 'Minor' },
  { bugId: 'BUG-BP-06', tcId: 'TC-BUG-006', number: 6, key: 'cart-negative-quantity', title: 'Cart accepts zero and negative quantities', severity: 'Critical' },
  { bugId: 'BUG-BP-07', tcId: 'TC-BUG-007', number: 7, key: 'profile-name-whitespace-only', title: 'Required display name accepts whitespace only', severity: 'Major' },
  { bugId: 'BUG-BP-08', tcId: 'TC-BUG-008', number: 8, key: 'shipping-policy-dead-link', title: 'Shipping policy link does nothing', severity: 'Minor' },
  { bugId: 'BUG-BP-09', tcId: 'TC-BUG-009', number: 9, key: 'promo-empty-still-applies', title: 'Empty promo code reports success', severity: 'Major' },
  { bugId: 'BUG-BP-10', tcId: 'TC-BUG-010', number: 10, key: 'newsletter-prechecked-dark-pattern', title: 'Newsletter consent is pre-checked', severity: 'Major' },
  { bugId: 'BUG-BP-11', tcId: 'TC-BUG-011', number: 11, key: 'compare-button-noop', title: 'Compare does nothing useful', severity: 'Minor' },
  { bugId: 'BUG-BP-12', tcId: 'TC-BUG-012', number: 12, key: 'wishlist-button-noop', title: 'Wishlist reports a save that does not happen', severity: 'Minor' },
  { bugId: 'BUG-BP-13', tcId: 'TC-BUG-013', number: 13, key: 'sort-dropdown-ignored', title: 'Sort control does not reorder products', severity: 'Major' },
  { bugId: 'BUG-BP-14', tcId: 'TC-BUG-014', number: 14, key: 'refresh-catalog-fake-success', title: 'Refresh claims new prices without changing data', severity: 'Major' },
  { bugId: 'BUG-BP-15', tcId: 'TC-BUG-015', number: 15, key: 'chat-widget-shows-online-offline', title: 'Chat shows online while agents are offline', severity: 'Minor' },
];

export function seededBug(number: number): SeededBug {
  const bug = SEEDED_BUGS.find((b) => b.number === number);
  if (!bug) throw new Error(`No seeded bug #${number}`);
  return bug;
}

/**
 * Expected-behaviour tests assert a settled UI state right after an action,
 * so a short timeout keeps the 15 known failures fast without weakening the oracle.
 */
export const SETTLED_MS = 2_000;
