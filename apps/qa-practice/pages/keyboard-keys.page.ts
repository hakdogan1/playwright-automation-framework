import type { Locator, Page } from '@playwright/test';
import { OtpInput } from '../components/otp-input.component';
import { pauseClock } from '../support/clock';
import { moduleHeading, openModule } from '../support/module';

/**
 * /ui-elements/keyboard-keys/ — typing playground, OTP, debounced search,
 * password strength, phone mask and a disabled input.
 * Most inputs in the app have no labels, so test ids are the stable hooks.
 */
export class KeyboardKeysPage {
  static readonly path = '/ui-elements/keyboard-keys/';
  readonly heading: Locator;
  readonly liveInput: Locator;
  readonly liveDetails: Locator;
  readonly otp: OtpInput;
  readonly search: Locator;
  readonly searchSpinner: Locator;
  readonly searchResults: Locator;
  readonly password: Locator;
  readonly passwordModule: Locator;
  readonly phone: Locator;
  readonly phoneModule: Locator;
  readonly disabledInput: Locator;
  readonly challengeComplete: Locator;

  constructor(private readonly page: Page) {
    this.heading = moduleHeading(page, 'Keyboard Keys');
    this.liveInput = page.getByTestId('kk-live-input');
    this.liveDetails = page.getByTestId('kk-section-playground').locator('details');
    this.otp = new OtpInput(page.getByTestId('kk-module-otp'));
    const search = page.getByTestId('kk-module-search');
    this.search = search.getByTestId('kk-search-input');
    this.searchSpinner = search.getByLabel('Loading');
    this.searchResults = search.getByTestId('kk-search-results').getByRole('listitem');
    this.passwordModule = page.getByTestId('kk-module-password');
    this.password = this.passwordModule.getByTestId('kk-password-input');
    this.phoneModule = page.getByTestId('kk-module-phone');
    this.phone = this.phoneModule.getByTestId('kk-phone-input');
    this.disabledInput = page.getByTestId('kk-disabled-input');
    this.challengeComplete = page.getByTestId('kk-challenge-complete');
  }

  /** "Strong · score 3/4 (challenge needs ≥3)" */
  strengthLabel(): Locator {
    return this.passwordModule.getByText(/· score \d\/4/);
  }

  /** A metric in the "Show live keyboard details" panel, e.g. "Last key pressed". */
  metric(label: string): Locator {
    return this.liveDetails.getByText(label, { exact: true }).locator('xpath=following-sibling::*[1]');
  }

  async openDetails(): Promise<void> {
    await this.liveDetails.getByText('Show live keyboard details').click();
  }

  /** Types into whatever element currently has focus (OTP auto-advance, masks). */
  async typeKeys(text: string): Promise<void> {
    await this.page.keyboard.type(text);
  }

  async pressKey(key: string): Promise<void> {
    await this.page.keyboard.press(key);
  }

  /** Advances the installed fake clock (requires goto({ freezeTimers: true })). */
  async advance(ms: number): Promise<void> {
    await this.page.clock.runFor(ms);
  }

  /** With freezeTimers the fake clock is installed and paused: only advance() moves time. */
  async goto(options: { freezeTimers?: boolean } = {}): Promise<void> {
    if (options.freezeTimers) await this.page.clock.install();
    await openModule(this.page, { path: KeyboardKeysPage.path, heading: this.heading, ready: this.liveInput });
    if (options.freezeTimers) await pauseClock(this.page);
  }
}
