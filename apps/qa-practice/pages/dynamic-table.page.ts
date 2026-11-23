import type { Locator, Page } from '@playwright/test';
import { DataTable } from '../components/data-table.component';
import { moduleHeading, openModule } from '../support/module';

/** /ui-elements/dynamic-table/ — searchable, filterable, sortable, editable users table (4 rows per page). */
export class DynamicTablePage {
  static readonly path = '/ui-elements/dynamic-table/';
  readonly heading: Locator;
  readonly search: Locator;
  readonly statusFilter: Locator;
  readonly matchCount: Locator;
  readonly table: DataTable;
  readonly sortByName: Locator;
  readonly emptyState: Locator;
  readonly pageIndicator: Locator;
  readonly previous: Locator;
  readonly next: Locator;
  readonly lastAction: Locator;

  constructor(private readonly page: Page) {
    this.heading = moduleHeading(page, 'Dynamic Table');
    const demo = page.getByTestId('dynamic-table-demo');
    // The search box has no label in the app; its placeholder is the visible hint.
    this.search = demo.getByPlaceholder('Search users…');
    this.statusFilter = demo.getByLabel('Status filter');
    this.matchCount = demo.getByTestId('dynamic-row-count');
    this.table = new DataTable(demo.getByRole('table'));
    this.sortByName = demo.getByRole('button', { name: /^Name/ });
    this.emptyState = demo.getByText('No rows match this filter.');
    this.pageIndicator = demo.getByTestId('dynamic-page');
    this.previous = demo.getByRole('button', { name: 'Prev', exact: true });
    this.next = demo.getByRole('button', { name: 'Next', exact: true });
    this.lastAction = demo.getByTestId('dynamic-action-result');
  }

  /** Names of the visible rows, in display order (first cell of each row). */
  names(): Locator {
    return this.table.rows.locator('td:first-child');
  }

  row(name: string): Locator {
    return this.table.row(name);
  }

  button(row: Locator, name: 'Edit' | 'Save' | 'Cancel' | 'Delete'): Locator {
    return row.getByRole('button', { name, exact: true });
  }

  /** Inline editor field for a user id (aria-label "Role for usr-211"). */
  editor(field: 'Name' | 'Email' | 'Role' | 'Status', userId: string): Locator {
    return this.page.getByLabel(`${field} for ${userId}`, { exact: true });
  }

  async goto(): Promise<void> {
    await openModule(this.page, { path: DynamicTablePage.path, heading: this.heading, ready: this.sortByName });
  }
}
