/**
 * Image Handling Lab (/ui-elements/broken-images/) — expectations read from the app source
 * (`ImageHandlingLabWidget`, `IMAGE_CASES`, `IMAGE_BUGS` in `extras.tsx`, QA Practice revision
 * 3d14d23; identical in the local build d856264). The four bug switches are intentional lab
 * defects and are ON by default.
 */

export type ImageBugKey = 'missingFallback' | 'wrongAlt' | 'infiniteSpinner' | 'layoutShift';

export const ALL_IMAGE_BUGS_OFF: Record<ImageBugKey, boolean> = { missingFallback: false, wrongAlt: false, infiniteSpinner: false, layoutShift: false };

export const IMAGES = {
  working: { id: 1, title: 'Working image', path: '/brand/hsnakd-patch.svg', alt: 'Validation Lab brand patch' },
  broken: { id: 2, title: 'Broken image', path: '/qa-lab/missing-product-photo.png', alt: 'Product photo for QA checklist', fallback: 'Image failed to load. Showing product placeholder.' },
  slow: { id: 3, title: 'Slow loading image', path: '/brand/hsnakd-wordmark-white.svg', alt: 'Validation Lab wordmark' },
  unauthorized: { id: 4, title: 'Unauthorized image', path: '/private/restricted-avatar.png', alt: 'Restricted user avatar', fallback: 'You do not have permission to view this image.' },
  corrupted: { id: 5, title: 'Corrupted image', alt: 'Corrupted upload preview', fallback: 'The image file is corrupted and cannot be previewed.' },
} as const;

/** Alt text every image gets while the "wrong alt" bug switch is on. */
export const WRONG_ALT = 'Decorative dashboard image';

export const SLOW_DELAY_MS = 1_400;

export const COUNTS = {
  failed: (n: number) => `Failed images: ${n}`,
  loading: (n: number) => `Loading images: ${n}`,
} as const;

export const LAYOUT = { risk: 'Layout: risk of shift', stable: 'Layout: stable fallback box' } as const;
