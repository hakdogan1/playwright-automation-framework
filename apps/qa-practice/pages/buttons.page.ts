import { expect, type Locator, type Page } from '@playwright/test';
import { waitForHydration } from '../support/ready';

/** /ui-elements/buttons/ — click, double-click, right-click, hover, disabled and loading buttons. */
export class ButtonsPage {
  static readonly path = '/ui-elements/buttons/';

  readonly heading: Locator;
  readonly clickButton: Locator;
  readonly doubleClickButton: Locator;
  readonly rightClickButton: Locator;
  readonly hoverButton: Locator;
  readonly hoverTooltip: Locator;
  readonly disabledButton: Locator;
  readonly tryDisabledButton: Locator;
  readonly disabledAttempts: Locator;
  readonly loadingButton: Locator;
  readonly loadingStatus: Locator;
  readonly feedbackPanel: Locator;
  readonly feedbackMessage: Locator;

  constructor(private readonly page: Page) {
    this.heading = page.getByRole('heading', { level: 1, name: 'Buttons' });
    this.clickButton = page.getByRole('button', { name: 'Click Me', exact: true });
    this.doubleClickButton = page.getByRole('button', { name: 'Double Click Me', exact: true });
    this.rightClickButton = page.getByRole('button', { name: 'Right Click Me', exact: true });
    this.hoverButton = page.getByRole('button', { name: 'Hover Over Me', exact: true });
    this.hoverTooltip = page.getByTestId('btn-hover-tooltip');
    this.disabledButton = page.getByRole('button', { name: 'Disabled Button', exact: true });
    this.tryDisabledButton = page.getByRole('button', { name: 'Try disabled button' });
    this.disabledAttempts = page.getByTestId('btn-disabled-attempts');
    // The accessible name changes (Click to Load → Loading… → Loaded), so the test id is the stable hook.
    this.loadingButton = page.getByTestId('btn-loading');
    this.loadingStatus = page.getByTestId('btn-status-loading');
    this.feedbackPanel = page.getByTestId('btn-feedback-panel');
    this.feedbackMessage = page.getByTestId('btn-feedback-message');
  }

  async goto(): Promise<void> {
    await this.page.goto(ButtonsPage.path);
    await expect(this.heading).toBeVisible();
    await waitForHydration(this.clickButton);
  }

  statusFor(variant: 'click' | 'double-click' | 'right-click'): Locator {
    return this.page.getByTestId(`btn-status-${variant}`);
  }
}
