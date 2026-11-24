import { test, expect, tc } from '../../fixtures';
import { SHADOW } from '../../data/embed-dates.data';

// Oracles come from the app source (ShadowDomWidget, data.tsx, 3d14d23): an open shadow root
// attached once in an effect, with a native button and a counter.

test.describe('Shadow DOM', () => {
  test.beforeEach(async ({ shadowDomPage }) => {
    await shadowDomPage.goto();
  });

  test('the button and the counter inside the shadow root are reachable', { tag: ['@smoke'], annotation: [tc('TC-SHD-001')] }, async ({ shadowDomPage: s }) => {
    await expect(s.button).toBeVisible();
    await expect(s.button).toBeEnabled();
    await expect(s.counter).toHaveText(SHADOW.counter(0));
  });

  test('each click increments the counter', { tag: ['@functional'], annotation: [tc('TC-SHD-002')] }, async ({ shadowDomPage: s }) => {
    for (const n of [1, 2, 3]) {
      await test.step(`Click ${n}`, () => s.button.click());

      await expect(s.counter).toHaveText(SHADOW.counter(n));
    }
  });

  test('the keyboard activates the shadow button too', { tag: ['@functional'], annotation: [tc('TC-SHD-003')] }, async ({ shadowDomPage: s }) => {
    await test.step('Focus the button and press Enter, then Space', async () => {
      await s.button.focus();
      await s.button.press('Enter');
      await s.button.press(' ');
    });

    await expect(s.counter).toHaveText(SHADOW.counter(2));
  });

  test('the elements live only in one open shadow root, not in the light DOM', { tag: ['@edge'], annotation: [tc('TC-SHD-004')] }, async ({ shadowDomPage: s, page }) => {
    expect(await page.evaluate(() => document.querySelectorAll('[data-testid="shadow-button"], [data-testid="shadow-counter"]').length), 'light DOM matches').toBe(0);
    expect(await s.host.evaluate((el) => el.shadowRoot?.mode), 'shadow root mode').toBe('open');
    expect(await s.host.evaluate((el) => el.shadowRoot?.querySelectorAll('button').length), 'buttons in the shadow root').toBe(1);
    await expect(s.button).toHaveCount(1);
  });
});
