import { test, expect, tc } from '../../fixtures';
import { DYNAMIC_PAGE_SIZE, DYNAMIC_USERS } from '../../data/phase2c.data';

const names = (list: readonly { name: string }[]) => list.map((u) => u.name);
const byName = [...DYNAMIC_USERS].sort((a, b) => a.name.localeCompare(b.name));
const MIRA = DYNAMIC_USERS[1];

test.describe('Dynamic Table', () => {
  test.beforeEach(async ({ dynamicTablePage }) => {
    await dynamicTablePage.goto();
  });

  test('shows 8 users on two pages of 4', { tag: ['@smoke'], annotation: [tc('TC-DTB-001')] }, async ({ dynamicTablePage: t }) => {
    await expect(t.matchCount).toHaveText(`${DYNAMIC_USERS.length} matches`);
    await expect(t.names()).toHaveText(names(DYNAMIC_USERS.slice(0, DYNAMIC_PAGE_SIZE)));
    await expect(t.pageIndicator).toContainText('Page 1 / 2');
    await expect(t.previous).toBeDisabled();
    await expect(t.next).toBeEnabled();
  });

  test('search matches any column, ignoring case', { tag: ['@functional'], annotation: [tc('TC-DTB-002')] }, async ({ dynamicTablePage: t }) => {
    await test.step('Search "qa"', () => t.search.fill('qa'));

    const qa = DYNAMIC_USERS.filter((u) => u.role.toLowerCase().includes('qa'));
    await expect(t.matchCount).toHaveText(`${qa.length} matches`);
    await expect(t.names()).toHaveText(names(qa));

    await test.step('Search "NOOR"', () => t.search.fill('NOOR'));

    await expect(t.matchCount).toHaveText('1 match');
    await expect(t.names()).toHaveText(['Noor Khan']);
  });

  test('status filter and search combine', { tag: ['@functional'], annotation: [tc('TC-DTB-003')] }, async ({ dynamicTablePage: t }) => {
    await test.step('Filter by "Suspended"', () => t.statusFilter.selectOption('Suspended'));

    await expect(t.names()).toHaveText(names(DYNAMIC_USERS.filter((u) => u.status === 'Suspended')));

    await test.step('Also search "engineer"', () => t.search.fill('engineer'));

    await expect(t.names()).toHaveText(['Ivy Chen']);
    await expect(t.matchCount).toHaveText('1 match');
  });

  test('a search without matches shows the empty state and disables paging', { tag: ['@negative'], annotation: [tc('TC-DTB-004')] }, async ({ dynamicTablePage: t }) => {
    await test.step('Search "zzz"', () => t.search.fill('zzz'));

    await expect(t.matchCount).toHaveText('0 matches');
    await expect(t.emptyState).toBeVisible();
    await expect(t.pageIndicator).toContainText('Page 1 / 1');
    await expect(t.previous).toBeDisabled();
    await expect(t.next).toBeDisabled();
  });

  test('sorting by name toggles ascending and descending', { tag: ['@functional'], annotation: [tc('TC-DTB-005')] }, async ({ dynamicTablePage: t }) => {
    await test.step('Click the "Name" header', () => t.sortByName.click());

    await expect(t.sortByName).toHaveText('Name ↑');
    await expect(t.names()).toHaveText(names(byName.slice(0, DYNAMIC_PAGE_SIZE)));

    await test.step('Click the "Name" header again', () => t.sortByName.click());

    await expect(t.sortByName).toHaveText('Name ↓');
    await expect(t.names()).toHaveText(names([...byName].reverse().slice(0, DYNAMIC_PAGE_SIZE)));
  });

  test('Next shows the second page and is disabled on the last page', { tag: ['@edge'], annotation: [tc('TC-DTB-006')] }, async ({ dynamicTablePage: t }) => {
    await test.step('Press "Next"', () => t.next.click());

    await expect(t.pageIndicator).toContainText('Page 2 / 2');
    await expect(t.names()).toHaveText(names(DYNAMIC_USERS.slice(DYNAMIC_PAGE_SIZE)));
    await expect(t.next).toBeDisabled();
    await expect(t.previous).toBeEnabled();
  });

  test('editing a row and saving updates it', { tag: ['@functional'], annotation: [tc('TC-DTB-007')] }, async ({ dynamicTablePage: t }) => {
    const row = t.row(MIRA.name);

    await test.step(`Edit ${MIRA.name}: role "QA Manager", status "Invited", then Save`, async () => {
      await t.button(row, 'Edit').click();
      await t.editor('Role', MIRA.id).fill('QA Manager');
      await t.editor('Status', MIRA.id).selectOption('Invited');
      await t.button(t.table.rows.filter({ has: t.editor('Name', MIRA.id) }), 'Save').click();
    });

    await expect(await t.table.cell(row, 'Role')).toHaveText('QA Manager');
    await expect(await t.table.cell(row, 'Status')).toHaveText('Invited');
    await expect(t.lastAction).toHaveText(`Updated ${MIRA.name}`);
  });

  test('cancelling an edit keeps the original values', { tag: ['@negative'], annotation: [tc('TC-DTB-008')] }, async ({ dynamicTablePage: t }) => {
    const row = t.row(MIRA.name);

    await test.step(`Edit ${MIRA.name}, change the role, then Cancel`, async () => {
      await t.button(row, 'Edit').click();
      await t.editor('Role', MIRA.id).fill('Changed role');
      await t.button(t.table.rows.filter({ has: t.editor('Name', MIRA.id) }), 'Cancel').click();
    });

    await expect(await t.table.cell(row, 'Role')).toHaveText(MIRA.role);
    await expect(t.lastAction).toHaveText(`Cancelled editing ${MIRA.name}`);
  });

  test('deleting rows updates the count and collapses empty pages', { tag: ['@edge'], annotation: [tc('TC-DTB-009')] }, async ({ dynamicTablePage: t }) => {
    await test.step('Go to page 2 and delete all four rows there', async () => {
      await t.next.click();
      for (const user of DYNAMIC_USERS.slice(DYNAMIC_PAGE_SIZE)) {
        await t.button(t.row(user.name), 'Delete').click();
        await expect(t.lastAction).toHaveText(`Deleted ${user.name}`);
      }
    });

    await expect(t.matchCount).toHaveText(`${DYNAMIC_PAGE_SIZE} matches`);
    await expect(t.pageIndicator).toContainText('Page 1 / 1');
    await expect(t.names()).toHaveText(names(DYNAMIC_USERS.slice(0, DYNAMIC_PAGE_SIZE)));
  });
});
