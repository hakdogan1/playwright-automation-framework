import type { Locator, Page } from '@playwright/test';
import { moduleHeading, openModule } from '../support/module';

/**
 * /ui-elements/date-picker/ — a time input, a toggleable calendar of the viewed month and a
 * read-only "combined" field "HH:MM - DD/MM/YYYY". Picking a day closes the calendar.
 * The calendar opens on the current month: goto() fixes "today" with setFixedTime() (Date only;
 * timers and animation frames stay real), as for the Date Range Picker.
 */
export class DatePickerPage {
  static readonly path = '/ui-elements/date-picker/';
  readonly heading: Locator;
  readonly panel: Locator;
  readonly time: Locator;
  readonly combined: Locator;
  readonly toggle: Locator;
  readonly viewMonth: Locator;
  readonly prevMonth: Locator;
  readonly nextMonth: Locator;
  readonly cells: Locator;

  constructor(private readonly page: Page) {
    this.heading = moduleHeading(page, 'Date Picker');
    this.panel = page.getByTestId('date-picker-panel');
    this.time = this.panel.getByLabel('Time (24h)', { exact: true });
    this.combined = this.panel.getByTestId('date-input');
    this.toggle = this.panel.getByTestId('date-open');
    this.viewMonth = this.panel.getByTestId('date-view-month');
    this.prevMonth = this.panel.getByRole('button', { name: 'Previous month', exact: true });
    this.nextMonth = this.panel.getByRole('button', { name: 'Next month', exact: true });
    this.cells = this.panel.locator('[data-testid^="date-cell-"]');
  }

  day(n: number): Locator {
    return this.panel.getByTestId(`date-cell-${n}`);
  }

  async goto(today: string): Promise<void> {
    await this.page.clock.setFixedTime(new Date(today));
    await openModule(this.page, { path: DatePickerPage.path, heading: this.heading, ready: this.toggle });
  }

  async openCalendar(): Promise<void> {
    await this.toggle.click();
    await this.day(1).waitFor();
  }
}
