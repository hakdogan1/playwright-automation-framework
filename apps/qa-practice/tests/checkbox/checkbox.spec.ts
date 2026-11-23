import { test, expect, tc } from '../../fixtures';

const CHILDREN = ['Identity', 'Wallet', 'Admin'] as const;

test.describe('Checkboxes', () => {
  test.beforeEach(async ({ checkboxPage }) => {
    await checkboxPage.goto();
  });

  test('all checkboxes start unchecked', { tag: ['@smoke'], annotation: [tc('TC-CHK-001')] }, async ({ checkboxPage }) => {
    await expect(checkboxPage.selectAll).not.toBeChecked();
    for (const label of CHILDREN) await expect(checkboxPage.child(label)).not.toBeChecked();
    await expect(checkboxPage.state).toHaveText('none selected');
  });

  test('"Select all" checks and unchecks every child', { tag: ['@functional'], annotation: [tc('TC-CHK-002')] }, async ({ checkboxPage }) => {
    await test.step('Check "Select all squads"', () => checkboxPage.selectAll.check());

    for (const label of CHILDREN) await expect(checkboxPage.child(label)).toBeChecked();
    await expect(checkboxPage.state).toHaveText('all selected');

    await test.step('Uncheck "Select all squads"', () => checkboxPage.selectAll.uncheck());

    for (const label of CHILDREN) await expect(checkboxPage.child(label)).not.toBeChecked();
    await expect(checkboxPage.state).toHaveText('none selected');
  });

  test('a partial selection makes the parent indeterminate', { tag: ['@functional'], annotation: [tc('TC-CHK-003')] }, async ({ checkboxPage }) => {
    await test.step('Check "Wallet" only', () => checkboxPage.child('Wallet').check());

    await expect(checkboxPage.selectAll).toHaveJSProperty('indeterminate', true);
    await expect(checkboxPage.selectAll).not.toBeChecked();
    await expect(checkboxPage.state).toHaveText('indeterminate');
  });

  test('checking every child one by one checks the parent', { tag: ['@edge'], annotation: [tc('TC-CHK-004')] }, async ({ checkboxPage }) => {
    for (const label of CHILDREN) {
      await test.step(`Check "${label}"`, () => checkboxPage.child(label).check());
    }
    await expect(checkboxPage.selectAll).toBeChecked();
    await expect(checkboxPage.selectAll).toHaveJSProperty('indeterminate', false);
    await expect(checkboxPage.state).toHaveText('all selected');
  });

  test('clicking an indeterminate parent selects all children', { tag: ['@edge'], annotation: [tc('TC-CHK-005')] }, async ({ checkboxPage }) => {
    await test.step('Check "Identity", then click "Select all squads"', async () => {
      await checkboxPage.child('Identity').check();
      await checkboxPage.selectAll.click();
    });

    for (const label of CHILDREN) await expect(checkboxPage.child(label)).toBeChecked();
    await expect(checkboxPage.state).toHaveText('all selected');
  });

  test('unchecking one child of a full selection returns to indeterminate', { tag: ['@negative'], annotation: [tc('TC-CHK-006')] }, async ({ checkboxPage }) => {
    await test.step('Select all, then uncheck "Admin"', async () => {
      await checkboxPage.selectAll.check();
      await checkboxPage.child('Admin').uncheck();
    });

    await expect(checkboxPage.selectAll).not.toBeChecked();
    await expect(checkboxPage.selectAll).toHaveJSProperty('indeterminate', true);
    await expect(checkboxPage.state).toHaveText('indeterminate');
  });
});
