import { expect, type Locator, type Page } from '@playwright/test';
import { PasswordRules } from '../components/password-rules.component';
import { waitForHydration } from '../support/ready';

/** /ui-elements/inputs/ — email + password form with client-side validation. */
export class InputsPage {
  static readonly path = '/ui-elements/inputs/';

  readonly heading: Locator;
  readonly form: Locator;
  readonly email: Locator;
  readonly emailError: Locator;
  readonly password: Locator;
  readonly passwordRules: PasswordRules;
  readonly signIn: Locator;
  readonly result: Locator;

  constructor(private readonly page: Page) {
    this.heading = page.getByRole('heading', { level: 1, name: 'Inputs' });
    this.form = page.getByTestId('login-form');
    this.email = this.form.getByLabel('Work Email');
    this.emailError = this.form.getByTestId('email-error');
    this.password = this.form.getByLabel('Password', { exact: true });
    this.passwordRules = new PasswordRules(this.form.getByTestId('input-password-rules'));
    this.signIn = this.form.getByRole('button', { name: 'Sign in', exact: true });
    this.result = this.form.getByTestId('input-result');
  }

  async goto(): Promise<void> {
    await this.page.goto(InputsPage.path);
    await expect(this.heading).toBeVisible();
    await waitForHydration(this.signIn);
  }

  async submit(credentials: { email: string; password: string }): Promise<void> {
    await this.email.fill(credentials.email);
    await this.password.fill(credentials.password);
    await this.signIn.click();
  }
}
