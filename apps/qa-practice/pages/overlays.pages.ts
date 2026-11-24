import type { Locator, Page } from '@playwright/test';
import { pauseClock } from '../support/clock';
import { moduleHeading, openModule } from '../support/module';

/** /ui-elements/alerts/ — one button that opens a native confirm; a chip shows the answer. */
export class AlertsPage {
  static readonly path = '/ui-elements/alerts/';
  readonly heading: Locator;
  readonly fire: Locator;
  readonly result: Locator;

  constructor(private readonly page: Page) {
    this.heading = moduleHeading(page, 'Alerts');
    const demo = page.getByTestId('alert-demo');
    this.fire = demo.getByRole('button', { name: 'Fire confirm', exact: true });
    this.result = demo.getByTestId('alert-result');
  }

  /** Fires the confirm and answers it; returns the dialog type and message. */
  async answerConfirm(accept: boolean): Promise<{ type: string; message: string }> {
    const dialog = this.page.waitForEvent('dialog').then(async (d) => {
      const seen = { type: d.type(), message: d.message() };
      if (accept) await d.accept();
      else await d.dismiss();
      return seen;
    });
    await this.fire.click();
    return dialog;
  }

  async goto(): Promise<void> {
    await openModule(this.page, { path: AlertsPage.path, heading: this.heading, ready: this.fire });
  }
}

export type ToastKind = 'success' | 'error';

/** /ui-elements/toasts/ — success toasts auto-dismiss after 5 s; error toasts stay until Close. */
export class ToastsPage {
  static readonly path = '/ui-elements/toasts/';
  readonly heading: Locator;
  readonly region: Locator;
  readonly emptyState: Locator;
  /** All toasts in display order (role status = success, alert = error). */
  readonly toasts: Locator;

  constructor(private readonly page: Page) {
    this.heading = moduleHeading(page, 'Toast Messages');
    this.region = page.getByTestId('toast-region');
    this.emptyState = this.region.getByText('No active toast messages.', { exact: true });
    this.toasts = this.region.locator('[role="status"], [role="alert"]');
  }

  trigger(kind: ToastKind): Locator {
    return this.page.getByTestId('toast-controls').getByRole('button', { name: `Show ${kind} scenario`, exact: true });
  }

  toast(kind: ToastKind): Locator {
    return this.region.getByRole(kind === 'success' ? 'status' : 'alert');
  }

  closeButtons(): Locator {
    return this.region.getByRole('button', { name: 'Close error toast', exact: true });
  }

  /** With freezeTimers the fake clock is installed and paused: only advance() moves time. */
  async goto(options: { freezeTimers?: boolean } = {}): Promise<void> {
    if (options.freezeTimers) await this.page.clock.install();
    await openModule(this.page, { path: ToastsPage.path, heading: this.heading, ready: this.trigger('success') });
    if (options.freezeTimers) await pauseClock(this.page);
  }

  async advance(ms: number): Promise<void> {
    await this.page.clock.runFor(ms);
  }

  /** A removed toast stays in the DOM until its exit animation ends, which needs real time. */
  async resumeRealTime(): Promise<void> {
    await this.page.clock.resume();
  }
}
