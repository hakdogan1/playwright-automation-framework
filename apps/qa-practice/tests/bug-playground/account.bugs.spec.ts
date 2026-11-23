import { test, expect, tc, bug } from '../../fixtures';
import { SETTLED_MS } from '../../data/bug-playground.data';
import { control, expected, reproduce } from './support';

test.describe('Bug Playground — account and profile defects', () => {
  test.describe('BUG-BP-04 logout does not clear the session', () => {
    // The playground requires sign-in; tests use the app's offline demo session flag (no credentials).
    // While a session exists the app tries to sync bug progress with Supabase; the guard
    // blocks that read, so no write is ever attempted (see docs/bug-reports/BUG-BP-04.md).
    test('reproduce: after Logout the demo session is still active', reproduce(tc('TC-BUG-004'), bug('BUG-BP-04')), async ({ bugPlaygroundPage: bp }) => {
      await bp.goto({ freezeTimers: true });
      await expect(bp.accountTrigger).toHaveText('Account · Demo');

      await test.step('Open the account menu and press "Logout"', async () => {
        await bp.accountTrigger.click();
        await bp.logout.click();
      });

      await expect(bp.toast).toHaveText('Signed out locally');
      await expect(bp.accountTrigger).toHaveText('Account · Demo');
      expect(await bp.demoSessionFlag(), 'demo session flag after logout').toBe('1');
    });

    test.fail('expected: Logout ends the session', expected(tc('TC-BUG-004'), bug('BUG-BP-04')), async ({ bugPlaygroundPage: bp }) => {
      await bp.goto();

      await test.step('Open the account menu and press "Logout"', async () => {
        await bp.accountTrigger.click();
        await bp.logout.click();
      });

      // Signed out = the lab offers "Sign in to lab" again and the session flag is gone.
      await expect(bp.signInToLab).toBeVisible({ timeout: SETTLED_MS });
      expect(await bp.demoSessionFlag()).toBeNull();
    });
  });

  test.describe('BUG-BP-07 required display name accepts whitespace only', () => {
    test('reproduce: a name of spaces is saved', reproduce(tc('TC-BUG-007'), bug('BUG-BP-07')), async ({ bugPlaygroundPage: bp }) => {
      await bp.goto({ freezeTimers: true });
      await bp.openProfile();

      await test.step('Enter three spaces as display name and press Save', async () => {
        await bp.profile.name.fill('   ');
        await bp.profile.save.click();
      });

      await expect(bp.profile.dialog).toBeHidden();
      await expect(bp.toast).toHaveText('Profile saved');
    });

    test('control: an empty name is rejected with an alert', control(tc('TC-BUG-007'), bug('BUG-BP-07')), async ({ bugPlaygroundPage: bp, page }) => {
      await bp.goto();
      await bp.openProfile();
      const alerts: string[] = [];
      // Native alerts block the page; the handler must answer it or the click never returns.
      page.once('dialog', async (d) => {
        alerts.push(d.message());
        await d.accept();
      });

      await test.step('Press Save with an empty name', () => bp.profile.save.click());

      expect(alerts).toEqual(['Display name required.']);
      await expect(bp.profile.dialog).toBeVisible();
    });

    test.fail('expected: a whitespace-only name is rejected', expected(tc('TC-BUG-007'), bug('BUG-BP-07')), async ({ bugPlaygroundPage: bp }) => {
      await bp.goto();
      await bp.openProfile();

      await test.step('Enter three spaces as display name and press Save', async () => {
        await bp.profile.name.fill('   ');
        await bp.profile.save.click();
      });

      await expect(bp.profile.dialog).toBeVisible({ timeout: SETTLED_MS });
      await expect(bp.toast).not.toHaveText('Profile saved', { timeout: SETTLED_MS });
    });
  });

  test.describe('BUG-BP-10 newsletter consent is pre-checked', () => {
    test('reproduce: the marketing checkbox starts checked', reproduce(tc('TC-BUG-010'), bug('BUG-BP-10')), async ({ bugPlaygroundPage: bp }) => {
      await bp.goto();
      await bp.openProfile();
      await expect(bp.profile.newsletter).toBeChecked();
    });

    test.fail('expected: consent starts unchecked (explicit opt-in)', expected(tc('TC-BUG-010'), bug('BUG-BP-10')), async ({ bugPlaygroundPage: bp }) => {
      await bp.goto();
      await bp.openProfile();
      await expect(bp.profile.newsletter).not.toBeChecked({ timeout: SETTLED_MS });
    });
  });
});
