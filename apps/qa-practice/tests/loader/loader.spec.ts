import { test, expect, tc } from '../../fixtures';
import { LOADER } from '../../data/async-overlays.data';

// Oracles come from the app source (LoaderWidget, extras.tsx, 3d14d23). The fake clock is
// installed and paused by goto(), so only advance() moves the 1.6 s delay.
// "Force error" while loading lets the pending timer show the metrics next to the error: recorded
// in docs/observations/OBS-07, not asserted here.

test.describe('Loader / Spinner', () => {
  test.beforeEach(async ({ loaderPage }) => {
    await loaderPage.goto();
  });

  test('"Load metrics" shows a busy, disabled button and a status spinner', { tag: ['@smoke'], annotation: [tc('TC-LDR-001')] }, async ({ loaderPage: l }) => {
    await expect(l.trigger).toHaveText(LOADER.idle);
    await expect(l.trigger).toBeEnabled();
    await expect(l.spinner).toHaveCount(0);
    await expect(l.card).toHaveCount(0);

    await test.step('Press "Load metrics"', () => l.trigger.click());

    await expect(l.trigger).toHaveText(LOADER.busy);
    await expect(l.trigger).toBeDisabled();
    await expect(l.spinner).toHaveText(LOADER.spinner);
    await expect(l.spinner).toHaveAttribute('aria-live', 'polite');
    await expect(l.card).toHaveCount(0);
  });

  test('the metrics appear exactly after 1600 ms', { tag: ['@functional'], annotation: [tc('TC-LDR-002')] }, async ({ loaderPage: l }) => {
    await l.trigger.click();

    await test.step('Advance the clock to 1599 ms', () => l.advance(LOADER.delayMs - 1));

    await expect(l.spinner).toBeVisible();
    await expect(l.card).toHaveCount(0);

    await test.step('Advance the last millisecond', () => l.advance(1));

    await expect(l.card).toBeVisible();
    for (const m of LOADER.metrics) await expect(l.metric(m.label), m.label).toHaveText(m.value);
    await expect(l.spinner).toHaveCount(0);
    await expect(l.trigger).toHaveText(LOADER.idle);
    await expect(l.trigger).toBeEnabled();
  });

  test('loading again replaces the metrics with the spinner until the new result', { tag: ['@functional'], annotation: [tc('TC-LDR-003')] }, async ({ loaderPage: l }) => {
    await l.trigger.click();
    await l.advance(LOADER.delayMs);
    await expect(l.card).toBeVisible();

    await test.step('Press "Load metrics" again', () => l.trigger.click());

    await expect(l.card).toHaveCount(0);
    await expect(l.spinner).toBeVisible();

    await test.step('Advance 1600 ms', () => l.advance(LOADER.delayMs));

    await expect(l.card).toBeVisible();
    await expect(l.spinner).toHaveCount(0);
  });

  test('"Force error" shows the service error without metrics or spinner', { tag: ['@negative'], annotation: [tc('TC-LDR-004')] }, async ({ loaderPage: l }) => {
    await test.step('Press "Force error"', () => l.forceError.click());

    await expect(l.error).toHaveText(LOADER.error);
    await expect(l.card).toHaveCount(0);
    await expect(l.spinner).toHaveCount(0);
    await expect(l.trigger).toBeEnabled();
  });

  test('loading after an error clears the error and shows the metrics', { tag: ['@negative'], annotation: [tc('TC-LDR-005')] }, async ({ loaderPage: l }) => {
    await l.forceError.click();
    await expect(l.error).toBeVisible();

    await test.step('Press "Load metrics"', () => l.trigger.click());

    await expect(l.error).toHaveCount(0);
    await expect(l.spinner).toBeVisible();

    await test.step('Advance 1600 ms', () => l.advance(LOADER.delayMs));

    await expect(l.card).toBeVisible();
    await expect(l.error).toHaveCount(0);
  });

  test('"Force error" after loaded metrics replaces them with the error', { tag: ['@edge'], annotation: [tc('TC-LDR-006')] }, async ({ loaderPage: l }) => {
    await l.trigger.click();
    await l.advance(LOADER.delayMs);
    await expect(l.card).toBeVisible();

    await test.step('Press "Force error"', () => l.forceError.click());

    await expect(l.card).toHaveCount(0);
    await expect(l.error).toHaveText(LOADER.error);
  });
});
