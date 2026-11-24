import type { Locator, Page } from '@playwright/test';
import { pauseClock } from '../support/clock';
import { moduleHeading, openModule } from '../support/module';

/** Installs the fake clock before the page loads and pauses it once the page is ready. */
async function openWithPausedClock(page: Page, module: { path: string; heading: Locator; ready: Locator }): Promise<void> {
  await page.clock.install();
  await openModule(page, module);
  await pauseClock(page);
}

/** /ui-elements/loader/ — "Load metrics" shows a spinner for 1.6 s, then three metric cards. */
export class LoaderPage {
  static readonly path = '/ui-elements/loader/';
  readonly heading: Locator;
  readonly trigger: Locator;
  readonly forceError: Locator;
  readonly spinner: Locator;
  readonly card: Locator;
  readonly error: Locator;

  constructor(private readonly page: Page) {
    this.heading = moduleHeading(page, 'Loader / Spinner');
    const widget = page.getByTestId('loader-widget');
    this.trigger = widget.getByTestId('loader-trigger');
    this.forceError = widget.getByRole('button', { name: 'Force error', exact: true });
    this.spinner = widget.getByRole('status');
    this.card = widget.getByTestId('loader-card');
    this.error = widget.getByText(/^Service unavailable · /);
  }

  /** The value shown under a metric label. */
  metric(label: string): Locator {
    return this.card.locator('div').filter({ has: this.page.getByText(label, { exact: true }) }).locator('p').nth(1);
  }

  async goto(): Promise<void> {
    await openWithPausedClock(this.page, { path: LoaderPage.path, heading: this.heading, ready: this.trigger });
  }

  async advance(ms: number): Promise<void> {
    await this.page.clock.runFor(ms);
  }
}

/** /ui-elements/lazy-load/ — the button mounts a panel 1.2 s after the click. */
export class LazyLoadPage {
  static readonly path = '/ui-elements/lazy-load/';
  readonly heading: Locator;
  readonly trigger: Locator;
  readonly panel: Locator;

  constructor(private readonly page: Page) {
    this.heading = moduleHeading(page, 'Lazy Loaded Elements');
    const demo = page.getByTestId('lazy-load-demo');
    this.trigger = demo.getByTestId('lazy-trigger');
    this.panel = demo.getByTestId('lazy-panel');
  }

  async goto(): Promise<void> {
    await openWithPausedClock(this.page, { path: LazyLoadPage.path, heading: this.heading, ready: this.trigger });
  }

  async advance(ms: number): Promise<void> {
    await this.page.clock.runFor(ms);
  }

  /** A removed panel stays in the DOM until its exit animation ends, which needs real time. */
  async resumeRealTime(): Promise<void> {
    await this.page.clock.resume();
  }
}

/** /ui-elements/infinite-scroll/ — a scroll box that appends 12 items per load (350 ms) up to 60. */
export class InfiniteScrollPage {
  static readonly path = '/ui-elements/infinite-scroll/';
  readonly heading: Locator;
  readonly scroller: Locator;
  readonly items: Locator;
  readonly loader: Locator;
  readonly end: Locator;

  constructor(private readonly page: Page) {
    this.heading = moduleHeading(page, 'Infinite Scroll');
    this.scroller = page.getByTestId('inf-scroller');
    this.items = this.scroller.locator('[data-testid^="inf-item-"]');
    this.loader = this.scroller.getByTestId('inf-loader');
    this.end = this.scroller.getByText('End of stream', { exact: true });
  }

  item(n: number): Locator {
    return this.scroller.getByTestId(`inf-item-${n}`);
  }

  /**
   * Scrolls the box so that `gapPx` pixels remain below the visible area (0 = the very bottom).
   * Setting scrollTop fires a real scroll event; the wheel is not used because it is not
   * available the same way on the mobile (touch) project.
   *
   * Resolves once the browser has dispatched that scroll event (it is delivered with the next
   * rendering update, not synchronously: measured 2026-11-24, Firefox missed loads otherwise).
   * React handles scroll in the capture phase at its root, so the app's handler has run by then.
   */
  async scrollToGap(gapPx = 0): Promise<void> {
    await this.scroller.evaluate(
      (el, gap) =>
        new Promise<void>((resolve) => {
          const target = el.scrollHeight - el.clientHeight - gap;
          if (Math.abs(el.scrollTop - target) < 1) return resolve();
          el.addEventListener('scroll', () => resolve(), { once: true });
          el.scrollTop = target;
        }),
      gapPx,
    );
  }

  async goto(): Promise<void> {
    await openWithPausedClock(this.page, { path: InfiniteScrollPage.path, heading: this.heading, ready: this.scroller });
  }

  async advance(ms: number): Promise<void> {
    await this.page.clock.runFor(ms);
  }
}
