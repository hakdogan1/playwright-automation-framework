import { writeFileSync } from 'node:fs';
import { test as base, expect, type TestInfo } from '@playwright/test';
import type { GuardMode, TestEnvironment } from '../config/env';
import { NetworkGuard, GuardViolationError } from '../guard/guard';
import { buildPolicy, type GuardPolicy } from '../guard/policy';
import { tcIdsOf } from './annotations';
import { collectEvidence, hasEvidence, redactEvidence } from './evidence';
import { redactUrl } from '../reporting/redact';

export interface CoreOptions {
  /** Resolved test environment. Defaults to the strictest one. */
  testEnv: TestEnvironment;
  /** Network policy. Without one, a production policy with no allowed hosts applies. */
  guardPolicy: GuardPolicy | undefined;
  guardMode: GuardMode;
  /** Analytics measurement IDs to opt out of (GA "ga-disable-<id>"). */
  analyticsIds: readonly string[];
  /** Fail tests that have no TC-ID annotation. */
  requireTcId: boolean;
  /** Fail a test when the app attempted a write the guard blocked and the test did not expect it. */
  guardFailOnWrite: boolean;
}

export interface CoreFixtures {
  guard: NetworkGuard;
  /** Auto fixture: TC-ID and destructive-test gates. */
  qualityGates: void;
  /** Auto fixture: contexts and API clients created inside a test get the guard too. */
  guardedFactories: void;
}

/** Evidence is written as files in the run's artifacts folder so it survives and is linked by run ID. */
async function attachFile(testInfo: TestInfo, name: string, body: string | Buffer, contentType: string): Promise<void> {
  const path = testInfo.outputPath(name);
  writeFileSync(path, body);
  await testInfo.attach(name, { path, contentType });
}

export const test = base.extend<CoreOptions & CoreFixtures>({
  testEnv: ['production', { option: true }],
  guardPolicy: [undefined, { option: true }],
  guardMode: ['enforce', { option: true }],
  analyticsIds: [[], { option: true }],
  requireTcId: [false, { option: true }],
  guardFailOnWrite: [true, { option: true }],

  guard: async ({ guardPolicy, guardMode, testEnv, baseURL, guardFailOnWrite }, use, testInfo) => {
    const policy = guardPolicy ?? buildPolicy({ env: 'production', appHosts: [] });
    if (policy.env !== testEnv) {
      throw new GuardViolationError(`Guard policy is for "${policy.env}" but testEnv is "${testEnv}".`);
    }
    const guard = new NetworkGuard(policy, guardMode, baseURL);
    await use(guard);

    if (guard.events.length > 0) {
      const report = { env: policy.env, mode: guardMode, events: guard.events.map((e) => ({ ...e, url: redactUrl(e.url) })) };
      await attachFile(testInfo, 'guard-report.json', JSON.stringify(report, null, 2), 'application/json');
    }
    // Checked here (not in `context`) so browser, API and WebSocket channels are treated alike.
    const writes = guard.unexpectedWrites();
    if (guardFailOnWrite && writes.length > 0) {
      const lines = writes.map((w) => `  ${w.channel} ${w.method} ${redactUrl(w.url)} (${w.outcome}, ${w.rule})`).join('\n');
      throw new GuardViolationError(`${writes.length} unexpected guarded request(s):\n${lines}\nUse guard.mock() or guard.expectBlocked() if this is intended.`);
    }
  },

  context: async ({ context, guard, analyticsIds, guardFailOnWrite }, use, testInfo) => {
    await guard.installOn(context, analyticsIds);
    const collector = collectEvidence(context);
    const evidence = collector.log;

    await use(context);

    const writes = guard.unexpectedWrites();
    const guardWillFail = guardFailOnWrite && writes.length > 0;
    const failed = testInfo.status !== testInfo.expectedStatus || guardWillFail;
    if (failed) collector.snapshotPending();
    if (failed && hasEvidence(evidence)) {
      await attachFile(testInfo, 'evidence.json', JSON.stringify(redactEvidence(evidence), null, 2), 'application/json');
    }
    if (guardWillFail) {
      // Playwright's own failure screenshot runs before this teardown, so capture one here.
      for (const [i, page] of context.pages().entries()) {
        const shot = await page.screenshot().catch(() => null);
        if (shot) await attachFile(testInfo, `guard-failure-${i + 1}.png`, shot, 'image/png');
      }
    }
  },

  request: async ({ request, guard }, use) => {
    await use(guard.wrapRequest(request));
  },

  guardedFactories: [
    async ({ browser, playwright, guard, analyticsIds }, use) => {
      const newContext = browser.newContext.bind(browser);
      const newPage = browser.newPage.bind(browser);
      const newApiContext = playwright.request.newContext.bind(playwright.request);
      browser.newContext = async (options) => {
        const ctx = await newContext({ ...options, serviceWorkers: 'block' });
        await guard.installOn(ctx, analyticsIds);
        return ctx;
      };
      browser.newPage = async (options) => {
        const ctx = await browser.newContext(options);
        const page = await ctx.newPage();
        // Like the original browser.newPage(): the page owns its context. Close it synchronously
        // with page.close(), so no half-closed context leaks into the next test.
        const closePage = page.close.bind(page);
        page.close = async (opts) => {
          await closePage(opts);
          await ctx.close();
        };
        return page;
      };
      playwright.request.newContext = async (options) => guard.wrapRequest(await newApiContext(options), options?.baseURL);
      try {
        await use();
      } finally {
        browser.newContext = newContext;
        browser.newPage = newPage;
        playwright.request.newContext = newApiContext;
      }
    },
    { auto: true },
  ],

  qualityGates: [
    async ({ testEnv, requireTcId }, use, testInfo) => {
      if (testEnv === 'production' && testInfo.tags.includes('@destructive')) {
        throw new GuardViolationError(`"${testInfo.title}" is tagged @destructive and cannot run against production.`);
      }
      if (requireTcId && tcIdsOf(testInfo.annotations).length === 0) {
        throw new Error(`[traceability] "${testInfo.title}" has no TC-ID. Add annotation: [tc('TC-XXX-001')].`);
      }
      await use();
    },
    { auto: true },
  ],
});

export { expect };
export { tc, bug } from './annotations';
