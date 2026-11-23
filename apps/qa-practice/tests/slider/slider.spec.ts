import { test, expect, tc } from '../../fixtures';
import { SLIDER_BUGS, SliderPage } from '../../pages/slider.page';

const ALL_BUGS_OFF = { dragStale: false, clickOffset: false, keyboardBlocked: false, displayOffByOne: false };

test.describe('Slider Interaction Lab', () => {
  test.beforeEach(async ({ sliderPage }) => {
    await sliderPage.goto();
  });

  test('defaults: value 25, all bug switches on, display off by one', { tag: ['@smoke'], annotation: [tc('TC-SLD-001')] }, async ({ sliderPage: s }) => {
    await expect(s.slider).toHaveValue('25');
    await expect(s.slider).toHaveAttribute('aria-valuetext', '25 of 100');
    for (const bug of SLIDER_BUGS) await expect(s.bugSwitch(bug)).toBeChecked();
    await expect(s.currentValue).toHaveText('26 / 100');
    await expect(s.feedback).toHaveAttribute('data-state', 'error');
  });

  test('with all bug switches off the values are consistent', { tag: ['@functional'], annotation: [tc('TC-SLD-002')] }, async ({ sliderPage: s }) => {
    await test.step('Turn every bug switch off', () => s.setBugs(ALL_BUGS_OFF));

    await expect(s.currentValue).toHaveText('25 / 100');
    await expect(s.percentage).toHaveText('25%');
    await expect(s.submittedValue).toHaveText('25');
    await expect(s.feedback).toHaveAttribute('data-state', 'success');
  });

  test('direct input commits the value', { tag: ['@functional'], annotation: [tc('TC-SLD-003')] }, async ({ sliderPage: s }) => {
    await s.setBugs(ALL_BUGS_OFF);

    await test.step('Enter 60 in "Direct input"', () => s.directInput.fill('60'));

    await expect(s.slider).toHaveValue('60');
    await expect(s.currentValue).toHaveText('60 / 100');
    await expect(s.submittedValue).toHaveText('60');
    await expect(s.lastInteraction).toHaveText('direct input');
    await expect(s.eventLog.getByTestId('slider-event-change').first()).toContainText('value 60 · direct input');
  });

  for (const { typed, expected } of [
    { typed: '150', expected: '100' },
    { typed: '-5', expected: '0' },
    { typed: '100', expected: '100' },
    { typed: '0', expected: '0' },
  ]) {
    test(`direct input ${typed} is clamped to ${expected}`, { tag: ['@edge'], annotation: [tc('TC-SLD-004')] }, async ({ sliderPage: s }) => {
      await s.setBugs(ALL_BUGS_OFF);

      await test.step(`Enter ${typed} in "Direct input"`, () => s.directInput.fill(typed));

      await expect(s.slider).toHaveValue(expected);
      await expect(s.submittedValue).toHaveText(expected);
    });
  }

  test('arrow keys move the value when keyboard input is allowed', { tag: ['@functional'], annotation: [tc('TC-SLD-005')] }, async ({ sliderPage: s }) => {
    await s.setBugs(ALL_BUGS_OFF);

    await test.step('Focus the slider, press ArrowRight 3 times and ArrowLeft once', async () => {
      await s.slider.focus();
      for (const key of ['ArrowRight', 'ArrowRight', 'ArrowRight', 'ArrowLeft']) await s.slider.press(key);
    });

    await expect(s.slider).toHaveValue('27');
    await expect(s.submittedValue).toHaveText('27');
    await expect(s.lastInteraction).toHaveText('keyboard');
  });

  test('the "keyboard blocked" switch stops arrow keys', { tag: ['@negative'], annotation: [tc('TC-SLD-006')] }, async ({ sliderPage: s }) => {
    await s.setBugs({ ...ALL_BUGS_OFF, keyboardBlocked: true });

    await test.step('Focus the slider and press ArrowRight', async () => {
      await s.slider.focus();
      await s.slider.press('ArrowRight');
    });

    await expect(s.slider).toHaveValue('25');
    await expect(s.eventLog.getByTestId('slider-event-input').first()).toContainText('keyboard blocked');
  });

  // Oracle: with "drag stale" ON, pointer MOVEMENT never commits, so the submitted value stays
  // at the value the slider had when the mouse was pressed. The press itself may move the value
  // only by pointer rounding (centrePressTolerance): Chromium/WebKit stay at 50, Firefox moves it
  // to the pointer and the app commits that as a click (see TC-SLD.md). A larger press change
  // (e.g. a click offset) fails the test instead of becoming the new expected value.
  test('a mouse drag updates the submitted value only when "drag stale" is off', { tag: ['@edge'], annotation: [tc('TC-SLD-007')] }, async ({ sliderPage: s }, testInfo) => {
    let pressValue = 0;
    let trackWidth = 0;

    await test.step('Drag stale ON: set 50, then drag the thumb from the centre to the right end', async () => {
      await s.setBugs({ ...ALL_BUGS_OFF, dragStale: true });
      await s.directInput.fill('50');
      await expect(s.submittedValue).toHaveText('50');
      ({ pressValue, trackWidth } = await s.dragFromCenter(1));
    });

    expect(Math.abs(pressValue - 50), `press at the centre moved 50 → ${pressValue} on a ${trackWidth} px track`).toBeLessThanOrEqual(SliderPage.centrePressTolerance(trackWidth));

    // Recorded on every run so engine differences stay visible in the report (Firefox: ≠ 50).
    testInfo.annotations.push({ type: 'drag-press-value', description: `value after mousedown: ${pressValue} (started at 50, track ${trackWidth} px, tolerance ${SliderPage.centrePressTolerance(trackWidth)})` });

    expect(Number(await s.slider.inputValue()), 'the thumb moved right of the press point').toBeGreaterThan(pressValue);
    await expect(s.lastInteraction).toHaveText('drag');
    await expect(s.eventLog.getByTestId('slider-event-mousemove').first()).toContainText('dragging');
    await expect(s.submittedValue).toHaveText(String(pressValue));
    await expect(s.feedback).toHaveAttribute('data-state', 'error');

    await test.step('Reset, turn drag stale OFF, set 50 and drag again', async () => {
      await s.reset.click();
      await s.setBugs({ dragStale: false });
      await s.directInput.fill('50');
      ({ pressValue, trackWidth } = await s.dragFromCenter(1));
    });

    expect(Math.abs(pressValue - 50), `press at the centre moved 50 → ${pressValue} on a ${trackWidth} px track`).toBeLessThanOrEqual(SliderPage.centrePressTolerance(trackWidth));
    expect(Number(await s.slider.inputValue()), 'the thumb moved right of the press point').toBeGreaterThan(pressValue);
    await expect(s.lastInteraction).toHaveText('drag');
    await expect(s.submittedValue).toHaveText(await s.slider.inputValue());
    await expect(s.feedback).toHaveAttribute('data-state', 'success');
  });

  test('Reset lab restores the initial value and clears the event log', { tag: ['@functional'], annotation: [tc('TC-SLD-008')] }, async ({ sliderPage: s }) => {
    await s.setBugs(ALL_BUGS_OFF);
    await s.directInput.fill('80');
    await expect(s.submittedValue).toHaveText('80');

    await test.step('Press "Reset lab"', () => s.reset.click());

    await expect(s.slider).toHaveValue('25');
    await expect(s.submittedValue).toHaveText('25');
    await expect(s.lastInteraction).toHaveText('none');
    await expect(s.eventLog).toContainText('No slider events yet.');
  });
});
