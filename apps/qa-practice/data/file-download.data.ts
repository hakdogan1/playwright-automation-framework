/**
 * File Download (/ui-elements/file-download/) — expectations read from the app source
 * (`FileDownloadWidget` / `downloadBlob` in `data.tsx`, QA Practice revision 3d14d23; identical in
 * the local build d856264). Files are built as Blobs in the browser; nothing is fetched or sent.
 *
 * The CSV holds a real-looking e-mail address on the app owner's domain. It is deliberately NOT
 * copied here: tests check the CSV's structure (header, row and field counts, address format) and
 * report only booleans or counts, so neither test data nor failure messages contain it.
 */

export type DownloadKind = 'txt' | 'csv' | 'pdf';

export const DOWNLOADS = {
  txt: { name: 'validation-lab-sample.txt', mimeType: 'text/plain' },
  csv: { name: 'validation-lab-users.csv', mimeType: 'text/csv' },
  pdf: { name: 'validation-lab-sample.pdf', mimeType: 'application/pdf' },
} as const satisfies Record<DownloadKind, { name: string; mimeType: string }>;

/** Exact TXT content (no personal data). */
export const TXT_CONTENT = 'Validation Lab TXT download\nDownloaded from UI Elements.\n';

export const CSV_SHAPE = {
  header: 'name,email,role,status',
  dataRows: 1,
  fields: 4,
} as const;

/** What the app's PDF contains (structure, not personal data). */
export const PDF_SHAPE = {
  header: '%PDF-1.4\n',
  eof: '%%EOF\n',
  objects: ['1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj', '2 0 obj<</Type/Pages/Count 0>>endobj'],
} as const;

export const DOWNLOAD_TEXT = {
  idle: 'No download yet.',
  result: (name: string, bytes: number) => `${name} (${bytes} bytes)`,
} as const;

/** The app revokes each blob: URL this many ms after the click. */
export const REVOKE_AFTER_MS = 500;
