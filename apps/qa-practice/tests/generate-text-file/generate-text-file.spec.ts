import { test, expect, tc } from '../../fixtures';
import { TEXT_FILE } from '../../data/otp-files.data';

// Oracles come from the app source (GenerateTextFileWidget / downloadBlob, data.tsx, 3d14d23). The
// file is a Blob of the textarea content, checked in memory with the File Download helpers.
// An empty textarea is downloaded as a 0-byte file without any message: OBS-10, not asserted.

test.describe('Generate Text File', () => {
  test.beforeEach(async ({ generateTextFilePage }) => {
    await generateTextFilePage.goto();
  });

  test('the default text is downloaded exactly and the UI reports its size', { tag: ['@smoke'], annotation: [tc('TC-TXT-001')] }, async ({ generateTextFilePage: t }) => {
    await expect(t.text).toHaveValue(TEXT_FILE.defaultText);
    await expect(t.result).toHaveText(TEXT_FILE.idle);

    const file = await test.step('Press "Generate file"', () => t.download());

    expect(file.name).toBe(TEXT_FILE.name);
    expect(file.bytes.toString('utf8')).toBe(TEXT_FILE.defaultText);
    await expect(t.result).toHaveText(TEXT_FILE.result(TEXT_FILE.name, Buffer.byteLength(TEXT_FILE.defaultText)));
  });

  test('edited multi-line text is downloaded exactly', { tag: ['@functional'], annotation: [tc('TC-TXT-002')] }, async ({ generateTextFilePage: t }) => {
    const text = 'Regression run 42\n- 3 failures\n\n  indented line\nno trailing newline';
    await t.text.fill(text);

    const file = await t.download();

    expect(file.bytes.toString('utf8')).toBe(text);
    await expect(t.result).toHaveText(TEXT_FILE.result(TEXT_FILE.name, Buffer.byteLength(text)));
  });

  test('non-ASCII text is UTF-8 encoded and its size is counted in bytes', { tag: ['@edge'], annotation: [tc('TC-TXT-003')] }, async ({ generateTextFilePage: t }) => {
    await t.text.fill(TEXT_FILE.unicode);

    const file = await t.download();
    const bytes = Buffer.byteLength(TEXT_FILE.unicode, 'utf8');

    expect(bytes, 'the sample has more bytes than characters').toBeGreaterThan(TEXT_FILE.unicode.length);
    expect(file.bytes.toString('utf8')).toBe(TEXT_FILE.unicode);
    expect(file.bytes).toHaveLength(bytes);
    await expect(t.result).toHaveText(TEXT_FILE.result(TEXT_FILE.name, bytes));
  });

  test('the Blob is text/plain, comes from a blob: URL and is revoked', { tag: ['@functional'], annotation: [tc('TC-TXT-004')] }, async ({ generateTextFilePage: t }) => {
    const file = await t.download();
    const { created } = await t.objectUrls();

    expect(file.download.url()).toMatch(/^blob:/);
    expect(created).toHaveLength(1);
    expect(created[0]!.type).toBe(TEXT_FILE.mimeType);
    expect(created[0]!.size).toBe(file.bytes.length);
    await expect.poll(async () => (await t.objectUrls()).revoked, { timeout: 2_000 }).toEqual([created[0]!.url]);
  });

  test('each press downloads the current text as a new file', { tag: ['@edge'], annotation: [tc('TC-TXT-005')] }, async ({ generateTextFilePage: t }) => {
    await t.text.fill('first version');
    const first = await t.download();

    await test.step('Change the text and generate again', () => t.text.fill('second version'));

    const second = await t.download();

    expect(first.bytes.toString('utf8')).toBe('first version');
    expect(second.bytes.toString('utf8')).toBe('second version');
    expect(await first.download.path()).not.toBe(await second.download.path());
    await expect(t.result).toHaveText(TEXT_FILE.result(TEXT_FILE.name, Buffer.byteLength('second version')));
  });
});
