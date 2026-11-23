import type { Dialog, Locator, Page } from '@playwright/test';
import { moduleHeading, openModule } from '../support/module';

export type DialogAnswer = { accept: true; text?: string } | { accept: false };

/** /ui-elements/javascript-alerts/ — native alert, confirm and prompt dialogs. */
export class JavaScriptAlertsPage {
  static readonly path = '/ui-elements/javascript-alerts/';
  readonly heading: Locator;
  readonly alertButton: Locator;
  readonly confirmButton: Locator;
  readonly requiredPromptButton: Locator;
  readonly optionalPromptButton: Locator;
  readonly result: Locator;
  readonly promptValue: Locator;

  constructor(private readonly page: Page) {
    this.heading = moduleHeading(page, 'JavaScript Alerts');
    const demo = page.getByTestId('js-alerts-demo');
    this.alertButton = demo.getByRole('button', { name: 'Click for JS Alert', exact: true });
    this.confirmButton = demo.getByRole('button', { name: 'Click for JS Confirm', exact: true });
    this.requiredPromptButton = demo.getByRole('button', { name: 'Click for JS Prompt (Required)', exact: true });
    this.optionalPromptButton = demo.getByRole('button', { name: 'Click for JS Prompt (Optional)', exact: true });
    this.result = demo.getByTestId('js-dialog-result');
    this.promptValue = demo.getByTestId('js-prompt-value');
  }

  async goto(): Promise<void> {
    await openModule(this.page, { path: JavaScriptAlertsPage.path, heading: this.heading, ready: this.alertButton });
  }

  /**
   * Clicks `trigger` and answers the dialogs it opens, in order. Returns the
   * dialogs seen (type + message) so the test can assert on them. Native dialogs
   * block the page, so the handler is registered before the click.
   */
  async answerDialogs(trigger: Locator, answers: DialogAnswer[]): Promise<{ type: string; message: string }[]> {
    const seen: { type: string; message: string }[] = [];
    const queue = [...answers];
    const handler = async (dialog: Dialog) => {
      seen.push({ type: dialog.type(), message: dialog.message() });
      const answer = queue.shift() ?? { accept: false };
      if (answer.accept) await dialog.accept(answer.text);
      else await dialog.dismiss();
    };
    this.page.on('dialog', handler);
    try {
      await trigger.click();
    } finally {
      this.page.off('dialog', handler);
    }
    return seen;
  }
}
