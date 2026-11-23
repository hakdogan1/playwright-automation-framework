import type { APIRequestContext, APIResponse, BrowserContext, Request, Route, WebSocketRoute } from '@playwright/test';
import type { GuardMode } from '../config/env';
import { evaluateRequest, READ_METHODS, type GuardDecision, type GuardPolicy, type ViolationCategory } from './policy';

export class GuardViolationError extends Error {
  constructor(message: string) {
    super(`[guard] ${message}`);
    this.name = 'GuardViolationError';
  }
}

export interface GuardEvent {
  at: string;
  channel: 'browser' | 'api' | 'websocket';
  method: string;
  url: string;
  resourceType?: string;
  /**
   * What actually happened. `escaped` means the request reached the network
   * although the policy does not allow it (browser redirect hops are not routed).
   */
  outcome: 'allowed' | 'blocked' | 'stubbed' | 'mocked' | 'escaped';
  /** True when observe mode let through a request the policy would block. */
  wouldBlock?: boolean;
  rule: string;
  reason: string;
  category?: ViolationCategory | 'mocked';
}

export interface GuardMock {
  /** Matched against the full request URL. */
  url: RegExp;
  method?: string;
  status?: number;
  json?: unknown;
  body?: string;
  contentType?: string;
  headers?: Record<string, string>;
}

/** Categories that observe mode may relax. Real backends are never relaxed. */
const RELAXABLE: ReadonlySet<ViolationCategory> = new Set(['unknown-host', 'write-blocked']);

const API_METHODS = ['fetch', 'get', 'head', 'post', 'put', 'patch', 'delete'] as const;
type ApiMethod = (typeof API_METHODS)[number];
const REDIRECT_STATUSES = new Set([301, 302, 303, 307, 308]);
const DEFAULT_MAX_REDIRECTS = 20;

/** Contexts and request proxies already guarded, so double installation is a no-op. */
const guardedContexts = new WeakSet<BrowserContext>();
const guardedRequests = new WeakSet<object>();

type FetchOptions = NonNullable<Parameters<APIRequestContext['fetch']>[1]>;

/**
 * Applies a GuardPolicy to a BrowserContext (routes, WebSockets, redirect
 * detection) and to APIRequestContext instances (method proxy with
 * hop-by-hop redirect checks). Records every decision for the report.
 */
export class NetworkGuard {
  readonly events: GuardEvent[] = [];
  private readonly mocks: GuardMock[] = [];
  private readonly expected = new Set<ViolationCategory>();
  private readonly routedRequests = new WeakSet<Request>();

  constructor(
    readonly policy: GuardPolicy,
    readonly mode: GuardMode,
    private readonly baseURL: string | undefined,
  ) {
    if (policy.env === 'production' && mode !== 'enforce') {
      throw new GuardViolationError('Observe mode cannot be used with a production policy.');
    }
  }

  /** Register a canned response. Mocks only ever fulfill, they never reach the network. */
  mock(mock: GuardMock): void {
    this.mocks.push(mock);
  }

  /** Declare that the test intentionally triggers violations of this category. */
  expectBlocked(category: ViolationCategory): void {
    this.expected.add(category);
  }

  isExpected(category: ViolationCategory): boolean {
    return this.expected.has(category);
  }

  /** Blocked write attempts and escaped redirect hops the test did not declare. */
  unexpectedWrites(): GuardEvent[] {
    return this.events.filter((e) => {
      if (!e.category || e.category === 'mocked' || e.category === 'analytics-stubbed' || this.expected.has(e.category)) return false;
      if (e.outcome === 'escaped') return true;
      return (e.outcome === 'blocked' || e.wouldBlock === true) && !READ_METHODS.includes(e.method);
    });
  }

  decide(url: string, method: string): { decision: GuardDecision; enforced: GuardDecision['action'] } {
    const decision = evaluateRequest(this.policy, { url, method });
    let enforced = decision.action;
    if (this.mode === 'observe' && decision.action === 'block' && decision.category && RELAXABLE.has(decision.category)) {
      enforced = 'allow';
    }
    return { decision, enforced };
  }

  private record(event: Omit<GuardEvent, 'at'>): void {
    this.events.push({ at: new Date().toISOString(), ...event });
  }

  async installOn(context: BrowserContext, analyticsIds: readonly string[]): Promise<void> {
    if (guardedContexts.has(context)) return;
    guardedContexts.add(context);
    if (analyticsIds.length > 0) {
      // GA's documented opt-out flag: gtag stops sending hits for these IDs.
      await context.addInitScript((ids: string[]) => {
        const w = window as unknown as Record<string, unknown>;
        for (const id of ids) w[`ga-disable-${id}`] = true;
      }, [...analyticsIds]);
    }
    await context.route('**/*', (route) => this.handleRoute(route));
    await context.routeWebSocket(/.*/, (ws) => this.handleWebSocket(ws));
    // Redirect hops are not passed to route handlers (observed in Chromium 1.65).
    // They cannot be stopped here, only detected: record any hop that reached
    // the network although the policy does not allow it.
    const onNetwork = (request: Request, reachedNetwork: boolean) => {
      if (!reachedNetwork || !request.redirectedFrom() || this.routedRequests.has(request)) return;
      const { decision, enforced } = this.decide(request.url(), request.method());
      if (enforced === 'allow') return;
      this.record({
        channel: 'browser',
        method: request.method(),
        url: request.url(),
        resourceType: request.resourceType(),
        outcome: 'escaped',
        rule: decision.rule,
        reason: `Redirect hop bypassed routing. ${decision.reason}`,
        category: 'redirect-escaped',
      });
    };
    context.on('response', (response) => onNetwork(response.request(), true));
    context.on('requestfailed', (request) => onNetwork(request, !(request.failure()?.errorText ?? '').includes('ERR_BLOCKED_BY_CLIENT')));
    // Every context created through the guard gets a guarded API client too.
    (context as { request: APIRequestContext }).request = this.wrapRequest(context.request, this.baseURL);
  }

