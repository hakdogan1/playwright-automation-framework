import type { Frame, FrameLocator, Locator, Page } from '@playwright/test';
import { FRAMES, SUPPORT_FORM } from '../data/iframes.data';
import { moduleHeading, openModule } from '../support/module';

/**
 * /ui-elements/iframes/ — an embedded demo site and a support form, both inline `srcdoc` frames.
 * The support form posts a message to the parent window, which counts the submissions.
 * Elements inside a frame are reached only through its frame locator (never from `page`).
 */
export class IframesPage {
  static readonly path = '/ui-elements/iframes/';
  readonly heading: Locator;
  readonly shell: Locator;
  readonly siteFrameElement: Locator;
  readonly supportFrameElement: Locator;
  readonly site: FrameLocator;
  readonly support: FrameLocator;
  /** "Nested frame submissions received by parent: <n>" (in the parent document). */
  readonly counter: Locator;
  readonly messageInput: Locator;
  readonly sendButton: Locator;

  constructor(private readonly page: Page) {
    this.heading = moduleHeading(page, 'Iframes');
    this.shell = page.getByTestId('iframe-lab-shell');
    this.siteFrameElement = this.shell.getByTestId(FRAMES.site.testId);
    this.supportFrameElement = this.shell.getByTestId(FRAMES.support.testId);
    this.site = this.siteFrameElement.contentFrame();
    this.support = this.supportFrameElement.contentFrame();
    this.counter = this.shell.getByTestId('frame-counter');
    this.messageInput = this.support.getByLabel(SUPPORT_FORM.label, { exact: true });
    this.sendButton = this.support.getByRole('button', { name: SUPPORT_FORM.send, exact: true });
  }

  async send(message: string): Promise<void> {
    await this.messageInput.fill(message);
    await this.sendButton.click();
  }

  /** The Playwright Frame of a frame element (for URL and frame-tree checks). */
  async frameOf(element: Locator): Promise<Frame> {
    const frame = await (await element.elementHandle())?.contentFrame();
    if (!frame) throw new Error('the element has no content frame');
    return frame;
  }

  /**
   * Records the submit messages the parent window receives (observation only: a second listener,
   * the app's own listener is untouched). Message events from one frame arrive in order, so once
   * a later message is seen, every earlier one has been seen too.
   */
  async recordMessages(): Promise<void> {
    await this.page.evaluate((source) => {
      const w = window as unknown as { __pqfFrameMessages?: unknown[] };
      w.__pqfFrameMessages = [];
      window.addEventListener('message', (e: MessageEvent<{ source?: unknown; value?: unknown }>) => {
        if (e.data?.source === source) w.__pqfFrameMessages?.push(e.data.value);
      });
    }, 'validation-lab/frame-submit');
  }

  async messages(): Promise<unknown[]> {
    return this.page.evaluate(() => (window as unknown as { __pqfFrameMessages?: unknown[] }).__pqfFrameMessages ?? []);
  }

  async goto(): Promise<void> {
    await openModule(this.page, { path: IframesPage.path, heading: this.heading, ready: this.counter });
  }
}
