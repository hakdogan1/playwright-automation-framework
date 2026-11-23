import type { Locator, Page } from '@playwright/test';
import type { DownloadKind } from '../data/file-download.data';
import { captureDownload, objectUrlLog, recordObjectUrls, type CapturedDownload } from '../support/downloads';
import { moduleHeading, openModule } from '../support/module';

const BUTTON_LABEL: Record<DownloadKind, string> = { txt: 'Download TXT', csv: 'Download CSV', pdf: 'Download PDF' };

/**
 * /ui-elements/file-download/ — three buttons that build a Blob in the browser and download it
 * through a temporary <a download> (no network). The page records object URLs (type, size,
 * revocation) so tests can check the MIME type, which Playwright's Download object does not expose.
 */
export class FileDownloadPage {
  static readonly path = '/ui-elements/file-download/';
  readonly heading: Locator;
  readonly widget: Locator;
  /** "No download yet." or "<file name> (<n> bytes)". */
  readonly result: Locator;

  constructor(private readonly page: Page) {
    this.heading = moduleHeading(page, 'File Download');
    this.widget = page.getByTestId('file-download-demo');
    this.result = this.widget.getByTestId('download-result');
  }

  button(kind: DownloadKind): Locator {
    return this.widget.getByRole('button', { name: BUTTON_LABEL[kind], exact: true });
  }

  async download(kind: DownloadKind): Promise<CapturedDownload> {
    return captureDownload(this.page, () => this.button(kind).click());
  }

  objectUrls() {
    return objectUrlLog(this.page);
  }

  async goto(): Promise<void> {
    await recordObjectUrls(this.page);
    await openModule(this.page, { path: FileDownloadPage.path, heading: this.heading, ready: this.button('txt') });
  }
}
