import { test, expect, tc, bug } from '../../fixtures';
import { BUG_PLAYGROUND_PATH, PRODUCTS, SETTLED_MS } from '../../data/bug-playground.data';
import { control, expected, reproduce } from './support';

const [LATENCY] = PRODUCTS;

// Toast messages live for 420 ms; tests that read them freeze timers with page.clock
// (BugPlaygroundPage.goto({ freezeTimers: true }) installs and pauses it) so the check is deterministic.

test.describe('Bug Playground — misleading feedback defects', () => {
  test.describe('BUG-BP-08 shipping policy link does nothing', () => {
    test('reproduce: clicking it neither navigates nor opens anything', reproduce(tc('TC-BUG-008'), bug('BUG-BP-08')), async ({ bugPlaygroundPage: bp, page, context }) => {
      await bp.goto();
      const opened: string[] = [];
      page.on('dialog', (d) => {
        opened.push(`dialog:${d.type()}`);
        void d.dismiss();
      });
      context.on('page', (p) => opened.push(`page:${p.url()}`));

      await test.step('Click "Shipping policy"', () => bp.shippingPolicy.click());

      await expect(page).toHaveURL(new RegExp(`${BUG_PLAYGROUND_PATH}$`));
      await expect(page.getByRole('dialog')).toHaveCount(0);
      expect(opened, 'dialogs or pages opened').toEqual([]);
    });

    test.fail('expected: the link opens the shipping policy', expected(tc('TC-BUG-008'), bug('BUG-BP-08')), async ({ bugPlaygroundPage: bp, page, context }) => {
      await bp.goto();
      const before = page.url();

      await test.step('Click "Shipping policy"', () => bp.shippingPolicy.click());

      await expect
        .poll(async () => page.url() !== before || context.pages().length > 1 || (await page.getByRole('dialog').count()) > 0, { timeout: SETTLED_MS })
        .toBe(true);
    });
  });

  test.describe('BUG-BP-09 empty promo code reports success', () => {
    test('reproduce: Apply with no code says "applied"', reproduce(tc('TC-BUG-009'), bug('BUG-BP-09')), async ({ bugPlaygroundPage: bp }) => {
      await bp.goto({ freezeTimers: true });
      await expect(bp.promoInput).toHaveValue('');

      await test.step('Press "Apply" with an empty code', () => bp.promoApply.click());

      await expect(bp.toast).toHaveText('Promo code applied ✓');
    });

    test('control: an unknown non-empty code is rejected', control(tc('TC-BUG-009'), bug('BUG-BP-09')), async ({ bugPlaygroundPage: bp }) => {
      await bp.goto({ freezeTimers: true });

      await test.step('Enter "SAVE10" and press "Apply"', async () => {
        await bp.promoInput.fill('SAVE10');
        await bp.promoApply.click();
      });

      await expect(bp.toast).toHaveText('Code SAVE10 is not recognized');
    });

    test.fail('expected: an empty code shows no success message', expected(tc('TC-BUG-009'), bug('BUG-BP-09')), async ({ bugPlaygroundPage: bp }) => {
      await bp.goto({ freezeTimers: true });

      await test.step('Press "Apply" with an empty code', () => bp.promoApply.click());

      await expect(bp.toast).not.toHaveText(/applied/i, { timeout: SETTLED_MS });
    });
  });

  test.describe('BUG-BP-11 compare does nothing useful', () => {
    test('reproduce: Compare reports "Compare list cleared" and shows no comparison', reproduce(tc('TC-BUG-011'), bug('BUG-BP-11')), async ({ bugPlaygroundPage: bp }) => {
      await bp.goto({ freezeTimers: true });

      await test.step(`Press "Compare" for ${LATENCY.name}`, () => bp.catalog.compareButton(LATENCY.name).click());

      await expect(bp.toast).toHaveText('Compare list cleared');
      await expect(bp.app.getByText(/compar/i).filter({ hasText: LATENCY.name })).toHaveCount(0);
    });

    test.fail('expected: the product appears in a comparison', expected(tc('TC-BUG-011'), bug('BUG-BP-11')), async ({ bugPlaygroundPage: bp }) => {
      await bp.goto({ freezeTimers: true });

      await test.step(`Press "Compare" for ${LATENCY.name}`, () => bp.catalog.compareButton(LATENCY.name).click());

      await expect(bp.app.getByText(/compar/i).filter({ hasText: LATENCY.name })).toBeVisible({ timeout: SETTLED_MS });
    });
  });

  test.describe('BUG-BP-12 wishlist reports a save that does not happen', () => {
    test('reproduce: "Saved to wishlist" but the button state never changes, also after reload', reproduce(tc('TC-BUG-012'), bug('BUG-BP-12')), async ({ bugPlaygroundPage: bp, page }) => {
      await bp.goto({ freezeTimers: true });
      const heart = bp.catalog.wishlistButton(LATENCY.name);

      await test.step(`Press the wishlist button for ${LATENCY.name}`, () => heart.click());

      await expect(bp.toast).toHaveText('Saved to wishlist');
      await expect(heart).not.toHaveAttribute('aria-pressed', /.*/);
      await expect(heart).toHaveText('♡');

      await test.step('Reload the page', () => page.reload());

      await expect(bp.catalog.wishlistButton(LATENCY.name)).toHaveText('♡');
    });

    test.fail('expected: the wishlist toggle shows it is saved', expected(tc('TC-BUG-012'), bug('BUG-BP-12')), async ({ bugPlaygroundPage: bp }) => {
      await bp.goto();
      const heart = bp.catalog.wishlistButton(LATENCY.name);

      await test.step(`Press the wishlist button for ${LATENCY.name}`, () => heart.click());

      await expect(heart).toHaveAttribute('aria-pressed', 'true', { timeout: SETTLED_MS });
    });
  });

  test.describe('BUG-BP-15 chat shows online while agents are offline', () => {
    // The presence dot is a decorative, aria-hidden element: its colour class is the only signal.
    test('reproduce: green presence dot while the panel says all agents are offline', reproduce(tc('TC-BUG-015'), bug('BUG-BP-15')), async ({ bugPlaygroundPage: bp }) => {
      await bp.goto();

      await test.step('Open "Live chat"', () => bp.chatToggle.click());

      await expect(bp.chatPanel).toContainText('All agents are offline');
      await expect(bp.chatStatusDot).toHaveClass(/\bbg-emerald-400\b/);
    });

    test.fail('expected: the presence indicator matches the offline status', expected(tc('TC-BUG-015'), bug('BUG-BP-15')), async ({ bugPlaygroundPage: bp }) => {
      await bp.goto();

      await test.step('Open "Live chat"', () => bp.chatToggle.click());

      await expect(bp.chatPanel).toContainText('All agents are offline');
      await expect(bp.chatStatusDot).not.toHaveClass(/\bbg-emerald-\d+\b/, { timeout: SETTLED_MS });
    });
  });
});
