import { expect, type Locator, type Page } from '@playwright/test';
import { Combobox } from '../components/combobox.component';
import { waitForHydration } from '../support/ready';

/** /ui-elements/select/ — native single select. */
export class NativeSelectPage {
  static readonly path = '/ui-elements/select/';

  readonly heading: Locator;
  readonly select: Locator;
  readonly summary: Locator;

  constructor(private readonly page: Page) {
    this.heading = page.getByRole('heading', { level: 1, name: 'Single Select' });
    this.select = page.getByLabel('Preferred QA tool');
    this.summary = page.getByTestId('select-summary');
  }

  async goto(): Promise<void> {
    await this.page.goto(NativeSelectPage.path);
    await expect(this.heading).toBeVisible();
    await waitForHydration(this.select);
  }
}

/** /ui-elements/searchable-select/ — custom country combobox. */
export class SearchableSelectPage {
  static readonly path = '/ui-elements/searchable-select/';

  readonly heading: Locator;
  readonly country: Combobox;
  readonly selected: Locator;

  constructor(private readonly page: Page) {
    this.heading = page.getByRole('heading', { level: 1, name: 'Searchable Select' });
    const root = page.getByTestId('country-combobox');
    this.country = new Combobox(root, { input: 'Country', clear: 'Clear country selection' });
    this.selected = root.getByTestId('country-selected');
  }

  async goto(): Promise<void> {
    await this.page.goto(SearchableSelectPage.path);
    await expect(this.heading).toBeVisible();
    await waitForHydration(this.country.input);
  }
}
