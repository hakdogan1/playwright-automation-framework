import { test, expect, tc } from '../../fixtures';
import { TOASTS } from '../../data/async-overlays.data';

// Oracles come from the app source (ToastsWidget, overlays.tsx, 3d14d23). Same clock strategy as
// Notifications (TC-NTF.md): auto-dismiss timing on the installed and paused fake clock; manual
// Close on the real clock, because a removed toast's exit animation only finishes in real time.
// The empty state renders on toasts.length === 0, so it flips at the dismissal itself.

const CLOSE_BUTTONS = { success: 0, error: 1 } as const;
const TIME = /^\d{1,2}:\d{2}:\d{2}(\s?[AP]M)?$/i;

test.describe('Toast Messages', () => {
  test('two scenario buttons and an empty viewport on load', { tag: ['@smoke'], annotation: [tc('TC-TST-001')] }, async ({ toastsPage: t }) => {
    await t.goto();

    await expect(t.trigger('success')).toBeEnabled();
    await expect(t.trigger('error')).toBeEnabled();
    await expect(t.emptyState).toBeVisible();
    await expect(t.toasts).toHaveCount(0);
  });

  for (const kind of ['success', 'error'] as const) {
    test(`the ${kind} scenario shows its title, text, time and live-region role`, { tag: ['@functional'], annotation: [tc('TC-TST-002')] }, async ({ toastsPage: t }) => {
      await t.goto({ freezeTimers: true });

      await test.step(`Press "Show ${kind} scenario"`, () => t.trigger(kind).click());

      const toast = t.toast(kind);
      await expect(toast).toHaveCount(1);
      await expect(toast.locator('span > span')).toHaveText([TOASTS[kind].title, TOASTS[kind].text, TIME]);
      await expect(t.closeButtons(), 'only error toasts have Close').toHaveCount(CLOSE_BUTTONS[kind]);
      await expect(t.emptyState).toBeHidden();
    });
  }

  test('a success toast stays until 5000 ms and then disappears', { tag: ['@edge'], annotation: [tc('TC-TST-003')] }, async ({ toastsPage: t }) => {
    await t.goto({ freezeTimers: true });
    await t.trigger('success').click();

    await test.step('Advance the clock to 4999 ms', () => t.advance(TOASTS.successDismissMs - 1));

    await expect(t.toast('success')).toBeVisible();
    await expect(t.emptyState).toBeHidden();

    await test.step('Advance the last millisecond', () => t.advance(1));

    await expect(t.emptyState).toBeVisible();

    await test.step('Resume real time so the exit animation can finish', () => t.resumeRealTime());

    await expect(t.toasts).toHaveCount(0);
  });

  test('an error toast does not auto-dismiss, even after 60 seconds', { tag: ['@negative'], annotation: [tc('TC-TST-004')] }, async ({ toastsPage: t }) => {
    await t.goto({ freezeTimers: true });
    await t.trigger('error').click();

    await test.step('Advance the clock by 60 seconds', () => t.advance(60_000));

    await expect(t.toast('error')).toBeVisible();
    await expect(t.toasts).toHaveCount(1);
  });

  test('toasts stack in firing order and only the success toast expires', { tag: ['@functional'], annotation: [tc('TC-TST-005')] }, async ({ toastsPage: t }) => {
    await t.goto({ freezeTimers: true });
    for (const kind of ['error', 'success', 'error'] as const) {
      await test.step(`Press "Show ${kind} scenario"`, () => t.trigger(kind).click());
    }

    await expect(t.toasts).toHaveCount(3);
    await expect(t.toasts.locator('span > span:first-child')).toHaveText([TOASTS.error.title, TOASTS.success.title, TOASTS.error.title]);

    await test.step('Advance 5000 ms and let the exit animation finish', async () => {
      await t.advance(TOASTS.successDismissMs);
      await t.resumeRealTime();
    });

    await expect(t.toast('success')).toHaveCount(0);
    await expect(t.toast('error')).toHaveCount(2);
    await expect(t.emptyState).toBeHidden();
  });

  test('Close removes only its own error toast', { tag: ['@functional'], annotation: [tc('TC-TST-006')] }, async ({ toastsPage: t }) => {
    await t.goto();
    await t.trigger('error').click();
    await t.trigger('error').click();
    await expect(t.toast('error')).toHaveCount(2);

    await test.step('Close the first error toast', () => t.closeButtons().first().click());

    await expect(t.toast('error')).toHaveCount(1);
    await expect(t.emptyState).toBeHidden();

    await test.step('Close the remaining error toast', () => t.closeButtons().click());

    await expect(t.emptyState).toBeVisible();
    await expect(t.toasts).toHaveCount(0);
  });
});
