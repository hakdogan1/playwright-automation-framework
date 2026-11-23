import { test, expect, tc, bug } from '../../fixtures';
import { PRODUCTS, SETTLED_MS } from '../../data/bug-playground.data';
import { expected, reproduce } from './support';

const [LATENCY, SPLITTER] = PRODUCTS;

test.describe('Bug Playground — cart defects', () => {
  test.describe('BUG-BP-01 add to cart duplicates on rapid double activation', () => {
    test('reproduce: a double-click adds two units', reproduce(tc('TC-BUG-001'), bug('BUG-BP-01')), async ({ bugPlaygroundPage: bp }) => {
      await bp.goto();

      await test.step(`Double-click "Add to cart" for ${LATENCY.name}`, () => bp.catalog.addButton(LATENCY.name).dblclick());

      await expect(bp.cart.quantity(LATENCY.name)).toHaveText('2');
    });

    test.fail('expected: a rapid double activation adds one unit', expected(tc('TC-BUG-001'), bug('BUG-BP-01')), async ({ bugPlaygroundPage: bp }) => {
      await bp.goto();

      await test.step(`Double-click "Add to cart" for ${LATENCY.name}`, () => bp.catalog.addButton(LATENCY.name).dblclick());

      await expect(bp.cart.quantity(LATENCY.name)).toHaveText('1', { timeout: SETTLED_MS });
    });
  });

  test.describe('BUG-BP-03 cart total shows floating-point noise', () => {
    test('reproduce: 12.34 + 7.65 renders 19.990000000000002', reproduce(tc('TC-BUG-003'), bug('BUG-BP-03')), async ({ bugPlaygroundPage: bp }) => {
      await bp.goto();

      await test.step(`Add ${LATENCY.name} and ${SPLITTER.name}`, async () => {
        await bp.catalog.addButton(LATENCY.name).click();
        await bp.catalog.addButton(SPLITTER.name).click();
      });

      await expect(bp.cart.lines).toHaveCount(2);
      await expect(bp.cart.total).toHaveText('19.990000000000002');
    });

    test.fail('expected: the total is rounded to cents', expected(tc('TC-BUG-003'), bug('BUG-BP-03')), async ({ bugPlaygroundPage: bp }) => {
      await bp.goto();

      await test.step(`Add ${LATENCY.name} and ${SPLITTER.name}`, async () => {
        await bp.catalog.addButton(LATENCY.name).click();
        await bp.catalog.addButton(SPLITTER.name).click();
      });

      await expect(bp.cart.total).toHaveText(/^\$?19\.99$/, { timeout: SETTLED_MS });
    });
  });

  test.describe('BUG-BP-06 cart accepts zero and negative quantities', () => {
    test('reproduce: decreasing below 1 shows -1 and the total ignores the line', reproduce(tc('TC-BUG-006'), bug('BUG-BP-06')), async ({ bugPlaygroundPage: bp }) => {
      await bp.goto();

      await test.step(`Add ${LATENCY.name}, then press "decrease" twice`, async () => {
        await bp.catalog.addButton(LATENCY.name).click();
        await expect(bp.cart.quantity(LATENCY.name)).toHaveText('1');
        await bp.cart.decrease(LATENCY.name).click();
        await bp.cart.decrease(LATENCY.name).click();
      });

      await expect(bp.cart.quantity(LATENCY.name)).toHaveText('-1');
      await expect(bp.cart.line(LATENCY.name)).toBeVisible();
      await expect(bp.cart.total).toHaveText('0');
    });

    test.fail('expected: quantity never goes below 1 (or the line is removed)', expected(tc('TC-BUG-006'), bug('BUG-BP-06')), async ({ bugPlaygroundPage: bp }) => {
      await bp.goto();

      await test.step(`Add ${LATENCY.name}, then press "decrease" twice`, async () => {
        await bp.catalog.addButton(LATENCY.name).click();
        await expect(bp.cart.quantity(LATENCY.name)).toHaveText('1');
        await bp.cart.decrease(LATENCY.name).click();
        await bp.cart.decrease(LATENCY.name).click();
      });

      await expect(bp.cart.quantity(LATENCY.name).filter({ hasText: /^(0|-\d+)$/ })).toHaveCount(0, { timeout: SETTLED_MS });
    });
  });
});
