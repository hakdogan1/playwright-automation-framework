import type { Locator, Page } from '@playwright/test';
import { moduleHeading, openModule } from '../support/module';

export type SliderBug = 'dragStale' | 'clickOffset' | 'keyboardBlocked' | 'displayOffByOne';
export const SLIDER_BUGS: readonly SliderBug[] = ['dragStale', 'clickOffset', 'keyboardBlocked', 'displayOffByOne'];

/** /ui-elements/slider/ — range input lab with four intentional bug switches (all on by default). */
export class SliderPage {
  static readonly path = '/ui-elements/slider/';
  readonly heading: Locator;
  readonly slider: Locator;
  readonly directInput: Locator;
  readonly feedback: Locator;
  readonly currentValue: Locator;
  readonly percentage: Locator;
  readonly lastInteraction: Locator;
  readonly submittedValue: Locator;
  readonly eventLog: Locator;
  readonly reset: Locator;

  constructor(private readonly page: Page) {
    this.heading = moduleHeading(page, 'Slider Interaction Lab');
    const lab = page.getByTestId('slider-lab');
    this.slider = lab.getByLabel('Test slider');
    this.directInput = lab.getByLabel('Direct input');
    this.feedback = lab.getByTestId('slider-feedback');
    // Each metric card is "<label><value>"; the value is the last paragraph.
    this.currentValue = lab.getByTestId('slider-current-value').locator('p').last();
    this.percentage = lab.getByTestId('slider-percentage').locator('p').last();
    this.lastInteraction = lab.getByTestId('slider-last-interaction').locator('p').last();
    this.submittedValue = lab.getByTestId('slider-submitted-value').locator('p').last();
    this.eventLog = lab.getByTestId('slider-event-log');
    this.reset = lab.getByRole('button', { name: 'Reset lab', exact: true });
  }

  bugSwitch(bug: SliderBug): Locator {
    return this.page.getByTestId(`slider-bug-${bug}`);
  }

  async setBugs(enabled: Partial<Record<SliderBug, boolean>>): Promise<void> {
    for (const [bug, on] of Object.entries(enabled) as [SliderBug, boolean][]) {
      await this.bugSwitch(bug).setChecked(on);
    }
  }

  /**
   * Drags the thumb with the mouse from the track centre to `to` (fraction of the track width).
   * Returns the slider value right after mousedown (before any movement) and the track width.
   *
   * Starting at value 50 puts the thumb centre at the track centre in every engine, so the press
   * lands on the thumb. Engines differ on the press itself: Firefox moves the value to the pointer
   * position on mousedown and fires `input`, which the app records as a "click" and commits;
   * Chromium/WebKit change nothing until the pointer moves (TC-SLD-007, docs: TC-SLD.md).
   */
  async dragFromCenter(to: number): Promise<{ pressValue: number; trackWidth: number }> {
    const value = await this.slider.inputValue();
    if (value !== '50') throw new Error(`dragFromCenter needs the slider at 50, it is at ${value}`);
    // Raw mouse coordinates are viewport-relative: the slider must be on screen.
    await this.slider.scrollIntoViewIfNeeded();
    const box = await this.slider.boundingBox();
    if (!box) throw new Error('Slider is not visible');
    const y = box.y + box.height / 2;
    await this.page.mouse.move(box.x + box.width / 2, y);
    await this.page.mouse.down();
    const pressValue = Number(await this.slider.inputValue());
    await this.page.mouse.move(box.x + box.width * to, y, { steps: 10 });
    await this.page.mouse.up();
    return { pressValue, trackWidth: box.width };
  }

  /**
   * Largest value change a press at the exact track centre may cause: half a CSS pixel of pointer
   * rounding, in value units, plus half a step. One CSS pixel is 100 / (width − thumb) units; with
   * the thumb at most half the track that is ≤ 200 / width, so half a pixel is ≤ 100 / width.
   * Anything larger is not pointer rounding but a real change (e.g. a click offset).
   */
  static centrePressTolerance(trackWidth: number): number {
    return Math.floor(100 / trackWidth + 0.5);
  }

  async goto(): Promise<void> {
    await openModule(this.page, { path: SliderPage.path, heading: this.heading, ready: this.slider });
  }
}
