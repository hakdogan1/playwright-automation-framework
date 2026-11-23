import { readFileSync } from 'node:fs';
import { test, expect, tc } from '../../fixtures';
import { CSV_SHAPE, DOWNLOADS, DOWNLOAD_TEXT, PDF_SHAPE, REVOKE_AFTER_MS, TXT_CONTENT, type DownloadKind } from '../../data/file-download.data';

// Oracles come from the app source (downloadBlob / FileDownloadWidget, 3d14d23). Files are Blobs
// built in the browser; contents are checked in memory and never attached to evidence.
// CSV assertions report counts and booleans only, so the address in the file cannot appear in a
// failure message either.

const EMAIL_FORMAT = /^[^\s@,]+@[^\s@,]+\.[^\s@,]+$/;

test.describe('File Download', () => {
  test.beforeEach(async ({ fileDownloadPage }) => {
    await fileDownloadPage.goto();
  });

  test('the TXT download has the exact name and content', { tag: ['@smoke'], annotation: [tc('TC-DWN-001')] }, async ({ fileDownloadPage: dl }) => {
    await expect(dl.result).toHaveText(DOWNLOAD_TEXT.idle);

    const file = await test.step('Press "Download TXT"', () => dl.download('txt'));

    expect(file.name).toBe(DOWNLOADS.txt.name);
    expect(file.bytes.toString('utf8')).toBe(TXT_CONTENT);
    await expect(dl.result).toHaveText(DOWNLOAD_TEXT.result(DOWNLOADS.txt.name, Buffer.byteLength(TXT_CONTENT)));
  });

  test('the CSV download has the expected header, one data row and four fields per row', { tag: ['@functional'], annotation: [tc('TC-DWN-002')] }, async ({ fileDownloadPage: dl }) => {
    const file = await test.step('Press "Download CSV"', () => dl.download('csv'));

    const lines = file.bytes.toString('utf8').split('\n');
    const rows = lines.slice(1).filter((line) => line.length > 0).map((line) => line.split(','));
    const emailColumn = CSV_SHAPE.header.split(',').indexOf('email');

    expect(file.name).toBe(DOWNLOADS.csv.name);
    expect(lines[0], 'header row').toBe(CSV_SHAPE.header);
    // Not toHaveLength(): on failure it prints the received rows, which hold the address.
    // eslint-disable-next-line playwright/prefer-to-have-length
    expect(rows.length, 'number of data rows').toBe(CSV_SHAPE.dataRows);
    expect(rows.map((r) => r.length), 'fields per data row').toEqual([CSV_SHAPE.fields]);
    expect(rows.map((r) => EMAIL_FORMAT.test(r[emailColumn] ?? '')), 'email column holds a well-formed address').toEqual([true]);
    expect(file.bytes.toString('utf8').endsWith('\n'), 'file ends with a newline').toBe(true);
  });

  test('the PDF download starts with a PDF header, ends with %%EOF and holds the catalog and pages objects', { tag: ['@functional'], annotation: [tc('TC-DWN-003')] }, async ({ fileDownloadPage: dl }) => {
    const file = await test.step('Press "Download PDF"', () => dl.download('pdf'));

    const text = file.bytes.toString('latin1');

    expect(file.name).toBe(DOWNLOADS.pdf.name);
    expect(text.startsWith(PDF_SHAPE.header), 'PDF header').toBe(true);
    expect(text.endsWith(PDF_SHAPE.eof), 'end-of-file marker').toBe(true);
    for (const object of PDF_SHAPE.objects) expect(text, `object "${object}"`).toContain(object);
  });

  for (const kind of ['txt', 'csv', 'pdf'] as const satisfies readonly DownloadKind[]) {
    test(`${kind}: name, size and MIME type agree between the download, the Blob and the UI`, { tag: ['@functional'], annotation: [tc('TC-DWN-004')] }, async ({ fileDownloadPage: dl }) => {
      const file = await test.step(`Press the ${kind.toUpperCase()} button`, () => dl.download(kind));

      const { created } = await dl.objectUrls();

      expect(file.name).toBe(DOWNLOADS[kind].name);
      expect(created, 'one Blob was turned into a download URL').toHaveLength(1);
      expect(created[0]!.type, 'Blob MIME type').toBe(DOWNLOADS[kind].mimeType);
      expect(created[0]!.size, 'Blob size equals the downloaded bytes').toBe(file.bytes.length);
      expect(file.download.url()).toBe(created[0]!.url);
      await expect(dl.result).toHaveText(DOWNLOAD_TEXT.result(DOWNLOADS[kind].name, file.bytes.length));
    });
  }

  test('consecutive TXT, CSV and PDF downloads are separate files', { tag: ['@functional'], annotation: [tc('TC-DWN-005')] }, async ({ fileDownloadPage: dl }) => {
    const txt = await test.step('Download TXT', () => dl.download('txt'));

    const csv = await test.step('Download CSV', () => dl.download('csv'));

    const pdf = await test.step('Download PDF', () => dl.download('pdf'));

    const { created } = await dl.objectUrls();

    expect([txt.name, csv.name, pdf.name]).toEqual([DOWNLOADS.txt.name, DOWNLOADS.csv.name, DOWNLOADS.pdf.name]);
    expect(txt.bytes.toString('utf8')).toBe(TXT_CONTENT);
    expect(csv.bytes.toString('utf8').split('\n')[0]).toBe(CSV_SHAPE.header);
    expect(pdf.bytes.toString('latin1').startsWith(PDF_SHAPE.header)).toBe(true);
    expect(new Set([await txt.download.path(), await csv.download.path(), await pdf.download.path()]).size, 'three distinct saved files').toBe(3);
    expect(created.map((c) => c.type)).toEqual([DOWNLOADS.txt.mimeType, DOWNLOADS.csv.mimeType, DOWNLOADS.pdf.mimeType]);
    await expect(dl.result).toHaveText(DOWNLOAD_TEXT.result(DOWNLOADS.pdf.name, pdf.bytes.length));
  });

  test('downloading the same file twice gives two independent, identical files', { tag: ['@edge'], annotation: [tc('TC-DWN-006')] }, async ({ fileDownloadPage: dl }) => {
    const first = await test.step('Download TXT', () => dl.download('txt'));

    const second = await test.step('Download TXT again', () => dl.download('txt'));

    const { created } = await dl.objectUrls();

    expect(first.bytes.equals(second.bytes), 'same content').toBe(true);
    expect(await first.download.path()).not.toBe(await second.download.path());
    expect(created, 'a new Blob URL per click').toHaveLength(2);
    expect(created[0]!.url).not.toBe(created[1]!.url);
  });

  test('the UI reports the download and the blob URL is revoked afterwards', { tag: ['@edge'], annotation: [tc('TC-DWN-007')] }, async ({ fileDownloadPage: dl }) => {
    await expect(dl.result).toHaveText(DOWNLOAD_TEXT.idle);

    const file = await test.step('Press "Download PDF"', () => dl.download('pdf'));

    await expect(dl.result).toHaveText(DOWNLOAD_TEXT.result(DOWNLOADS.pdf.name, file.bytes.length));
    const { created } = await dl.objectUrls();

    // The app revokes the URL 500 ms after the click; the saved file must stay complete.
    await expect.poll(async () => (await dl.objectUrls()).revoked, { timeout: REVOKE_AFTER_MS * 4 }).toEqual([created[0]!.url]);
    expect(readFileSync(await file.download.path()), 'the saved file is still complete after the revoke').toHaveLength(created[0]!.size);
  });
});
