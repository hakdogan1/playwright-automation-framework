import type { Request } from '@playwright/test';
import { test, expect, tc } from '../../fixtures';
import { FRAMES, FRAME_COUNTER, MESSAGES, SITE_CONTENT, SUPPORT_FORM } from '../../data/iframes.data';

// Oracles come from the app source (IframesWidget, data.tsx, 3d14d23). Both frames are inline
// srcdoc documents. The parent accepts any window's submit message and the "nested" frame is a
// sibling of the site frame; both are recorded in docs/observations/OBS-05, not asserted here.

test.describe('Iframes', () => {
  test.beforeEach(async ({ iframesPage }) => {
    await iframesPage.goto();
  });

  test('both frames render their documents and the parent counter starts at 0', { tag: ['@smoke'], annotation: [tc('TC-IFR-001')] }, async ({ iframesPage: f }) => {
    await expect(f.siteFrameElement).toHaveAttribute('title', FRAMES.site.title);
    await expect(f.supportFrameElement).toHaveAttribute('title', FRAMES.support.title);
    await expect(f.site.getByRole('heading', { level: 1, name: SITE_CONTENT.heading, exact: true })).toBeVisible();
    await expect(f.support.getByText(SUPPORT_FORM.intro, { exact: true })).toBeVisible();
    await expect(f.messageInput).toBeEditable();
    await expect(f.sendButton).toBeEnabled();
    await expect(f.counter).toHaveText(FRAME_COUNTER(0));
  });

  test('frame content is reachable only through its frame, not from the parent document', { tag: ['@functional'], annotation: [tc('TC-IFR-002')] }, async ({ iframesPage: f, page }) => {
    await expect(f.site.getByText(SITE_CONTENT.heading, { exact: true })).toHaveCount(1);
    await expect(f.support.getByTestId('frame-input')).toHaveCount(1);

    await expect(page.getByText(SITE_CONTENT.heading, { exact: true }), 'site heading from the parent').toHaveCount(0);
    await expect(page.getByTestId('frame-input'), 'support input from the parent').toHaveCount(0);
    await expect(page.getByRole('button', { name: SUPPORT_FORM.send }), 'send button from the parent').toHaveCount(0);
    await expect(f.support.getByTestId('frame-counter'), 'parent counter from inside the frame').toHaveCount(0);
    await expect(f.site.getByTestId('frame-input'), 'support input from the site frame').toHaveCount(0);
  });

  test('the embedded site shows its navigation, practice areas and call to action', { tag: ['@functional'], annotation: [tc('TC-IFR-003')] }, async ({ iframesPage: f }) => {
    for (const item of SITE_CONTENT.nav) await expect(f.site.locator('nav').getByText(item, { exact: true })).toBeVisible();
    await expect(f.site.getByRole('heading', { level: 2, name: SITE_CONTENT.sectionHeading, exact: true })).toBeVisible();
    await expect(f.site.locator('.card b')).toHaveText([...SITE_CONTENT.cards]);
    await expect(f.site.getByText(SITE_CONTENT.cta, { exact: true })).toBeVisible();
  });

  test('sending a message from the support frame increments the parent counter', { tag: ['@smoke'], annotation: [tc('TC-IFR-004')] }, async ({ iframesPage: f }) => {
    await expect(f.messageInput).toHaveAttribute('placeholder', SUPPORT_FORM.placeholder);
    await f.recordMessages();

    await test.step('Type a message and press "Send message"', () => f.send(MESSAGES.plain));

    await expect(f.counter).toHaveText(FRAME_COUNTER(1));
    await expect(f.messageInput, 'the frame keeps the typed text').toHaveValue(MESSAGES.plain);
    expect(await f.messages(), 'one message carrying the typed text').toEqual([MESSAGES.plain]);
  });

  test('each submission is counted once', { tag: ['@functional'], annotation: [tc('TC-IFR-005')] }, async ({ iframesPage: f }) => {
    await f.recordMessages();

    for (const n of [1, 2, 3]) {
      await test.step(`Send message ${n}`, () => f.send(`${MESSAGES.plain} #${n}`));

      await expect(f.counter).toHaveText(FRAME_COUNTER(n));
    }
    expect(await f.messages()).toEqual([1, 2, 3].map((n) => `${MESSAGES.plain} #${n}`));
  });

  test('typing or pressing Enter does not send; only the button does', { tag: ['@negative'], annotation: [tc('TC-IFR-006')] }, async ({ iframesPage: f }) => {
    await f.recordMessages();

    await test.step('Type a message and press Enter', async () => {
      await f.messageInput.fill('typed only');
      await f.messageInput.press('Enter');
    });

    await test.step('Change the text and press "Send message"', () => f.send('sent'));

    // Messages from one frame arrive in order: once "sent" is seen, an Enter message would be too.
    await expect.poll(() => f.messages()).toContain('sent');
    expect(await f.messages(), 'only the button press was sent').toEqual(['sent']);
    await expect(f.counter).toHaveText(FRAME_COUNTER(1));
  });

  test('both frames are inline documents and load nothing over the network', { tag: ['@edge'], annotation: [tc('TC-IFR-007')] }, async ({ iframesPage: f, page }) => {
    const requests: Request[] = [];
    const onRequest = (r: Request) => requests.push(r);
    page.on('request', onRequest);

    await test.step('Reload the page and send a message', async () => {
      await f.goto();
      await f.send(MESSAGES.plain);
      await expect(f.counter).toHaveText(FRAME_COUNTER(1));
    });

    for (const element of [f.siteFrameElement, f.supportFrameElement]) {
      await expect(element).not.toHaveAttribute('src', /./);
      await expect(element).toHaveAttribute('srcdoc', /^<!doctype html>/);
      expect((await f.frameOf(element)).url()).toBe('about:srcdoc');
    }
    expect(page.frames(), 'the main frame and two child frames').toHaveLength(3);
    const frameRequests = requests.filter((r) => r.frame() !== page.mainFrame()).map((r) => r.url());
    expect(frameRequests, 'requests made by the frames').toEqual([]);
    page.off('request', onRequest);
  });

  test('markup and special characters are sent as plain text', { tag: ['@edge'], annotation: [tc('TC-IFR-008')] }, async ({ iframesPage: f, page }) => {
    await f.recordMessages();

    await test.step('Send a message containing markup, quotes and non-ASCII characters', () => f.send(MESSAGES.markup));

    await expect(f.counter).toHaveText(FRAME_COUNTER(1));
    expect(await f.messages(), 'the parent receives the exact text').toEqual([MESSAGES.markup]);
    await expect(f.messageInput).toHaveValue(MESSAGES.markup);
    for (const scope of [page, f.site, f.support]) await expect(scope.locator('#injected')).toHaveCount(0);
  });
});
