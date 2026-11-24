import { test, expect, tc } from '../../fixtures';
import { CHECKOUT_MESSAGES, IDLE_MESSAGE, VALID_CHECKOUT, issuesMessage } from '../../data/form-lab.data';

// Oracles come from the app source (form-lab.tsx, 3d14d23). The payment method is a select with
// two test options; no card data exists in this form. Fake clock installed and paused.

test.describe('Checkout Form', () => {
  test.beforeEach(async ({ checkoutFormPage }) => {
    await checkoutFormPage.goto();
  });

  test('a complete order with the successful test method is submitted', { tag: ['@smoke'], annotation: [tc('TC-CKO-001')] }, async ({ checkoutFormPage: f }) => {
    await f.fill(VALID_CHECKOUT);
    await f.submit();

    await expect(f.form.result).toHaveAttribute('data-state', 'success');
    await expect(f.form.message).toHaveText(CHECKOUT_MESSAGES.success);
  });

  test('the declined test method blocks checkout', { tag: ['@negative'], annotation: [tc('TC-CKO-002')] }, async ({ checkoutFormPage: f }) => {
    await f.fill({ ...VALID_CHECKOUT, paymentMethod: 'test-declined' });
    await f.submit();

    await expect(f.form.errors).toHaveText([CHECKOUT_MESSAGES.declined]);
  });

  test('an empty submit reports all eight issues in order', { tag: ['@negative'], annotation: [tc('TC-CKO-003')] }, async ({ checkoutFormPage: f }) => {
    await f.submit();

    await expect(f.form.errors).toHaveText([...CHECKOUT_MESSAGES.emptyErrors]);
    await expect(f.form.message).toHaveText(issuesMessage(CHECKOUT_MESSAGES.emptyErrors.length));
  });

  for (const [box, error] of [
    ['reviewOrder', CHECKOUT_MESSAGES.review],
    ['acceptTerms', CHECKOUT_MESSAGES.terms],
  ] as const) {
    test(`without "${box}" the order is rejected`, { tag: ['@negative'], annotation: [tc('TC-CKO-004')] }, async ({ checkoutFormPage: f }) => {
      await f.fill({ ...VALID_CHECKOUT, [box]: false });
      await f.submit();

      await expect(f.form.errors).toHaveText([error]);
    });
  }

  test('fixing the errors lets the next submit succeed; Reset clears the form', { tag: ['@functional'], annotation: [tc('TC-CKO-005')] }, async ({ checkoutFormPage: f }) => {
    await f.fill({ ...VALID_CHECKOUT, paymentMethod: 'test-declined', acceptTerms: false });
    await f.submit();
    await expect(f.form.errors).toHaveText([CHECKOUT_MESSAGES.declined, CHECKOUT_MESSAGES.terms]);

    await test.step('Choose the successful method, accept the terms and submit', async () => {
      await f.fill({ paymentMethod: 'test-success', acceptTerms: true });
      await f.submit();
    });

    await expect(f.form.message).toHaveText(CHECKOUT_MESSAGES.success);
    await expect(f.form.errors).toHaveCount(0);

    await test.step('Press Reset', () => f.form.reset.click());

    await expect(f.form.message).toHaveText(IDLE_MESSAGE);
    await expect(f.field('paymentMethod')).toHaveValue('');
    await expect(f.field('reviewOrder')).not.toBeChecked();
  });
});
