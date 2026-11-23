import { test, expect } from '@playwright/test';
import { evaluateRequest, buildPolicy, hostMatches } from '../core/guard/policy';
import { NetworkGuard, GuardViolationError } from '../core/guard/guard';
import { resolveEnvironment, EnvironmentConfigError, type AppDefinition } from '../core/config/env';
import { tc, bug, tcIdsOf } from '../core/fixtures/annotations';

/** Pure unit tests: no browser, no network. */

const app: AppDefinition = {
  name: 'demo',
  productionHosts: ['app.example.com'],
  environments: {
    production: { baseURL: 'https://app.example.com' },
    local: { baseURL: 'http://127.0.0.1:4173' },
  },
};

test.describe('resolveEnvironment', () => {
  test('missing TEST_ENV falls back to production', () => {
    const env = resolveEnvironment(app, {});
    expect(env).toEqual({ env: 'production', baseURL: 'https://app.example.com', guardMode: 'enforce', defaulted: true });
  });

  test('invalid TEST_ENV is an explicit error', () => {
    expect(() => resolveEnvironment(app, { TEST_ENV: 'prod' })).toThrow(EnvironmentConfigError);
    expect(() => resolveEnvironment(app, { TEST_ENV: 'prod' })).toThrow(/TEST_ENV="prod" is not valid/);
  });

  test('non-production TEST_ENV with a production BASE_URL is refused', () => {
    expect(() => resolveEnvironment(app, { TEST_ENV: 'local', BASE_URL: 'https://app.example.com' })).toThrow(/production host/);
  });

  test('observe mode is refused for production', () => {
    expect(() => resolveEnvironment(app, { TEST_ENV: 'production', GUARD_MODE: 'observe' })).toThrow(/observe is not allowed/);
    expect(() => resolveEnvironment(app, { GUARD_MODE: 'observe' })).toThrow(/observe is not allowed/);
  });

  test('invalid GUARD_MODE and BASE_URL are explicit errors', () => {
    expect(() => resolveEnvironment(app, { TEST_ENV: 'local', GUARD_MODE: 'off' })).toThrow(/GUARD_MODE="off"/);
    expect(() => resolveEnvironment(app, { TEST_ENV: 'local', BASE_URL: 'not a url' })).toThrow(/not a valid absolute URL/);
    expect(() => resolveEnvironment(app, { TEST_ENV: 'local', BASE_URL: 'ftp://x.test' })).toThrow(/http or https/);
  });

  test('environment without a configured URL is an explicit error', () => {
    expect(() => resolveEnvironment(app, { TEST_ENV: 'staging' })).toThrow(/No BASE_URL/);
  });

  test('local environment resolves to its configured URL', () => {
    expect(resolveEnvironment(app, { TEST_ENV: 'local', GUARD_MODE: 'observe' })).toMatchObject({
      env: 'local',
      baseURL: 'http://127.0.0.1:4173',
      guardMode: 'observe',
      defaulted: false,
    });
  });
});

test.describe('evaluateRequest decision table', () => {
  const production = buildPolicy({ env: 'production', appHosts: ['app.example.com'] });
  const local = buildPolicy({ env: 'local', appHosts: ['127.0.0.1:4173'] });

  const cases: { policy: 'production' | 'local'; method: string; url: string; action: string; category?: string }[] = [
    { policy: 'production', method: 'GET', url: 'https://app.example.com/page', action: 'allow' },
    { policy: 'production', method: 'HEAD', url: 'https://app.example.com/', action: 'allow' },
    { policy: 'production', method: 'POST', url: 'https://app.example.com/api', action: 'block', category: 'write-blocked' },
    { policy: 'production', method: 'DELETE', url: 'https://app.example.com/api/1', action: 'block', category: 'write-blocked' },
    { policy: 'production', method: 'GET', url: 'https://xyz.supabase.co/rest/v1/t', action: 'block', category: 'backend-blocked' },
    { policy: 'production', method: 'POST', url: 'https://xyz.supabase.co/auth/v1/signup', action: 'block', category: 'backend-blocked' },
    { policy: 'production', method: 'GET', url: 'https://cdn.unknown.test/a.js', action: 'block', category: 'unknown-host' },
    { policy: 'production', method: 'GET', url: 'https://www.googletagmanager.com/gtag/js', action: 'stub', category: 'analytics-stubbed' },
    { policy: 'production', method: 'POST', url: 'https://region1.google-analytics.com/g/collect', action: 'stub', category: 'analytics-stubbed' },
    { policy: 'production', method: 'GET', url: 'data:image/png;base64,AAAA', action: 'allow' },
    { policy: 'local', method: 'POST', url: 'http://127.0.0.1:4173/api', action: 'allow' },
    { policy: 'local', method: 'GET', url: 'https://cdn.unknown.test/a.js', action: 'allow', category: 'unknown-host' },
    { policy: 'local', method: 'POST', url: 'https://xyz.supabase.co/auth/v1/signup', action: 'block', category: 'backend-blocked' },
  ];

  for (const c of cases) {
    test(`${c.policy}: ${c.method} ${c.url} → ${c.action}`, () => {
      const decision = evaluateRequest(c.policy === 'production' ? production : local, { method: c.method, url: c.url });
      expect(decision.action).toBe(c.action);
      expect(decision.category).toBe(c.category);
    });
  }

  test('supabase look-alike hosts are not treated as Supabase', () => {
    expect(hostMatches('*.supabase.co', 'supabase.co')).toBe(false);
    expect(hostMatches('*.supabase.co', 'evil-supabase.co')).toBe(false);
    expect(hostMatches('*.supabase.co', 'abc.supabase.co')).toBe(true);
  });

  test('explicit rules win over defaults (first match)', () => {
    const policy = buildPolicy({
      env: 'production',
      appHosts: ['app.example.com'],
      extraRules: [{ name: 'sandbox-api', host: 'api.example.com', methods: ['POST'], action: 'allow', reason: 'Sandbox API.' }],
    });
    expect(evaluateRequest(policy, { method: 'POST', url: 'https://api.example.com/v1/x' }).action).toBe('allow');
    expect(evaluateRequest(policy, { method: 'DELETE', url: 'https://api.example.com/v1/x' }).category).toBe('unknown-host');
  });

  test('NetworkGuard refuses observe mode with a production policy', () => {
    expect(() => new NetworkGuard(production, 'observe', undefined)).toThrow(GuardViolationError);
  });
});

test.describe('traceability annotations', () => {
  test('tc() accepts valid IDs and rejects invalid ones', () => {
    expect(tc('TC-BTN-001')).toEqual({ type: 'tc', description: 'TC-BTN-001' });
    for (const bad of ['TC-BTN-1', 'tc-btn-001', 'TC-B-001', 'BTN-001', 'TC-BTN-0001']) {
      expect(() => tc(bad), bad).toThrow(/Invalid TC-ID/);
    }
  });

  test('bug() accepts GitHub, Jira and slug references', () => {
    expect(bug('#12').description).toBe('#12');
    expect(bug('QA-42').description).toBe('QA-42');
    expect(bug('BUG-cart-total').description).toBe('BUG-cart-total');
    expect(() => bug('cart total')).toThrow(/Invalid bug reference/);
  });

  test('tcIdsOf extracts only TC annotations', () => {
    expect(tcIdsOf([tc('TC-BTN-001'), bug('#1'), { type: 'issue' }])).toEqual(['TC-BTN-001']);
  });
});
