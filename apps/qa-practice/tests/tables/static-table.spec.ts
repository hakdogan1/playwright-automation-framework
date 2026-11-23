import { test, expect, tc } from '../../fixtures';
import { TABLE_COLUMNS, TABLE_ROWS } from '../../data/ui-modules.data';

test.describe('Static Table', () => {
  test.beforeEach(async ({ staticTablePage }) => {
    await staticTablePage.goto();
  });

  test('the table shows the expected columns and rows', { tag: ['@smoke'], annotation: [tc('TC-TBL-001')] }, async ({ staticTablePage }) => {
    await expect(staticTablePage.table.headers).toHaveText([...TABLE_COLUMNS]);
    await expect(staticTablePage.table.rows).toHaveCount(TABLE_ROWS.length);
    await expect(staticTablePage.lastAction).toHaveText('No row action yet.');
  });

  for (const expected of TABLE_ROWS) {
    test(`row "${expected.name}" has the right role and status`, { tag: ['@functional'], annotation: [tc('TC-TBL-002')] }, async ({ staticTablePage }) => {
      const { table } = staticTablePage;
      const row = table.row(expected.name);
      await expect(row).toHaveCount(1);
      await expect(await table.cell(row, 'Name')).toHaveText(expected.name);
      await expect(await table.cell(row, 'Role')).toHaveText(expected.role);
      await expect(await table.cell(row, 'Status')).toHaveText(expected.status);
      await expect(await table.cell(row, 'Email')).toHaveText(/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/);
    });
  }

  test('View reports the row it belongs to', { tag: ['@functional'], annotation: [tc('TC-TBL-003')] }, async ({ staticTablePage }) => {
    const row = staticTablePage.table.row('Alex Reed');

    await test.step('Press "View" in the "Alex Reed" row', () => staticTablePage.viewButton(row).click());

    await expect(staticTablePage.lastAction).toHaveText('Opened Alex Reed');
  });

  test('every email in the table is unique', { tag: ['@edge'], annotation: [tc('TC-TBL-004')] }, async ({ staticTablePage }) => {
    const { table } = staticTablePage;
    await expect(table.rows).toHaveCount(TABLE_ROWS.length);
    const emails: string[] = [];
    for (const row of await table.rows.all()) {
      emails.push(((await (await table.cell(row, 'Email')).textContent()) ?? '').trim());
    }
    expect(emails.every((e) => e.includes('@')), `emails: ${emails.join(', ')}`).toBe(true);
    expect(new Set(emails).size, 'distinct emails').toBe(TABLE_ROWS.length);
  });
});
