import type { Locator, Page } from '@playwright/test';
import { OtpInput } from '../components/otp-input.component';
import { captureDownload, objectUrlLog, recordObjectUrls, type CapturedDownload } from '../support/downloads';
import { moduleHeading, openModule } from '../support/module';

/** /ui-elements/otp-login/ — username, "Fetch OTP", six digit boxes and "Verify OTP" (client-only demo). */
export class OtpLoginPage {
  static readonly path = '/ui-elements/otp-login/';
  readonly heading: Locator;
  readonly form: Locator;
  readonly username: Locator;
  readonly fetch: Locator;
  readonly otp: OtpInput;
  readonly verify: Locator;
  readonly result: Locator;

  constructor(private readonly page: Page) {
    this.heading = moduleHeading(page, 'OTP Login');
    this.form = page.getByTestId('otp-login-form');
    this.username = this.form.getByLabel('Username', { exact: true });
    this.fetch = this.form.getByTestId('otp-login-fetch');
    this.otp = new OtpInput(this.form, 'otp-login-digit-');
    this.verify = this.form.getByRole('button', { name: 'Verify OTP', exact: true });
    this.result = this.form.getByTestId('otp-login-result');
  }

  /** Types the code digit by digit into the first box; the app advances the focus. */
  async typeCode(code: string): Promise<void> {
    await this.otp.box(0).pressSequentially(code);
  }

  async goto(): Promise<void> {
    await openModule(this.page, { path: OtpLoginPage.path, heading: this.heading, ready: this.fetch });
  }
}

/** /ui-elements/pdf-download/ — one button that downloads a fixed PDF built as a Blob (no network). */
export class PdfDownloadPage {
  static readonly path = '/ui-elements/pdf-download/';
  readonly heading: Locator;
  readonly button: Locator;
  readonly result: Locator;

  constructor(private readonly page: Page) {
    this.heading = moduleHeading(page, 'PDF Download');
    const demo = page.getByTestId('pdf-download-demo');
    this.button = demo.getByRole('button', { name: 'Download sample PDF', exact: true });
    this.result = demo.getByTestId('pdf-download-result');
  }

  download(): Promise<CapturedDownload> {
    return captureDownload(this.page, () => this.button.click());
  }

  objectUrls() {
    return objectUrlLog(this.page);
  }

  async goto(): Promise<void> {
    await recordObjectUrls(this.page);
    await openModule(this.page, { path: PdfDownloadPage.path, heading: this.heading, ready: this.button });
  }
}

/** /ui-elements/generate-text-file/ — a textarea whose content is downloaded as a .txt Blob (no network). */
export class GenerateTextFilePage {
  static readonly path = '/ui-elements/generate-text-file/';
  readonly heading: Locator;
  readonly text: Locator;
  readonly button: Locator;
  readonly result: Locator;

  constructor(private readonly page: Page) {
    this.heading = moduleHeading(page, 'Generate Text File');
    const demo = page.getByTestId('generate-text-demo');
    this.text = demo.getByLabel('Text content', { exact: true });
    this.button = demo.getByRole('button', { name: 'Generate file', exact: true });
    this.result = demo.getByTestId('generated-text-result');
  }

  download(): Promise<CapturedDownload> {
    return captureDownload(this.page, () => this.button.click());
  }

  objectUrls() {
    return objectUrlLog(this.page);
  }

  async goto(): Promise<void> {
    await recordObjectUrls(this.page);
    await openModule(this.page, { path: GenerateTextFilePage.path, heading: this.heading, ready: this.button });
  }
}
