/**
 * OTP Login, PDF Download and Generate Text File — expectations read from the app source at
 * revision 3d14d23 (`OtpLoginWidget` in `forms.tsx`; `PdfDownloadWidget`, `GenerateTextFileWidget`
 * and `downloadBlob` in `data.tsx`; identical in the local build d856264). All three are
 * client-only: no request, no e-mail, no storage. The OTP is a fixed demo code shown on the page.
 */

export const OTP = {
  demoCode: '123456',
  username: 'qa-runner',
  idle: 'Waiting for an OTP request…',
  sent: 'Demo OTP sent. Use 123456 for this lab.',
  verified: 'OTP verified. Login successful.',
  invalid: 'Invalid OTP. Try 123456 for this lab.',
  noUsername: 'Enter a username before requesting an OTP.',
  notRequested: 'Request an OTP first.',
  incomplete: 'Enter all 6 digits before submitting.',
  fetch: 'Fetch OTP',
  resend: 'Resend OTP',
} as const;

export const PDF_DOWNLOAD = {
  name: 'sample-validation-report.pdf',
  mimeType: 'application/pdf',
  idle: 'No PDF download yet.',
  result: (name: string, bytes: number) => `${name} · ${bytes} bytes`,
  /** Exact content written by the app (structure only; see OBS-04 for the same minimal PDF). */
  content: '%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Count 0>>endobj\n%%EOF\n',
} as const;

export const TEXT_FILE = {
  name: 'generated-qa-notes.txt',
  mimeType: 'text/plain',
  defaultText: 'Release notes\n- Login smoke passed\n- Dashboard metrics verified\n',
  idle: 'Generated file not downloaded yet.',
  result: (name: string, bytes: number) => `${name} ready · ${bytes} bytes`,
  /** Multi-byte UTF-8 sample (more bytes than characters, including a 4-byte emoji). */
  unicode: 'Ünïcødé ✓ 🙂',
} as const;
