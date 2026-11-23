import type { TestEnvironment } from '../config/env';

/**
 * Data-driven network policy. `evaluateRequest` is a pure function so the
 * decision table can be unit-tested without a browser.
 *
 * The guard is a first line of defence for tests, not a network firewall.
 * See docs/production-guard.md for its limits.
 */
export type HttpMethod = 'GET' | 'HEAD' | 'OPTIONS' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
export const READ_METHODS: readonly string[] = ['GET', 'HEAD', 'OPTIONS'];

export type GuardAction = 'allow' | 'block' | 'stub';

export type ViolationCategory =
  | 'write-blocked'
  | 'unknown-host'
  | 'backend-blocked'
  | 'analytics-stubbed'
  /** A browser redirect hop to a host the policy does not allow. Detected, not prevented. */
  | 'redirect-escaped';

export interface StubResponse {
  status: number;
  contentType: string;
  body: string;
}

export interface GuardRule {
  name: string;
  /** Matches URL.host (host[:port]). A string is an exact host or a "*.suffix" wildcard. */
  host: string | RegExp;
  /** Methods the rule applies to. Omit for all methods. */
  methods?: readonly string[];
  path?: RegExp;
  action: GuardAction;
  category?: ViolationCategory;
  reason: string;
  stub?: StubResponse;
}

export interface GuardPolicy {
  env: TestEnvironment;
  /** Hosts the tests may talk to. Anything else is unknown. */
  allowedHosts: readonly string[];
  /** Explicit rules, evaluated in order before the defaults. */
  rules: readonly GuardRule[];
  /** Block unknown hosts (true) or only record them (false). */
  blockUnknownHosts: boolean;
  /** Block non-read methods to allowed hosts unless a rule allows them. */
  readOnly: boolean;
}

export interface RequestInfo {
  url: string;
  method: string;
}

export interface GuardDecision {
  action: GuardAction;
  rule: string;
  reason: string;
  category?: ViolationCategory;
  stub?: StubResponse;
}

export function hostMatches(pattern: string | RegExp, host: string): boolean {
  if (pattern instanceof RegExp) return pattern.test(host);
  if (pattern.startsWith('*.')) {
    const suffix = pattern.slice(1); // ".example.com"
    return host.endsWith(suffix) && host.length > suffix.length;
  }
  return host === pattern;
}

function parse(url: string): URL | null {
  try {
    return new URL(url);
  } catch {
    return null;
  }
}

export function evaluateRequest(policy: GuardPolicy, request: RequestInfo): GuardDecision {
  const method = request.method.toUpperCase();
  const url = parse(request.url);

  // data:, blob: and about: never leave the browser.
  if (!url || url.protocol === 'data:' || url.protocol === 'blob:' || url.protocol === 'about:') {
    return { action: 'allow', rule: 'local-scheme', reason: 'Non-network URL scheme.' };
  }

  for (const rule of policy.rules) {
    if (!hostMatches(rule.host, url.host)) continue;
    if (rule.methods && !rule.methods.includes(method)) continue;
    if (rule.path && !rule.path.test(url.pathname)) continue;
    return {
      action: rule.action,
      rule: rule.name,
      reason: rule.reason,
      ...(rule.category ? { category: rule.category } : {}),
      ...(rule.stub ? { stub: rule.stub } : {}),
    };
  }

  const known = policy.allowedHosts.some((h) => hostMatches(h, url.host));
  if (!known) {
    return {
      action: policy.blockUnknownHosts ? 'block' : 'allow',
      rule: 'default:unknown-host',
      reason: `Host "${url.host}" is not in the allowlist for ${policy.env}.`,
      category: 'unknown-host',
    };
  }

  if (policy.readOnly && !READ_METHODS.includes(method)) {
    return {
      action: 'block',
      rule: 'default:read-only',
      reason: `${method} is not allowed in the read-only ${policy.env} policy.`,
      category: 'write-blocked',
    };
  }

  return { action: 'allow', rule: 'default:allowed-host', reason: 'Allowed host.' };
}

/** Common building blocks used by app policies. */
export const SUPABASE_RULE: GuardRule = {
  name: 'supabase-backend',
  host: '*.supabase.co',
  action: 'block',
  category: 'backend-blocked',
  reason: 'Supabase is a real backend. Tests must use guard.mock() instead of reaching it.',
};

export const EMPTY_SCRIPT: StubResponse = { status: 200, contentType: 'application/javascript', body: '/* stubbed by production guard */' };
export const NO_CONTENT: StubResponse = { status: 204, contentType: 'text/plain', body: '' };

export const ANALYTICS_RULES: readonly GuardRule[] = [
  {
    name: 'analytics-script',
    host: 'www.googletagmanager.com',
    action: 'stub',
    category: 'analytics-stubbed',
    reason: 'Analytics script replaced with an empty script.',
    stub: EMPTY_SCRIPT,
  },
  {
    name: 'analytics-collect',
    host: /(^|\.)google-analytics\.com$|(^|\.)analytics\.google\.com$|^stats\.g\.doubleclick\.net$/,
    action: 'stub',
    category: 'analytics-stubbed',
    reason: 'Analytics hit dropped.',
    stub: NO_CONTENT,
  },
];

export interface PolicyInput {
  env: TestEnvironment;
  appHosts: readonly string[];
  extraRules?: readonly GuardRule[];
}

/**
 * Default policy per environment. Production and staging are strict;
 * local records unknown hosts but still never reaches real backends.
 */
export function buildPolicy({ env, appHosts, extraRules = [] }: PolicyInput): GuardPolicy {
  const strict = env === 'production' || env === 'staging' || env === 'ci';
  return {
    env,
    allowedHosts: appHosts,
    rules: [...extraRules, ...ANALYTICS_RULES, SUPABASE_RULE],
    blockUnknownHosts: strict,
    readOnly: env === 'production',
  };
}
