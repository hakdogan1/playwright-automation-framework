import type { Locator, Page } from '@playwright/test';
import { LabForm } from '../components/lab-form.component';
import { REGISTER_SUBMIT_DELAY_MS, type Registration } from '../data/form-register.data';
import { pauseClock } from '../support/clock';
import { moduleHeading, openModule } from '../support/module';

/** Field ids used by the app for the register form. */
const FIELD_IDS: Record<keyof Registration, string> = {
  firstName: 'first-name',
  lastName: 'last-name',
  username: 'username',
  email: 'email',
  password: 'password',
  confirmPassword: 'confirm-password',
  country: 'country',
  terms: 'terms',
};

/**
 * /ui-elements/form-register/ — client-side register form (no network, no account is created).
 * Timers are always faked and paused (page.clock) so the 360 ms validation delay is advanced
 * exactly instead of being waited for in real time.
 */
export class FormRegisterPage {
  static readonly path = '/ui-elements/form-register/';
  readonly heading: Locator;
  readonly form: LabForm;

  constructor(private readonly page: Page) {
    this.heading = moduleHeading(page, 'Register Form');
    this.form = new LabForm(page.locator('body'), 'form-register');
  }

  field(name: keyof Registration): Locator {
    return this.form.field(FIELD_IDS[name]);
  }

  /** Sets only the given fields; text values are used exactly as given (spaces included). */
  async fill(values: Partial<Registration>): Promise<void> {
    for (const [name, value] of Object.entries(values) as [keyof Registration, string | boolean][]) {
      const field = this.field(name);
      if (name === 'terms') await field.setChecked(value as boolean);
      else if (name === 'country') await field.selectOption(value as string);
      else await field.fill(value as string);
    }
  }

  /** Submits and advances the fake clock past the validation delay. */
  async submit(): Promise<void> {
    await this.form.submit.click();
    await this.advance(REGISTER_SUBMIT_DELAY_MS);
  }

  async advance(ms: number): Promise<void> {
    await this.page.clock.runFor(ms);
  }

  async reload(): Promise<void> {
    await this.page.reload();
    await openModule(this.page, { path: FormRegisterPage.path, heading: this.heading, ready: this.form.submit });
    await pauseClock(this.page);
  }

  async goto(): Promise<void> {
    await this.page.clock.install();
    await openModule(this.page, { path: FormRegisterPage.path, heading: this.heading, ready: this.form.submit });
    await pauseClock(this.page);
  }
}
