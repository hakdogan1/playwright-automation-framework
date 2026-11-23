import { expect, type Locator, type Page } from '@playwright/test';
import { waitForHydration } from './ready';

/**
 * Opens a QA Practice module page and waits until it is usable:
 * the module heading is visible and React owns the given element.
 * A plain function (composition), not a base class.
 */
export async function openModule(page: Page, module: { path: string; heading: Locator; ready: Locator }): Promise<void> {
  await page.goto(module.path);
  await expect(module.heading).toBeVisible();
  await waitForHydration(module.ready);
}

export function moduleHeading(page: Page, title: string): Locator {
  return page.getByRole('heading', { level: 1, name: title, exact: true });
}
