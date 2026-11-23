import { test, expect } from '@playwright/test';
import { test as guarded } from '../../../core/fixtures';

// Intentional outcomes for the reporter self-test. Each test maps to one classification.

test.describe('cart', () => {
  test.beforeEach(async ({ page }) => {
    await page.setContent('<button>Add</button><p data-testid="total">$19.990000000000002</p>');
  });

  test('assertion mismatch', { tag: ['@smoke'], annotation: [{ type: 'tc', description: 'TC-RPT-001' }] }, async ({ page }) => {
    await page.getByRole('button', { name: 'Add' }).click();
    await test.step('Read the cart total', async () => {
      await expect(page.getByTestId('total')).toHaveText('$19.99', { timeout: 300 });
    });
  });
});

test('missing element', { annotation: [{ type: 'tc', description: 'TC-RPT-002' }] }, async ({ page }) => {
  await page.setContent('<button>Present</button>');
  await expect(page.getByRole('button', { name: 'Absent' })).toBeVisible({ timeout: 300 });
});

test('environment down', async () => {
  throw new Error('page.goto: net::ERR_CONNECTION_REFUSED at http://127.0.0.1:9/');
});

test('flaky once', async ({}, testInfo) => {
  expect(testInfo.retry, 'fails on the first attempt only').toBe(1);
});

test('passes', async () => {
  expect(1 + 1).toBe(2);
});

// Guard failure: the app (simulated) tries a write the guard blocks; the guard fails the test at teardown.
guarded('guard blocks a write', async ({ page }) => {
  await page.setContent('<p>checkout</p>');
  await page.evaluate(() => fetch('https://api.blocked.invalid/orders?token=SECRET123', { method: 'POST', body: '{}' }).catch(() => undefined));
  await expect(page.getByText('checkout')).toBeVisible();
});
