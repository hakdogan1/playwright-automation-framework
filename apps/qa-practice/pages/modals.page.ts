import { expect, type Locator, type Page } from '@playwright/test';
import { EntryDialog } from '../components/entry-dialog.component';
import { waitForHydration } from '../support/ready';

/** /ui-elements/modals/ — opens a dialog that adds rows to a list. */
export class ModalsPage {
  static readonly path = '/ui-elements/modals/';

  readonly heading: Locator;
  readonly openButton: Locator;
  readonly dialog: EntryDialog;
  readonly emptyRows: Locator;
  readonly latestRow: Locator;

  constructor(private readonly page: Page) {
    this.heading = page.getByRole('heading', { level: 1, name: 'Modals' });
    this.openButton = page.getByRole('button', { name: 'Open modal', exact: true });
    this.dialog = new EntryDialog(page);
    this.emptyRows = page.getByText('No rows yet — add via the modal.');
    this.latestRow = page.getByTestId('modal-row');
  }

  /** Rows added through the dialog, in insertion order. */
  rows(): Locator {
    return this.openButton.locator('xpath=following-sibling::ul[1]').getByRole('listitem');
  }

  async goto(): Promise<void> {
    await this.page.goto(ModalsPage.path);
    await expect(this.heading).toBeVisible();
    await waitForHydration(this.openButton);
  }

  async open(): Promise<void> {
    await this.openButton.click();
    await expect(this.dialog.dialog).toBeVisible();
  }
}
