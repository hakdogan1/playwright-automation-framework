import { test, expect, tc } from '../../fixtures';
import { PLANS } from '../../data/ui-modules.data';

test.describe('Radio Buttons', () => {
  test.beforeEach(async ({ radioPage }) => {
    await radioPage.goto();
  });

  test('the plan group defaults to Starter', { tag: ['@smoke'], annotation: [tc('TC-RAD-001')] }, async ({ radioPage }) => {
    await expect(radioPage.group.getByRole('radio')).toHaveCount(PLANS.length);
    await expect(radioPage.option('Starter')).toBeChecked();
    await expect(radioPage.selected).toHaveText('Plan: Starter');
  });

  for (const plan of PLANS) {
    test(`choosing ${plan} selects only that option`, { tag: ['@functional'], annotation: [tc('TC-RAD-002')] }, async ({ radioPage }) => {
      await test.step(`Check "${plan}"`, () => radioPage.option(plan).check());

      await expect(radioPage.selected).toHaveText(`Plan: ${plan}`);
      for (const other of PLANS.filter((p) => p !== plan)) await expect(radioPage.option(other)).not.toBeChecked();
    });
  }

  test('clicking the selected option keeps it selected', { tag: ['@negative'], annotation: [tc('TC-RAD-003')] }, async ({ radioPage }) => {
    await test.step('Click "Starter" again', () => radioPage.option('Starter').click());

    await expect(radioPage.option('Starter')).toBeChecked();
    await expect(radioPage.selected).toHaveText('Plan: Starter');
  });

  test('arrow keys move the selection within the group', { tag: ['@edge'], annotation: [tc('TC-RAD-004')] }, async ({ radioPage }) => {
    await test.step('Focus "Starter" and press ArrowDown', async () => {
      await radioPage.option('Starter').focus();
      await radioPage.option('Starter').press('ArrowDown');
    });

    await expect(radioPage.option('Pro')).toBeChecked();
    await expect(radioPage.option('Pro')).toBeFocused();
    await expect(radioPage.selected).toHaveText('Plan: Pro');
  });
});
