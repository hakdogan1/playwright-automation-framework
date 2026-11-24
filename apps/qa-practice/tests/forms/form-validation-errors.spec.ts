import { test, expect, tc } from '../../fixtures';
import { VALIDATION_CASES, VALIDATION_IDLE } from '../../data/form-lab.data';

// Oracles come from the app source (ValidationErrorsLab, form-lab.tsx, 3d14d23): nine canned
// negative results, no form fields and no timers.

test.describe('Validation Errors', () => {
  test.beforeEach(async ({ validationErrorsPage }) => {
    await validationErrorsPage.goto();
  });

  test('nine scenario buttons and an idle result on load', { tag: ['@smoke'], annotation: [tc('TC-VER-001')] }, async ({ validationErrorsPage: v }) => {
    for (const c of VALIDATION_CASES) await expect(v.trigger(c.id), c.id).toHaveText(c.label);
    await expect(v.result).toHaveAttribute('data-state', 'idle');
    await expect(v.message).toHaveText(VALIDATION_IDLE);
    await expect(v.errors).toHaveCount(0);
  });

  for (const c of VALIDATION_CASES) {
    test(`"${c.label}" shows its error`, { tag: ['@negative'], annotation: [tc('TC-VER-002')] }, async ({ validationErrorsPage: v }) => {
      await test.step(`Press "${c.label}"`, () => v.trigger(c.id).click());

      await expect(v.result).toHaveAttribute('data-state', 'error');
      await expect(v.result).toHaveAttribute('role', 'status');
      await expect(v.message).toHaveText(c.message);
      await expect(v.errors).toHaveText([c.message]);
      await expect(v.toast).toHaveText('Error toast: Fix validation errors before submitting.');
    });
  }

  test('a second scenario replaces the first', { tag: ['@edge'], annotation: [tc('TC-VER-003')] }, async ({ validationErrorsPage: v }) => {
    const [first, second] = [VALIDATION_CASES[0], VALIDATION_CASES[8]];
    await v.trigger(first.id).click();
    await expect(v.message).toHaveText(first.message);

    await test.step(`Press "${second.label}"`, () => v.trigger(second.id).click());

    await expect(v.errors).toHaveText([second.message]);
  });
});
