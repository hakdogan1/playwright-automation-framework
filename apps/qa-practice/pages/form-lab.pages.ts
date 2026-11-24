import type { Locator, Page } from '@playwright/test';
import { LabForm } from '../components/lab-form.component';
import { LAB_FORM_SUBMIT_DELAY_MS, type LabFormDefinition } from '../data/form-lab.data';
import type { SyntheticFile } from '../data/synthetic-files';
import { pauseClock } from '../support/clock';
import { moduleHeading, openModule } from '../support/module';

export type LabFieldValue = string | boolean | SyntheticFile;

/**
 * One configured Form Lab form: /ui-elements/form-login/, -contact/, -address/, -payment/,
 * -checkout/ and -profile/. The app renders all of them (and form-register) with one
 * configurable widget (`ConfiguredForm` in `form-lab.tsx`, 3d14d23), so one page object class
 * serves them; each module gets its own instance and definition (fields, title, path) from
 * `data/form-lab.data.ts`. Form Register keeps its own, older page object (TC-FRM).
 *
 * Timers are faked and paused (page.clock): submit() advances exactly the 360 ms validation delay.
 */
export class LabFormPage<F extends string = string> {
  readonly heading: Locator;
  readonly form: LabForm;
  /** "Success toast: …" or "Error toast: …" below the result. */
  readonly toast: Locator;

  constructor(
    private readonly page: Page,
    readonly definition: LabFormDefinition<F>,
  ) {
    this.heading = moduleHeading(page, definition.title);
    this.form = new LabForm(page.locator('body'), definition.slug);
    this.toast = this.form.result.getByTestId(`${definition.slug}-toast`);
  }

  field(name: F): Locator {
    return this.form.field(this.definition.fields[name]);
  }

  /**
   * Sets only the given fields; text values are used exactly as given (spaces included).
   * Choosing a file adds a "Selected: <name>" line, and the result panel below animates to its new
   * position (framer-motion `layout`, driven by animation frames). On the paused fake clock that
   * animation would stay frozen half-way over the Reset button (measured 2026-11-24, all three
   * engines), so the clock is advanced 1 s after a file is set. No form timer is pending then.
   */
  async fill(values: Partial<Record<F, LabFieldValue>>): Promise<void> {
    for (const [name, value] of Object.entries(values) as [F, LabFieldValue][]) {
      const field = this.field(name);
      if (typeof value === 'boolean') await field.setChecked(value);
      else if (typeof value === 'object') {
        await field.setInputFiles(value);
        await this.advance(1_000);
      } else if ((await field.evaluate((el) => el.tagName)) === 'SELECT') await field.selectOption(value);
      else await field.fill(value);
    }
  }

  /** Submits and advances the fake clock past the validation delay. */
  async submit(): Promise<void> {
    await this.form.submit.click();
    await this.advance(LAB_FORM_SUBMIT_DELAY_MS);
  }

  async advance(ms: number): Promise<void> {
    await this.page.clock.runFor(ms);
  }

  async goto(): Promise<void> {
    await this.page.clock.install();
    await openModule(this.page, { path: this.definition.path, heading: this.heading, ready: this.form.submit });
    await pauseClock(this.page);
  }
}

/** /ui-elements/form-multi-step/ — a five-step wizard with per-step validation (no timers). */
export class MultiStepFormPage {
  static readonly path = '/ui-elements/form-multi-step/';
  readonly heading: Locator;
  readonly root: Locator;
  readonly progress: Locator;
  readonly back: Locator;
  readonly next: Locator;
  readonly submit: Locator;
  readonly result: Locator;
  readonly message: Locator;
  readonly errors: Locator;
  readonly firstName: Locator;
  readonly email: Locator;
  readonly address: Locator;
  readonly city: Locator;
  readonly language: Locator;
  readonly newsletter: Locator;
  /** Review step summary "<first name> · <email> · <address>, <city>". */
  readonly reviewSummary: Locator;

  constructor(private readonly page: Page) {
    this.heading = moduleHeading(page, 'Multi-Step Form');
    this.root = page.getByTestId('form-multi-step-form');
    const id = (suffix: string) => this.root.getByTestId(`form-multi-step-${suffix}`);
    this.progress = id('progress');
    this.back = id('back');
    this.next = id('next');
    this.submit = id('submit');
    this.result = id('result');
    this.message = this.result.locator('p').nth(1);
    this.errors = this.result.getByRole('list', { name: 'Validation errors' }).getByRole('listitem').locator('span:not([aria-hidden])');
    this.firstName = id('first-name');
    this.email = id('email');
    this.address = id('address');
    this.city = id('city');
    this.language = id('language');
    this.newsletter = id('newsletter');
    this.reviewSummary = this.root.getByText(/^.* · .* · .*, .*$/);
  }

  async goto(): Promise<void> {
    await openModule(this.page, { path: MultiStepFormPage.path, heading: this.heading, ready: this.next });
  }
}

/** /ui-elements/form-validation-errors/ — nine buttons that each show one canned negative result. */
export class ValidationErrorsPage {
  static readonly path = '/ui-elements/form-validation-errors/';
  readonly heading: Locator;
  readonly root: Locator;
  readonly result: Locator;
  readonly message: Locator;
  readonly errors: Locator;
  readonly toast: Locator;

  constructor(private readonly page: Page) {
    this.heading = moduleHeading(page, 'Validation Errors');
    this.root = page.getByTestId('form-validation-errors-form');
    this.result = this.root.getByTestId('form-validation-errors-result');
    this.message = this.result.locator('p').nth(1);
    this.errors = this.result.getByRole('list', { name: 'Validation errors' }).getByRole('listitem').locator('span:not([aria-hidden])');
    this.toast = this.result.getByTestId('form-validation-errors-toast');
  }

  trigger(id: string): Locator {
    return this.root.getByTestId(`form-validation-errors-${id}`);
  }

  async goto(): Promise<void> {
    await openModule(this.page, { path: ValidationErrorsPage.path, heading: this.heading, ready: this.trigger('empty-submit') });
  }
}
