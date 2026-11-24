import { test, expect, tc } from '../../fixtures';
import { ALERTS } from '../../data/async-overlays.data';

// Oracles come from the app source (AlertsWidget, overlays.tsx, 3d14d23): one native confirm.

test.describe('Alerts', () => {
  test.beforeEach(async ({ alertsPage }) => {
    await alertsPage.goto();
  });

  test('accepting the confirm marks the chip "accepted"', { tag: ['@smoke'], annotation: [tc('TC-ALR-001')] }, async ({ alertsPage: a }) => {
    await expect(a.result).toHaveText(ALERTS.result.initial);

    const dialog = await test.step('Press "Fire confirm" and accept', () => a.answerConfirm(true));

    expect(dialog).toEqual({ type: 'confirm', message: ALERTS.message });
    await expect(a.result).toHaveText(ALERTS.result.accepted);
  });

  test('dismissing the confirm marks the chip "dismissed"', { tag: ['@negative'], annotation: [tc('TC-ALR-002')] }, async ({ alertsPage: a }) => {
    const dialog = await test.step('Press "Fire confirm" and dismiss', () => a.answerConfirm(false));

    expect(dialog).toEqual({ type: 'confirm', message: ALERTS.message });
    await expect(a.result).toHaveText(ALERTS.result.dismissed);
  });

  test('each confirm is a new dialog and the chip follows the last answer', { tag: ['@edge'], annotation: [tc('TC-ALR-003')] }, async ({ alertsPage: a }) => {
    for (const [accept, action, expected] of [
      [true, 'accept', ALERTS.result.accepted],
      [false, 'dismiss', ALERTS.result.dismissed],
      [true, 'accept', ALERTS.result.accepted],
    ] as const) {
      const dialog = await test.step(`Fire confirm and ${action}`, () => a.answerConfirm(accept));

      expect(dialog.message).toBe(ALERTS.message);
      await expect(a.result).toHaveText(expected);
    }
  });
});
