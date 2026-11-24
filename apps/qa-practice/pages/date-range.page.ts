import { expect, type Locator, type Page } from '@playwright/test';
import { moduleHeading, openModule } from '../support/module';

/**
 * /ui-elements/date-range/ — two time inputs, a toggleable calendar of the viewed month and a chip
 * "HH:MM - DD/MM/YYYY → HH:MM - DD/MM/YYYY". Day cells have no accessible state, so the chip is
 * the oracle for the selection.
 *
 * The calendar opens on the current month: call goto() with a fixed date. setFixedTime() fixes
 * Date only and keeps timers and animation frames real (the open animation must run).
 */
export class DateRangePage {
  static readonly path = '/ui-elements/date-range/';
  readonly heading: Locator;
  readonly panel: Locator;
  readonly startTime: Locator;
  readonly endTime: Locator;
  readonly toggle: Locator;
  readonly reset: Locator;
  readonly chip: Locator;
  readonly viewMonth: Locator;
  readonly prevMonth: Locator;
  readonly nextMonth: Locator;
  readonly cells: Locator;

  constructor(private readonly page: Page) {
    this.heading = moduleHeading(page, 'Date Range Picker');
    this.panel = page.getByTestId('date-range-panel');
    this.startTime = this.panel.getByTestId('range-start-time');
    this.endTime = this.panel.getByTestId('range-end-time');
    this.toggle = this.panel.getByTestId('range-open');
    this.reset = this.panel.getByTestId('range-reset');
    this.chip = this.panel.getByTestId('range-chip');
    this.viewMonth = this.panel.getByTestId('range-view-month');
    this.prevMonth = this.panel.getByRole('button', { name: 'Previous month', exact: true });
    this.nextMonth = this.panel.getByRole('button', { name: 'Next month', exact: true });
    this.cells = this.panel.locator('[data-testid^="range-cell-"]');
  }

  day(n: number): Locator {
    return this.panel.getByTestId(`range-cell-${n}`);
  }

  /**
   * Picks the days one after another, like a user who sees each result before the next click.
   * Every pick changes the chip, so the page object waits for that before the next click.
   * Without the wait, a click can reach the app before React re-rendered the previous pick; the
   * app's handler then reads the old selection (measured once in WebKit, final run
   * 20261123T230900Z-155c28: picks 10, 20, 25 gave "10 → 25"). Readiness wait, not an assertion.
   */
  async pick(...days: number[]): Promise<void> {
    for (const d of days) {
      const before = await this.chip.textContent();
      await this.day(d).click();
      await expect(this.chip, `the pick of day ${d} is rendered`).not.toHaveText(before ?? '');
    }
  }

  async goto(today: string): Promise<void> {
    await this.page.clock.setFixedTime(new Date(today));
    await openModule(this.page, { path: DateRangePage.path, heading: this.heading, ready: this.toggle });
  }

  async openCalendar(): Promise<void> {
    await this.toggle.click();
    await this.day(1).waitFor();
  }
}
