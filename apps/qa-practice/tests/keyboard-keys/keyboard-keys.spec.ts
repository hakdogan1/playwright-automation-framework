import { test, expect, tc } from '../../fixtures';
import { KEYBOARD, PASSWORD_STRENGTH } from '../../data/phase2c.data';

test.describe('Keyboard Keys', () => {
  test('the playground reports typing, last key and validation', { tag: ['@smoke'], annotation: [tc('TC-KEY-001')] }, async ({ keyboardKeysPage: kk }) => {
    await kk.goto();
    await kk.openDetails();
    await expect(kk.metric('Validation state')).toHaveText('Empty');

    await test.step('Type "abc123456789" and press Space', async () => {
      await kk.liveInput.pressSequentially('abc123456789');
      await kk.liveInput.press('Space');
    });

    await expect(kk.metric('Characters typed')).toHaveText('13');
    await expect(kk.metric('Last key pressed')).toHaveText('Space');
    await expect(kk.metric('Validation state')).toHaveText('Valid');
  });

  test('validation stays Invalid below 12 characters or without a digit', { tag: ['@negative'], annotation: [tc('TC-KEY-002')] }, async ({ keyboardKeysPage: kk }) => {
    await kk.goto();
    await kk.openDetails();
    for (const value of ['abc12345678', 'abcdefghijklm']) {
      await test.step(`Type "${value}"`, () => kk.liveInput.fill(value));

      await expect(kk.metric('Validation state')).toHaveText('Invalid');
    }

    await test.step('Type exactly 12 characters with letters and digits', () => kk.liveInput.fill('abcdef123456'));

    await expect(kk.metric('Validation state')).toHaveText('Valid');
  });

  test('OTP boxes auto-advance and accept digits only', { tag: ['@functional'], annotation: [tc('TC-KEY-003')] }, async ({ keyboardKeysPage: kk }) => {
    await kk.goto();

    await test.step('Type "4a2" into the first box', async () => {
      await kk.otp.box(0).click();
      await kk.typeKeys('4a2');
    });

    expect(await kk.otp.values()).toEqual(['4', '2', '', '', '', '']);
    await expect(kk.otp.box(2)).toBeFocused();
  });

  test('Backspace in an empty OTP box moves focus back', { tag: ['@edge'], annotation: [tc('TC-KEY-004')] }, async ({ keyboardKeysPage: kk }) => {
    await kk.goto();

    await test.step('Type "12" then press Backspace in the empty third box', async () => {
      await kk.otp.box(0).click();
      await kk.typeKeys('12');
      await expect(kk.otp.box(2)).toBeFocused();
      await kk.pressKey('Backspace');
    });

    await expect(kk.otp.box(1)).toBeFocused();
    expect(await kk.otp.values()).toEqual(['1', '2', '', '', '', '']);
  });

  test('search shows a spinner, then debounced results', { tag: ['@functional'], annotation: [tc('TC-KEY-005')] }, async ({ keyboardKeysPage: kk }) => {
    await kk.goto({ freezeTimers: true });

    await test.step('Type "Playwright"', () => kk.search.fill('Playwright'));

    await expect(kk.searchSpinner).toBeVisible();
    await expect(kk.searchResults).toHaveCount(0);

    await test.step(`Advance the clock just before the ${KEYBOARD.searchDebounceMs} ms debounce`, () => kk.advance(KEYBOARD.searchDebounceMs - 50));

    await expect(kk.searchSpinner).toBeVisible();

    await test.step('Advance past the debounce', () => kk.advance(100));

    await expect(kk.searchSpinner).toBeHidden();
    await expect(kk.searchResults).toHaveText([...KEYBOARD.searchResults]);
  });

  test('a search without "play" reports no strong matches', { tag: ['@negative'], annotation: [tc('TC-KEY-006')] }, async ({ keyboardKeysPage: kk }) => {
    await kk.goto({ freezeTimers: true });

    await test.step('Type "cypress" and wait for the debounce', async () => {
      await kk.search.fill('cypress');
      await kk.advance(KEYBOARD.searchDebounceMs + 50);
    });

    await expect(kk.searchResults).toHaveText(['No strong matches for “cypress…”']);
  });

  for (const { value, label, score } of PASSWORD_STRENGTH.slice(1)) {
    test(`password "${value}" rates ${label} (${score}/4)`, { tag: ['@edge'], annotation: [tc('TC-KEY-007')] }, async ({ keyboardKeysPage: kk }) => {
      await kk.goto();

      await test.step(`Type the password "${value}"`, () => kk.password.fill(value));

      await expect(kk.strengthLabel()).toHaveText(`${label} · score ${score}/4 (challenge needs ≥3)`);
    });
  }

  test('phone mask formats digits, strips letters and stops at 10 digits', { tag: ['@functional'], annotation: [tc('TC-KEY-008')] }, async ({ keyboardKeysPage: kk }) => {
    await kk.goto();

    await test.step('Type "555abc123456789"', async () => {
      await kk.phone.click();
      await kk.typeKeys('555abc123456789');
    });

    await expect(kk.phone).toHaveValue('(555) 123-4567');
    await expect(kk.phoneModule).toContainText('Digits captured: 10/10');
  });

  test('the disabled input cannot be focused or edited', { tag: ['@negative'], annotation: [tc('TC-KEY-009')] }, async ({ keyboardKeysPage: kk }) => {
    await kk.goto();
    await expect(kk.disabledInput).toBeDisabled();
    await expect(kk.disabledInput).toHaveValue(KEYBOARD.disabledValue);
    await expect(kk.disabledInput).not.toBeEditable();
  });

  test('completing OTP, search, strong password and phone passes the challenge', { tag: ['@functional'], annotation: [tc('TC-KEY-010')] }, async ({ keyboardKeysPage: kk }) => {
    await kk.goto();
    await expect(kk.challengeComplete).toHaveCount(0);

    await test.step('Fill all six OTP digits', async () => {
      await kk.otp.box(0).click();
      await kk.typeKeys('123456');
    });

    await test.step('Search "Playwright"', () => kk.search.fill('Playwright'));

    await expect(kk.searchResults).toHaveCount(KEYBOARD.searchResults.length);

    await test.step('Type a strong password and a full phone number', async () => {
      await kk.password.fill('Abcdefg1!');
      await kk.phone.fill('5551234567');
    });

    await expect(kk.challengeComplete).toHaveText(/SUCCESS — all QA inputs passed/);
  });
});
