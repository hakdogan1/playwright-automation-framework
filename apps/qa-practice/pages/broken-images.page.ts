import type { Locator, Page } from '@playwright/test';
import type { ImageBugKey } from '../data/broken-images.data';
import { pauseClock } from '../support/clock';
import { moduleHeading, openModule } from '../support/module';

/**
 * /ui-elements/broken-images/ (Image Handling Lab) — five image cards (working, 404, slow, 403,
 * corrupted) with status chips, retry buttons, fallbacks and four intentional bug switches that
 * are ON by default. The slow image's 1.4 s delay is a timer; tests that need it install and pause
 * the fake clock (goto({ freezeTimers: true })).
 *
 * The initial status of each card is NOT a reliable oracle: an image that loads or fails before
 * React hydrates never reports it (measured: all five stay "loading" in Chromium, some in Firefox
 * and WebKit; OBS-08). retryLoad() remounts the image after hydration, so its events are handled.
 */
export class BrokenImagesPage {
  static readonly path = '/ui-elements/broken-images/';
  readonly heading: Locator;
  readonly lab: Locator;
  readonly failedCount: Locator;
  readonly loadingCount: Locator;
  readonly layoutStatus: Locator;
  readonly reset: Locator;

  constructor(private readonly page: Page) {
    this.heading = moduleHeading(page, 'Image Handling Lab');
    this.lab = page.getByTestId('image-handling-lab');
    this.failedCount = this.lab.getByTestId('image-lab-failed-count');
    this.loadingCount = this.lab.getByTestId('image-lab-loading-count');
    this.layoutStatus = this.lab.getByTestId('image-lab-layout-status');
    this.reset = this.lab.getByRole('button', { name: 'Reset images', exact: true });
  }

  card(id: number): Locator {
    return this.lab.getByTestId(`image-card-${id}`);
  }

  status(id: number): Locator {
    return this.lab.getByTestId(`image-status-${id}`);
  }

  image(id: number): Locator {
    return this.lab.getByTestId(`image-${id}`);
  }

  fallback(id: number): Locator {
    return this.lab.getByTestId(`image-error-${id}`);
  }

  altText(id: number): Locator {
    return this.lab.getByTestId(`image-alt-${id}`);
  }

  retry(id: number): Locator {
    return this.card(id).getByRole('button', { name: 'Retry load', exact: true });
  }

  /**
   * Presses "Retry load": the card gets a new <img> element, mounted by React, so its result is
   * reported. The app disables Retry once the working image reported "loaded" (Firefox often
   * catches that load during hydration); then there is nothing to retry and the click is skipped.
   * Race-free: goto() waits for the window load event (all images settled) and for hydration, so
   * no late image event can change the button between the check and the click.
   */
  async retryLoad(id: number): Promise<void> {
    if (await this.retry(id).isEnabled()) await this.retry(id).click();
  }

  bugSwitch(key: ImageBugKey): Locator {
    return this.lab.getByTestId(`image-bug-${key}`);
  }

  async setBugs(bugs: Partial<Record<ImageBugKey, boolean>>): Promise<void> {
    for (const [key, on] of Object.entries(bugs) as [ImageBugKey, boolean][]) await this.bugSwitch(key).setChecked(on);
  }

  async goto(options: { freezeTimers?: boolean } = {}): Promise<void> {
    if (options.freezeTimers) await this.page.clock.install();
    await openModule(this.page, { path: BrokenImagesPage.path, heading: this.heading, ready: this.reset });
    if (options.freezeTimers) await pauseClock(this.page);
  }

  async advance(ms: number): Promise<void> {
    await this.page.clock.runFor(ms);
  }
}
