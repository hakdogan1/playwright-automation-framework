/**
 * Synthetic files for upload tests, built in memory (Playwright FilePayload). No real person,
 * photo or document: the images are single-colour pixels generated for this framework
 * (PNG with Python's zlib, JPEG re-encoded by macOS `sips`), the text and PDF are fixed strings.
 * Distinct pixel sizes let a test prove which image the browser actually decoded.
 */

export interface SyntheticFile {
  name: string;
  mimeType: string;
  buffer: Buffer;
}

/** 1×1 PNG, 69 bytes. */
const PNG_1X1 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAIAAACQd1PeAAAADElEQVR4nGO4o6EBAAMQAS0ujiXaAAAAAElFTkSuQmCC';
/** 2×2 PNG, 73 bytes. */
const PNG_2X2 = 'iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAIAAAD91JpzAAAAEElEQVR4nGPQCLgDRAwQCgAibgVRg4bG3wAAAABJRU5ErkJggg==';
/** 3×2 JPEG (baseline, SOI ff d8 ff … EOI ff d9), 775 bytes. */
const JPEG_3X2 =
  '/9j/4AAQSkZJRgABAQAASABIAAD/4QBMRXhpZgAATU0AKgAAAAgAAYdpAAQAAAABAAAAGgAAAAAAA6ABAAMAAAABAAEAAKACAAQAAAABAAAAA6ADAAQAAAABAAAAAgAAAAD/7QA4UGhvdG9zaG9wIDMuMAA4QklNBAQAAAAAAAA4QklNBCUAAAAAABDUHYzZjwCyBOmACZjs+EJ+/8AAEQgAAgADAwEiAAIRAQMRAf/EAB8AAAEFAQEBAQEBAAAAAAAAAAABAgMEBQYHCAkKC//EALUQAAIBAwMCBAMFBQQEAAABfQECAwAEEQUSITFBBhNRYQcicRQygZGhCCNCscEVUtHwJDNicoIJChYXGBkaJSYnKCkqNDU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6g4SFhoeIiYqSk5SVlpeYmZqio6Slpqeoqaqys7S1tre4ubrCw8TFxsfIycrS09TV1tfY2drh4uPk5ebn6Onq8fLz9PX29/j5+v/EAB8BAAMBAQEBAQEBAQEAAAAAAAABAgMEBQYHCAkKC//EALURAAIBAgQEAwQHBQQEAAECdwABAgMRBAUhMQYSQVEHYXETIjKBCBRCkaGxwQkjM1LwFWJy0QoWJDThJfEXGBkaJicoKSo1Njc4OTpDREVGR0hJSlNUVVZXWFlaY2RlZmdoaWpzdHV2d3h5eoKDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uLj5OXm5+jp6vLz9PX29/j5+v/bAEMAAgICAgICAwICAwQDAwMEBQQEBAQFBwUFBQUFBwgHBwcHBwcICAgICAgICAoKCgoKCgsLCwsLDQ0NDQ0NDQ0NDf/bAEMBAgICAwMDBgMDBg0JBwkNDQ0NDQ0NDQ0NDQ0NDQ0NDQ0NDQ0NDQ0NDQ0NDQ0NDQ0NDQ0NDQ0NDQ0NDQ0NDQ0NDf/dAAQAAf/aAAwDAQACEQMRAD8A4Oiiiviz+Ez/2Q==';

const from = (base64: string) => Buffer.from(base64, 'base64');

export const SYNTHETIC_IMAGES = {
  png1x1: { width: 1, height: 1 },
  png2x2: { width: 2, height: 2 },
  jpeg3x2: { width: 3, height: 2 },
} as const;

export const pngFile = (name = 'qa-avatar.png'): SyntheticFile => ({ name, mimeType: 'image/png', buffer: from(PNG_1X1) });
export const otherPngFile = (name = 'qa-avatar-2.png'): SyntheticFile => ({ name, mimeType: 'image/png', buffer: from(PNG_2X2) });
export const jpegFile = (name = 'qa-avatar.jpg'): SyntheticFile => ({ name, mimeType: 'image/jpeg', buffer: from(JPEG_3X2) });

/**
 * A valid 1×1 PNG padded with zero bytes after its IEND chunk to exactly `size` bytes.
 * Decoders ignore data after IEND, so the file stays a real PNG of the requested size.
 */
export function pngOfSize(size: number, name = `qa-avatar-${size}.png`): SyntheticFile {
  const png = from(PNG_1X1);
  if (size < png.length) throw new Error(`pngOfSize: ${size} is smaller than the PNG itself (${png.length})`);
  return { name, mimeType: 'image/png', buffer: Buffer.concat([png, Buffer.alloc(size - png.length)]) };
}

export const textFile = (name = 'qa-notes.txt'): SyntheticFile => ({ name, mimeType: 'text/plain', buffer: Buffer.from('Synthetic QA note.\n') });

export const pdfFile = (name = 'qa-report.pdf'): SyntheticFile => ({
  name,
  mimeType: 'application/pdf',
  buffer: Buffer.from('%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Count 0>>endobj\n%%EOF\n'),
});
