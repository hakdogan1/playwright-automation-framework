import { test, expect, tc } from '../../fixtures';
import { ERROR_TOAST, IDLE_MESSAGE, LOGIN, LOGIN_MESSAGES, VALID_LOGIN, VALIDATING_LABEL, issuesMessage, successToast } from '../../data/form-lab.data';

// Oracles come from the app source (form-lab.tsx, 3d14d23). Client-only lab form: no account,
// no request. Fake clock installed and paused; submit() advances the 360 ms validation delay.
// The "locked account" trigger uses a non-reserved address and is not automated (OBS-09).

test.describe('Login Form', () => {
  test.beforeEach(async ({ loginFormPage }) => {
    await loginFormPage.goto();
  });

  test('valid credentials sign in and show the success toast', { tag: ['@smoke'], annotation: [tc('TC-LGN-001')] }, async ({ loginFormPage: f }) => {
    await expect(f.form.message).toHaveText(IDLE_MESSAGE);
    await expect(f.form.submit).toHaveText(LOGIN.submitLabel);

    await test.step('Enter a valid email and the demo password, then sign in', async () => {
      await f.fill(VALID_LOGIN);
      await f.submit();
    });

    await expect(f.form.result).toHaveAttribute('data-state', 'success');
    await expect(f.form.message).toHaveText(LOGIN_MESSAGES.success(VALID_LOGIN.email));
    await expect(f.toast).toHaveText(successToast(LOGIN_MESSAGES.success(VALID_LOGIN.email)));
    await expect(f.form.errors).toHaveCount(0);
  });

  test('"Remember me" is reflected in the success message', { tag: ['@functional'], annotation: [tc('TC-LGN-002')] }, async ({ loginFormPage: f }) => {
    await f.fill({ ...VALID_LOGIN, rememberMe: true });
    await f.submit();

    await expect(f.form.message).toHaveText(LOGIN_MESSAGES.success(VALID_LOGIN.email, true));
  });

  test('a wrong password is the only issue', { tag: ['@negative'], annotation: [tc('TC-LGN-003')] }, async ({ loginFormPage: f }) => {
    await f.fill({ ...VALID_LOGIN, password: 'WrongPass1!' });
    await f.submit();

    await expect(f.form.result).toHaveAttribute('data-state', 'error');
    await expect(f.form.errors).toHaveText([LOGIN_MESSAGES.invalidPassword]);
    await expect(f.form.message).toHaveText(issuesMessage(1));
    await expect(f.toast).toHaveText(ERROR_TOAST);
  });

  test('an empty submit reports the required fields and the email format', { tag: ['@negative'], annotation: [tc('TC-LGN-004')] }, async ({ loginFormPage: f }) => {
    await f.submit();

    await expect(f.form.errors).toHaveText([...LOGIN_MESSAGES.emptyErrors]);
    await expect(f.form.message).toHaveText(issuesMessage(LOGIN_MESSAGES.emptyErrors.length));
  });

  test('an invalid email with the right password is rejected', { tag: ['@negative'], annotation: [tc('TC-LGN-005')] }, async ({ loginFormPage: f }) => {
    await f.fill({ ...VALID_LOGIN, email: 'qa.login.example.test' });
    await f.submit();

    await expect(f.form.errors).toHaveText([LOGIN_MESSAGES.invalidEmail]);
  });

  test('surrounding spaces in the email are trimmed', { tag: ['@edge'], annotation: [tc('TC-LGN-006')] }, async ({ loginFormPage: f }) => {
    await f.fill({ ...VALID_LOGIN, email: `  ${VALID_LOGIN.email}  ` });
    await f.submit();

    await expect(f.form.message).toHaveText(LOGIN_MESSAGES.success(VALID_LOGIN.email));
  });

  test('while validating the button is disabled; Reset afterwards clears the form', { tag: ['@functional'], annotation: [tc('TC-LGN-007')] }, async ({ loginFormPage: f }) => {
    await f.fill({ ...VALID_LOGIN, password: 'WrongPass1!', rememberMe: true });
    await f.form.submit.click();

    await expect(f.form.submit).toBeDisabled();
    await expect(f.form.submit).toHaveText(VALIDATING_LABEL);

    await f.advance(360);
    await expect(f.form.result).toHaveAttribute('data-state', 'error');

    await test.step('Press Reset', () => f.form.reset.click());

    await expect(f.form.result).toHaveAttribute('data-state', 'idle');
    await expect(f.form.message).toHaveText(IDLE_MESSAGE);
    await expect(f.form.errors).toHaveCount(0);
    await expect(f.field('email')).toHaveValue('');
    await expect(f.field('password')).toHaveValue('');
    await expect(f.field('rememberMe')).not.toBeChecked();
  });
});
