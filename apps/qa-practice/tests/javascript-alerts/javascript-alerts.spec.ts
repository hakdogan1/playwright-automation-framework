import { test, expect, tc } from '../../fixtures';
import { JS_DIALOGS } from '../../data/ui-modules.data';

test.describe('JavaScript Alerts', () => {
  test.beforeEach(async ({ javaScriptAlertsPage }) => {
    await javaScriptAlertsPage.goto();
  });

  test('no dialog has been handled on load', { tag: ['@smoke'], annotation: [tc('TC-JSA-001')] }, async ({ javaScriptAlertsPage }) => {
    await expect(javaScriptAlertsPage.result).toHaveAttribute('data-dialog-type', 'none');
    await expect(javaScriptAlertsPage.result).toContainText('No dialog handled yet.');
  });

  test('an alert is shown and accepted', { tag: ['@functional'], annotation: [tc('TC-JSA-002')] }, async ({ javaScriptAlertsPage: p }) => {
    const dialogs = await test.step('Click "JS Alert" and accept the dialog', () => p.answerDialogs(p.alertButton, [{ accept: true }]));

    expect(dialogs).toEqual([{ type: 'alert', message: JS_DIALOGS.alert }]);
    await expect(p.result).toHaveAttribute('data-dialog-type', 'alert');
    await expect(p.result).toHaveAttribute('data-dialog-action', 'accepted');
  });

  for (const accept of [true, false]) {
    test(`a confirm that is ${accept ? 'accepted' : 'dismissed'} is reported`, { tag: [accept ? '@functional' : '@negative'], annotation: [tc('TC-JSA-003')] }, async ({ javaScriptAlertsPage: p }) => {
      const dialogs = await test.step(`Click "JS Confirm" and ${accept ? 'accept' : 'dismiss'}`, () => p.answerDialogs(p.confirmButton, [{ accept }]));

      expect(dialogs).toEqual([{ type: 'confirm', message: JS_DIALOGS.confirm }]);
      await expect(p.result).toHaveAttribute('data-dialog-type', 'confirm');
      await expect(p.result).toHaveAttribute('data-dialog-action', accept ? 'accepted' : 'dismissed');
    });
  }

  test('a required prompt rejects an empty value and re-asks', { tag: ['@negative'], annotation: [tc('TC-JSA-004')] }, async ({ javaScriptAlertsPage: p }) => {
    const dialogs = await test.step('Submit an empty tag, accept the warning, then enter "v1.2.0"', () =>
      p.answerDialogs(p.requiredPromptButton, [{ accept: true, text: '   ' }, { accept: true }, { accept: true, text: 'v1.2.0' }]));

    expect(dialogs).toEqual([
      { type: 'prompt', message: JS_DIALOGS.requiredPrompt },
      { type: 'alert', message: JS_DIALOGS.requiredValidation },
      { type: 'prompt', message: JS_DIALOGS.requiredPrompt },
    ]);
    await expect(p.result).toHaveAttribute('data-dialog-action', 'accepted');
    await expect(p.promptValue).toContainText('v1.2.0');
  });

  test('dismissing the required prompt is reported as dismissed', { tag: ['@negative'], annotation: [tc('TC-JSA-005')] }, async ({ javaScriptAlertsPage: p }) => {
    const dialogs = await test.step('Click "JS Prompt (Required)" and dismiss', () => p.answerDialogs(p.requiredPromptButton, [{ accept: false }]));

    expect(dialogs).toHaveLength(1);
    await expect(p.result).toHaveAttribute('data-dialog-action', 'dismissed');
    await expect(p.promptValue).toContainText('(empty)');
  });

  test('the optional prompt accepts an empty value', { tag: ['@edge'], annotation: [tc('TC-JSA-006')] }, async ({ javaScriptAlertsPage: p }) => {
    const dialogs = await test.step('Click "JS Prompt (Optional)" and accept it empty', () => p.answerDialogs(p.optionalPromptButton, [{ accept: true, text: '' }]));

    expect(dialogs).toEqual([{ type: 'prompt', message: JS_DIALOGS.optionalPrompt }]);
    await expect(p.result).toHaveAttribute('data-dialog-action', 'accepted');
    await expect(p.promptValue).toContainText('(empty)');
  });
});
