import { test, expect, tc } from '../../fixtures';

test.describe('Modals', () => {
  test.beforeEach(async ({ modalsPage }) => {
    await modalsPage.goto();
  });

  test('opening the modal shows the dialog with the title field focused', { tag: ['@smoke'], annotation: [tc('TC-MOD-001')] }, async ({ modalsPage }) => {
    await expect(modalsPage.emptyRows).toBeVisible();

    await test.step('Press "Open modal"', () => modalsPage.open());

    await expect(modalsPage.dialog.titleInput).toBeFocused();
    await expect(modalsPage.dialog.saveButton).toBeVisible();
    await expect(modalsPage.dialog.cancelButton).toBeVisible();
  });

  test('saving a title closes the dialog and adds a row', { tag: ['@functional'], annotation: [tc('TC-MOD-002')] }, async ({ modalsPage }) => {
    await modalsPage.open();

    await test.step('Enter "Checkout total rounding" and press Save', () => modalsPage.dialog.save('Checkout total rounding'));

    await expect(modalsPage.dialog.dialog).toBeHidden();
    await expect(modalsPage.latestRow).toHaveText('Checkout total rounding');
    await expect(modalsPage.emptyRows).toBeHidden();
  });

  for (const { label, value } of [
    { label: 'empty', value: '' },
    { label: 'whitespace only', value: '    ' },
  ]) {
    test(`saving an ${label} title keeps the dialog open`, { tag: ['@negative'], annotation: [tc('TC-MOD-003')] }, async ({ modalsPage }) => {
      await modalsPage.open();

      await test.step(`Enter an ${label} title and press Save`, () => modalsPage.dialog.save(value));

      await expect(modalsPage.dialog.dialog).toBeVisible();
      await expect(modalsPage.emptyRows).toBeVisible();
      await expect(modalsPage.latestRow).toHaveCount(0);
    });
  }

  test('surrounding spaces are trimmed from the saved title', { tag: ['@edge'], annotation: [tc('TC-MOD-004')] }, async ({ modalsPage }) => {
    await modalsPage.open();

    await test.step('Enter "   Login timeout   " and press Save', () => modalsPage.dialog.save('   Login timeout   '));

    await expect(modalsPage.latestRow).toHaveText('Login timeout');
  });

  test('Escape, Cancel and the backdrop close the dialog without saving', { tag: ['@functional'], annotation: [tc('TC-MOD-005')] }, async ({ modalsPage, page }) => {
    const ways = [
      { name: 'Escape', close: () => page.keyboard.press('Escape') },
      { name: 'Cancel', close: () => modalsPage.dialog.cancelButton.click() },
      { name: 'backdrop', close: () => modalsPage.dialog.clickBackdrop() },
    ];
    for (const way of ways) {
      await test.step(`Open the dialog, type a title, close it with ${way.name}`, async () => {
        await modalsPage.open();
        await modalsPage.dialog.titleInput.fill(`Closed with ${way.name}`);
        await way.close();
        await expect(modalsPage.dialog.dialog).toBeHidden();
      });
    }
    await expect(modalsPage.emptyRows).toBeVisible();
  });

  test('clicking inside the dialog does not close it', { tag: ['@negative'], annotation: [tc('TC-MOD-006')] }, async ({ modalsPage }) => {
    await modalsPage.open();

    await test.step('Click the dialog body', () => modalsPage.dialog.dialog.click({ position: { x: 10, y: 10 } }));

    await expect(modalsPage.dialog.dialog).toBeVisible();
  });

  test('rows are listed in the order they were added', { tag: ['@functional'], annotation: [tc('TC-MOD-007')] }, async ({ modalsPage }) => {
    for (const title of ['First defect', 'Second defect']) {
      await test.step(`Add "${title}"`, async () => {
        await modalsPage.open();
        await modalsPage.dialog.save(title);
        await expect(modalsPage.dialog.dialog).toBeHidden();
      });
    }
    await expect(modalsPage.rows()).toHaveText(['First defect', 'Second defect']);
    await expect(modalsPage.latestRow).toHaveText('Second defect');
  });
});
