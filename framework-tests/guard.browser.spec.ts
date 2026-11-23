import { randomUUID } from 'node:crypto';
import type { Page } from '@playwright/test';
import { test, expect } from './support/local-app';
import { GuardViolationError } from '../core/guard/guard';

/**
 * Production Guard integration self-tests. Every test runs against a local
 * server; "real" third-party hosts are only ever addressed so the guard can
 * stop them. Where a request must not leave the browser, the test also
 * proves the local server never saw it.
 */

const unique = () => `/api/${randomUUID()}`;

/** Runs fetch() inside the page and reports success or the network error. */
async function pageFetch(page: Page, url: string, method = 'GET') {
  return page.evaluate(
    async ({ url, method }) => {
      try {
        const res = await fetch(url, { method, body: method === 'GET' ? null : '{}' });
        return { ok: true as const, status: res.status, text: await res.text() };
      } catch (e) {
        return { ok: false as const, error: String(e) };
      }
    },
    { url, method },
  );
}

test.describe('production policy (browser)', () => {
  test('GET to the app host is allowed', async ({ page, localApp }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'Guard self-test' })).toBeVisible();
    const path = unique();
    const result = await pageFetch(page, path);
    expect(result).toMatchObject({ ok: true, status: 200 });
    expect(localApp.hits).toContainEqual({ method: 'GET', path });
  });

  test('POST to the app host is blocked and never reaches the server', async ({ page, guard, localApp }) => {
    guard.expectBlocked('write-blocked');
    await page.goto('/');
    const path = unique();
    const result = await pageFetch(page, path, 'POST');
    expect(result.ok).toBe(false);
    expect(localApp.hits.some((h) => h.path === path)).toBe(false);
    expect(guard.events).toContainEqual(expect.objectContaining({ method: 'POST', outcome: 'blocked', category: 'write-blocked' }));
  });

  test('Supabase requests are blocked for every method', async ({ page, guard }) => {
    guard.expectBlocked('backend-blocked');
    await page.goto('/');
    for (const method of ['GET', 'POST']) {
      const result = await pageFetch(page, 'https://guard-selftest.supabase.co/auth/v1/signup', method);
      expect(result.ok, `${method} must not reach Supabase`).toBe(false);
    }
    const blocked = guard.events.filter((e) => e.category === 'backend-blocked' && e.outcome === 'blocked');
    expect(blocked.map((e) => e.method)).toEqual(['GET', 'POST']);
  });

  test('guard.mock() answers a Supabase sign-up without network access', async ({ page, guard }) => {
    guard.mock({ url: /\/auth\/v1\/signup/, method: 'POST', status: 200, json: { user: { id: 'mock-user' } } });
    await page.goto('/');
    const result = await pageFetch(page, 'https://guard-selftest.supabase.co/auth/v1/signup', 'POST');
    expect(result).toMatchObject({ ok: true, status: 200 });
    expect(result.ok && JSON.parse(result.text)).toEqual({ user: { id: 'mock-user' } });
    expect(guard.events).toContainEqual(expect.objectContaining({ outcome: 'mocked', method: 'POST' }));
  });

  test('unknown third-party hosts are blocked', async ({ page, guard }) => {
    await page.goto('/');
    const result = await pageFetch(page, 'https://unknown-host.invalid/pixel.png');
    expect(result.ok).toBe(false);
    expect(guard.events).toContainEqual(expect.objectContaining({ outcome: 'blocked', category: 'unknown-host' }));
  });

  test('analytics script is stubbed and the GA opt-out flag is set', async ({ page, guard }) => {
    await page.goto('/');
    const result = await pageFetch(page, 'https://www.googletagmanager.com/gtag/js?id=G-SELFTEST');
    expect(result).toMatchObject({ ok: true, status: 200 });
    expect(result.ok && result.text).toContain('stubbed by production guard');
    const optOut = await page.evaluate(() => (window as unknown as Record<string, unknown>)['ga-disable-G-SELFTEST']);
    expect(optOut).toBe(true);
    expect(guard.events).toContainEqual(expect.objectContaining({ outcome: 'stubbed', category: 'analytics-stubbed' }));
  });

  test('navigator.sendBeacon to analytics is intercepted by the guard', async ({ page, guard }) => {
    await page.goto('/');
    const queued = await page.evaluate(() => navigator.sendBeacon('https://www.google-analytics.com/g/collect?v=2', 'x'));
    expect(queued).toBe(true);
    await expect
      .poll(() => guard.events.some((e) => e.url.includes('google-analytics.com/g/collect')), { timeout: 5_000 })
      .toBe(true);
  });

  test('WebSocket to Supabase realtime is closed by the guard', async ({ page, guard }) => {
    await page.goto('/');
    const closed = await page.evaluate(
      () =>
        new Promise<{ code: number }>((resolve) => {
          const ws = new WebSocket('wss://guard-selftest.supabase.co/realtime/v1/websocket');
          ws.onclose = (e) => resolve({ code: e.code });
          ws.onerror = () => undefined;
        }),
    );
    expect(closed.code).not.toBe(1000);
    expect(guard.events).toContainEqual(expect.objectContaining({ channel: 'websocket', outcome: 'blocked' }));
  });

  // eslint-disable-next-line playwright/expect-expect -- the oracle is the guard's teardown failure (test.fail)
  test.fail('an unexpected write attempt fails the test at teardown', async ({ page }) => {
    // No expectBlocked(): the guard must turn the silent block into a failure.
    await page.goto('/');
    await pageFetch(page, unique(), 'POST');
  });
});

