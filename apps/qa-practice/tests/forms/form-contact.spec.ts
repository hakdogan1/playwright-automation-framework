import { test, expect, tc } from '../../fixtures';
import { CONTACT_MESSAGES, CONTACT_MESSAGE_MIN, IDLE_MESSAGE, VALID_CONTACT, issuesMessage } from '../../data/form-lab.data';
import { pngFile } from '../../data/synthetic-files';

// Oracles come from the app source (form-lab.tsx, 3d14d23). Client-only: the attachment is only
// read for its name. Fake clock installed and paused; submit() advances the validation delay.
// Reset keeps the chosen file in the file input while the UI forgets it: OBS-09, not asserted.

test.describe('Contact Form', () => {
  test.beforeEach(async ({ contactFormPage }) => {
    await contactFormPage.goto();
  });

  test('a complete message without attachment is sent', { tag: ['@smoke'], annotation: [tc('TC-CNT-001')] }, async ({ contactFormPage: f }) => {
    await f.fill(VALID_CONTACT);
    await f.submit();

    await expect(f.form.result).toHaveAttribute('data-state', 'success');
    await expect(f.form.message).toHaveText(CONTACT_MESSAGES.success());
  });

  test('an attachment is named in the selection and in the success message', { tag: ['@functional'], annotation: [tc('TC-CNT-002')] }, async ({ contactFormPage: f }) => {
    await f.fill({ ...VALID_CONTACT, attachment: pngFile('evidence.png') });

    await expect(f.form.form.getByText('Selected: evidence.png', { exact: true })).toBeVisible();

    await f.submit();

    await expect(f.form.message).toHaveText(CONTACT_MESSAGES.success('evidence.png'));
  });

  test('an empty submit reports all six issues in order', { tag: ['@negative'], annotation: [tc('TC-CNT-003')] }, async ({ contactFormPage: f }) => {
    await f.submit();

    await expect(f.form.errors).toHaveText([...CONTACT_MESSAGES.emptyErrors]);
    await expect(f.form.message).toHaveText(issuesMessage(CONTACT_MESSAGES.emptyErrors.length));
  });

  test('the message needs 20 characters after trimming', { tag: ['@edge'], annotation: [tc('TC-CNT-004')] }, async ({ contactFormPage: f }) => {
    const nineteen = 'x'.repeat(CONTACT_MESSAGE_MIN - 1);

    await test.step('19 characters padded with spaces', async () => {
      await f.fill({ ...VALID_CONTACT, message: `  ${nineteen}  ` });
      await f.submit();
    });

    await expect(f.form.errors).toHaveText([CONTACT_MESSAGES.tooShort]);

    await test.step('Exactly 20 characters', async () => {
      await f.fill({ message: `${nineteen}y` });
      await f.submit();
    });

    await expect(f.form.result).toHaveAttribute('data-state', 'success');
  });

  test('an invalid email is rejected', { tag: ['@negative'], annotation: [tc('TC-CNT-005')] }, async ({ contactFormPage: f }) => {
    await f.fill({ ...VALID_CONTACT, email: 'qa contact@example.test' });
    await f.submit();

    await expect(f.form.errors).toHaveText(['Email must be valid.']);
  });

  test('Reset clears the text fields, the result and the attachment name', { tag: ['@functional'], annotation: [tc('TC-CNT-006')] }, async ({ contactFormPage: f }) => {
    await f.fill({ ...VALID_CONTACT, attachment: pngFile('evidence.png') });
    await f.submit();
    await expect(f.form.result).toHaveAttribute('data-state', 'success');

    await test.step('Press Reset', () => f.form.reset.click());

    await expect(f.form.result).toHaveAttribute('data-state', 'idle');
    await expect(f.form.message).toHaveText(IDLE_MESSAGE);
    for (const name of ['fullName', 'email', 'subject', 'message'] as const) await expect(f.field(name), name).toHaveValue('');
    await expect(f.form.form.getByText(/^Selected:/)).toHaveCount(0);
  });
});
