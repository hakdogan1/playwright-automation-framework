import { test, expect, tc } from '../../fixtures';
import { ACCORDION_SECTIONS } from '../../data/ui-modules.data';

const [ACCOUNT, PRIVACY] = ACCORDION_SECTIONS;

test.describe('Accordions', () => {
  test.beforeEach(async ({ accordionsPage }) => {
    await accordionsPage.goto();
  });

  test('Account is expanded by default, the others collapsed', { tag: ['@smoke'], annotation: [tc('TC-ACC-001')] }, async ({ accordionsPage }) => {
    const { accordion } = accordionsPage;
    await expect(accordion.headers).toHaveText(ACCORDION_SECTIONS.map((s) => new RegExp(`^${s.label}`)));
    await expect(accordion.header('Account')).toHaveAttribute('aria-expanded', 'true');
    await expect(accordion.header('Privacy')).toHaveAttribute('aria-expanded', 'false');
    await expect(accordion.header('Billing')).toHaveAttribute('aria-expanded', 'false');
    await expect(await accordion.panelFor('Account')).toHaveText(ACCOUNT.body);
  });

  test('opening a section closes the previously open one', { tag: ['@functional'], annotation: [tc('TC-ACC-002')] }, async ({ accordionsPage }) => {
    const { accordion } = accordionsPage;

    await test.step('Click "Privacy"', () => accordion.header('Privacy').click());

    await expect(accordion.header('Privacy')).toHaveAttribute('aria-expanded', 'true');
    await expect(await accordion.panelFor('Privacy')).toHaveText(PRIVACY.body);
    await expect(accordion.header('Account')).toHaveAttribute('aria-expanded', 'false');
    await expect(await accordion.panelFor('Account')).toHaveCount(0);
  });

  test('clicking the open section collapses it', { tag: ['@negative'], annotation: [tc('TC-ACC-003')] }, async ({ accordionsPage }) => {
    const { accordion } = accordionsPage;

    await test.step('Click "Account" (already open)', () => accordion.header('Account').click());

    await expect(accordion.header('Account')).toHaveAttribute('aria-expanded', 'false');
    await expect(await accordion.panelFor('Account')).toHaveCount(0);
    for (const s of ACCORDION_SECTIONS) await expect(accordion.header(s.label)).toHaveAttribute('aria-expanded', 'false');
  });

  test('each header controls exactly its own panel', { tag: ['@edge'], annotation: [tc('TC-ACC-004')] }, async ({ accordionsPage }) => {
    const { accordion } = accordionsPage;
    for (const section of ACCORDION_SECTIONS.slice(1)) {
      await test.step(`Open "${section.label}"`, () => accordion.header(section.label).click());

      const panel = await accordion.panelFor(section.label);
      await expect(panel).toBeVisible();
      await expect(panel).toHaveText(section.body);
    }
  });
});
