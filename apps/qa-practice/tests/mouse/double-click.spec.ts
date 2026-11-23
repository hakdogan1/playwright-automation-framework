import { test, expect, tc } from '../../fixtures';
import { DOUBLE_CLICK_DEFAULT } from '../../data/ui-modules.data';

test.describe('Double Click', () => {
  test.beforeEach(async ({ doubleClickPage }) => {
    await doubleClickPage.goto();
  });

  test('the label is shown and no editor is open', { tag: ['@smoke'], annotation: [tc('TC-DBL-001')] }, async ({ doubleClickPage }) => {
    await expect(doubleClickPage.label).toHaveText(DOUBLE_CLICK_DEFAULT);
    await expect(doubleClickPage.editor).toHaveCount(0);
  });

  test('double-click opens the editor with the current value and Save keeps the edit', { tag: ['@functional'], annotation: [tc('TC-DBL-002')] }, async ({ doubleClickPage }) => {
    await test.step('Double-click the label', () => doubleClickPage.label.dblclick());

    await expect(doubleClickPage.editor).toBeFocused();
    await expect(doubleClickPage.editor).toHaveValue(DOUBLE_CLICK_DEFAULT);

    await test.step('Replace the text and press Save', async () => {
      await doubleClickPage.editor.fill('Shift-left testing');
      await doubleClickPage.save.click();
    });

    await expect(doubleClickPage.editor).toHaveCount(0);
    await expect(doubleClickPage.label).toHaveText('Shift-left testing');
  });

  test('a single click does not open the editor', { tag: ['@negative'], annotation: [tc('TC-DBL-003')] }, async ({ doubleClickPage }) => {
    await test.step('Click the label once', () => doubleClickPage.label.click());

    await expect(doubleClickPage.editor).toHaveCount(0);
    await expect(doubleClickPage.label).toHaveText(DOUBLE_CLICK_DEFAULT);
  });

  test('unicode and symbols are saved verbatim', { tag: ['@edge'], annotation: [tc('TC-DBL-004')] }, async ({ doubleClickPage }) => {
    const value = 'Kalite güvencesi ✓ <b>ğüşıöç</b>';

    await test.step('Edit the label to text with Turkish characters, a symbol and markup', async () => {
      await doubleClickPage.label.dblclick();
      await doubleClickPage.editor.fill(value);
      await doubleClickPage.save.click();
    });

    await expect(doubleClickPage.label).toHaveText(value);
  });
});
