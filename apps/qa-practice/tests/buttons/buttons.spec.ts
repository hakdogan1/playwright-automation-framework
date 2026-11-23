import { test, expect, tc } from '../../fixtures';

test.describe('Buttons', () => {
  test.beforeEach(async ({ buttonsPage }) => {
    await buttonsPage.goto();
  });

  test('all button variants render in their initial state', { tag: ['@smoke'], annotation: [tc('TC-BTN-001')] }, async ({ buttonsPage }) => {
    for (const button of [buttonsPage.clickButton, buttonsPage.doubleClickButton, buttonsPage.rightClickButton, buttonsPage.hoverButton]) {
      await expect(button).toBeEnabled();
    }
    await expect(buttonsPage.disabledButton).toBeDisabled();
    await expect(buttonsPage.loadingButton).toHaveText('Click to Load');
    await expect(buttonsPage.feedbackMessage).toHaveText('Choose a button to see its behavior.');
  });

  test('single click is reported', { tag: ['@functional'], annotation: [tc('TC-BTN-002')] }, async ({ buttonsPage }) => {
    await test.step('Click "Click Me"', () => buttonsPage.clickButton.click());

    await expect(buttonsPage.feedbackMessage).toHaveText('Click detected.');
    await expect(buttonsPage.statusFor('click')).toHaveText('Click detected.');
    await expect(buttonsPage.feedbackPanel).toHaveAttribute('data-variant', 'click');
  });

  test('double click is reported', { tag: ['@functional'], annotation: [tc('TC-BTN-003')] }, async ({ buttonsPage }) => {
    await test.step('Double-click "Double Click Me"', () => buttonsPage.doubleClickButton.dblclick());

    await expect(buttonsPage.feedbackMessage).toHaveText('Double-click detected.');
    await expect(buttonsPage.statusFor('double-click')).toHaveText('Double-click detected.');
  });

  test('a single click on the double-click button is ignored', { tag: ['@negative'], annotation: [tc('TC-BTN-004')] }, async ({ buttonsPage }) => {
    await test.step('Click "Double Click Me" once', () => buttonsPage.doubleClickButton.click());

    await expect(buttonsPage.statusFor('double-click')).toHaveText('Double-click the button.');
    await expect(buttonsPage.feedbackPanel).toHaveAttribute('data-variant', 'idle');
  });

  test('right click is reported', { tag: ['@functional'], annotation: [tc('TC-BTN-005')] }, async ({ buttonsPage }) => {
    await test.step('Right-click "Right Click Me"', () => buttonsPage.rightClickButton.click({ button: 'right' }));

    await expect(buttonsPage.feedbackMessage).toHaveText('Right-click detected.');
    await expect(buttonsPage.statusFor('right-click')).toHaveText('Right-click detected.');
  });

  test('hover shows the tooltip and leaving hides it', { tag: ['@functional'], annotation: [tc('TC-BTN-006')] }, async ({ buttonsPage, page }) => {
    await expect(buttonsPage.hoverTooltip).toBeHidden();

    await test.step('Hover "Hover Over Me"', () => buttonsPage.hoverButton.hover());

    await expect(buttonsPage.hoverTooltip).toBeVisible();
    await expect(buttonsPage.feedbackMessage).toHaveText('Hover detected.');

    await test.step('Move the pointer away', () => page.mouse.move(0, 0));

    await expect(buttonsPage.hoverTooltip).toBeHidden();
  });

  test('the disabled button cannot be activated', { tag: ['@negative'], annotation: [tc('TC-BTN-007')] }, async ({ buttonsPage }) => {
    await expect(buttonsPage.disabledButton).toBeDisabled();
    await expect(buttonsPage.disabledButton).toHaveAttribute('aria-disabled', 'true');
    await expect(buttonsPage.feedbackPanel).toHaveAttribute('data-variant', 'idle');
  });

  test('each attempt on the disabled button is counted', { tag: ['@edge'], annotation: [tc('TC-BTN-008')] }, async ({ buttonsPage }) => {
    await expect(buttonsPage.disabledAttempts).toHaveText('attempts=0');
    for (let attempt = 1; attempt <= 3; attempt++) {
      await test.step(`Try the disabled button (attempt ${attempt})`, () => buttonsPage.tryDisabledButton.click());

      await expect(buttonsPage.disabledAttempts).toHaveText(`attempts=${attempt}`);
    }
    await expect(buttonsPage.feedbackMessage).toHaveText('This button is disabled and cannot be clicked.');
  });

  test('the loading button runs one async action and completes', { tag: ['@functional'], annotation: [tc('TC-BTN-009')] }, async ({ buttonsPage }) => {
    await test.step('Click "Click to Load"', () => buttonsPage.loadingButton.click());

    await test.step('While loading the button is busy and disabled', async () => {
      await expect(buttonsPage.loadingButton).toHaveAttribute('aria-busy', 'true');
      await expect(buttonsPage.loadingButton).toBeDisabled();
      await expect(buttonsPage.loadingButton).toHaveText('Loading…');
    });

    await expect(buttonsPage.loadingButton).toHaveText('Loaded');
    await expect(buttonsPage.loadingButton).toBeEnabled();
    await expect(buttonsPage.loadingStatus).toHaveText('Loading completed successfully.');
    await expect(buttonsPage.feedbackMessage).toHaveText('Loading completed successfully.');
  });
});
