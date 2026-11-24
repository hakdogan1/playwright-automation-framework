import { test, expect, tc } from '../../fixtures';
import { DYNAMIC_PAGE_SIZE, DYNAMIC_USERS } from '../../data/phase2c.data';

// /ui-elements/tables/ renders the same component as /ui-elements/dynamic-table/
// (TablesWidget returns <DynamicTableWidget />, 3d14d23). Its behaviour is covered in depth by
// TC-DTB-001…009; these tests only prove that this route renders and wires that widget.

const names = (list: readonly { name: string }[]) => list.map((u) => u.name);

test.describe('Tables', () => {
  test.beforeEach(async ({ tablesPage }) => {
    await tablesPage.goto();
  });

  test('the Tables route renders the dynamic users table', { tag: ['@smoke'], annotation: [tc('TC-TBS-001')] }, async ({ tablesPage: t, page }) => {
    await expect(page).toHaveURL(/\/ui-elements\/tables\/$/);
    await expect(t.matchCount).toHaveText(`${DYNAMIC_USERS.length} matches`);
    await expect(t.names()).toHaveText(names(DYNAMIC_USERS.slice(0, DYNAMIC_PAGE_SIZE)));
    await expect(t.pageIndicator).toContainText('Page 1 / 2');
  });

  test('search and status filter work on this route', { tag: ['@functional'], annotation: [tc('TC-TBS-002')] }, async ({ tablesPage: t }) => {
    await test.step('Filter by "Suspended" and search "engineer"', async () => {
      await t.statusFilter.selectOption('Suspended');
      await t.search.fill('engineer');
    });

    await expect(t.names()).toHaveText(['Ivy Chen']);
    await expect(t.matchCount).toHaveText('1 match');
  });

  test('a search without matches shows the empty state on this route', { tag: ['@negative'], annotation: [tc('TC-TBS-003')] }, async ({ tablesPage: t }) => {
    await test.step('Search "zzz"', () => t.search.fill('zzz'));

    await expect(t.matchCount).toHaveText('0 matches');
    await expect(t.emptyState).toBeVisible();
    await expect(t.next).toBeDisabled();
  });
});
