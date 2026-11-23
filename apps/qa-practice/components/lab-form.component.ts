import type { Locator } from '@playwright/test';

/**
 * The shared contract of QA Practice "Form Lab" forms. Seven forms (register, login, contact,
 * address, payment, checkout, profile) are rendered by one configurable widget (`FormLabWidget`
 * in the app's `form-lab.tsx`, revision 3d14d23), so they share these hooks:
 * - `<slug>-form`, `<slug>-submit`, a "Reset" button,
 * - fields with the test id `<slug>-<field id>`,
 * - `<slug>-result` with `data-state` idle | error | success, a message and an error list.
 * Only the hooks live here; field values and expectations belong to each form's page object.
 */
export class LabForm {
  readonly form: Locator;
  readonly submit: Locator;
  readonly reset: Locator;
  readonly result: Locator;
  /** The result message ("Awaiting submission.", "3 validation issues found.", success text). */
  readonly message: Locator;
  /** Error messages in display order. The list items also hold an aria-hidden "!" marker. */
  readonly errors: Locator;

  constructor(
    root: Locator,
    private readonly slug: string,
  ) {
    this.form = root.getByTestId(`${slug}-form`);
    this.submit = this.form.getByTestId(`${slug}-submit`);
    this.reset = this.form.getByRole('button', { name: 'Reset', exact: true });
    this.result = this.form.getByTestId(`${slug}-result`);
    // The first paragraph is the static "Validation result panel" caption.
    this.message = this.result.locator('p').nth(1);
    this.errors = this.result.getByRole('list', { name: 'Validation errors' }).getByRole('listitem').locator('span:not([aria-hidden])');
  }

  field(id: string): Locator {
    return this.form.getByTestId(`${this.slug}-${id}`);
  }
}
