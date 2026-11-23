import type { Locator, Page } from '@playwright/test';

/** The "New entry" modal dialog with a single title field. */
export class EntryDialog {
  readonly dialog: Locator;
  readonly titleInput: Locator;
  readonly saveButton: Locator;
  readonly cancelButton: Locator;
  /** The dimmed backdrop; clicking it closes the dialog. */
  readonly overlay: Locator;

  constructor(page: Page) {
    this.dialog = page.getByRole('dialog', { name: 'New entry' });
    this.titleInput = this.dialog.getByLabel('Defect title');
    this.saveButton = this.dialog.getByRole('button', { name: 'Save', exact: true });
    this.cancelButton = this.dialog.getByRole('button', { name: 'Cancel', exact: true });
    this.overlay = page.getByTestId('modal-overlay');
  }

  async save(title: string): Promise<void> {
    await this.titleInput.fill(title);
    await this.saveButton.click();
  }

  /** Clicks the backdrop outside the dialog box (top-left corner of the overlay). */
  async clickBackdrop(): Promise<void> {
    await this.overlay.click({ position: { x: 5, y: 5 } });
  }
}
