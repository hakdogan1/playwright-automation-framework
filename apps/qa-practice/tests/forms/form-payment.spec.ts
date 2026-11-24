import { test, expect, tc } from '../../fixtures';
import { CVVS, EXPIRIES, IDLE_MESSAGE, PAYMENT, PAYMENT_BASE, PAYMENT_MESSAGES, PAYMENT_WARNING, issuesMessage } from '../../data/form-lab.data';

// Oracles come from the app source (form-lab.tsx, 3d14d23). No card number is entered, not even a
// published test card: the card field always holds letters (NOT_A_CARD), so the card-format error
// is always present and the other rules are checked next to it. The test-card flows (success,
// declined, authentication required) are not automated here; see TC-PAY.md.
// Required messages say "Cvv"/"Billing Zip" (label "CVV"/"Billing ZIP") and the expiry rule is a
// fixed regular expression, not a date check: OBS-09, not asserted.

test.describe('Payment Form', () => {
  test.beforeEach(async ({ paymentFormPage }) => {
    await paymentFormPage.goto();
  });

  test('the test-card warning and every field are shown', { tag: ['@smoke'], annotation: [tc('TC-PAY-001')] }, async ({ paymentFormPage: f, page }) => {
    await expect(page.getByTestId('form-payment-test-card-warning')).toHaveText(PAYMENT_WARNING);
    for (const name of Object.keys(PAYMENT.fields) as (keyof typeof PAYMENT.fields)[]) await expect(f.field(name), name).toBeVisible();
    await expect(f.field('expiry')).toHaveAttribute('placeholder', 'MM/YY');
    await expect(f.form.submit).toHaveText(PAYMENT.submitLabel);
    await expect(f.form.message).toHaveText(IDLE_MESSAGE);
  });

  test('an empty submit reports all eight issues in order', { tag: ['@negative'], annotation: [tc('TC-PAY-002')] }, async ({ paymentFormPage: f }) => {
    await f.submit();

    await expect(f.form.errors).toHaveText([...PAYMENT_MESSAGES.emptyErrors]);
    await expect(f.form.message).toHaveText(issuesMessage(PAYMENT_MESSAGES.emptyErrors.length));
  });

  test('a card number with letters is rejected as the only issue', { tag: ['@negative'], annotation: [tc('TC-PAY-003')] }, async ({ paymentFormPage: f }) => {
    await f.fill(PAYMENT_BASE);
    await f.submit();

    await expect(f.form.result).toHaveAttribute('data-state', 'error');
    await expect(f.form.errors).toHaveText([PAYMENT_MESSAGES.cardFormat]);
  });

  for (const e of EXPIRIES) {
    const expected = e.valid ? [PAYMENT_MESSAGES.cardFormat] : [PAYMENT_MESSAGES.cardFormat, PAYMENT_MESSAGES.expiry];

    test(`expiry "${e.value}" is ${e.valid ? 'accepted' : 'rejected'}`, { tag: ['@edge'], annotation: [tc('TC-PAY-004')] }, async ({ paymentFormPage: f }) => {
      await f.fill({ ...PAYMENT_BASE, expiry: e.value });
      await f.submit();

      await expect(f.form.errors).toHaveText(expected);
    });
  }

  for (const c of CVVS) {
    const expected = c.valid ? [PAYMENT_MESSAGES.cardFormat] : [PAYMENT_MESSAGES.cardFormat, PAYMENT_MESSAGES.cvv];

    test(`CVV "${c.value}" is ${c.valid ? 'accepted' : 'rejected'}`, { tag: ['@edge'], annotation: [tc('TC-PAY-005')] }, async ({ paymentFormPage: f }) => {
      await f.fill({ ...PAYMENT_BASE, cvv: c.value });
      await f.submit();

      await expect(f.form.errors).toHaveText(expected);
    });
  }

  test('Reset clears every field, the checkbox and the result', { tag: ['@functional'], annotation: [tc('TC-PAY-006')] }, async ({ paymentFormPage: f }) => {
    await f.fill({ ...PAYMENT_BASE, saveCard: true });
    await f.submit();

    await test.step('Press Reset', () => f.form.reset.click());

    await expect(f.form.message).toHaveText(IDLE_MESSAGE);
    await expect(f.form.errors).toHaveCount(0);
    for (const name of ['cardholder', 'cardNumber', 'expiry', 'cvv', 'zip'] as const) await expect(f.field(name), name).toHaveValue('');
    await expect(f.field('saveCard')).not.toBeChecked();
  });
});
