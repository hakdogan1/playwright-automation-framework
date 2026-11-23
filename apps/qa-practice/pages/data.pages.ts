import type { Locator, Page } from '@playwright/test';
import { DataTable } from '../components/data-table.component';
import { Paginator } from '../components/paginator.component';
import { moduleHeading, openModule } from '../support/module';

/** /ui-elements/static-table/ — fixed users table with a View action per row. */
export class StaticTablePage {
  static readonly path = '/ui-elements/static-table/';
  readonly heading: Locator;
  readonly table: DataTable;
  readonly lastAction: Locator;

  constructor(private readonly page: Page) {
    this.heading = moduleHeading(page, 'Static Table');
    const demo = page.getByTestId('static-table-demo');
    this.table = new DataTable(demo.getByRole('table'));
    this.lastAction = demo.getByTestId('static-table-action-result');
  }

  viewButton(row: Locator): Locator {
    return row.getByRole('button', { name: 'View', exact: true });
  }

  async goto(): Promise<void> {
    await openModule(this.page, { path: StaticTablePage.path, heading: this.heading, ready: this.table.rows.first().getByRole('button') });
  }
}

/** /ui-elements/pagination/ — 15 records, 5 per page. */
export class PaginationPage {
  static readonly path = '/ui-elements/pagination/';
  readonly heading: Locator;
  readonly records: Locator;
  readonly currentPage: Locator;
  readonly visibleRange: Locator;
  readonly paginator: Paginator;

  constructor(private readonly page: Page) {
    this.heading = moduleHeading(page, 'Pagination');
    const widget = page.getByTestId('pagination-widget');
    this.records = widget.getByRole('list', { name: 'Paginated test records' }).getByRole('listitem');
    this.currentPage = widget.getByTestId('pagination-current-page');
    this.visibleRange = widget.getByTestId('pagination-visible-range');
    this.paginator = new Paginator(widget);
  }

  async goto(): Promise<void> {
    await openModule(this.page, { path: PaginationPage.path, heading: this.heading, ready: this.paginator.next });
  }
}
