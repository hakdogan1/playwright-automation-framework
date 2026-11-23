import { test, expect, tc, bug } from '../../fixtures';
import { PRODUCTS, SETTLED_MS } from '../../data/bug-playground.data';
import { control, expected, isCatalogRequest, reproduce } from './support';

const [LATENCY, SPLITTER, SNIFFER] = PRODUCTS;
const catalogOrder = PRODUCTS.map((p) => p.name);

test.describe('Bug Playground — catalog defects', () => {
  test.describe('BUG-BP-02 search is case-sensitive', () => {
    test('reproduce: a lower-case query hides a matching product', reproduce(tc('TC-BUG-002'), bug('BUG-BP-02')), async ({ bugPlaygroundPage: bp }) => {
      await bp.goto();

      await test.step(`Search "${SPLITTER.name}" (exact case)`, () => bp.catalog.search.fill(SPLITTER.name));

      await expect(bp.catalog.names).toHaveText([SPLITTER.name]);

      await test.step(`Search "${SPLITTER.name.toLowerCase()}"`, () => bp.catalog.search.fill(SPLITTER.name.toLowerCase()));

      await expect(bp.catalog.rows).toHaveCount(0);
      await expect(bp.catalog.emptyState).toBeVisible();
    });

    test.fail('expected: search ignores letter case', expected(tc('TC-BUG-002'), bug('BUG-BP-02')), async ({ bugPlaygroundPage: bp }) => {
      await bp.goto();

      await test.step(`Search "${SPLITTER.name.toLowerCase()}"`, () => bp.catalog.search.fill(SPLITTER.name.toLowerCase()));

      await expect(bp.catalog.names).toHaveText([SPLITTER.name], { timeout: SETTLED_MS });
    });
  });

  test.describe('BUG-BP-05 product count is stale after a category change', () => {
    test('reproduce: Kits shows one product but the count stays 3', reproduce(tc('TC-BUG-005'), bug('BUG-BP-05')), async ({ bugPlaygroundPage: bp }) => {
      await bp.goto();
      await expect(bp.catalog.count).toHaveText('3');

      await test.step('Select category "Kits"', () => bp.catalog.category.selectOption({ label: 'Kits' }));

      await expect(bp.catalog.names).toHaveText([LATENCY.name]);
      await expect(bp.catalog.count).toHaveText('3');
    });

    test.fail('expected: the count matches the visible products', expected(tc('TC-BUG-005'), bug('BUG-BP-05')), async ({ bugPlaygroundPage: bp }) => {
      await bp.goto();

      await test.step('Select category "Kits"', () => bp.catalog.category.selectOption({ label: 'Kits' }));

      await expect(bp.catalog.count).toHaveText('1', { timeout: SETTLED_MS });
    });
  });

  test.describe('BUG-BP-13 sort control does not reorder products', () => {
    test('reproduce: "Price · high → low" leaves catalog order', reproduce(tc('TC-BUG-013'), bug('BUG-BP-13')), async ({ bugPlaygroundPage: bp }) => {
      await bp.goto();
      await expect(bp.catalog.names).toHaveText(catalogOrder);

      await test.step('Select "Price · high → low"', () => bp.catalog.sort.selectOption({ label: 'Price · high → low' }));

      await expect(bp.catalog.sort).toHaveValue('price-desc');
      await expect(bp.catalog.names).toHaveText(catalogOrder);
    });

    test.fail('expected: products are ordered by price, high to low', expected(tc('TC-BUG-013'), bug('BUG-BP-13')), async ({ bugPlaygroundPage: bp }) => {
      await bp.goto();

      await test.step('Select "Price · high → low"', () => bp.catalog.sort.selectOption({ label: 'Price · high → low' }));

      const byPriceDesc = [...PRODUCTS].sort((a, b) => b.price - a.price).map((p) => p.name);
      await expect(bp.catalog.names).toHaveText(byPriceDesc, { timeout: SETTLED_MS });
    });
  });

  test.describe('BUG-BP-14 refresh claims new prices without fetching data', () => {
    test('reproduce: the label says refreshed, prices are identical and no request is made', reproduce(tc('TC-BUG-014'), bug('BUG-BP-14')), async ({ bugPlaygroundPage: bp, page }) => {
      await bp.goto();
      const before = await bp.catalog.priceLines().allTextContents();
      const requests: string[] = [];
      page.on('request', (r) => {
        if (isCatalogRequest(r, new URL(page.url()).origin)) requests.push(r.url());
      });

      await test.step('Press "Refresh prices"', () => bp.catalog.refresh.click());

      await expect(bp.catalog.syncLabel).toHaveText('Prices refreshed · just now');
      await expect(bp.catalog.priceLines()).toHaveText(before);
      expect(requests, 'catalog requests made by Refresh').toEqual([]);
    });

    test.fail('expected: refreshing requests current prices', expected(tc('TC-BUG-014'), bug('BUG-BP-14')), async ({ bugPlaygroundPage: bp, page }) => {
      await bp.goto();
      const appOrigin = new URL(page.url()).origin;
      const request = page.waitForRequest((r) => isCatalogRequest(r, appOrigin), { timeout: SETTLED_MS });

      await test.step('Press "Refresh prices"', () => bp.catalog.refresh.click());

      const dataRequest = await request;
      expect(isCatalogRequest(dataRequest, appOrigin), dataRequest.url()).toBe(true);
    });
  });

  test('control: catalog prices and categories render as defined', control(tc('TC-BUG-013'), bug('BUG-BP-13')), async ({ bugPlaygroundPage: bp }) => {
    // Guards the oracles above: if the catalog data changes, these tests need review, not the bugs.
    await bp.goto();
    await expect(bp.catalog.names).toHaveText(catalogOrder);
    await expect(bp.catalog.priceLines()).toHaveText(PRODUCTS.map((p) => `${p.category} · USD ${p.price.toFixed(2)}`));
    expect(SNIFFER.price).toBeGreaterThan(LATENCY.price);
  });
});
