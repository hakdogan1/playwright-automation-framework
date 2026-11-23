import { test, expect, tc } from '../../fixtures';
import { PAGE_SIZE, TOTAL_RECORDS, expectedRecord } from '../../data/ui-modules.data';

const TOTAL_PAGES = TOTAL_RECORDS / PAGE_SIZE;
const idsOnPage = (page: number) => Array.from({ length: PAGE_SIZE }, (_, i) => (page - 1) * PAGE_SIZE + i + 1);

test.describe('Pagination', () => {
  test.beforeEach(async ({ paginationPage }) => {
    await paginationPage.goto();
  });

  test('the first page shows records 1–5 and Previous is disabled', { tag: ['@smoke'], annotation: [tc('TC-PAG-001')] }, async ({ paginationPage: pagination }) => {
    await expect(pagination.currentPage).toHaveText(`Page 1 of ${TOTAL_PAGES}`);
    await expect(pagination.records).toHaveText(idsOnPage(1).map((id) => expectedRecord(id).text));
    await expect(pagination.visibleRange).toHaveText(`Showing records 1–5 of ${TOTAL_RECORDS}`);
    await expect(pagination.paginator.previous).toBeDisabled();
    await expect(pagination.paginator.next).toBeEnabled();
    await expect(pagination.paginator.current).toHaveText('1');
  });

  test('Next moves to page 2 and Previous returns', { tag: ['@functional'], annotation: [tc('TC-PAG-002')] }, async ({ paginationPage: pagination }) => {
    await test.step('Press "Next"', () => pagination.paginator.next.click());

    await expect(pagination.currentPage).toHaveText(`Page 2 of ${TOTAL_PAGES}`);
    await expect(pagination.records).toHaveText(idsOnPage(2).map((id) => expectedRecord(id).text));
    await expect(pagination.visibleRange).toHaveText(`Showing records 6–10 of ${TOTAL_RECORDS}`);

    await test.step('Press "Previous"', () => pagination.paginator.previous.click());

    await expect(pagination.currentPage).toHaveText(`Page 1 of ${TOTAL_PAGES}`);
  });

  test('the last page shows the final records and disables Next', { tag: ['@edge'], annotation: [tc('TC-PAG-003')] }, async ({ paginationPage: pagination }) => {
    await test.step(`Press page "${TOTAL_PAGES}"`, () => pagination.paginator.buttonFor(TOTAL_PAGES).click());

    await expect(pagination.currentPage).toHaveText(`Page ${TOTAL_PAGES} of ${TOTAL_PAGES}`);
    await expect(pagination.records).toHaveText(idsOnPage(TOTAL_PAGES).map((id) => expectedRecord(id).text));
    await expect(pagination.visibleRange).toHaveText(`Showing records 11–15 of ${TOTAL_RECORDS}`);
    await expect(pagination.paginator.next).toBeDisabled();
    await expect(pagination.paginator.current).toHaveText(String(TOTAL_PAGES));
  });

  test('page buttons jump directly and mark the current page', { tag: ['@functional'], annotation: [tc('TC-PAG-004')] }, async ({ paginationPage: pagination }) => {
    for (const n of [3, 1, 2]) {
      await test.step(`Press page "${n}"`, () => pagination.paginator.buttonFor(n).click());

      await expect(pagination.paginator.current).toHaveText(String(n));
      await expect(pagination.records.first()).toHaveText(expectedRecord(idsOnPage(n)[0] ?? 1).text);
    }
  });

  test('record statuses follow the data set (every third record is Ready)', { tag: ['@edge'], annotation: [tc('TC-PAG-005')] }, async ({ paginationPage: pagination }) => {
    for (const id of idsOnPage(1)) {
      await expect(pagination.records.nth(id - 1)).toContainText(expectedRecord(id).status);
    }
  });

  test('boundary controls: Previous only disabled on the first page, Next only on the last', { tag: ['@negative'], annotation: [tc('TC-PAG-006')] }, async ({ paginationPage: pagination }) => {
    const expected = [
      { page: 1, previous: false, next: true },
      { page: 2, previous: true, next: true },
      { page: TOTAL_PAGES, previous: true, next: false },
    ];
    for (const e of expected) {
      await test.step(`Go to page ${e.page}`, () => pagination.paginator.buttonFor(e.page).click());

      await expect(pagination.paginator.previous).toBeEnabled({ enabled: e.previous });
      await expect(pagination.paginator.next).toBeEnabled({ enabled: e.next });
    }
  });
});
