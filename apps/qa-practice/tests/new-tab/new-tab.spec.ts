import { test, expect, tc } from '../../fixtures';
import { NEW_TAB } from '../../data/embed-dates.data';
import { NewTabPage } from '../../pages/embed.pages';

// Oracles come from the app source (NewTabWidget, data.tsx; the destination page, 3d14d23).
// The new tab belongs to the same browser context, so the Production Guard covers it too.
// The destination's document title is the site default, not its own metadata title: OBS-08.

test.describe('New Tab / Window', () => {
  test.beforeEach(async ({ newTabPage }) => {
    await newTabPage.goto();
  });

  test('the link opens the destination in a new tab without referrer', { tag: ['@smoke'], annotation: [tc('TC-NWT-001')] }, async ({ newTabPage: n }) => {
    await expect(n.link).toHaveAttribute('target', '_blank');
    await expect(n.link).toHaveAttribute('rel', 'noreferrer');
    await expect(n.link).toHaveAttribute('href', NewTabPage.destinationPath.replace(/\/$/, ''));
  });

  test('clicking opens the destination page in a second tab and keeps the module open', { tag: ['@smoke'], annotation: [tc('TC-NWT-002')] }, async ({ newTabPage: n, page }) => {
    const tab = await test.step('Click "Open destination ↗"', () => n.openDestination());

    await expect(tab).toHaveURL(new RegExp(`${NewTabPage.destinationPath}$`));
    await expect(tab.getByRole('heading', { level: 1, name: NEW_TAB.destinationHeading, exact: true })).toBeVisible();
    await expect(tab.getByText(NEW_TAB.eyebrow, { exact: true })).toBeVisible();
    await expect(page).toHaveURL(new RegExp(`${NewTabPage.path}$`));
    await expect(n.heading).toBeVisible();
    expect(page.context().pages(), 'module tab + destination tab').toHaveLength(2);
  });

  test('the new tab has no opener and no referrer (rel="noreferrer")', { tag: ['@edge'], annotation: [tc('TC-NWT-003')] }, async ({ newTabPage: n }) => {
    const tab = await test.step('Open the destination', () => n.openDestination());

    expect(await tab.evaluate(() => window.opener === null), 'window.opener is null').toBe(true);
    expect(await tab.evaluate(() => document.referrer), 'document.referrer').toBe('');
  });

  test('"Back to module" in the new tab returns that tab to the module', { tag: ['@functional'], annotation: [tc('TC-NWT-004')] }, async ({ newTabPage: n, page }) => {
    const tab = await n.openDestination();

    await test.step('Click "← Back to module" in the new tab', () => tab.getByRole('link', { name: NEW_TAB.back, exact: true }).click());

    await expect(tab).toHaveURL(new RegExp(`${NewTabPage.path}$`));
    await expect(tab.getByRole('heading', { level: 1, name: 'New Tab / Window', exact: true })).toBeVisible();
    await expect(page).toHaveURL(new RegExp(`${NewTabPage.path}$`));
    expect(page.context().pages(), 'no further tab was opened').toHaveLength(2);
  });
});
