import { randomUUID } from 'node:crypto';
import { test, expect } from './support/local-app';
import { GuardViolationError } from '../core/guard/guard';

/**
 * P1-1 regression tests. Every "blocked" claim is proven on the server side:
 * the local server records each request it receives, so a blocked write must
 * leave no hit. `foreignApp` is a second local server whose host is NOT in the
 * allowlist, standing in for an external service.
 */
const unique = () => `/api/${randomUUID()}`;

test.describe('API request contexts other than the request fixture', () => {
  test('page.request is guarded', async ({ page, localApp, guard }) => {
    guard.expectBlocked('write-blocked');
    const path = unique();
    await expect(page.request.post(path, { data: {} })).rejects.toThrow(GuardViolationError);
    expect(localApp.hits.some((h) => h.path === path)).toBe(false);
  });

  test('context.request is guarded', async ({ context, localApp, guard }) => {
    guard.expectBlocked('write-blocked');
    const path = unique();
    await expect(context.request.delete(path)).rejects.toThrow(GuardViolationError);
    expect(localApp.hits.some((h) => h.path === path)).toBe(false);
  });

  test('page.request still allows reads', async ({ page, localApp }) => {
    const path = unique();
    const res = await page.request.get(path);
    expect(res.status()).toBe(200);
    expect(localApp.hits).toContainEqual({ method: 'GET', path });
  });

  test('playwright.request.newContext() is guarded', async ({ playwright, localApp, guard }) => {
    guard.expectBlocked('write-blocked');
    const path = unique();
    const api = await playwright.request.newContext({ baseURL: localApp.origin });
    await expect(api.post(path, { data: {} })).rejects.toThrow(GuardViolationError);
    await api.dispose();
    expect(localApp.hits.some((h) => h.path === path)).toBe(false);
  });
});

// eslint-disable-next-line playwright/expect-expect -- the oracle is the guard's teardown failure (test.fail)
test.fail('an undeclared blocked API write fails the test, even when the error is swallowed', async ({ request }) => {
  await request.post(unique(), { data: {} }).catch(() => undefined);
});

test.describe('browser contexts created inside a test', () => {
  test('browser.newContext() gets the guard', async ({ browser, localApp, guard }) => {
    guard.expectBlocked('write-blocked');
    const context = await browser.newContext({ baseURL: localApp.origin });
    const page = await context.newPage();
    await page.goto('/');
    const path = unique();
    const ok = await page.evaluate(async (p) => fetch(p, { method: 'POST', body: '{}' }).then(() => true, () => false), path);
    await context.close();
    expect(ok).toBe(false);
    expect(localApp.hits.some((h) => h.path === path)).toBe(false);
  });

  test('browser.newPage() gets the guard', async ({ browser, localApp, guard }) => {
    guard.expectBlocked('write-blocked');
    const page = await browser.newPage({ baseURL: localApp.origin });
    await page.goto('/');
    const path = unique();
    const ok = await page.evaluate(async (p) => fetch(p, { method: 'POST', body: '{}' }).then(() => true, () => false), path);
    await page.close();
    expect(ok).toBe(false);
    expect(localApp.hits.some((h) => h.path === path)).toBe(false);
  });
});

test.describe('redirects', () => {
  test('API redirect to a non-allowed host is stopped before the second hop', async ({ request, localApp, foreignApp, guard }) => {
    guard.expectBlocked('unknown-host');
    const target = `${foreignApp.origin}/api/${randomUUID()}`;
    const path = `/redirect/${randomUUID()}?to=${encodeURIComponent(target)}`;
    await expect(request.get(path)).rejects.toThrow(/redirect.*blocked|blocked/i);
    expect(localApp.hits.some((h) => h.path === path)).toBe(true);
    expect(foreignApp.hits.some((h) => target.endsWith(h.path))).toBe(false);
  });

  test('API redirect within the allowed host is followed', async ({ request, localApp }) => {
    const target = unique();
    const res = await request.get(`/redirect/${randomUUID()}?to=${encodeURIComponent(target)}`);
    expect(res.status()).toBe(200);
    expect(localApp.hits).toContainEqual({ method: 'GET', path: target });
  });

  // Known limit (documented in docs/production-guard.md): Chromium does not pass
  // redirect hops to route handlers, so the hop DOES reach the other host.
  // The guard detects it and fails the test; it cannot prevent it.
  test('browser redirect hop to a non-allowed host is detected (not prevented)', async ({ page, foreignApp, guard }) => {
    guard.expectBlocked('redirect-escaped');
    await page.goto('/');
    const target = `${foreignApp.origin}/api/${randomUUID()}`;
    await page.evaluate(async (url) => fetch(url).then(() => undefined, () => undefined), `/redirect/${randomUUID()}?to=${encodeURIComponent(target)}`);
    expect(foreignApp.hits.some((h) => target.endsWith(h.path)), 'limit: the hop reaches the network').toBe(true);
    await expect.poll(() => guard.events.some((e) => e.outcome === 'escaped' && e.category === 'redirect-escaped')).toBe(true);
  });

   
  test.fail('an undeclared escaped redirect fails the test at teardown', async ({ page, foreignApp }) => {
    await page.goto('/');
    const target = `${foreignApp.origin}/api/${randomUUID()}`;
    await page.evaluate(async (url) => fetch(url).then(() => undefined, () => undefined), `/redirect/${randomUUID()}?to=${encodeURIComponent(target)}`);
    await expect.poll(() => foreignApp.hits.some((h) => target.endsWith(h.path))).toBe(true);
  });
});

test.describe('default policy', () => {
  test.use({ guardPolicy: undefined });

  test('without a configured policy nothing is reachable', async ({ page, localApp }) => {
    const path = unique();
    await expect(page.goto(path)).rejects.toThrow();
    expect(localApp.hits.some((h) => h.path === path)).toBe(false);
  });
});
