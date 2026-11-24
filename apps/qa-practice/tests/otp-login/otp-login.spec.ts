import type { Request } from '@playwright/test';
import { test, expect, tc } from '../../fixtures';
import { OTP } from '../../data/otp-files.data';

// Oracles come from the app source (OtpLoginWidget, forms.tsx, 3d14d23). The OTP is a fixed demo
// code shown on the page; no request, e-mail or storage is involved (TC-OTP-002 checks the network).
// The code is not bound to the username, and a rejected resend keeps the old session: OBS-10.

test.describe('OTP Login', () => {
  test.beforeEach(async ({ otpLoginPage }) => {
    await otpLoginPage.goto();
  });

  test('starts idle with six empty digit boxes', { tag: ['@smoke'], annotation: [tc('TC-OTP-001')] }, async ({ otpLoginPage: o }) => {
    await expect(o.result).toHaveText(OTP.idle);
    await expect(o.result).toHaveAttribute('data-state', 'idle');
    await expect(o.result).toHaveAttribute('role', 'status');
    await expect(o.fetch).toHaveText(OTP.fetch);
    await expect(o.otp.boxes).toHaveCount(6);
    for (const i of [0, 1, 2, 3, 4, 5]) await expect(o.otp.box(i)).toHaveAccessibleName(`OTP digit ${i + 1}`);
    expect(await o.otp.values()).toEqual(['', '', '', '', '', '']);
  });

  test('request, type the demo code and verify — without any write request', { tag: ['@smoke'], annotation: [tc('TC-OTP-002')] }, async ({ otpLoginPage: o, page }) => {
    const requests: Request[] = [];
    page.on('request', (r) => requests.push(r));

    await test.step('Enter a username and press "Fetch OTP"', async () => {
      await o.username.fill(OTP.username);
      await o.fetch.click();
    });

    await expect(o.result).toHaveText(OTP.sent);
    await expect(o.result).toHaveAttribute('data-state', 'success');
    await expect(o.fetch).toHaveText(OTP.resend);

    await test.step('Type the demo code and press "Verify OTP"', async () => {
      await o.typeCode(OTP.demoCode);
      await o.verify.click();
    });

    expect(await o.otp.values()).toEqual(OTP.demoCode.split(''));
    await expect(o.result).toHaveText(OTP.verified);
    await expect(o.result).toHaveAttribute('data-state', 'success');
    // Next.js may prefetch route chunks with GET; nothing else may leave the page.
    expect(requests.filter((r) => r.method() !== 'GET').map((r) => `${r.method()} ${r.url()}`), 'requests other than GET').toEqual([]);
    expect(requests.filter((r) => r.postData() !== null).map((r) => r.url()), 'requests with a body').toEqual([]);
  });

  for (const [label, username] of [
    ['an empty', ''],
    ['a whitespace-only', '   '],
  ] as const) {
    test(`fetching with ${label} username is refused`, { tag: ['@negative'], annotation: [tc('TC-OTP-003')] }, async ({ otpLoginPage: o }) => {
      await o.username.fill(username);
      await o.fetch.click();

      await expect(o.result).toHaveText(OTP.noUsername);
      await expect(o.result).toHaveAttribute('data-state', 'error');
      await expect(o.fetch).toHaveText(OTP.fetch);
    });
  }

  test('verifying before requesting an OTP is refused', { tag: ['@negative'], annotation: [tc('TC-OTP-004')] }, async ({ otpLoginPage: o }) => {
    await o.typeCode(OTP.demoCode);
    await o.verify.click();

    await expect(o.result).toHaveText(OTP.notRequested);
    await expect(o.result).toHaveAttribute('data-state', 'error');
  });

  test('an incomplete code is refused', { tag: ['@negative'], annotation: [tc('TC-OTP-005')] }, async ({ otpLoginPage: o }) => {
    await o.username.fill(OTP.username);
    await o.fetch.click();
    await o.typeCode('12345');
    await o.verify.click();

    await expect(o.result).toHaveText(OTP.incomplete);
  });

  test('a wrong code is refused', { tag: ['@negative'], annotation: [tc('TC-OTP-006')] }, async ({ otpLoginPage: o }) => {
    await o.username.fill(OTP.username);
    await o.fetch.click();
    await o.typeCode('654321');
    await o.verify.click();

    await expect(o.result).toHaveText(OTP.invalid);
    await expect(o.result).toHaveAttribute('data-state', 'error');
  });

  test('a pasted code is spread over the boxes and non-digits are dropped', { tag: ['@edge'], annotation: [tc('TC-OTP-007')] }, async ({ otpLoginPage: o }) => {
    await o.username.fill(OTP.username);
    await o.fetch.click();

    await test.step('Paste the demo code into the first box', () => o.otp.box(0).fill(OTP.demoCode));

    expect(await o.otp.values()).toEqual(OTP.demoCode.split(''));
    await o.verify.click();
    await expect(o.result).toHaveText(OTP.verified);

    // Six characters fit the box (maxLength 6); the letter is dropped and the digits move up.
    // A formatted code longer than six characters ("123 456") is cut by maxLength: OBS-10.
    await test.step('Resend, then paste "12a456" into the first box', async () => {
      await o.fetch.click();
      await o.otp.box(0).fill('12a456');
    });

    expect(await o.otp.values()).toEqual(['1', '2', '4', '5', '6', '']);
  });

  test('a code pasted into the fourth box fills only the remaining boxes', { tag: ['@edge'], annotation: [tc('TC-OTP-008')] }, async ({ otpLoginPage: o }) => {
    await o.username.fill(OTP.username);
    await o.fetch.click();

    await test.step('Paste "987654" into box 4', () => o.otp.box(3).fill('987654'));

    expect(await o.otp.values()).toEqual(['', '', '', '9', '8', '7']);
  });

  test('"Resend OTP" clears the entered digits', { tag: ['@functional'], annotation: [tc('TC-OTP-009')] }, async ({ otpLoginPage: o }) => {
    await o.username.fill(OTP.username);
    await o.fetch.click();
    await o.typeCode('654321');
    await o.verify.click();
    await expect(o.result).toHaveText(OTP.invalid);

    await test.step('Press "Resend OTP"', () => o.fetch.click());

    expect(await o.otp.values()).toEqual(['', '', '', '', '', '']);
    await expect(o.result).toHaveText(OTP.sent);
  });

  test('editing the username or a digit clears the previous result', { tag: ['@functional'], annotation: [tc('TC-OTP-010')] }, async ({ otpLoginPage: o }) => {
    await o.username.fill(OTP.username);
    await o.fetch.click();
    await o.typeCode('654321');
    await o.verify.click();
    await expect(o.result).toHaveText(OTP.invalid);

    await test.step('Change the last digit', () => o.otp.box(5).fill('9'));

    await expect(o.result).toHaveText(OTP.idle);

    await o.verify.click();
    await expect(o.result).toHaveText(OTP.invalid);

    await test.step('Change the username', () => o.username.fill(`${OTP.username}-2`));

    await expect(o.result).toHaveText(OTP.idle);
    await expect(o.result).toHaveAttribute('data-state', 'idle');
  });
});
