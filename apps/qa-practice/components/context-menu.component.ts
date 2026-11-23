import type { Locator, Page } from '@playwright/test';

/** A custom role="menu" opened by right-click. */
export class ContextMenu {
  readonly menu: Locator;
  readonly items: Locator;

  constructor(page: Page) {
    this.menu = page.getByRole('menu');
    this.items = this.menu.getByRole('menuitem');
  }

  item(name: string): Locator {
    return this.menu.getByRole('menuitem', { name, exact: true });
  }
}
