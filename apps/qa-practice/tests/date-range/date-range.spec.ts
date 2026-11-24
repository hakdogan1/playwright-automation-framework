import { test, expect, tc } from '../../fixtures';
import { DEFAULT_TIMES, EMPTY_CHIP, MONTH_LENGTHS, OPEN_LABEL, TODAY, chip, chipPart, monthLabel } from '../../data/date-range.data';

// Oracles come from the app source (DateRangeWidget, extras.tsx; lib/datetime-display.ts, 3d14d23).
// "Today" is fixed to 15 January 2026 with page.clock.setFixedTime (Date only; timers stay real).
// Measured defects (midnight hours shown as 09, empty time shown as 09:00, end before start on the
// same day accepted, no weekday alignment) are in docs/observations/OBS-06, not asserted here.

const { year: Y, month: M } = TODAY;
const jan = (day: number, time: string) => chipPart(time, day, 1, 2026);

test.describe('Date Range Picker', () => {
  test.beforeEach(async ({ dateRangePage }) => {
    await dateRangePage.goto(TODAY.iso);
  });

  test('starts empty with default times and toggles the calendar of the current month', { tag: ['@smoke'], annotation: [tc('TC-DTR-001')] }, async ({ dateRangePage: dr }) => {
    await expect(dr.chip).toHaveText(EMPTY_CHIP);
    await expect(dr.startTime).toHaveValue(DEFAULT_TIMES.start);
    await expect(dr.endTime).toHaveValue(DEFAULT_TIMES.end);
    await expect(dr.toggle).toHaveText(OPEN_LABEL.closed);
    await expect(dr.cells).toHaveCount(0);

    await test.step('Open the calendar', () => dr.openCalendar());

    await expect(dr.toggle).toHaveText(OPEN_LABEL.open);
    await expect(dr.viewMonth).toHaveText(monthLabel(Y, M));
    await expect(dr.cells).toHaveCount(31);
    await expect(dr.cells.first()).toHaveText('1');
    await expect(dr.cells.last()).toHaveText('31');

    await test.step('Close the calendar', () => dr.toggle.click());

    await expect(dr.toggle).toHaveText(OPEN_LABEL.closed);
    await expect(dr.cells).toHaveCount(0);
  });

  test('picking a start and a later end day shows the range with the default times', { tag: ['@smoke'], annotation: [tc('TC-DTR-002')] }, async ({ dateRangePage: dr }) => {
    await dr.openCalendar();

    await test.step('Pick 10 January', () => dr.pick(10));

    await expect(dr.chip).toHaveText(chip(jan(10, DEFAULT_TIMES.start), '—'));

    await test.step('Pick 20 January', () => dr.pick(20));

    await expect(dr.chip).toHaveText(chip(jan(10, DEFAULT_TIMES.start), jan(20, DEFAULT_TIMES.end)));
  });

  test('an end day before the start day swaps the two', { tag: ['@functional'], annotation: [tc('TC-DTR-003')] }, async ({ dateRangePage: dr }) => {
    await dr.openCalendar();

    await test.step('Pick 20 January, then 10 January', () => dr.pick(20, 10));

    await expect(dr.chip).toHaveText(chip(jan(10, DEFAULT_TIMES.start), jan(20, DEFAULT_TIMES.end)));
  });

  test('start and end times are applied to the range, also after the days are picked', { tag: ['@functional'], annotation: [tc('TC-DTR-004')] }, async ({ dateRangePage: dr }) => {
    await test.step('Set the times to 08:15 and 18:45', async () => {
      await dr.startTime.fill('08:15');
      await dr.endTime.fill('18:45');
    });

    await dr.openCalendar();

    await test.step('Pick 3 and 9 January', () => dr.pick(3, 9));

    await expect(dr.chip).toHaveText(chip(jan(3, '08:15'), jan(9, '18:45')));

    await test.step('Change the start time to 07:05 and the end time to 23:59', async () => {
      await dr.startTime.fill('07:05');
      await dr.endTime.fill('23:59');
    });

    await expect(dr.chip).toHaveText(chip(jan(3, '07:05'), jan(9, '23:59')));
  });

  test('a third pick starts a new range', { tag: ['@functional'], annotation: [tc('TC-DTR-005')] }, async ({ dateRangePage: dr }) => {
    await dr.openCalendar();
    await dr.pick(10, 20);

    await test.step('Pick 25 January', () => dr.pick(25));

    await expect(dr.chip).toHaveText(chip(jan(25, DEFAULT_TIMES.start), '—'));

    await test.step('Pick 5 January', () => dr.pick(5));

    await expect(dr.chip).toHaveText(chip(jan(5, DEFAULT_TIMES.start), jan(25, DEFAULT_TIMES.end)));
  });

  test('Reset clears the days but keeps the times, the open calendar and the viewed month', { tag: ['@functional'], annotation: [tc('TC-DTR-006')] }, async ({ dateRangePage: dr }) => {
    await dr.startTime.fill('10:30');
    await dr.openCalendar();
    await dr.nextMonth.click();
    await dr.pick(2, 12);
    await expect(dr.chip).toHaveText(chip(chipPart('10:30', 2, 2, 2026), chipPart(DEFAULT_TIMES.end, 12, 2, 2026)));

    await test.step('Press Reset', () => dr.reset.click());

    await expect(dr.chip).toHaveText(EMPTY_CHIP);
    await expect(dr.startTime).toHaveValue('10:30');
    await expect(dr.endTime).toHaveValue(DEFAULT_TIMES.end);
    await expect(dr.toggle).toHaveText(OPEN_LABEL.open);
    await expect(dr.viewMonth).toHaveText(monthLabel(2026, 2));
  });

  test('picking the same day twice gives a one-day range', { tag: ['@edge'], annotation: [tc('TC-DTR-007')] }, async ({ dateRangePage: dr }) => {
    await dr.openCalendar();

    await test.step('Pick 15 January twice', () => dr.pick(15, 15));

    await expect(dr.chip).toHaveText(chip(jan(15, DEFAULT_TIMES.start), jan(15, DEFAULT_TIMES.end)));
  });

  test('month navigation crosses years and a range can span months in either order', { tag: ['@edge'], annotation: [tc('TC-DTR-008')] }, async ({ dateRangePage: dr }) => {
    await dr.openCalendar();

    await test.step('Go back to December 2025', () => dr.prevMonth.click());

    await expect(dr.viewMonth).toHaveText(monthLabel(2025, 12));
    await expect(dr.cells).toHaveCount(31);

    await test.step('Pick 28 December 2025, go to January 2026, pick 4 January', async () => {
      await dr.pick(28);
      await dr.nextMonth.click();
      await dr.pick(4);
    });

    await expect(dr.viewMonth).toHaveText(monthLabel(2026, 1));
    await expect(dr.chip).toHaveText(chip(chipPart(DEFAULT_TIMES.start, 28, 12, 2025), jan(4, DEFAULT_TIMES.end)));

    await test.step('Start a new range on 5 February, then pick 25 January', async () => {
      await dr.nextMonth.click();
      await dr.pick(5);
      await dr.prevMonth.click();
      await dr.pick(25);
    });

    await expect(dr.chip).toHaveText(chip(jan(25, DEFAULT_TIMES.start), chipPart(DEFAULT_TIMES.end, 5, 2, 2026)));
  });

  for (const m of MONTH_LENGTHS) {
    test(`the calendar of ${m.year}-${String(m.month).padStart(2, '0')} has ${m.days} days`, { tag: ['@edge'], annotation: [tc('TC-DTR-009')] }, async ({ dateRangePage: dr }) => {
      await test.step(`Open the page with today = ${m.iso}`, () => dr.goto(m.iso));

      await dr.openCalendar();

      await expect(dr.viewMonth).toHaveText(monthLabel(m.year, m.month));
      await expect(dr.cells).toHaveCount(m.days);
      await expect(dr.cells.last()).toHaveText(String(m.days));
    });
  }

  test('closing and reopening the calendar keeps the range and the viewed month', { tag: ['@edge'], annotation: [tc('TC-DTR-010')] }, async ({ dateRangePage: dr }) => {
    await dr.openCalendar();
    await dr.pick(6);
    await dr.nextMonth.click();
    await dr.pick(3);
    const range = chip(jan(6, DEFAULT_TIMES.start), chipPart(DEFAULT_TIMES.end, 3, 2, 2026));
    await expect(dr.chip).toHaveText(range);

    await test.step('Close and reopen the calendar', async () => {
      await dr.toggle.click();
      await expect(dr.cells).toHaveCount(0);
      await dr.openCalendar();
    });

    await expect(dr.chip).toHaveText(range);
    await expect(dr.viewMonth).toHaveText(monthLabel(2026, 2));
  });

  test('changing times or pressing Reset without picked days leaves the range empty', { tag: ['@negative'], annotation: [tc('TC-DTR-011')] }, async ({ dateRangePage: dr }) => {
    await test.step('Change both times and press Reset with the calendar closed', async () => {
      await dr.startTime.fill('06:00');
      await dr.endTime.fill('22:00');
      await dr.reset.click();
    });

    await expect(dr.chip).toHaveText(EMPTY_CHIP);
    await expect(dr.startTime).toHaveValue('06:00');
    await expect(dr.endTime).toHaveValue('22:00');
    await expect(dr.toggle).toHaveText(OPEN_LABEL.closed);

    await test.step('Open the calendar and press Reset without picking', async () => {
      await dr.openCalendar();
      await dr.reset.click();
    });

    await expect(dr.chip).toHaveText(EMPTY_CHIP);
    await expect(dr.viewMonth).toHaveText(monthLabel(Y, M));
  });
});
