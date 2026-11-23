import type { Locator } from '@playwright/test';

/** Catalog area of the Bug Playground mini storefront. */
export class StorefrontCatalog {
  readonly search: Locator;
  readonly category: Locator;
  readonly sort: Locator;
  readonly count: Locator;
  readonly rows: Locator;
  /** Product names in display order. */
  readonly names: Locator;
  readonly emptyState: Locator;
  readonly refresh: Locator;
  readonly syncLabel: Locator;

  constructor(root: Locator) {
    this.search = root.getByLabel('Search catalog');
    this.category = root.getByLabel('Category', { exact: true });
    this.sort = root.getByLabel('Sort catalog');
    this.count = root.getByTestId('bug-play-product-count');
    // `has` is evaluated relative to each row, so the inner locator starts from the page.
    this.rows = root.getByTestId('bug-play-product-list').getByRole('listitem').filter({ has: root.page().getByRole('button', { name: 'Add to cart' }) });
    // Each row is <li><div><p>name</p><p>category · price</p></div>…buttons</li>; the name has no role or test id.
    this.names = this.rows.locator('div > p:first-child');
    this.emptyState = root.getByText('No rows match — try changing search case or filters.');
    this.refresh = root.getByRole('button', { name: 'Refresh prices', exact: true });
    this.syncLabel = root.getByText(/^(Inventory snapshot|Prices refreshed) ·/);
  }

  row(name: string): Locator {
    return this.rows.filter({ hasText: name });
  }

  addButton(name: string): Locator {
    return this.row(name).getByRole('button', { name: 'Add to cart', exact: true });
  }

  compareButton(name: string): Locator {
    return this.row(name).getByRole('button', { name: 'Compare', exact: true });
  }

  wishlistButton(name: string): Locator {
    return this.row(name).getByRole('button', { name: `Wishlist ${name}`, exact: true });
  }

  /** "Kits · USD 12.34" style price lines, in display order. */
  priceLines(): Locator {
    return this.rows.getByText(/· USD \d+\.\d{2}$/);
  }
}

/** Cart panel: lines with quantity steppers, total and checkout. */
export class StorefrontCart {
  readonly lines: Locator;
  readonly total: Locator;
  readonly checkout: Locator;

  constructor(root: Locator) {
    this.lines = root.getByTestId('bug-play-cart-lines').getByRole('listitem');
    this.total = root.getByTestId('bug-play-cart-total');
    this.checkout = root.getByRole('button', { name: 'Checkout', exact: true });
  }

  line(name: string): Locator {
    return this.lines.filter({ hasText: name });
  }

  quantity(name: string): Locator {
    return this.line(name).getByText(/^-?\d+$/);
  }

  decrease(name: string): Locator {
    return this.line(name).getByRole('button', { name: `Decrease quantity of ${name}`, exact: true });
  }
}

/** Profile dialog opened from the account menu. */
export class ProfileDialog {
  readonly dialog: Locator;
  readonly name: Locator;
  readonly email: Locator;
  readonly newsletter: Locator;
  readonly save: Locator;

  constructor(page: Locator) {
    this.dialog = page.getByRole('dialog', { name: 'Profile' });
    this.name = this.dialog.getByLabel('Display name (required)');
    this.email = this.dialog.getByLabel('Email (optional)');
    this.newsletter = this.dialog.getByLabel(/Send me QA tips/);
    this.save = this.dialog.getByRole('button', { name: 'Save', exact: true });
  }
}
