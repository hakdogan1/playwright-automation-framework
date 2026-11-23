import { expect, type Locator, type Page } from '@playwright/test';
import type { SyntheticFile } from '../data/synthetic-files';
import { moduleHeading, openModule } from '../support/module';

export interface SelectedFile {
  name: string;
  type: string;
  size: number;
}

/**
 * /ui-elements/file-upload/ — avatar upload that is validated and previewed in the browser only
 * (type `image/*`, size ≤ 1 MiB, preview via URL.createObjectURL; no network request).
 * Files are synthetic buffers (data/synthetic-files.ts); setInputFiles does not apply the input's
 * `accept` filter, so the app's own JavaScript validation is what gets tested.
 */
export class FileUploadPage {
  static readonly path = '/ui-elements/file-upload/';
  readonly heading: Locator;
  readonly widget: Locator;
  readonly input: Locator;
  /** The file name the app shows next to "Choose File" ("No file chosen" initially). */
  readonly fileName: Locator;
  readonly error: Locator;
  readonly preview: Locator;
  readonly previewReady: Locator;

  constructor(private readonly page: Page) {
    this.heading = moduleHeading(page, 'File Upload');
    this.widget = page.getByTestId('upload-widget');
    this.input = this.widget.getByTestId('upload-input');
    // The name has no test id; it is the text right after the "Choose File" label.
    this.fileName = this.widget.locator('label[for="upload-input"] + span');
    this.error = this.widget.getByTestId('upload-error');
    this.preview = this.widget.getByTestId('upload-preview');
    this.previewReady = this.widget.getByText('Preview hydrated.', { exact: true });
  }

  async choose(file: SyntheticFile): Promise<void> {
    await this.input.setInputFiles(file);
  }

  /** Name, MIME type and size of the file the input actually holds (what the app validates). */
  async selectedFile(): Promise<SelectedFile | null> {
    return this.input.evaluate((el: HTMLInputElement) => {
      const file = el.files?.[0];
      return file ? { name: file.name, type: file.type, size: file.size } : null;
    });
  }

  /** Pixel size of the decoded preview, once the browser has finished decoding it. */
  async previewSize(): Promise<{ width: number; height: number }> {
    await expect.poll(() => this.preview.evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0)).toBe(true);
    return this.preview.evaluate((img: HTMLImageElement) => ({ width: img.naturalWidth, height: img.naturalHeight }));
  }

  async goto(): Promise<void> {
    await openModule(this.page, { path: FileUploadPage.path, heading: this.heading, ready: this.input });
  }
}
