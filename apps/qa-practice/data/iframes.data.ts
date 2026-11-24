/**
 * Iframes (/ui-elements/iframes/) — expectations read from the app source (`IframesWidget`,
 * `data.tsx`, QA Practice revision 3d14d23; identical in the local build d856264).
 * Both frames are inline `srcdoc` documents, so nothing is loaded from another origin.
 */

export const FRAMES = {
  site: { testId: 'demo-site-iframe', title: 'HSNAKD QA page' },
  support: { testId: 'nested-frame', title: 'Nested support form' },
} as const;

/** Content of the embedded demo site (inside the frame only). */
export const SITE_CONTENT = {
  heading: 'Practical QA for better software.',
  nav: ['About', 'QA Practice', 'Resources'],
  sectionHeading: 'QA practice areas',
  cards: ['UI testing', 'Test automation', 'Bug investigation'],
  cta: 'Explore QA resources →',
} as const;

/** Content of the support form frame. */
export const SUPPORT_FORM = {
  intro: 'Nested support widget',
  label: 'Message',
  placeholder: 'Type a message',
  send: 'Send message',
} as const;

export const FRAME_COUNTER = (n: number) => `Nested frame submissions received by parent: ${n}`;

/** Synthetic messages (no personal data). */
export const MESSAGES = {
  plain: 'Checkout page shows a blank total',
  markup: '<b id="injected">bold</b> & "quotes" — ünïcødé ✓',
} as const;
