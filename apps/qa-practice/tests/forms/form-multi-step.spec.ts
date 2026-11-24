import { test, expect, tc } from '../../fixtures';
import { VALID_WIZARD, WIZARD_MESSAGES, wizardProgress } from '../../data/form-lab.data';

// Oracles come from the app source (MultiStepFormLab, form-lab.tsx, 3d14d23). No timers.
// The error count message reads "2 validation issue found." and stays after the fields are fixed
// until Next is pressed again: OBS-09, not asserted (the tests check the error list instead).

test.describe('Multi-Step Form', () => {
  test.beforeEach(async ({ multiStepFormPage }) => {
    await multiStepFormPage.goto();
  });

  test('a valid wizard goes through all five steps and submits', { tag: ['@smoke'], annotation: [tc('TC-MSF-001')] }, async ({ multiStepFormPage: w }) => {
    await expect(w.progress).toHaveText(wizardProgress(0));
    await expect(w.back).toBeDisabled();

    await test.step('Fill personal info and press Next', async () => {
      await w.firstName.fill(VALID_WIZARD.firstName);
      await w.email.fill(VALID_WIZARD.email);
      await expect(w.message).toHaveText(WIZARD_MESSAGES.valid);
      await w.next.click();
    });

    await expect(w.progress).toHaveText(wizardProgress(1));

    await test.step('Fill the address and press Next', async () => {
      await w.address.fill(VALID_WIZARD.address);
      await w.city.fill(VALID_WIZARD.city);
      await w.next.click();
    });

    await expect(w.progress).toHaveText(wizardProgress(2));

    await test.step('Choose preferences and press Next', async () => {
      await w.language.selectOption('tr');
      await w.newsletter.check();
      await w.next.click();
    });

    await expect(w.progress).toHaveText(wizardProgress(3));
    await expect(w.reviewSummary).toHaveText(`${VALID_WIZARD.firstName} · ${VALID_WIZARD.email} · ${VALID_WIZARD.address}, ${VALID_WIZARD.city}`);

    await test.step('Press Next on the review', () => w.next.click());

    await expect(w.progress).toHaveText(wizardProgress(4));
    await expect(w.root.getByText(WIZARD_MESSAGES.ready, { exact: true })).toBeVisible();
    await expect(w.next).toHaveCount(0);

    await test.step('Submit', () => w.submit.click());

    await expect(w.result).toHaveAttribute('data-state', 'success');
    await expect(w.message).toHaveText(WIZARD_MESSAGES.done);
  });

  test('step 1 blocks Next until first name and a valid email are given', { tag: ['@negative'], annotation: [tc('TC-MSF-002')] }, async ({ multiStepFormPage: w }) => {
    await expect(w.message).toHaveText(WIZARD_MESSAGES.incomplete);

    await test.step('Press Next on the empty step', () => w.next.click());

    await expect(w.progress).toHaveText(wizardProgress(0));
    await expect(w.result).toHaveAttribute('data-state', 'error');
    await expect(w.errors).toHaveText([...WIZARD_MESSAGES.step1Errors]);

    await test.step('Enter an invalid email and press Next', async () => {
      await w.firstName.fill(VALID_WIZARD.firstName);
      await w.email.fill('qa.wizard@example');
      await w.next.click();
    });

    await expect(w.errors).toHaveText([WIZARD_MESSAGES.step1Errors[1]]);
    await expect(w.progress).toHaveText(wizardProgress(0));
  });

  test('step 2 blocks Next until address and city are given', { tag: ['@negative'], annotation: [tc('TC-MSF-003')] }, async ({ multiStepFormPage: w }) => {
    await w.firstName.fill(VALID_WIZARD.firstName);
    await w.email.fill(VALID_WIZARD.email);
    await w.next.click();

    await test.step('Press Next on the empty address step', () => w.next.click());

    await expect(w.errors).toHaveText([...WIZARD_MESSAGES.step2Errors]);
    await expect(w.progress).toHaveText(wizardProgress(1));
  });

  test('Back keeps the entered values and clears the errors', { tag: ['@functional'], annotation: [tc('TC-MSF-004')] }, async ({ multiStepFormPage: w }) => {
    await w.firstName.fill(VALID_WIZARD.firstName);
    await w.email.fill(VALID_WIZARD.email);
    await w.next.click();
    await w.next.click();
    await expect(w.errors).toHaveCount(2);

    await test.step('Press Back', () => w.back.click());

    await expect(w.progress).toHaveText(wizardProgress(0));
    await expect(w.firstName).toHaveValue(VALID_WIZARD.firstName);
    await expect(w.email).toHaveValue(VALID_WIZARD.email);
    await expect(w.errors).toHaveCount(0);
    await expect(w.back).toBeDisabled();
  });

  test('Back after submitting leaves the success state', { tag: ['@edge'], annotation: [tc('TC-MSF-005')] }, async ({ multiStepFormPage: w }) => {
    await w.firstName.fill(VALID_WIZARD.firstName);
    await w.email.fill(VALID_WIZARD.email);
    await w.next.click();
    await w.address.fill(VALID_WIZARD.address);
    await w.city.fill(VALID_WIZARD.city);
    for (let i = 0; i < 3; i++) await w.next.click();
    await w.submit.click();
    await expect(w.result).toHaveAttribute('data-state', 'success');

    await test.step('Press Back', () => w.back.click());

    await expect(w.progress).toHaveText(wizardProgress(3));
    await expect(w.result).not.toHaveAttribute('data-state', 'success');
    await expect(w.message).toHaveText(WIZARD_MESSAGES.valid);
  });
});
