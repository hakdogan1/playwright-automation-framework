import type { Locator, Page } from '@playwright/test';
import { ContextMenu } from '../components/context-menu.component';
import { moduleHeading, openModule } from '../support/module';

/** /ui-elements/double-click/ — double-click a label to edit it inline. */
export class DoubleClickPage {
  static readonly path = '/ui-elements/double-click/';
  readonly heading: Locator;
  readonly label: Locator;
  readonly editor: Locator;
  readonly save: Locator;

  constructor(private readonly page: Page) {
    this.heading = moduleHeading(page, 'Double Click');
    const panel = page.getByTestId('dbl-panel');
    this.label = panel.getByTestId('dbl-label');
    // The inline editor has no label in the app; its test id is the stable hook.
    this.editor = panel.getByTestId('dbl-input');
    this.save = panel.getByRole('button', { name: 'Save', exact: true });
  }

  async goto(): Promise<void> {
    await openModule(this.page, { path: DoubleClickPage.path, heading: this.heading, ready: this.label });
  }
}

/** /ui-elements/right-click/ — right-click a target to open a custom menu. */
export class RightClickPage {
  static readonly path = '/ui-elements/right-click/';
  readonly heading: Locator;
  readonly target: Locator;
  readonly selection: Locator;
  readonly menu: ContextMenu;

  constructor(private readonly page: Page) {
    this.heading = moduleHeading(page, 'Right Click');
    this.target = page.getByText('Right-click anywhere in this panel');
    this.selection = page.getByTestId('ctx-selection');
    this.menu = new ContextMenu(page);
  }

  async goto(): Promise<void> {
    await openModule(this.page, { path: RightClickPage.path, heading: this.heading, ready: this.target });
  }
}
