import type { Locator } from '@playwright/test';

/** A text input with a filtered listbox (WAI-ARIA combobox pattern, loosely). */
export class Combobox {
  readonly input: Locator;
  readonly listbox: Locator;
  readonly options: Locator;
  readonly emptyState: Locator;
  readonly clearButton: Locator;

  constructor(
    root: Locator,
    labels: { input: string; clear: string },
  ) {
    this.input = root.getByLabel(labels.input, { exact: true });
    this.listbox = root.getByRole('listbox');
    this.options = this.listbox.getByRole('option');
    this.emptyState = this.listbox.getByText('No matches.');
    this.clearButton = root.getByRole('button', { name: labels.clear });
  }

  /** Options may carry a decorative prefix (e.g. a flag emoji), so match the label at the end of the name. */
  option(label: string): Locator {
    const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return this.listbox.getByRole('option', { name: new RegExp(`(^|\\s)${escaped}$`) });
  }

  async search(text: string): Promise<void> {
    await this.input.fill(text);
  }

  async choose(name: string): Promise<void> {
    await this.option(name).click();
  }
}
