import { test, expect, tc } from '../../fixtures';
import { ALL_IMAGE_BUGS_OFF, COUNTS, IMAGES, LAYOUT, SLOW_DELAY_MS, WRONG_ALT } from '../../data/broken-images.data';

// Oracles come from the app source (ImageHandlingLabWidget, extras.tsx, 3d14d23). The four bug
// switches are intentional lab defects (ON by default); tests check that each one reproduces when
// ON and that the intended behaviour holds when OFF, like the Slider lab (TC-SLD).
// Statuses are read after "Retry load", which remounts the image after hydration: the initial
// statuses depend on whether an image settled before React hydrated (OBS-08), and "Reset images"
// leaves cards in "loading" (OBS-08). Neither is asserted here.

const FAILING = [IMAGES.broken, IMAGES.unauthorized, IMAGES.corrupted] as const;

test.describe('Image Handling Lab', () => {
  test('five image cases, four bug switches on by default', { tag: ['@smoke'], annotation: [tc('TC-IMG-001')] }, async ({ brokenImagesPage: b }) => {
    await b.goto();

    for (const image of Object.values(IMAGES)) await expect(b.card(image.id).getByRole('heading', { level: 4 })).toHaveText(image.title);
    for (const key of Object.keys(ALL_IMAGE_BUGS_OFF) as (keyof typeof ALL_IMAGE_BUGS_OFF)[]) await expect(b.bugSwitch(key), key).toBeChecked();
    await expect(b.layoutStatus).toHaveText(LAYOUT.risk);
    await expect(b.reset).toBeEnabled();
  });

  test('with the bugs off, the working image loads with its alt text and cannot be retried', { tag: ['@functional'], annotation: [tc('TC-IMG-002')] }, async ({ brokenImagesPage: b }) => {
    await b.goto();
    await b.setBugs(ALL_IMAGE_BUGS_OFF);

    await test.step('Retry the working image', () => b.retryLoad(IMAGES.working.id));

    await expect(b.status(IMAGES.working.id)).toHaveText('loaded');
    await expect(b.image(IMAGES.working.id)).toBeVisible();
    await expect(b.image(IMAGES.working.id)).toHaveAttribute('alt', IMAGES.working.alt);
    expect(await b.image(IMAGES.working.id).evaluate((img: HTMLImageElement) => img.naturalWidth > 0), 'the image decoded').toBe(true);
    await expect(b.retry(IMAGES.working.id)).toBeDisabled();
  });

  for (const image of FAILING) {
    test(`with the bugs off, "${image.title}" fails with its fallback and real alt text`, { tag: ['@functional'], annotation: [tc('TC-IMG-003')] }, async ({ brokenImagesPage: b }) => {
      await b.goto();
      await b.setBugs(ALL_IMAGE_BUGS_OFF);

      await test.step(`Retry "${image.title}"`, () => b.retryLoad(image.id));

      await expect(b.status(image.id)).toHaveText('error');
      await expect(b.fallback(image.id)).toContainText(image.fallback);
      await expect(b.altText(image.id)).toHaveText(`Alt text: ${image.alt}`);
      await expect(b.image(image.id)).toBeHidden();
      await expect(b.retry(image.id), 'a failed image can be retried').toBeEnabled();
    });
  }

  test('the failed counter counts every failed card', { tag: ['@functional'], annotation: [tc('TC-IMG-004')] }, async ({ brokenImagesPage: b }) => {
    await b.goto();
    await b.setBugs(ALL_IMAGE_BUGS_OFF);

    for (const image of FAILING) {
      await test.step(`Retry "${image.title}"`, () => b.retryLoad(image.id));

      await expect(b.status(image.id)).toHaveText('error');
    }

    await test.step('Retry the working image', () => b.retryLoad(IMAGES.working.id));

    await expect(b.status(IMAGES.working.id)).toHaveText('loaded');
    await expect(b.failedCount).toHaveText(COUNTS.failed(FAILING.length));
  });

  test('bug "missing fallback": the 404 image fails without fallback, off restores it', { tag: ['@functional'], annotation: [tc('TC-IMG-005')] }, async ({ brokenImagesPage: b }) => {
    await b.goto();
    await b.setBugs({ ...ALL_IMAGE_BUGS_OFF, missingFallback: true });
    await b.retryLoad(IMAGES.broken.id);

    await expect(b.status(IMAGES.broken.id)).toHaveText('error');
    await expect(b.fallback(IMAGES.broken.id)).toHaveCount(0);
    await expect(b.image(IMAGES.broken.id), 'the broken native image stays').toBeVisible();

    await test.step('Turn the switch off', () => b.setBugs({ missingFallback: false }));

    await expect(b.fallback(IMAGES.broken.id)).toContainText(IMAGES.broken.fallback);
    await expect(b.image(IMAGES.broken.id)).toBeHidden();
  });

  test('bug "wrong alt": images and fallbacks expose the wrong alt text, off restores it', { tag: ['@functional'], annotation: [tc('TC-IMG-006')] }, async ({ brokenImagesPage: b }) => {
    await b.goto();
    await b.setBugs({ ...ALL_IMAGE_BUGS_OFF, wrongAlt: true });
    await b.retryLoad(IMAGES.unauthorized.id);

    await expect(b.altText(IMAGES.unauthorized.id)).toHaveText(`Alt text: ${WRONG_ALT}`);
    await expect(b.image(IMAGES.working.id)).toHaveAttribute('alt', WRONG_ALT);

    await test.step('Turn the switch off', () => b.setBugs({ wrongAlt: false }));

    await expect(b.altText(IMAGES.unauthorized.id)).toHaveText(`Alt text: ${IMAGES.unauthorized.alt}`);
    await expect(b.image(IMAGES.working.id)).toHaveAttribute('alt', IMAGES.working.alt);
  });

  test('bug "infinite spinner": the slow image stays loading; off, it loads after 1400 ms', { tag: ['@edge'], annotation: [tc('TC-IMG-007')] }, async ({ brokenImagesPage: b }) => {
    await b.goto({ freezeTimers: true });

    await test.step('Advance the clock by 10 s with the switch on', () => b.advance(10_000));

    await expect(b.status(IMAGES.slow.id)).toHaveText('loading');
    await expect(b.image(IMAGES.slow.id)).toHaveCount(0);

    await test.step('Turn the switch off and advance to 1399 ms', async () => {
      await b.setBugs({ infiniteSpinner: false });
      await b.advance(SLOW_DELAY_MS - 1);
    });

    await expect(b.status(IMAGES.slow.id)).toHaveText('loading');

    await test.step('Advance the last millisecond', () => b.advance(1));

    await expect(b.status(IMAGES.slow.id)).toHaveText('loaded');
    await expect(b.image(IMAGES.slow.id)).toBeVisible();
  });

  test('bug "layout shift": the layout chip reports the risk; off, a stable fallback box', { tag: ['@functional'], annotation: [tc('TC-IMG-008')] }, async ({ brokenImagesPage: b }) => {
    await b.goto();
    await b.setBugs({ ...ALL_IMAGE_BUGS_OFF, layoutShift: true });

    await expect(b.layoutStatus).toHaveText(LAYOUT.risk);
    await expect(b.layoutStatus).toHaveAttribute('data-state', 'error');

    await test.step('Turn the switch off', () => b.setBugs({ layoutShift: false }));

    await expect(b.layoutStatus).toHaveText(LAYOUT.stable);
    await expect(b.layoutStatus).toHaveAttribute('data-state', 'stable');
  });

  test('retrying a failing image never reports it as loaded', { tag: ['@negative'], annotation: [tc('TC-IMG-009')] }, async ({ brokenImagesPage: b }) => {
    await b.goto();
    await b.setBugs(ALL_IMAGE_BUGS_OFF);

    for (const attempt of [1, 2, 3]) {
      await test.step(`Retry the 404 image (attempt ${attempt})`, () => b.retryLoad(IMAGES.broken.id));

      await expect(b.status(IMAGES.broken.id)).toHaveText('error');
      await expect(b.fallback(IMAGES.broken.id)).toBeVisible();
    }
  });
});
