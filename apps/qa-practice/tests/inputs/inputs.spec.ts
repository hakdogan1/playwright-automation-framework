import { test, expect, tc } from '../../fixtures';
import { INVALID_EMAILS, PASSWORD_AT_MIN_LENGTH, PASSWORD_SINGLE_RULE_FAILURES, VALID_CREDENTIALS } from '../../data/inputs.data';

test.describe('Inputs', () => {
  test.beforeEach(async ({ inputsPage }) => {
    await inputsPage.goto();
  });

  test('the form renders empty and waits for input', { tag: ['@smoke'], annotation: [tc('TC-INP-001')] }, async ({ inputsPage }) => {
    await expect(inputsPage.email).toBeEmpty();
    await expect(inputsPage.password).toBeEmpty();
    await expect(inputsPage.password).toHaveAttribute('type', 'password');
    await expect(inputsPage.result).toHaveAttribute('data-state', 'idle');
    await expect(inputsPage.result).toHaveText('Awaiting submission…');
    expect(Object.values(await inputsPage.passwordRules.states())).toEqual(['idle', 'idle', 'idle', 'idle', 'idle']);
  });

  test('valid email and password sign in', { tag: ['@smoke', '@functional'], annotation: [tc('TC-INP-002')] }, async ({ inputsPage }) => {
    await test.step('Enter a valid email and password and press "Sign in"', () => inputsPage.submit(VALID_CREDENTIALS));

    await expect(inputsPage.result).toHaveAttribute('data-state', 'success');
    await expect(inputsPage.result).toContainText(`Login successful — welcome, ${VALID_CREDENTIALS.email}.`);
    await expect(inputsPage.emailError).toBeHidden();
  });

  for (const { label, value } of INVALID_EMAILS) {
    test(`invalid email is rejected: ${label}`, { tag: ['@negative'], annotation: [tc('TC-INP-003')] }, async ({ inputsPage }) => {
      await test.step(`Enter email "${value}" with a valid password and submit`, () =>
        inputsPage.submit({ email: value, password: VALID_CREDENTIALS.password }));

      await expect(inputsPage.emailError).toBeVisible();
      // The alert starts with a decorative, aria-hidden "!" icon, so match the message text.
      await expect(inputsPage.emailError).toContainText('Please enter a valid email address.');
      await expect(inputsPage.email).toHaveAttribute('aria-invalid', 'true');
      await expect(inputsPage.result).toHaveAttribute('data-state', 'error');
      await expect(inputsPage.result).toHaveText('Please enter a valid email address before submitting.');
    });
  }

  test('submitting an empty form reports both fields', { tag: ['@negative'], annotation: [tc('TC-INP-004')] }, async ({ inputsPage }) => {
    await test.step('Press "Sign in" without entering anything', () => inputsPage.signIn.click());

    await expect(inputsPage.result).toHaveAttribute('data-state', 'error');
    await expect(inputsPage.result).toHaveText('Please correct the email address and password before submitting.');
    await expect(inputsPage.emailError).toBeVisible();
  });

  test('password length boundary: 8 characters pass, 7 fail', { tag: ['@edge'], annotation: [tc('TC-INP-005')] }, async ({ inputsPage }) => {
    await test.step('Type a 7-character password', () => inputsPage.password.fill(PASSWORD_AT_MIN_LENGTH.slice(0, 7)));

    await expect(inputsPage.passwordRules.rule('length')).toHaveAttribute('data-state', 'fail');

    await test.step('Type an 8-character password', () => inputsPage.password.fill(PASSWORD_AT_MIN_LENGTH));

    await expect(inputsPage.passwordRules.rule('length')).toHaveAttribute('data-state', 'ok');
    expect(Object.values(await inputsPage.passwordRules.states())).toEqual(['ok', 'ok', 'ok', 'ok', 'ok']);
  });

  for (const { rule, value } of PASSWORD_SINGLE_RULE_FAILURES) {
    test(`password missing "${rule}" blocks sign in`, { tag: ['@negative'], annotation: [tc('TC-INP-006')] }, async ({ inputsPage }) => {
      await test.step(`Enter a valid email and the password "${value}", then submit`, () =>
        inputsPage.submit({ email: VALID_CREDENTIALS.email, password: value }));

      await expect(inputsPage.passwordRules.rule(rule)).toHaveAttribute('data-state', 'fail');
      const others = Object.entries(await inputsPage.passwordRules.states()).filter(([id]) => id !== rule);
      expect(others.every(([, state]) => state === 'ok'), `only "${rule}" should fail`).toBe(true);
      await expect(inputsPage.result).toHaveText('Password does not meet all requirements yet.');
      await expect(inputsPage.emailError).toBeHidden();
    });
  }

  test('surrounding spaces in the email are trimmed', { tag: ['@edge'], annotation: [tc('TC-INP-007')] }, async ({ inputsPage }) => {
    await test.step('Enter the email with leading and trailing spaces and submit', () =>
      inputsPage.submit({ email: `  ${VALID_CREDENTIALS.email}  `, password: VALID_CREDENTIALS.password }));

    await expect(inputsPage.result).toHaveAttribute('data-state', 'success');
    await expect(inputsPage.result).toContainText(`Login successful — welcome, ${VALID_CREDENTIALS.email}.`);
  });
});
