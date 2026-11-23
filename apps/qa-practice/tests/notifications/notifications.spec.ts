import { test, expect, tc } from '../../fixtures';
import { EXIT_ANIMATION_MS, NOTIFICATIONS } from '../../data/phase2c.data';
import type { NotificationKind } from '../../pages/notifications.page';

const KINDS = Object.keys(NOTIFICATIONS) as NotificationKind[];

// Auto-dismiss timers are controlled with page.clock (goto({ freezeTimers: true }) installs AND
// pauses it), so timing assertions are exact and never depend on real time.
// Manual Close is tested on the real clock: with page.clock installed, a toast removed
// by Close never finished its exit animation (12/12 local attempts, all four kinds, even
// after clock.resume()), while on the real clock it was removed every time (4/4).
// Root cause inside the animation library: UNKNOWN. See TC-NTF.md.

test.describe('Notifications', () => {
  test('four triggers and an empty viewport on load', { tag: ['@smoke'], annotation: [tc('TC-NTF-001')] }, async ({ notificationsPage: n }) => {
    await n.goto();
    for (const kind of KINDS) await expect(n.trigger(kind)).toBeEnabled();
    await expect(n.emptyState).toBeVisible();
    await expect(n.toasts).toHaveCount(0);
  });

  for (const kind of KINDS) {
    test(`${kind} shows its message with the right live-region role`, { tag: ['@functional'], annotation: [tc('TC-NTF-002')] }, async ({ notificationsPage: n }) => {
      await n.goto({ freezeTimers: true });

      await test.step(`Press "${kind}"`, () => n.trigger(kind).click());

      await expect(n.toast(kind)).toContainText(NOTIFICATIONS[kind].text);
      await expect(n.toast(kind)).toHaveAttribute('role', NOTIFICATIONS[kind].role);
      await expect(n.closeButton(kind)).toBeVisible();
      await expect(n.emptyState).toBeHidden();
    });
  }

  for (const kind of ['success', 'info', 'warning'] as const) {
    const ms = NOTIFICATIONS[kind].dismissMs;

    test(`${kind} stays until ${ms} ms and then disappears`, { tag: ['@edge'], annotation: [tc('TC-NTF-003')] }, async ({ notificationsPage: n }) => {
      await n.goto({ freezeTimers: true });
      await n.trigger(kind).click();

      await test.step(`Advance the clock to ${ms - 1} ms`, () => n.advance(ms - 1));

      // The empty state renders on toasts.length === 0, so it flips at the dismissal itself.
      // The toast element alone is no proof: a dismissed toast stays in the DOM during its exit
      // animation (an early dismissal was invisible to a toast-only check, 2026-11-23).
      await expect(n.toast(kind)).toBeVisible();
      await expect(n.emptyState).toBeHidden();

      await test.step(`Advance the last millisecond to ${ms} ms`, () => n.advance(1));

      await expect(n.emptyState).toBeVisible();

      await test.step('Resume real time so the exit animation can finish', () => n.resumeRealTime());

      await expect(n.toast(kind)).toHaveCount(0);
    });
  }

  test('error does not auto-dismiss, even after 60 seconds', { tag: ['@negative'], annotation: [tc('TC-NTF-004')] }, async ({ notificationsPage: n }) => {
    await n.goto({ freezeTimers: true });
    await n.trigger('error').click();

    await test.step('Advance the clock by 60 seconds', () => n.advance(60_000));

    await expect(n.toast('error')).toBeVisible();
    await expect(n.toasts).toHaveCount(1);
  });

  test('toasts stack in the order they were fired', { tag: ['@functional'], annotation: [tc('TC-NTF-005')] }, async ({ notificationsPage: n }) => {
    await n.goto({ freezeTimers: true });
    for (const kind of ['warning', 'success', 'error'] as const) {
      await test.step(`Press "${kind}"`, () => n.trigger(kind).click());
    }
    await expect(n.toasts).toHaveCount(3);
    await expect(n.toasts).toContainText([NOTIFICATIONS.warning.text, NOTIFICATIONS.success.text, NOTIFICATIONS.error.text]);
  });

  for (const kind of KINDS) {
    test(`Close removes the ${kind} toast before its timer`, { tag: ['@functional'], annotation: [tc('TC-NTF-006')] }, async ({ notificationsPage: n }) => {
      await n.goto();
      await n.trigger(kind).click();
      await expect(n.toast(kind)).toBeVisible();

      await test.step(`Press "Close ${kind} notification"`, () => n.closeButton(kind).click());

      // The exit animation must finish well before the shortest auto-dismiss (3200 ms).
      await expect(n.toast(kind)).toHaveCount(0, { timeout: EXIT_ANIMATION_MS * 2 });
      await expect(n.emptyState).toBeVisible();
    });
  }

  test('closing one toast leaves the others and their timers intact', { tag: ['@edge'], annotation: [tc('TC-NTF-007')] }, async ({ notificationsPage: n }) => {
    await n.goto();
    await n.trigger('warning').click();
    await n.trigger('error').click();

    await test.step('Close the warning toast', () => n.closeButton('warning').click());

    await expect(n.toast('warning')).toHaveCount(0, { timeout: EXIT_ANIMATION_MS * 2 });
    await expect(n.toast('error')).toBeVisible();
    await expect(n.toasts).toHaveCount(1);
  });
});