  private async handleRoute(route: Route): Promise<void> {
    const request = route.request();
    this.routedRequests.add(request);
    const url = request.url();
    const method = request.method();

    const mock = this.mocks.find((m) => m.url.test(url) && (!m.method || m.method.toUpperCase() === method));
    if (mock) {
      this.record({ channel: 'browser', method, url, resourceType: request.resourceType(), outcome: 'mocked', rule: 'guard.mock', reason: 'Canned response.', category: 'mocked' });
      await route.fulfill({
        status: mock.status ?? 200,
        ...(mock.headers ? { headers: mock.headers } : {}),
        ...(mock.json !== undefined ? { json: mock.json } : { body: mock.body ?? '', contentType: mock.contentType ?? 'text/plain' }),
      });
      return;
    }

    const { decision, enforced } = this.decide(url, method);
    const base = { channel: 'browser' as const, method, url, resourceType: request.resourceType(), rule: decision.rule, reason: decision.reason, ...(decision.category ? { category: decision.category } : {}) };

    if (enforced === 'stub' && decision.stub) {
      this.record({ ...base, outcome: 'stubbed' });
      await route.fulfill({ status: decision.stub.status, contentType: decision.stub.contentType, body: decision.stub.body });
      return;
    }
    if (enforced === 'block') {
      this.record({ ...base, outcome: 'blocked' });
      await route.abort('blockedbyclient');
      return;
    }
    if (decision.action === 'block' || decision.category) {
      this.record({ ...base, outcome: 'allowed', ...(decision.action === 'block' ? { wouldBlock: true } : {}) });
    }
    await route.fallback();
  }

  private handleWebSocket(ws: WebSocketRoute): void {
    const url = ws.url();
    const { decision, enforced } = this.decide(url, 'GET');
    const base = { channel: 'websocket' as const, method: 'GET', url, rule: decision.rule, reason: decision.reason, ...(decision.category ? { category: decision.category } : {}) };
    if (enforced !== 'allow') {
      this.record({ ...base, outcome: 'blocked' });
      void ws.close({ code: 1008, reason: 'Blocked by production guard' });
      return;
    }
    if (decision.category) this.record({ ...base, outcome: 'allowed' });
    ws.connectToServer();
  }

  /** Throws GuardViolationError when the policy does not allow this API call. */
  private checkApi(url: string, method: string, hop: number): void {
    const { decision, enforced } = this.decide(url, method);
    const base = { channel: 'api' as const, method, url, rule: decision.rule, reason: decision.reason, ...(decision.category ? { category: decision.category } : {}) };
    if (enforced !== 'allow') {
      this.record({ ...base, outcome: 'blocked' });
      const where = hop > 0 ? `redirect hop ${hop} to ` : '';
      throw new GuardViolationError(`${method} ${where}${url} blocked: ${decision.reason} (rule ${decision.rule})`);
    }
    if (decision.category) this.record({ ...base, outcome: 'allowed', ...(decision.action === 'block' ? { wouldBlock: true } : {}) });
  }

  /**
   * Returns a proxy that applies the policy before every APIRequestContext
   * call. Redirects are followed manually so every hop is checked; an explicit
   * `maxRedirects` option is respected as the hop limit.
   */
  wrapRequest(request: APIRequestContext, baseURL: string | undefined = this.baseURL): APIRequestContext {
    if (guardedRequests.has(request)) return request;
    const resolve = (u: string, against?: string) => new URL(u, against ?? baseURL ?? 'http://invalid.local').toString();

    const call = async (target: APIRequestContext, name: ApiMethod, urlOrRequest: unknown, options?: FetchOptions): Promise<APIResponse> => {
      if (typeof urlOrRequest !== 'string') {
        // A Request object (e.g. from a route): check the first hop and disable redirects.
        const req = urlOrRequest as Request;
        this.checkApi(req.url(), req.method(), 0);
        return target.fetch(req, { ...options, maxRedirects: 0 });
      }
      let method = name === 'fetch' ? (options?.method ?? 'GET').toUpperCase() : name.toUpperCase();
      let url = resolve(urlOrRequest);
      const limit = options?.maxRedirects ?? DEFAULT_MAX_REDIRECTS;
      let opts: FetchOptions = { ...options, maxRedirects: 0 };
      for (let hop = 0; ; hop++) {
        this.checkApi(url, method, hop);
        const response = await target.fetch(url, { ...opts, method });
        const location = response.headers()['location'];
        if (!REDIRECT_STATUSES.has(response.status()) || !location || hop >= limit) return response;
        const status = response.status();
        await response.dispose();
        url = resolve(location, url);
        // Query params were already applied to the first URL; the Location header is final.
        opts = { ...opts };
        delete opts.params;
        if (status === 303 || ((status === 301 || status === 302) && method === 'POST')) {
          // Same method rewrite browsers apply; the body is dropped.
          method = 'GET';
          delete opts.data;
          delete opts.form;
          delete opts.multipart;
        }
      }
    };

    const proxy = new Proxy(request, {
      get: (target, prop, receiver) => {
        if (typeof prop === 'string' && (API_METHODS as readonly string[]).includes(prop)) {
          return (urlOrRequest: unknown, options?: FetchOptions) => call(target, prop as ApiMethod, urlOrRequest, options);
        }
        const value: unknown = Reflect.get(target, prop, receiver);
        return typeof value === 'function' ? (value as (...args: unknown[]) => unknown).bind(target) : value;
      },
    });
    guardedRequests.add(proxy);
    return proxy;
  }
}
