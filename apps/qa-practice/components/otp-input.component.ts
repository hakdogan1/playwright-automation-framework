import type { Locator } from '@playwright/test';

/**
 * Six single-digit boxes with auto-advance, addressed by test id `<prefix><index>`.
 * Keyboard Keys uses `kk-otp-` (the default); OTP Login uses `otp-login-digit-`.
 */
export class OtpInput {
  readonly boxes: Locator;

  constructor(
    private readonly root: Locator,
    private readonly prefix = 'kk-otp-',
  ) {
    this.boxes = root.getByTestId(new RegExp(`^${prefix}\\d$`));
  }

  box(index: number): Locator {
    return this.root.getByTestId(`${this.prefix}${index}`);
  }

  /** Values of all six boxes, in order. */
  async values(): Promise<string[]> {
    return Promise.all((await this.boxes.all()).map((b) => b.inputValue()));
  }
}
