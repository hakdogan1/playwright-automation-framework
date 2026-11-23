import { expect, type Locator, type Page } from '@playwright/test';
import { ProfileDialog, StorefrontCart, StorefrontCatalog } from '../components/storefront.component';
import { BUG_PLAYGROUND_PATH, DEMO_SESSION_STORAGE } from '../data/bug-playground.data';
import { pauseClock } from '../support/clock';
import { waitForHydration } from '../support/ready';

/** /bug-playground/ — the "Northwind QA Supplies" mini storefront with 15 seeded defects. */
export class BugPlaygroundPage {
  readonly app: Locator;
  readonly catalog: StorefrontCatalog;
  readonly cart: StorefrontCart;
  readonly profile: ProfileDialog;
  readonly accountTrigger: Locator;
  readonly editProfile: Locator;
  readonly logout: Locator;
  readonly promoInput: Locator;
  readonly promoApply: Locator;
  readonly toast: Locator;
  readonly chatToggle: Locator;
  /** Decorative presence dot inside the chat toggle (aria-hidden). */
  readonly chatStatusDot: Locator;
  readonly chatPanel: Locator;
  readonly shippingPolicy: Locator;
  readonly checkoutFeedback: Locator;
  /** Lab chrome link shown to signed-out visitors. */
  readonly signInToLab: Locator;

  constructor(private readonly page: Page) {
    this.app = page.getByRole('region', { name: 'Bug Playground demo mini app' });
    this.catalog = new StorefrontCatalog(this.app);
    this.cart = new StorefrontCart(this.app);
    this.profile = new ProfileDialog(this.app);
    this.accountTrigger = this.app.getByRole('button', { name: /^Account · / });
    this.editProfile = this.app.getByRole('button', { name: 'Edit profile', exact: true });
    this.logout = this.app.getByRole('button', { name: 'Logout', exact: true });
    this.promoInput = this.app.getByLabel('Promo', { exact: true });
    this.promoApply = this.app.getByRole('button', { name: 'Apply', exact: true });
    // Several role="status" regions exist (session banner, checkout); the toast has a stable test id.
    this.toast = this.app.getByTestId('bug-play-micro-toast');
    this.chatToggle = this.app.getByRole('button', { name: 'Live chat', exact: true });
    this.chatStatusDot = this.chatToggle.locator('span[aria-hidden]').first();
    this.chatPanel = this.app.getByTestId('bug-play-chat-panel');
    this.shippingPolicy = this.app.getByRole('button', { name: 'Shipping policy', exact: true });
    this.checkoutFeedback = this.app.getByTestId('bug-play-checkout-feedback');
    this.signInToLab = page.getByRole('link', { name: /^Sign in to lab/ });
  }

  /**
   * Opens the playground. The playground requires sign-in ("Login required"), so the
   * app's own offline demo session flag is set first — no credentials, no Supabase
   * sign-in. With `freezeTimers`, Playwright's clock is installed and paused, so the 420 ms toasts stay
   * visible (install() alone kept following real time and the toast could expire before the check).
   */
  async goto(options: { freezeTimers?: boolean } = {}): Promise<void> {
    // Only set the flag on the first load, so a logout within the test is not undone by a reload.
    await this.page.addInitScript(({ key, value }) => {
      if (!window.sessionStorage.getItem('pqf-demo-seeded')) {
        window.localStorage.setItem(key, value);
        window.sessionStorage.setItem('pqf-demo-seeded', '1');
      }
    }, DEMO_SESSION_STORAGE);
    if (options.freezeTimers) await this.page.clock.install();
    await this.page.goto(BUG_PLAYGROUND_PATH);
    await expect(this.app).toBeVisible();
    await waitForHydration(this.catalog.addButton('Latency Meter Mk II'));
    if (options.freezeTimers) await pauseClock(this.page);
  }

  async openProfile(): Promise<void> {
    await this.accountTrigger.click();
    await this.editProfile.click();
    await expect(this.profile.dialog).toBeVisible();
  }

  /** Value of the app's demo-session flag in localStorage (null when signed out). */
  async demoSessionFlag(): Promise<string | null> {
    return this.page.evaluate((key) => window.localStorage.getItem(key), DEMO_SESSION_STORAGE.key);
  }
}
