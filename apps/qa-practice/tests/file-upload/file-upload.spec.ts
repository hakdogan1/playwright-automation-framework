import { test, expect, tc } from '../../fixtures';
import { UPLOAD_CAP_BYTES, UPLOAD_TEXT } from '../../data/file-upload.data';
import { SYNTHETIC_IMAGES, jpegFile, otherPngFile, pdfFile, pngFile, pngOfSize, textFile } from '../../data/synthetic-files';

// Oracles come from the app source (FileUploadWidget, 3d14d23): type must start with "image/",
// size must be ≤ 1 MiB, accepted files get a blob: preview. Everything happens in the browser.
// Behaviour the source shows but that looks unintended (stale preview after a rejected file,
// any image/* accepted, content not checked) is recorded in docs/observations/OBS-03, not asserted here.

test.describe('File Upload', () => {
  test.beforeEach(async ({ fileUploadPage }) => {
    await fileUploadPage.goto();
  });

  test('a valid PNG is accepted and previewed without being sent anywhere', { tag: ['@smoke'], annotation: [tc('TC-UPL-001')] }, async ({ fileUploadPage: up, page }) => {
    // An upload needs a write method or a request body. Plain GETs are excluded on purpose: the app
    // prefetches route chunks in the background (e.g. /_next/static/chunks/app/login/page-*.js).
    const sent: string[] = [];
    page.on('request', (request) => {
      if (!['GET', 'HEAD'].includes(request.method()) || request.postDataBuffer()) sent.push(`${request.method()} ${request.url()}`);
    });

    await expect(up.fileName).toHaveText(UPLOAD_TEXT.noFile);
    await expect(up.preview).toHaveCount(0);

    await test.step('Choose a 1×1 PNG', () => up.choose(pngFile()));

    await expect(up.fileName).toHaveText('qa-avatar.png');
    await expect(up.error).toHaveCount(0);
    await expect(up.preview).toHaveAttribute('src', /^blob:/);
    await expect(up.preview).toHaveAttribute('alt', UPLOAD_TEXT.previewAlt);
    await expect(up.previewReady).toBeVisible();
    expect(await up.previewSize()).toEqual(SYNTHETIC_IMAGES.png1x1);
    expect(sent, 'no request writes or carries a body: the file stays in the browser').toEqual([]);
  });

  test('a valid JPEG is accepted and previewed', { tag: ['@functional'], annotation: [tc('TC-UPL-002')] }, async ({ fileUploadPage: up }) => {
    await test.step('Choose a 3×2 JPEG', () => up.choose(jpegFile()));

    await expect(up.fileName).toHaveText('qa-avatar.jpg');
    await expect(up.error).toHaveCount(0);
    await expect(up.preview).toHaveAttribute('src', /^blob:/);
    expect(await up.previewSize()).toEqual(SYNTHETIC_IMAGES.jpeg3x2);
  });

  for (const [row, file] of [textFile(), pdfFile()].entries()) {
    test(`unsupported type #${row + 1} (${file.mimeType}) is rejected without a preview`, { tag: ['@negative'], annotation: [tc('TC-UPL-003')] }, async ({ fileUploadPage: up }) => {
      await test.step(`Choose ${file.name} (${file.mimeType})`, () => up.choose(file));

      await expect(up.error).toHaveText(UPLOAD_TEXT.unsupportedType);
      await expect(up.fileName).toHaveText(file.name);
      await expect(up.preview).toHaveCount(0);
      await expect(up.previewReady).toHaveCount(0);
    });
  }

  test('an image of exactly 1,048,576 bytes is accepted', { tag: ['@edge'], annotation: [tc('TC-UPL-004')] }, async ({ fileUploadPage: up }) => {
    const file = pngOfSize(UPLOAD_CAP_BYTES);

    await test.step(`Choose a PNG of ${UPLOAD_CAP_BYTES} bytes`, () => up.choose(file));

    expect((await up.selectedFile())?.size).toBe(UPLOAD_CAP_BYTES);
    await expect(up.error).toHaveCount(0);
    await expect(up.preview).toHaveAttribute('src', /^blob:/);
    expect(await up.previewSize()).toEqual(SYNTHETIC_IMAGES.png1x1);
  });

  test('an image of 1,048,577 bytes is rejected as too large', { tag: ['@negative'], annotation: [tc('TC-UPL-005')] }, async ({ fileUploadPage: up }) => {
    const file = pngOfSize(UPLOAD_CAP_BYTES + 1);

    await test.step(`Choose a PNG of ${UPLOAD_CAP_BYTES + 1} bytes`, () => up.choose(file));

    expect((await up.selectedFile())?.size).toBe(UPLOAD_CAP_BYTES + 1);
    await expect(up.error).toHaveText(UPLOAD_TEXT.tooLarge);
    await expect(up.fileName).toHaveText(file.name);
    await expect(up.preview).toHaveCount(0);
  });

  test('choosing a valid file after a rejected one clears the error and shows the preview', { tag: ['@functional'], annotation: [tc('TC-UPL-006')] }, async ({ fileUploadPage: up }) => {
    await test.step('Choose a text file', () => up.choose(textFile()));

    await expect(up.error).toHaveText(UPLOAD_TEXT.unsupportedType);

    await test.step('Choose a valid PNG', () => up.choose(pngFile()));

    await expect(up.error).toHaveCount(0);
    await expect(up.fileName).toHaveText('qa-avatar.png');
    await expect(up.previewReady).toBeVisible();
    expect(await up.previewSize()).toEqual(SYNTHETIC_IMAGES.png1x1);
  });

  test('choosing another image replaces the preview', { tag: ['@edge'], annotation: [tc('TC-UPL-007')] }, async ({ fileUploadPage: up }) => {
    await test.step('Choose a 1×1 PNG', () => up.choose(pngFile()));

    expect(await up.previewSize()).toEqual(SYNTHETIC_IMAGES.png1x1);
    const firstSrc = await up.preview.getAttribute('src');

    await test.step('Choose a 2×2 PNG', () => up.choose(otherPngFile()));

    await expect(up.fileName).toHaveText('qa-avatar-2.png');
    await expect(up.preview).not.toHaveAttribute('src', firstSrc ?? '');
    expect(await up.previewSize()).toEqual(SYNTHETIC_IMAGES.png2x2);
    await expect(up.preview).toHaveCount(1);
    await expect(up.error).toHaveCount(0);
  });

  // Expected outcome as data: `errors` is the full list of error texts (empty = accepted).
  const RESULT_ROWS = [
    { key: 'png', file: pngFile(), errors: [], previews: 1 },
    { key: 'jpeg', file: jpegFile(), errors: [], previews: 1 },
    { key: 'txt', file: textFile(), errors: [UPLOAD_TEXT.unsupportedType], previews: 0 },
    { key: 'pdf', file: pdfFile(), errors: [UPLOAD_TEXT.unsupportedType], previews: 0 },
    { key: 'oversize', file: pngOfSize(UPLOAD_CAP_BYTES + 1), errors: [UPLOAD_TEXT.tooLarge], previews: 0 },
  ];

  for (const row of RESULT_ROWS) {
    test(`row ${row.key}: the app receives the exact name, MIME type and size and reports the right result`, { tag: ['@functional'], annotation: [tc('TC-UPL-008')] }, async ({ fileUploadPage: up }) => {
      await test.step(`Choose ${row.file.name}`, () => up.choose(row.file));

      expect(await up.selectedFile()).toEqual({ name: row.file.name, type: row.file.mimeType, size: row.file.buffer.length });
      await expect(up.fileName).toHaveText(row.file.name);
      await expect(up.error).toHaveText(row.errors);
      await expect(up.preview).toHaveCount(row.previews);
    });
  }
});
