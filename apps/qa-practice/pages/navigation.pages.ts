import type { Locator, Page } from '@playwright/test';
import { Accordion } from '../components/accordion.component';
import { TabList } from '../components/tablist.component';
import { moduleHeading, openModule } from '../support/module';

/** /ui-elements/tabs/ — three tabs, active tab mirrored in the URL hash. */
export class TabsPage {
  static readonly path = '/ui-elements/tabs/';
  readonly heading: Locator;
  readonly tabs: TabList;

  constructor(private readonly page: Page) {
    this.heading = moduleHeading(page, 'Tabs');
    this.tabs = new TabList(page.locator('body'), 'Project tabs');
  }

  /** Opens the page, optionally with a deep-link hash such as "#logs". */
  async goto(hash = ''): Promise<void> {
    await openModule(this.page, { path: `${TabsPage.path}${hash}`, heading: this.heading, ready: this.tabs.tab('Overview') });
  }
}

/** /ui-elements/accordions/ — single-open accordion. */
export class AccordionsPage {
  static readonly path = '/ui-elements/accordions/';
  readonly heading: Locator;
  readonly accordion: Accordion;

  constructor(private readonly page: Page) {
    this.heading = moduleHeading(page, 'Accordions');
    this.accordion = new Accordion(page.getByTestId('accordion-demo'));
  }

  async goto(): Promise<void> {
    await openModule(this.page, { path: AccordionsPage.path, heading: this.heading, ready: this.accordion.header('Account') });
  }
}
