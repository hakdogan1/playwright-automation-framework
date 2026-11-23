import type { Locator } from '@playwright/test';

/** Disclosure buttons (aria-expanded / aria-controls) with their panels. */
export class Accordion {
  readonly headers: Locator;

  constructor(private readonly root: Locator) {
    this.headers = root.getByRole('button');
  }

  header(name: string): Locator {
    return this.root.getByRole('button', { name, exact: true });
  }

  /** The panel referenced by the header's aria-controls. */
  async panelFor(name: string): Promise<Locator> {
    const id = await this.header(name).getAttribute('aria-controls');
    return this.root.locator(`[id="${id ?? ''}"]`);
  }
}
