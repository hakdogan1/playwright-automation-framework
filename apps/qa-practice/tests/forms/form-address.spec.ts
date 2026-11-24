import { test, expect, tc } from '../../fixtures';
import { ADDRESS_MESSAGES, IDLE_MESSAGE, PHONES, POSTAL_CODES, VALID_ADDRESS, issuesMessage } from '../../data/form-lab.data';

// Oracles come from the app source (form-lab.tsx, 3d14d23): postal /^[A-Za-z0-9 -]{4,10}$/,
// phone /^[0-9]{7,15}$/. Fake clock installed and paused; submit() advances the delay.

test.describe('Address Form', () => {
  test.beforeEach(async ({ addressFormPage }) => {
    await addressFormPage.goto();
  });

  test('a complete address is saved; line 2 is optional', { tag: ['@smoke'], annotation: [tc('TC-ADR-001')] }, async ({ addressFormPage: f }) => {
    await f.fill(VALID_ADDRESS);
    await f.submit();

    await expect(f.form.result).toHaveAttribute('data-state', 'success');
    await expect(f.form.message).toHaveText(ADDRESS_MESSAGES.success(VALID_ADDRESS.city, VALID_ADDRESS.country));
  });

  test('an empty submit reports all eight issues in order', { tag: ['@negative'], annotation: [tc('TC-ADR-002')] }, async ({ addressFormPage: f }) => {
    await f.submit();

    await expect(f.form.errors).toHaveText([...ADDRESS_MESSAGES.emptyErrors]);
    await expect(f.form.message).toHaveText(issuesMessage(ADDRESS_MESSAGES.emptyErrors.length));
  });

  for (const p of POSTAL_CODES) {
    const expected = p.valid ? [] : [ADDRESS_MESSAGES.postal];

    test(`postal code "${p.value}" is ${p.valid ? 'accepted' : 'rejected'}`, { tag: ['@edge'], annotation: [tc('TC-ADR-003')] }, async ({ addressFormPage: f }) => {
      await f.fill({ ...VALID_ADDRESS, postalCode: p.value });
      await f.submit();

      await expect(f.form.errors).toHaveText(expected);
    });
  }

  for (const p of PHONES) {
    const expected = p.valid ? [] : [ADDRESS_MESSAGES.phone];

    test(`phone "${p.value}" is ${p.valid ? 'accepted' : 'rejected'}`, { tag: ['@edge'], annotation: [tc('TC-ADR-004')] }, async ({ addressFormPage: f }) => {
      await f.fill({ ...VALID_ADDRESS, phone: p.value });
      await f.submit();

      await expect(f.form.errors).toHaveText(expected);
    });
  }

  test('without a country the address is rejected', { tag: ['@negative'], annotation: [tc('TC-ADR-005')] }, async ({ addressFormPage: f }) => {
    await f.fill({ ...VALID_ADDRESS, country: '' });
    await f.submit();

    await expect(f.form.errors).toHaveText(['Country is required.']);
  });

  test('Reset returns every field and the result to the initial state', { tag: ['@functional'], annotation: [tc('TC-ADR-006')] }, async ({ addressFormPage: f }) => {
    await f.fill({ ...VALID_ADDRESS, line2: 'Hinterhaus' });
    await f.submit();

    await test.step('Press Reset', () => f.form.reset.click());

    await expect(f.form.message).toHaveText(IDLE_MESSAGE);
    for (const name of ['line1', 'line2', 'city', 'state', 'postalCode', 'country', 'phone'] as const) await expect(f.field(name), name).toHaveValue('');
  });
});
