import { expect, type Locator } from '@playwright/test';

/**
 * QA Practice is a statically exported React app: buttons exist in the HTML
 * before React attaches event handlers. Interacting before hydration is a
 * classic source of flaky tests, so page objects wait for React to own the
 * element. Readiness is a precondition, not a test assertion.
 */
export async function waitForHydration(locator: Locator): Promise<void> {
  await expect
    .poll(() => locator.evaluate((el) => Object.keys(el).some((key) => key.startsWith('__reactProps$'))), {
      message: 'React hydration of the practice widget',
      timeout: 10_000,
    })
    .toBe(true);
}
