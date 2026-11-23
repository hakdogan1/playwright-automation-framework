import { test, expect, tc } from '../../fixtures';
import { COUNTRIES, QA_TOOLS } from '../../data/dropdowns.data';

test.describe('Dropdowns — native select', () => {
  test.beforeEach(async ({ nativeSelectPage }) => {
    await nativeSelectPage.goto();
  });

  test('defaults to Playwright and lists exactly the supported tools', { tag: ['@smoke'], annotation: [tc('TC-DDL-001')] }, async ({ nativeSelectPage }) => {
    await expect(nativeSelectPage.select).toHaveValue('playwright');
    await expect(nativeSelectPage.summary).toHaveText('Tool: Playwright');
    await expect(nativeSelectPage.select.getByRole('option')).toHaveText([...QA_TOOLS]);
  });

  for (const tool of QA_TOOLS) {
    test(`selecting "${tool}" updates the summary`, { tag: ['@functional'], annotation: [tc('TC-DDL-002')] }, async ({ nativeSelectPage }) => {
      await test.step(`Select "${tool}"`, () => nativeSelectPage.select.selectOption({ label: tool }));

      await expect(nativeSelectPage.summary).toHaveText(`Tool: ${tool}`);
    });
  }
});

test.describe('Dropdowns — searchable select', () => {
  test.beforeEach(async ({ searchableSelectPage }) => {
    await searchableSelectPage.goto();
  });

  test('focusing the field lists every country and nothing is selected', { tag: ['@smoke'], annotation: [tc('TC-DDL-003')] }, async ({ searchableSelectPage }) => {
    const { country, selected } = searchableSelectPage;
    await expect(selected).toHaveText('Selected: —');

    await test.step('Focus the Country field', () => country.input.focus());

    await expect(country.listbox).toBeVisible();
    await expect(country.options).toHaveCount(COUNTRIES.length);
  });

  test('typing filters the list and clicking an option selects it', { tag: ['@functional'], annotation: [tc('TC-DDL-004')] }, async ({ searchableSelectPage }) => {
    const { country, selected } = searchableSelectPage;

    await test.step('Type "ger"', () => country.search('ger'));

    await expect(country.options).toHaveCount(1);
    await expect(country.option('Germany')).toBeVisible();

    await test.step('Click "Germany"', () => country.choose('Germany'));

    await expect(selected).toHaveText('Selected: Germany');
    await expect(country.input).toHaveValue('Germany');
    await expect(country.listbox).toBeHidden();
  });

  test('a search with no match shows the empty state', { tag: ['@negative'], annotation: [tc('TC-DDL-005')] }, async ({ searchableSelectPage }) => {
    const { country, selected } = searchableSelectPage;

    await test.step('Type "zzz"', () => country.search('zzz'));

    await expect(country.emptyState).toBeVisible();
    await expect(country.options).toHaveCount(0);
    await expect(selected).toHaveText('Selected: —');
  });

  test('keyboard: ArrowDown + Enter selects the highlighted option', { tag: ['@functional'], annotation: [tc('TC-DDL-006')] }, async ({ searchableSelectPage }) => {
    const { country, selected } = searchableSelectPage;

    await test.step('Focus the field, press ArrowDown, then Enter', async () => {
      await country.input.focus();
      await expect(country.listbox).toBeVisible();
      await country.input.press('ArrowDown');
      await expect(country.option(COUNTRIES[1])).toHaveAttribute('aria-selected', 'true');
      await country.input.press('Enter');
    });

    await expect(selected).toHaveText(`Selected: ${COUNTRIES[1]}`);
    await expect(country.listbox).toBeHidden();
  });

  test('search ignores case and diacritics', { tag: ['@edge'], annotation: [tc('TC-DDL-007')] }, async ({ searchableSelectPage }) => {
    const { country } = searchableSelectPage;

    await test.step('Type "TÜRK"', () => country.search('TÜRK'));

    await expect(country.options).toHaveCount(1);
    await expect(country.option('Turkey')).toBeVisible();
  });

  test('clear resets the selection and Escape closes the list', { tag: ['@functional'], annotation: [tc('TC-DDL-008')] }, async ({ searchableSelectPage }) => {
    const { country, selected } = searchableSelectPage;

    await test.step('Select "Japan"', async () => {
      await country.search('Japan');
      await country.choose('Japan');
    });

    await expect(selected).toHaveText('Selected: Japan');

    await test.step('Press the clear button', () => country.clearButton.click());

    await expect(selected).toHaveText('Selected: —');
    await expect(country.input).toHaveValue('');
    await expect(country.listbox).toBeVisible();

    await test.step('Press Escape', () => country.input.press('Escape'));

    await expect(country.listbox).toBeHidden();
  });
});
