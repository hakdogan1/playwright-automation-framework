import type { Page } from '@playwright/test';

/**
 * Stops the fake clock once a page is ready, so only clock.runFor() moves time.
 *
 * page.clock.install() alone does NOT freeze time: the fake clock keeps following real time
 * (measured 2026-11-23: +508…511 ms per 500 real ms in Chromium, Firefox and WebKit). With an
 * injected 500 ms delay, install-only made the Keyboard Keys spinner, the Bug Playground 420 ms
 * toast and the Notifications dismiss boundary behave differently than the tests assumed.
 *
 * Call page.clock.install() before navigating and this after the page is ready. The clock keeps
 * running until it is paused, so the pause target lies 1 s ahead (a +1 ms target failed with
 * "Cannot fast-forward to the past"); this only fires app timers due within that second.
 */
export async function pauseClock(page: Page): Promise<void> {
  const now = await page.evaluate(() => Date.now());
  await page.clock.pauseAt(now + 1_000);
}
