import { test, expect, tc } from '../../fixtures';
import { TABS } from '../../data/ui-modules.data';

test.describe('Tabs', () => {
  test('Overview is active on load', { tag: ['@smoke'], annotation: [tc('TC-TAB-001')] }, async ({ tabsPage }) => {
    await tabsPage.goto();
    await expect(tabsPage.tabs.tabs).toHaveText(TABS.map((t) => t.label));
    await expect(tabsPage.tabs.tab('Overview')).toHaveAttribute('aria-selected', 'true');
    await expect(tabsPage.tabs.panel).toContainText(TABS[0].body);
  });

  for (const tab of TABS.slice(1)) {
    test(`selecting ${tab.label} shows its panel and updates the URL hash`, { tag: ['@functional'], annotation: [tc('TC-TAB-002')] }, async ({ tabsPage, page }) => {
      await tabsPage.goto();

      await test.step(`Click the "${tab.label}" tab`, () => tabsPage.tabs.tab(tab.label).click());

      await expect(tabsPage.tabs.tab(tab.label)).toHaveAttribute('aria-selected', 'true');
      await expect(tabsPage.tabs.tab('Overview')).toHaveAttribute('aria-selected', 'false');
      await expect(tabsPage.tabs.panel).toContainText(tab.body);
      await expect(page).toHaveURL(new RegExp(`#${tab.id}$`));
    });
  }

  test('a deep link with a hash opens that tab', { tag: ['@functional'], annotation: [tc('TC-TAB-003')] }, async ({ tabsPage }) => {
    await test.step('Open the page with #settings', () => tabsPage.goto('#settings'));

    await expect(tabsPage.tabs.tab('Settings')).toHaveAttribute('aria-selected', 'true');
    await expect(tabsPage.tabs.panel).toContainText(TABS[2].body);
  });

  test('an unknown hash falls back to Overview', { tag: ['@negative'], annotation: [tc('TC-TAB-004')] }, async ({ tabsPage }) => {
    await test.step('Open the page with #does-not-exist', () => tabsPage.goto('#does-not-exist'));

    await expect(tabsPage.tabs.tab('Overview')).toHaveAttribute('aria-selected', 'true');
    await expect(tabsPage.tabs.panel).toContainText(TABS[0].body);
  });

  test('a focused tab is activated with Enter', { tag: ['@edge'], annotation: [tc('TC-TAB-005')] }, async ({ tabsPage }) => {
    await tabsPage.goto();

    await test.step('Focus the "Logs" tab and press Enter', async () => {
      await tabsPage.tabs.tab('Logs').focus();
      await tabsPage.tabs.tab('Logs').press('Enter');
    });

    await expect(tabsPage.tabs.tab('Logs')).toHaveAttribute('aria-selected', 'true');
    await expect(tabsPage.tabs.panel).toContainText(TABS[1].body);
  });
});
