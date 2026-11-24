import { test, expect, tc } from '../../fixtures';
import { DATE_PICKER, pickDayLabel } from '../../data/embed-dates.data';
import { chipPart } from '../../data/date-range.data';

// Oracles come from the app source (DatePickerWidget, forms.tsx; lib/datetime-display.ts, 3d14d23).
// "Today" is fixed to 15 January 2026 with page.clock.setFixedTime (Date only; timers stay real).
// The shared time parsing shows hour 00 as 09 and an empty time as 09:00 here too: recorded in
// docs/observations/OBS-06, not asserted here.

const jan = (day: number, time: string) => chipPart(time, day, 1, 2026);

test.describe('Date Picker', () => {
  test.beforeEach(async ({ datePickerPage }) => {
    await datePickerPage.goto(DATE_PICKER.today);
  });

  test('starts empty and the calendar shows the current month', { tag: ['@smoke'], annotation: [tc('TC-DTP-001')] }, async ({ datePickerPage: d }) => {
    await expect(d.combined).toHaveValue('');
    await expect(d.combined).toHaveAttribute('placeholder', DATE_PICKER.placeholder);
    await expect(d.combined).toHaveAttribute('readonly', '');
    await expect(d.time).toHaveValue(DATE_PICKER.defaultTime);
    await expect(d.toggle).toHaveText(DATE_PICKER.open.closed);
    await expect(d.cells).toHaveCount(0);

    await test.step('Open the calendar', () => d.openCalendar());

    await expect(d.toggle).toHaveText(DATE_PICKER.open.open);
    await expect(d.viewMonth).toHaveText(pickDayLabel(2026, 1));
    await expect(d.cells).toHaveCount(31);
  });

  test('picking a day fills the combined field and closes the calendar', { tag: ['@smoke'], annotation: [tc('TC-DTP-002')] }, async ({ datePickerPage: d }) => {
    await d.openCalendar();

    await test.step('Pick 10 January', () => d.day(10).click());

    await expect(d.combined).toHaveValue(jan(10, DATE_PICKER.defaultTime));
    await expect(d.cells).toHaveCount(0);
    await expect(d.toggle).toHaveText(DATE_PICKER.open.closed);
  });

  test('the time is applied before and after the day is picked', { tag: ['@functional'], annotation: [tc('TC-DTP-003')] }, async ({ datePickerPage: d }) => {
    await d.time.fill('08:15');
    await d.openCalendar();
    await d.day(3).click();
    await expect(d.combined).toHaveValue(jan(3, '08:15'));

    await test.step('Change the time to 23:59', () => d.time.fill('23:59'));

    await expect(d.combined).toHaveValue(jan(3, '23:59'));
  });

  test('picking another day replaces the date', { tag: ['@functional'], annotation: [tc('TC-DTP-004')] }, async ({ datePickerPage: d }) => {
    await d.openCalendar();
    await d.day(10).click();

    await test.step('Reopen and pick 20 January', async () => {
      await d.openCalendar();
      await d.day(20).click();
    });

    await expect(d.combined).toHaveValue(jan(20, DATE_PICKER.defaultTime));
  });

  test('a day in another month and year can be picked, and the calendar reopens there', { tag: ['@edge'], annotation: [tc('TC-DTP-005')] }, async ({ datePickerPage: d }) => {
    await d.openCalendar();

    await test.step('Go to December 2025 and pick 31', async () => {
      await d.prevMonth.click();
      await expect(d.viewMonth).toHaveText(pickDayLabel(2025, 12));
      await d.day(31).click();
    });

    await expect(d.combined).toHaveValue(chipPart(DATE_PICKER.defaultTime, 31, 12, 2025));

    await test.step('Reopen the calendar', () => d.openCalendar());

    await expect(d.viewMonth).toHaveText(pickDayLabel(2025, 12));
  });

  test('29 February exists in a leap year', { tag: ['@edge'], annotation: [tc('TC-DTP-006')] }, async ({ datePickerPage: d }) => {
    await test.step('Open the page with today = 15 February 2028', () => d.goto('2028-02-15T12:00:00Z'));

    await d.openCalendar();

    await expect(d.cells).toHaveCount(29);

    await test.step('Pick 29 February', () => d.day(29).click());

    await expect(d.combined).toHaveValue(chipPart(DATE_PICKER.defaultTime, 29, 2, 2028));
  });

  test('changing the time or closing the calendar without a day leaves the field empty', { tag: ['@negative'], annotation: [tc('TC-DTP-007')] }, async ({ datePickerPage: d }) => {
    await test.step('Change the time to 14:30', () => d.time.fill('14:30'));

    await expect(d.combined).toHaveValue('');

    await test.step('Open and close the calendar without picking', async () => {
      await d.openCalendar();
      await d.toggle.click();
    });

    await expect(d.cells).toHaveCount(0);
    await expect(d.combined).toHaveValue('');
  });
});
