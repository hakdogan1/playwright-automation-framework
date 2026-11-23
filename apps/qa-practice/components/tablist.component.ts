import type { Locator } from '@playwright/test';

/** WAI-ARIA tabs: a tablist and the active tabpanel. */
export class TabList {
  readonly list: Locator;
  readonly tabs: Locator;
  readonly panel: Locator;

  constructor(root: Locator, name: string) {
    this.list = root.getByRole('tablist', { name });
    this.tabs = this.list.getByRole('tab');
    this.panel = root.getByRole('tabpanel');
  }

  tab(name: string): Locator {
    return this.list.getByRole('tab', { name, exact: true });
  }
}
