import { test, expect, tc } from '../../fixtures';
import { INFINITE } from '../../data/async-overlays.data';

// Oracles come from the app source (InfiniteScrollWidget, async.tsx, 3d14d23). The fake clock is
// installed and paused by goto(), so only advance() moves the 350 ms load delay.
// scrollToGap() resolves after the browser dispatched the scroll event, so the app has handled it.
// "No load" is proven by the item count after a later, single positive load (it would be higher).

const { pageSize, total, delayMs, thresholdPx } = INFINITE;

test.describe('Infinite Scroll', () => {
  test.beforeEach(async ({ infiniteScrollPage }) => {
    await infiniteScrollPage.goto();
  });

  test('the first page shows 12 items and no loader', { tag: ['@smoke'], annotation: [tc('TC-INF-001')] }, async ({ infiniteScrollPage: s }) => {
    await expect(s.items).toHaveCount(pageSize);
    await expect(s.item(0)).toHaveText(INFINITE.item(0));
    await expect(s.item(pageSize - 1)).toHaveText(INFINITE.item(pageSize - 1));
    await expect(s.loader).toHaveCount(0);
    await expect(s.end).toHaveCount(0);
  });

  test('scrolling to the bottom shows the loader and appends the next 12 items after 350 ms', { tag: ['@smoke'], annotation: [tc('TC-INF-002')] }, async ({ infiniteScrollPage: s }) => {
    await test.step('Scroll to the bottom of the list', () => s.scrollToGap(0));

    await expect(s.loader).toHaveText(INFINITE.loader);

    await test.step('Advance the clock to 349 ms', () => s.advance(delayMs - 1));

    await expect(s.loader).toBeVisible();
    await expect(s.items).toHaveCount(pageSize);

    await test.step('Advance the last millisecond', () => s.advance(1));

    await expect(s.items).toHaveCount(2 * pageSize);
    await expect(s.item(2 * pageSize - 1)).toHaveText(INFINITE.item(2 * pageSize - 1));
    await expect(s.loader).toHaveCount(0);
  });

  test('loading continues to 60 items and then shows "End of stream"', { tag: ['@functional'], annotation: [tc('TC-INF-003')] }, async ({ infiniteScrollPage: s }) => {
    for (let loaded = 2 * pageSize; loaded <= total; loaded += pageSize) {
      await test.step(`Scroll to the bottom and load up to ${loaded} items`, async () => {
        await s.scrollToGap(0);
        await expect(s.loader).toBeVisible();
        await s.advance(delayMs);
        await expect(s.items).toHaveCount(loaded);
      });
    }

    await expect(s.item(total - 1)).toHaveText(INFINITE.item(total - 1));
    await expect(s.end).toBeVisible();
  });

  test('a load starts at 24 px from the bottom, not at 25 px', { tag: ['@edge'], annotation: [tc('TC-INF-004')] }, async ({ infiniteScrollPage: s }) => {
    await test.step(`Scroll to ${thresholdPx + 1} px above the bottom and wait ${delayMs} ms`, async () => {
      await s.scrollToGap(thresholdPx + 1);
      await s.advance(delayMs);
    });

    await test.step(`Scroll to ${thresholdPx} px above the bottom`, () => s.scrollToGap(thresholdPx));

    await expect(s.loader).toBeVisible();
    await s.advance(delayMs);
    // A load at 25 px would have added 12 items, and the 24 px scroll another 12 (36).
    await expect(s.items).toHaveCount(2 * pageSize);
  });

  test('scrolling again while a page is loading does not load twice', { tag: ['@negative'], annotation: [tc('TC-INF-005')] }, async ({ infiniteScrollPage: s }) => {
    await s.scrollToGap(0);
    await expect(s.loader).toBeVisible();

    await test.step('Scroll up and back to the bottom while loading', async () => {
      await s.scrollToGap(100);
      await s.scrollToGap(0);
    });

    await s.advance(delayMs);
    await expect(s.items).toHaveCount(2 * pageSize);
    await expect(s.loader).toHaveCount(0);
  });

  test('after the end of the stream, scrolling loads nothing more', { tag: ['@edge'], annotation: [tc('TC-INF-006')] }, async ({ infiniteScrollPage: s }) => {
    for (let loaded = 2 * pageSize; loaded <= total; loaded += pageSize) {
      await s.scrollToGap(0);
      await expect(s.loader).toBeVisible();
      await s.advance(delayMs);
      await expect(s.items).toHaveCount(loaded);
    }
    await expect(s.end).toBeVisible();

    await test.step('Scroll up and back to the bottom, then wait', async () => {
      await s.scrollToGap(100);
      await s.scrollToGap(0);
      await s.advance(delayMs * 3);
    });

    await expect(s.loader).toHaveCount(0);
    await expect(s.items).toHaveCount(total);
    await expect(s.end).toBeVisible();
  });
});
