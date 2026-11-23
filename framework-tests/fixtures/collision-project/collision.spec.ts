import { readFileSync, writeFileSync } from 'node:fs';
import { test, expect, type TestInfo } from '@playwright/test';

// Two titles that differ only in punctuation. Playwright sanitizes runs of special characters
// into one "-", so both map to the same artifact folder ("...email-a-b-c-test-...").
// Each test writes a file naming itself, so a deleted or overwritten folder is visible.
function sign(testInfo: TestInfo, who: string): string {
  const file = testInfo.outputPath('who.txt');
  writeFileSync(file, who);
  return readFileSync(file, 'utf8');
}

test('email "a b@c.test"', ({}, testInfo) => {
  expect(sign(testInfo, 'first')).toBe('first');
});

test('email "a.b@@c.test"', ({}, testInfo) => {
  expect(sign(testInfo, 'second')).toBe('second');
});
