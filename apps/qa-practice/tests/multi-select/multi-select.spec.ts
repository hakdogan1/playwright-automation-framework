import { test, expect, tc } from '../../fixtures';
import { SKILLS } from '../../data/ui-modules.data';

/** Chip text is the label followed by a "×" remove button. */
const chip = (label: string) => new RegExp(`^${label}\\s*×$`);

test.describe('Multi Select', () => {
  test.beforeEach(async ({ multiSelectPage }) => {
    await multiSelectPage.goto();
  });

  test('every skill is offered and nothing is picked', { tag: ['@smoke'], annotation: [tc('TC-MSL-001')] }, async ({ multiSelectPage }) => {
    await expect(multiSelectPage.options).toHaveText(SKILLS.map((s) => s.label));
    await expect(multiSelectPage.chips).toHaveCount(0);
    await expect(multiSelectPage.emptyState).toBeVisible();
  });

  test('picked skills appear as chips in pick order', { tag: ['@functional'], annotation: [tc('TC-MSL-002')] }, async ({ multiSelectPage }) => {
    await test.step('Pick "Playwright", then "k6"', async () => {
      await multiSelectPage.option('Playwright').click();
      await multiSelectPage.option('k6').click();
    });

    await expect(multiSelectPage.chips).toHaveText([chip('Playwright'), chip('k6')]);
    await expect(multiSelectPage.emptyState).toBeHidden();
  });

  test('clicking a picked option again removes it', { tag: ['@functional'], annotation: [tc('TC-MSL-003')] }, async ({ multiSelectPage }) => {
    await test.step('Pick "Cypress" and "Postman", then click "Cypress" again', async () => {
      await multiSelectPage.option('Cypress').click();
      await multiSelectPage.option('Postman').click();
      await multiSelectPage.option('Cypress').click();
    });

    await expect(multiSelectPage.chips).toHaveText([chip('Postman')]);
  });

  test('the chip × button removes a skill and the empty state returns', { tag: ['@negative'], annotation: [tc('TC-MSL-004')] }, async ({ multiSelectPage }) => {
    await test.step('Pick "Selenium", then press its × button', async () => {
      await multiSelectPage.option('Selenium').click();
      await multiSelectPage.removeButton('selenium').click();
    });

    await expect(multiSelectPage.chips).toHaveCount(0);
    await expect(multiSelectPage.emptyState).toBeVisible();
  });

  test('all skills can be picked at once', { tag: ['@edge'], annotation: [tc('TC-MSL-005')] }, async ({ multiSelectPage }) => {
    const reversed = [...SKILLS].reverse();
    for (const skill of reversed) {
      await test.step(`Pick "${skill.label}"`, () => multiSelectPage.option(skill.label).click());
    }
    await expect(multiSelectPage.chips).toHaveText(reversed.map((s) => chip(s.label)));
  });
});
