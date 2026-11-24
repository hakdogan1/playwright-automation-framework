import { test, expect, tc } from '../../fixtures';
import { LAZY } from '../../data/async-overlays.data';

// Oracles come from the app source (LazyLoadWidget, async.tsx, 3d14d23). The fake clock is
// installed and paused by goto(), so only advance() moves the 1.2 s delay.
// A second click while loading is not restarted (the first timer wins): docs/observations/OBS-07.

test.describe('Lazy Loaded Elements', () => {
  test.beforeEach(async ({ lazyLoadPage }) => {
    await lazyLoadPage.goto();
  });

  test('the trigger switches to "Loading…" and nothing is mounted yet', { tag: ['@smoke'], annotation: [tc('TC-LZY-001')] }, async ({ lazyLoadPage: z }) => {
    await expect(z.trigger).toHaveText(LAZY.idle);
    await expect(z.panel).toHaveCount(0);

    await test.step('Press "Mount lazy panel"', () => z.trigger.click());

    await expect(z.trigger).toHaveText(LAZY.busy);
    await expect(z.panel).toHaveCount(0);
  });

  test('the panel is mounted exactly after 1200 ms', { tag: ['@functional'], annotation: [tc('TC-LZY-002')] }, async ({ lazyLoadPage: z }) => {
    await z.trigger.click();

    await test.step('Advance the clock to 1199 ms', () => z.advance(LAZY.delayMs - 1));

    await expect(z.panel).toHaveCount(0);
    await expect(z.trigger).toHaveText(LAZY.busy);

    await test.step('Advance the last millisecond', () => z.advance(1));

    await expect(z.panel).toBeVisible();
    await expect(z.panel.getByText(LAZY.title, { exact: true })).toBeVisible();
    await expect(z.panel).toContainText('Mounted after a ~1.2s delay.');
    await expect(z.trigger).toHaveText(LAZY.idle);
  });

  test('triggering again after the panel is shown mounts it again, once', { tag: ['@edge'], annotation: [tc('TC-LZY-003')] }, async ({ lazyLoadPage: z }) => {
    await z.trigger.click();
    await z.advance(LAZY.delayMs);
    await expect(z.panel).toBeVisible();

    await test.step('Press the trigger again', () => z.trigger.click());

    await expect(z.trigger).toHaveText(LAZY.busy);

    await test.step('Advance 1200 ms and let the animations finish', async () => {
      await z.advance(LAZY.delayMs);
      await z.resumeRealTime();
    });

    await expect(z.panel).toHaveCount(1);
    await expect(z.panel).toBeVisible();
    await expect(z.trigger).toHaveText(LAZY.idle);
  });
});
