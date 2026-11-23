import type { Locator } from '@playwright/test';

/** An HTML table addressed by header names and row content, not by index or CSS. */
export class DataTable {
  readonly headers: Locator;
  /** Body rows (rows that contain cells, not header cells). */
  readonly rows: Locator;

  constructor(readonly table: Locator) {
    this.headers = table.getByRole('columnheader');
    this.rows = table.getByRole('row').filter({ has: table.page().getByRole('cell') });
  }

  row(containing: string | RegExp): Locator {
    return this.rows.filter({ hasText: containing });
  }

  /** Cell of a row by column header name. */
  async cell(row: Locator, column: string): Promise<Locator> {
    const names = await this.headers.allTextContents();
    // Sortable headers may append an indicator ("Name ↑"), so match the label as a prefix word.
    const index = names.findIndex((n) => n.trim() === column || n.trim().startsWith(`${column} `));
    if (index < 0) throw new Error(`Column "${column}" not found. Columns: ${names.join(', ')}`);
    return row.getByRole('cell').nth(index);
  }
}
