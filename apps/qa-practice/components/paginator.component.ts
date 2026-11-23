import type { Locator } from '@playwright/test';

/** Previous / numbered / Next controls inside a nav landmark. */
export class Paginator {
  readonly nav: Locator;
  readonly previous: Locator;
  readonly next: Locator;
  /** The page button marked aria-current="page". */
  readonly current: Locator;

  constructor(root: Locator) {
    this.nav = root.getByRole('navigation', { name: 'Pagination' });
    this.previous = this.nav.getByRole('button', { name: 'Previous', exact: true });
    this.next = this.nav.getByRole('button', { name: 'Next', exact: true });
    this.current = this.nav.locator('[aria-current="page"]');
  }

  buttonFor(pageNumber: number): Locator {
    return this.nav.getByRole('button', { name: String(pageNumber), exact: true });
  }
}
