import type { Locator } from '@playwright/test';

/** Six single-digit boxes with auto-advance (no accessible names in the app → test ids). */
export class OtpInput {
  readonly boxes: Locator;

  constructor(private readonly root: Locator) {
    this.boxes = root.getByTestId(/^kk-otp-\d$/);
  }

  box(index: number): Locator {
    return this.root.getByTestId(`kk-otp-${index}`);
  }

  /** Values of all six boxes, in order. */
  async values(): Promise<string[]> {
    return Promise.all((await this.boxes.all()).map((b) => b.inputValue()));
  }
}
