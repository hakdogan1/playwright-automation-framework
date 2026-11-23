/**
 * File Upload (/ui-elements/file-upload/) — expectations read from the app source
 * (`FileUploadWidget` in `data.tsx`, QA Practice revision 3d14d23; identical in the local build d856264).
 * Everything happens in the browser: the file is read with URL.createObjectURL, nothing is sent.
 */

/** The app rejects `file.size > 1024 * 1024`, so exactly this many bytes is still accepted. */
export const UPLOAD_CAP_BYTES = 1024 * 1024;

export const UPLOAD_TEXT = {
  noFile: 'No file chosen',
  previewReady: 'Preview hydrated.',
  previewAlt: 'Avatar preview',
  unsupportedType: 'Unsupported file type. Use a PNG or JPG.',
  tooLarge: 'File exceeds 1MB cap.',
} as const;
