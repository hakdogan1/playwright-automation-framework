import { test, expect } from '@playwright/test';

// Deterministic flakiness: the outcome depends only on the attempt number, never on timing.
test('flaky: fails on the first attempt only', ({}, testInfo) => {
  expect(testInfo.retry, 'fails on attempt 0, passes on retry 1').toBe(1);
});

test('stable: always passes', () => {
  expect(1 + 1).toBe(2);
});
