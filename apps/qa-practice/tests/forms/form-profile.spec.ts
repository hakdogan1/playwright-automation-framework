import { test, expect, tc } from '../../fixtures';
import { IDLE_MESSAGE, PROFILE_MESSAGES, VALID_PROFILE } from '../../data/form-lab.data';
import { jpegFile, pngFile, textFile } from '../../data/synthetic-files';

// Oracles come from the app source (form-lab.tsx, 3d14d23). Language and timezone are always
// chosen explicitly: their selects show the first option while the form state is empty, so an
// untouched profile is rejected as "required" (OBS-09, not asserted). The "email already used"
// trigger uses a non-reserved address and is not automated (OBS-09).

test.describe('Profile Update Form', () => {
  test.beforeEach(async ({ profileFormPage }) => {
    await profileFormPage.goto();
  });

  test('a complete profile is updated', { tag: ['@smoke'], annotation: [tc('TC-PRF-001')] }, async ({ profileFormPage: f }) => {
    await f.fill(VALID_PROFILE);
    await f.submit();

    await expect(f.form.result).toHaveAttribute('data-state', 'success');
    await expect(f.form.message).toHaveText(PROFILE_MESSAGES.success());
  });

  for (const file of [pngFile('avatar.png'), jpegFile('avatar.JPG')]) {
    test(`avatar "${file.name}" is accepted and named in the message`, { tag: ['@functional'], annotation: [tc('TC-PRF-002')] }, async ({ profileFormPage: f }) => {
      await f.fill({ ...VALID_PROFILE, avatar: file });
      await f.submit();

      await expect(f.form.message).toHaveText(PROFILE_MESSAGES.success(file.name));
    });
  }

  test('an avatar that is not PNG or JPG is rejected', { tag: ['@negative'], annotation: [tc('TC-PRF-003')] }, async ({ profileFormPage: f }) => {
    await f.fill({ ...VALID_PROFILE, avatar: textFile('avatar.txt') });
    await f.submit();

    await expect(f.form.errors).toHaveText([PROFILE_MESSAGES.fileType]);
  });

  test('invalid email and phone are both reported', { tag: ['@negative'], annotation: [tc('TC-PRF-004')] }, async ({ profileFormPage: f }) => {
    await f.fill({ ...VALID_PROFILE, email: 'qa.profile@', phone: '+49 30 123' });
    await f.submit();

    await expect(f.form.errors).toHaveText([PROFILE_MESSAGES.invalidEmail, PROFILE_MESSAGES.invalidPhone]);
  });

  test('Reset clears the text fields, the result and the avatar name', { tag: ['@functional'], annotation: [tc('TC-PRF-005')] }, async ({ profileFormPage: f }) => {
    await f.fill({ ...VALID_PROFILE, avatar: pngFile('avatar.png') });
    await f.submit();

    await test.step('Press Reset', () => f.form.reset.click());

    await expect(f.form.message).toHaveText(IDLE_MESSAGE);
    for (const name of ['displayName', 'email', 'phone'] as const) await expect(f.field(name), name).toHaveValue('');
    await expect(f.form.form.getByText(/^Selected:/)).toHaveCount(0);
  });
});
