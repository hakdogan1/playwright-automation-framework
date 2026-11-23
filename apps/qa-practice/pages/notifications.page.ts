import type { Locator, Page } from '@playwright/test';
import { pauseClock } from '../support/clock';
import { moduleHeading, openModule } from '../support/module';

export type NotificationKind = 'success' | 'info' | 'warning' | 'error';

/** /ui-elements/notifications/ — toasts with auto-dismiss (success/info 3.2 s, warning 4.5 s; error stays). */
export class NotificationsPage {
  static readonly path = '/ui-elements/notifications/';
  readonly heading: Locator;
  readonly region: Locator;
  readonly emptyState: Locator;
  /** All toasts in display order. */
  readonly toasts: Locator;

  constructor(private readonly page: Page) {
    this.heading = moduleHeading(page, 'Notifications');
    this.region = page.getByTestId('toast-region');
    this.emptyState = this.region.getByText(/^No notifications yet\./);
    this.toasts = this.region.getByTestId(/^toast-(success|info|warning|error)-message$/);
  }

  trigger(kind: NotificationKind): Locator {
    return this.page.getByTestId('notification-controls').getByRole('button', { name: kind[0]?.toUpperCase() + kind.slice(1), exact: true });
  }

  toast(kind: NotificationKind): Locator {
    return this.region.getByTestId(`toast-${kind}-message`);
  }

  closeButton(kind: NotificationKind): Locator {
    return this.region.getByRole('button', { name: `Close ${kind} notification`, exact: true });
  }

  /** Install Playwright's clock first so auto-dismiss timers are controlled by the test. */
  /** With freezeTimers the fake clock is installed and paused: only advance() moves time. */
  async goto(options: { freezeTimers?: boolean } = {}): Promise<void> {
    if (options.freezeTimers) await this.page.clock.install();
    await openModule(this.page, { path: NotificationsPage.path, heading: this.heading, ready: this.trigger('success') });
    if (options.freezeTimers) await pauseClock(this.page);
  }

  async advance(ms: number): Promise<void> {
    await this.page.clock.runFor(ms);
  }

  /**
   * Lets time flow again. A dismissed toast stays in the DOM until its exit animation ends, and
   * that animation does not finish on the paused clock (measured: removal took 1.8–3.4 real s
   * after resume in Chromium, Firefox and WebKit).
   */
  async resumeRealTime(): Promise<void> {
    await this.page.clock.resume();
  }
}
