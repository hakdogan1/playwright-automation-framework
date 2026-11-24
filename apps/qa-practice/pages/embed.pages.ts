import type { Locator, Page } from '@playwright/test';
import { moduleHeading, openModule } from '../support/module';

/**
 * /ui-elements/shadow-dom/ — a button and a counter inside an open shadow root attached by the app.
 * Playwright locators pierce open shadow roots, so they are used as for any other element.
 */
export class ShadowDomPage {
  static readonly path = '/ui-elements/shadow-dom/';
  readonly heading: Locator;
  readonly host: Locator;
  readonly button: Locator;
  readonly counter: Locator;

  constructor(private readonly page: Page) {
    this.heading = moduleHeading(page, 'Shadow DOM');
    this.host = page.getByTestId('shadow-host');
    this.button = this.host.getByRole('button', { name: 'Increment (inside shadow)', exact: true });
    this.counter = this.host.getByTestId('shadow-counter');
  }

  async goto(): Promise<void> {
    await openModule(this.page, { path: ShadowDomPage.path, heading: this.heading, ready: this.host });
  }
}

/** /ui-elements/new-tab/ — a target="_blank" link to a destination page. */
export class NewTabPage {
  static readonly path = '/ui-elements/new-tab/';
  static readonly destinationPath = '/ui-elements/new-tab/destination/';
  readonly heading: Locator;
  readonly link: Locator;

  constructor(private readonly page: Page) {
    this.heading = moduleHeading(page, 'New Tab / Window');
    this.link = page.getByTestId('new-tab-demo').getByRole('link', { name: 'Open destination ↗', exact: true });
  }

  /** Clicks the link and returns the new tab once its document has loaded. */
  async openDestination(): Promise<Page> {
    const popup = this.page.waitForEvent('popup');
    await this.link.click();
    const tab = await popup;
    await tab.waitForLoadState();
    return tab;
  }

  async goto(): Promise<void> {
    await openModule(this.page, { path: NewTabPage.path, heading: this.heading, ready: this.link });
  }
}
