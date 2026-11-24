import { readFileSync } from 'node:fs';
import { test, expect, tc } from '../../fixtures';
import { PDF_DOWNLOAD } from '../../data/otp-files.data';

// Oracles come from the app source (PdfDownloadWidget / downloadBlob, data.tsx, 3d14d23). The file
// is a Blob built in the browser and checked in memory; it reuses the File Download helpers.
// It is the same minimal PDF as OBS-04 (no xref/trailer, 0 pages); not asserted as a valid PDF.

test.describe('PDF Download', () => {
  test.beforeEach(async ({ pdfDownloadPage }) => {
    await pdfDownloadPage.goto();
  });

  test('the PDF has the exact name and content, and the UI reports its size', { tag: ['@smoke'], annotation: [tc('TC-PDF-001')] }, async ({ pdfDownloadPage: p }) => {
    await expect(p.result).toHaveText(PDF_DOWNLOAD.idle);

    const file = await test.step('Press "Download sample PDF"', () => p.download());

    expect(file.name).toBe(PDF_DOWNLOAD.name);
    expect(file.bytes.toString('latin1')).toBe(PDF_DOWNLOAD.content);
    await expect(p.result).toHaveText(PDF_DOWNLOAD.result(PDF_DOWNLOAD.name, Buffer.byteLength(PDF_DOWNLOAD.content)));
  });

  test('the Blob is application/pdf, matches the file and its URL is revoked', { tag: ['@functional'], annotation: [tc('TC-PDF-002')] }, async ({ pdfDownloadPage: p }) => {
    const file = await p.download();
    const { created } = await p.objectUrls();

    expect(created).toHaveLength(1);
    expect(created[0]!.type).toBe(PDF_DOWNLOAD.mimeType);
    expect(created[0]!.size).toBe(file.bytes.length);
    expect(file.download.url()).toBe(created[0]!.url);
    await expect.poll(async () => (await p.objectUrls()).revoked, { timeout: 2_000 }).toEqual([created[0]!.url]);
    expect(readFileSync(await file.download.path())).toHaveLength(created[0]!.size);
  });

  test('downloading twice gives two independent, identical files', { tag: ['@edge'], annotation: [tc('TC-PDF-003')] }, async ({ pdfDownloadPage: p }) => {
    const first = await p.download();
    const second = await p.download();
    const { created } = await p.objectUrls();

    expect(first.bytes.equals(second.bytes)).toBe(true);
    expect(await first.download.path()).not.toBe(await second.download.path());
    expect(created.map((c) => c.url)).toHaveLength(2);
    expect(created[0]!.url).not.toBe(created[1]!.url);
  });

  test('the file comes from a blob: URL, not from the server', { tag: ['@negative'], annotation: [tc('TC-PDF-004')] }, async ({ pdfDownloadPage: p, page }) => {
    const pdfRequests: string[] = [];
    page.on('request', (r) => {
      pdfRequests.push(r.url());
    });

    const file = await p.download();

    expect(file.download.url()).toMatch(/^blob:/);
    expect(pdfRequests.filter((u) => /\.pdf(\?|$)/i.test(u)), 'requests for a .pdf').toEqual([]);
  });
});
