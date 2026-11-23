import { test, expect, tc } from '../../fixtures';
import { CONTEXT_MENU_ITEMS } from '../../data/ui-modules.data';

test.describe('Right Click', () => {
  test.beforeEach(async ({ rightClickPage }) => {
    await rightClickPage.goto();
  });

  test('the target is shown and no action is recorded', { tag: ['@smoke'], annotation: [tc('TC-RCL-001')] }, async ({ rightClickPage }) => {
    await expect(rightClickPage.target).toBeVisible();
    await expect(rightClickPage.selection).toHaveText('Action: none');
    await expect(rightClickPage.menu.menu).toHaveCount(0);
  });

  test('right-click opens the menu with all actions', { tag: ['@functional'], annotation: [tc('TC-RCL-002')] }, async ({ rightClickPage }) => {
    await test.step('Right-click the target', () => rightClickPage.target.click({ button: 'right' }));

    await expect(rightClickPage.menu.menu).toBeVisible();
    await expect(rightClickPage.menu.items).toHaveText([...CONTEXT_MENU_ITEMS]);
  });

  for (const item of CONTEXT_MENU_ITEMS) {
    test(`choosing "${item}" records it and closes the menu`, { tag: ['@functional'], annotation: [tc('TC-RCL-003')] }, async ({ rightClickPage }) => {
      await test.step(`Right-click the target and choose "${item}"`, async () => {
        await rightClickPage.target.click({ button: 'right' });
        await rightClickPage.menu.item(item).click();
      });

      await expect(rightClickPage.selection).toHaveText(`Action: ${item}`);
      await expect(rightClickPage.menu.menu).toHaveCount(0);
    });
  }

  test('a left click does not open the menu', { tag: ['@negative'], annotation: [tc('TC-RCL-004')] }, async ({ rightClickPage }) => {
    await test.step('Left-click the target', () => rightClickPage.target.click());

    await expect(rightClickPage.menu.menu).toHaveCount(0);
    await expect(rightClickPage.selection).toHaveText('Action: none');
  });
});
