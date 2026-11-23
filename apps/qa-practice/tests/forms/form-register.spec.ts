import { test, expect, tc } from '../../fixtures';
import {
  EMPTY_FORM_ERRORS,
  INVALID_EMAILS,
  REGISTER_ERRORS,
  REGISTER_LABELS,
  REGISTER_SUBMIT_DELAY_MS,
  VALID_REGISTRATION,
  issuesMessage,
  successMessage,
} from '../../data/form-register.data';

// Every test runs on a fake, paused clock (FormRegisterPage.goto): submit() advances exactly
// the app's 360 ms validation delay, so no assertion can pass on a stale result.
// Oracles come from the app source (form-lab.tsx, 3d14d23): exact messages, exact error order.

test.describe('Form Register', () => {
  test.beforeEach(async ({ formRegisterPage }) => {
    await formRegisterPage.goto();
  });

  test('a complete, valid registration succeeds', { tag: ['@smoke'], annotation: [tc('TC-FRM-001')] }, async ({ formRegisterPage: reg }) => {
    const { form } = reg;

    await expect(form.result).toHaveAttribute('data-state', 'idle');
    await expect(form.message).toHaveText(REGISTER_LABELS.idleMessage);

    await test.step('Fill every field with valid synthetic data and submit', async () => {
      await reg.fill(VALID_REGISTRATION);
      await reg.submit();
    });

    await expect(form.result).toHaveAttribute('data-state', 'success');
    await expect(form.result).toHaveAttribute('role', 'status');
    await expect(form.message).toHaveText(successMessage(VALID_REGISTRATION.username));
    await expect(form.errors).toHaveCount(0);
  });

  test('while validating, the submit button is disabled and says "Validating..."', { tag: ['@functional'], annotation: [tc('TC-FRM-002')] }, async ({ formRegisterPage: reg }) => {
    const { form } = reg;
    await reg.fill(VALID_REGISTRATION);

    await test.step('Click "Create account" without advancing the clock', () => form.submit.click());

    await expect(form.submit).toBeDisabled();
    await expect(form.submit).toHaveText(REGISTER_LABELS.loading);
    await expect(form.result).toHaveAttribute('data-state', 'idle');

    await test.step(`Advance ${REGISTER_SUBMIT_DELAY_MS - 1} ms: still validating`, () => reg.advance(REGISTER_SUBMIT_DELAY_MS - 1));

    await expect(form.submit).toBeDisabled();
    await expect(form.result).toHaveAttribute('data-state', 'idle');

    await test.step('Advance the last millisecond', () => reg.advance(1));

    await expect(form.submit).toBeEnabled();
    await expect(form.submit).toHaveText(REGISTER_LABELS.submit);
    await expect(form.result).toHaveAttribute('data-state', 'success');
  });

  test('an empty form reports all ten issues in order', { tag: ['@negative'], annotation: [tc('TC-FRM-003')] }, async ({ formRegisterPage: reg }) => {
    const { form } = reg;

    await test.step('Submit the untouched form', () => reg.submit());

    await expect(form.result).toHaveAttribute('data-state', 'error');
    await expect(form.message).toHaveText(issuesMessage(EMPTY_FORM_ERRORS.length));
    await expect(form.errors).toHaveText([...EMPTY_FORM_ERRORS]);
  });

  // The row number keeps every title unique after Playwright sanitizes it for the artifact folder:
  // "qa runner@example.test" and "qa.runner@@example.test" both became "qa-runner-example-test",
  // so one test's evidence overwrote the other's (run 20261123T080136Z-251ec9).
  for (const [row, email] of INVALID_EMAILS.entries()) {
    test(`invalid email #${row + 1} "${email}" is the only issue`, { tag: ['@negative'], annotation: [tc('TC-FRM-004')] }, async ({ formRegisterPage: reg }) => {
      const { form } = reg;

      await test.step(`Valid data with email "${email}"`, async () => {
        await reg.fill({ ...VALID_REGISTRATION, email });
        await reg.submit();
      });

      await expect(form.result).toHaveAttribute('data-state', 'error');
      await expect(form.message).toHaveText(issuesMessage(1));
      await expect(form.errors).toHaveText([REGISTER_ERRORS.emailFormat]);
    });
  }

  test('different passwords are rejected with "Passwords must match."', { tag: ['@negative'], annotation: [tc('TC-FRM-005')] }, async ({ formRegisterPage: reg }) => {
    const { form } = reg;

    await test.step('Valid data, confirmation differs by one character', async () => {
      await reg.fill({ ...VALID_REGISTRATION, confirmPassword: 'Passw0rd?' });
      await reg.submit();
    });

    await expect(form.result).toHaveAttribute('data-state', 'error');
    await expect(form.errors).toHaveText([REGISTER_ERRORS.passwordMatch]);
  });

  test('registration without accepting the terms is rejected', { tag: ['@negative'], annotation: [tc('TC-FRM-006')] }, async ({ formRegisterPage: reg }) => {
    const { form } = reg;

    await test.step('Valid data, terms not accepted', async () => {
      await reg.fill({ ...VALID_REGISTRATION, terms: false });
      await reg.submit();
    });

    await expect(reg.field('terms')).not.toBeChecked();
    await expect(form.result).toHaveAttribute('data-state', 'error');
    await expect(form.errors).toHaveText([REGISTER_ERRORS.terms]);
  });

  test('registration without a country is rejected', { tag: ['@negative'], annotation: [tc('TC-FRM-007')] }, async ({ formRegisterPage: reg }) => {
    const { form } = reg;

    await test.step('Valid data, country left at "Select country"', async () => {
      await reg.fill({ ...VALID_REGISTRATION, country: '' });
      await reg.submit();
    });

    await expect(reg.field('country')).toHaveValue('');
    await expect(form.result).toHaveAttribute('data-state', 'error');
    await expect(form.errors).toHaveText([REGISTER_ERRORS.country]);
  });

  test('a 7-character password is rejected and 8 characters are accepted', { tag: ['@edge'], annotation: [tc('TC-FRM-008')] }, async ({ formRegisterPage: reg }) => {
    const { form } = reg;

    await test.step('Password and confirmation of 7 characters', async () => {
      await reg.fill({ ...VALID_REGISTRATION, password: 'Passw0r', confirmPassword: 'Passw0r' });
      await reg.submit();
    });

    await expect(form.result).toHaveAttribute('data-state', 'error');
    await expect(form.errors).toHaveText([REGISTER_ERRORS.passwordLength]);

    await test.step('Password and confirmation of exactly 8 characters', async () => {
      await reg.fill({ password: 'Passw0rd', confirmPassword: 'Passw0rd' });
      await reg.submit();
    });

    await expect(form.result).toHaveAttribute('data-state', 'success');
    await expect(form.errors).toHaveCount(0);
  });

  test('whitespace-only required fields count as empty', { tag: ['@edge'], annotation: [tc('TC-FRM-009')] }, async ({ formRegisterPage: reg }) => {
    const { form } = reg;

    await test.step('Names and username contain only spaces', async () => {
      await reg.fill({ ...VALID_REGISTRATION, firstName: '   ', lastName: ' ', username: '\t ' });
      await reg.submit();
    });

    await expect(form.errors).toHaveText([REGISTER_ERRORS.firstName, REGISTER_ERRORS.lastName, REGISTER_ERRORS.username]);

    await test.step('Restore the names; the email contains only spaces', async () => {
      await reg.fill({ firstName: VALID_REGISTRATION.firstName, lastName: VALID_REGISTRATION.lastName, username: VALID_REGISTRATION.username, email: '   ' });
      await reg.submit();
    });

    // The format rule runs on the trimmed (empty) value as well.
    await expect(form.errors).toHaveText([REGISTER_ERRORS.email, REGISTER_ERRORS.emailFormat]);
  });

  test('password rules: length uses the trimmed value, matching uses the raw value', { tag: ['@edge'], annotation: [tc('TC-FRM-010')] }, async ({ formRegisterPage: reg }) => {
    const { form } = reg;

    await test.step('Confirmation has one extra trailing space', async () => {
      await reg.fill({ ...VALID_REGISTRATION, confirmPassword: `${VALID_REGISTRATION.password} ` });
      await reg.submit();
    });

    await expect(form.errors).toHaveText([REGISTER_ERRORS.passwordMatch]);

    await test.step('8 raw characters but only 1 without spaces, typed identically twice', async () => {
      await reg.fill({ password: '       x', confirmPassword: '       x' });
      await reg.submit();
    });

    await expect(form.errors).toHaveText([REGISTER_ERRORS.passwordLength]);
  });

  test('fixing the errors clears them and the next submit succeeds', { tag: ['@functional'], annotation: [tc('TC-FRM-011')] }, async ({ formRegisterPage: reg }) => {
    const { form } = reg;

    await test.step('Submit the empty form', () => reg.submit());

    await expect(form.errors).toHaveCount(EMPTY_FORM_ERRORS.length);

    await test.step('Fix everything except the email format', async () => {
      await reg.fill({ ...VALID_REGISTRATION, email: 'qa.runner@example' });
      await reg.submit();
    });

    await expect(form.message).toHaveText(issuesMessage(1));
    await expect(form.errors).toHaveText([REGISTER_ERRORS.emailFormat]);

    await test.step('Fix the email', async () => {
      await reg.fill({ email: VALID_REGISTRATION.email });
      await reg.submit();
    });

    await expect(form.result).toHaveAttribute('data-state', 'success');
    await expect(form.message).toHaveText(successMessage(VALID_REGISTRATION.username));
    await expect(form.errors).toHaveCount(0);
  });

  test('Reset and reload return the form to a clean, reusable state', { tag: ['@functional'], annotation: [tc('TC-FRM-012')] }, async ({ formRegisterPage: reg }) => {
    const { form } = reg;
    const second = { ...VALID_REGISTRATION, username: 'qa_runner_02' };

    await test.step('Register once', async () => {
      await reg.fill(VALID_REGISTRATION);
      await reg.submit();
    });

    await expect(form.result).toHaveAttribute('data-state', 'success');

    await test.step('Press "Reset"', () => form.reset.click());

    for (const name of ['firstName', 'lastName', 'username', 'email', 'password', 'confirmPassword', 'country'] as const) {
      await expect(reg.field(name), `${name} is empty after Reset`).toHaveValue('');
    }

    await expect(reg.field('terms')).not.toBeChecked();
    await expect(form.result).toHaveAttribute('data-state', 'idle');
    await expect(form.message).toHaveText(REGISTER_LABELS.idleMessage);
    await expect(form.errors).toHaveCount(0);

    await test.step('Register again with another username', async () => {
      await reg.fill(second);
      await reg.submit();
    });

    await expect(form.message).toHaveText(successMessage(second.username));

    await test.step('Reload the page', () => reg.reload());

    await expect(reg.field('username')).toHaveValue('');
    await expect(form.result).toHaveAttribute('data-state', 'idle');
  });
});