test.describe('production policy (APIRequestContext)', () => {
  test('GET through the request fixture is allowed', async ({ request, localApp }) => {
    const path = unique();
    const res = await request.get(path);
    expect(res.status()).toBe(200);
    expect(localApp.hits).toContainEqual({ method: 'GET', path });
  });

  test('POST through the request fixture throws and never reaches the server', async ({ request, localApp, guard }) => {
    guard.expectBlocked('write-blocked');
    const path = unique();
    await expect(request.post(path, { data: {} })).rejects.toThrow(GuardViolationError);
    await expect(request.fetch(path, { method: 'DELETE' })).rejects.toThrow(/blocked/);
    expect(localApp.hits.some((h) => h.path === path)).toBe(false);
  });

  test('request fixture cannot reach Supabase', async ({ request, guard }) => {
    guard.expectBlocked('backend-blocked');
    await expect(request.get('https://guard-selftest.supabase.co/rest/v1/bug_progress')).rejects.toThrow(GuardViolationError);
  });
});

test.describe('quality gates', () => {
  // eslint-disable-next-line playwright/expect-expect -- the oracle is the quality gate refusing to start (test.fail)
  test.fail('a @destructive test is refused in production', { tag: '@destructive' }, async () => {
    // qualityGates throws before the body runs.
  });
});

test.describe('ci policy in observe mode', () => {
  test.use({ policyEnv: 'ci', guardMode: 'observe' });

  test('unknown hosts are let through but flagged wouldBlock; Supabase stays blocked', async ({ page, guard }) => {
    guard.expectBlocked('backend-blocked');
    await page.goto('/');
    await pageFetch(page, 'https://unknown-host.invalid/pixel.png');
    const supabase = await pageFetch(page, 'https://guard-selftest.supabase.co/auth/v1/signup', 'POST');
    expect(supabase.ok).toBe(false);
    expect(guard.events).toContainEqual(expect.objectContaining({ category: 'unknown-host', outcome: 'allowed', wouldBlock: true }));
    expect(guard.events).toContainEqual(expect.objectContaining({ category: 'backend-blocked', outcome: 'blocked' }));
  });
});

test.describe('local policy', () => {
  test.use({ policyEnv: 'local', guardMode: 'enforce' });

  test('unknown hosts are recorded, not blocked', async ({ page, guard }) => {
    await page.goto('/');
    await pageFetch(page, 'https://unknown-host.invalid/pixel.png');
    expect(guard.events).toContainEqual(expect.objectContaining({ category: 'unknown-host', outcome: 'allowed' }));
  });

  test('POST to the app host is allowed outside production', async ({ page, localApp }) => {
    await page.goto('/');
    const path = unique();
    const result = await pageFetch(page, path, 'POST');
    expect(result).toMatchObject({ ok: true, status: 201 });
    expect(localApp.hits).toContainEqual({ method: 'POST', path });
  });
});
