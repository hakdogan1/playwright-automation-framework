import type { Locator, Page } from '@playwright/test';
import { moduleHeading, openModule } from '../support/module';

/** /ui-elements/checkbox/ — parent "select all" checkbox with three children. */
export class CheckboxPage {
  static readonly path = '/ui-elements/checkbox/';
  readonly heading: Locator;
  readonly selectAll: Locator;
  readonly state: Locator;

  constructor(private readonly page: Page) {
    this.heading = moduleHeading(page, 'Checkboxes');
    const demo = page.getByTestId('checkbox-demo');
    this.selectAll = demo.getByLabel('Select all squads');
    this.state = demo.getByTestId('chk-state');
  }

  child(label: 'Identity' | 'Wallet' | 'Admin'): Locator {
    return this.page.getByTestId('checkbox-demo').getByLabel(label, { exact: true });
  }

  async goto(): Promise<void> {
    await openModule(this.page, { path: CheckboxPage.path, heading: this.heading, ready: this.selectAll });
  }
}

/** /ui-elements/radio/ — "Plan tier" radio group. */
export class RadioPage {
  static readonly path = '/ui-elements/radio/';
  readonly heading: Locator;
  readonly group: Locator;
  readonly selected: Locator;

  constructor(private readonly page: Page) {
    this.heading = moduleHeading(page, 'Radio Buttons');
    this.group = page.getByRole('group', { name: 'Plan tier' });
    this.selected = page.getByTestId('radio-selected');
  }

  option(label: 'Starter' | 'Pro' | 'Enterprise'): Locator {
    return this.group.getByRole('radio', { name: label, exact: true });
  }

  async goto(): Promise<void> {
    await openModule(this.page, { path: RadioPage.path, heading: this.heading, ready: this.option('Starter') });
  }
}

/** /ui-elements/multi-select/ — toggle buttons that add removable chips. */
export class MultiSelectPage {
  static readonly path = '/ui-elements/multi-select/';
  readonly heading: Locator;
  readonly picker: Locator;
  readonly options: Locator;
  /** Selected chips in display order. */
  readonly chips: Locator;
  readonly emptyState: Locator;

  constructor(private readonly page: Page) {
    this.heading = moduleHeading(page, 'Multi Select');
    this.picker = page.getByTestId('skills-picker');
    this.options = this.picker.getByRole('button').filter({ hasNotText: '×' });
    this.chips = this.picker.getByTestId(/^ms-chip-/);
    this.emptyState = this.picker.getByText('No skills picked yet.');
  }

  option(label: string): Locator {
    return this.picker.getByRole('button', { name: label, exact: true });
  }

  /** The × button inside a chip; its accessible name uses the skill id. */
  removeButton(skillId: string): Locator {
    return this.picker.getByRole('button', { name: `Remove ${skillId}`, exact: true });
  }

  async goto(): Promise<void> {
    await openModule(this.page, { path: MultiSelectPage.path, heading: this.heading, ready: this.option('Playwright') });
  }
}
